import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./db-storage";
import { setupWebSocket, broadcast, sendToUser } from "./websocket";
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
  requireStore,
  requireAdminOrStore,
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

  // ── Public store listing (no auth required) ───────────────────────────────
  app.get("/api/stores", async (_req, res) => {
    try {
      const stores = await storage.getStores();
      res.json(stores.filter((s: any) => s.isActive && !s.deletedAt));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });

  app.post("/api/auth/register", 
    validateRequestBody(authSchemas.register),
    async (req, res) => {
      try {
        const { phoneNumber, password, name, role, storeName, storeAddress, storePhone, storeDescription } = req.body;

        // Only allow customer and store self-registration
        const allowedRoles = ["customer", "store"];
        const userRole = allowedRoles.includes(role) ? role : "customer";

        // Check if user already exists
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "User with this phone number already exists" });
        }

        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Create user with hashed password
        let user = await storage.createUser({ 
          phoneNumber, 
          password: hashedPassword, 
          name, 
          role: userRole,
        });

        // If store role, auto-create a store record and link back to user
        let store = null;
        if (userRole === "store") {
          store = await storage.createStore({
            ownerId: user.id,
            name: storeName || name || "Mening do'konim",
            description: storeDescription || null,
            address: storeAddress || null,
            phone: storePhone || phoneNumber,
            isActive: true,
          });
          // Set users.storeId so the link is bidirectional
          await storage.updateUser(user.id, { storeId: store.id });
          user = { ...user, storeId: store.id };
        }

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
          store,
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
        const cartTotal = req.query.cartTotal ? Number(req.query.cartTotal) : null;
        if (cartTotal !== null && promo.minAmount > 0 && cartTotal < promo.minAmount) {
          return res.status(400).json({
            error: "MIN_AMOUNT_NOT_MET",
            minAmount: promo.minAmount,
            cartTotal,
          });
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

        // Debug: log the column headers and first row so we can diagnose import issues
        if (rows.length > 0) {
          console.log("[IMPORT] Column headers found:", Object.keys(rows[0]));
          console.log("[IMPORT] First row raw data:", rows[0]);
        }

        // Normalize a row by mapping common Uzbek/Russian column aliases to English keys
        const normalizeRow = (raw: any): any => {
          // First pass: normalize all column header keys — trim whitespace and lowercase
          // This handles headers like "price " (trailing space), "Unit", "Original Price", etc.
          const trimmedRaw: any = {};
          for (const key of Object.keys(raw)) {
            trimmedRaw[key.trim().toLowerCase()] = raw[key];
          }
          raw = trimmedRaw;

          const aliases: Record<string, string[]> = {
            name:          ["nomi", "mahsulot_nomi", "mahsulot nomi", "название", "nаme", "product name", "product_name"],
            category:      ["kategoriya", "kategoriyа", "kategoria", "категория", "cat", "kategory"],
            price:         ["narx", "narxi", "нарх", "цена", "cost", "soum", "sum", "summa"],
            originalPrice: ["asl_narx", "asl narx", "asl_narxi", "original_price", "original price", "старая цена", "old_price", "old price"],
            unit:          ["birlik", "o'lchov", "olchov", "birlik/o'lchov", "birlik/olchov", "единица", "measure"],
            image:         ["rasm", "rasm_url", "rasm url", "изображение", "img", "photo", "foto"],
            badge:         ["yorliq", "badge", "метка", "label", "yorliq/nishon"],
            description:   ["tavsif", "описание", "desc", "info", "malumot"],
            brand:         ["brend", "бренд", "ishlab_chiqaruvchi", "manufacturer"],
            weight:        ["og'irlik", "ogirlik", "og'irlik/hajm", "вес", "vazn", "hajm"],
            stockQuantity: ["ombor", "miqdor", "stock", "stock_quantity", "запас", "qoldiq", "soni"],
            rating:        ["reyting", "рейтинг", "baho"],
          };

          const normalized: any = { ...raw };
          for (const [key, alts] of Object.entries(aliases)) {
            if (normalized[key] == null || normalized[key] === "") {
              for (const alt of alts) {
                // Exact match first
                const exactMatch = Object.keys(raw).find(
                  (k) => k.trim().toLowerCase() === alt.toLowerCase()
                );
                if (exactMatch && raw[exactMatch] != null && raw[exactMatch] !== "") {
                  normalized[key] = raw[exactMatch];
                  break;
                }
                // Partial match: column header starts with or contains the alias
                const partialMatch = Object.keys(raw).find(
                  (k) => k.trim().toLowerCase().startsWith(alt.toLowerCase())
                );
                if (partialMatch && raw[partialMatch] != null && raw[partialMatch] !== "") {
                  normalized[key] = raw[partialMatch];
                  break;
                }
              }
            }
          }
          return normalized;
        };

        const inserted: string[] = [];
        const errors: { row: number; error: string }[] = [];

        // Pre-load all categories for matching
        const existingCategories = await storage.getCategories();
        const categoryById = new Map(existingCategories.map((c) => [c.id.toLowerCase(), c.id]));
        const categoryByName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));

        // Resolve or auto-create a category given a raw value from Excel
        const resolveCategory = async (raw: string): Promise<string> => {
          const val = raw.trim().toLowerCase();
          if (!val) return existingCategories[0]?.id ?? "other";

          // Match by exact ID
          if (categoryById.has(val)) return categoryById.get(val)!;

          // Match by name
          if (categoryByName.has(val)) return categoryByName.get(val)!;

          // Partial name match
          for (const [name, id] of categoryByName) {
            if (name.includes(val) || val.includes(name)) return id;
          }

          // Auto-create the category
          const newId = val.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30) || `cat-${Date.now()}`;
          const colors = ["#16A34A", "#2563EB", "#DC2626", "#D97706", "#7C3AED", "#0891B2"];
          const color = colors[existingCategories.length % colors.length];
          const newCat = await storage.createCategory({
            id: newId,
            name: raw.trim(),
            icon: "grid-outline",
            color,
            bgColor: color + "22",
          });
          categoryById.set(newCat.id.toLowerCase(), newCat.id);
          categoryByName.set(newCat.name.toLowerCase(), newCat.id);
          existingCategories.push(newCat);
          return newCat.id;
        };

        for (let i = 0; i < rows.length; i++) {
          const row = normalizeRow(rows[i]);
          const rowNum = i + 2; // 1-indexed + header row

          const rawCategory = String(row.category || "").trim();
          const resolvedCategory = await resolveCategory(rawCategory);

          const productData = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${i}`,
            name: String(row.name || "").trim(),
            category: resolvedCategory,
            price: (() => {
              // If XLSX already gave us a JS number, use it directly
              if (typeof row.price === "number" && !isNaN(row.price)) return Math.round(row.price);
              const s = String(row.price ?? "").trim();
              if (!s) return 0;
              // Strip thousand separators: spaces, non-breaking spaces, apostrophes, commas
              // Then keep only digits and a single period as decimal point
              let cleaned = s.replace(/[\s\u00a0\u202f\u2009',]/g, "");
              // If the only non-digit is a comma used as decimal (e.g. "12000,50"), replace it
              if (/^\d+,\d{1,2}$/.test(s.trim())) cleaned = s.trim().replace(",", ".");
              cleaned = cleaned.replace(/[^0-9.]/g, "");
              const num = parseFloat(cleaned);
              return isNaN(num) ? 0 : Math.round(num);
            })(),
            originalPrice: (() => {
              if (!row.originalPrice) return undefined;
              if (typeof row.originalPrice === "number" && !isNaN(row.originalPrice)) return Math.round(row.originalPrice);
              const s = String(row.originalPrice).trim();
              let cleaned = s.replace(/[\s\u00a0\u202f\u2009',]/g, "");
              if (/^\d+,\d{1,2}$/.test(s)) cleaned = s.replace(",", ".");
              cleaned = cleaned.replace(/[^0-9.]/g, "");
              const num = parseFloat(cleaned);
              return isNaN(num) ? undefined : Math.round(num);
            })(),
            unit: String(row.unit || "").trim() || "dona",
            image: (() => {
              const img = String(row.image || "").trim();
              // Reject embedded base64 images — store a placeholder instead
              if (!img || img.startsWith("data:")) return "https://placehold.co/300x300/e2e8f0/64748b?text=Rasm+yo%27q";
              return img;
            })(),
            badge: row.badge ? String(row.badge).trim() : undefined,
            description: row.description ? String(row.description).trim() : undefined,
            brand: row.brand ? String(row.brand).trim() : undefined,
            weight: row.weight ? String(row.weight).trim() : undefined,
            rating: (() => {
              const r = row.rating;
              if (r == null || r === "") return "5.0";
              const num = parseFloat(String(r));
              if (isNaN(num)) return "5.0";
              return String(Math.min(Math.max(num, 1), 5).toFixed(1));
            })(),
            stockQuantity: (() => {
              const sq = row.stockQuantity;
              if (sq == null || sq === "") return 0;
              const num = Number(sq);
              return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
            })(),
            inStock: true,
          };

          if (!productData.name) {
            errors.push({ row: rowNum, error: "Mahsulot nomi bo'sh (name ustuni topilmadi yoki bo'sh)" });
            continue;
          }
          if (!productData.price || productData.price <= 0) {
            const rawPriceVal = row.price ?? "(topilmadi)";
            errors.push({ row: rowNum, error: `Narx noto'g'ri yoki topilmadi. Qiymat: "${rawPriceVal}". Ustun nomi "price", "narx", "narxi" yoki "цена" bo'lishi kerak.` });
            continue;
          }

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

  // Subcategories endpoints
  app.get("/api/subcategories",
    optionalAuth,
    async (_req, res) => {
      try {
        const subcategories = await storage.getSubcategories();
        res.json(subcategories);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ error: "Failed to fetch subcategories" });
      }
    }
  );

  app.get("/api/categories/:id/subcategories",
    optionalAuth,
    async (req, res) => {
      try {
        const subcategories = await storage.getSubcategoriesByCategory(req.params.id);
        res.json(subcategories);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ error: "Failed to fetch subcategories" });
      }
    }
  );

  app.post("/api/subcategories",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const subcategory = await storage.createSubcategory(req.body);
        broadcast("categories-changed");
        res.json(subcategory);
      } catch (error) {
        console.error("Error creating subcategory:", error);
        res.status(500).json({ error: "Failed to create subcategory" });
      }
    }
  );

  app.delete("/api/subcategories/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.softDeleteSubcategory(req.params.id);
        broadcast("categories-changed");
        res.sendStatus(204);
      } catch (error) {
        console.error("Error deleting subcategory:", error);
        res.status(500).json({ error: "Failed to delete subcategory" });
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

        // Notify only store owners whose products are in this order
        try {
          const affectedOwnerIds = await storage.notifyStoresForOrder(order);
          for (const ownerId of affectedOwnerIds) {
            sendToUser(ownerId, "new-order", { orderId: order.id });
          }
        } catch (notifErr) {
          console.error("Store notification error:", notifErr);
        }

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
        if (order.customerId) {
          sendToUser(order.customerId, "order-status-updated", {
            orderId: order.id,
            status: order.status,
          });
        }
        res.json(order);
      } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );

  app.post("/api/courier/location",
    authenticateToken,
    requireAdminOrCourier,
    async (req, res) => {
      try {
        const { orderId, latitude, longitude } = req.body;
        if (!orderId || latitude == null || longitude == null) {
          return res.status(400).json({ error: "orderId, latitude, longitude required" });
        }
        const order = await storage.getOrder(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.courierId && order.courierId !== req.user!.userId && req.user!.role !== "admin") {
          return res.status(403).json({ error: "Not your order" });
        }
        if (order.customerId) {
          sendToUser(order.customerId, "courier-location", {
            orderId,
            latitude,
            longitude,
          });
        }
        res.json({ ok: true });
      } catch (error) {
        console.error("Error relaying courier location:", error);
        res.status(500).json({ error: "Failed to relay location" });
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

  // ── Store owner routes (/api/store/*) ────────────────────────────────────
  // Get own store profile
  app.get("/api/store/profile",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });
        res.json(store);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store profile" });
      }
    }
  );

  // Update own store profile
  app.patch("/api/store/profile",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });
        const { name, description, address, phone, logo } = req.body;
        const updated = await storage.updateStore(store.id, { name, description, address, phone, logo });
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: "Failed to update store profile" });
      }
    }
  );

  // Get store products (own products only)
  app.get("/api/store/products",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });
        const products = await storage.getProductsByStore(store.id);
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store products" });
      }
    }
  );

  // Create product (store owner)
  app.post("/api/store/products",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });
        if (!store.isActive) return res.status(403).json({ error: "Store is not active" });

        const productData = {
          ...req.body,
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          storeId: store.id,
          inStock: true,
          stockQuantity: req.body.stockQuantity || 0,
        };

        const result = insertProductSchema.safeParse(productData);
        if (!result.success) {
          return res.status(400).json({ error: "Invalid product data", details: result.error });
        }
        const product = await storage.createProduct(result.data);
        broadcast("products-changed");
        res.json(product);
      } catch (error) {
        console.error("Error creating store product:", error);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  );

  // Update product (store owner — own products only) — both PATCH and PUT supported
  const storeProductUpdateHandler = [
    authenticateToken,
    requireStore,
    async (req: any, res: any) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });

        const product = await storage.getProduct(req.params.id);
        if (!product || product.storeId !== store.id) {
          return res.status(403).json({ error: "Not your product" });
        }

        // Strip immutable/sensitive fields — a store owner cannot reassign storeId or change identity fields
        const { id: _id, storeId: _storeId, deletedAt: _deletedAt, createdAt: _createdAt, ...safeBody } = req.body;

        const updated = await storage.updateProduct(req.params.id, safeBody);
        broadcast("products-changed");
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
      }
    },
  ];
  app.patch("/api/store/products/:id", ...storeProductUpdateHandler);
  app.put("/api/store/products/:id", ...storeProductUpdateHandler);

  // Delete product (store owner — own products only)
  app.delete("/api/store/products/:id",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });

        const product = await storage.getProduct(req.params.id);
        if (!product || product.storeId !== store.id) {
          return res.status(403).json({ error: "Not your product" });
        }

        await storage.softDeleteProduct(req.params.id);
        broadcast("products-changed");
        res.sendStatus(204);
      } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
      }
    }
  );

  // Get store orders (own store orders only)
  app.get("/api/store/orders",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });
        const orders = await storage.getOrdersByStore(store.id);
        res.json(orders);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store orders" });
      }
    }
  );

  // Update order status (store owner — own orders only, limited transitions)
  app.patch("/api/store/orders/:id/status",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });

        const { status } = req.body;
        // Store owners may only move orders through their preparation steps
        const allowed = ["preparing", "ready", "cancelled"];
        if (!status || !allowed.includes(status)) {
          return res.status(400).json({
            error: `Store owners can only set status to: ${allowed.join(", ")}`,
          });
        }

        // Verify this order belongs to the store (contains at least one product from it)
        const storeOrders = await storage.getOrdersByStore(store.id);
        const orderBelongsToStore = storeOrders.some((o: any) => o.id === req.params.id);
        if (!orderBelongsToStore) {
          return res.status(403).json({ error: "This order does not belong to your store" });
        }

        const order = await storage.updateOrderStatus(req.params.id, status);
        broadcast("orders-changed");
        res.json(order);
      } catch (error) {
        console.error("Error updating store order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );

  // Get store dashboard stats
  app.get("/api/store/stats",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user!.userId);
        if (!store) return res.status(404).json({ error: "Store not found" });

        const [products, orders] = await Promise.all([
          storage.getProductsByStore(store.id),
          storage.getOrdersByStore(store.id),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

        res.json({
          totalProducts: products.length,
          totalOrders: orders.length,
          todayOrders: todayOrders.length,
          todayRevenue,
          pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "confirmed").length,
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store stats" });
      }
    }
  );

  // ── Admin store management (/api/admin/stores) ───────────────────────────
  app.get("/api/admin/stores",
    authenticateToken,
    requireAdmin,
    async (_req, res) => {
      try {
        const stores = await storage.getStores();
        const storesWithOwners = await Promise.all(
          stores.map(async (store) => {
            try {
              const owner = await storage.getUser(store.ownerId);
              return { ...store, ownerName: owner?.name || "Noma'lum", ownerPhone: owner?.phoneNumber };
            } catch {
              return { ...store, ownerName: "Noma'lum", ownerPhone: null };
            }
          })
        );
        res.json(storesWithOwners);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch stores" });
      }
    }
  );

  app.patch("/api/admin/stores/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const updated = await storage.updateStore(req.params.id, req.body);
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: "Failed to update store" });
      }
    }
  );

  app.delete("/api/admin/stores/:id",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        await storage.softDeleteStore(req.params.id);
        res.sendStatus(204);
      } catch (error) {
        res.status(500).json({ error: "Failed to delete store" });
      }
    }
  );

  // Admin: create store owner account
  app.post("/api/admin/stores",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { phoneNumber, password, name, storeName, storeDescription, storeAddress, storePhone } = req.body;
        if (!phoneNumber || !password) {
          return res.status(400).json({ error: "phoneNumber and password are required" });
        }
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "User with this phone number already exists" });
        }
        const hashedPassword = await hashPassword(password);
        const newUser = await storage.createUser({ phoneNumber, password: hashedPassword, name, role: "store" });
        const store = await storage.createStore({
          ownerId: newUser.id,
          name: storeName || name || "Yangi do'kon",
          description: storeDescription || null,
          address: storeAddress || null,
          phone: storePhone || phoneNumber,
          isActive: true,
        });
        await storage.updateUser(newUser.id, { storeId: store.id });
        const { password: _, ...userWithoutPassword } = { ...newUser, storeId: store.id };
        res.status(201).json({ user: userWithoutPassword, store });
      } catch (error) {
        console.error("Error creating store:", error);
        res.status(500).json({ error: "Failed to create store" });
      }
    }
  );

  const httpServer = createServer(app);
  setupWebSocket(httpServer);
  return httpServer;
}
