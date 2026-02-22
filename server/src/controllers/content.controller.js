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
import * as noteService from "../services/notes.service.js";

// ─── @desc   List all courses available to the logged-in student
// ─── @route  GET /api/v1/content/courses
// ─── @access Student
export const getCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find({ isPublished: true })
        .select("courseName subject grade board language createdAt")
        .lean();

    return res.status(200).json(new ApiResponse(200, courses, "Courses fetched successfully"));
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

// ─── @desc   Create a chapter (Admin only)
// ─── @route  POST /api/v1/content/chapters
// ─── @access Admin
export const createChapter = asyncHandler(async (req, res) => {
    const chapter = await Chapter.create(req.body);
    return res.status(201).json(new ApiResponse(201, chapter, "Chapter created successfully"));
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
