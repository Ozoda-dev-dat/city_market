const fetch = require('node-fetch');

async function testLocalBackend() {
  try {
    console.log('Testing local backend...');
    
    const response = await fetch('http://localhost:5001/api/orders');
    
    console.log('Response status:', response.status);
    const orders = await response.json();
    console.log('Orders count:', orders.length);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testLocalBackend();
