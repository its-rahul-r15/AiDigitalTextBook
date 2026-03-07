// ─── questionGen.service.js ──────────────────────────────────────────────────
// Generates practice questions for a concept.
//
// ⚠️  CURRENTLY USING DUMMY QUESTIONS — REAL AI NOT CONNECTED YET
//
// HOW TO CONNECT REAL AI (GPT-4o Question Generation):
// ─────────────────────────────────────────────────────
// Replace the DUMMY QUESTION section below with the GPT-4o call from the comments.

import mongoose from "mongoose";
import Concept from "../models/concept.model.js";
import Exercise from "../models/Exercise.model.js";
import { DIFFICULTY_LABEL, EXERCISE_TYPES } from "../utils/constants.util.js";
import logger from "../utils/logger.util.js";
import { generateContent } from "../config/gemini.js";

/**
 * Generate a new question for a concept (or pick a random concept if none given).
 * Currently returns a dummy question — wire in GPT-4o using steps in comments above.
 *
 * @param {{ conceptId?: string, difficulty: number, type: string, userId: string }} opts
 * @returns {Promise<Object>} Question object (same shape as Exercise model)
 */
export async function generateQuestion({ conceptId, difficulty = 3, type = EXERCISE_TYPES.MCQ, userId }) {
    let concept = null;

    // ── Resolve concept (handle missing / invalid conceptId) ─────────────────
    if (conceptId && conceptId !== "general" && mongoose.isValidObjectId(conceptId)) {
        concept = await Concept.findById(conceptId).lean();
    }

    // Fallback: pick any concept from the database
    if (!concept) {
        concept = await Concept.findOne({}).lean();
    }

    // Last resort: create a synthetic "general" concept placeholder
    if (!concept) {
        logger.warn("No concepts found in database. Using generic placeholder.");
        concept = {
            _id: new mongoose.Types.ObjectId(),
            title: "General Knowledge",
            skillTags: ["general"],
        };
    }

    const seed = `${userId}-${concept._id}-${Date.now()}`;
    const difficultyNum = typeof difficulty === "string"
        ? ({ easy: 2, medium: 3, hard: 4 }[difficulty] || 3)
        : difficulty;

    const diffLabel = DIFFICULTY_LABEL[difficultyNum] || "medium";

    const pool = [
        {
            question: "What is this concept primarily about?",
            options: ["Option A", "Option B", "Option C", "Option D"],
            solution: "Option A"
        }
    ];
    let picked = pool[0];

    // ── Real AI Question Generation ──────────────────────────────────────────
    const prompt = `
        You are an expert teacher creating a ${diffLabel} difficulty ${type} question about the concept "${concept.title}".
        Here is the content of the concept: ${concept.content || "Use general knowledge of this topic."}
        
        Generate exactly ONE question in this strict JSON format (do not use markdown code blocks, just raw JSON):
        {
            "question": "The question text",
            "options": ["Option A", "Option B", "Option C", "Option D"], // Provide 4 options for MCQ, empty array [] for open/fill-blank
            "solution": "The exact correct option string (for MCQ), or the exact word (for fill-blank), or 'open' (for open)"
        }
    `;

    try {
        logger.info("requesting AI Generated question", { conceptId: concept._id, diffLabel, type });
        // Use a bit more tokens for questions
        const aiResponse = await generateContent(prompt, 600);

        if (aiResponse) {
            // Strip potential markdown formatting that Gemini might sneak in
            const jsonText = aiResponse.replace(/```(json)?/gi, "").trim();
            const aiGenerated = JSON.parse(jsonText);

            if (aiGenerated.question && typeof aiGenerated.solution !== "undefined") {
                picked = aiGenerated; // Use the AI generated one instead of fallback
            }
        }
    } catch (err) {
        logger.warn("Failed to parse AI generated question, falling back to dummy", { error: err.message });
    }
    // ────────────────────────────────────────────────────────────────────────‒

    const exerciseData = {
        conceptId: concept._id,
        type: type || "mcq",
        difficulty: difficultyNum,
        isAiGenerated: true,
        generationSeed: seed,
        question: `[${diffLabel.toUpperCase()}] ${picked.question}`,
        options: picked.options || [],
        steps: [],
        solution: picked.solution || "open",
    };

    // Save to DB so this exerciseId is valid when student submits
    const saved = await Exercise.create(exerciseData);
    return saved;
}
