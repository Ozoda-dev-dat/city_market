const fetch = require('node-fetch');

async function testOrdersList() {
  try {
    console.log('Testing orders list...');
    
    const response = await fetch('https://katabatic-unwarrantedly-renay.ngrok-free.dev/api/orders');
    
    console.log('Response status:', response.status);
    const orders = await response.json();
    console.log('Orders count:', orders.length);
    
    // Show the latest order
    if (orders.length > 0) {
      const latestOrder = orders[orders.length - 1];
      console.log('Latest order:', latestOrder);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOrdersList();
