const fetch = require('node-fetch');

async function testLoginWithTimeout() {
  try {
    console.log('Testing API with increased timeout...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35 second timeout
    
    const response = await fetch('http://192.168.0.153:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '+998901234567',
        password: 'admin'
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLoginWithTimeout();
