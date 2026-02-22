// ─── questionGen.service.js ──────────────────────────────────────────────────
// Generates practice questions for a concept.
//
// ⚠️  CURRENTLY USING DUMMY QUESTIONS — REAL AI NOT CONNECTED YET
//
// HOW TO CONNECT REAL AI (GPT-4o Question Generation):
// ─────────────────────────────────────────────────────
// Step 1: Make sure @langchain/openai is installed (see aiTutor.service.js Step 1)
//
// Step 2: Replace the DUMMY QUESTION section below with:
//   import { ChatOpenAI } from "@langchain/openai";
//   import { PromptTemplate } from "@langchain/core/prompts";
//
//   const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
//
//   const prompt = await PromptTemplate.fromTemplate(`
//     Generate a {difficulty_label} {type} question for:
//     Concept: {title}
//     Content: {content}
//     Seed: {seed}
//
//     Return ONLY valid JSON:
//     {
//       "question": "...",
//       "type": "{type}",
//       "options": ["..."],
//       "steps": [{ "stepNumber": 1, "instruction": "...", "expectedAnswer": "...", "hint": "..." }],
//       "solution": "...",
//       "difficulty": {difficulty}
//     }
//   `).format({ title, content, type, difficulty, difficulty_label, seed });
//
//   const response = await llm.invoke(prompt);
//   return JSON.parse(response.content);

import Concept from "../models/concept.model.js";
import Exercise from "../models/Exercise.model.js";
import { DIFFICULTY_LABEL, EXERCISE_TYPES } from "../utils/constants.util.js";
import logger from "../utils/logger.util.js";

/**
 * Generate a new question for a concept.
 * Currently returns a dummy question — wire in GPT-4o using steps above.
 *
 * @param {{ conceptId: string, difficulty: number, type: string, userId: string }} opts
 * @returns {Promise<Object>} Question object (same shape as Exercise model)
 */
export async function generateQuestion({ conceptId, difficulty = 3, type = EXERCISE_TYPES.MCQ, userId }) {
    const concept = await Concept.findById(conceptId).lean();
    if (!concept) throw new Error("Concept not found");

    // Unique seed so AI can generate a different question each time
    const seed = `${userId}-${conceptId}-${Date.now()}`;

    // ── DUMMY QUESTION ────────────────────────────────────────────────────────
    // DELETE this and replace with GPT-4o call (see steps above) when adding AI.
    logger.info("Question generated (DUMMY MODE)", { conceptId, difficulty, type });

    const dummyQuestion = {
        conceptId,
        type,
        difficulty,
        isAiGenerated: true,
        generationSeed: seed,
        question: `[DUMMY] What is the main idea of "${concept.title}"?`,
        options: type === EXERCISE_TYPES.MCQ
            ? ["Option A (correct)", "Option B", "Option C", "Option D"]
            : [],
        steps: type === EXERCISE_TYPES.STEP_BASED
            ? [{ stepNumber: 1, instruction: "Step 1 instruction (DUMMY)", expectedAnswer: "Answer 1", hint: "Hint 1" }]
            : [],
        solution: "This is the dummy solution. AI will generate a real one.",
    };

    // Save the generated question to DB so it can be reused
    const saved = await Exercise.create(dummyQuestion);
    return saved;
    // ─────────────────────────────────────────────────────────────────────────
}
