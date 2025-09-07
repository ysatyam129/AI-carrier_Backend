const axios = require('axios');

const testAPI = async () => {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    console.log('🧪 Testing API endpoints...');
    
    // Test registration
    const registerData = {
      name: 'Test User API',
      email: 'testapi@gmail.com',
      password: 'password123'
    };
    
    console.log('📝 Testing registration...');
    const registerResponse = await axios.post(`${baseURL}/auth/register`, registerData);
    
    console.log('✅ Registration successful!');
    console.log('Response:', {
      token: registerResponse.data.token ? 'Present' : 'Missing',
      user: registerResponse.data.user,
      redirectTo: registerResponse.data.redirectTo
    });
    
    // Test dashboard access
    const token = registerResponse.data.token;
    console.log('\n📊 Testing dashboard access...');
    
    const dashboardResponse = await axios.get(`${baseURL}/user/dashboard`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Dashboard access successful!');
    console.log('Dashboard data:', dashboardResponse.data);
    
    console.log('\n✅ All API tests passed!');
  } catch (error) {
    console.error('❌ API test failed:', error.response?.data || error.message);
  }
};

testAPI();