// ─── course.models.js ────────────────────────────────────────────────────────
// Top-level curriculum container. A Course has many Chapters, each with Concepts.

import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    subject: {
      type: String,
      enum: ["Mathematics", "Science", "Social Science", "Hindi", "English", "Other"],
      index: true,
    },
    // Class/grade level (6 to 12)
    grade: {
      type: Number,
      min: 6,
      max: 12,
      index: true,
    },
    // Education board
    board: {
      type: String,
      enum: ["CBSE", "ICSE", "STATE", "IB", "OTHER"],
      index: true,
    },
    // Ordered list of chapter IDs in this course
    chapters: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chapter" }],
    language: {
      type: String,
      enum: ["en", "hi"],
      default: "en",
    },
    // Must be true before students can see this course
    isPublished: { type: Boolean, default: false },
    // Admin who created this course
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);
export default Course;
