import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    role: {
    type: String,
    enum: ["student", "teacher", "admin"],
    required: true
  },
  fullName: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 100
  },
  schoolName:{
    type: String,
    required: true,
    minlength: 2,
    Maxlenght: 200
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  gradeLevel: {
    type: Number,
    min: 6,
    max: 12
  },
  boardName:{
    type: String,
    required: true
  },
  
  region: {
    type: String
  },
  languagePreference: {
    type: String,
    enum: ["en", "hi"]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);