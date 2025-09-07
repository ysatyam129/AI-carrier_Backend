require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

async function testNativeRegistration() {
  let client;
  try {
    console.log('🔍 Testing registration with native MongoDB driver...');
    
    // Connect using native driver
    client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    
    const db = client.db('ai-career-coach');
    const users = db.collection('users');
    
    console.log('✅ Connected to MongoDB');
    
    // Test data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    console.log('📝 Test data:', { ...testUser, password: '[HIDDEN]' });
    
    // Check if user exists
    const existingUser = await users.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('🗑️ Removing existing test user...');
      await users.deleteOne({ email: testUser.email });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    // Create user
    const userDoc = {
      name: testUser.name,
      email: testUser.email,
      password: hashedPassword,
      profile: {},
      progress: {
        resumeScore: 0,
        interviewScores: [],
        skillsImproved: [],
        totalQuizzesTaken: 0
      },
      resumes: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await users.insertOne(userDoc);
    console.log('✅ User created with ID:', result.insertedId);
    
    // Generate JWT
    const token = jwt.sign({ userId: result.insertedId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('✅ JWT generated successfully');
    
    // Clean up
    await users.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test user cleaned up');
    
    console.log('✅ Registration test completed successfully');
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

testNativeRegistration();