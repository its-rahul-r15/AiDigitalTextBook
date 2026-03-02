// ─── adaptive.service.js ─────────────────────────────────────────────────────
// Item Response Theory (IRT) based adaptive difficulty engine.
// NO AI NEEDED HERE — this is pure math that decides what difficulty to show next.
//
// How it works:
//   1. After each attempt, the Bull job calls calculateTheta(attempts)
//   2. Theta = estimated student ability level (–3 to +3)
//   3. If theta > 1 (student is doing well) → increase difficulty
//   4. If theta < -1 (student is struggling) → decrease difficulty
//   5. The new difficulty is saved in the student's SkillProfile

import AttemptLog from "../models/AttemptLog.model.js";
import SkillProfile from "../models/SkillProfile.model.js";
import { SKILL_TREND } from "../utils/constants.util.js";
import logger from "../utils/logger.util.js";

/**
 * Calculate theta (ability estimate) from the student's recent attempts.
 * Uses the last 10 attempts for recency bias.
 *
 * @param {Array} attempts - array of { isCorrect, difficulty, timeTaken }
 * @returns {number} theta — student ability level from -3 to +3
 */
export function calculateTheta(attempts) {
    if (!attempts || attempts.length === 0) return 0;

    const recent = attempts.slice(-10);
    const accuracy = recent.filter((a) => a.isCorrect).length / recent.length;
    const avgTime = recent.reduce((s, a) => s + (a.timeTaken || 60), 0) / recent.length;

    let theta = 0;
    theta += (accuracy - 0.5) * 2;       // Accuracy is the main signal
    theta -= avgTime > 90 ? 0.5 : 0;     // Slow responses (>90s) suggest difficulty

    return Math.max(-3, Math.min(3, theta));
}

/**
 * Decide whether difficulty should go up (+1), stay same (0), or go down (-1).
 *
 * @param {number} theta - from calculateTheta()
 * @param {number} currentDifficulty - student's current difficulty (1–5)
 * @returns {number} delta: -1, 0, or +1
 */
export function getDifficultyDelta(theta, currentDifficulty) {
    if (theta > 1.0 && currentDifficulty < 5) return +1;
    if (theta < -1.0 && currentDifficulty > 1) return -1;
    return 0;
}

/**
 * Determine skill trend based on recent theta changes.
 * @param {number} thetaNow
 * @param {number} thetaBefore
 */
export function getTrend(thetaNow, thetaBefore) {
    if (thetaNow > thetaBefore + 0.2) return SKILL_TREND.IMPROVING;
    if (thetaNow < thetaBefore - 0.2) return SKILL_TREND.DECLINING;
    return SKILL_TREND.STABLE;
}

/**
 * Update a student's SkillProfile after a new attempt.
 * Called by the adaptiveScoring Bull job (jobs/adaptiveScoring.job.js).
 *
 * @param {string} userId
 * @param {string} conceptId
 * @param {string[]} skillTags - tags from the concept the student just practised
 */
export async function updateSkillProfile(userId, conceptId, skillTags) {
    try {
        // Fetch all attempts for this user on this concept
        const attempts = await AttemptLog.find({ userId, conceptId })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        const theta = calculateTheta(attempts);
        const masteryScore = (theta + 3) / 6; // Normalise -3…+3 to 0…1

        // Upsert the SkillProfile for this student
        const profile = await SkillProfile.findOneAndUpdate(
            { userId },
            {},
            { new: true, upsert: true }
        );

        // Update mastery for each relevant skill tag
        for (const tag of skillTags) {
            const existing = profile.skills.get(tag);
            const prevMastery = existing?.masteryScore ?? 0.5;
            const prevTheta = (prevMastery * 6) - 3;

            profile.skills.set(tag, {
                masteryScore,
                attempts: (existing?.attempts ?? 0) + 1,
                lastPracticed: new Date(),
                trend: getTrend(theta, prevTheta),
            });
        }

        // Recalculate overall mastery as average of all skills
        const allScores = [...profile.skills.values()].map((s) => s.masteryScore);
        profile.overallMastery = allScores.reduce((a, b) => a + b, 0) / allScores.length;

        // Adjust recommended difficulty
        const delta = getDifficultyDelta(theta, profile.currentDifficulty);
        profile.currentDifficulty = Math.max(1, Math.min(5, profile.currentDifficulty + delta));

        await profile.save();
        logger.info("SkillProfile updated", { userId, theta, masteryScore });
    } catch (err) {
        logger.error("Failed to update SkillProfile", { userId, error: err.message });
    }
}
