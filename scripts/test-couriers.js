const fetch = require('node-fetch');

async function testCouriersEndpoint() {
  try {
    console.log('Testing /api/couriers endpoint...');
    
    const response = await fetch('https://katabatic-unwarrantedly-renay.ngrok-free.dev/api/couriers');
    
    console.log('Response status:', response.status);
    const couriers = await response.json();
    console.log('Couriers:', couriers);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testCouriersEndpoint();
