// ─── aiTutor.service.js ──────────────────────────────────────────────────────
// AI Tutor service — handles student questions about a concept.
//
// ⚠️  CURRENTLY USING DUMMY RESPONSES — REAL AI NOT CONNECTED YET
//
// HOW TO CONNECT REAL AI (LangChain + OpenAI GPT-4o):
// ─────────────────────────────────────────────────────
// Step 1: Install packages
//   npm install @langchain/openai @langchain/core langchain
//
// Step 2: Create src/config/openai.js:
//   import { ChatOpenAI } from "@langchain/openai";
//   export const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
//
// Step 3: Replace the DUMMY RESPONSE section below with:
//   import { llm } from "../config/openai.js";
//   import { PromptTemplate } from "@langchain/core/prompts";
//
//   const prompt = await PromptTemplate.fromTemplate(`
//     You are an AI tutor for "{subject}". Answer from the context only.
//     Language: {language}. Grade: {grade}.
//     Context: {context}
//     Question: {question}
//   `).format({ subject, language, grade, context, question });
//
//   const response = await llm.invoke(prompt);
//   return response.content;
//
// Step 4: For STREAMING (SSE):
//   const stream = await llm.stream(prompt);
//   for await (const chunk of stream) {
//     res.write(`data: ${JSON.stringify({ token: chunk.content })}\n\n`);
//   }
//   res.write("data: [DONE]\n\n");
//   res.end();

import Concept from "../models/concept.model.js";
import logger from "../utils/logger.util.js";

/**
 * Answer a student's question about a concept.
 * Currently returns a dummy response — replace with LangChain call (see above).
 *
 * @param {{ question: string, conceptId: string, userId: string, language: string }} opts
 * @returns {Promise<string>} AI response text
 */
export async function askTutor({ question, conceptId, userId, language = "en" }) {
    try {
        // Fetch the concept so we have its content (this is the "context" for the AI)
        const concept = await Concept.findById(conceptId).lean();
        if (!concept) throw new Error("Concept not found");

        // ── DUMMY RESPONSE ────────────────────────────────────────────────────
        // When you connect LangChain, DELETE these lines and replace with AI call above.
        logger.info("AI Tutor asked (DUMMY MODE)", { userId, conceptId, question });
        return `[AI TUTOR — DUMMY] Your question: "${question}" 
This is a placeholder response for the concept: "${concept.title}". 
To enable real AI answers, follow the integration steps in aiTutor.service.js.`;
        // ─────────────────────────────────────────────────────────────────────
    } catch (err) {
        logger.error("aiTutor.askTutor error", { error: err.message });
        throw err;
    }
}

/**
 * Re-explain a concept in a different mode (visual, story, steps, analogy).
 * TO ADD AI: Send concept.content + mode to GPT-4o with a "re-explain as {mode}" prompt.
 *
 * @param {{ conceptId: string, mode: string, userId: string }} opts
 * @returns {Promise<string>}
 */
export async function explainConcept({ conceptId, mode, userId }) {
    const concept = await Concept.findById(conceptId).lean();
    if (!concept) throw new Error("Concept not found");

    // ── DUMMY RESPONSE ────────────────────────────────────────────────────────
    // TO ADD AI: Call GPT-4o with: "Explain '{concept.title}' as a {mode}. Content: {concept.content}"
    return `[AI TUTOR — DUMMY] Explanation of "${concept.title}" in "${mode}" mode. 
Connect LangChain to generate a real ${mode} explanation.`;
    // ─────────────────────────────────────────────────────────────────────────
}

/**
 * Simplify an explanation for a struggling student.
 * TO ADD AI: Send the original explanation to GPT-4o with "Simplify this for a grade {grade} student"
 */
export async function simplifyExplanation({ conceptId, userId, grade }) {
    const concept = await Concept.findById(conceptId).lean();
    if (!concept) throw new Error("Concept not found");

    // ── DUMMY RESPONSE ────────────────────────────────────────────────────────
    return `[AI TUTOR — DUMMY] Simplified explanation of "${concept.title}" for grade ${grade}. 
TO ADD AI: Use GPT-4o with a simplification prompt in aiTutor.service.js → simplifyExplanation().`;
    // ─────────────────────────────────────────────────────────────────────────
}

/**
 * Translate the concept explanation to the student's preferred language.
 * TO ADD AI: Use GPT-4o translation prompt or a dedicated translation API (DeepL).
 */
export async function translateExplanation({ conceptId, targetLanguage }) {
    const concept = await Concept.findById(conceptId).lean();
    if (!concept) throw new Error("Concept not found");

    // ── DUMMY RESPONSE ────────────────────────────────────────────────────────
    return `[AI TUTOR — DUMMY] Translation of "${concept.title}" to "${targetLanguage}". 
TO ADD AI: Send concept.content to GPT-4o with "Translate the following to {targetLanguage}:" prompt.`;
    // ─────────────────────────────────────────────────────────────────────────
}
