import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * CORS configuration
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://127.0.0.1:8081',
      'http://127.0.0.1:3000',
      'exp://127.0.0.1:8081',
      'exp://localhost:8081',
    ];

    // Add development tunnel URLs
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        /^https:\/\/.*\.ngrok-free\.dev$/,
        /^https:\/\/.*\.ngrok\.io$/,
        /^https:\/\/.*\.tunnel\.expo\.dev$/,
        /^http:\/\/.*\.localtunnel\.me$/,
        /^https:\/\/.*\.replit\.dev$/,
        /^https:\/\/.*\.repl\.co$/
      );
    }

    // Add production URLs
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(
        'https://yourdomain.com',
        'https://www.yourdomain.com'
      );
    }

    if (allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

/**
 * Rate limiting configuration
 */
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 15 * 60 * 1000, // 15 minutes
    max: options?.max || 100, // Limit each IP to 100 requests per windowMs
    message: options?.message || {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
    },
    standardHeaders: options?.standardHeaders !== false, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: options?.legacyHeaders !== false, // Disable the `X-RateLimit-*` headers
    handler: (req: Request, res: Response) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(options?.windowMs || 900000), // 15 minutes in ms
      });
    },
  });
};

/**
 * Different rate limiters for different endpoints
 */
export const rateLimiters = {
  // Rate limiting for auth endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // High limit — Replit proxies ALL traffic through one IP
    message: {
      error: 'Too many authentication attempts',
      message: 'Please try again after 15 minutes.',
    },
  }),

  // Moderate rate limiting for general API
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10000, // High limit — all users share one IP on Replit
  }),

  // Lenient rate limiting for data fetching
  data: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20000, // High limit — all users share one IP on Replit
  }),

  // Very strict rate limiting for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, // 100 requests per hour
    message: {
      error: 'Rate limit exceeded',
      message: 'Please try again after 1 hour.',
    },
  }),
};

/**
 * Helmet configuration for security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Required for Expo
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Required for Expo
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * Request size limiter
 */
export const requestSizeLimit = (maxSize: number = 10 * 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: 'Request entity too large',
        message: `Request size exceeds limit of ${maxSize / 1024 / 1024}MB`,
      });
    }
    
    next();
  };
};

/**
 * Security middleware stack
 */
export const securityMiddleware = [
  helmetConfig,
  requestSizeLimit(10 * 1024 * 1024), // 10MB limit
  // Note: CORS is handled by setupCors() in server/index.ts which supports Replit's proxy domain.
  // Do not add cors(corsOptions) here — it would override setupCors and block Replit domain origins.
];

/**
 * API key validation middleware
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKeys = (process.env.API_KEYS || '').split(',').filter(Boolean);
  
  // Skip API key validation for auth endpoints
  if (req.path.startsWith('/api/auth/')) {
    return next();
  }
  
  // Require API key for non-auth endpoints in production
  if (process.env.NODE_ENV === 'production' && validApiKeys.length > 0) {
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'A valid API key is required',
      });
    }
  }
  
  next();
};

/**
 * Request logging middleware for security monitoring
 */
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Log response details
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';
    
    console.log(`[${new Date().toISOString()}] [${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    
    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[SECURITY] Unauthorized access attempt: ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
    }
    
    if (res.statusCode === 429) {
      console.warn(`[SECURITY] Rate limit exceeded: ${req.method} ${req.path} - IP: ${req.ip}`);
    }
  });
  
  next();
};

/**
 * IP whitelist middleware (optional)
 */
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP as string)) {
      console.warn(`[SECURITY] Blocked IP: ${clientIP} attempting to access ${req.path}`);
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address is not allowed',
      });
    }
    
    next();
  };
};
