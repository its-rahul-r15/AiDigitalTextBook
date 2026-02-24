import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  conceptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concept",
    required: true
  },
  type: {
    type: String,
    enum: ["MCQ", "subjective", "numeric"],
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 5
  },
  questionText: {
    type: String,
    required: true
  },
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  solutionSteps: [{
    type: String
  }],
  hintAvailable: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);
