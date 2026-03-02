// ─── AttemptLog.model.js ─────────────────────────────────────────────────────
// IMMUTABLE record of every time a student attempts an exercise.
// "Append-only" means we NEVER update or delete these documents.
// Why? Because the adaptive engine (IRT model) needs the full history to be accurate.
//
// The adaptive.service.js reads these logs to calculate a student's theta score
// (ability level) and decide whether to increase or decrease difficulty.

import mongoose from "mongoose";

const attemptLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        exerciseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },
        // Denormalised from the Exercise so we can query "all attempts for concept X" fast
        conceptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Concept",
            required: true,
        },
        // Student's submitted answer (string for MCQ/fill-blank, array for step-based)
        answer: { type: mongoose.Schema.Types.Mixed },
        isCorrect: { type: Boolean, required: true },
        // Score out of 100 (partial credit possible for step-based)
        score: { type: Number, min: 0, max: 100 },
        // How long the student took on this question (in seconds)
        timeTaken: { type: Number },
        hintsUsed: { type: Number, default: 0 },
        retriesCount: { type: Number, default: 0 },
        // "learning" = practice mode, "exam" = test/exam mode (no hints available)
        mode: {
            type: String,
            enum: ["learning", "exam"],
            default: "learning",
        },
    },
    {
        timestamps: true,
        // Prevent updates — this collection is append-only
        // Note: The app layer must also enforce this (no findByIdAndUpdate calls)
    }
);

// Compound index: fetch all attempts by a user for a concept in one fast query
attemptLogSchema.index({ userId: 1, conceptId: 1 });
attemptLogSchema.index({ userId: 1, isCorrect: 1 });
attemptLogSchema.index({ createdAt: 1 });

const AttemptLog = mongoose.model("AttemptLog", attemptLogSchema);
export default AttemptLog;
