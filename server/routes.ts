import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./db-storage";
import { setupWebSocket, broadcast } from "./websocket";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";
import * as XLSX from "xlsx";
import { hashPassword, comparePassword, validatePasswordStrength } from "../lib/password";
import { generateToken } from "../lib/jwt";
import { validateRequestBody, authSchemas } from "../lib/validation";
import { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrCourier, 
  requireCustomer,
  optionalAuth 
} from "../lib/auth-middleware";
import { 
  securityMiddleware, 
  rateLimiters, 
  validateApiKey, 
  securityLogger 
} from "../lib/security";
import { 
  sanitizeRequest, 
  sanitizeResponse,
  maskSensitiveData,
  logger
} from "../lib/data-security";
import { 
  getDatabaseUrl, 
  getJwtSecret, 
  getJwtExpiresIn,
  getEncryptionKey 
} from "../lib/env-config";

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security middleware
  app.use(securityMiddleware);
  app.use(securityLogger);
  app.use(validateApiKey);
  app.use(sanitizeRequest);
  app.use(sanitizeResponse);

  // Validate environment on startup
  try {
    const { validateEnvironment } = require('../lib/env-config');
    validateEnvironment();
  } catch (error) {
    console.error('❌ Environment validation failed. Server cannot start.');
    process.exit(1);
  }

  // Development endpoint to clear test users (only in development)
  if (process.env.NODE_ENV === "development") {
    app.delete("/api/dev/clear-test-users", async (_req, res) => {
      try {
        await storage.clearTestUsers();
        logger.info("Test users cleared successfully");
        res.json({ message: "Test users cleared successfully" });
      } catch (error) {
        logger.error("Error clearing test users:", error);
        res.status(500).json({ error: "Failed to clear test users" });
      }
    });
  }

  // Apply rate limiting to auth endpoints
  app.use('/api/auth', rateLimiters.auth);

  app.post("/api/auth/register", 
    validateRequestBody(authSchemas.register),
    async (req, res) => {
      try {
        const { phoneNumber, password, name } = req.body;

        // Check if user already exists
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "User with this phone number already exists" });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create user with hashed password
        const user = await storage.createUser({ 
          phoneNumber, 
          password: hashedPassword, 
          name, 
          role: "customer" 
        });

        // Generate JWT token
        const token = generateToken({
          userId: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        res.status(201).json({
          user: userWithoutPassword,
          token,
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
      }
    }
  );

  app.post("/api/auth/login", 
    validateRequestBody(authSchemas.login),
    async (req, res) => {
      try {
        const { phoneNumber, password } = req.body;

        logger.info("Login attempt", { 
          phoneNumber: maskSensitiveData(phoneNumber, 'phone')
        });

        // Find user by phone number
        const user = await storage.getUserByPhone(phoneNumber);
        if (!user) {
          logger.warn("Login failed: User not found", { 
            phoneNumber: maskSensitiveData(phoneNumber, 'phone') 
          });
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Compare password with hashed password
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
          logger.warn("Login failed: Invalid password", { 
            phoneNumber: maskSensitiveData(phoneNumber, 'phone') 
          });
          return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate JWT token
        const token = generateToken({
          userId: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role,
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        
        logger.info("Login successful", { 
          userId: user.id,
          phoneNumber: maskSensitiveData(user.phoneNumber, 'phone'),
          role: user.role
        });

        // Seed sample notifications for customers on first login
        if (user.role === "customer") {
          try {
            await (storage as any).seedNotificationsForUser(user.id);
          } catch (_) {}
        }
        
        res.json({
          user: userWithoutPassword,
          token,
        });
      } catch (error) {
        logger.error("Login error:", error);
        res.status(500).json({ error: "Failed to authenticate user" });
      }
    }
  );

  app.put("/api/user/location", 
    authenticateToken,
    validateRequestBody(authSchemas.updateLocation),
    async (req, res) => {
      try {
        const { userId, latitude, longitude, address } = req.body;
        
        // Users can only update their own location (except admins)
        if (req.user!.role !== 'admin' && req.user!.userId !== userId) {
          return res.status(403).json({ error: "You can only update your own location" });
        }

        await storage.updateUserLocation(userId, latitude, longitude, address);
        res.json({ message: "Location updated successfully" });
      } catch (error) {
        console.error("Location update error:", error);
        res.status(500).json({ error: "Failed to update location" });
      }
    }
  );

  // Apply general rate limiting to data endpoints
  app.use('/api', rateLimiters.general);

  // Couriers endpoint (admin only)
  app.get("/api/couriers", 
    authenticateToken, 
    requireAdmin, 
    async (_req, res) => {
      try {
        const couriers = await storage.getCouriers();
        res.json(couriers);
      } catch (error) {
        console.error("Error fetching couriers:", error);
        res.status(500).json({ error: "Failed to fetch couriers" });
      }
    }
  );

  // Create courier account (admin only)
  app.post("/api/auth/courier", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { phoneNumber, password, name } = req.body;
        
        // Validate input
        if (!phoneNumber || !password || !name) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        
        // Check if user already exists
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "User with this phone number already exists" });
        }
        
        // Hash password
        const hashedPassword = await hashPassword(password);
        
        const user = await storage.createUser({ 
          phoneNumber, 
          password: hashedPassword, 
          name, 
          role: "courier" 
        });
        
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error creating courier:", error);
        res.status(500).json({ error: "Failed to create courier" });
      }
    }
  );

  // Update profile name
  app.patch("/api/profile",
    authenticateToken,
    async (req, res) => {
      try {
        const { name } = req.body;
        if (!name || typeof name !== "string" || name.trim().length < 1) {
          return res.status(400).json({ error: "Invalid name" });
        }
        const updated = await storage.updateUser(req.user!.userId, { name: name.trim() });
        const { password: _, ...userWithoutPassword } = updated as any;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  );

  // Change password
  app.patch("/api/password",
    authenticateToken,
    async (req, res) => {
      try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
          return res.status(400).json({ error: "Both old and new password are required" });
        }
        const user = await storage.getUser(req.user!.userId);
        if (!user) return res.status(404).json({ error: "User not found" });
        const isValid = await comparePassword(oldPassword, user.password);
        if (!isValid) return res.status(400).json({ error: "Old password is incorrect" });
        const strength = validatePasswordStrength(newPassword);
        if (!strength.isValid) return res.status(400).json({ error: strength.errors[0] });
        const hashed = await hashPassword(newPassword);
        await storage.updateUser(req.user!.userId, { password: hashed });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to change password" });
      }
    }
  );

  // Promo codes endpoints
  app.get("/api/promo-codes", 
    authenticateToken,
    requireAdminOrCourier,
    async (_req, res) => {
      try {
        const promos = await storage.getPromoCodes();
        res.json(promos);
      } catch (error) {
        console.error("Error fetching promo codes:", error);
        res.status(500).json({ error: "Failed to fetch promo codes" });
      }
    }
  );

  app.post("/api/promo-codes", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const promo = await storage.createPromoCode(req.body);
        res.json(promo);
      } catch (error) {
        console.error("Error creating promo code:", error);
        res.status(500).json({ error: "Failed to create promo code" });
      }
    }
  );

  app.get("/api/promo-codes/:code", 
    optionalAuth,
    async (req, res) => {
      try {
        const promo = await storage.getPromoCode(req.params.code);
        if (!promo || !promo.isActive) {
          return res.status(404).json({ error: "Invalid or inactive promo code" });
        }
        res.json(promo);
      } catch (error) {
        console.error("Error fetching promo code:", error);
        res.status(500).json({ error: "Failed to fetch promo code" });
      }
    }
  );

  // Products endpoints
  app.get("/api/products", 
    optionalAuth,
    async (_req, res) => {
      try {
        const products = await storage.getProducts();
        res.json(products);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
      }
    }
  );

  app.post("/api/products/import",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { fileBase64 } = req.body;
        if (!fileBase64 || typeof fileBase64 !== "string") {
          return res.status(400).json({ error: "fileBase64 is required" });
        }

        const buffer = Buffer.from(fileBase64, "base64");
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const inserted: string[] = [];
        const errors: { row: number; error: string }[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2; // 1-indexed + header row

          const productData = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${i}`,
            name: String(row.name || "").trim(),
            category: String(row.category || "").trim(),
            price: Number(row.price) || 0,
            originalPrice: row.originalPrice ? Number(row.originalPrice) : undefined,
            unit: String(row.unit || "").trim(),
            image: String(row.image || "").trim(),
            badge: row.badge ? String(row.badge).trim() : undefined,
            description: row.description ? String(row.description).trim() : undefined,
            brand: row.brand ? String(row.brand).trim() : undefined,
            weight: row.weight ? String(row.weight).trim() : undefined,
            rating: row.rating ? String(row.rating).trim() : "5.0",
            stockQuantity: row.stockQuantity !== "" ? Number(row.stockQuantity) : 0,
            inStock: true,
          };

          const validation = insertProductSchema.safeParse(productData);
          if (!validation.success) {
            const msg = validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
            errors.push({ row: rowNum, error: msg });
            continue;
          }

          try {
            await storage.createProduct(validation.data);
            inserted.push(productData.id);
          } catch (dbErr: any) {
            errors.push({ row: rowNum, error: dbErr?.message ?? "DB error" });
          }
        }

        broadcast("products-changed");
        res.json({
          inserted: inserted.length,
          total: rows.length,
          errors,
        });
      } catch (error) {
        console.error("Error importing products:", error);
        res.status(500).json({ error: "Failed to parse or import Excel file" });
      }
    }
  );

  app.post("/api/products", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const result = insertProductSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: "Invalid product data", details: result.error });
        }
        const product = await storage.createProduct(result.data);
        broadcast("products-changed");
        res.json(product);
      } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  );

  app.patch("/api/products/:id", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const product = await storage.updateProduct(req.params.id, req.body);
        broadcast("products-changed");
        res.json(product);
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  );

  app.delete("/api/products/:id", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.softDeleteProduct(req.params.id);
        broadcast("products-changed");
        res.sendStatus(204);
      } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ error: "Failed to delete product" });
      }
    }
  );

  // Categories endpoints
  app.get("/api/categories", 
    optionalAuth,
    async (_req, res) => {
      try {
        const categories = await storage.getCategories();
        res.json(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    }
  );

  app.post("/api/categories", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const category = await storage.createCategory(req.body);
        broadcast("categories-changed");
        res.json(category);
      } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ error: "Failed to create category" });
      }
    }
  );

  app.delete("/api/categories/:id", 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.softDeleteCategory(req.params.id);
        broadcast("categories-changed");
        res.sendStatus(204);
      } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Failed to delete category" });
      }
    }
  );

  // Orders endpoints
  app.get("/api/orders/my",
    authenticateToken,
    async (req, res) => {
      try {
        const orders = await storage.getOrdersByCustomer(req.user!.userId);
        res.json(orders);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );

  app.get("/api/orders", 
    authenticateToken,
    requireAdminOrCourier,
    async (_req, res) => {
      try {
        const orders = await storage.getOrders();
        res.json(orders);
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );

  app.post("/api/orders", 
    authenticateToken,
    requireCustomer,
    async (req, res) => {
      try {
        const result = insertOrderSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: "Invalid order data", details: result.error });
        }
        
        // Add customer info from authenticated user
        const orderData = {
          ...result.data,
          customerId: req.user!.userId,
          customerName: result.data.customerName || req.user!.phoneNumber,
          phoneNumber: req.user!.phoneNumber,
          status: result.data.status ?? "pending",
          discount: result.data.discount ?? 0,
        };
        
        const order = await storage.createOrder(orderData);
        broadcast("orders-changed");
        res.json(order);
      } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
      }
    }
  );

  app.patch("/api/orders/:id/status", 
    authenticateToken,
    requireAdminOrCourier,
    async (req, res) => {
      try {
        const { status, courierId } = req.body;
        const order = await storage.updateOrderStatus(req.params.id, status, courierId);
        broadcast("orders-changed");
        res.json(order);
      } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );

  // ── Notifications ────────────────────────────────────────────────────────
  app.get("/api/notifications",
    authenticateToken,
    async (req, res) => {
      try {
        const notifications = await storage.getNotifications(req.user!.userId);
        res.json(notifications);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
      }
    }
  );

  app.get("/api/notifications/unread-count",
    authenticateToken,
    async (req, res) => {
      try {
        const count = await storage.getUnreadNotificationCount(req.user!.userId);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
      }
    }
  );

  app.patch("/api/notifications/read-all",
    authenticateToken,
    async (req, res) => {
      try {
        await storage.markAllNotificationsRead(req.user!.userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking all read:", error);
        res.status(500).json({ error: "Failed to mark notifications as read" });
      }
    }
  );

  app.patch("/api/notifications/:id/read",
    authenticateToken,
    async (req, res) => {
      try {
        await storage.markNotificationRead(req.params.id, req.user!.userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
      }
    }
  );

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  return httpServer;
}
