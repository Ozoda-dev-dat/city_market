const fetch = require('node-fetch');

async function testOrderCreation() {
  try {
    console.log('Testing order creation...');
    
    const orderData = {
      id: `test-order-${Date.now()}`,
      customerId: 'c3830208-45b5-428a-893c-c3e8b18bedd6', // Admin user ID
      customerName: 'Test Customer',
      phoneNumber: '+998901234567',
      address: 'Toshkent shahri',
      latitude: '41.2995',
      longitude: '69.2401',
      total: 50000,
      discount: 0,
      items: [
        { name: 'Test Product', qty: 2, price: 25000 }
      ],
    };

    const response = await fetch('https://katabatic-unwarrantedly-renay.ngrok-free.dev/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOrderCreation();
