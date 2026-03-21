import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { promises as fs } from 'fs';
import path from 'path';
import { createHash, randomBytes } from 'crypto';

export class DataProtectionService {
  private db: ReturnType<typeof drizzle>;
  private encryptionKey: string;
  private backupDir: string;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
    
    // Initialize encryption key from environment or generate one
    this.encryptionKey = process.env.ENCRYPTION_KEY || this.generateEncryptionKey();
    
    this.backupDir = path.join(process.cwd(), 'secure-backups');
    this.ensureBackupDir();
  }

  private generateEncryptionKey(): string {
    const key = randomBytes(32).toString('hex');
    console.warn('⚠️ Generated new encryption key. Save this key securely:', key);
    return key;
  }

  private async ensureBackupDir() {
    try {
      await fs.access(this.backupDir);
    } catch {
      await fs.mkdir(this.backupDir, { recursive: true });
    }
  }

  private encrypt(text: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const iv = randomBytes(16);
    const cipher = require('crypto').createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('additional-data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(this.encryptionKey, 'hex');
    const parts = encryptedText.split(':');
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = require('crypto').createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('additional-data'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  async createSecureBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `secure-backup-${timestamp}.enc`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      // Export all sensitive data
      const sensitiveData = {
        timestamp: new Date().toISOString(),
        type: 'secure-backup',
        users: await this.db.select().from(schema.users),
        orders: await this.db.select().from(schema.orders),
        auditLogs: await this.db.select().from(schema.auditLogs),
      };

      // Encrypt the data
      const jsonData = JSON.stringify(sensitiveData, null, 2);
      const encryptedData = this.encrypt(jsonData);

      // Write encrypted backup
      await fs.writeFile(backupPath, encryptedData);

      // Create checksum
      const checksum = createHash('sha256').update(encryptedData).digest('hex');
      const checksumPath = path.join(this.backupDir, `secure-backup-${timestamp}.sha256`);
      await fs.writeFile(checksumPath, checksum);

      console.log(`✅ Secure backup created: ${backupFileName}`);
      return backupPath;
    } catch (error) {
      console.error('❌ Secure backup failed:', error);
      throw error;
    }
  }

  async restoreFromSecureBackup(backupPath: string): Promise<void> {
    try {
      // Verify checksum
      const checksumPath = backupPath.replace('.enc', '.sha256');
      const storedChecksum = await fs.readFile(checksumPath, 'utf-8');
      const encryptedData = await fs.readFile(backupPath, 'utf-8');
      const calculatedChecksum = createHash('sha256').update(encryptedData).digest('hex');

      if (storedChecksum !== calculatedChecksum) {
        throw new Error('Backup checksum verification failed');
      }

      // Decrypt data
      const decryptedData = this.decrypt(encryptedData);
      const backupData = JSON.parse(decryptedData);

      // Restore data within transaction
      const { transactionService } = await import('./transaction-service');
      
      await transactionService.withTransaction(async (tx) => {
        // Clear existing data (in production, you'd want more sophisticated merge logic)
        await tx.delete(schema.auditLogs);
        await tx.delete(schema.orders);
        await tx.delete(schema.users);

        // Restore data
        if (backupData.users?.length) {
          await tx.insert(schema.users).values(backupData.users);
        }
        if (backupData.orders?.length) {
          await tx.insert(schema.orders).values(backupData.orders);
        }
        if (backupData.auditLogs?.length) {
          await tx.insert(schema.auditLogs).values(backupData.auditLogs);
        }
      });

      console.log('✅ Secure backup restored successfully');
    } catch (error) {
      console.error('❌ Secure restore failed:', error);
      throw error;
    }
  }

  async anonymizeUserData(userId: string): Promise<void> {
    try {
      const { transactionService } = await import('./transaction-service');
      
      await transactionService.withTransaction(async (tx) => {
        // Anonymize user data
        await tx
          .update(schema.users)
          .set({
            name: 'Anonymized User',
            address: null,
            latitude: null,
            longitude: null,
            phoneNumber: this.hashField(userId), // Hash phone number
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, userId));

        // Anonymize orders
        await tx
          .update(schema.orders)
          .set({
            customerName: 'Anonymized Customer',
            address: 'Anonymized Address',
            latitude: null,
            longitude: null,
            phoneNumber: this.hashField(userId),
            updatedAt: new Date(),
          })
          .where(eq(schema.orders.customerId, userId));

        // Log anonymization
        await tx.insert(schema.auditLogs).values({
          tableName: 'users',
          recordId: userId,
          action: 'UPDATE',
          newValues: { anonymized: true },
          userId,
        });
      });

      console.log(`✅ User data anonymized: ${userId}`);
    } catch (error) {
      console.error('❌ Data anonymization failed:', error);
      throw error;
    }
  }

  private hashField(data: string): string {
    return createHash('sha256').update(data + this.encryptionKey).digest('hex').substring(0, 20);
  }

  async implementDataRetention(): Promise<void> {
    try {
      const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS || '365');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { transactionService } = await import('./transaction-service');
      
      await transactionService.withTransaction(async (tx) => {
        // Archive old audit logs
        const oldAuditLogs = await tx
          .select()
          .from(schema.auditLogs)
          .where(sql`created_at < ${cutoffDate.toISOString()}`);

        if (oldAuditLogs.length > 0) {
          // Create archive file
          const archiveData = {
            timestamp: new Date().toISOString(),
            type: 'audit-archive',
            records: oldAuditLogs,
          };

          const archiveFileName = `audit-archive-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
          const archivePath = path.join(this.backupDir, archiveFileName);
          
          await fs.writeFile(archivePath, JSON.stringify(archiveData, null, 2));

          // Delete old records
          await tx
            .delete(schema.auditLogs)
            .where(sql`created_at < ${cutoffDate.toISOString()}`);

          console.log(`📦 Archived ${oldAuditLogs.length} old audit logs`);
        }

        // Soft delete very old inactive users
        const userCutoffDate = new Date();
        userCutoffDate.setDate(userCutoffDate.getDate() - (retentionDays * 2));

        await tx
          .update(schema.users)
          .set({
            deletedAt: new Date(),
            isActive: false,
            updatedAt: new Date(),
          })
          .where(and(
            eq(schema.users.role, 'customer'),
            sql`updated_at < ${userCutoffDate.toISOString()}`,
            eq(schema.users.isActive, false)
          ));

        console.log('✅ Data retention policy applied');
      });
    } catch (error) {
      console.error('❌ Data retention failed:', error);
      throw error;
    }
  }

  async validateDataIntegrity(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Check for data corruption using checksums
      const tables = ['users', 'orders', 'products', 'categories', 'promo_codes'];
      
      for (const tableName of tables) {
        const result = await this.db.execute(`
          SELECT 
            COUNT(*) as record_count,
            MD5(string_agg(id || COALESCE(phone_number, '') || COALESCE(name, ''), ',')) as checksum
          FROM ${tableName}
          WHERE deleted_at IS NULL
        `);

        if (result[0]) {
          const checksum = createHash('md5')
            .update(`${result[0].record_count}-${result[0].checksum}`)
            .digest('hex');
          
          // Store checksum for comparison (in production, you'd store these in a separate table)
          console.log(`🔐 ${tableName} checksum: ${checksum}`);
        }
      }

      // Check for orphaned records
      const orphanedCount = await this.db.execute(`
        SELECT COUNT(*) as count
        FROM orders o
        LEFT JOIN users u ON o.customer_id = u.id
        WHERE o.customer_id IS NOT NULL 
          AND u.id IS NULL
          AND o.deleted_at IS NULL
      `);

      if (orphanedCount[0]?.count > 0) {
        issues.push(`Found ${orphanedCount[0].count} orphaned orders`);
      }

      return { valid: issues.length === 0, issues };
    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      return { valid: false, issues: ['Validation process failed'] };
    }
  }

  async createDataSnapshot(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFileName = `data-snapshot-${timestamp}.json`;
    const snapshotPath = path.join(this.backupDir, snapshotFileName);

    try {
      // Create comprehensive snapshot
      const snapshot = {
        timestamp: new Date().toISOString(),
        type: 'snapshot',
        schema: {
          users: await this.getTableSchema('users'),
          orders: await this.getTableSchema('orders'),
          products: await this.getTableSchema('products'),
          categories: await this.getTableSchema('categories'),
          promoCodes: await this.getTableSchema('promo_codes'),
        },
        data: {
          users: await this.db.select().from(schema.users),
          categories: await this.db.select().from(schema.categories),
          products: await this.db.select().from(schema.products),
          orders: await this.db.select().from(schema.orders),
          promoCodes: await this.db.select().from(schema.promoCodes),
        },
        metadata: {
          totalRecords: await this.getTotalRecordCount(),
          databaseSize: await this.getDatabaseSize(),
          checksum: await this.calculateDatabaseChecksum(),
        }
      };

      await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
      console.log(`📸 Data snapshot created: ${snapshotFileName}`);
      return snapshotPath;
    } catch (error) {
      console.error('❌ Data snapshot failed:', error);
      throw error;
    }
  }

  private async getTableSchema(tableName: string): Promise<any> {
    const result = await this.db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `);
    
    return result;
  }

  private async getTotalRecordCount(): Promise<number> {
    const result = await this.db.execute(`
      SELECT 
        SUM(CASE WHEN table_name = 'users' THEN (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) ELSE 0 END) +
        SUM(CASE WHEN table_name = 'orders' THEN (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL) ELSE 0 END) +
        SUM(CASE WHEN table_name = 'products' THEN (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) ELSE 0 END) +
        SUM(CASE WHEN table_name = 'categories' THEN (SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL) ELSE 0 END) +
        SUM(CASE WHEN table_name = 'promo_codes' THEN (SELECT COUNT(*) FROM promo_codes WHERE deleted_at IS NULL) ELSE 0 END) as total
      FROM information_schema.tables
      WHERE table_name IN ('users', 'orders', 'products', 'categories', 'promo_codes')
    `);
    
    return result[0]?.total || 0;
  }

  private async getDatabaseSize(): Promise<string> {
    const result = await this.db.execute(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    
    return result[0]?.size || '0 bytes';
  }

  private async calculateDatabaseChecksum(): Promise<string> {
    const tables = ['users', 'orders', 'products', 'categories', 'promo_codes'];
    let checksumData = '';

    for (const tableName of tables) {
      const result = await this.db.execute(`
        SELECT COUNT(*) as count, MD5(string_agg(id, ',')) as checksum
        FROM ${tableName}
        WHERE deleted_at IS NULL
      `);
      
      checksumData += `${tableName}:${result[0]?.count}:${result[0]?.checksum};`;
    }

    return createHash('sha256').update(checksumData).digest('hex');
  }

  async scheduleDataProtectionTasks(): Promise<void> {
    const schedule = require('node-schedule');
    
    // Daily secure backup at 1 AM
    schedule.scheduleJob('0 1 * * *', async () => {
      try {
        await this.createSecureBackup();
      } catch (error) {
        console.error('❌ Scheduled secure backup failed:', error);
      }
    });

    // Weekly data integrity check at 2 AM on Sunday
    schedule.scheduleJob('0 2 * * 0', async () => {
      try {
        const validation = await this.validateDataIntegrity();
        if (!validation.valid) {
          console.warn('⚠️ Data integrity issues found:', validation.issues);
        }
      } catch (error) {
        console.error('❌ Scheduled integrity check failed:', error);
      }
    });

    // Monthly data retention at 3 AM on 1st
    schedule.scheduleJob('0 3 1 * *', async () => {
      try {
        await this.implementDataRetention();
      } catch (error) {
        console.error('❌ Scheduled data retention failed:', error);
      }
    });

    // Quarterly data snapshot at 4 AM on 1st
    schedule.scheduleJob('0 4 1 */3 *', async () => {
      try {
        await this.createDataSnapshot();
      } catch (error) {
        console.error('❌ Scheduled data snapshot failed:', error);
      }
    });

    console.log('✅ Data protection scheduling enabled');
  }
}

export const dataProtectionService = new DataProtectionService();
