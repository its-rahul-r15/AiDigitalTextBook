// ─── tutor.controller.js ─────────────────────────────────────────────────────
// AI Tutor routes — all AI responses are currently DUMMY values.
// The aiTutor.service.js contains step-by-step instructions to connect GPT-4o.
//
// ⚠️  AI INTEGRATION NOTE:
// Every function here calls aiTutor.service.js which returns "[AI TUTOR — DUMMY]" text.
// Once you follow the LangChain setup steps in aiTutor.service.js, real GPT-4o
// responses will flow through automatically without changing any code here.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import * as aiTutorService from "../services/aiTutor.service.js";
import { generateContent } from "../config/gemini.js";
import ChatHistory from "../models/ChatHistory.model.js";
import logger from "../utils/logger.util.js";

// ─── @desc   Ask AI a question about a concept (streaming in future, JSON now)
// ─── @route  POST /api/v1/tutor/ask
// ─── @access Student
// ─── AI STREAMING NOTE: When you connect LangChain, this should use SSE (Server-Sent Events).
//     To enable SSE streaming:
//     1. Set res.setHeader("Content-Type", "text/event-stream")
//     2. Call aiTutorService.askTutor() with the `res` object
//     3. The service will write chunks: res.write(`data: ${JSON.stringify({ token })}\n\n`)
//     4. End with: res.write("data: [DONE]\n\n"); res.end();
export const askTutor = asyncHandler(async (req, res) => {
    const { question, conceptId } = req.body;

    if (!question || !conceptId) throw new ApiError(400, "question and conceptId are required");

    const answer = await aiTutorService.askTutor({
        question,
        conceptId,
        userId: req.user._id,
        language: req.user.languagePreference || "en",
    });

    return res.status(200).json(new ApiResponse(200, { answer }, "Tutor response generated"));
});

// ─── @desc   Re-explain a concept in a different mode (visual/story/steps/analogy)
// ─── @route  POST /api/v1/tutor/explain
// ─── @access Student
export const explainConcept = asyncHandler(async (req, res) => {
    const { conceptId, mode } = req.body;
    if (!conceptId || !mode) throw new ApiError(400, "conceptId and mode are required");

    const explanation = await aiTutorService.explainConcept({
        conceptId,
        mode,
        userId: req.user._id,
    });

    return res.status(200).json(new ApiResponse(200, { explanation }, "Explanation generated"));
});

// ─── @desc   Simplify the concept explanation for a struggling student
// ─── @route  POST /api/v1/tutor/simplify
// ─── @access Student
export const simplifyExplanation = asyncHandler(async (req, res) => {
    const { conceptId } = req.body;
    if (!conceptId) throw new ApiError(400, "conceptId is required");

    const simplified = await aiTutorService.simplifyExplanation({
        conceptId,
        userId: req.user._id,
        grade: req.user.gradeLevel,
    });

    return res.status(200).json(new ApiResponse(200, { explanation: simplified }, "Simplified explanation generated"));
});

// ─── @desc   Translate concept explanation to student's preferred language
// ─── @route  POST /api/v1/tutor/translate
// ─── @access Student
export const translateExplanation = asyncHandler(async (req, res) => {
    const { conceptId, targetLanguage } = req.body;
    if (!conceptId || !targetLanguage) throw new ApiError(400, "conceptId and targetLanguage are required");

    const translated = await aiTutorService.translateExplanation({
        conceptId,
        targetLanguage,
        userId: req.user._id,
    });

    return res.status(200).json(new ApiResponse(200, { explanation: translated }, "Translation generated"));
});

// ─── @desc   "Why am I learning this?" — real-world connections (DUMMY for now)
// ─── @route  POST /api/v1/tutor/relevance
// ─── @access Student
// ─── TO ADD AI: Call GPT-4o with "Explain real-world uses of {concept.title} for a student"
export const explainRelevance = asyncHandler(async (req, res) => {
    const { conceptId } = req.body;
    if (!conceptId) throw new ApiError(400, "conceptId is required");

    const prompt = `
        Explain the real-world connections or relevance of this concept for a student.
        Make it engaging and show why learning this matters in everyday life or future careers.
    `;

    logger.info("requesting AI Tutor relevance explanation", { conceptId });
    const aiResponse = await generateContent(prompt, 500);

    const relevance = aiResponse || "I encountered an error generating the explanation. Please try again.";

    if (aiResponse) {
        await ChatHistory.create({
            userId: req.user._id,
            conceptId,
            prompt: "Explain relevance",
            response: relevance,
            interactionType: "relevance",
        });
    }

    return res.status(200).json(new ApiResponse(200, { relevance }, "Relevance explanation generated"));
});

// ─── @desc   Free-form chat with AI (no conceptId required)
// ─── @route  POST /api/v1/tutor/chat
// ─── @access Student
export const chatWithTutor = asyncHandler(async (req, res) => {
    const { message } = req.body;
    if (!message) throw new ApiError(400, "message is required");

    const prompt = `
        You are an AI Tutor for a student platform. 
        The student says: "${message}"
        Respond in a helpful, educational, and concise manner.
    `;

    logger.info("tutor chat request", { userId: req.user._id });
    const aiResponse = await generateContent(prompt, 600);
    const reply = aiResponse || "I'm having trouble thinking right now. Please try again.";

    if (aiResponse) {
        await ChatHistory.create({
            userId: req.user._id,
            prompt: message,
            response: reply,
            interactionType: "chat",
        });
    }

    return res.status(200).json(new ApiResponse(200, { reply }, "Chat response generated"));
});

// ─── @desc   Get user's chat history (paginated, newest first)
// ─── @route  GET /api/v1/tutor/history?page=1&limit=50
// ─── @access Student
export const getChatHistory = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
        ChatHistory.find({ userId: req.user._id })
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ChatHistory.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json(
        new ApiResponse(200, { messages, total, page, totalPages: Math.ceil(total / limit) }, "Chat history fetched")
    );
});

// ─── @desc   Search through user's chat history
// ─── @route  GET /api/v1/tutor/history/search?q=keyword
// ─── @access Student
export const searchChatHistory = asyncHandler(async (req, res) => {
    const q = req.query.q?.trim();
    if (!q) throw new ApiError(400, "Search query is required");

    const results = await ChatHistory.find({
        userId: req.user._id,
        $or: [
            { prompt: { $regex: q, $options: "i" } },
            { response: { $regex: q, $options: "i" } },
        ],
    })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    return res.status(200).json(
        new ApiResponse(200, { results, total: results.length }, "Search completed")
    );
});
