import mongoose from "mongoose";

const userPerformanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concept",
    required: true
  },
  attempts: {
    type: Number,
    min: 0,
    max: 1000,
    default: 0
  },
  correctAttempts: {
    type: Number,
    default: 0
  },
  averageTime: {
    type: Number
  },
  retries: {
    type: Number,
    default: 0
  },
  masteryLevel: {
    type: Number,
    min: 0,
    max: 1
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("UserPerformance", userPerformanceSchema);
