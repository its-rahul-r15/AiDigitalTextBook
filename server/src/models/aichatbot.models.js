import mongoose from 'mongoose'

const aiChatLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concept"
  },
  userQuery: {
    type: String,
    required: true
  },
  aiResponse: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    enum: ["learning", "exam"]
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("AIChatLog", aiChatLogSchema);
