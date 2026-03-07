// ─── PracticeAttempt.model.js ─────────────────────────────────────────────────
// Records a student's submission for a PracticeSet.
// One document per student per practice set (upserted on re-attempt to keep best).

import mongoose from "mongoose";

const answerSchema = new mongoose.Schema(
    {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedAnswer: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
    },
    { _id: false }
);

const practiceAttemptSchema = new mongoose.Schema(
    {
        practiceSetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PracticeSet",
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        answers: [answerSchema],
        score: { type: Number, required: true, min: 0 },
        totalMarks: { type: Number, required: true, min: 0 },
        percentage: { type: Number, required: true, min: 0, max: 100 },
        completedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Unique: one attempt record per student per practice set
practiceAttemptSchema.index({ practiceSetId: 1, studentId: 1 }, { unique: true });

const PracticeAttempt = mongoose.model("PracticeAttempt", practiceAttemptSchema);
export default PracticeAttempt;
