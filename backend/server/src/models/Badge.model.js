// ─── Badge.model.js ──────────────────────────────────────────────────────────
// Badges are awards earned by students for specific achievements.
// The gamification.service.js decides when to award a badge and creates this document.
//
// Badge types are defined in constants.util.js → BADGE_TYPES.
// Each document = one badge earned by one student (so a user can appear multiple times).

import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Type key used to look up badge metadata (e.g. "streak-7", "skill-master")
        badgeType: {
            type: String,
            required: true,
            index: true,
        },
        badgeName: { type: String, required: true },
        description: { type: String },
        // URL of the badge icon image (stored in S3/CDN)
        // TO ADD MEDIA: Upload badge icons to S3 and store CloudFront URLs here
        iconUrl: { type: String, default: "" },
        // Which skill this badge is related to (optional, for skill-master type)
        relatedSkill: { type: String },
        earnedAt: { type: Date, default: Date.now, index: true },
    },
    { timestamps: true }
);

const Badge = mongoose.model("Badge", badgeSchema);
export default Badge;
