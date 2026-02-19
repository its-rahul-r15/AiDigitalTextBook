import mongoose from "mongoose";

const emotionBehaviorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  pauseCount: {
    type: Number,
    min: 0,
    max: 500,
    default: 0
  },
  retryCount: {
    type: Number,
    default: 0
  },
  avgResponseTime: {
    type: Number
  },
  inferredState: {
    type: String,
    enum: ["confused", "focused", "frustrated"]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("EmotionBehavior", emotionBehaviorSchema);
