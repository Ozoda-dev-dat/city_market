const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('Testing API endpoint...');
    
    const response = await fetch('http://192.168.0.153:5001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: '+998901234568',
        password: 'test123'
      })
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLogin();
