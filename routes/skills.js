const express = require('express');
const OpenAI = require('openai');
const auth = require('../middleware/auth');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Industry skill demand data
const skillDemandData = [
  { skill: 'JavaScript', demand: 95, growth: 12, jobs: 45000 },
  { skill: 'Python', demand: 92, growth: 18, jobs: 42000 },
  { skill: 'React', demand: 88, growth: 25, jobs: 38000 },
  { skill: 'Node.js', demand: 85, growth: 20, jobs: 35000 },
  { skill: 'AWS', demand: 90, growth: 30, jobs: 40000 },
  { skill: 'Docker', demand: 82, growth: 35, jobs: 28000 },
  { skill: 'Kubernetes', demand: 78, growth: 40, jobs: 25000 },
  { skill: 'Machine Learning', demand: 85, growth: 45, jobs: 32000 },
  { skill: 'Data Science', demand: 83, growth: 38, jobs: 30000 },
  { skill: 'DevOps', demand: 80, growth: 28, jobs: 27000 }
];

// Get skill demand trends
router.get('/demand', (req, res) => {
  try {
    res.json({
      skills: skillDemandData,
      lastUpdated: new Date(),
      totalJobs: skillDemandData.reduce((sum, skill) => sum + skill.jobs, 0)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate cover letter
router.post('/cover-letter', auth, async (req, res) => {
  try {
    const { jobTitle, company, jobDescription, userProfile } = req.body;
    
    const prompt = `
    Generate a professional cover letter for:
    Job Title: ${jobTitle}
    Company: ${company}
    Job Description: ${jobDescription}
    
    User Profile: ${JSON.stringify(userProfile)}
    
    Make it ATS-friendly, professional, and personalized. Keep it under 300 words.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    res.json({
      coverLetter: response.choices[0].message.content,
      generatedAt: new Date()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to generate cover letter',
      coverLetter: `Dear Hiring Manager,

I am writing to express my strong interest in the ${req.body.jobTitle} position at ${req.body.company}. With my background in software development and passion for technology, I am excited about the opportunity to contribute to your team.

My experience includes working with modern technologies and frameworks that align well with your requirements. I am particularly drawn to ${req.body.company}'s mission and would love to bring my skills to help achieve your goals.

I would welcome the opportunity to discuss how my background and enthusiasm can contribute to your team's success.

Best regards,
${req.body.userProfile?.name || 'Your Name'}`
    });
  }
});

// Get personalized career tips
router.get('/career-tips', auth, async (req, res) => {
  try {
    const tips = [
      "Focus on learning in-demand skills like React, Python, and AWS",
      "Build projects that showcase your problem-solving abilities",
      "Contribute to open-source projects to build your portfolio",
      "Network with professionals in your target industry",
      "Keep your resume updated with quantifiable achievements",
      "Practice coding interviews regularly on platforms like LeetCode",
      "Stay updated with industry trends and technologies",
      "Consider getting relevant certifications in your field"
    ];
    
    res.json({
      tips: tips.slice(0, 5),
      personalizedFor: req.user.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;