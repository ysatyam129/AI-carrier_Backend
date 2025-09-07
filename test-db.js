require('dotenv').config();
const mongoose = require('mongoose');

const testConnection = async () => {
  console.log('🔄 Testing database connection...');

  try {
    console.log('🔗 Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      bufferCommands: false, // Changed from bufferMaxEntries
      maxPoolSize: 10,
    });

    console.log('✅ MongoDB Connected:', conn.connection.host);
    console.log('✅ Database:', conn.connection.name);

    // Test database operations
    console.log('🔄 Testing database operations...');

    // Simple ping test
    await mongoose.connection.db.admin().ping();
    console.log('✅ Database ping successful');

    // Test collection operations with shorter timeout
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    console.log('✅ Insert operation successful');

    const count = await testCollection.countDocuments({});
    console.log('✅ Count operation successful, documents:', count);

    // Clean up test document
    await testCollection.deleteMany({ test: true });
    console.log('✅ Delete operation successful');

    console.log('🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    if (error.name === 'MongooseServerSelectionError') {
      console.log('💡 Suggestions:');
      console.log('   - Check your MongoDB URI');
      console.log('   - Verify your network connection');
      console.log('   - Check if your IP is whitelisted in MongoDB Atlas');
      console.log('   - Verify your database credentials');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
    process.exit(0);
  }
};

testConnection();