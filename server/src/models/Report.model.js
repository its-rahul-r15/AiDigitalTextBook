// ─── Report.model.js ─────────────────────────────────────────────────────────
// Monthly AI-generated learning report for each student.
// Generated on the 1st of every month by the reportGeneration Bull job.
//
// HOW THE AI REPORT WORKS (currently DUMMY — real AI not connected yet):
//   1. The Bull job fires on the 1st of the month (see jobs/reportGeneration.job.js)
//   2. It fetches all AttemptLogs for the past month and the student's SkillProfile
//   3. It computes raw metrics (accuracy, total time, weak/strong skills)
//   4. TO ADD AI: Pass the raw metrics to GPT-4o with a prompt like:
//      "Student data: {metrics}. Write 5 insight bullets. List top 3 weak skills. List top 3 strong skills."
//   5. Parse the JSON response and upsert this Report document
//   6. Until AI is connected, the insights[] array will contain placeholder text

import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Month in "YYYY-MM" format (e.g. "2026-02")
        month: {
            type: String,
            required: true,
            match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
        },
        // AI-generated insight sentences
        // TO ADD AI: Replace these dummy strings with GPT-4o output
        insights: [{ type: String }],
        weakSkills: [{ type: String }],
        strongSkills: [{ type: String }],
        // Raw computed metrics (no AI needed for these)
        totalAttempts: { type: Number, default: 0 },
        avgAccuracy: { type: Number, default: 0 }, // 0–100
        totalTimeSpent: { type: Number, default: 0 }, // in minutes
        generatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// One report per student per month
reportSchema.index({ userId: 1, month: 1 }, { unique: true });

const Report = mongoose.model("Report", reportSchema);
export default Report;
