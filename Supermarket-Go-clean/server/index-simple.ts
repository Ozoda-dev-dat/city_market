import { config } from "dotenv";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import * as fs from "fs";
import * as path from "path";
import { storage } from "./db-storage";

// Load environment variables from .env file
config();

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

function setupCors(app: express.Application) {
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
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });
}

function setupBodyParsing(app: express.Application) {
  // Request size limits
  app.use(express.json({ 
    limit: '10mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.use(express.urlencoded({ 
    extended: false, 
    limit: '10mb' 
  }));
}

// Basic input validation
function validateInput(req: Request, res: Response, next: NextFunction) {
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
}

// Basic authentication middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  // Simple JWT verification (without external library for now)
  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    if (decoded.exp && decoded.exp < Date.now() / 1000) {
      return res.status(403).json({ error: 'Token expired' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

function setupRequestLogging(app: express.Application) {
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      if (!path.startsWith("/api")) return;

      const duration = Date.now() - start;

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    });

    next();
  });
}

function getAppName(): string {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}

function serveExpoManifest(platform: string, res: Response) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json",
  );

  if (!fs.existsSync(manifestPath)) {
    return res
      .status(404)
      .json({ error: `Manifest not found for platform: ${platform}` });
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
  appName,
}: {
  req: Request;
  res: Response;
  landingPageTemplate: string;
  appName: string;
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;

  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);

  const html = landingPageTemplate
    .replace(/BASE_URL_PLACEHOLDER/g, baseUrl)
    .replace(/EXPS_URL_PLACEHOLDER/g, expsUrl)
    .replace(/APP_NAME_PLACEHOLDER/g, appName);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}

function configureExpoAndLanding(app: express.Application) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html",
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();

  log("Serving static Expo files with dynamic manifest routing");

  app.use((req: Request, res: Response, next: NextFunction) => {
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
        appName,
      });
    }

    next();
  });

  app.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app.use(express.static(path.resolve(process.cwd(), "static-build")));

  log("Expo routing: Checking expo-platform header on / and /manifest");
}

function setupErrorHandler(app: express.Application) {
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Global error handler
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    const error = err as {
      status?: number;
      statusCode?: number;
      message?: string;
      code?: string;
    };

    const status = error.status || error.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : (error.message || 'Internal Server Error');

    console.error('Error:', {
      status,
      message: error.message,
      timestamp: new Date().toISOString()
    });

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  });
}

(async () => {
  setupBasicSecurity(app);
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);

  // Add security middlewares globally
  app.use(validateInput);
  // Note: authenticateToken will be applied to specific routes

  configureExpoAndLanding(app);

  const server = await registerRoutes(app);

  setupErrorHandler(app);

  const port = parseInt(process.env.PORT || "5001", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`express server serving on port ${port}`);
    log(`Security features enabled: Basic headers, Rate limiting, CORS, Input validation, XSS protection, SQL injection protection`);
  });
})();
