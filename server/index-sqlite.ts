import { config } from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes-simple";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./db-storage-sqlite";

// Load environment variables from .env.local file
config({ path: ".env.local" });

const app = express();
const log = console.log;

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Very simple security middleware - no external dependencies
function setupBasicSecurity(app: express.Application) {
  // Basic security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Simple rate limiting
  const requestCounts = new Map<string, { count: number; resetTime: number }>();
  
  app.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100;

    if (!requestCounts.has(clientIp)) {
      requestCounts.set(clientIp, { count: 1, resetTime: now + windowMs });
    } else {
      const client = requestCounts.get(clientIp)!;
      if (now > client.resetTime) {
        client.count = 1;
        client.resetTime = now + windowMs;
      } else {
        client.count++;
        if (client.count > maxRequests) {
          return res.status(429).json({ error: 'Too many requests' });
        }
      }
    }
    next();
  });
}

// CORS middleware
function setupCORS(app: express.Application) {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:19006',
      'exp://localhost:8081',
      'exp://192.168.1.100:8081'
    ];
    
    if (allowedOrigins.includes(origin || '') || !origin) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
}

// Body parsing middleware
function setupBodyParsing(app: express.Application) {
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
}

// Request logging
function setupLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const timestamp = new Date().toISOString();
    
    log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
  });
}

// Error handling middleware
function setupErrorHandling(app: express.Application) {
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    log('Server error:', err);
    
    if (res.headersSent) {
      return next(err);
    }
    
    const status = err.status || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message || 'Something went wrong';
    
    res.status(status).json({
      error: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

async function startServer() {
  try {
    // Setup middleware
    setupBasicSecurity(app);
    setupCORS(app);
    setupBodyParsing(app);
    setupLogging(app);

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: 'sqlite',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Register API routes
    log('Registering API routes...');
    await registerRoutes(app);
    
    // Setup error handling (must be last)
    setupErrorHandling(app);

    // Start server
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      log(`🚀 Server running on port ${PORT}`);
      log(`📱 Mobile app: http://localhost:8081`);
      log(`🌐 API: http://localhost:${PORT}`);
      log(`🏥 Health: http://localhost:${PORT}/health`);
      log(`🗄️  Database: SQLite (supermarket_go_dev.db)`);
      log(`👤 Admin login: +998978562020 / Odamboy1307`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      log('SIGINT received, shutting down gracefully');
      server.close(() => {
        log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    log('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer().catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});
