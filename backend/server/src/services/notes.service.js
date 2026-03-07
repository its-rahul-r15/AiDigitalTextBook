// ─── notes.service.js ────────────────────────────────────────────────────────
// Smart notes: converts student's highlighted text into AI summaries and flashcards.
//
// ⚠️  CURRENTLY USING DUMMY SUMMARIES — REAL AI NOT CONNECTED YET
//
// HOW TO CONNECT REAL AI (GPT-4o Summarisation):
// ────────────────────────────────────────────────
// Step 1: In generateSummary(), replace the DUMMY block with:
//
//   import { ChatOpenAI } from "@langchain/openai";
//   const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.3 });
//
//   const response = await llm.invoke(
//     `Summarise the following highlighted text in 3 bullet points:
//      "${highlightedText}"
//      Return plain text bullet points only.`
//   );
//   return response.content;
//
// Step 2: In generateFlashcards(), replace the DUMMY block with:
//
//   const response = await llm.invoke(
//     `Create 3 flashcards from this text:
//      "${highlightedText}"
//      Return JSON array: [{ "front": "...", "back": "..." }]`
//   );
//   return JSON.parse(response.content);

import Note from "../models/Note.model.js";
import logger from "../utils/logger.util.js";
import { generateContent } from "../config/gemini.js";

/**
 * Generate a summary for a student's highlighted text and save it.
 * @param {{ userId, conceptId, chapterId, highlightedText }} opts
 * @returns {Promise<Note>} saved note document
 */
export async function generateSummary({ userId, conceptId, chapterId, highlightedText }) {
    const prompt = `
        Summarise the following highlighted text in 3 concise bullet points.
        Return plain text bullet points only (starting with •). Do not include any intro or conversational text.
        
        Text to summarise:
        "${highlightedText}"
    `;

    logger.info("requesting AI Note summary", { userId, conceptId });
    // Keep maxTokens small for summary (300 should be plenty for 3 bullets)
    const aiResponse = await generateContent(prompt, 300);

    const summary = aiResponse || `• Summary unavailable. (Highlight: "${highlightedText.substring(0, 50)}...")`;

    // ── DUMMY FLASHCARDS ──────────────────────────────────────────────────────
    const flashcards = await generateFlashcards({ userId, conceptId, highlightedText });

    const note = await Note.create({
        userId,
        conceptId,
        chapterId,
        highlightedText,
        summary,
        flashcards: flashcards,
    });

    return note;
}

/**
 * Generate flashcards from a chapter or highlight.
 * @param {{ userId, conceptId, highlightedText }} opts
 * @returns {Promise<Array>} array of { front, back }
 */
export async function generateFlashcards({ userId, conceptId, highlightedText }) {
    const prompt = `
        Create exactly 3 study flashcards from the text provided below.
        Return the response strictly as a JSON array of objects, with no markdown formatting around it.
        Example format: [{"front": "Question here", "back": "Answer here"}]
        
        Text:
        "${highlightedText}"
    `;

    logger.info("requesting AI Flashcards", { userId, conceptId });
    // More tokens needed for JSON structure + 3 Q/A pairs
    const aiResponse = await generateContent(prompt, 500);

    let flashcards = [
        { front: "What is this concept about?", back: "Content unavailable." },
        { front: "Give one example.", back: "Content unavailable." }
    ];

    if (aiResponse) {
        try {
            const jsonText = aiResponse.replace(/```(json)?/gi, "").trim();
            const parsed = JSON.parse(jsonText);
            if (Array.isArray(parsed) && parsed.length > 0) {
                flashcards = parsed;
            }
        } catch (err) {
            logger.warn("Failed to parse AI flashcards JSON", { error: err.message });
        }
    }

    return flashcards;
    // ─────────────────────────────────────────────────────────────────────────
}
