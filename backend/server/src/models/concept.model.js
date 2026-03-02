// ─── concept.model.js ────────────────────────────────────────────────────────
// An atomic learning node — the smallest unit of content.
// Each concept belongs to a Chapter and has skillTags for adaptive engine matching.
//
// explanationModes: Pre-written alternative explanations created by content team.
// TO ADD AI: Instead of pre-written modes, call aiTutor.service.explainConcept()
//            to generate visual/story/steps/analogy explanations on-the-fly.

import mongoose from "mongoose";

const explanationModeSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["visual", "story", "steps", "analogy"],
      required: true,
    },
    content: { type: String, required: true },
  },
  { _id: false }
);

const conceptSchema = new mongoose.Schema(
  {
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Concept title is required"],
      trim: true,
    },
    // Rich text / Markdown content — the main study material
    content: { type: String },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      index: true,
    },
    // Tags used by the adaptive engine (e.g. ["fractions", "algebra"])
    skillTags: [{ type: String, index: true }],
    // Concepts that must be understood before this one
    prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Concept" }],
    // Primary media URL for this concept (video or animation)
    // TO ADD MEDIA: Upload to S3 via media.service.js and store CloudFront URL here
    mediaRef: { type: String },
    // Pre-written alternative explanations (optional — AI can generate these live too)
    explanationModes: [explanationModeSchema],
    // Display order within the chapter
    orderIndex: { type: Number, default: 1 },
  },
  { timestamps: true }
);

const Concept = mongoose.model("Concept", conceptSchema);
export default Concept;
