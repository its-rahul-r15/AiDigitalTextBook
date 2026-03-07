// ─── practice.controller.js ──────────────────────────────────────────────────
// Handles teacher-created practice sets:
//   Teacher: create (manual OR AI-generated), list, toggle, delete, analytics
//   Student: list assigned, submit answers, view own result

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import PracticeSet from "../models/PracticeSet.model.js";
import PracticeAttempt from "../models/PracticeAttempt.model.js";
import ClassRoom from "../models/ClassRoom.model.js";
import Chapter from "../models/Chapter.model.js";
import { generateContent } from "../config/gemini.js";
import logger from "../utils/logger.util.js";

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── @desc   Create a practice set (manual OR AI-generated)
// ─── @route  POST /api/v1/practice
// ─── @access Teacher
//
// MANUAL mode body: { title, description?, questions: [...], generationMode: "manual" }
// AI mode body:     { title, description?, generationMode: "ai", chapterId?, topic?, questionCount? }
export const createPracticeSet = asyncHandler(async (req, res) => {
    const { title, description, generationMode = "manual", questions, chapterId, topic, questionCount = 5 } = req.body;

    if (!title?.trim()) throw new ApiError(400, "Title is required");

    // Find teacher's classroom
    const classroom = await ClassRoom.findOne({ teacherId: req.user._id });
    if (!classroom) throw new ApiError(404, "No classroom found. Create one first.");

    let finalQuestions = [];

    if (generationMode === "ai") {
        // ── AI Generation ────────────────────────────────────────────────
        const count = Math.min(Math.max(parseInt(questionCount) || 5, 1), 20);
        let contextText = "";

        if (chapterId) {
            const chapter = await Chapter.findById(chapterId).lean();
            if (!chapter) throw new ApiError(404, "Chapter not found");

            const textParts = [`Chapter: ${chapter.title}`];
            if (chapter.description) textParts.push(chapter.description);
            const sections = (chapter.contentSections || []).sort(
                (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
            );
            for (const section of sections) {
                if (section.type === "text" && section.body) textParts.push(section.body);
                if (section.caption) textParts.push(`[${section.type}]: ${section.caption}`);
            }
            contextText = textParts.join("\n\n");
        } else if (topic?.trim()) {
            contextText = `Topic: ${topic.trim()}`;
        } else {
            throw new ApiError(400, "AI mode requires either a chapterId or a topic");
        }

        if (contextText.length > 3000) contextText = contextText.substring(0, 3000) + "...";

        const prompt = `You are an expert teacher creating a quiz. Generate exactly ${count} MCQ questions from this content. Each question must have 4 options and exactly 1 correct answer. Keep questions and options concise (under 20 words each).

Content:
${contextText}

Return ONLY a valid JSON array, no markdown, no explanation:
[{"questionText":"question here?","options":["A","B","C","D"],"correctAnswer":"exact correct option text","marks":1}]`;

        try {
            logger.info("AI generating practice questions", { chapterId, topic, count });
            const aiResponse = await generateContent(prompt, 3000);

            if (aiResponse) {
                let jsonText = aiResponse.replace(/```(json)?/gi, "").trim();
                try {
                    const parsed = JSON.parse(jsonText);
                    if (Array.isArray(parsed)) {
                        finalQuestions = parsed.filter(
                            (q) => q.questionText && Array.isArray(q.options) && q.options.length >= 2 && q.correctAnswer
                        ).map((q) => ({
                            questionText: q.questionText,
                            options: q.options,
                            correctAnswer: q.correctAnswer,
                            marks: q.marks || 1,
                        }));
                    }
                } catch (parseErr) {
                    logger.warn("JSON parse failed, attempting repair", { error: parseErr.message });
                    const repaired = [];
                    const regex = /\{\s*"questionText"\s*:\s*"([^"]+)"\s*,\s*"options"\s*:\s*\[([^\]]+)\]\s*,\s*"correctAnswer"\s*:\s*"([^"]+)"/g;
                    let match;
                    while ((match = regex.exec(jsonText)) !== null) {
                        try {
                            const opts = match[2].split(',').map(o => o.trim().replace(/^"|"$/g, ''));
                            if (opts.length >= 2) {
                                repaired.push({ questionText: match[1], options: opts, correctAnswer: match[3], marks: 1 });
                            }
                        } catch (_) { /* skip */ }
                    }
                    if (repaired.length > 0) finalQuestions = repaired;
                }
            }
        } catch (err) {
            logger.error("AI question generation failed", { error: err.message });
        }

        if (finalQuestions.length === 0) {
            throw new ApiError(500, "AI could not generate questions. Try again or create manually.");
        }
    } else {
        // ── Manual Mode ──────────────────────────────────────────────────
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new ApiError(400, "At least 1 question is required");
        }
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText?.trim()) throw new ApiError(400, `Question ${i + 1}: questionText is required`);
            if (!Array.isArray(q.options) || q.options.length < 2) {
                throw new ApiError(400, `Question ${i + 1}: at least 2 options are required`);
            }
            if (!q.correctAnswer?.trim()) throw new ApiError(400, `Question ${i + 1}: correctAnswer is required`);
            if (!q.options.includes(q.correctAnswer)) {
                throw new ApiError(400, `Question ${i + 1}: correctAnswer must be one of the options`);
            }
        }
        finalQuestions = questions;
    }

    const practiceSet = await PracticeSet.create({
        title: title.trim(),
        description: description?.trim() || "",
        generationMode,
        chapterId: chapterId || undefined,
        topic: topic?.trim() || undefined,
        teacherId: req.user._id,
        classroomId: classroom._id,
        questions: finalQuestions,
    });

    return res.status(201).json(
        new ApiResponse(201, practiceSet, generationMode === "ai"
            ? `${finalQuestions.length} questions generated by AI! ✨`
            : "Practice set created successfully")
    );
});

// ─── @desc   Get all practice sets created by this teacher
// ─── @route  GET /api/v1/practice/my-sets
// ─── @access Teacher
export const getMyPracticeSets = asyncHandler(async (req, res) => {
    const sets = await PracticeSet.find({ teacherId: req.user._id })
        .sort({ createdAt: -1 })
        .lean();

    // Add attempt count for each set
    const enriched = await Promise.all(
        sets.map(async (set) => {
            const attemptCount = await PracticeAttempt.countDocuments({ practiceSetId: set._id });
            return { ...set, attemptCount };
        })
    );

    return res.status(200).json(
        new ApiResponse(200, enriched, "Practice sets fetched")
    );
});

// ─── @desc   Toggle a practice set active/inactive
// ─── @route  PATCH /api/v1/practice/:id/toggle
// ─── @access Teacher
export const togglePracticeSet = asyncHandler(async (req, res) => {
    const set = await PracticeSet.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!set) throw new ApiError(404, "Practice set not found");

    set.isActive = !set.isActive;
    await set.save();

    return res.status(200).json(
        new ApiResponse(200, { isActive: set.isActive }, `Practice set ${set.isActive ? "activated" : "deactivated"}`)
    );
});

// ─── @desc   Delete a practice set
// ─── @route  DELETE /api/v1/practice/:id
// ─── @access Teacher
export const deletePracticeSet = asyncHandler(async (req, res) => {
    const set = await PracticeSet.findOneAndDelete({ _id: req.params.id, teacherId: req.user._id });
    if (!set) throw new ApiError(404, "Practice set not found");

    // Also remove all attempts for this set
    await PracticeAttempt.deleteMany({ practiceSetId: set._id });

    return res.status(200).json(
        new ApiResponse(200, {}, "Practice set deleted")
    );
});

// ─── @desc   Get analytics for a practice set (all students' scores)
// ─── @route  GET /api/v1/practice/:id/analytics
// ─── @access Teacher
export const getPracticeAnalytics = asyncHandler(async (req, res) => {
    const set = await PracticeSet.findOne({ _id: req.params.id, teacherId: req.user._id }).lean();
    if (!set) throw new ApiError(404, "Practice set not found");

    // Get the classroom to know total students
    const classroom = await ClassRoom.findById(set.classroomId)
        .populate("students", "fullName email")
        .lean();
    const totalStudents = classroom?.students?.length || 0;

    // Get all attempts for this set
    const attempts = await PracticeAttempt.find({ practiceSetId: set._id })
        .populate("studentId", "fullName email")
        .sort({ percentage: -1 })
        .lean();

    // Calculate summary stats
    const completedCount = attempts.length;
    const scores = attempts.map((a) => a.percentage);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Find students who have NOT attempted
    const attemptedStudentIds = new Set(attempts.map((a) => a.studentId?._id?.toString()));
    const notAttempted = (classroom?.students || []).filter(
        (s) => !attemptedStudentIds.has(s._id.toString())
    );

    return res.status(200).json(
        new ApiResponse(200, {
            practiceSet: { _id: set._id, title: set.title, totalQuestions: set.questions.length },
            summary: {
                totalStudents,
                completedCount,
                pendingCount: totalStudents - completedCount,
                avgScore,
                highestScore,
                lowestScore,
            },
            studentResults: attempts.map((a) => ({
                student: a.studentId,
                score: a.score,
                totalMarks: a.totalMarks,
                percentage: a.percentage,
                completedAt: a.completedAt,
            })),
            notAttempted,
        }, "Practice analytics fetched")
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// STUDENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── @desc   Get all active practice sets assigned to student's classroom
// ─── @route  GET /api/v1/practice/assigned
// ─── @access Student
export const getAssignedPracticeSets = asyncHandler(async (req, res) => {
    // Find classrooms where this student is enrolled
    const classrooms = await ClassRoom.find({ students: req.user._id }).select("_id").lean();
    const classroomIds = classrooms.map((c) => c._id);

    if (classroomIds.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, [], "No practice sets — you are not enrolled in any classroom")
        );
    }

    // Get active sets
    const sets = await PracticeSet.find({
        classroomId: { $in: classroomIds },
        isActive: true,
    })
        .select("title description questions createdAt")
        .sort({ createdAt: -1 })
        .lean();

    // Check which ones the student has already attempted
    const setIds = sets.map((s) => s._id);
    const attempts = await PracticeAttempt.find({
        practiceSetId: { $in: setIds },
        studentId: req.user._id,
    })
        .select("practiceSetId score totalMarks percentage")
        .lean();

    const attemptMap = {};
    for (const a of attempts) {
        attemptMap[a.practiceSetId.toString()] = a;
    }

    const enriched = sets.map((s) => ({
        _id: s._id,
        title: s.title,
        description: s.description,
        totalQuestions: s.questions.length,
        totalMarks: s.questions.reduce((sum, q) => sum + (q.marks || 1), 0),
        // Include questions WITHOUT correctAnswer so students can take the quiz
        questions: s.questions.map((q) => ({
            _id: q._id,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks || 1,
        })),
        createdAt: s.createdAt,
        attempted: !!attemptMap[s._id.toString()],
        result: attemptMap[s._id.toString()] || null,
    }));

    return res.status(200).json(
        new ApiResponse(200, enriched, "Assigned practice sets fetched")
    );
});

// ─── @desc   Submit answers for a practice set
// ─── @route  POST /api/v1/practice/:id/submit
// ─── @access Student
export const submitPracticeSet = asyncHandler(async (req, res) => {
    const { answers } = req.body;
    // answers = [{ questionId, selectedAnswer }]

    const set = await PracticeSet.findById(req.params.id);
    if (!set) throw new ApiError(404, "Practice set not found");
    if (!set.isActive) throw new ApiError(400, "This practice set is no longer active");

    if (!Array.isArray(answers) || answers.length === 0) {
        throw new ApiError(400, "answers array is required");
    }

    // Check student is in the classroom
    const classroom = await ClassRoom.findOne({ _id: set.classroomId, students: req.user._id });
    if (!classroom) throw new ApiError(403, "You are not enrolled in this classroom");

    // Grade the answers
    let score = 0;
    let totalMarks = 0;
    const graded = [];

    for (const q of set.questions) {
        totalMarks += q.marks || 1;
        const studentAnswer = answers.find((a) => a.questionId === q._id.toString());
        const isCorrect = studentAnswer?.selectedAnswer?.trim()?.toLowerCase() === q.correctAnswer?.trim()?.toLowerCase();
        if (isCorrect) score += q.marks || 1;

        graded.push({
            questionId: q._id,
            selectedAnswer: studentAnswer?.selectedAnswer || "",
            isCorrect,
        });
    }

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;

    // Upsert — update if already attempted, create if first attempt
    const attempt = await PracticeAttempt.findOneAndUpdate(
        { practiceSetId: set._id, studentId: req.user._id },
        {
            answers: graded,
            score,
            totalMarks,
            percentage,
            completedAt: new Date(),
        },
        { upsert: true, new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {
            score,
            totalMarks,
            percentage,
            answers: graded,
        }, percentage >= 70 ? "🎉 Great job!" : "Keep practicing!")
    );
});

// ─── @desc   Get student's own result for a practice set
// ─── @route  GET /api/v1/practice/:id/result
// ─── @access Student
export const getPracticeResult = asyncHandler(async (req, res) => {
    const attempt = await PracticeAttempt.findOne({
        practiceSetId: req.params.id,
        studentId: req.user._id,
    }).lean();

    if (!attempt) throw new ApiError(404, "You have not attempted this practice set yet");

    // Also return questions for review
    const set = await PracticeSet.findById(req.params.id)
        .select("title questions")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, {
            attempt,
            questions: set?.questions || [],
        }, "Practice result fetched")
    );
});
