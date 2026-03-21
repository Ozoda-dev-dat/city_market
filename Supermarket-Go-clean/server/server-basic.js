require('dotenv').config();

const express = require('express');
const http = require('http');

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
  res.json({ message: "Login endpoint" });
});

app.post("/api/auth/register", (req, res) => {
  res.json({ message: "Register endpoint" });
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
const server = http.createServer(app);
server.listen(port, "0.0.0.0", () => {
  log(`🚀 Server running on port ${port}`);
  log(`📊 Health check: http://localhost:${port}/health`);
});
