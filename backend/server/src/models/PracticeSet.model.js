// ─── PracticeSet.model.js ────────────────────────────────────────────────────
// A PracticeSet is a collection of MCQ questions created by a Teacher
// and assigned to their ClassRoom. The teacher can toggle `isActive` to
// show / hide the practice from students.

import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
    {
        questionText: { type: String, required: true },
        options: {
            type: [String],
            validate: {
                validator: (v) => v.length >= 2,
                message: "A question must have at least 2 options",
            },
        },
        correctAnswer: { type: String, required: true },
        marks: { type: Number, default: 1, min: 1 },
    },
    { _id: true }
);

const practiceSetSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Practice set title is required"],
            trim: true,
        },
        description: { type: String, trim: true },
        // "manual" = teacher typed questions, "ai" = AI generated from chapter/topic
        generationMode: {
            type: String,
            enum: ["manual", "ai"],
            default: "manual",
        },
        // Optional: which chapter this practice is linked to
        chapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
            index: true,
        },
        // Optional: free-text topic when not using a chapter
        topic: { type: String, trim: true },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        classroomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ClassRoom",
            required: true,
            index: true,
        },
        questions: {
            type: [questionSchema],
            validate: {
                validator: (v) => v.length >= 1,
                message: "Practice set must have at least 1 question",
            },
        },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Quick lookup: all sets for a classroom
practiceSetSchema.index({ classroomId: 1, isActive: 1 });

const PracticeSet = mongoose.model("PracticeSet", practiceSetSchema);
export default PracticeSet;
