// ─── ClassRoom.model.js ──────────────────────────────────────────────────────
// A ClassRoom is created by a Teacher and contains enrolled students.
// The teacher can set AI behaviour overrides for the whole class.
//
// AI Override examples:
//   - "hints_disabled"        → AI tutor won't give hints during exam week
//   - "exam_mode_forced"      → All exercises run in exam mode (no hints, strict time)
//   - "difficulty_locked:3"   → Adaptive engine won't change difficulty above 3
//
// These overrides are checked in aiTutor.service.js and adaptive.service.js.
// TO ADD AI: Read aiOverrides before each AI call and apply the matching rules.

import mongoose from "mongoose";

const aiOverrideSchema = new mongoose.Schema(
    {
        // Rule identifier (e.g. "hints_disabled", "exam_mode_forced")
        rule: { type: String, required: true },
        // Value associated with the rule (boolean, string, or number)
        value: { type: mongoose.Schema.Types.Mixed },
        appliedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const classRoomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Classroom name is required"],
            trim: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Array of student user IDs enrolled in this class
        students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        // Which course this classroom is following
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            index: true,
        },
        // Teacher-set rules that modify AI behaviour for the whole class
        aiOverrides: [aiOverrideSchema],
    },
    { timestamps: true }
);

const ClassRoom = mongoose.model("ClassRoom", classRoomSchema);
export default ClassRoom;
