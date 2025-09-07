require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function testMongooseFix() {
  try {
    console.log('🔍 Testing Mongoose with explicit connection handling...');
    
    // Connect with minimal options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Wait for connection to be fully ready
    while (mongoose.connection.readyState !== 1) {
      console.log('Waiting for connection to be ready...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('✅ Connection is ready');
    
    // Test data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    console.log('📝 Test data:', { ...testUser, password: '[HIDDEN]' });
    
    // Use the connection directly for operations
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check if user exists using native driver
    const existingUser = await usersCollection.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('🗑️ Removing existing test user...');
      await usersCollection.deleteOne({ email: testUser.email });
    }
    
    // Create user using Mongoose model
    const user = new User(testUser);
    await user.save();
    
    console.log('✅ User created successfully:', {
      id: user._id,
      name: user.name,
      email: user.email
    });
    
    // Clean up
    await usersCollection.deleteOne({ email: testUser.email });
    console.log('🧹 Test user cleaned up');
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testMongooseFix();