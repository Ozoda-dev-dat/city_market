import { backupService } from './backup-service';
import { migrationService } from './migration-service';
import { consistencyService } from './consistency-service';
import { transactionService } from './transaction-service';
import { dataProtectionService } from './data-protection-service';

export async function initializeDataIntegrity() {
  console.log('🚀 Initializing data integrity systems...');

  try {
    // Start all scheduled services
    await backupService.scheduleBackups();
    await migrationService.scheduleMigrationCheck();
    await consistencyService.scheduleConsistencyChecks();
    await transactionService.scheduleTransactionMonitoring();
    await dataProtectionService.scheduleDataProtectionTasks();

    // Run initial checks
    console.log('🔍 Running initial data consistency checks...');
    const issues = await consistencyService.runAllChecks();
    
    if (issues.length > 0) {
      console.warn(`⚠️ Found ${issues.length} initial consistency issues:`);
      issues.forEach(issue => {
        console.warn(`  - ${issue.severity.toUpperCase()}: ${issue.description} (${issue.table})`);
      });

      // Auto-fix low severity issues
      const autoFixable = issues.filter(i => i.severity === 'low');
      if (autoFixable.length > 0) {
        console.log(`🔧 Auto-fixing ${autoFixable.length} low severity issues...`);
        const result = await consistencyService.fixIssues(autoFixable);
        console.log(`✅ Fixed: ${result.fixed}, Failed: ${result.failed}`);
      }
    } else {
      console.log('✅ No consistency issues found');
    }

    // Validate data integrity
    console.log('🔐 Validating data integrity...');
    const integrity = await dataProtectionService.validateDataIntegrity();
    
    if (integrity.valid) {
      console.log('✅ Data integrity validated');
    } else {
      console.warn('⚠️ Data integrity issues found:', integrity.issues);
    }

    // Check migration status
    console.log('📋 Checking migration status...');
    const migrationStatus = await migrationService.getMigrationStatus();
    console.log(`📊 Migration status: ${migrationStatus.length} migrations applied`);

    console.log('✅ Data integrity systems initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize data integrity systems:', error);
    throw error;
  }
}

// Auto-initialize if this file is run directly
if (require.main === module) {
  initializeDataIntegrity()
    .then(() => {
      console.log('🎉 Data integrity initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Data integrity initialization failed:', error);
      process.exit(1);
    });
}
