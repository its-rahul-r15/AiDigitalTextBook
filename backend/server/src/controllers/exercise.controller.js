// ─── exercise.controller.js ──────────────────────────────────────────────────
// Handles exercise generation (AI dummy), submission, hints, and history.
//
// ⚠️  AI INTEGRATION NOTE for /generate:
// Question generation calls questionGen.service.js which currently returns a dummy question.
// Follow the LangChain steps in questionGen.service.js to get real AI-generated questions.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import Exercise from "../models/Exercise.model.js";
import AttemptLog from "../models/AttemptLog.model.js";
import SkillProfile from "../models/SkillProfile.model.js";
import Concept from "../models/concept.model.js";
import * as questionGenService from "../services/questionGen.service.js";
import * as gamificationService from "../services/gamification.service.js";
import { paginate } from "../utils/paginate.util.js";

// ─── @desc   AI-generate a question for a concept (currently DUMMY)
// ─── @route  GET /api/v1/exercises/generate?conceptId=&difficulty=&type=
// ─── @access Student
export const generateQuestion = asyncHandler(async (req, res) => {
    const { conceptId, difficulty = 3, type = "mcq" } = req.query;

    const exercise = await questionGenService.generateQuestion({
        conceptId,
        difficulty: difficulty,
        type,
        userId: req.user._id,
    });

    return res.status(200).json(new ApiResponse(200, exercise, "Question generated (DUMMY — connect AI to get real questions)"));
});

// ─── @desc   Get a specific exercise by ID
// ─── @route  GET /api/v1/exercises/:id
// ─── @access Student
export const getExerciseById = asyncHandler(async (req, res) => {
    const exercise = await Exercise.findById(req.params.id).lean();
    if (!exercise) throw new ApiError(404, "Exercise not found");
    return res.status(200).json(new ApiResponse(200, exercise, "Exercise fetched successfully"));
});

// ─── @desc   Submit an answer and receive feedback
// ─── @route  POST /api/v1/exercises/submit
// ─── @access Student
// ─── AI INTEGRATION NOTE:
//     For "open" type questions, we currently just accept any answer as correct.
//     TO ADD AI GRADING: Send student's answer + expected answer to GPT-4o with:
//     "Grade this student answer on a scale of 0-100: Answer: {answer}, Expected: {solution}"
export const submitAnswer = asyncHandler(async (req, res) => {
    const { exerciseId, answer, timeTaken, mode = "learning" } = req.body;

    const exercise = await Exercise.findById(exerciseId).lean();
    if (!exercise) throw new ApiError(404, "Exercise not found");

    // Determine if the answer is correct
    let isCorrect = false;
    let score = 0;

    if (exercise.type === "mcq" || exercise.type === "fill-blank") {
        isCorrect = answer?.trim()?.toLowerCase() === exercise.solution?.trim()?.toLowerCase();
        score = isCorrect ? 100 : 0;
    } else if (exercise.type === "step-based") {
        const correctSteps = (answer || []).filter((a, i) =>
            a?.trim()?.toLowerCase() === exercise.steps[i]?.expectedAnswer?.trim()?.toLowerCase()
        ).length;
        score = Math.round((correctSteps / (exercise.steps.length || 1)) * 100);
        isCorrect = score >= 60;
    } else {
        // "open" type: AI grading goes here later
        isCorrect = true;
        score = 70;
    }

    // Save the attempt log (immutable record)
    const attempt = await AttemptLog.create({
        userId: req.user._id,
        exerciseId,
        conceptId: exercise.conceptId,
        answer,
        isCorrect,
        score,
        timeTaken,
        hintsUsed: req.body.hintsUsed || 0,
        retriesCount: req.body.retriesCount || 0,
        mode,
    });

    // ── Update SkillProfile directly (no Bull queue needed) ───────────────────
    // Get the concept to find its skill tags
    const concept = await Concept.findById(exercise.conceptId).select("skillTags").lean();
    const skillTags = concept?.skillTags || [];

    if (skillTags.length > 0) {
        // Find or create the skill profile
        let profile = await SkillProfile.findOne({ userId: req.user._id });
        if (!profile) {
            profile = await SkillProfile.create({ userId: req.user._id, skills: {} });
        }

        for (const tag of skillTags) {
            const existing = profile.skills.get(tag) || {
                masteryScore: 0.3,
                attempts: 0,
                trend: "stable",
                lastPracticed: null,
            };

            const prevScore = existing.masteryScore;
            const attempts = (existing.attempts || 0) + 1;

            // Simple IRT-lite: correct → push mastery up, wrong → pull down
            // Learning rate decreases as attempts grow (more stable at higher counts)
            const learningRate = Math.max(0.05, 0.25 / Math.sqrt(attempts));
            let newScore = isCorrect
                ? Math.min(1, prevScore + learningRate * (1 - prevScore))
                : Math.max(0, prevScore - learningRate * prevScore);

            // Determine trend
            const diff = newScore - prevScore;
            const trend = diff > 0.02 ? "improving" : diff < -0.02 ? "declining" : "stable";

            profile.skills.set(tag, {
                masteryScore: Math.round(newScore * 1000) / 1000,
                attempts,
                lastPracticed: new Date(),
                trend,
            });
        }

        // Recalculate overall mastery as weighted average
        const allScores = [];
        for (const [, data] of profile.skills.entries()) {
            allScores.push(data.masteryScore);
        }
        profile.overallMastery = allScores.length
            ? allScores.reduce((a, b) => a + b, 0) / allScores.length
            : 0;

        await profile.save();
    }

    // Award XP for correct answers
    if (isCorrect) {
        await gamificationService.awardXP(req.user._id, { isCorrect, score, isStreak: false });
    }

    return res.status(200).json(
        new ApiResponse(200, { isCorrect, score, attempt }, isCorrect ? "Correct! Well done!" : "Not quite right. Try again!")
    );
});


// ─── @desc   Request a contextual hint for the current step
// ─── @route  POST /api/v1/exercises/hint
// ─── @access Student
// ─── AI INTEGRATION NOTE:
//     Currently returns the pre-written hint from the exercise.steps[].hint field.
//     TO ADD AI HINTS: If no hint is available, call GPT-4o with:
//     "Give a helpful hint (not the answer) for this exercise: {exercise.question}"
export const getHint = asyncHandler(async (req, res) => {
    const { exerciseId, stepNumber = 0 } = req.body;

    const exercise = await Exercise.findById(exerciseId).lean();
    if (!exercise) throw new ApiError(404, "Exercise not found");

    let hint = null;

    if (exercise.type === "step-based" && exercise.steps[stepNumber]) {
        hint = exercise.steps[stepNumber].hint;
    }

    // Fallback dummy hint when no hint is stored in the exercise
    // TO ADD AI HINTS: Replace the line below with a GPT-4o hint generation call
    if (!hint) hint = "[DUMMY HINT] Think about the core concept. Connect GPT-4o for smart hints.";

    return res.status(200).json(new ApiResponse(200, { hint }, "Hint provided"));
});

// ─── @desc   Get all attempts for a concept (student history)
// ─── @route  GET /api/v1/exercises/history?conceptId=&cursor=&limit=
// ─── @access Student
export const getAttemptHistory = asyncHandler(async (req, res) => {
    const { conceptId, cursor, limit = 20 } = req.query;

    const filter = { userId: req.user._id };
    if (conceptId) filter.conceptId = conceptId;

    const { data, nextCursor, hasMore } = await paginate(AttemptLog, filter, cursor, parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, { attempts: data, nextCursor, hasMore }, "Attempt history fetched")
    );
});

// ─── @desc   Teacher generates a batch of questions for a concept
// ─── @route  POST /api/v1/exercises/batch-generate
// ─── @access Teacher
export const batchGenerateQuestions = asyncHandler(async (req, res) => {
    const { conceptId, count = 5, difficulty = 3, type = "mcq" } = req.body;
    if (!conceptId) throw new ApiError(400, "conceptId is required");

    // Generate 'count' questions — currently all DUMMY
    const promises = Array.from({ length: count }, () =>
        questionGenService.generateQuestion({ conceptId, difficulty, type, userId: req.user._id })
    );

    const exercises = await Promise.all(promises);

    return res.status(201).json(
        new ApiResponse(201, exercises, `${count} questions generated (DUMMY — connect AI for real questions)`)
    );
});

// ─── @desc   Generate a chapter quiz (5 MCQ from chapter content via AI)
// ─── @route  POST /api/v1/exercises/chapter-quiz/generate
// ─── @access Student
export const generateChapterQuiz = asyncHandler(async (req, res) => {
    const { chapterId } = req.body;
    if (!chapterId) throw new ApiError(400, "chapterId is required");

    const chapterQuizService = await import("../services/chapterQuiz.service.js");
    const exercises = await chapterQuizService.generateChapterQuiz({
        chapterId,
        userId: req.user._id,
        count: 5,
    });

    return res.status(200).json(
        new ApiResponse(200, exercises, "Chapter quiz generated successfully")
    );
});

// ─── @desc   Submit chapter quiz answers and get score
// ─── @route  POST /api/v1/exercises/chapter-quiz/submit
// ─── @access Student
export const submitChapterQuiz = asyncHandler(async (req, res) => {
    const { chapterId, answers } = req.body;
    // answers = [{ exerciseId, answer }]

    if (!chapterId) throw new ApiError(400, "chapterId is required");
    if (!Array.isArray(answers) || answers.length === 0) {
        throw new ApiError(400, "answers array is required");
    }

    let correctCount = 0;
    const results = [];

    for (const { exerciseId, answer } of answers) {
        const exercise = await Exercise.findById(exerciseId).lean();
        if (!exercise) continue;

        const isCorrect = answer?.trim()?.toLowerCase() === exercise.solution?.trim()?.toLowerCase();
        if (isCorrect) correctCount++;

        results.push({
            exerciseId,
            question: exercise.question,
            yourAnswer: answer,
            correctAnswer: exercise.solution,
            isCorrect,
        });

        // Log the attempt
        await AttemptLog.create({
            userId: req.user._id,
            exerciseId,
            conceptId: exercise.conceptId,
            answer,
            isCorrect,
            score: isCorrect ? 100 : 0,
            timeTaken: 0,
            mode: "exam",
        });
    }

    const totalQuestions = results.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = scorePercent >= 70;

    // Save best score to UserProgress
    const UserProgress = (await import("../models/UserProgress.model.js")).default;
    const progress = await UserProgress.findOne({ userId: req.user._id });

    if (progress) {
        const currentBest = progress.chapterQuizScores?.get(chapterId) || 0;
        if (scorePercent > currentBest) {
            progress.chapterQuizScores.set(chapterId, scorePercent);
        }
        // If passed, also mark chapter as completed
        if (passed && !progress.completedChapters.includes(chapterId)) {
            progress.completedChapters.push(chapterId);
        }
        await progress.save();
    } else {
        const scoreMap = {};
        scoreMap[chapterId] = scorePercent;
        await UserProgress.create({
            userId: req.user._id,
            chapterQuizScores: scoreMap,
            completedChapters: passed ? [chapterId] : [],
        });
    }

    return res.status(200).json(
        new ApiResponse(200, {
            score: scorePercent,
            passed,
            correctCount,
            totalQuestions,
            results,
        }, passed ? "🎉 Congratulations! You passed the chapter quiz!" : "You need 70% to pass. Read the chapter again and try!")
    );
});

