const axios = require('axios');

async function checkServer() {
  try {
    console.log('🔍 Checking server health...');
    const response = await axios.get('http://localhost:5001/api/health');
    console.log('✅ Server is running:', response.data);
  } catch (error) {
    console.log('❌ Server not running:', error.message);
    console.log('💡 Start server with: npm start');
  }
}

checkServer();