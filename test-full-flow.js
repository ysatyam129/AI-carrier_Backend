require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const testFullFlow = async () => {
  try {
    console.log('🚀 Testing complete registration flow...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
      maxPoolSize: 10,
      connectTimeoutMS: 30000
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test user data
    const testUser = {
      name: 'Amit Verma',
      email: 'amit.test@gmail.com',
      password: 'password123'
    };
    
    // Clean up existing test user
    await User.deleteOne({ email: testUser.email });
    
    // Create new user (simulating registration)
    console.log('📝 Creating user...');
    const user = new User(testUser);
    await user.save({ maxTimeMS: 5000 });
    
    console.log('✅ User created successfully!');
    console.log('User ID:', user._id);
    console.log('User Name:', user.name);
    console.log('User Email:', user.email);
    console.log('Created At:', user.createdAt);
    
    // Verify user in database
    const savedUser = await User.findById(user._id);
    console.log('\n📊 User data in MongoDB:');
    console.log('- Name:', savedUser.name);
    console.log('- Email:', savedUser.email);
    console.log('- Profile:', savedUser.profile);
    console.log('- Progress:', savedUser.progress);
    console.log('- Password Hash:', savedUser.password.substring(0, 20) + '...');
    
    // Test password comparison
    const isPasswordValid = await savedUser.comparePassword('password123');
    console.log('- Password Verification:', isPasswordValid ? '✅ Valid' : '❌ Invalid');
    
    // Clean up
    await User.deleteOne({ _id: user._id });
    console.log('\n🧹 Test user deleted');
    
    await mongoose.disconnect();
    console.log('✅ Full flow test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
};

testFullFlow();