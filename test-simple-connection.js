require('dotenv').config();
const mongoose = require('mongoose');

async function testSimpleConnection() {
  try {
    console.log('Testing simple MongoDB connection...');
    
    // Use a simpler connection
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Test a simple operation with manual timeout
    console.log('Testing database operation...');
    
    const testCollection = mongoose.connection.db.collection('test');
    const result = await testCollection.insertOne({ test: 'data', timestamp: new Date() });
    
    console.log('✅ Insert operation successful:', result.insertedId);
    
    // Clean up
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('✅ Cleanup successful');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
  
  process.exit(0);
}

testSimpleConnection();