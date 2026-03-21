import { storage } from '../server/db-storage.js';

async function clearTestUsers() {
  try {
    await storage.clearTestUsers();
    console.log('✅ Test users cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing test users:', error);
  }
}

clearTestUsers();
