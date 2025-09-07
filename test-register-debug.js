require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('../database/connection');

async function testRegistration() {
  try {
    console.log('🔍 Testing registration process...');
    
    // Connect to database
    await connectDB();
    
    // Test data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    console.log('📝 Test data:', { ...testUser, password: '[HIDDEN]' });
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('🗑️ Removing existing test user...');
      await User.deleteOne({ email: testUser.email });
    }
    
    // Create new user
    console.log('👤 Creating new user...');
    const user = new User(testUser);
    await user.save();
    
    console.log('✅ User created successfully:', {
      id: user._id,
      name: user.name,
      email: user.email
    });
    
    // Clean up
    await User.deleteOne({ email: testUser.email });
    console.log('🧹 Test user cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    process.exit(1);
  }
}

testRegistration();