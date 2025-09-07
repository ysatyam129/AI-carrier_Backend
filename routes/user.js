const express = require('express');
const User = require('../models/User');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const auth = require('../middleware/auth');

const router = express.Router();

// Public dashboard data (for demo purposes)
router.get('/dashboard/public', async (req, res) => {
  try {
    const totalQuestions = await Quiz.countDocuments().catch(() => 0);
    const categories = await Quiz.distinct('category').catch(() => []);
    const totalAttempts = await QuizAttempt.countDocuments().catch(() => 0);
    const correctAttempts = await QuizAttempt.countDocuments({ isCorrect: true }).catch(() => 0);
    
    const recentAttempts = await QuizAttempt.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('quizId', 'category')
      .catch(() => []);
    
    const avgScore = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    
    const dashboardData = {
      stats: {
        resumeScore: 75,
        averageInterviewScore: avgScore,
        totalQuizzes: totalAttempts,
        skillsCount: 8,
        availableQuestions: totalQuestions,
        quizCategories: categories.length
      },
      recentActivity: recentAttempts.map(attempt => ({
        date: attempt.createdAt.toISOString().split('T')[0],
        score: attempt.isCorrect ? 100 : 0,
        type: `${attempt.quizId?.category || 'Quiz'} Quiz`,
        category: attempt.quizId?.category || 'Unknown'
      })),
      quizOverview: {
        totalQuestions,
        categories,
        completedToday: 0,
        averageScore: avgScore
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      stats: {
        resumeScore: 75,
        averageInterviewScore: 0,
        totalQuizzes: 0,
        skillsCount: 8,
        availableQuestions: 0,
        quizCategories: 0
      },
      recentActivity: [],
      quizOverview: {
        totalQuestions: 0,
        categories: [],
        completedToday: 0,
        averageScore: 0
      }
    });
  }
});

// Get user dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const dashboardData = {
      profile: user.profile,
      progress: user.progress,
      stats: {
        resumeScore: user.progress.resumeScore,
        totalQuizzes: user.progress.totalQuizzesTaken,
        averageInterviewScore: user.progress.interviewScores.length > 0 
          ? user.progress.interviewScores.reduce((sum, score) => sum + score.score, 0) / user.progress.interviewScores.length * 100
          : 0,
        skillsCount: user.profile.skills?.length || 0
      },
      recentActivity: user.progress.interviewScores.slice(-5)
    };
    
    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);
    
    // Update profile fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        user.profile[key] = updates[key];
      }
    });
    
    await user.save();
    res.json(user.profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;