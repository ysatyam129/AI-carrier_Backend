const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const testAPI = async () => {
  try {
    console.log('🧪 Testing AI Career Coach API...\n');
    
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health:', health.data);
    
    // Test 2: Database Check
    console.log('\n2️⃣ Testing database connection...');
    const dbTest = await axios.get(`${API_BASE}/test-db`);
    console.log('✅ Database:', dbTest.data);
    
    // Test 3: User Registration
    console.log('\n3️⃣ Testing user registration...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    };
    
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, testUser);
    console.log('✅ Registration:', {
      success: registerResponse.data.success,
      userId: registerResponse.data.user.id,
      name: registerResponse.data.user.name
    });
    
    // Test 4: User Login
    console.log('\n4️⃣ Testing user login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login:', {
      success: loginResponse.data.success,
      userId: loginResponse.data.user.id
    });
    
    // Test 5: Quiz Data
    console.log('\n5️⃣ Testing quiz data...');
    const token = loginResponse.data.token;
    const quizResponse = await axios.get(`${API_BASE}/quiz/DSA`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Quiz Questions:', quizResponse.data.length, 'questions found');
    
    console.log('\n🎉 All tests passed! Server is working properly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Wait a bit for server to start, then run tests
setTimeout(testAPI, 2000);