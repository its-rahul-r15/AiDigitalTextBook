// ─── Chapter.model.js ────────────────────────────────────────────────────────
// A chapter belongs to one Course and contains an ordered list of Concepts.
// mediaRefs store video/audio/image links for each concept in the chapter.

import mongoose from "mongoose";

const mediaRefSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["video", "audio", "animation", "image"],
        required: true,
    },
    url: { type: String, required: true },
    // Which concept this media belongs to (so we can show the right media on a concept page)
    conceptId: { type: mongoose.Schema.Types.ObjectId, ref: "Concept" },
});

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
        // If true, the frontend can cache this chapter for offline use
        isOfflineAvailable: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Chapter = mongoose.model("Chapter", chapterSchema);
export default Chapter;
