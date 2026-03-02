// ─── teacher.controller.js ───────────────────────────────────────────────────
// Class management, AI override rules, student assignment, and individual student view.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import ClassRoom from "../models/ClassRoom.model.js";
import User from "../models/User.model.js";
import SkillProfile from "../models/SkillProfile.model.js";

// ─── @desc   View class roster and basic stats
// ─── @route  GET /api/v1/teacher/class
// ─── @access Teacher
export const getClass = asyncHandler(async (req, res) => {
    const classroom = await ClassRoom.findOne({ teacherId: req.user._id })
        .populate("students", "fullName email gradeLevel lastLogin")
        .lean();

    if (!classroom) throw new ApiError(404, "No classroom found. Create one first.");

    return res.status(200).json(new ApiResponse(200, classroom, "Classroom fetched"));
});

// ─── @desc   Create a classroom
// ─── @route  POST /api/v1/teacher/class
// ─── @access Teacher
export const createClass = asyncHandler(async (req, res) => {
    const { name, courseId } = req.body;
    if (!name) throw new ApiError(400, "Classroom name is required");

    const existing = await ClassRoom.findOne({ teacherId: req.user._id });
    if (existing) throw new ApiError(409, "You already have a classroom. Update it instead.");

    const classroom = await ClassRoom.create({ name, courseId, teacherId: req.user._id });
    return res.status(201).json(new ApiResponse(201, classroom, "Classroom created"));
});

// ─── @desc   Enroll students by email list
// ─── @route  POST /api/v1/teacher/class/:id/enroll
// ─── @access Teacher
export const enrollStudents = asyncHandler(async (req, res) => {
    const { emails } = req.body; // Array of email strings
    if (!emails?.length) throw new ApiError(400, "emails array is required");

    const classroom = await ClassRoom.findOne({ _id: req.params.id, teacherId: req.user._id });
    if (!classroom) throw new ApiError(404, "Classroom not found");

    // Find users whose emails are in the list
    const users = await User.find({ email: { $in: emails }, role: "student" }).select("_id email").lean();
    const userIds = users.map((u) => u._id);

    // Add users who are not already enrolled
    const newIds = userIds.filter((id) => !classroom.students.includes(id.toString()));
    classroom.students.push(...newIds);
    await classroom.save();

    return res.status(200).json(
        new ApiResponse(200, { enrolled: newIds.length, notFound: emails.length - users.length }, "Students enrolled")
    );
});

// ─── @desc   Set an AI behaviour override for the class
// ─── @route  POST /api/v1/teacher/override
// ─── @access Teacher
// ─── AI INTEGRATION NOTE:
//     These overrides are checked in aiTutor.service.js and adaptive.service.js.
//     When you connect real AI, add: const classroom = await ClassRoom.findOne(...)
//     and check classroom.aiOverrides before making any AI call.
export const setOverride = asyncHandler(async (req, res) => {
    const { rule, value } = req.body;
    if (!rule) throw new ApiError(400, "rule is required");

    const classroom = await ClassRoom.findOne({ teacherId: req.user._id });
    if (!classroom) throw new ApiError(404, "No classroom found");

    classroom.aiOverrides.push({ rule, value, appliedAt: new Date() });
    await classroom.save();

    return res.status(200).json(new ApiResponse(200, classroom.aiOverrides, "AI override applied"));
});

// ─── @desc   Get all active AI overrides for the teacher's class
// ─── @route  GET /api/v1/teacher/override
// ─── @access Teacher
export const getOverrides = asyncHandler(async (req, res) => {
    const classroom = await ClassRoom.findOne({ teacherId: req.user._id }).select("aiOverrides").lean();
    if (!classroom) throw new ApiError(404, "No classroom found");

    return res.status(200).json(new ApiResponse(200, classroom.aiOverrides, "Overrides fetched"));
});

// ─── @desc   Remove a specific AI override
// ─── @route  DELETE /api/v1/teacher/override/:overrideIndex
// ─── @access Teacher
export const deleteOverride = asyncHandler(async (req, res) => {
    const classroom = await ClassRoom.findOne({ teacherId: req.user._id });
    if (!classroom) throw new ApiError(404, "No classroom found");

    const index = parseInt(req.params.overrideIndex);
    if (index < 0 || index >= classroom.aiOverrides.length) {
        throw new ApiError(400, "Override index is out of range");
    }

    classroom.aiOverrides.splice(index, 1);
    await classroom.save();

    return res.status(200).json(new ApiResponse(200, {}, "Override removed"));
});

// ─── @desc   View an individual student's profile (mastery + full analytics)
// ─── @route  GET /api/v1/teacher/student/:id
// ─── @access Teacher
export const getStudentProfile = asyncHandler(async (req, res) => {
    const studentId = req.params.id;

    const student = await User.findById(studentId).select("-password -refreshToken").lean();
    if (!student) throw new ApiError(404, "Student not found");

    const skillProfile = await SkillProfile.findOne({ userId: studentId }).lean();

    // ── Pull full AttemptLog stats via aggregation ──────────────────────────
    const mongoose = await import("mongoose");
    const uid = new mongoose.default.Types.ObjectId(studentId);

    const AttemptLog = (await import("../models/AttemptLog.model.js")).default;
    const UserProgress = (await import("../models/UserProgress.model.js")).default;

    const [stats] = await AttemptLog.aggregate([
        { $match: { userId: uid } },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                totalTimeSecs: { $sum: "$timeTaken" },
                avgScore: { $avg: "$score" },
                hintsUsed: { $sum: "$hintsUsed" },
            },
        },
    ]);

    // Last 7 days activity
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentActivity = await AttemptLog.aggregate([
        { $match: { userId: uid, createdAt: { $gte: sevenDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                attempts: { $sum: 1 },
                correct: { $sum: { $cond: ["$isCorrect", 1, 0] } },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // Calculate streak
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allDates = await AttemptLog.aggregate([
        { $match: { userId: uid, createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } },
        },
    ]);
    const dateSet = new Set(allDates.map((d) => d._id));
    let streak = 0;
    const check = new Date();
    for (let i = 0; i < 30; i++) {
        const key = check.toISOString().split("T")[0];
        if (dateSet.has(key)) { streak++; check.setDate(check.getDate() - 1); }
        else break;
    }

    // Skill mastery array
    const skills = [];
    for (const [skill, data] of Object.entries(skillProfile?.skills || {})) {
        skills.push({
            name: skill,
            level: Math.round((data.masteryScore || 0) * 100),
            trend: data.trend || "stable",
            attempts: data.attempts || 0,
        });
    }
    skills.sort((a, b) => b.level - a.level);

    // Weak areas (mastery < 40%)
    const weakAreas = skills.filter((s) => s.level < 40);

    const userProgress = await UserProgress.findOne({ userId: studentId }).lean();

    return res.status(200).json(
        new ApiResponse(200, {
            student,
            analytics: {
                totalAttempts: stats?.totalAttempts || 0,
                correctAttempts: stats?.correctAttempts || 0,
                accuracy: stats
                    ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
                    : 0,
                avgScore: Math.round(stats?.avgScore || 0),
                totalTimeMinutes: Math.round((stats?.totalTimeSecs || 0) / 60),
                hintsUsed: stats?.hintsUsed || 0,
                streak,
                overallMastery: Math.round((skillProfile?.overallMastery || 0) * 100),
                currentDifficulty: skillProfile?.currentDifficulty || 3,
                studyTimeMinutes: userProgress?.studyTimeMinutes || 0,
                completedChapters: userProgress?.completedChapters?.length || 0,
                recentActivity: recentActivity.map((d) => ({
                    date: d._id,
                    attempts: d.attempts,
                    accuracy: d.attempts > 0
                        ? Math.round((d.correct / d.attempts) * 100)
                        : 0,
                })),
                skills,
                weakAreas,
            },
        }, "Student profile fetched")
    );
});

