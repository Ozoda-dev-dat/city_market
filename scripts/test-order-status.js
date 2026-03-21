const fetch = require('node-fetch');

async function testOrderStatusUpdate() {
  try {
    console.log('Testing order status update...');
    
    const orderId = 'test-order-1773132758385';
    
    // Update order status to "preparing"
    const response = await fetch(`https://katabatic-unwarrantedly-renay.ngrok-free.dev/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'preparing'
      }),
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Updated order:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testOrderStatusUpdate();
