const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(express.json());

// Simple connection without extra options
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
};

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    status: 'OK', 
    dbState: mongoose.connection.readyState,
    message: 'Server is running' 
  });
});

// Registration route
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Database not ready' });
    }
    
    // Simple user creation without model for testing
    const db = mongoose.connection.db;
    const result = await db.collection('users').insertOne({
      name,
      email,
      password,
      createdAt: new Date()
    });
    
    res.json({ success: true, userId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const startServer = async () => {
  const connected = await connectDB();
  if (connected) {
    app.listen(5001, () => {
      console.log('🚀 Test server running on port 5001');
    });
  }
};

startServer();