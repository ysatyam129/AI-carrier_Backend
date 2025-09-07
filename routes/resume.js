const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Initialize OpenAI client lazily
let openai;
const getOpenAI = () => {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
};

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files allowed'));
    }
  }
});

// Parse resume text
const parseResume = async (buffer, mimetype) => {
  try {
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
  } catch (error) {
    throw new Error('Failed to parse resume');
  }
};

// Calculate ATS score using AI
const calculateATSScore = async (resumeText, jobDescription = '') => {
  try {
    const prompt = `
    Analyze this resume and provide an ATS score (0-100) and suggestions:
    
    Resume: ${resumeText}
    Job Description: ${jobDescription || 'General tech role'}
    
    Provide response in JSON format:
    {
      "atsScore": number,
      "suggestions": ["suggestion1", "suggestion2"],
      "missingKeywords": ["keyword1", "keyword2"],
      "strengths": ["strength1", "strength2"]
    }`;

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    return {
      atsScore: 65,
      suggestions: ["Add more relevant keywords", "Improve formatting"],
      missingKeywords: ["JavaScript", "React"],
      strengths: ["Good experience section"]
    };
  }
};

// Upload and analyze resume
router.post('/upload', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const resumeText = await parseResume(req.file.buffer, req.file.mimetype);
    const { jobDescription } = req.body;
    
    const analysis = await calculateATSScore(resumeText, jobDescription);
    
    // Save to user profile
    const user = await User.findById(req.user._id);
    user.resumes.push({
      filename: req.file.originalname,
      uploadDate: new Date(),
      atsScore: analysis.atsScore,
      suggestions: analysis.suggestions
    });
    user.progress.resumeScore = analysis.atsScore;
    await user.save();

    res.json({
      ...analysis,
      resumeText: resumeText.substring(0, 500) + '...'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get resume history
router.get('/history', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.resumes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;