// ─── notes.controller.js ─────────────────────────────────────────────────────
// Smart notes: summarise highlights and generate flashcards.
// AI calls go through notes.service.js (currently DUMMY mode).

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import Note from "../models/Note.model.js";
import * as notesService from "../services/notes.service.js";
import { paginate } from "../utils/paginate.util.js";

// ─── @desc   Generate AI summary from student's highlighted text (DUMMY now)
// ─── @route  POST /api/v1/notes/summarize
// ─── @access Student
// ─── AI INTEGRATION: notes.service.generateSummary() returns dummy text.
//     Connect GPT-4o in notes.service.js to get real summaries (steps are in that file).
export const summarizeHighlight = asyncHandler(async (req, res) => {
    const { conceptId, chapterId, highlightedText } = req.body;
    if (!highlightedText) throw new ApiError(400, "highlightedText is required");

    const note = await notesService.generateSummary({
        userId: req.user._id,
        conceptId,
        chapterId,
        highlightedText,
    });

    return res.status(201).json(new ApiResponse(201, note, "Summary generated (DUMMY — connect AI for real summaries)"));
});

// ─── @desc   Generate flashcards from a chapter or highlight (DUMMY now)
// ─── @route  POST /api/v1/notes/flashcards
// ─── @access Student
// ─── AI INTEGRATION: notes.service.generateFlashcards() returns dummy flashcards.
//     Connect GPT-4o in notes.service.js → generateFlashcards() for real output.
export const generateFlashcards = asyncHandler(async (req, res) => {
    const { conceptId, highlightedText } = req.body;
    if (!conceptId) throw new ApiError(400, "conceptId is required");

    const flashcards = await notesService.generateFlashcards({
        userId: req.user._id,
        conceptId,
        highlightedText: highlightedText || "",
    });

    return res.status(200).json(new ApiResponse(200, { flashcards }, "Flashcards generated (DUMMY — connect AI for real flashcards)"));
});

// ─── @desc   Get all saved notes for the logged-in student
// ─── @route  GET /api/v1/notes?conceptId=&cursor=&limit=
// ─── @access Student
export const getNotes = asyncHandler(async (req, res) => {
    const { conceptId, cursor, limit = 20 } = req.query;
    const filter = { userId: req.user._id };
    if (conceptId) filter.conceptId = conceptId;

    const { data, nextCursor, hasMore } = await paginate(Note, filter, cursor, parseInt(limit));

    return res.status(200).json(new ApiResponse(200, { notes: data, nextCursor, hasMore }, "Notes fetched"));
});

// ─── @desc   Delete a note
// ─── @route  DELETE /api/v1/notes/:id
// ─── @access Student
export const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!note) throw new ApiError(404, "Note not found or you do not have permission");

    return res.status(200).json(new ApiResponse(200, {}, "Note deleted successfully"));
});
