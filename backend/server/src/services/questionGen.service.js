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

    // ── Dummy question bank (topic-aware) ─────────────────────────────────────
    // Replace this block with a real GPT-4o call when AI is connected.
    logger.info("Question generated (DUMMY MODE)", { conceptId: concept._id, difficultyNum, type });

    const QUESTION_BANK = {
        mcq: [
            {
                question: `Which of the following best describes the concept of "${concept.title}"?`,
                options: [
                    `The primary principle of ${concept.title}`,
                    "An unrelated concept from a different field",
                    "A historical term no longer in use",
                    "A mathematical constant"
                ],
                solution: `The primary principle of ${concept.title}`,
            },
            {
                question: `What is the key application of "${concept.title}" in real life?`,
                options: [
                    "It helps solve problems efficiently",
                    "It has no practical application",
                    "It only applies in theoretical physics",
                    "It was invented in the 20th century"
                ],
                solution: "It helps solve problems efficiently",
            },
            {
                question: `Which statement about "${concept.title}" is CORRECT?`,
                options: [
                    `${concept.title} has a foundational role in its subject area`,
                    `${concept.title} was disproved in 1900`,
                    `${concept.title} applies only to advanced topics`,
                    `${concept.title} is unrelated to real-world problems`
                ],
                solution: `${concept.title} has a foundational role in its subject area`,
            },
        ],
        "fill-blank": [
            {
                question: `"${concept.title}" is a concept studied in ________.`,
                options: [],
                solution: "its subject domain",
            },
        ],
        open: [
            {
                question: `In your own words, explain what "${concept.title}" means and give one real-world example.`,
                options: [],
                solution: "open",
            },
        ],
    };

    const pool = QUESTION_BANK[type] || QUESTION_BANK.mcq;
    const picked = pool[Math.floor(Math.random() * pool.length)];

    const exerciseData = {
        conceptId: concept._id,
        type: QUESTION_BANK[type] ? type : "mcq",
        difficulty: difficultyNum,
        isAiGenerated: true,
        generationSeed: seed,
        question: `[${diffLabel.toUpperCase()}] ${picked.question}`,
        options: picked.options,
        steps: [],
        solution: picked.solution,
    };

    // Save to DB so this exerciseId is valid when student submits
    const saved = await Exercise.create(exerciseData);
    return saved;
}
