import { z } from 'zod';

/**
 * Environment configuration validation
 */

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5001'),
  DATABASE_URL: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  API_KEYS: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters').optional(),
  REPLIT_DEV_DOMAIN: z.string().optional(),
  EXPO_PUBLIC_DOMAIN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

/**
 * Load and validate environment variables
 */
export function loadEnv(): Env {
  try {
    // Construct DATABASE_URL from PG* vars if not directly set
    if (!process.env.DATABASE_URL && process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE) {
      const port = process.env.PGPORT || '5432';
      process.env.DATABASE_URL = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${port}/${process.env.PGDATABASE}`;
    }

    env = envSchema.parse(process.env);

    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE/PGPORT.');
    }
    
    // Validate critical security requirements in production
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET === 'your-super-secret-jwt-key-change-in-production') {
        throw new Error('JWT_SECRET must be set in production');
      }
      
      if (!env.ENCRYPTION_KEY) {
        console.warn('[WARNING] ENCRYPTION_KEY not set. Sensitive data will not be encrypted.');
      }
      
      if (!env.API_KEYS) {
        console.warn('[WARNING] API_KEYS not set. API endpoints will be publicly accessible.');
      }
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path?.join('.')} : ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Get environment variable with validation
 */
export function getEnv(): Env {
  if (!env) {
    env = loadEnv();
  }
  return env;
}

/**
 * Get database URL securely
 */
export function getDatabaseUrl(): string {
  const env = getEnv();
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not configured');
  return env.DATABASE_URL;
}

/**
 * Get JWT secret securely
 */
export function getJwtSecret(): string {
  const env = getEnv();
  return env.JWT_SECRET;
}

/**
 * Get JWT expiration time
 */
export function getJwtExpiresIn(): string {
  const env = getEnv();
  return env.JWT_EXPIRES_IN;
}

/**
 * Get encryption key for sensitive data
 */
export function getEncryptionKey(): string | undefined {
  const env = getEnv();
  return env.ENCRYPTION_KEY;
}

/**
 * Get API keys for authentication
 */
export function getApiKeys(): string[] {
  const env = getEnv();
  return env.API_KEYS ? env.API_KEYS.split(',').filter(Boolean) : [];
}

/**
 * Get CORS origins
 */
export function getCorsOrigins(): string[] {
  const env = getEnv();
  const origins = env.CORS_ORIGINS || '';
  
  if (!origins) {
    // Default origins for development
    return [
      'http://localhost:8081',
      'http://localhost:3000',
      'exp://127.0.0.1:8081',
      'exp://localhost:8081',
    ];
  }
  
  return origins.split(',').map(origin => origin.trim()).filter(Boolean);
}

/**
 * Get log level
 */
export function getLogLevel(): 'debug' | 'info' | 'warn' | 'error' {
  const env = getEnv();
  return env.LOG_LEVEL;
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  const env = getEnv();
  return env.NODE_ENV === 'development';
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  const env = getEnv();
  return env.NODE_ENV === 'production';
}

/**
 * Get server port
 */
export function getPort(): number {
  const env = getEnv();
  return parseInt(env.PORT, 10);
}

/**
 * Get Replit domain for development
 */
export function getReplitDomain(): string | undefined {
  const env = getEnv();
  return env.REPLIT_DEV_DOMAIN;
}

/**
 * Get Expo public domain for development
 */
export function getExpoDomain(): string | undefined {
  const env = getEnv();
  return env.EXPO_PUBLIC_DOMAIN;
}

/**
 * Validate environment on startup
 */
export function validateEnvironment(): void {
  try {
    loadEnv();
    console.log('✅ Environment validation passed');
    
    // Log non-sensitive configuration
    const env = getEnv();
    console.log(`📊 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Port: ${env.PORT}`);
    console.log(`🔐 Log Level: ${env.LOG_LEVEL}`);
    
    // Security warnings for production
    if (isProduction()) {
      if (!env.ENCRYPTION_KEY) {
        console.warn('⚠️  WARNING: ENCRYPTION_KEY not set in production');
      }
      if (!env.API_KEYS) {
        console.warn('⚠️  WARNING: API_KEYS not set in production');
      }
    }
    
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    process.exit(1);
  }
}

/**
 * Create a secure configuration object
 */
export function createSecureConfig() {
  const env = getEnv();
  
  return {
    app: {
      port: getPort(),
      env: env.NODE_ENV,
    },
    database: {
      url: getDatabaseUrl(),
      encryptionKey: getEncryptionKey(),
    },
    auth: {
      jwtSecret: getJwtSecret(),
      jwtExpiresIn: getJwtExpiresIn(),
    },
    security: {
      apiKeys: getApiKeys(),
      corsOrigins: getCorsOrigins(),
      encryptionKey: getEncryptionKey(),
    },
    logging: {
      level: getLogLevel(),
    },
    development: {
      replitDomain: getReplitDomain(),
      expoDomain: getExpoDomain(),
    },
  };
}
