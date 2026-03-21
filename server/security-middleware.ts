import { Request, Response, NextFunction } from 'express';
import { authService } from './auth-service';
import { body, validationResult } from 'express-validator';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, {
  count: number;
  resetTime: number;
}>();

// Rate limiting configuration
const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
  register: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
  passwordReset: { windowMs: 60 * 60 * 1000, max: 3 }, // 3 attempts per hour
  general: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  api: { windowMs: 60 * 1000, max: 1000 }, // 1000 requests per minute
};

// Validation rules for common endpoints
export const validationRules = {
  login: [
    body('phone')
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase, one uppercase, and one number')
  ],
  
  register: [
    body('phone')
      .isMobilePhone('any')
      .withMessage('Please provide a valid phone number'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one lowercase, one uppercase, and one number'),
    body('name')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .trim()
      .escape(),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail()
  ],
  
  productSearch: [
    body('query')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search query must be between 1 and 100 characters')
      .trim()
      .escape(),
    body('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
      .toInt(),
    body('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
      .toInt()
  ]
};

// Input validation patterns
const VALIDATION_PATTERNS = {
  phoneNumber: /^\+998\d{9}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
  name: /^[a-zA-Z\s]{2,50}$/,
  id: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  amount: /^\d+$/,
  text: /^[a-zA-Z0-9\s\-_.,!?@#$%^&*()]+$/,
};

// Sensitive data patterns to redact from logs
const SENSITIVE_PATTERNS = [
  /password["\s]*[:=]["\s]*[^"\s]+/gi,
  /token["\s]*[:=]["\s]*[^"\s]+/gi,
  /authorization["\s]*[:=]["\s]*[^"\s]+/gi,
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card numbers
  /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g, // Phone numbers
  /[^@\s]+@[^@\s]+\.[^@\s]+/g, // Email addresses
];

export class SecurityMiddleware {
  // Rate limiting middleware
  static rateLimit(type: keyof typeof RATE_LIMITS = 'general') {
    return (req: Request, res: Response, next: NextFunction) => {
      const config = RATE_LIMITS[type];
      const key = this.getClientKey(req, type);
      const now = Date.now();

      // Get or create rate limit record
      let record = rateLimitStore.get(key);
      
      if (!record || now > record.resetTime) {
        record = {
          count: 1,
          resetTime: now + config.windowMs
        };
        rateLimitStore.set(key, record);
      } else {
        record.count++;
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': config.max.toString(),
        'X-RateLimit-Remaining': Math.max(0, config.max - record.count).toString(),
        'X-RateLimit-Reset': new Date(record.resetTime).toISOString(),
      });

      // Check if rate limit exceeded
      if (record.count > config.max) {
        res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((record.resetTime - now) / 1000)} seconds.`,
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        });
        return;
      }

      next();
    };
  }

  // JWT authentication middleware
  static authenticateToken(req: Request, res: Response, next: NextFunction) {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'No token provided'
        });
      }

      const decoded = authService.verifyToken(token);
      
      // Attach user info to request
      req.user = decoded;
      
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or expired token'
      });
    }
  }

  // Role-based authorization middleware
  static requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      if (req.user.role !== role && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions'
        });
      }

      next();
    };
  }

  // Permission-based authorization middleware
  static requirePermission(permission: string) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          return res.status(401).json({
            error: 'Access denied',
            message: 'Authentication required'
          });
        }

        const hasPermission = await authService.hasPermission(req.user.userId, permission);
        
        if (!hasPermission) {
          return res.status(403).json({
            error: 'Access denied',
            message: 'Insufficient permissions'
          });
        }

        next();
      } catch (error) {
        console.error('Permission check failed:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Permission check failed'
        });
      }
    };
  }

  // Input validation middleware
  static validateInput(field: string, pattern: keyof typeof VALIDATION_PATTERNS, required = true) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const value = req.body[field] || req.query[field] || req.params[field];

        if (required && !value) {
          return res.status(400).json({
            error: 'Validation error',
            message: `${field} is required`
          });
        }

        if (value && !VALIDATION_PATTERNS[pattern].test(value)) {
          return res.status(400).json({
            error: 'Validation error',
            message: `Invalid ${field} format`
          });
        }

        next();
      } catch (error) {
        console.error('Input validation failed:', error);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Validation failed'
        });
      }
    };
  }

  // General input validation middleware
  static validateBody(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const { error, value } = schema.validate(req.body);
        
        if (error) {
          return res.status(400).json({
            error: 'Validation error',
            message: error.details[0]?.message || 'Invalid input data'
          });
        }

        req.body = value;
        next();
      } catch (validationError) {
        console.error('Schema validation failed:', validationError);
        return res.status(500).json({
          error: 'Internal server error',
          message: 'Validation failed'
        });
      }
    };
  }

  // SQL injection prevention
  static sanitizeInput(req: Request, res: Response, next: NextFunction) {
    try {
      const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
          // Remove potential SQL injection patterns
          return obj.replace(/['"\\;\\-\\-\\#]/g, '');
        }
        
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }
        
        if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              sanitized[key] = sanitize(obj[key]);
            }
          }
          return sanitized;
        }
        
        return obj;
      };

      // Sanitize request body, query, and params
      if (req.body) {
        req.body = sanitize(req.body);
      }
      
      if (req.query) {
        req.query = sanitize(req.query);
      }
      
      if (req.params) {
        req.params = sanitize(req.params);
      }

      next();
    } catch (error) {
      console.error('Input sanitization failed:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Input sanitization failed'
      });
    }
  }

  // XSS prevention
  static preventXSS(req: Request, res: Response, next: NextFunction) {
    try {
      const escapeHtml = (text: string): string => {
        const map: Record<string, string> = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
          '/': '&#x2F;'
        };
        
        return text.replace(/[&<>"'/]/g, (char) => map[char]);
      };

      const sanitize = (obj: any): any => {
        if (typeof obj === 'string') {
          return escapeHtml(obj);
        }
        
        if (Array.isArray(obj)) {
          return obj.map(sanitize);
        }
        
        if (obj && typeof obj === 'object') {
          const sanitized: any = {};
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              sanitized[key] = sanitize(obj[key]);
            }
          }
          return sanitized;
        }
        
        return obj;
      };

      // Sanitize request body for XSS
      if (req.body) {
        req.body = sanitize(req.body);
      }

      // Set security headers
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'"
      });

      next();
    } catch (error) {
      console.error('XSS prevention failed:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'XSS prevention failed'
      });
    }
  }

  // Secure logging middleware
  static secureLogging(req: Request, res: Response, next: NextFunction) {
    // Override console methods to redact sensitive information
    const originalConsole = { ...console };
    
    const redactSensitiveData = (message: string): string => {
      let redacted = message;
      
      SENSITIVE_PATTERNS.forEach(pattern => {
        redacted = redacted.replace(pattern, '[REDACTED]');
      });
      
      return redacted;
    };

    console.log = (...args: any[]) => {
      originalConsole.log(...args.map(arg => 
        typeof arg === 'string' ? redactSensitiveData(arg) : arg
      ));
    };

    console.error = (...args: any[]) => {
      originalConsole.error(...args.map(arg => 
        typeof arg === 'string' ? redactSensitiveData(arg) : arg
      ));
    };

    console.warn = (...args: any[]) => {
      originalConsole.warn(...args.map(arg => 
        typeof arg === 'string' ? redactSensitiveData(arg) : arg
      ));
    };

    next();
  }

  // CORS middleware
  static cors(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
    const origin = req.headers.origin as string;

    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    next();
  }

  // Request size limiting
  static requestSizeLimit(maxSize: number = 10 * 1024 * 1024) { // 10MB default
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = req.headers['content-length'];
      
      if (contentLength && parseInt(contentLength) > maxSize) {
        return res.status(413).json({
          error: 'Request entity too large',
          message: `Request size exceeds limit of ${maxSize} bytes`
        });
      }

      next();
    };
  }

  // Security headers middleware
  static securityHeaders(req: Request, res: Response, next: NextFunction) {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    });

    next();
  }

  // Helper method to get client key for rate limiting
  private static getClientKey(req: Request, type: string): string {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // Create a hash of IP and user agent for rate limiting
    return `${type}:${ip}:${Buffer.from(userAgent).toString('base64')}`;
  }

  // Clean up expired rate limit entries
  static cleanupRateLimits() {
    const now = Date.now();
    
    for (const [key, record] of rateLimitStore.entries()) {
      if (now > record.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }

  // Get rate limit status for a client
  static getRateLimitStatus(req: Request, type: keyof typeof RATE_LIMITS = 'general') {
    const key = this.getClientKey(req, type);
    const record = rateLimitStore.get(key);
    const config = RATE_LIMITS[type];
    const now = Date.now();

    if (!record || now > record.resetTime) {
      return {
        limit: config.max,
        remaining: config.max,
        resetTime: now + config.windowMs,
        resetIn: config.windowMs / 1000
      };
    }

    return {
      limit: config.max,
      remaining: Math.max(0, config.max - record.count),
      resetTime: record.resetTime,
      resetIn: Math.max(0, (record.resetTime - now) / 1000)
    };
  }
}

// Schedule cleanup of rate limits
setInterval(() => {
  SecurityMiddleware.cleanupRateLimits();
}, 5 * 60 * 1000); // Clean up every 5 minutes

export default SecurityMiddleware;
