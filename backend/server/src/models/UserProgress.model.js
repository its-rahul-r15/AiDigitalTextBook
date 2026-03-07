import mongoose from "mongoose";

const userProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        lastCourseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
        },
        lastChapterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chapter",
        },
        completedChapters: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Chapter",
            },
        ],
        studyTimeMinutes: {
            type: Number,
            default: 0,
        },
        weeklyGoalMinutes: {
            type: Number,
            default: 960, // 16 hours
        },
        // Map of chapterId → best quiz score (used for 70% pass gate)
        chapterQuizScores: {
            type: Map,
            of: Number,
            default: {},
        },
    },
    { timestamps: true }
);

// Ensure one progress record per user
userProgressSchema.index({ userId: 1 }, { unique: true });

const UserProgress = mongoose.model("UserProgress", userProgressSchema);
export default UserProgress;
