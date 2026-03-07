// ─── chapterQuiz.service.js ──────────────────────────────────────────────────
// Generates a set of MCQ questions from a chapter's content using Gemini AI.
// These questions are used for the chapter completion quiz gate.

import Chapter from "../models/Chapter.model.js";
import Exercise from "../models/Exercise.model.js";
import logger from "../utils/logger.util.js";
import { generateContent } from "../config/gemini.js";

/**
 * Generate quiz questions for a chapter from its content.
 *
 * @param {{ chapterId: string, userId: string, count?: number }} opts
 * @returns {Promise<Object[]>} Array of saved Exercise documents
 */
export async function generateChapterQuiz({ chapterId, userId, count = 5 }) {
    const chapter = await Chapter.findById(chapterId).lean();
    if (!chapter) throw new Error("Chapter not found");

    // Build context from chapter content sections
    const textParts = [];
    textParts.push(`Chapter Title: ${chapter.title}`);
    if (chapter.description) textParts.push(`Description: ${chapter.description}`);

    // Extract text from contentSections
    const sections = (chapter.contentSections || []).sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
    for (const section of sections) {
        if (section.type === "text" && section.body) {
            textParts.push(section.body);
        }
        if ((section.type === "image" || section.type === "diagram") && section.caption) {
            textParts.push(`[${section.type}]: ${section.caption}`);
        }
    }

    // Limit content length to avoid huge prompts
    let chapterContent = textParts.join("\n\n");
    if (chapterContent.length > 2000) {
        chapterContent = chapterContent.substring(0, 2000) + "...";
    }

    if (chapterContent.length < 20) {
        logger.warn("Chapter has very little content for quiz generation", { chapterId });
    }

    const prompt = `Generate ${count} MCQ questions as JSON array from this chapter content. Keep questions and options SHORT (under 15 words each).

Chapter: ${chapterContent}

Return ONLY valid JSON array, no markdown, no explanation:
[{"question":"short question?","options":["A","B","C","D"],"solution":"exact correct option"}]`;

    let questions = [];

    try {
        logger.info("Generating chapter quiz via AI", { chapterId, count });
        const aiResponse = await generateContent(prompt, 2500);

        if (aiResponse) {
            let jsonText = aiResponse.replace(/```(json)?/gi, "").trim();

            // Try direct parse first
            try {
                const parsed = JSON.parse(jsonText);
                if (Array.isArray(parsed)) {
                    questions = parsed.filter(
                        (q) => q.question && Array.isArray(q.options) && q.options.length >= 2 && q.solution
                    );
                }
            } catch (directErr) {
                // JSON was truncated — try to repair by extracting complete objects
                logger.warn("Direct JSON parse failed, attempting repair", { error: directErr.message });

                const repaired = [];
                const regex = /\{\s*"question"\s*:\s*"([^"]+)"\s*,\s*"options"\s*:\s*\[([^\]]+)\]\s*,\s*"solution"\s*:\s*"([^"]+)"\s*\}/g;
                let match;
                while ((match = regex.exec(jsonText)) !== null) {
                    try {
                        const opts = match[2].split(',').map(o => o.trim().replace(/^"|"$/g, ''));
                        if (opts.length >= 2) {
                            repaired.push({
                                question: match[1],
                                options: opts,
                                solution: match[3],
                            });
                        }
                    } catch (_) { /* skip malformed */ }
                }

                if (repaired.length > 0) {
                    logger.info(`Repaired ${repaired.length} questions from truncated JSON`);
                    questions = repaired;
                }
            }
        }
    } catch (err) {
        logger.warn("Failed to generate AI quiz questions, using fallback", { error: err.message });
    }

    // Fallback if AI fails: generate basic questions
    if (questions.length === 0) {
        questions = [
            {
                question: `What is the main topic of the chapter "${chapter.title}"?`,
                options: [chapter.title, "Unrelated Topic A", "Unrelated Topic B", "Unrelated Topic C"],
                solution: chapter.title,
            },
        ];
    }

    // Save each question as an Exercise
    // Use first concept from chapter, or chapterId itself as fallback (conceptId is required)
    const fallbackConceptId = chapter.concepts?.[0] || chapterId;

    const savedExercises = [];
    for (const q of questions) {
        const exercise = await Exercise.create({
            conceptId: fallbackConceptId,
            type: "mcq",
            difficulty: 3,
            isAiGenerated: true,
            generationSeed: `chapter-quiz-${chapterId}-${userId}-${Date.now()}`,
            question: q.question,
            options: q.options,
            solution: q.solution,
        });
        savedExercises.push(exercise);
    }

    return savedExercises;
}
