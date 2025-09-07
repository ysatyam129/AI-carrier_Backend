const { Quiz } = require('../models/Quiz');

const sampleQuestions = [
  {
    category: 'DSA',
    difficulty: 'Easy',
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
    correctAnswer: 1,
    explanation: 'Binary search divides the search space in half with each iteration, resulting in O(log n) time complexity.',
    tags: ['algorithms', 'search', 'complexity']
  },
  {
    category: 'DSA',
    difficulty: 'Medium',
    question: 'Which data structure is best for implementing a LRU cache?',
    options: ['Array', 'HashMap + Doubly Linked List', 'Stack', 'Queue'],
    correctAnswer: 1,
    explanation: 'HashMap provides O(1) access while doubly linked list allows O(1) insertion/deletion for LRU operations.',
    tags: ['cache', 'data-structures', 'optimization']
  },
  {
    category: 'Development',
    difficulty: 'Easy',
    question: 'What does REST stand for?',
    options: ['Representational State Transfer', 'Remote State Transfer', 'Relational State Transfer', 'Real State Transfer'],
    correctAnswer: 0,
    explanation: 'REST stands for Representational State Transfer, an architectural style for web services.',
    tags: ['web', 'api', 'architecture']
  },
  {
    category: 'Development',
    difficulty: 'Medium',
    question: 'Which HTTP method is idempotent?',
    options: ['POST', 'PUT', 'PATCH', 'All of the above'],
    correctAnswer: 1,
    explanation: 'PUT is idempotent - multiple identical requests have the same effect as a single request.',
    tags: ['http', 'web', 'api']
  },
  {
    category: 'AI',
    difficulty: 'Easy',
    question: 'What is supervised learning?',
    options: ['Learning without labels', 'Learning with input-output pairs', 'Learning through rewards', 'Learning by clustering'],
    correctAnswer: 1,
    explanation: 'Supervised learning uses labeled training data with input-output pairs to learn patterns.',
    tags: ['machine-learning', 'supervised', 'training']
  },
  {
    category: 'Cloud',
    difficulty: 'Easy',
    question: 'What does AWS EC2 stand for?',
    options: ['Elastic Compute Cloud', 'Enhanced Cloud Computing', 'Elastic Container Cloud', 'Extended Compute Cluster'],
    correctAnswer: 0,
    explanation: 'EC2 stands for Elastic Compute Cloud, providing scalable computing capacity in AWS.',
    tags: ['aws', 'cloud', 'compute']
  }
];

const seedQuizData = async () => {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ Database not connected, skipping quiz seeding');
      return;
    }
    
    const db = mongoose.connection.db;
    const quizCollection = db.collection('quizzes');
    
    // Check if quiz data already exists
    const count = await quizCollection.countDocuments();
    if (count > 0) {
      console.log('✅ Quiz data already exists:', count, 'questions');
      return;
    }
    
    // Add timestamps to sample questions
    const questionsWithTimestamps = sampleQuestions.map(q => ({
      ...q,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    await quizCollection.insertMany(questionsWithTimestamps);
    console.log('✅ Quiz data seeded successfully:', questionsWithTimestamps.length, 'questions');
    
  } catch (error) {
    console.error('❌ Error seeding quiz data:', error.message);
  }
};

module.exports = seedQuizData;