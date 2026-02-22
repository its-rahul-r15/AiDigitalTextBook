// ─── SkillProfile.model.js ───────────────────────────────────────────────────
// One document per student. Tracks mastery level for every skill tag they have encountered.
//
// How it works:
//   - Each Concept has skillTags (e.g. ["fractions", "algebra"])
//   - After a student submits an answer, the adaptiveScoring Bull job fires
//   - That job reads AttemptLog, calls adaptive.service.calculateTheta()
//   - Then updates this document with the new masteryScore for each skill tag
//
// masteryScore is between 0 (no mastery) and 1 (full mastery), based on IRT theta.
// TO ADD AI: You can let GPT-4o analyse the skills map and generate personalised advice.

import mongoose from "mongoose";
import { SKILL_TREND } from "../utils/constants.util.js";

const skillDataSchema = new mongoose.Schema(
    {
        // IRT-based mastery score (0–1). Calculated by adaptive.service.js
        masteryScore: { type: Number, min: 0, max: 1, default: 0 },
        // Total number of times this skill was practised
        attempts: { type: Number, default: 0 },
        lastPracticed: { type: Date },
        // Is this student getting better, staying same, or declining on this skill?
        trend: {
            type: String,
            enum: Object.values(SKILL_TREND),
            default: SKILL_TREND.STABLE,
        },
    },
    { _id: false } // No need for separate _id on sub-documents
);

const skillProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One profile per student
        },
        // Map of skillTag → skill metrics. Example: { "fractions": { masteryScore: 0.8, ... } }
        skills: {
            type: Map,
            of: skillDataSchema,
            default: {},
        },
        // Weighted average of all skill mastery scores — the "overall" rating shown on dashboard
        overallMastery: { type: Number, min: 0, max: 1, default: 0 },
        // Current recommended difficulty level for this student (set by adaptive engine)
        currentDifficulty: { type: Number, min: 1, max: 5, default: 3 },
    },
    { timestamps: true }
);

skillProfileSchema.index({ userId: 1 }, { unique: true });

const SkillProfile = mongoose.model("SkillProfile", skillProfileSchema);
export default SkillProfile;
