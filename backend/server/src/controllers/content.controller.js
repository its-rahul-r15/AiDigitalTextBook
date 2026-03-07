// ─── content.controller.js ───────────────────────────────────────────────────
// Handles all content-related routes: Course, Chapter, Concept, highlights, search.
// NO AI HERE — all plain database CRUD operations.

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import Course from "../models/course.models.js";
import Chapter from "../models/Chapter.model.js";
import Concept from "../models/concept.model.js";
import Note from "../models/Note.model.js";
import UserProgress from "../models/UserProgress.model.js";
import * as noteService from "../services/notes.service.js";
import { generateContent } from "../config/gemini.js";
import logger from "../utils/logger.util.js";

// ─── @desc   Update student learning progress
// ─── @route  POST /api/v1/content/progress
// ─── @access Student
export const updateProgress = asyncHandler(async (req, res) => {
    const { courseId, chapterId, isCompleted } = req.body;

    const updateQuery = {
        lastCourseId: courseId,
        lastChapterId: chapterId,
    };

    if (isCompleted) {
        updateQuery.$addToSet = { completedChapters: chapterId };
    }

    const progress = await UserProgress.findOneAndUpdate(
        { userId: req.user._id },
        updateQuery,
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, progress, "Progress updated successfully"));
});

// ─── @desc   Increment student study time
// ─── @route  POST /api/v1/content/progress/study-time
// ─── @access Student
export const updateStudyTime = asyncHandler(async (req, res) => {
    const { minutes } = req.body;

    const progress = await UserProgress.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { studyTimeMinutes: minutes || 1 } },
        { upsert: true, new: true }
    );

    return res.status(200).json(new ApiResponse(200, progress, "Study time updated"));
});

// ─── @desc   Get student's last learning progress
// ─── @route  GET /api/v1/content/progress
// ─── @access Student
export const getProgress = asyncHandler(async (req, res) => {
    const progress = await UserProgress.findOne({ userId: req.user._id })
        .populate("lastCourseId", "title subject")
        .populate("lastChapterId", "title orderIndex");

    if (!progress) {
        return res.status(200).json(new ApiResponse(200, null, "No progress found"));
    }

    return res.status(200).json(new ApiResponse(200, progress, "Progress fetched successfully"));
});

// ─── @desc   List all courses available to the logged-in student
// ─── @route  GET /api/v1/content/courses
// ─── @access Student
export const getCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({ isPublished: true })
        .select("title subject grade board language chapters createdAt")
        .lean();

    // Dynamically calculate accurate chapter counts for the UI labels
    const coursesWithCount = await Promise.all(courses.map(async (course) => {
        const count = await Chapter.countDocuments({ courseId: course._id });
        return { ...course, chapterCount: count };
    }));

    return res.status(200).json(new ApiResponse(200, coursesWithCount, "Courses fetched successfully"));
});

// ─── @desc   Get a single course with its chapters list
// ─── @route  GET /api/v1/content/courses/:id
// ─── @access Student
export const getCourseById = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate("chapters", "title orderIndex isOfflineAvailable")
        .lean();

    if (!course) throw new ApiError(404, "Course not found");

    return res.status(200).json(new ApiResponse(200, course, "Course fetched successfully"));
});

// ─── @desc   Get all chapters for a specific course
// ─── @route  GET /api/v1/content/courses/:courseId/chapters
// ─── @access Student
export const getChaptersByCourse = asyncHandler(async (req, res) => {
    const chapters = await Chapter.find({ courseId: req.params.courseId })
        .sort({ orderIndex: 1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, chapters, "Chapters fetched successfully"));
});

// ─── @desc   Create a new course (Admin only)
// ─── @route  POST /api/v1/content/courses
// ─── @access Admin
export const createCourse = asyncHandler(async (req, res) => {
    const course = await Course.create({ ...req.body, createdBy: req.user._id });
    return res.status(201).json(new ApiResponse(201, course, "Course created successfully"));
});

// ─── @desc   Update a course (Admin only)
// ─── @route  PUT /api/v1/content/courses/:id
// ─── @access Admin
export const updateCourse = asyncHandler(async (req, res) => {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!course) throw new ApiError(404, "Course not found");
    return res.status(200).json(new ApiResponse(200, course, "Course updated successfully"));
});

// ─── @desc   Get a chapter with its concepts and media refs
// ─── @route  GET /api/v1/content/chapters/:id
// ─── @access Student
export const getChapterById = asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id)
        .populate("concepts", "title difficulty skillTags")
        .lean();

    if (!chapter) throw new ApiError(404, "Chapter not found");

    return res.status(200).json(new ApiResponse(200, chapter, "Chapter fetched successfully"));
});

export const createChapter = asyncHandler(async (req, res) => {
    const { courseId, title, description, orderIndex, isOfflineAvailable } = req.body;

    // 1. Create the chapter
    const chapter = await Chapter.create({
        courseId,
        title,
        description,
        orderIndex,
        isOfflineAvailable
    });

    // 2. Link the chapter to the course (CRITICAL: without this, it won't show up in Course populates)
    await Course.findByIdAndUpdate(
        courseId,
        { $push: { chapters: chapter._id } }
    );

    return res.status(201).json(new ApiResponse(201, chapter, "Chapter created successfully and linked to course"));
});

// ─── @desc   Update chapter content sections (text, images, diagrams)
// ─── @route  PUT /api/v1/content/chapters/:id/content
// ─── @access Teacher / Admin
export const updateChapterContent = asyncHandler(async (req, res) => {
    const { contentSections } = req.body;

    if (!Array.isArray(contentSections)) {
        throw new ApiError(400, "contentSections must be an array");
    }

    // Validate each section
    for (const section of contentSections) {
        if (!["text", "image", "diagram"].includes(section.type)) {
            throw new ApiError(400, `Invalid section type: ${section.type}`);
        }
        if (section.type === "text" && !section.body?.trim()) {
            throw new ApiError(400, "Text sections must have a body");
        }
        if ((section.type === "image" || section.type === "diagram") && !section.url?.trim()) {
            throw new ApiError(400, `${section.type} sections must have a url`);
        }
    }

    const chapter = await Chapter.findByIdAndUpdate(
        req.params.id,
        { contentSections },
        { new: true, runValidators: true }
    );

    if (!chapter) throw new ApiError(404, "Chapter not found");

    return res.status(200).json(new ApiResponse(200, chapter, "Chapter content updated successfully"));
});

// ─── @desc   Get a single concept (atomic learning node)
// ─── @route  GET /api/v1/content/concepts/:id
// ─── @access Student
export const getConceptById = asyncHandler(async (req, res) => {
    const concept = await Concept.findById(req.params.id).lean();
    if (!concept) throw new ApiError(404, "Concept not found");
    return res.status(200).json(new ApiResponse(200, concept, "Concept fetched successfully"));
});

// ─── @desc   Update a concept (Admin only)
// ─── @route  PUT /api/v1/content/concepts/:id
// ─── @access Admin
export const updateConcept = asyncHandler(async (req, res) => {
    const concept = await Concept.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });
    if (!concept) throw new ApiError(404, "Concept not found");

    return res.status(200).json(new ApiResponse(200, concept, "Concept updated successfully"));
});

// ─── @desc   Save a student's text highlight and generate AI summary (DUMMY for now)
// ─── @route  POST /api/v1/content/highlight
// ─── @access Student
// ─── AI INTEGRATION: notes.service.generateSummary() currently returns a dummy response.
//     When you connect GPT-4o in notes.service.js, real summaries will appear automatically.
export const saveHighlight = asyncHandler(async (req, res) => {
    const { conceptId, chapterId, highlightedText } = req.body;

    const note = await noteService.generateSummary({
        userId: req.user._id,
        conceptId,
        chapterId,
        highlightedText,
    });

    return res.status(201).json(new ApiResponse(201, note, "Highlight saved and summary generated"));
});

// ─── @desc   Get all saved notes for the logged-in student
// ─── @route  GET /api/v1/content/notes
// ─── @access Student
export const getUserNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ userId: req.user._id })
        .populate("chapterId", "title")
        .sort({ createdAt: -1 })
        .lean();

    return res.status(200).json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

// ─── @desc   Delete a specific note
// ─── @route  DELETE /api/v1/content/notes/:id
// ─── @access Student (Owner only)
export const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findOne({ _id: req.params.id, userId: req.user._id });

    if (!note) {
        throw new ApiError(404, "Note not found or you do not have permission to delete it");
    }

    await Note.findByIdAndDelete(req.params.id);

    return res.status(200).json(new ApiResponse(200, {}, "Note deleted successfully"));
});

// ─── @desc   Full-text search across all content
// ─── @route  GET /api/v1/content/search?q=
// ─── @access Student
// ─── AI INTEGRATION (Phase 2): Right now this uses MongoDB regex (basic).
//     TO USE ELASTICSEARCH: When Elasticsearch is set up, call search.service.search(q)
//     instead of the MongoDB query below. Elasticsearch gives ranked, typo-tolerant results.
export const searchContent = asyncHandler(async (req, res) => {
    const q = req.query.q?.trim();
    if (!q) throw new ApiError(400, "Search query is required");

    // Basic MongoDB regex search — replace with Elasticsearch in Phase 2
    const concepts = await Concept.find({
        $or: [
            { title: { $regex: q, $options: "i" } },
        ],
    }).select("title skillTags difficulty").limit(20).lean();

    return res.status(200).json(
        new ApiResponse(200, { results: concepts, total: concepts.length }, "Search completed")
    );
});

// ─── @desc   Generate an AI cheatsheet for a chapter
// ─── @route  GET /api/v1/content/chapters/:id/cheatsheet
// ─── @access Student
export const generateCheatsheet = asyncHandler(async (req, res) => {
    const chapter = await Chapter.findById(req.params.id).lean();
    if (!chapter) throw new ApiError(404, "Chapter not found");

    // Build context from chapter content
    const textParts = [`Chapter: ${chapter.title}`];
    if (chapter.description) textParts.push(chapter.description);
    const sections = (chapter.contentSections || []).sort(
        (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
    );
    for (const section of sections) {
        if (section.type === "text" && section.body) textParts.push(section.body);
        if (section.caption) textParts.push(`[${section.type}]: ${section.caption}`);
    }

    let chapterContent = textParts.join("\n\n");
    if (chapterContent.length > 4000) chapterContent = chapterContent.substring(0, 4000) + "...";

    const prompt = `You are an expert teacher creating a VISUAL CHEATSHEET / quick-revision flashcard for students. Based on the chapter content below, create a comprehensive cheatsheet. Make it visually structured and easy to scan.

Chapter Content:
${chapterContent}

Return ONLY valid JSON (no markdown, no explanation) in this format:
{
  "title": "Chapter title",
  "emoji": "relevant emoji",
  "sections": [
    {
      "heading": "🔑 Key Concepts",
      "type": "bullets",
      "items": ["point 1", "point 2", ...]
    },
    {
      "heading": "📐 Formulas & Rules",
      "type": "formulas",
      "items": ["formula 1", "formula 2", ...]
    },
    {
      "heading": "📖 Definitions",
      "type": "definitions",
      "items": [{"term": "term1", "meaning": "meaning1"}, ...]
    },
    {
      "heading": "💡 Remember",
      "type": "tips",
      "items": ["memory tip 1", "mnemonic 1", ...]
    },
    {
      "heading": "⚡ Quick Summary",
      "type": "summary",
      "items": ["1-2 line summary of whole chapter"]
    }
  ]
}

Include only sections that are relevant. If chapter is about math, include formulas. If history, focus on key events and dates. Be concise but comprehensive.`;

    try {
        logger.info("Generating cheatsheet for chapter", { chapterId: chapter._id });
        const aiResponse = await generateContent(prompt, 5000);

        if (aiResponse) {
            let jsonText = aiResponse.replace(/```(json)?/gi, "").trim();

            let cheatsheet;
            try {
                cheatsheet = JSON.parse(jsonText);
            } catch (parseErr) {
                // JSON truncated — try to repair it
                logger.warn("Cheatsheet JSON truncated, attempting repair", { error: parseErr.message });

                // Find the last complete section by looking for last complete }] pattern
                // Strategy: find all complete section objects and wrap them
                let repaired = jsonText;

                // Try to close open strings and brackets
                // Remove any trailing incomplete string/object
                const lastCompleteArray = repaired.lastIndexOf("]");
                const lastCompleteObj = repaired.lastIndexOf("}");

                if (lastCompleteArray > 0 || lastCompleteObj > 0) {
                    // Find the last point where we have a complete items array
                    const lastGoodSection = repaired.lastIndexOf('"items"');
                    if (lastGoodSection > 0) {
                        // Find the enclosing ] for this items array
                        let bracketPos = repaired.indexOf("]", lastGoodSection);
                        if (bracketPos > 0) {
                            // Check if there's a } after it (closing the section)
                            let closeBrace = repaired.indexOf("}", bracketPos);
                            if (closeBrace > 0) {
                                repaired = repaired.substring(0, closeBrace + 1) + "]}";
                            } else {
                                repaired = repaired.substring(0, bracketPos + 1) + "}]}";
                            }
                        }
                    }
                }

                try {
                    cheatsheet = JSON.parse(repaired);
                    logger.info("Successfully repaired truncated cheatsheet JSON");
                } catch (_) {
                    // Last resort: extract title and any complete sections manually
                    const titleMatch = jsonText.match(/"title"\s*:\s*"([^"]+)"/);
                    const emojiMatch = jsonText.match(/"emoji"\s*:\s*"([^"]+)"/);
                    cheatsheet = {
                        title: titleMatch ? titleMatch[1] : chapter.title,
                        emoji: emojiMatch ? emojiMatch[1] : "📋",
                        sections: [{
                            heading: "📖 Chapter Overview",
                            type: "bullets",
                            items: [chapter.description || "AI response was too long. Try again for a shorter chapter."]
                        }],
                    };
                }
            }

            // Convert cheatsheet sections into flashcards (front/back) and save to Notes
            const flashcards = [];
            for (const sec of (cheatsheet.sections || [])) {
                if (sec.type === "definitions" && Array.isArray(sec.items)) {
                    for (const item of sec.items) {
                        if (typeof item === "object" && item.term && item.meaning) {
                            flashcards.push({ front: item.term, back: item.meaning });
                        }
                    }
                } else if (sec.type === "formulas" && Array.isArray(sec.items)) {
                    for (const item of sec.items) {
                        if (typeof item === "string") {
                            flashcards.push({ front: `📐 Formula: ${item}`, back: `${sec.heading}: ${item}` });
                        }
                    }
                } else if (Array.isArray(sec.items)) {
                    for (const item of sec.items) {
                        const text = typeof item === "string" ? item : JSON.stringify(item);
                        if (text.length > 5) {
                            flashcards.push({ front: `${sec.heading}`, back: text });
                        }
                    }
                }
            }

            // Save as a Note with flashcards so it appears in /flashcards page
            try {
                if (flashcards.length > 0) {
                    await Note.findOneAndUpdate(
                        { userId: req.user._id, chapterId: chapter._id, highlightedText: `__cheatsheet__${chapter._id}` },
                        {
                            userId: req.user._id,
                            conceptId: chapter.concepts?.[0] || chapter._id,
                            chapterId: chapter._id,
                            highlightedText: `__cheatsheet__${chapter._id}`,
                            summary: `${cheatsheet.emoji || "📋"} ${cheatsheet.title || chapter.title} — AI Cheatsheet`,
                            flashcards,
                            cheatsheetData: cheatsheet,
                        },
                        { upsert: true, new: true }
                    );
                }
            } catch (saveErr) {
                logger.warn("Failed to save cheatsheet to notes", { error: saveErr.message });
            }

            return res.status(200).json(
                new ApiResponse(200, cheatsheet, "Cheatsheet generated and saved to flashcards!")
            );
        }
    } catch (err) {
        logger.error("Cheatsheet generation failed", { error: err.message });
    }

    // Fallback
    return res.status(200).json(
        new ApiResponse(200, {
            title: chapter.title,
            emoji: "📋",
            sections: [{
                heading: "📖 Chapter Overview",
                type: "bullets",
                items: [chapter.description || "Review this chapter for key concepts."]
            }],
        }, "Basic cheatsheet generated (AI unavailable)")
    );
});
