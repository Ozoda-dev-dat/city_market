import { eq, and, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../shared/schema";

export class AuditService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async logInsert(tableName: string, recordId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    await this.logChange({
      tableName,
      recordId,
      action: "INSERT",
      newValues: { id: recordId },
      userId,
      ipAddress,
      userAgent,
    });
  }

  async logUpdate(tableName: string, recordId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    await this.logChange({
      tableName,
      recordId,
      action: "UPDATE",
      userId,
      ipAddress,
      userAgent,
    });
  }

  async logDelete(tableName: string, recordId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    await this.logChange({
      tableName,
      recordId,
      action: "DELETE",
      userId,
      ipAddress,
      userAgent,
    });
  }

  async logRestore(tableName: string, recordId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    await this.logChange({
      tableName,
      recordId,
      action: "UPDATE",
      newValues: { restored: true },
      userId,
      ipAddress,
      userAgent,
    });
  }

  async logChange(params: {
    tableName: string;
    recordId: string;
    action: "INSERT" | "UPDATE" | "DELETE";
    oldValues?: any;
    newValues?: any;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.db.insert(schema.auditLogs).values({
        tableName: params.tableName,
        recordId: params.recordId,
        action: params.action,
        oldValues: params.oldValues,
        newValues: params.newValues,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      console.error("Failed to log audit change:", error);
      // Don't throw error to avoid breaking main operations
    }
  }

  async getAuditHistory(tableName: string, recordId: string) {
    return await this.db
      .select()
      .from(schema.auditLogs)
      .where(
        and(
          eq(schema.auditLogs.tableName, tableName),
          eq(schema.auditLogs.recordId, recordId)
        )
      )
      .orderBy(schema.auditLogs.createdAt);
  }

  async getUserActivity(userId: string, limit = 50) {
    return await this.db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.userId, userId))
      .orderBy(schema.auditLogs.createdAt)
      .limit(limit);
  }

  async getTableActivity(tableName: string, limit = 100) {
    return await this.db
      .select()
      .from(schema.auditLogs)
      .where(eq(schema.auditLogs.tableName, tableName))
      .orderBy(schema.auditLogs.createdAt)
      .limit(limit);
  }
}

export const auditService = new AuditService();
