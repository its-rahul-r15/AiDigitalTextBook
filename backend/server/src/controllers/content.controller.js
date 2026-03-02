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
