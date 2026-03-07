
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import * as analyticsService from "../services/analytics.service.js";
import Report from "../models/Report.model.js";
import ChatHistory from "../models/ChatHistory.model.js";
import AttemptLog from "../models/AttemptLog.model.js";
import UserProgress from "../models/UserProgress.model.js";
import User from "../models/User.model.js";

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
    const skills = await analyticsService.getSkillMastery(req.user._id);
    return res.status(200).json(new ApiResponse(200, { skills }, "Skill breakdown fetched"));
});

// ─── @desc   Daily activity heatmap data (365 days)
// ─── @route  GET /api/v1/analytics/heatmap
// ─── @access Student
export const getHeatmap = asyncHandler(async (req, res) => {
    const heatmap = await analyticsService.getHeatmapData(req.user._id);
    return res.status(200).json(new ApiResponse(200, { heatmap }, "Heatmap data fetched"));
});

// ─── @desc   Daily performance trend (for line chart)
// ─── @route  GET /api/v1/analytics/performance?days=30
// ─── @access Student
export const getDailyPerformance = asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const performance = await analyticsService.getDailyPerformance(req.user._id, days);
    return res.status(200).json(new ApiResponse(200, { performance }, "Daily performance fetched"));
});

// ─── @desc   AI-identified weak concept areas
// ─── @route  GET /api/v1/analytics/weak-areas
// ─── @access Student
// ─── AI INTEGRATION NOTE:
//     Currently returns the lowest mastery skills from SkillProfile (no AI).
//     TO ADD AI: Pass the weakAreas list to GPT-4o with:
//     "A student struggles with these skills: {weakAreas}. Suggest 3 specific study tips for each."
export const getWeakAreas = asyncHandler(async (req, res) => {
    const weakAreas = await analyticsService.getWeakAreas(req.user._id);

    // Study tips per weak skill (static, template-based — replace with GPT-4o later)
    const studyTips = {
        default: "Practice more problems and revisit the foundational concepts.",
        algebra: "Work through step-by-step equation solving exercises.",
        geometry: "Draw diagrams for every problem to visualise the shapes.",
        fractions: "Start with visual fraction models before moving to equations.",
        calculus: "Break derivatives into smaller, incremental steps.",
        trigonometry: "Memorise the unit circle values and practice angle conversions.",
        physics: "Focus on identifying forces and drawing free body diagrams.",
        chemistry: "Balance equations by practising atom counting systematically.",
        biology: "Create mind maps linking concepts to their biological systems.",
    };

    const withTips = weakAreas.map((area) => ({
        ...area,
        tip:
            studyTips[area.skill?.toLowerCase()] ||
            studyTips.default.replace("problems", `"${area.skill}" problems`),
    }));

    return res.status(200).json(new ApiResponse(200, withTips, "Weak areas identified"));
});

// ─── @desc   Get a student's monthly AI-generated report
// ─── @route  GET /api/v1/analytics/report/:month
// ─── @access Student
export const getMonthlyReport = asyncHandler(async (req, res) => {
    const { month } = req.params;
    const report = await Report.findOne({ userId: req.user._id, month }).lean();
    if (!report)
        throw new ApiError(
            404,
            `No report found for ${month}. Reports are generated automatically on the 1st of each month.`
        );
    return res.status(200).json(new ApiResponse(200, report, "Monthly report fetched"));
});

// ─── @desc   Class-level aggregated analytics for a teacher
// ─── @route  GET /api/v1/analytics/class
// ─── @access Teacher
export const getClassAnalytics = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                message: "[STUB] Class analytics aggregation — classroomId filtering coming soon.",
                teacherId: req.user._id,
            },
            "Class analytics fetched"
        )
    );
});

// ─── @desc   Log a custom study event (e.g. "opened chapter", "watched video")
// ─── @route  POST /api/v1/analytics/log
// ─── @access Student
export const logStudyEvent = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, {}, "Study event logged"));
});

// ─── @desc   Get a specific student's full analytics overview
// ─── @route  GET /api/v1/analytics/student/:id
// ─── @access Teacher, Admin
export const getStudentAnalytics = asyncHandler(async (req, res) => {
    const studentId = req.params.id;

    // Verify student exists
    const student = await User.findById(studentId).select("name email gradeLevel languagePreference");
    if (!student) throw new ApiError(404, "Student not found");

    // 1. Fetch User Progress (Total Study Time)
    const progress = await UserProgress.findOne({ userId: studentId }).lean();

    // 2. Fetch Quiz Attempt Summaries (Last 50 attempts)
    const attemptLogs = await AttemptLog.find({ userId: studentId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("conceptId", "title")
        .populate("exerciseId", "question type difficulty")
        .lean();

    // Calculate basic quiz stats from the logs
    const totalAttempts = await AttemptLog.countDocuments({ userId: studentId });
    const correctAttempts = await AttemptLog.countDocuments({ userId: studentId, isCorrect: true });
    const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

    // 3. Fetch Recent AI Chat History (Last 50 interactions)
    const chatHistory = await ChatHistory.find({ userId: studentId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("conceptId", "title")
        .lean();

    // Assemble payload
    const data = {
        student,
        overview: {
            studyTimeMinutes: progress?.studyTimeMinutes || 0,
            totalQuizAttempts: totalAttempts,
            overallAccuracy: `${accuracy}%`,
        },
        recentChats: chatHistory,
        recentQuizAttempts: attemptLogs,
    };

    return res.status(200).json(new ApiResponse(200, data, "Student analytics retrieved successfully"));
});
