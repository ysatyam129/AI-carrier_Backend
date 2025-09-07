require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testRegistration = async () => {
  try {
    console.log('Testing registration process...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      maxPoolSize: 10,
      connectTimeoutMS: 30000
    });
    
    console.log('✅ Connected to database');
    
    // Test user creation
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Check if user exists
    const existingUser = await User.findOne({ email: testUser.email }).maxTimeMS(5000);
    if (existingUser) {
      console.log('User already exists, deleting...');
      await User.deleteOne({ email: testUser.email });
    }
    
    // Create new user
    const user = new User(testUser);
    await user.save({ maxTimeMS: 5000 });
    
    console.log('✅ User created successfully:', user._id);
    
    // Clean up
    await User.deleteOne({ _id: user._id });
    console.log('✅ Test user deleted');
    
    await mongoose.disconnect();
    console.log('✅ Registration test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Registration test failed:', error.message);
    process.exit(1);
  }
};

testRegistration();