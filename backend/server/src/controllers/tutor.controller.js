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

    // DUMMY RESPONSE — replace with GPT-4o call
    const relevance = `[DUMMY] Understanding this concept helps you in everyday life. 
Real-world connections will appear here once you connect GPT-4o in tutor.controller.js → explainRelevance().`;

    return res.status(200).json(new ApiResponse(200, { relevance }, "Relevance explanation generated"));
});
