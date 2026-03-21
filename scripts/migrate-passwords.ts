import { storage } from '../server/db-storage';
import { hashPassword } from '../lib/password';

async function migratePasswords() {
  try {
    console.log('🔒 Starting password migration...');
    
    // Get all users
    const users = await storage.getUsers();
    console.log(`Found ${users.length} users to migrate`);
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      try {
        // Check if password is already hashed (bcrypt hashes start with $2b$ or $2a$)
        if (user.password.startsWith('$2')) {
          console.log(`User ${user.phoneNumber} already has hashed password - skipping`);
          skippedCount++;
          continue;
        }
        
        // Hash the plain text password
        const hashedPassword = await hashPassword(user.password);
        
        // Update user with hashed password
        await storage.updateUser(user.id, { password: hashedPassword });
        
        console.log(`✅ Migrated password for user: ${user.phoneNumber}`);
        migratedCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate password for user ${user.phoneNumber}:`, error);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`⏭️ Already hashed: ${skippedCount} users`);
    console.log(`📊 Total users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migratePasswords().then(() => {
  console.log('🔒 Password migration completed successfully!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
