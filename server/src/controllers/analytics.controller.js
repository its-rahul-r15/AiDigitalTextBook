// ─── analytics.controller.js ─────────────────────────────────────────────────
// Student and teacher analytics dashboard data.
// All powered by analytics.service.js — NO AI, pure MongoDB aggregations.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import * as analyticsService from "../services/analytics.service.js";
import Report from "../models/Report.model.js";
import AttemptLog from "../models/AttemptLog.model.js";

// ─── @desc   Full learning progress dashboard for a student
// ─── @route  GET /api/v1/analytics/progress
// ─── @access Student
export const getProgress = asyncHandler(async (req, res) => {
    const data = await analyticsService.getProgressSummary(req.user._id);
    return res.status(200).json(new ApiResponse(200, data, "Progress data fetched"));
});

// ─── @desc   Full skill mastery breakdown
// ─── @route  GET /api/v1/analytics/skills
// ─── @access Student
export const getSkills = asyncHandler(async (req, res) => {
    // Weak areas from analytics service (pure MongoDB — no AI)
    const weakAreas = await analyticsService.getWeakAreas(req.user._id);
    return res.status(200).json(new ApiResponse(200, { weakAreas }, "Skill breakdown fetched"));
});

// ─── @desc   Daily activity heatmap data (365 days)
// ─── @route  GET /api/v1/analytics/heatmap
// ─── @access Student
export const getHeatmap = asyncHandler(async (req, res) => {
    const heatmap = await analyticsService.getHeatmapData(req.user._id);
    return res.status(200).json(new ApiResponse(200, { heatmap }, "Heatmap data fetched"));
});

// ─── @desc   AI-identified weak concept areas (DUMMY for now)
// ─── @route  GET /api/v1/analytics/weak-areas
// ─── @access Student
// ─── AI INTEGRATION NOTE:
//     Currently returns the lowest mastery skills from SkillProfile (no AI).
//     TO ADD AI: Pass the weakAreas list to GPT-4o with:
//     "A student struggles with these skills: {weakAreas}. Suggest 3 specific study tips for each."
export const getWeakAreas = asyncHandler(async (req, res) => {
    const weakAreas = await analyticsService.getWeakAreas(req.user._id);

    // DUMMY AI suggestions — replace with GPT-4o tips when AI is connected
    const withDummyTips = weakAreas.map((area) => ({
        ...area,
        tip: `[DUMMY TIP] Practice more problems on "${area.skill}". 
→ TO ADD AI: Call GPT-4o in analytics.controller.js → getWeakAreas() to generate personalised study tips.`,
    }));

    return res.status(200).json(new ApiResponse(200, withDummyTips, "Weak areas identified"));
});

// ─── @desc   Get a student's monthly AI-generated report
// ─── @route  GET /api/v1/analytics/report/:month
// ─── @access Student
export const getMonthlyReport = asyncHandler(async (req, res) => {
    const { month } = req.params;

    const report = await Report.findOne({ userId: req.user._id, month }).lean();
    if (!report) throw new ApiError(404, `No report found for ${month}. Reports are generated automatically on the 1st of each month.`);

    return res.status(200).json(new ApiResponse(200, report, "Monthly report fetched"));
});

// ─── @desc   Class-level aggregated analytics for a teacher
// ─── @route  GET /api/v1/analytics/class
// ─── @access Teacher
export const getClassAnalytics = asyncHandler(async (req, res) => {
    // Basic class analytics — how many total attempts in the class today
    // In a real implementation this should join with ClassRoom to get student IDs
    // TO EXPAND: Join ClassRoom → get student IDs → aggregate their AttemptLogs
    return res.status(200).json(
        new ApiResponse(200, {
            message: "[STUB] Class analytics aggregation — classroomId filtering coming soon.",
            teacherId: req.user._id,
        }, "Class analytics fetched")
    );
});

// ─── @desc   Log a custom study event (e.g. "opened chapter", "watched video")
// ─── @route  POST /api/v1/analytics/log
// ─── @access Student
export const logStudyEvent = asyncHandler(async (req, res) => {
    // Currently just acknowledges the log — will write to a dedicated events collection later
    // TO EXPAND: Create a StudyEvent model and store events for detailed behavioural analytics
    return res.status(200).json(new ApiResponse(200, {}, "Study event logged"));
});
