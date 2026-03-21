import { storage } from '../server/db-storage.js';

async function testLocation() {
  try {
    console.log('=== Testing Location Functionality ===');
    
    // Test updating user location
    const userId = 'test-user-id';
    const latitude = '41.2995';
    const longitude = '69.2401';
    const address = 'Toshkent, Chilonzor ko\'cha';
    
    console.log('Updating user location...');
    const updatedUser = await storage.updateUserLocation(userId, latitude, longitude, address);
    console.log('Updated user:', updatedUser);
    
    // Test getting user
    console.log('Getting user...');
    const user = await storage.getUser(userId);
    console.log('Retrieved user:', user);
    
    console.log('✅ Location functionality test completed successfully');
  } catch (error) {
    console.error('❌ Location test failed:', error);
  }
}

testLocation();
