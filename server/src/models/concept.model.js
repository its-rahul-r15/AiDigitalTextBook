import mongoose from "mongoose";

const conceptSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  skillTags: [{
    type: String
  }],
  difficultyLevel: {
    type: Number,
    min: 1,
    max: 5
  },
  mediaLinks: [{
    type: String
  }],
  languageAvailable: [{
    type: String,
    enum: ["en", "hi"]
  }]
}, { timestamps: true });

module.exports = mongoose.model("Concept", conceptSchema);

