const axios = require('axios');

async function testRegistrationAPI() {
  try {
    console.log('🔍 Testing registration API endpoint...');
    
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    
    console.log('📝 Sending registration request...');
    
    const response = await axios.post('http://localhost:5000/api/auth/register', testUser, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Registration successful:', {
      status: response.status,
      user: response.data.user,
      hasToken: !!response.data.token
    });
    
  } catch (error) {
    if (error.response) {
      console.error('❌ Registration failed:', {
        status: error.response.status,
        message: error.response.data.message || error.response.data
      });
    } else if (error.request) {
      console.error('❌ No response received:', error.message);
    } else {
      console.error('❌ Request error:', error.message);
    }
  }
}

testRegistrationAPI();