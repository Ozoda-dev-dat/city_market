// server/index.ts
import { config } from "dotenv";
import express from "express";

// server/routes-simple.ts
import { createServer } from "node:http";
async function registerRoutes(app2) {
  app2.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  const requestCounts = /* @__PURE__ */ new Map();
  app2.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const windowMs = 15 * 60 * 1e3;
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
          return res.status(429).json({ error: "Too many requests" });
        }
      }
    }
    next();
  });
  app2.use((req, res, next) => {
    const sanitizeString = (str) => {
      return str.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<javascript[^>]*>.*?<\/javascript>/gi, "").replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
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
    if (req.body) {
      const checkObject = (obj) => {
        if (typeof obj === "string") {
          if (detectSqlInjection(obj)) {
            return true;
          }
          req.body = sanitizeString(obj);
        } else if (typeof obj === "object" && obj !== null) {
          for (const key in obj) {
            if (checkObject(obj[key])) {
              return true;
            }
          }
        }
        return false;
      };
      if (checkObject(req.body)) {
        return res.status(400).json({ error: "Invalid input detected" });
      }
    }
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === "string") {
          req.query[key] = sanitizeString(req.query[key]);
        }
      }
    }
    next();
  });
  app2.use((req, res, next) => {
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isExpoOrigin = origin?.includes("expo") || origin?.includes("exp.direct") || origin?.includes("exp://") || origin?.startsWith("http://192.168.") || origin?.startsWith("http://10.") || origin?.startsWith("http://172.") || !origin;
    if (isLocalhost || isExpoOrigin || !origin) {
      res.header("Access-Control-Allow-Origin", origin || "http://localhost:8081");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
    } else if (origin && !isLocalhost && !isExpoOrigin) {
      return res.status(403).json({ error: "Origin not allowed" });
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  app2.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });
  app2.get("/api/test", (req, res) => {
    res.json({ message: "API is working" });
  });
  app2.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login endpoint - security middleware applied" });
  });
  app2.post("/api/auth/register", (req, res) => {
    res.json({ message: "Register endpoint - security middleware applied" });
  });
  app2.get("/api/user/profile", (req, res) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded.exp && decoded.exp < Date.now() / 1e3) {
        return res.status(403).json({ error: "Token expired" });
      }
      res.json({ message: "Profile endpoint - authenticated", user: decoded });
    } catch (error) {
      return res.status(403).json({ error: "Invalid token" });
    }
  });
  app2.get("/api/products", (req, res) => {
    res.json({
      products: [
        { id: 1, name: "Test Product 1", price: 10.99 },
        { id: 2, name: "Test Product 2", price: 15.99 }
      ]
    });
  });
  app2.get("/api/products/search", (req, res) => {
    const { query } = req.query;
    res.json({
      products: [
        { id: 1, name: `Search result for: ${query}`, price: 10.99 }
      ]
    });
  });
  app2.get("/api/categories", (req, res) => {
    res.json({
      categories: [
        { id: 1, name: "Electronics" },
        { id: 2, name: "Food" }
      ]
    });
  });
  return createServer(app2);
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
config();
var app = express();
var log = console.log;
function setupBasicSecurity(app2) {
  app2.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
  const requestCounts = /* @__PURE__ */ new Map();
  app2.use((req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();
    const windowMs = 15 * 60 * 1e3;
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
          return res.status(429).json({ error: "Too many requests" });
        }
      }
    }
    next();
  });
}
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isExpoOrigin = origin?.includes("expo") || origin?.includes("exp.direct") || origin?.includes("exp://") || origin?.startsWith("http://192.168.") || origin?.startsWith("http://10.") || origin?.startsWith("http://172.") || !origin;
    if (isLocalhost || isExpoOrigin || !origin) {
      res.header("Access-Control-Allow-Origin", origin || "http://localhost:8081");
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS, PATCH"
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since"
      );
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app2.use(express.urlencoded({
    extended: false,
    limit: "10mb"
  }));
}
function validateInput(req, res, next) {
  const sanitizeString = (str) => {
    return str.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<javascript[^>]*>.*?<\/javascript>/gi, "").replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
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
  if (req.body) {
    const checkObject = (obj) => {
      if (typeof obj === "string") {
        if (detectSqlInjection(obj)) {
          return true;
        }
        req.body = sanitizeString(obj);
      } else if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
          if (checkObject(obj[key])) {
            return true;
          }
        }
      }
      return false;
    };
    if (checkObject(req.body)) {
      return res.status(400).json({ error: "Invalid input detected" });
    }
  }
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === "string") {
        req.query[key] = sanitizeString(req.query[key]);
      }
    }
  }
  next();
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
  app2.use((err, _req, res, next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = process.env.NODE_ENV === "production" ? "Internal Server Error" : error.message || "Internal Server Error";
    console.error("Error:", {
      status,
      message: error.message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (res.headersSent) {
      return next(err);
    }
    return res.status(status).json({
      error: message,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
}
(async () => {
  setupBasicSecurity(app);
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  app.use(validateInput);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`express server serving on port ${port}`);
    log(`Security features enabled: Basic headers, Rate limiting, CORS, Input validation, XSS protection, SQL injection protection`);
  });
})();
