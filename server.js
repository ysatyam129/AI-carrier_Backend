const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = require('../database/connection');
const seedQuizData = require('./utils/seedQuiz');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const resumeRoutes = require('./routes/resume');
const interviewRoutes = require('./routes/interview');
const skillRoutes = require('./routes/skills');
const quizRoutes = require('./routes/quiz');

const app = express();

// Basic middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/quiz', quizRoutes);

// Health check
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({ 
    status: 'OK', 
    message: 'AI Career Coach API is running',
    database: dbState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Test database and get user count
app.get('/api/test-db', async (req, res) => {
  try {
    const User = require('./models/User');
    const { Quiz } = require('./models/Quiz');
    
    const userCount = await User.countDocuments();
    const quizCount = await Quiz.countDocuments();
    
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      userCount,
      quizCount,
      message: 'Database working properly' 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message 
    });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = 5001; // Fixed port to avoid conflicts

// Start server with database
const startServer = async () => {
  try {
    console.log('🚀 Starting AI Career Coach Server...');
    
    // Connect to database first
    await connectDB();
    console.log('✅ Database connected successfully');
    
    // Seed quiz data in background (non-blocking)
    setTimeout(async () => {
      try {
        const { Quiz } = require('./models/Quiz');
        const quizCount = await Quiz.countDocuments();
        if (quizCount === 0) {
          console.log('📝 Seeding quiz data...');
          await seedQuizData();
        }
      } catch (error) {
        console.log('⚠️ Quiz seeding will be done later');
      }
    }, 2000);
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();