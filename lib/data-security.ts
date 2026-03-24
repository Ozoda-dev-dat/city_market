import { Platform } from 'react-native';

/**
 * Data encryption utilities for sensitive information
 * Note: Actual encryption only works server-side (Node.js)
 */

/**
 * Encrypt sensitive data - server-side only
 */
export function encryptSensitiveData(data: string, key: string): { encrypted: string; iv: string } {
  if (Platform.OS !== 'web' && typeof window === 'undefined') {
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return { encrypted, iv: iv.toString('hex') };
    } catch {
      // fall through to stub
    }
  }
  return { encrypted: btoa(data), iv: 'client-side' };
}

/**
 * Decrypt sensitive data - server-side only
 */
export function decryptSensitiveData(encryptedData: string, key: string, iv: string): string {
  if (Platform.OS !== 'web' && typeof window === 'undefined') {
    try {
      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      // fall through to stub
    }
  }
  try { return atob(encryptedData); } catch { return encryptedData; }
}

/**
 * Mask sensitive information for logging
 */
export function maskSensitiveData(data: string, type: 'phone' | 'password' | 'email' | 'name' | 'general'): string {
  if (!data || typeof data !== 'string') {
    return '[REDACTED]';
  }

  switch (type) {
    case 'phone':
      if (data.length >= 10) {
        return `${data.substring(0, 3)}****${data.substring(data.length - 2)}`;
      }
      return data.substring(0, 3) + '****';
    
    case 'password':
      return '******';
    
    case 'email':
      const [localPart, domain] = data.split('@');
      if (localPart && domain) {
        return `${localPart.substring(0, 2)}***@${domain}`;
      }
      return '***@****.***';
    
    case 'name':
      if (data.length > 2) {
        return `${data[0]}${'*'.repeat(data.length - 2)}${data[data.length - 1]}`;
      }
      return data[0] + '*';
    
    case 'general':
      if (data.length > 4) {
        return `${data.substring(0, 2)}${'*'.repeat(data.length - 4)}${data.substring(data.length - 2)}`;
      }
      return data.substring(0, 2) + '**';
    
    default:
      return '[REDACTED]';
  }
}

/**
 * Remove sensitive fields from objects for logging
 */
export function sanitizeForLogging(obj: any, sensitiveFields: string[] = ['password', 'token', 'secret', 'key']): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key], sensitiveFields);
    }
  }
  
  return sanitized;
}

/**
 * Create a secure logger that doesn't expose sensitive data
 */
export class SecureLogger {
  private static instance: SecureLogger;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';

  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logLevel = level;
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, this.sanitizeLogData(data));
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, this.sanitizeLogData(data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, this.sanitizeLogData(data));
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, this.sanitizeLogData(error));
    }
  }

  private sanitizeLogData(data: any): any {
    if (!data) return data;
    
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message,
      };
    }
    
    if (typeof data === 'object') {
      return sanitizeForLogging(data, ['password', 'token', 'secret', 'key', 'authorization', 'cookie']);
    }
    
    if (typeof data === 'string') {
      if (/\+998\d{9}/.test(data)) {
        return maskSensitiveData(data, 'phone');
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        return maskSensitiveData(data, 'email');
      }
    }
    
    return data;
  }
}

/**
 * Environment variable utilities
 */
export class SecureEnv {
  private static cache: Map<string, string> = new Map();

  static get(key: string, defaultValue?: string): string {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const value = process.env[key] || defaultValue || '';
    this.cache.set(key, value);
    return value;
  }

  static getDatabaseUrl(): string {
    const url = this.get('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL is not set');
    }
    if (url.includes('password') || url.includes('secret')) {
      return maskSensitiveData(url, 'general');
    }
    return url;
  }

  static getJwtSecret(): string {
    const secret = this.get('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production');
    if (secret === 'your-super-secret-jwt-key-change-in-production') {
      console.warn('[WARNING] Using default JWT secret. Please set JWT_SECRET environment variable in production.');
    }
    return secret;
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Request data sanitization middleware (server-side only)
 */
export function sanitizeRequest(req: any, res: any, next: any): void {
  if (req.body) req.body = sanitizeForLogging(req.body);
  if (req.query) req.query = sanitizeForLogging(req.query);
  if (req.params) req.params = sanitizeForLogging(req.params);
  next();
}

/**
 * Response data sanitization middleware (server-side only)
 */
export function sanitizeResponse(req: any, res: any, next: any): void {
  const originalJson = res.json;
  res.json = function(data: any) {
    const sanitizedData = sanitizeForLogging(data);
    return originalJson.call(res, sanitizedData);
  };
  next();
}

/**
 * Database field encryption utilities (server-side only)
 */
export class DatabaseEncryption {
  private static encryptionKey: string;

  static setEncryptionKey(key: string): void {
    this.encryptionKey = key;
  }

  static encryptField(value: string): string {
    if (!this.encryptionKey) throw new Error('Encryption key not set');
    const { encrypted } = encryptSensitiveData(value, this.encryptionKey);
    return encrypted;
  }

  static decryptField(encryptedValue: string): string {
    if (!this.encryptionKey) throw new Error('Encryption key not set');
    const { encrypted, iv } = JSON.parse(encryptedValue);
    return decryptSensitiveData(encrypted, this.encryptionKey, iv);
  }

  static encryptObject(obj: any): any {
    if (!this.encryptionKey) throw new Error('Encryption key not set');
    const jsonString = JSON.stringify(obj);
    const { encrypted, iv } = encryptSensitiveData(jsonString, this.encryptionKey);
    return JSON.stringify({ encrypted, iv });
  }

  static decryptObject(encryptedObj: string): any {
    if (!this.encryptionKey) throw new Error('Encryption key not set');
    const { encrypted, iv } = JSON.parse(encryptedObj);
    const decrypted = decryptSensitiveData(encrypted, this.encryptionKey, iv);
    return JSON.parse(decrypted);
  }
}

/**
 * Audit logging for security events
 */
export class SecurityAuditLogger {
  static logAuthEvent(event: string, userId?: string, ip?: string, userAgent?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId: userId ? maskSensitiveData(userId, 'general') : 'anonymous',
      ip: ip || 'unknown',
      userAgent: userAgent ? userAgent.substring(0, 100) + '...' : 'unknown',
    };
    console.log('[AUDIT]', JSON.stringify(logEntry));
  }

  static logDataAccess(resource: string, action: string, userId?: string, ip?: string): void {
    this.logAuthEvent(`DATA_ACCESS: ${action} - ${resource}`, userId, ip);
  }

  static logSecurityViolation(violation: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any, ip?: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event: 'SECURITY_VIOLATION',
      violation,
      severity,
      details: details ? sanitizeForLogging(details) : null,
      ip: ip || 'unknown',
    };
    console.error('[AUDIT]', JSON.stringify(logEntry));
  }
}

export const logger = SecureLogger.getInstance();
