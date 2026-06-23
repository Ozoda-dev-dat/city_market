import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, gt, isNull } from "drizzle-orm";
import { otpCodes } from "../shared/schema";
import { getDatabaseUrl } from "../lib/env-config";

function getDb() {
  const client = postgres(getDatabaseUrl(), { max: 1 });
  return drizzle(client, { schema: { otpCodes } });
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export const otpService = {
  async createOtp(phoneNumber: string, purpose = "register"): Promise<string> {
    const db = getDb();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await db.insert(otpCodes).values({
      phoneNumber,
      code,
      purpose,
      expiresAt,
    });
    return code;
  },

  async verifyOtp(phoneNumber: string, code: string, purpose = "register"): Promise<boolean> {
    const db = getDb();
    const now = new Date();
    const rows = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.phoneNumber, phoneNumber),
          eq(otpCodes.code, code),
          eq(otpCodes.purpose, purpose),
          gt(otpCodes.expiresAt, now),
          isNull(otpCodes.usedAt)
        )
      )
      .limit(1);

    if (rows.length === 0) return false;

    await db
      .update(otpCodes)
      .set({ usedAt: now })
      .where(eq(otpCodes.id, rows[0].id));

    return true;
  },

  async ensureTable(): Promise<void> {
    const dbUrl = getDatabaseUrl();
    const client = postgres(dbUrl, { max: 1 });
    try {
      await client`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT NOT NULL,
          code TEXT NOT NULL,
          purpose TEXT NOT NULL DEFAULT 'register',
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone_number)
      `;
    } finally {
      await client.end();
    }
  },
};
