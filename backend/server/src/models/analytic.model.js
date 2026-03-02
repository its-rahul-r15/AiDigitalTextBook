import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  monthlyProgress: {
    type: Number,
    min: 0,
    max: 100
  },
   weeklyProgress: {
    type: Number,
    min: 0,
    max: 100
  },
   dayProgress: {
    type: Number,
    min: 0,
    max: 100
  },
  weakSkills: [{
    type: String
  }],
   ongoingSkills: [{
    type: String
  }],
  strongSkills: [{
    type: String
  }],
  reportGeneratedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Analytics", analyticsSchema);
