require('dotenv').config();
const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('🔄 Testing registration endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('✅ Registration successful:', response.data);
  } catch (error) {
    console.error('❌ Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.message);
  }
};

testRegistration();