// ─── gemini.js ───────────────────────────────────────────────────────────────
// Shared Gemini configuration and helper functions for AI integration.
// 
// Environment variables required:
// - GEMINI_API_KEY
// - AI_PROVIDER (defaults to "gemini", can be "custom")
// 
// Model chosen: gemini-2.5-flash-preview (free tier friendly)

import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../utils/logger.util.js";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || "";
const AI_PROVIDER = process.env.AI_PROVIDER || "gemini";

// Initialize Gemini SDK
let genAI = null;
let model = null;

if (API_KEY) {
    genAI = new GoogleGenerativeAI(API_KEY);
    // Setting default model: gemini-2.5-flash
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Call Gemini API with standard error handling and token limits.
 * 
 * @param {string} prompt - The prompt to send to Gemini
 * @param {number} maxTokens - Max output tokens to generate (default 512 for free tier saving)
 * @returns {Promise<string|null>} The generated text, or null on error
 */
export async function callGemini(prompt, maxTokens = 512) {
    if (!API_KEY) {
        logger.error("callGemini: GEMINI_API_KEY is not set.");
        return null;
    }

    try {
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                maxOutputTokens: maxTokens,
                temperature: 0.7, // Good balance for teaching
            }
        });

        const responseText = result.response.text();
        return responseText;
    } catch (error) {
        logger.error("callGemini Error", { message: error.message });
        return null;
    }
}

/**
 * Call a Custom AI model.
 * 
 * @param {string} prompt - The prompt to send
 * @param {number} maxTokens - Max output tokens
 * @returns {Promise<string|null>} 
 */
export async function callCustomAI(prompt, maxTokens = 512) {
    // TODO: Implement your custom AI fetch logic here once your model is ready
    logger.warn("callCustomAI called but not implemented yet. Implement in config/gemini.js");
    return `[CUSTOM AI PLACEHOLDER] Echo: ${prompt.substring(0, 50)}...`;
}

/**
 * Main switch-board function. Based on AI_PROVIDER env variable, routes to right model.
 */
export async function generateContent(prompt, maxTokens = 512) {
    if (AI_PROVIDER === "custom") {
        return callCustomAI(prompt, maxTokens);
    }

    return callGemini(prompt, maxTokens);
}
