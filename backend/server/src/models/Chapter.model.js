// ─── Chapter.model.js ────────────────────────────────────────────────────────
// A chapter belongs to one Course and contains an ordered list of Concepts.
// contentSections store text/image/diagram content added by teachers.
// mediaRefs store image/diagram links for each concept in the chapter.

import mongoose from "mongoose";

const mediaRefSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["image", "diagram"],
        required: true,
    },
    url: { type: String, required: true },
    // Which concept this media belongs to (so we can show the right media on a concept page)
    conceptId: { type: mongoose.Schema.Types.ObjectId, ref: "Concept" },
});

// Content sections added by teachers — text paragraphs, images, diagrams
const contentSectionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["text", "image", "diagram"],
        required: true,
    },
    body: { type: String },       // for text sections (supports markdown/rich text)
    url: { type: String },        // for image/diagram sections
    caption: { type: String },    // optional caption for images/diagrams
    orderIndex: { type: Number, default: 0 },
}, { _id: true });

const chapterSchema = new mongoose.Schema(
    {
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Course reference is required"],
            index: true,
        },
        title: {
            type: String,
            required: [true, "Chapter title is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        // orderIndex determines the display order of chapters inside a course (1, 2, 3 ...)
        orderIndex: {
            type: Number,
            required: true,
            default: 1,
            index: true,
        },
        // List of concept document IDs in the order they should be taught
        concepts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Concept" }],
        // All media attachments for this chapter, grouped here for easy prefetching
        mediaRefs: [mediaRefSchema],
        // Teacher-managed content sections (text, images, diagrams)
        contentSections: [contentSectionSchema],
        // If true, the frontend can cache this chapter for offline use
        isOfflineAvailable: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
