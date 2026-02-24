import mongoose from "mongoose";

const gamificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  skillTag: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ["Newbie","Apprentice","Professional","Specialist"]
  },
  achievedAt: {
    type: Date,
    default: Date.nows
  }
});

module.exports = mongoose.model("Gamification", gamificationSchema);

