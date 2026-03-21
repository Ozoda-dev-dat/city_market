import { storage } from '../server/db-storage.js';

async function testRegistration() {
  try {
    console.log('=== TEST REGISTRATION ===');
    
    const testUser = {
      phoneNumber: '+998901234568',
      password: 'test123',
      name: 'test',
      role: 'customer'
    };
    
    console.log('Attempting to register user:', testUser);
    
    // First check if user exists
    const existingUser = await storage.getUserByPhone(testUser.phoneNumber);
    console.log('Existing user check:', existingUser);
    
    if (existingUser) {
      console.log('❌ User already exists, cannot register');
      return;
    }
    
    // Try to create user
    const newUser = await storage.createUser(testUser);
    console.log('✅ User created successfully:', newUser);
    
    // Verify user was created
    const verifyUser = await storage.getUserByPhone(testUser.phoneNumber);
    console.log('✅ User verification:', verifyUser);
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
  }
}

testRegistration();
