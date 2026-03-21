import { storage } from '../server/db-storage.js';

async function debugUsers() {
  try {
    console.log('=== DEBUG: All Users in Database ===');
    // Get all users to see what's actually stored
    const { db } = storage;
    const { users } = await import('../shared/schema.js');
    
    const allUsers = await db.select().from(users);
    console.log('All users:', JSON.stringify(allUsers, null, 2));
    
    console.log('\n=== DEBUG: Specific Phone Search ===');
    const testPhone = '+998901234568';
    console.log('Searching for phone:', testPhone);
    
    const foundUser = await storage.getUserByPhone(testPhone);
    console.log('Found user:', foundUser);
    
    console.log('\n=== DEBUG: Admin User Search ===');
    const adminPhone = '+998901234567';
    console.log('Searching for admin phone:', adminPhone);
    
    const adminUser = await storage.getUserByPhone(adminPhone);
    console.log('Found admin:', adminUser);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugUsers();
