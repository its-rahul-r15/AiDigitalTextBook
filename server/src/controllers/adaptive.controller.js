// ─── adaptive.controller.js ──────────────────────────────────────────────────
// Exposes the adaptive difficulty engine to the frontend.
// NO AI NEEDED — IRT math runs in adaptive.service.js.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import SkillProfile from "../models/SkillProfile.model.js";
import AttemptLog from "../models/AttemptLog.model.js";
import * as adaptiveService from "../services/adaptive.service.js";

// ─── @desc   Get the student's current difficulty state
// ─── @route  GET /api/v1/adaptive/state
// ─── @access Student
export const getAdaptiveState = asyncHandler(async (req, res) => {
    let profile = await SkillProfile.findOne({ userId: req.user._id }).lean();

    // If the student doesn't have a profile yet, create a default one
    if (!profile) {
        profile = await SkillProfile.create({ userId: req.user._id });
    }

    return res.status(200).json(
        new ApiResponse(200, {
            currentDifficulty: profile.currentDifficulty,
            overallMastery: Math.round((profile.overallMastery || 0) * 100),
            skills: Object.fromEntries(profile.skills || new Map()),
        }, "Adaptive state fetched")
    );
});

// ─── @desc   AI-recommend the next concept the student should study
// ─── @route  GET /api/v1/adaptive/next-concept
// ─── @access Student
// ─── AI INTEGRATION NOTE:
//     Currently returns the concept with the lowest mastery score from SkillProfile.
//     TO ADD AI: Pass the student's skill map to GPT-4o with:
//     "Based on these skill scores, suggest the best concept to study next for maximum improvement: {skills}"
//     This creates a personalised learning path.
export const getNextConcept = asyncHandler(async (req, res) => {
    const profile = await SkillProfile.findOne({ userId: req.user._id }).lean();

    let recommendation = null;

    if (profile && profile.skills?.size > 0) {
        // Find the skill with lowest mastery — that's where the student needs to focus
        let lowestSkill = null;
        let lowestScore = 1;

        for (const [skill, data] of profile.skills.entries()) {
            if (data.masteryScore < lowestScore) {
                lowestScore = data.masteryScore;
                lowestSkill = skill;
            }
        }
        recommendation = lowestSkill;
    }

    // DUMMY AI recommendation — replace with GPT-4o call (see note above)
    return res.status(200).json(
        new ApiResponse(200, {
            recommendedSkill: recommendation || "No skill data yet. Start practising to get recommendations!",
            message: recommendation
                ? `Focus on "${recommendation}" — you have the most room to grow here.`
                : "[DUMMY] Complete more exercises to get a personalised AI recommendation.",
        }, "Next concept recommendation generated")
    );
});

// ─── @desc   Trigger IRT score recalculation (called by Bull job after each attempt)
// ─── @route  POST /api/v1/adaptive/update
// ─── @access Internal (System — not exposed to students)
export const triggerAdaptiveUpdate = asyncHandler(async (req, res) => {
    const { userId, conceptId, skillTags } = req.body;

    await adaptiveService.updateSkillProfile(userId, conceptId, skillTags || []);

    return res.status(200).json(new ApiResponse(200, {}, "Skill profile updated successfully"));
});

// ─── @desc   View the student's difficulty trend over time
// ─── @route  GET /api/v1/adaptive/difficulty-history
// ─── @access Student
export const getDifficultyHistory = asyncHandler(async (req, res) => {
    // Aggregate attempt logs to show difficulty changes over time
    const history = await AttemptLog
        .find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .select("difficulty score isCorrect createdAt")
        .lean();

    return res.status(200).json(
        new ApiResponse(200, history, "Difficulty history fetched")
    );
});
