// models/Course.js
import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    enum: ["Math", "Science","Social-Science","Hindi"]
  },
  syllabusLocked: {
    type: Boolean,
    default: false
  },
  region: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
