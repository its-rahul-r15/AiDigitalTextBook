// ─── Note.model.js ───────────────────────────────────────────────────────────
// Smart notes created by the AI from student's text highlights.
// A student can highlight text on a concept page → AI generates a summary & flashcards.
//
// TO ADD AI LATER:
//   1. When a student saves a highlight, call notes.service.js → generateSummary()
//   2. That function will send the highlighted text to GPT-4o with a summarisation prompt
//   3. The response (summary + flashcards) gets stored in this document
//   4. For now we store a placeholder summary so the frontend can still work

import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema(
    {
        front: { type: String, required: true }, // Question / term
        back: { type: String, required: true },  // Answer / definition
    },
    { _id: false }
);

const noteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        conceptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Concept",
            required: true,
        },
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
        },
        // The original text the student highlighted
        highlightedText: { type: String, required: true },
        // AI-generated summary of the highlight
        // TO ADD AI: Replace "Dummy summary" with actual GPT-4o output from notes.service.js
        summary: { type: String, default: "" },
        // AI-generated flashcards from this highlight
        // TO ADD AI: Populate this array from GPT-4o output in notes.service.js
        flashcards: [flashcardSchema],
    },
    { timestamps: true }
);

const Note = mongoose.model("Note", noteSchema);
export default Note;
