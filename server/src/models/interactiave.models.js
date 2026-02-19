import mongoose from 'mongoose'

const interactiveExerciseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },

  type: {
    type: String,
    enum: ["PYQ", "SamplePaper", "TopicWise", "PracticePaper"],
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  relatedSubjects: [{
    type: String
  }],

  gradeLevel: {
    type: Number,
    min: 1,
    max: 12
  },

  conceptIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Concept"
  }],

  questionIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question"
  }],

  totalMarks: {
    type: Number,
    min: 0
  },

  durationMinutes: {
    type: Number
  },

  difficultyLevel: {
    type: Number,
    min: 1,
    max: 5
  },

  isPublished: {
    type: Boolean,
    default: false
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }

}, { timestamps: true });

module.exports = mongoose.model("InteractiveExercise", interactiveExerciseSchema);
