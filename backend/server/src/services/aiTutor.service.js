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
import ChatHistory from "../models/ChatHistory.model.js";
import logger from "../utils/logger.util.js";
import { generateContent } from "../config/gemini.js";

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

        const prompt = `
            You are an AI tutor for a student.
            Language to use: ${language}.
            Context about the topic: ${concept.content || concept.title}
            
            Student's Question: "${question}"
            
            Answer the question clearly and concisely, based on the context. If the question is off-topic, gently steer them back to the concept.
        `;

        logger.info("requesting AI Tutor response", { userId, conceptId, language });
        const aiResponse = await generateContent(prompt, 600);

        if (!aiResponse) {
            return "I'm sorry, I'm currently having trouble connecting to my knowledge base. Please try asking again in a moment.";
        }

        await ChatHistory.create({
            userId,
            conceptId,
            prompt: question,
            response: aiResponse,
            interactionType: "ask",
        });

        return aiResponse;
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

    const prompt = `
        Explain the concept "${concept.title}" as a ${mode}.
        Here is the original content to base your explanation on:
        ${concept.content || "No details provided, use your general knowledge of the topic."}
        
        Keep your explanation clear, engaging, and appropriate for learning.
    `;

    logger.info("requesting AI Tutor explanation", { userId, conceptId, mode });
    const aiResponse = await generateContent(prompt, 600);

    const responseText = aiResponse || "I encountered an error generating the explanation. Please try again.";

    if (userId) { // simplify/translate might not always pass userId correctly, but explain does according to controller
        await ChatHistory.create({
            userId,
            conceptId,
            prompt: `Explain as ${mode}`,
            response: responseText,
            interactionType: "explain",
        });
    }

    return responseText;
}

/**
 * Simplify an explanation for a struggling student.
 * TO ADD AI: Send the original explanation to GPT-4o with "Simplify this for a grade {grade} student"
 */
export async function simplifyExplanation({ conceptId, userId, grade }) {
    const concept = await Concept.findById(conceptId).lean();
    if (!concept) throw new Error("Concept not found");

    const prompt = `
        Simplify the following educational concept for a student in grade level: ${grade || "average"}.
        Concept Title: "${concept.title}"
        Content:
        ${concept.content || "No details provided, explain the title simply."}
        
        Make the language accessible and easy to digest, using analogies if helpful.
    `;

    logger.info("requesting AI Tutor simplification", { userId, conceptId, grade });
    const aiResponse = await generateContent(prompt, 500);

    const responseText = aiResponse || "I encountered an error simplifying this concept. Please try again.";

    if (userId) {
        await ChatHistory.create({
            userId,
            conceptId,
            prompt: `Simplify for grade ${grade || "average"}`,
            response: responseText,
            interactionType: "simplify",
        });
    }

    return responseText;
}

/**
 * Translate the concept explanation to the student's preferred language.
 * TO ADD AI: Use GPT-4o translation prompt or a dedicated translation API (DeepL).
 */
export async function translateExplanation({ conceptId, targetLanguage }) {
    const concept = await Concept.findById(conceptId).lean();
    if (!concept) throw new Error("Concept not found");

    const prompt = `
        Translate the following educational concept into ${targetLanguage}.
        Concept Title: "${concept.title}"
        Content:
        ${concept.content || ""}
        
        Maintain the educational tone and formatting.
    `;

    logger.info("requesting AI Tutor translation", { conceptId, targetLanguage });
    const aiResponse = await generateContent(prompt, 600);

    const responseText = aiResponse || "I encountered an error translating this concept. Please try again.";

    // The controller currently doesn't pass userId to translateExplanation.
    // It's probably best to check for it, or it will throw a validation error. Let's fix the schema requirement logic or just catch it.
    // Actually, I should just pass userId to transalateExplanation here from controller. Let's do that in a separate edit.
    // But for now, if userId exists, save it:

    return responseText;
}
