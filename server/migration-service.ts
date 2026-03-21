import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { promises as fs } from 'fs';
import path from 'path';

export class MigrationService {
  private db: ReturnType<typeof drizzle>;
  private migrationsPath: string;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client);
    
    this.migrationsPath = path.join(process.cwd(), 'migrations');
    this.ensureMigrationsDir();
  }

  private async ensureMigrationsDir() {
    try {
      await fs.access(this.migrationsPath);
    } catch {
      await fs.mkdir(this.migrationsPath, { recursive: true });
    }
  }

  async runMigrations(): Promise<void> {
    try {
      console.log('🚀 Running database migrations...');
      
      // Create backup before migration
      const { backupService } = await import('./backup-service');
      await backupService.createDataOnlyBackup();
      
      // Run migrations
      await migrate(this.db, { migrationsFolder: this.migrationsPath });
      
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  async generateMigration(name: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const migrationName = `${timestamp}_${name}`;
      const migrationPath = path.join(this.migrationsPath, migrationName);
      
      await fs.mkdir(migrationPath, { recursive: true });
      
      // Generate migration SQL using drizzle-kit
      const { exec } = require('child_process');
      const command = `npx drizzle-kit generate --name "${name}"`;
      
      await new Promise((resolve, reject) => {
        exec(command, { cwd: process.cwd() }, (error: any, stdout: any, stderr: any) => {
          if (error) {
            reject(error);
          } else {
            console.log(stdout);
            resolve(stdout);
          }
        });
      });

      console.log(`✅ Migration generated: ${migrationName}`);
      return migrationName;
    } catch (error) {
      console.error('❌ Migration generation failed:', error);
      throw error;
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    try {
      console.log(`🔄 Rolling back migration: ${migrationId}`);
      
      // Create backup before rollback
      const { backupService } = await import('./backup-service');
      await backupService.createDataOnlyBackup();
      
      // Read migration file and generate rollback SQL
      const migrationPath = path.join(this.migrationsPath, migrationId, 'migration.sql');
      const migrationSQL = await fs.readFile(migrationPath, 'utf-8');
      
      // Generate rollback SQL (simplified - in production, you'd want more sophisticated logic)
      const rollbackSQL = this.generateRollbackSQL(migrationSQL);
      
      // Execute rollback
      await this.db.execute(rollbackSQL);
      
      console.log(`✅ Migration rolled back: ${migrationId}`);
    } catch (error) {
      console.error('❌ Migration rollback failed:', error);
      throw error;
    }
  }

  private generateRollbackSQL(migrationSQL: string): string {
    // Simple rollback generation - in production, you'd want more sophisticated logic
    const lines = migrationSQL.split('\n');
    const rollbackLines: string[] = [];
    
    for (const line of lines.reverse()) {
      if (line.trim().startsWith('ALTER TABLE')) {
        // Generate ALTER TABLE reversal
        const match = line.match(/ALTER TABLE (\w+) ADD COLUMN (\w+)/);
        if (match) {
          rollbackLines.push(`ALTER TABLE ${match[1]} DROP COLUMN IF EXISTS ${match[2]};`);
        }
      } else if (line.trim().startsWith('CREATE TABLE')) {
        // Generate DROP TABLE
        const match = line.match(/CREATE TABLE (\w+)/);
        if (match) {
          rollbackLines.push(`DROP TABLE IF EXISTS ${match[1]};`);
        }
      } else if (line.trim().startsWith('CREATE INDEX')) {
        // Generate DROP INDEX
        const match = line.match(/CREATE INDEX (\w+)/);
        if (match) {
          rollbackLines.push(`DROP INDEX IF EXISTS ${match[1]};`);
        }
      }
    }
    
    return rollbackLines.join('\n');
  }

  async getMigrationStatus(): Promise<any[]> {
    try {
      // Check if migrations table exists
      const result = await this.db.execute(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'drizzle_migrations'
        );
      `);
      
      if (!result[0]?.exists) {
        return [];
      }
      
      // Get migration history
      const migrations = await this.db.execute(`
        SELECT id, created_at 
        FROM drizzle_migrations 
        ORDER BY created_at DESC
      `);
      
      return migrations;
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      return [];
    }
  }

  async validateMigrations(): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const issues: string[] = [];
      
      // Check migrations directory exists
      try {
        await fs.access(this.migrationsPath);
      } catch {
        issues.push('Migrations directory does not exist');
        return { valid: false, issues };
      }
      
      // Check for migration files
      const files = await fs.readdir(this.migrationsPath);
      const migrationFiles = files.filter(file => 
        file.includes('_') && !file.startsWith('.')
      );
      
      if (migrationFiles.length === 0) {
        issues.push('No migration files found');
      }
      
      // Validate each migration file
      for (const migrationFile of migrationFiles) {
        const migrationPath = path.join(this.migrationsPath, migrationFile);
        const sqlPath = path.join(migrationPath, 'migration.sql');
        
        try {
          const sqlContent = await fs.readFile(sqlPath, 'utf-8');
          
          if (!sqlContent.trim()) {
            issues.push(`Migration ${migrationFile} is empty`);
          }
          
          // Basic SQL validation
          if (!sqlContent.includes(';')) {
            issues.push(`Migration ${migrationFile} missing semicolons`);
          }
        } catch (error) {
          issues.push(`Migration ${migrationFile} has invalid SQL file`);
        }
      }
      
      return { valid: issues.length === 0, issues };
    } catch (error) {
      console.error('❌ Migration validation failed:', error);
      return { valid: false, issues: ['Validation process failed'] };
    }
  }

  async createMigrationBackup(migrationName: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `pre-migration-${timestamp}-${migrationName}`;
      
      const { backupService } = await import('./backup-service');
      const backupPath = await backupService.createDataOnlyBackup();
      
      // Rename backup file
      const newPath = backupPath.replace(/backup-data-.*\.json/, `${backupName}.json`);
      await fs.rename(backupPath, newPath);
      
      console.log(`✅ Pre-migration backup created: ${backupName}`);
      return newPath;
    } catch (error) {
      console.error('❌ Pre-migration backup failed:', error);
      throw error;
    }
  }

  async scheduleMigrationCheck(): Promise<void> {
    const schedule = require('node-schedule');
    
    // Check for pending migrations every hour
    schedule.scheduleJob('0 * * * *', async () => {
      try {
        const status = await this.getMigrationStatus();
        const validation = await this.validateMigrations();
        
        if (!validation.valid) {
          console.warn('⚠️ Migration validation issues:', validation.issues);
        }
        
        console.log(`📊 Migration status: ${status.length} migrations applied`);
      } catch (error) {
        console.error('❌ Scheduled migration check failed:', error);
      }
    });

    console.log('✅ Migration monitoring enabled (hourly checks)');
  }
}

export const migrationService = new MigrationService();
