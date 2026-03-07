// ─── report.service.js ───────────────────────────────────────────────────────
// Generates monthly learning reports for students.
//
// ⚠️  CURRENTLY USING DUMMY AI INSIGHTS — REAL AI NOT CONNECTED YET
//
// HOW TO CONNECT REAL AI (GPT-4o Report Generation):
// ─────────────────────────────────────────────────────
// In generateMonthlyReport(), replace the DUMMY INSIGHTS block with:
//
//   import { ChatOpenAI } from "@langchain/openai";
//   const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.3 });
//
//   const response = await llm.invoke(`
//     Student Learning Report — ${month}
//     Metrics: ${JSON.stringify(rawMetrics)}
//     Generate exactly 5 insight bullet points.
//     Identify top 3 weak skills and top 3 strong skills.
//     Return JSON: { "insights": [], "weakSkills": [], "strongSkills": [] }
//   `);
//   const aiData = JSON.parse(response.content);
//   // Then use aiData.insights, aiData.weakSkills, aiData.strongSkills below.

import mongoose from "mongoose";
import AttemptLog from "../models/AttemptLog.model.js";
import SkillProfile from "../models/SkillProfile.model.js";
import Report from "../models/Report.model.js";
import logger from "../utils/logger.util.js";
import { generateContent } from "../config/gemini.js";

/**
 * Compute raw metrics from attempt logs for a given month.
 * (No AI — pure math computation)
 *
 * @param {string} userId
 * @param {string} month - "YYYY-MM"
 * @returns {Promise<Object>} rawMetrics
 */
async function computeRawMetrics(userId, month) {
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 1); // First day of next month

    const uid = new mongoose.Types.ObjectId(userId);
    const [stats] = await AttemptLog.aggregate([
        { $match: { userId: uid, createdAt: { $gte: start, $lt: end } } },
        {
            $group: {
                _id: null,
                totalAttempts: { $sum: 1 },
                correctAttempts: { $sum: { $cond: ["$isCorrect", 1, 0] } },
                totalTimeSecs: { $sum: "$timeTaken" },
            },
        },
    ]);

    const profile = await SkillProfile.findOne({ userId }).lean();
    const skills = profile?.skills ? Object.entries(profile.skills) : [];

    const weakSkills = skills
        .filter(([, s]) => s.masteryScore < 0.4)
        .sort(([, a], [, b]) => a.masteryScore - b.masteryScore)
        .slice(0, 3)
        .map(([name]) => name);

    const strongSkills = skills
        .filter(([, s]) => s.masteryScore >= 0.7)
        .sort(([, a], [, b]) => b.masteryScore - a.masteryScore)
        .slice(0, 3)
        .map(([name]) => name);

    return {
        totalAttempts: stats?.totalAttempts || 0,
        correctAttempts: stats?.correctAttempts || 0,
        avgAccuracy: stats
            ? Math.round((stats.correctAttempts / stats.totalAttempts) * 100)
            : 0,
        totalTimeSpent: Math.round((stats?.totalTimeSecs || 0) / 60),
        weakSkills,
        strongSkills,
    };
}

/**
 * Generate and save the monthly report for a student.
 * Called by the reportGeneration Bull job on the 1st of each month.
 *
 * @param {string} userId
 * @param {string} month - "YYYY-MM"
 */
export async function generateMonthlyReport(userId, month) {
    try {
        const rawMetrics = await computeRawMetrics(userId, month);

        const prompt = `
            You are an encouraging but analytical AI Tutor writing a monthly learning report for a student.
            Month: ${month}
            Student Metrics: ${JSON.stringify(rawMetrics, null, 2)}
            
            Generate exactly 5 short, personalized insight bullet points based on these metrics.
            Focus on their accuracy, time spent, and specifically mention their weak and strong skills.
            Make it motivating but point out what they need to work on.
            
            Return the output STRICTLY as a JSON array of 5 strings. No markdown blocks, just raw JSON array:
            ["Insight 1", "Insight 2", ...]
        `;

        logger.info("requesting AI Insights for Monthly Report", { userId, month });
        const aiResponse = await generateContent(prompt, 500);

        let insights = [
            `You completed ${rawMetrics.totalAttempts} exercises this month.`,
            `Your accuracy was ${rawMetrics.avgAccuracy}%.`,
            `You spent ${rawMetrics.totalTimeSpent} minutes studying.`
        ];

        if (aiResponse) {
            try {
                const jsonText = aiResponse.replace(/```(json)?/gi, "").trim();
                const parsed = JSON.parse(jsonText);
                if (Array.isArray(parsed) && parsed.length >= 3) {
                    insights = parsed;
                }
            } catch (err) {
                logger.warn("Failed to parse AI Insights JSON", { error: err.message });
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        await Report.findOneAndUpdate(
            { userId, month },
            { ...rawMetrics, insights, generatedAt: new Date() },
            { new: true, upsert: true }
        );

        logger.info("Monthly report saved", { userId, month });
    } catch (err) {
        logger.error("Failed to generate monthly report", { userId, month, error: err.message });
        throw err;
    }
}
