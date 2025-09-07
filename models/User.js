const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    avatar: { type: String, default: null },
    phone: { type: String, default: null },
    location: { type: String, default: null },
    experience: { type: String, default: null },
    currentRole: { type: String, default: null },
    targetRole: { type: String, default: null },
    skills: { type: [String], default: [] }
  },
  progress: {
    resumeScore: { type: Number, default: 0 },
    interviewScores: { type: [Number], default: [] },
    skillsImproved: { type: [String], default: [] },
    totalQuizzesTaken: { type: Number, default: 0 }
  },
  resumes: { type: [String], default: [] }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);