const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({ 
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Simple MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    
    // Keep connection alive
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected, reconnecting...');
      mongoose.connect(process.env.MONGO_URI);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5001
  });
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    console.log('📝 Registration:', { name, email });
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be 6+ characters' });
    }
    
    // Direct database operations
    const db = mongoose.connection.db;
    const users = db.collection('users');
    
    // Check existing user
    const existing = await users.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const result = await users.insertOne({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ User created:', result.insertedId);
    
    // Generate token
    const token = jwt.sign(
      { userId: result.insertedId }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: result.insertedId,
        name: name.trim(),
        email: email.toLowerCase().trim()
      }
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message 
    });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔑 Login:', { email });
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected for login');
      return res.status(503).json({ message: 'Database not ready' });
    }
    
    // Direct database operations
    const db = mongoose.connection.db;
    const users = db.collection('users');
    
    // Find user
    const user = await users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    console.log('✅ Login successful:', user._id);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      message: 'Login failed',
      error: error.message 
    });
  }
});

// Seed Quiz Data (both GET and POST for convenience)
app.get('/api/seed-quiz', async (req, res) => {
  await seedQuizData(req, res);
});

app.post('/api/seed-quiz', async (req, res) => {
  await seedQuizData(req, res);
});

async function seedQuizData(req, res) {
  try {
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    
    const count = await quizzes.countDocuments();
    if (count > 0) {
      return res.json({ message: 'Quiz data already exists', count });
    }
    
    const comprehensiveQuestions = [
      // JavaScript Questions
      {
        category: 'JavaScript',
        difficulty: 'Easy',
        question: 'What is the correct way to declare a variable in JavaScript?',
        options: ['var x = 5;', 'variable x = 5;', 'v x = 5;', 'declare x = 5;'],
        correctAnswer: 0,
        explanation: 'var, let, and const are the correct ways to declare variables in JavaScript.',
        tags: ['variables', 'syntax'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'JavaScript',
        difficulty: 'Medium',
        question: 'What does "this" keyword refer to in JavaScript?',
        options: ['The current function', 'The global object', 'The object that calls the function', 'The parent object'],
        correctAnswer: 2,
        explanation: 'The "this" keyword refers to the object that calls the function.',
        tags: ['this', 'context'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'JavaScript',
        difficulty: 'Easy',
        question: 'Which method is used to add an element to the end of an array?',
        options: ['push()', 'pop()', 'shift()', 'unshift()'],
        correctAnswer: 0,
        explanation: 'push() method adds elements to the end of an array.',
        tags: ['arrays', 'methods'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'JavaScript',
        difficulty: 'Medium',
        question: 'What is the difference between == and === in JavaScript?',
        options: ['No difference', '== checks type, === checks value', '=== checks both type and value', '== is faster'],
        correctAnswer: 2,
        explanation: '=== checks both type and value (strict equality), while == only checks value.',
        tags: ['operators', 'comparison'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'JavaScript',
        difficulty: 'Hard',
        question: 'What is a closure in JavaScript?',
        options: ['A function inside another function', 'A way to close a program', 'A function that has access to outer scope', 'A method to end loops'],
        correctAnswer: 2,
        explanation: 'A closure is a function that has access to variables in its outer (enclosing) scope.',
        tags: ['closure', 'scope'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // React Questions
      {
        category: 'React',
        difficulty: 'Easy',
        question: 'What is JSX in React?',
        options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XML', 'JavaScript Extension'],
        correctAnswer: 0,
        explanation: 'JSX stands for JavaScript XML and allows you to write HTML in React.',
        tags: ['jsx', 'syntax'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'React',
        difficulty: 'Easy',
        question: 'Which method is used to create a React component?',
        options: ['React.createComponent()', 'React.Component', 'function Component()', 'Both B and C'],
        correctAnswer: 3,
        explanation: 'React components can be created using class components (React.Component) or functional components.',
        tags: ['components', 'creation'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'React',
        difficulty: 'Medium',
        question: 'What is the purpose of useState hook?',
        options: ['To manage component state', 'To handle side effects', 'To optimize performance', 'To create components'],
        correctAnswer: 0,
        explanation: 'useState hook is used to manage state in functional components.',
        tags: ['hooks', 'state'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'React',
        difficulty: 'Medium',
        question: 'What is the purpose of useEffect hook?',
        options: ['To manage state', 'To handle side effects', 'To create components', 'To optimize rendering'],
        correctAnswer: 1,
        explanation: 'useEffect hook is used to handle side effects like API calls, subscriptions, etc.',
        tags: ['hooks', 'side-effects'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'React',
        difficulty: 'Hard',
        question: 'What is the Virtual DOM?',
        options: ['A copy of the real DOM', 'A JavaScript representation of DOM', 'A faster version of DOM', 'A virtual reality DOM'],
        correctAnswer: 1,
        explanation: 'Virtual DOM is a JavaScript representation of the actual DOM kept in memory.',
        tags: ['virtual-dom', 'performance'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Node.js Questions
      {
        category: 'Node.js',
        difficulty: 'Easy',
        question: 'What is Node.js?',
        options: ['A JavaScript framework', 'A JavaScript runtime environment', 'A database', 'A web browser'],
        correctAnswer: 1,
        explanation: 'Node.js is a JavaScript runtime environment that allows running JavaScript on the server.',
        tags: ['runtime', 'server'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'Node.js',
        difficulty: 'Medium',
        question: 'Which module is used to create a web server in Node.js?',
        options: ['fs', 'http', 'path', 'url'],
        correctAnswer: 1,
        explanation: 'The http module is used to create web servers in Node.js.',
        tags: ['modules', 'server'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'Node.js',
        difficulty: 'Hard',
        question: 'What is the event loop in Node.js?',
        options: ['A loop that handles events', 'A mechanism for non-blocking I/O', 'A way to create loops', 'A debugging tool'],
        correctAnswer: 1,
        explanation: 'The event loop is a mechanism that allows Node.js to perform non-blocking I/O operations.',
        tags: ['event-loop', 'async'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // Python Questions
      {
        category: 'Python',
        difficulty: 'Easy',
        question: 'Which of the following is the correct way to create a list in Python?',
        options: ['list = []', 'list = ()', 'list = {}', 'list = ""'],
        correctAnswer: 0,
        explanation: 'Square brackets [] are used to create lists in Python.',
        tags: ['lists', 'syntax'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'Python',
        difficulty: 'Easy',
        question: 'What is the correct way to create a function in Python?',
        options: ['function myFunc():', 'def myFunc():', 'create myFunc():', 'func myFunc():'],
        correctAnswer: 1,
        explanation: 'Functions in Python are defined using the "def" keyword.',
        tags: ['functions', 'syntax'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'Python',
        difficulty: 'Medium',
        question: 'What is a lambda function in Python?',
        options: ['A named function', 'An anonymous function', 'A class method', 'A built-in function'],
        correctAnswer: 1,
        explanation: 'Lambda functions are anonymous functions defined with the lambda keyword.',
        tags: ['lambda', 'functions'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'Python',
        difficulty: 'Hard',
        question: 'What is the difference between list and tuple?',
        options: ['No difference', 'List is mutable, tuple is immutable', 'Tuple is faster', 'List uses more memory'],
        correctAnswer: 1,
        explanation: 'Lists are mutable (can be changed) while tuples are immutable (cannot be changed).',
        tags: ['data-structures', 'mutability'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // DSA Questions
      {
        category: 'DSA',
        difficulty: 'Easy',
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctAnswer: 1,
        explanation: 'Binary search divides the search space in half with each iteration.',
        tags: ['algorithms', 'search'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'DSA',
        difficulty: 'Easy',
        question: 'Which data structure follows FIFO principle?',
        options: ['Stack', 'Queue', 'Array', 'Tree'],
        correctAnswer: 1,
        explanation: 'Queue follows First In First Out (FIFO) principle.',
        tags: ['queue', 'data-structures'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'DSA',
        difficulty: 'Medium',
        question: 'Which data structure uses LIFO principle?',
        options: ['Queue', 'Stack', 'Array', 'Linked List'],
        correctAnswer: 1,
        explanation: 'Stack follows Last In First Out (LIFO) principle.',
        tags: ['stack', 'data-structures'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'DSA',
        difficulty: 'Hard',
        question: 'What is the worst-case time complexity of QuickSort?',
        options: ['O(n log n)', 'O(n²)', 'O(n)', 'O(log n)'],
        correctAnswer: 1,
        explanation: 'QuickSort has O(n²) worst-case time complexity when pivot is always the smallest or largest element.',
        tags: ['sorting', 'complexity'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // MongoDB Questions
      {
        category: 'MongoDB',
        difficulty: 'Easy',
        question: 'What type of database is MongoDB?',
        options: ['Relational', 'NoSQL Document', 'Graph', 'Key-Value'],
        correctAnswer: 1,
        explanation: 'MongoDB is a NoSQL document database that stores data in JSON-like documents.',
        tags: ['database', 'nosql'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'MongoDB',
        difficulty: 'Medium',
        question: 'Which method is used to insert a document in MongoDB?',
        options: ['insert()', 'insertOne()', 'add()', 'create()'],
        correctAnswer: 1,
        explanation: 'insertOne() method is used to insert a single document in MongoDB.',
        tags: ['crud', 'operations'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // AI/ML Questions
      {
        category: 'AI',
        difficulty: 'Easy',
        question: 'What is supervised learning?',
        options: ['Learning without labels', 'Learning with input-output pairs', 'Learning through rewards', 'Learning by clustering'],
        correctAnswer: 1,
        explanation: 'Supervised learning uses labeled training data with input-output pairs.',
        tags: ['machine-learning', 'supervised'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'AI',
        difficulty: 'Medium',
        question: 'What is overfitting in machine learning?',
        options: ['Model performs well on training data but poorly on test data', 'Model performs poorly on both', 'Model is too simple', 'Model has too few parameters'],
        correctAnswer: 0,
        explanation: 'Overfitting occurs when a model learns the training data too well and fails to generalize.',
        tags: ['overfitting', 'generalization'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        category: 'AI',
        difficulty: 'Hard',
        question: 'What is the vanishing gradient problem?',
        options: ['Gradients become too large', 'Gradients become very small', 'No gradients are computed', 'Gradients are negative'],
        correctAnswer: 1,
        explanation: 'Vanishing gradient problem occurs when gradients become very small during backpropagation.',
        tags: ['neural-networks', 'gradients'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    await quizzes.insertMany(comprehensiveQuestions);
    
    res.json({ 
      success: true, 
      message: 'Quiz data seeded successfully', 
      count: comprehensiveQuestions.length 
    });
    
  } catch (error) {
    console.error('❌ Quiz seed error:', error);
    res.status(500).json({ message: 'Quiz seeding failed', error: error.message });
  }
}

// Interview Quiz Questions (alias for quiz endpoint)
app.get('/api/interview/quiz/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    
    const questions = await quizzes.find({ category })
      .limit(limit)
      .toArray();
    
    res.json({
      success: true,
      questions,
      category,
      count: questions.length
    });
    
  } catch (error) {
    console.error('❌ Interview quiz fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Get Quiz Questions by Category
app.get('/api/quiz/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    
    const questions = await quizzes.find({ category })
      .limit(5)
      .toArray();
    
    res.json({
      success: true,
      questions,
      category,
      count: questions.length
    });
    
  } catch (error) {
    console.error('❌ Quiz fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Submit Quiz Results
app.post('/api/quiz/submit', async (req, res) => {
  try {
    const { category, answers, timeSpent } = req.body;
    
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    const results = db.collection('quiz_results');
    
    // Get correct answers
    const questions = await quizzes.find({ category }).limit(5).toArray();
    
    let correctCount = 0;
    const detailedResults = [];
    
    questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      if (isCorrect) correctCount++;
      
      detailedResults.push({
        question: question.question,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation
      });
    });
    
    const score = Math.round((correctCount / questions.length) * 100);
    
    // Save result
    const result = {
      category,
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      timeSpent,
      detailedResults,
      completedAt: new Date()
    };
    
    await results.insertOne(result);
    
    res.json({
      success: true,
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      detailedResults,
      message: `Great job! You scored ${score}%`
    });
    
  } catch (error) {
    console.error('❌ Quiz submit error:', error);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// Get All Quiz Categories (Public route)
app.get('/api/quiz/categories', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    console.log('📋 Fetching quiz categories...');
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected');
      return res.status(503).json({ 
        success: false,
        message: 'Database not connected',
        categories: []
      });
    }
    
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    
    const categories = await quizzes.distinct('category');
    const categoryStats = [];
    
    for (const category of categories) {
      const count = await quizzes.countDocuments({ category });
      const difficulties = await quizzes.distinct('difficulty', { category });
      
      categoryStats.push({
        name: category,
        questionCount: count,
        difficulties,
        icon: getCategoryIcon(category)
      });
    }
    
    res.json({
      success: true,
      categories: categoryStats,
      totalCategories: categories.length
    });
    
  } catch (error) {
    console.error('❌ Categories fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch categories',
      categories: []
    });
  }
});

// Helper function for category icons
function getCategoryIcon(category) {
  const icons = {
    'JavaScript': '🟨',
    'React': '⚛️',
    'Python': '🐍',
    'Node.js': '🟢',
    'DSA': '🧮',
    'MongoDB': '🍃',
    'AI': '🤖',
    'Development': '💻'
  };
  return icons[category] || '📚';
}

// Get Quiz Stats for Dashboard (Public route)
app.get('/api/quiz/stats', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    console.log('📊 Fetching quiz stats...');
    
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected for stats');
      return res.json({
        success: true,
        totalQuestions: 0,
        totalCategories: 0,
        difficulties: [],
        categoryBreakdown: [],
        recentQuizzes: [],
        completedToday: 0,
        averageScore: 0
      });
    }
    
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    const results = db.collection('quiz_results');
    
    const totalQuestions = await quizzes.countDocuments();
    const categories = await quizzes.distinct('category');
    const difficulties = await quizzes.distinct('difficulty');
    
    const categoryBreakdown = [];
    for (const category of categories) {
      const count = await quizzes.countDocuments({ category });
      categoryBreakdown.push({ category, count });
    }
    
    // Get recent quiz results
    const recentResults = await results.find({})
      .sort({ completedAt: -1 })
      .limit(3)
      .toArray();
    
    const recentQuizzes = recentResults.length > 0 
      ? recentResults.map(result => ({
          category: result.category,
          score: result.score,
          date: result.completedAt.toISOString().split('T')[0]
        }))
      : [
          { category: 'JavaScript', score: 85, date: '2024-01-15' },
          { category: 'React', score: 78, date: '2024-01-14' },
          { category: 'Python', score: 92, date: '2024-01-13' }
        ];
    
    const totalQuizzesTaken = await results.countDocuments();
    const avgScore = recentResults.length > 0 
      ? Math.round(recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length)
      : 85;
    
    res.json({
      success: true,
      totalQuestions,
      totalCategories: categories.length,
      difficulties,
      categoryBreakdown,
      recentQuizzes,
      completedToday: recentResults.filter(r => {
        const today = new Date().toDateString();
        return new Date(r.completedAt).toDateString() === today;
      }).length,
      averageScore: avgScore
    });
    
  } catch (error) {
    console.error('❌ Quiz stats error:', error);
    res.status(500).json({
      success: false,
      totalQuestions: 0,
      totalCategories: 0,
      difficulties: [],
      categoryBreakdown: [],
      recentQuizzes: [],
      completedToday: 0,
      averageScore: 0
    });
  }
});

// Resume Analysis Route with OpenAI Integration
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    console.log('📄 Resume upload request received');
    
    // Get form data from multer
    const jobDescription = req.body.jobDescription || '';
    const uploadedFile = req.file;
    
    // For demo, we'll simulate resume text extraction
    const resumeText = `
    John Doe
    Software Developer
    
    Experience:
    - Frontend Developer at Tech Corp (2022-2024)
    - Built responsive web applications using React and JavaScript
    - Collaborated with cross-functional teams
    - Implemented user interfaces with modern CSS frameworks
    
    Skills:
    - JavaScript, HTML, CSS
    - React, Vue.js
    - Git, GitHub
    - Problem solving
    
    Education:
    - Bachelor's in Computer Science
    - Relevant coursework in web development
    `;
    
    // OpenAI Analysis
    let analysis;
    try {
      if (process.env.OPENAI_API_KEY) {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const prompt = `
Analyze this resume and provide an ATS score (0-100) and detailed feedback:

Resume Content:
${resumeText}

Job Description (if provided):
${jobDescription || 'General software development role'}

Please provide a JSON response with the following structure:
{
  "atsScore": number (0-100),
  "suggestions": ["specific actionable suggestion 1", "specific actionable suggestion 2", "etc"],
  "missingKeywords": ["keyword1", "keyword2", "etc"],
  "strengths": ["strength1", "strength2", "etc"]
}

Focus on:
1. ATS compatibility and keyword optimization
2. Quantifiable achievements and metrics
3. Technical skills alignment
4. Format and structure improvements
5. Industry-specific terminology

Provide practical, actionable advice.`;

        console.log('🤖 Calling OpenAI for resume analysis...');
        
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1500
        });

        const aiResponse = response.choices[0].message.content;
        console.log('✅ OpenAI response received');
        
        // Parse JSON response
        try {
          analysis = JSON.parse(aiResponse);
        } catch (parseError) {
          console.log('⚠️ JSON parse failed, using regex extraction');
          // Fallback: extract data using regex if JSON parsing fails
          const scoreMatch = aiResponse.match(/"atsScore"\s*:\s*(\d+)/);
          analysis = {
            atsScore: scoreMatch ? parseInt(scoreMatch[1]) : 75,
            suggestions: [
              "Add more technical keywords relevant to the job description",
              "Include quantifiable achievements with specific metrics",
              "Optimize resume format for ATS compatibility",
              "Add relevant certifications and skills section"
            ],
            missingKeywords: ["Node.js", "MongoDB", "AWS", "Docker", "TypeScript"],
            strengths: ["Clear experience section", "Good technical skills listed"]
          };
        }
      } else {
        throw new Error('OpenAI API key not configured');
      }
    } catch (aiError) {
      console.log('⚠️ OpenAI analysis failed, using enhanced mock data:', aiError.message);
      
      // Enhanced mock analysis based on job description
      const hasJobDescription = jobDescription.length > 0;
      const jdKeywords = hasJobDescription ? 
        jobDescription.toLowerCase().match(/\b(javascript|react|node|python|java|aws|docker|kubernetes|mongodb|sql|git)\b/g) || [] : [];
      
      analysis = {
        atsScore: hasJobDescription ? Math.floor(Math.random() * 20) + 75 : Math.floor(Math.random() * 25) + 70,
        suggestions: [
          hasJobDescription ? "Align your skills more closely with the job requirements" : "Add more technical keywords to improve ATS compatibility",
          "Include quantifiable achievements (e.g., 'Improved performance by 30%')",
          "Use action verbs to start each bullet point (Built, Developed, Implemented)",
          "Add a professional summary section at the top",
          "Include relevant certifications and technical skills section"
        ],
        missingKeywords: hasJobDescription && jdKeywords.length > 0 ? 
          jdKeywords.slice(0, 4) : ["Node.js", "MongoDB", "AWS", "Docker", "TypeScript"],
        strengths: [
          "Clear professional experience section",
          "Good use of technical terminology",
          "Well-structured education background",
          hasJobDescription ? "Shows relevant experience for the target role" : "Demonstrates technical competency"
        ]
      };
    }
    
    // Ensure score is within valid range
    analysis.atsScore = Math.max(0, Math.min(100, analysis.atsScore));
    
    // Add processing time simulation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`✅ Resume analysis completed with score: ${analysis.atsScore}%`);
    
    res.json({
      ...analysis,
      resumeText: resumeText.substring(0, 200) + '...',
      analysisDate: new Date().toISOString(),
      hasJobDescription: jobDescription.length > 0
    });
    
  } catch (error) {
    console.error('❌ Resume analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to analyze resume',
      error: error.message 
    });
  }
});

// Skills Demand Data for Charts
app.get('/api/skills/demand', (req, res) => {
  try {
    const skillDemandData = [
      { skill: 'JavaScript', demand: 95, growth: 12, jobs: 45000 },
      { skill: 'Python', demand: 92, growth: 18, jobs: 42000 },
      { skill: 'React', demand: 88, growth: 25, jobs: 38000 },
      { skill: 'Node.js', demand: 85, growth: 20, jobs: 35000 },
      { skill: 'AWS', demand: 90, growth: 30, jobs: 40000 },
      { skill: 'Docker', demand: 82, growth: 35, jobs: 28000 },
      { skill: 'Kubernetes', demand: 78, growth: 40, jobs: 25000 },
      { skill: 'AI/ML', demand: 85, growth: 45, jobs: 32000 }
    ];
    
    res.json({
      success: true,
      skills: skillDemandData,
      lastUpdated: new Date(),
      totalJobs: skillDemandData.reduce((sum, skill) => sum + skill.jobs, 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch skills data' });
  }
});

// Dashboard Data with Quiz Integration (Public route for now)
app.get('/api/user/dashboard', async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  try {
    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      return res.json({
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
    
    const db = mongoose.connection.db;
    const quizzes = db.collection('quizzes');
    const results = db.collection('quiz_results');
    
    const totalQuestions = await quizzes.countDocuments();
    const categories = await quizzes.distinct('category');
    // Get recent quiz results
    const recentResults = await results.find({})
      .sort({ completedAt: -1 })
      .limit(5)
      .toArray();
    
    const totalQuizzesTaken = await results.countDocuments();
    const avgScore = recentResults.length > 0 
      ? Math.round(recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length)
      : 0;
    
    const dashboardData = {
      stats: {
        resumeScore: 75,
        averageInterviewScore: avgScore,
        totalQuizzes: totalQuizzesTaken,
        skillsCount: 8,
        availableQuestions: totalQuestions,
        quizCategories: categories.length
      },
      recentActivity: recentResults.map(result => ({
        date: result.completedAt.toISOString().split('T')[0],
        score: result.score,
        type: `${result.category} Quiz`,
        category: result.category
      })),
      quizOverview: {
        totalQuestions,
        categories,
        completedToday: recentResults.filter(r => {
          const today = new Date().toDateString();
          return new Date(r.completedAt).toDateString() === today;
        }).length,
        averageScore: avgScore
      }
    };
    
    res.json(dashboardData);
  } catch (error) {
    console.error('❌ Dashboard error:', error);
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

// User Profile
app.get('/api/user/profile', (req, res) => {
  try {
    res.json({
      success: true,
      profile: {
        name: 'John Doe',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: '2 years',
        currentRole: 'Frontend Developer',
        targetRole: 'Full Stack Developer'
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Handle preflight requests for resume upload
app.options('/api/resume/upload', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });
    
  } catch (error) {
    console.error('❌ Server start failed:', error);
    process.exit(1);
  }
};

startServer();