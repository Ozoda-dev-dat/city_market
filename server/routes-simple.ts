import type { Express } from "express";
import { createServer, type Server } from "node:http";

// Simple health check route
export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security middleware to all routes
  app.use((req, res, next) => {
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // Rate limiting
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

  // Input validation
  app.use((req, res, next) => {
    // XSS Protection
    const sanitizeString = (str: string): string => {
      return str
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<javascript[^>]*>.*?<\/javascript>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    };

    // SQL Injection Protection
    const detectSqlInjection = (str: string): boolean => {
      const sqlPatterns = [
        /['\-;|*]/i,
        /(exec(\s|\+)+(s|x)p\w+)/i,
        /(union(.*?)select)/i,
        /(select(.*?)from)/i,
        /(insert(.*?)into)/i,
        /(delete(.*?)from)/i,
        /(update(.*?)set)/i,
        /(drop(.*?)table)/i,
        /(create(.*?)table)/i,
        /(alter(.*?)table)/i,
        /(exec(.*?)\()/i
      ];
      
      return sqlPatterns.some((pattern: RegExp) => pattern.test(str));
    };

    // Sanitize request body
    if (req.body) {
      const checkObject = (obj: any): boolean => {
        if (typeof obj === 'string') {
          if (detectSqlInjection(obj)) {
            return true;
          }
          req.body = sanitizeString(obj);
        } else if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            if (checkObject(obj[key])) {
              return true;
            }
          }
        }
        return false;
      };

      if (checkObject(req.body)) {
        return res.status(400).json({ error: 'Invalid input detected' });
      }
    }

    // Sanitize query parameters
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = sanitizeString(req.query[key] as string);
        }
      }
    }

    next();
  });

  // CORS middleware
  app.use((req, res, next) => {
    const origin = req.header("origin");

    // Allow localhost origins for Expo web development (any port)
    const isLocalhost =
      origin?.startsWith("http://localhost:") ||
      origin?.startsWith("http://127.0.0.1:");

    // Allow mobile app origins (Expo Go)
    const isExpoOrigin = 
      origin?.includes("expo") ||
      origin?.includes("exp.direct") ||
      origin?.includes("exp://") ||
      origin?.startsWith("http://192.168.") ||
      origin?.startsWith("http://10.") ||
      origin?.startsWith("http://172.") ||
      !origin; // Allow requests with no origin

    // Set CORS headers
    if (isLocalhost || isExpoOrigin || !origin) {
      res.header("Access-Control-Allow-Origin", origin || "http://localhost:8081");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH",
      );
      res.header(
        "Access-Control-Allow-Headers", 
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400"); // 24 hours
    } else if (origin && !isLocalhost && !isExpoOrigin) {
      // Reject unauthorized origins
      return res.status(403).json({ error: "Origin not allowed" });
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // API routes placeholder
  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working" });
  });

  // Auth endpoints placeholder
  app.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login endpoint - security middleware applied" });
  });

  app.post("/api/auth/register", (req, res) => {
    res.json({ message: "Register endpoint - security middleware applied" });
  });

  // Protected route example
  app.get("/api/user/profile", (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Simple JWT verification
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        return res.status(403).json({ error: 'Token expired' });
      }
      res.json({ message: "Profile endpoint - authenticated", user: decoded });
    } catch (error) {
      return res.status(403).json({ error: 'Invalid token' });
    }
  });

  // Products endpoint
  app.get("/api/products", (req, res) => {
    res.json({ 
      products: [
        { id: 1, name: "Test Product 1", price: 10.99 },
        { id: 2, name: "Test Product 2", price: 15.99 }
      ]
    });
  });

  // Search endpoint
  app.get("/api/products/search", (req, res) => {
    const { query } = req.query;
    res.json({ 
      products: [
        { id: 1, name: `Search result for: ${query}`, price: 10.99 }
      ]
    });
  });

  // Categories endpoint
  app.get("/api/categories", (req, res) => {
    res.json({ 
      categories: [
        { id: 1, name: "Electronics" },
        { id: 2, name: "Food" }
      ]
    });
  });

  return createServer(app);
}
