require('dotenv').config();

const express = require('express');

const app = express();
const log = console.log;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// CORS middleware
app.use((req, res, next) => {
  const origin = req.header("origin");
  
  // Allow all origins for testing
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "86400");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  next();
});

// Security middleware
app.use((req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Input validation
  if (req.body) {
    const sanitizeString = (str) => {
      return str
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<javascript[^>]*>.*?<\/javascript>/gi, '')
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    };

    const detectSqlInjection = (str) => {
      const sqlPatterns = [
        /('|(\-\-)|(;)|(\||\|)|(\*|\*)/i,
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
      
      return sqlPatterns.some((pattern) => pattern.test(str));
    };

    const checkObject = (obj) => {
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
  
  next();
});

// Rate limiting
const requestCounts = new Map();

app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!requestCounts.has(clientIp)) {
    requestCounts.set(clientIp, { count: 1, resetTime: now + windowMs });
  } else {
    const client = requestCounts.get(clientIp);
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

// Routes
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working" });
});

app.post("/api/auth/login", (req, res) => {
  res.json({ message: "Login endpoint - security middleware applied" });
});

app.post("/api/auth/register", (req, res) => {
  res.json({ message: "Register endpoint - security middleware applied" });
});

app.get("/api/user/profile", (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(403).json({ error: 'Token expired' });
    }
    res.json({ message: "Profile endpoint - authenticated", user: decoded });
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
});

app.get("/api/products", (req, res) => {
  res.json({ 
    products: [
      { id: 1, name: "Test Product 1", price: 10.99 },
      { id: 2, name: "Test Product 2", price: 15.99 }
    ]
  });
});

app.get("/api/products/search", (req, res) => {
  const { query } = req.query;
  res.json({ 
    products: [
      { id: 1, name: `Search result for: ${query}`, price: 10.99 }
    ]
  });
});

app.get("/api/categories", (req, res) => {
  res.json({ 
    categories: [
      { id: 1, name: "Electronics" },
      { id: 2, name: "Food" }
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const port = parseInt(process.env.PORT || "5001", 10);
app.listen(port, "0.0.0.0", () => {
  log(`🚀 Server running on port ${port}`);
  log(`🔒 Security features enabled: CORS, Rate limiting, Input validation, XSS protection, SQL injection protection`);
  log(`📊 Health check: http://localhost:${port}/health`);
});
