const express = require('express');
const { Quiz, QuizAttempt } = require('../models/Quiz');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get quiz questions by category
router.get('/quiz/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    const { difficulty = 'Medium', limit = 10 } = req.query;
    
    const questions = await Quiz.find({ 
      category: category.toUpperCase(),
      difficulty 
    }).limit(parseInt(limit));
    
    // Remove correct answers from response
    const questionsForUser = questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      category: q.category,
      difficulty: q.difficulty
    }));
    
    res.json(questionsForUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit quiz answer
router.post('/quiz/submit', auth, async (req, res) => {
  try {
    const { quizId, selectedAnswer, timeSpent } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const isCorrect = quiz.correctAnswer === selectedAnswer;
    
    const attempt = new QuizAttempt({
      userId: req.user._id,
      quizId,
      selectedAnswer,
      isCorrect,
      timeSpent,
      category: quiz.category
    });
    
    await attempt.save();
    
    // Update user progress
    const user = await User.findById(req.user._id);
    user.progress.totalQuizzesTaken += 1;
    user.progress.interviewScores.push({
      date: new Date(),
      score: isCorrect ? 1 : 0,
      category: quiz.category
    });
    await user.save();
    
    res.json({
      isCorrect,
      correctAnswer: quiz.correctAnswer,
      explanation: quiz.explanation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user performance stats
router.get('/performance', auth, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user._id })
      .populate('quizId', 'category difficulty')
      .sort({ createdAt: -1 });
    
    const stats = {
      totalAttempts: attempts.length,
      correctAnswers: attempts.filter(a => a.isCorrect).length,
      categoryWise: {},
      recentScores: []
    };
    
    // Calculate category-wise performance
    attempts.forEach(attempt => {
      const category = attempt.category;
      if (!stats.categoryWise[category]) {
        stats.categoryWise[category] = { total: 0, correct: 0 };
      }
      stats.categoryWise[category].total++;
      if (attempt.isCorrect) stats.categoryWise[category].correct++;
    });
    
    // Recent 10 scores for chart
    stats.recentScores = attempts.slice(0, 10).map(a => ({
      date: a.createdAt,
      score: a.isCorrect ? 100 : 0,
      category: a.category
    }));
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;