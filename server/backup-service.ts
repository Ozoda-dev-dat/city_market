import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { promises as fs } from 'fs';
import path from 'path';

export class BackupService {
  private db: ReturnType<typeof drizzle> | null = null;
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDir();
  }

  private getDb() {
    if (this.db) return this.db;
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(client, { schema });
    return this.db;
  }

  private async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  async createFullBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-full-${timestamp}.sql`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      // Get database connection string without credentials for pg_dump
      const dbUrl = process.env.DATABASE_URL!;
      const url = new URL(dbUrl);
      const connectionString = `postgresql://${url.username}:${url.password}@${url.host}${url.pathname}`;

      // Use pg_dump to create full backup
      const { exec } = require('child_process');
      const command = `pg_dump "${connectionString}" > "${backupPath}"`;
      
      await new Promise((resolve, reject) => {
        exec(command, (error: any, stdout: any, stderr: any) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });

      // Create metadata file
      const metadata = {
        timestamp: new Date().toISOString(),
        type: 'full',
        size: (await fs.stat(backupPath)).size,
        tables: await this.getTableInfo(),
      };

      const metadataPath = path.join(this.backupDir, `backup-full-${timestamp}.json`);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

      console.log(`✅ Full backup created: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }

  async createDataOnlyBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-data-${timestamp}.json`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      // Export all data
      const backup = {
        timestamp: new Date().toISOString(),
        type: 'data-only',
        tables: {
          users: await this.getDb().select().from(schema.users),
          categories: await this.getDb().select().from(schema.categories),
          products: await this.getDb().select().from(schema.products),
          orders: await this.getDb().select().from(schema.orders),
          promoCodes: await this.getDb().select().from(schema.promoCodes),
          auditLogs: await this.getDb().select().from(schema.auditLogs),
        }
      };

      await fs.writeFile(backupPath, JSON.stringify(backup, null, 2));
      console.log(`✅ Data-only backup created: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Data backup failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupPath: string): Promise<void> {
    try {
      const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
      
      if (backupData.type === 'data-only') {
        // Restore data-only backup
        for (const [tableName, records] of Object.entries(backupData.tables)) {
          if (Array.isArray(records) && records.length > 0) {
            const table = (schema as any)[tableName];
            await this.getDb().delete(table);
            await this.getDb().insert(table).values(records);
            console.log(`✅ Restored ${records.length} records to ${tableName}`);
          }
        }
      }
      
      console.log('✅ Backup restored successfully');
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }

  async scheduleBackups(): Promise<void> {
    // Schedule daily backups at 2 AM
    const schedule = require('node-schedule');
    
    schedule.scheduleJob('0 2 * * *', async () => {
      try {
        await this.createFullBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error);
      }
    });

    console.log('✅ Backup scheduling enabled (daily at 2 AM)');
  }

  async cleanupOldBackups(keepDays = 30): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          console.log(`🗑️  Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      console.error('❌ Backup cleanup failed:', error);
    }
  }

  private async getTableInfo(): Promise<any[]> {
    // Get table information for metadata
    const tables = ['users', 'categories', 'products', 'orders', 'promo_codes', 'audit_logs'];
    const tableInfo = [];

    for (const tableName of tables) {
      try {
        const result = await this.getDb().execute(`
          SELECT 
            COUNT(*) as row_count,
            pg_size_pretty(pg_total_relation_size('${tableName}')) as size
          FROM ${tableName}
        `);
        tableInfo.push({
          name: tableName,
          rowCount: result[0]?.row_count || 0,
          size: result[0]?.size || '0 bytes'
        });
      } catch (error) {
        console.warn(`Could not get info for table ${tableName}:`, error);
      }
    }

    return tableInfo;
  }

  async verifyBackup(backupPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(backupPath);
      
      if (backupPath.endsWith('.json')) {
        // Verify JSON backup
        const data = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
        return data.type === 'data-only' && data.tables;
      } else if (backupPath.endsWith('.sql')) {
        // Verify SQL backup by checking if it's readable and has content
        return stats.size > 1000; // Minimum reasonable size
      }
      
      return false;
    } catch (error) {
      console.error('❌ Backup verification failed:', error);
      return false;
    }
  }

  async getBackupList(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          name: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime,
          type: file.includes('full') ? 'full' : 'data-only'
        });
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }
}

export const backupService = new BackupService();
