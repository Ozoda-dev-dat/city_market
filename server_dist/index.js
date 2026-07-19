"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// lib/env-config.ts
var env_config_exports = {};
__export(env_config_exports, {
  createSecureConfig: () => createSecureConfig,
  getApiKeys: () => getApiKeys,
  getCorsOrigins: () => getCorsOrigins,
  getDatabaseUrl: () => getDatabaseUrl,
  getEncryptionKey: () => getEncryptionKey,
  getEnv: () => getEnv,
  getExpoDomain: () => getExpoDomain,
  getJwtExpiresIn: () => getJwtExpiresIn,
  getJwtSecret: () => getJwtSecret,
  getLogLevel: () => getLogLevel,
  getPort: () => getPort,
  getReplitDomain: () => getReplitDomain,
  isDevelopment: () => isDevelopment,
  isProduction: () => isProduction,
  loadEnv: () => loadEnv,
  validateEnvironment: () => validateEnvironment
});
function loadEnv() {
  try {
    env = envSchema.parse(process.env);
    if (env.NODE_ENV === "production") {
      if (env.JWT_SECRET === "your-super-secret-jwt-key-change-in-production") {
        throw new Error("JWT_SECRET must be set in production");
      }
      if (!env.ENCRYPTION_KEY) {
        console.warn("[WARNING] ENCRYPTION_KEY not set. Sensitive data will not be encrypted.");
      }
      if (!env.API_KEYS) {
        console.warn("[WARNING] API_KEYS not set. API endpoints will be publicly accessible.");
      }
    }
    return env;
  } catch (error) {
    if (error instanceof import_zod2.z.ZodError) {
      console.error("\u274C Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path?.join(".")} : ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}
function getEnv() {
  if (!env) {
    env = loadEnv();
  }
  return env;
}
function getDatabaseUrl() {
  const env2 = getEnv();
  return env2.DATABASE_URL;
}
function getJwtSecret() {
  const env2 = getEnv();
  return env2.JWT_SECRET;
}
function getJwtExpiresIn() {
  const env2 = getEnv();
  return env2.JWT_EXPIRES_IN;
}
function getEncryptionKey() {
  const env2 = getEnv();
  return env2.ENCRYPTION_KEY;
}
function getApiKeys() {
  const env2 = getEnv();
  return env2.API_KEYS ? env2.API_KEYS.split(",").filter(Boolean) : [];
}
function getCorsOrigins() {
  const env2 = getEnv();
  const origins = env2.CORS_ORIGINS || "";
  if (!origins) {
    return [
      "http://localhost:8081",
      "http://localhost:3000",
      "exp://127.0.0.1:8081",
      "exp://localhost:8081"
    ];
  }
  return origins.split(",").map((origin) => origin.trim()).filter(Boolean);
}
function getLogLevel() {
  const env2 = getEnv();
  return env2.LOG_LEVEL;
}
function isDevelopment() {
  const env2 = getEnv();
  return env2.NODE_ENV === "development";
}
function isProduction() {
  const env2 = getEnv();
  return env2.NODE_ENV === "production";
}
function getPort() {
  const env2 = getEnv();
  return parseInt(env2.PORT, 10);
}
function getReplitDomain() {
  const env2 = getEnv();
  return env2.REPLIT_DEV_DOMAIN;
}
function getExpoDomain() {
  const env2 = getEnv();
  return env2.EXPO_PUBLIC_DOMAIN;
}
function validateEnvironment() {
  try {
    loadEnv();
    console.log("\u2705 Environment validation passed");
    const env2 = getEnv();
    console.log(`\u{1F4CA} Environment: ${env2.NODE_ENV}`);
    console.log(`\u{1F310} Port: ${env2.PORT}`);
    console.log(`\u{1F510} Log Level: ${env2.LOG_LEVEL}`);
    if (isProduction()) {
      if (!env2.ENCRYPTION_KEY) {
        console.warn("\u26A0\uFE0F  WARNING: ENCRYPTION_KEY not set in production");
      }
      if (!env2.API_KEYS) {
        console.warn("\u26A0\uFE0F  WARNING: API_KEYS not set in production");
      }
    }
  } catch (error) {
    console.error("\u274C Environment validation failed:", error);
    process.exit(1);
  }
}
function createSecureConfig() {
  const env2 = getEnv();
  return {
    app: {
      port: getPort(),
      env: env2.NODE_ENV
    },
    database: {
      url: getDatabaseUrl(),
      encryptionKey: getEncryptionKey()
    },
    auth: {
      jwtSecret: getJwtSecret(),
      jwtExpiresIn: getJwtExpiresIn()
    },
    security: {
      apiKeys: getApiKeys(),
      corsOrigins: getCorsOrigins(),
      encryptionKey: getEncryptionKey()
    },
    logging: {
      level: getLogLevel()
    },
    development: {
      replitDomain: getReplitDomain(),
      expoDomain: getExpoDomain()
    }
  };
}
var import_zod2, envSchema, env;
var init_env_config = __esm({
  "lib/env-config.ts"() {
    "use strict";
    import_zod2 = require("zod");
    envSchema = import_zod2.z.object({
      NODE_ENV: import_zod2.z.enum(["development", "production", "test"]).default("development"),
      PORT: import_zod2.z.string().default("5001"),
      DATABASE_URL: import_zod2.z.string().min(1, "Database URL is required"),
      JWT_SECRET: import_zod2.z.string().min(32, "JWT secret must be at least 32 characters"),
      JWT_EXPIRES_IN: import_zod2.z.string().default("7d"),
      API_KEYS: import_zod2.z.string().optional(),
      CORS_ORIGINS: import_zod2.z.string().optional(),
      LOG_LEVEL: import_zod2.z.enum(["debug", "info", "warn", "error"]).default("info"),
      ENCRYPTION_KEY: import_zod2.z.string().min(32, "Encryption key must be at least 32 characters").optional(),
      REPLIT_DEV_DOMAIN: import_zod2.z.string().optional(),
      EXPO_PUBLIC_DOMAIN: import_zod2.z.string().optional()
    });
  }
});

// server/index.ts
var import_dotenv = require("dotenv");
var import_express = __toESM(require("express"));

// server/routes.ts
var import_node_http = require("node:http");

// server/db-storage.ts
var import_postgres_js2 = require("drizzle-orm/postgres-js");
var import_drizzle_orm3 = require("drizzle-orm");
var import_postgres2 = __toESM(require("postgres"));

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminSettings: () => adminSettings,
  auditLogs: () => auditLogs,
  categories: () => categories,
  insertAdminSettingSchema: () => insertAdminSettingSchema,
  insertCategorySchema: () => insertCategorySchema,
  insertInventoryMovementSchema: () => insertInventoryMovementSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertPaymentMethodSchema: () => insertPaymentMethodSchema,
  insertPaymentTransactionSchema: () => insertPaymentTransactionSchema,
  insertProductReviewSchema: () => insertProductReviewSchema,
  insertProductSchema: () => insertProductSchema,
  insertPromoCodeSchema: () => insertPromoCodeSchema,
  insertRefundSchema: () => insertRefundSchema,
  insertStoreSchema: () => insertStoreSchema,
  insertSystemLogSchema: () => insertSystemLogSchema,
  insertUserSchema: () => insertUserSchema,
  insertWishlistSchema: () => insertWishlistSchema,
  inventoryMovements: () => inventoryMovements,
  notifications: () => notifications,
  orders: () => orders,
  otpCodes: () => otpCodes,
  paymentMethods: () => paymentMethods,
  paymentTransactions: () => paymentTransactions,
  productReviews: () => productReviews,
  products: () => products,
  promoCodes: () => promoCodes,
  refunds: () => refunds,
  stores: () => stores,
  subcategories: () => subcategories,
  systemLogs: () => systemLogs,
  users: () => users,
  wishlists: () => wishlists
});
var import_drizzle_orm = require("drizzle-orm");
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_zod = require("drizzle-zod");
var import_zod = require("zod");
var users = (0, import_pg_core.pgTable)("users", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  phoneNumber: (0, import_pg_core.text)("phone_number").notNull().unique(),
  password: (0, import_pg_core.text)("password").notNull(),
  role: (0, import_pg_core.text)("role").default("customer").notNull(),
  // admin, courier, customer, store
  name: (0, import_pg_core.text)("name"),
  address: (0, import_pg_core.text)("address"),
  latitude: (0, import_pg_core.text)("latitude"),
  longitude: (0, import_pg_core.text)("longitude"),
  storeId: (0, import_pg_core.varchar)("store_id").references(() => stores.id, { onDelete: "set null" }),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  vehicleType: (0, import_pg_core.text)("vehicle_type"),
  // for couriers: bike, car, on_foot, scooter
  courierStatus: (0, import_pg_core.text)("courier_status"),
  // for couriers: active, on_leave, suspended
  preferredPaymentMethod: (0, import_pg_core.text)("preferred_payment_method").default("cash"),
  // cash, payme, click, uzcard
  pushToken: (0, import_pg_core.text)("push_token"),
  // Expo push notification token
  notificationsEnabled: (0, import_pg_core.boolean)("notifications_enabled").default(true).notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  phoneIdx: (0, import_pg_core.index)("idx_users_phone").on(table.phoneNumber),
  roleIdx: (0, import_pg_core.index)("idx_users_role").on(table.role),
  activeIdx: (0, import_pg_core.index)("idx_users_active").on(table.isActive),
  storeIdx: (0, import_pg_core.index)("idx_users_store").on(table.storeId),
  locationIdx: (0, import_pg_core.index)("idx_users_location").on(table.latitude, table.longitude)
}));
var stores = (0, import_pg_core.pgTable)("stores", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  ownerId: (0, import_pg_core.varchar)("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: (0, import_pg_core.text)("name").notNull(),
  description: (0, import_pg_core.text)("description"),
  address: (0, import_pg_core.text)("address"),
  phone: (0, import_pg_core.text)("phone"),
  logo: (0, import_pg_core.text)("logo"),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  ownerIdx: (0, import_pg_core.index)("idx_stores_owner").on(table.ownerId),
  activeIdx: (0, import_pg_core.index)("idx_stores_active").on(table.isActive),
  nameIdx: (0, import_pg_core.index)("idx_stores_name").on(table.name)
}));
var categories = (0, import_pg_core.pgTable)("categories", {
  id: (0, import_pg_core.varchar)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  icon: (0, import_pg_core.text)("icon").notNull(),
  color: (0, import_pg_core.text)("color").notNull(),
  bgColor: (0, import_pg_core.text)("bg_color").notNull(),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  nameIdx: (0, import_pg_core.index)("idx_categories_name").on(table.name),
  activeIdx: (0, import_pg_core.index)("idx_categories_active").on(table.isActive)
}));
var subcategories = (0, import_pg_core.pgTable)("subcategories", {
  id: (0, import_pg_core.varchar)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  icon: (0, import_pg_core.text)("icon").notNull(),
  color: (0, import_pg_core.text)("color").notNull(),
  bgColor: (0, import_pg_core.text)("bg_color").notNull(),
  categoryId: (0, import_pg_core.varchar)("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  nameIdx: (0, import_pg_core.index)("idx_subcategories_name").on(table.name),
  categoryIdx: (0, import_pg_core.index)("idx_subcategories_category").on(table.categoryId),
  activeIdx: (0, import_pg_core.index)("idx_subcategories_active").on(table.isActive)
}));
var products = (0, import_pg_core.pgTable)("products", {
  id: (0, import_pg_core.varchar)("id").primaryKey(),
  name: (0, import_pg_core.text)("name").notNull(),
  category: (0, import_pg_core.text)("category").notNull().references(() => categories.id, { onDelete: "restrict" }),
  subcategoryId: (0, import_pg_core.varchar)("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
  storeId: (0, import_pg_core.varchar)("store_id").references(() => stores.id, { onDelete: "set null" }),
  price: (0, import_pg_core.integer)("price").notNull(),
  originalPrice: (0, import_pg_core.integer)("original_price"),
  unit: (0, import_pg_core.text)("unit").notNull(),
  image: (0, import_pg_core.text)("image").notNull(),
  badge: (0, import_pg_core.text)("badge"),
  rating: (0, import_pg_core.text)("rating").default("5.0"),
  description: (0, import_pg_core.text)("description"),
  brand: (0, import_pg_core.text)("brand"),
  weight: (0, import_pg_core.text)("weight"),
  inStock: (0, import_pg_core.boolean)("in_stock").default(true).notNull(),
  stockQuantity: (0, import_pg_core.integer)("stock_quantity").default(0).notNull(),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  nameIdx: (0, import_pg_core.index)("idx_products_name").on(table.name),
  categoryIdx: (0, import_pg_core.index)("idx_products_category").on(table.category),
  storeIdx: (0, import_pg_core.index)("idx_products_store").on(table.storeId),
  priceIdx: (0, import_pg_core.index)("idx_products_price").on(table.price),
  stockIdx: (0, import_pg_core.index)("idx_products_stock").on(table.stockQuantity),
  activeIdx: (0, import_pg_core.index)("idx_products_active").on(table.isActive),
  inStockIdx: (0, import_pg_core.index)("idx_products_in_stock").on(table.inStock)
}));
var promoCodes = (0, import_pg_core.pgTable)("promo_codes", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  code: (0, import_pg_core.text)("code").notNull().unique(),
  discountPercent: (0, import_pg_core.integer)("discount_percent").notNull(),
  minAmount: (0, import_pg_core.integer)("min_amount").default(0).notNull(),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  maxUses: (0, import_pg_core.integer)("max_uses").default(100).notNull(),
  usedCount: (0, import_pg_core.integer)("used_count").default(0).notNull(),
  validFrom: (0, import_pg_core.timestamp)("valid_from").defaultNow().notNull(),
  validUntil: (0, import_pg_core.timestamp)("valid_until"),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  codeIdx: (0, import_pg_core.index)("idx_promo_codes_code").on(table.code),
  activeIdx: (0, import_pg_core.index)("idx_promo_codes_active").on(table.isActive),
  validityIdx: (0, import_pg_core.index)("idx_promo_codes_validity").on(table.validFrom, table.validUntil)
}));
var orders = (0, import_pg_core.pgTable)("orders", {
  id: (0, import_pg_core.varchar)("id").primaryKey(),
  customerId: (0, import_pg_core.varchar)("customer_id").references(() => users.id, { onDelete: "restrict" }),
  courierId: (0, import_pg_core.varchar)("courier_id").references(() => users.id, { onDelete: "set null" }),
  customerName: (0, import_pg_core.text)("customer_name").notNull(),
  phoneNumber: (0, import_pg_core.text)("phone_number").notNull(),
  address: (0, import_pg_core.text)("address").notNull(),
  latitude: (0, import_pg_core.text)("latitude"),
  longitude: (0, import_pg_core.text)("longitude"),
  total: (0, import_pg_core.integer)("total").notNull(),
  discount: (0, import_pg_core.integer)("discount").default(0).notNull(),
  status: (0, import_pg_core.text)("status").default("pending").notNull(),
  deliveryType: (0, import_pg_core.text)("delivery_type").default("delivery").notNull(),
  items: (0, import_pg_core.jsonb)("items").notNull(),
  promoCodeId: (0, import_pg_core.varchar)("promo_code_id").references(() => promoCodes.id, { onDelete: "set null" }),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  deletedAt: (0, import_pg_core.timestamp)("deleted_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  customerIdx: (0, import_pg_core.index)("idx_orders_customer").on(table.customerId),
  courierIdx: (0, import_pg_core.index)("idx_orders_courier").on(table.courierId),
  statusIdx: (0, import_pg_core.index)("idx_orders_status").on(table.status),
  dateIdx: (0, import_pg_core.index)("idx_orders_date").on(table.createdAt),
  phoneIdx: (0, import_pg_core.index)("idx_orders_phone").on(table.phoneNumber),
  activeIdx: (0, import_pg_core.index)("idx_orders_active").on(table.isActive)
}));
var wishlists = (0, import_pg_core.pgTable)("wishlists", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: (0, import_pg_core.varchar)("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
}, (table) => ({
  userProductIdx: (0, import_pg_core.unique)("idx_wishlists_user_product").on(table.userId, table.productId),
  userIdx: (0, import_pg_core.index)("idx_wishlists_user").on(table.userId),
  productIdx: (0, import_pg_core.index)("idx_wishlists_product").on(table.productId)
}));
var productReviews = (0, import_pg_core.pgTable)("product_reviews", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  productId: (0, import_pg_core.varchar)("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: (0, import_pg_core.integer)("rating").notNull(),
  // 1-5
  title: (0, import_pg_core.text)("title"),
  comment: (0, import_pg_core.text)("comment"),
  isVerified: (0, import_pg_core.boolean)("is_verified").default(false).notNull(),
  helpfulCount: (0, import_pg_core.integer)("helpful_count").default(0).notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  productIdx: (0, import_pg_core.index)("idx_reviews_product").on(table.productId),
  userIdx: (0, import_pg_core.index)("idx_reviews_user").on(table.userId),
  ratingIdx: (0, import_pg_core.index)("idx_reviews_rating").on(table.rating),
  productUserIdx: (0, import_pg_core.unique)("idx_reviews_product_user").on(table.productId, table.userId)
}));
var notifications = (0, import_pg_core.pgTable)("notifications", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: (0, import_pg_core.text)("type").notNull(),
  // order_update, promo, product_available, etc.
  title: (0, import_pg_core.text)("title").notNull(),
  message: (0, import_pg_core.text)("message").notNull(),
  data: (0, import_pg_core.jsonb)("data"),
  // additional data payload
  isRead: (0, import_pg_core.boolean)("is_read").default(false).notNull(),
  priority: (0, import_pg_core.text)("priority").default("normal").notNull(),
  // low, normal, high, urgent
  expiresAt: (0, import_pg_core.timestamp)("expires_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
}, (table) => ({
  userIdx: (0, import_pg_core.index)("idx_notifications_user").on(table.userId),
  typeIdx: (0, import_pg_core.index)("idx_notifications_type").on(table.type),
  readIdx: (0, import_pg_core.index)("idx_notifications_read").on(table.isRead),
  priorityIdx: (0, import_pg_core.index)("idx_notifications_priority").on(table.priority),
  expiresIdx: (0, import_pg_core.index)("idx_notifications_expires").on(table.expiresAt)
}));
var paymentTransactions = (0, import_pg_core.pgTable)("payment_transactions", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  orderId: (0, import_pg_core.varchar)("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentMethod: (0, import_pg_core.text)("payment_method").notNull(),
  // stripe, paypal, cash_on_delivery, etc.
  amount: (0, import_pg_core.integer)("amount").notNull(),
  currency: (0, import_pg_core.text)("currency").default("UZS").notNull(),
  status: (0, import_pg_core.text)("status").notNull(),
  // pending, processing, completed, failed, refunded, cancelled
  gatewayTransactionId: (0, import_pg_core.text)("gateway_transaction_id"),
  // External gateway transaction ID
  gatewayResponse: (0, import_pg_core.jsonb)("gateway_response"),
  // Full response from payment gateway
  gatewayError: (0, import_pg_core.text)("gateway_error"),
  processedAt: (0, import_pg_core.timestamp)("processed_at"),
  refundedAt: (0, import_pg_core.timestamp)("refunded_at"),
  refundAmount: (0, import_pg_core.integer)("refund_amount"),
  refundReason: (0, import_pg_core.text)("refund_reason"),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  orderIdx: (0, import_pg_core.index)("idx_payment_transactions_order").on(table.orderId),
  userIdx: (0, import_pg_core.index)("idx_payment_transactions_user").on(table.userId),
  statusIdx: (0, import_pg_core.index)("idx_payment_transactions_status").on(table.status),
  methodIdx: (0, import_pg_core.index)("idx_payment_transactions_method").on(table.paymentMethod),
  gatewayIdx: (0, import_pg_core.index)("idx_payment_transactions_gateway").on(table.gatewayTransactionId),
  dateIdx: (0, import_pg_core.index)("idx_payment_transactions_date").on(table.createdAt)
}));
var paymentMethods = (0, import_pg_core.pgTable)("payment_methods", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: (0, import_pg_core.text)("type").notNull(),
  // card, bank_account, digital_wallet
  provider: (0, import_pg_core.text)("provider").notNull(),
  // stripe, paypal, etc.
  providerMethodId: (0, import_pg_core.text)("provider_method_id").notNull(),
  // External method ID
  brand: (0, import_pg_core.text)("brand"),
  // visa, mastercard, etc.
  last4: (0, import_pg_core.text)("last4"),
  expiryMonth: (0, import_pg_core.integer)("expiry_month"),
  expiryYear: (0, import_pg_core.integer)("expiry_year"),
  isDefault: (0, import_pg_core.boolean)("is_default").default(false).notNull(),
  isActive: (0, import_pg_core.boolean)("is_active").default(true).notNull(),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  userIdx: (0, import_pg_core.index)("idx_payment_methods_user").on(table.userId),
  typeIdx: (0, import_pg_core.index)("idx_payment_methods_type").on(table.type),
  providerIdx: (0, import_pg_core.index)("idx_payment_methods_provider").on(table.provider),
  defaultIdx: (0, import_pg_core.index)("idx_payment_methods_default").on(table.isDefault)
}));
var refunds = (0, import_pg_core.pgTable)("refunds", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  paymentTransactionId: (0, import_pg_core.varchar)("payment_transaction_id").notNull().references(() => paymentTransactions.id, { onDelete: "cascade" }),
  orderId: (0, import_pg_core.varchar)("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: (0, import_pg_core.varchar)("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: (0, import_pg_core.integer)("amount").notNull(),
  reason: (0, import_pg_core.text)("reason").notNull(),
  status: (0, import_pg_core.text)("status").notNull(),
  // pending, approved, rejected, processed
  processedBy: (0, import_pg_core.varchar)("processed_by").references(() => users.id, { onDelete: "set null" }),
  processedAt: (0, import_pg_core.timestamp)("processed_at"),
  gatewayRefundId: (0, import_pg_core.text)("gateway_refund_id"),
  gatewayResponse: (0, import_pg_core.jsonb)("gateway_response"),
  metadata: (0, import_pg_core.jsonb)("metadata"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  transactionIdx: (0, import_pg_core.index)("idx_refunds_transaction").on(table.paymentTransactionId),
  orderIdx: (0, import_pg_core.index)("idx_refunds_order").on(table.orderId),
  userIdx: (0, import_pg_core.index)("idx_refunds_user").on(table.userId),
  statusIdx: (0, import_pg_core.index)("idx_refunds_status").on(table.status),
  dateIdx: (0, import_pg_core.index)("idx_refunds_date").on(table.createdAt)
}));
var adminSettings = (0, import_pg_core.pgTable)("admin_settings", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  key: (0, import_pg_core.text)("key").notNull().unique(),
  value: (0, import_pg_core.text)("value").notNull(),
  type: (0, import_pg_core.text)("type").notNull(),
  // string, number, boolean, json
  description: (0, import_pg_core.text)("description"),
  category: (0, import_pg_core.text)("category").notNull(),
  // general, payment, email, security, etc.
  isPublic: (0, import_pg_core.boolean)("is_public").default(false).notNull(),
  updatedBy: (0, import_pg_core.varchar)("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core.timestamp)("updated_at").defaultNow().notNull()
}, (table) => ({
  keyIdx: (0, import_pg_core.index)("idx_admin_settings_key", table.key),
  categoryIdx: (0, import_pg_core.index)("idx_admin_settings_category", table.category),
  publicIdx: (0, import_pg_core.index)("idx_admin_settings_public", table.isPublic)
}));
var inventoryMovements = (0, import_pg_core.pgTable)("inventory_movements", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  productId: (0, import_pg_core.varchar)("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type: (0, import_pg_core.text)("type").notNull(),
  // purchase, sale, adjustment, return, loss
  quantity: (0, import_pg_core.integer)("quantity").notNull(),
  unitCost: (0, import_pg_core.integer)("unit_cost"),
  totalCost: (0, import_pg_core.integer)("total_cost"),
  reason: (0, import_pg_core.text)("reason"),
  previousStock: (0, import_pg_core.integer)("previous_stock").notNull(),
  newStock: (0, import_pg_core.integer)("new_stock").notNull(),
  userId: (0, import_pg_core.varchar)("user_id").references(() => users.id, { onDelete: "set null" }),
  referenceId: (0, import_pg_core.varchar)("reference_id"),
  // Order ID, Purchase ID, etc.
  metadata: (0, import_pg_core.jsonb)("metadata"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
}, (table) => ({
  productIdx: (0, import_pg_core.index)("idx_inventory_movements_product", table.productId),
  typeIdx: (0, import_pg_core.index)("idx_inventory_movements_type", table.type),
  userIdx: (0, import_pg_core.index)("idx_inventory_movements_user", table.userId),
  dateIdx: (0, import_pg_core.index)("idx_inventory_movements_date", table.createdAt),
  referenceIdx: (0, import_pg_core.index)("idx_inventory_movements_reference", table.referenceId)
}));
var systemLogs = (0, import_pg_core.pgTable)("system_logs", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  level: (0, import_pg_core.text)("level").notNull(),
  // debug, info, warn, error, fatal
  message: (0, import_pg_core.text)("message").notNull(),
  context: (0, import_pg_core.jsonb)("context"),
  userId: (0, import_pg_core.varchar)("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: (0, import_pg_core.text)("ip_address"),
  userAgent: (0, import_pg_core.text)("user_agent"),
  module: (0, import_pg_core.text)("module").notNull(),
  action: (0, import_pg_core.text)("action"),
  duration: (0, import_pg_core.integer)("duration"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
}, (table) => ({
  levelIdx: (0, import_pg_core.index)("idx_system_logs_level", table.level),
  moduleIdx: (0, import_pg_core.index)("idx_system_logs_module", table.module),
  userIdx: (0, import_pg_core.index)("idx_system_logs_user", table.userId),
  dateIdx: (0, import_pg_core.index)("idx_system_logs_date", table.createdAt),
  actionIdx: (0, import_pg_core.index)("idx_system_logs_action", table.action)
}));
var auditLogs = (0, import_pg_core.pgTable)("audit_logs", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  tableName: (0, import_pg_core.text)("table_name").notNull(),
  recordId: (0, import_pg_core.varchar)("record_id").notNull(),
  action: (0, import_pg_core.text)("action").notNull(),
  // INSERT, UPDATE, DELETE
  oldValues: (0, import_pg_core.jsonb)("old_values"),
  newValues: (0, import_pg_core.jsonb)("new_values"),
  userId: (0, import_pg_core.varchar)("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: (0, import_pg_core.text)("ip_address"),
  userAgent: (0, import_pg_core.text)("user_agent"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
}, (table) => ({
  tableIdx: (0, import_pg_core.index)("idx_audit_logs_table").on(table.tableName),
  recordIdx: (0, import_pg_core.index)("idx_audit_logs_record").on(table.recordId),
  actionIdx: (0, import_pg_core.index)("idx_audit_logs_action").on(table.action),
  userIdx: (0, import_pg_core.index)("idx_audit_logs_user").on(table.userId),
  dateIdx: (0, import_pg_core.index)("idx_audit_logs_date").on(table.createdAt)
}));
var insertWishlistSchema = (0, import_drizzle_zod.createInsertSchema)(wishlists, {
  userId: import_zod.z.string().uuid(),
  productId: import_zod.z.string().uuid()
});
var insertProductReviewSchema = (0, import_drizzle_zod.createInsertSchema)(productReviews, {
  rating: import_zod.z.number().min(1).max(5),
  title: import_zod.z.string().min(1).max(200).optional(),
  comment: import_zod.z.string().min(1).max(1e3).optional(),
  userId: import_zod.z.string().uuid(),
  productId: import_zod.z.string().uuid()
});
var insertPaymentTransactionSchema = (0, import_drizzle_zod.createInsertSchema)(paymentTransactions, {
  orderId: import_zod.z.string().uuid(),
  userId: import_zod.z.string().uuid(),
  paymentMethod: import_zod.z.enum(["stripe", "paypal", "cash_on_delivery", "bank_transfer", "digital_wallet"]),
  amount: import_zod.z.number().min(100),
  currency: import_zod.z.string().length(3).default("UZS"),
  status: import_zod.z.enum(["pending", "processing", "completed", "failed", "refunded", "cancelled"]),
  gatewayTransactionId: import_zod.z.string().optional(),
  refundAmount: import_zod.z.number().min(0).optional(),
  refundReason: import_zod.z.string().optional()
});
var insertPaymentMethodSchema = (0, import_drizzle_zod.createInsertSchema)(paymentMethods, {
  userId: import_zod.z.string().uuid(),
  type: import_zod.z.enum(["card", "bank_account", "digital_wallet"]),
  provider: import_zod.z.string().min(2),
  providerMethodId: import_zod.z.string().min(1),
  brand: import_zod.z.string().optional(),
  last4: import_zod.z.string().length(4).optional(),
  expiryMonth: import_zod.z.number().min(1).max(12).optional(),
  expiryYear: import_zod.z.number().min(2024).max(2050).optional()
});
var insertAdminSettingSchema = (0, import_drizzle_zod.createInsertSchema)(adminSettings, {
  key: import_zod.z.string().min(1).max(100),
  type: import_zod.z.enum(["string", "number", "boolean", "json"]),
  value: import_zod.z.string().min(1),
  category: import_zod.z.enum(["general", "payment", "email", "security", "notification", "inventory"]),
  description: import_zod.z.string().max(500).optional(),
  isPublic: import_zod.z.boolean().default(false)
});
var insertInventoryMovementSchema = (0, import_drizzle_zod.createInsertSchema)(inventoryMovements, {
  productId: import_zod.z.string().uuid(),
  type: import_zod.z.enum(["purchase", "sale", "adjustment", "return", "loss"]),
  quantity: import_zod.z.number(),
  unitCost: import_zod.z.number().min(0).optional(),
  totalCost: import_zod.z.number().min(0).optional(),
  reason: import_zod.z.string().max(500).optional(),
  userId: import_zod.z.string().uuid().optional(),
  referenceId: import_zod.z.string().uuid().optional()
});
var insertSystemLogSchema = (0, import_drizzle_zod.createInsertSchema)(systemLogs, {
  level: import_zod.z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: import_zod.z.string().min(1).max(1e3),
  module: import_zod.z.string().min(1).max(50),
  action: import_zod.z.string().max(100).optional(),
  duration: import_zod.z.number().min(0).optional(),
  userId: import_zod.z.string().uuid().optional()
});
var insertRefundSchema = (0, import_drizzle_zod.createInsertSchema)(refunds, {
  paymentTransactionId: import_zod.z.string().uuid(),
  orderId: import_zod.z.string().uuid(),
  userId: import_zod.z.string().uuid(),
  amount: import_zod.z.number().min(1),
  reason: import_zod.z.string().min(10).max(500),
  status: import_zod.z.enum(["pending", "approved", "rejected", "processed"]),
  processedBy: import_zod.z.string().uuid().optional(),
  gatewayRefundId: import_zod.z.string().optional()
});
var insertNotificationSchema = (0, import_drizzle_zod.createInsertSchema)(notifications, {
  userId: import_zod.z.string().uuid(),
  type: import_zod.z.enum(["order_update", "promo", "product_available", "system", "reminder", "new_order"]),
  title: import_zod.z.string().min(1).max(200),
  message: import_zod.z.string().min(1).max(500),
  priority: import_zod.z.enum(["low", "normal", "high", "urgent"])
});
var insertStoreSchema = (0, import_drizzle_zod.createInsertSchema)(stores, {
  name: import_zod.z.string().min(1).max(200),
  description: import_zod.z.string().max(1e3).optional(),
  address: import_zod.z.string().max(500).optional(),
  phone: import_zod.z.string().optional(),
  logo: import_zod.z.string().optional()
});
var insertUserSchema = (0, import_drizzle_zod.createInsertSchema)(users, {
  phoneNumber: import_zod.z.string().regex(/^\+998\d{9}$/, "Invalid Uzbek phone number format"),
  role: import_zod.z.enum(["admin", "courier", "customer", "store"]),
  name: import_zod.z.string().min(1).max(100).optional(),
  address: import_zod.z.string().max(500).optional()
});
var insertProductSchema = (0, import_drizzle_zod.createInsertSchema)(products, {
  name: import_zod.z.string().min(1).max(200),
  price: import_zod.z.number().min(0).max(1e7),
  originalPrice: import_zod.z.number().min(0).max(1e7).optional(),
  unit: import_zod.z.string().min(1).max(20),
  rating: import_zod.z.string().regex(/^\d+(\.\d+)?$/, "Invalid rating format").optional(),
  stockQuantity: import_zod.z.number().min(0).max(1e4).default(0)
});
var insertOrderSchema = (0, import_drizzle_zod.createInsertSchema)(orders, {
  customerName: import_zod.z.string().min(1).max(100),
  phoneNumber: import_zod.z.string().regex(/^\+998\d{9}$/, "Invalid Uzbek phone number format"),
  address: import_zod.z.string().min(1).max(500),
  total: import_zod.z.number().min(0).max(1e7),
  discount: import_zod.z.number().min(0).max(1e7).optional(),
  status: import_zod.z.enum(["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"]).optional(),
  deliveryType: import_zod.z.enum(["delivery", "pickup"]).optional()
});
var insertPromoCodeSchema = (0, import_drizzle_zod.createInsertSchema)(promoCodes, {
  code: import_zod.z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, "Promo code must be uppercase alphanumeric"),
  discountPercent: import_zod.z.number().min(1).max(100),
  minAmount: import_zod.z.number().min(0).default(0),
  maxUses: import_zod.z.number().min(1).max(1e4),
  usedCount: import_zod.z.number().min(0).max(1e4)
});
var insertCategorySchema = (0, import_drizzle_zod.createInsertSchema)(categories, {
  name: import_zod.z.string().min(1).max(50),
  icon: import_zod.z.string().min(1).max(50),
  color: import_zod.z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  bgColor: import_zod.z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid background color format")
});
var otpCodes = (0, import_pg_core.pgTable)("otp_codes", {
  id: (0, import_pg_core.varchar)("id").primaryKey().default(import_drizzle_orm.sql`gen_random_uuid()`),
  phoneNumber: (0, import_pg_core.text)("phone_number").notNull(),
  code: (0, import_pg_core.text)("code").notNull(),
  purpose: (0, import_pg_core.text)("purpose").notNull().default("register"),
  expiresAt: (0, import_pg_core.timestamp)("expires_at").notNull(),
  usedAt: (0, import_pg_core.timestamp)("used_at"),
  createdAt: (0, import_pg_core.timestamp)("created_at").defaultNow().notNull()
}, (table) => ({
  phoneIdx: (0, import_pg_core.index)("idx_otp_phone").on(table.phoneNumber)
}));

// server/audit-service.ts
var import_drizzle_orm2 = require("drizzle-orm");
var import_postgres_js = require("drizzle-orm/postgres-js");
var import_postgres = __toESM(require("postgres"));
var AuditService = class {
  db = null;
  getDb() {
    if (this.db)
      return this.db;
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    const client = (0, import_postgres.default)(process.env.DATABASE_URL);
    this.db = (0, import_postgres_js.drizzle)(client, { schema: schema_exports });
    return this.db;
  }
  async logInsert(tableName, recordId, userId, ipAddress, userAgent) {
    await this.logChange({
      tableName,
      recordId,
      action: "INSERT",
      newValues: { id: recordId },
      userId,
      ipAddress,
      userAgent
    });
  }
  async logUpdate(tableName, recordId, userId, ipAddress, userAgent) {
    await this.logChange({
      tableName,
      recordId,
      action: "UPDATE",
      userId,
      ipAddress,
      userAgent
    });
  }
  async logDelete(tableName, recordId, userId, ipAddress, userAgent) {
    await this.logChange({
      tableName,
      recordId,
      action: "DELETE",
      userId,
      ipAddress,
      userAgent
    });
  }
  async logRestore(tableName, recordId, userId, ipAddress, userAgent) {
    await this.logChange({
      tableName,
      recordId,
      action: "UPDATE",
      newValues: { restored: true },
      userId,
      ipAddress,
      userAgent
    });
  }
  async logChange(params) {
    try {
      const db = this.getDb();
      await db.insert(auditLogs).values({
        tableName: params.tableName,
        recordId: params.recordId,
        action: params.action,
        oldValues: params.oldValues,
        newValues: params.newValues,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      });
    } catch (error) {
      console.error("Failed to log audit change:", error);
    }
  }
  async getAuditHistory(tableName, recordId) {
    const db = this.getDb();
    return await db.select().from(auditLogs).where(
      (0, import_drizzle_orm2.and)(
        (0, import_drizzle_orm2.eq)(auditLogs.tableName, tableName),
        (0, import_drizzle_orm2.eq)(auditLogs.recordId, recordId)
      )
    ).orderBy(auditLogs.createdAt);
  }
  async getUserActivity(userId, limit = 50) {
    const db = this.getDb();
    return await db.select().from(auditLogs).where((0, import_drizzle_orm2.eq)(auditLogs.userId, userId)).orderBy(auditLogs.createdAt).limit(limit);
  }
  async getTableActivity(tableName, limit = 100) {
    const db = this.getDb();
    return await db.select().from(auditLogs).where((0, import_drizzle_orm2.eq)(auditLogs.tableName, tableName)).orderBy(auditLogs.createdAt).limit(limit);
  }
};
var auditService = new AuditService();

// server/db-storage.ts
var DbStorage = class {
  db;
  constructor() {
    let connectionString;
    if (process.env.DATABASE_URL) {
      connectionString = process.env.DATABASE_URL.trim();
      const psqlMatch = connectionString.match(/^psql\s+'(.+)'$/);
      if (psqlMatch)
        connectionString = psqlMatch[1];
    } else if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
      const host = process.env.PGHOST;
      const port = process.env.PGPORT || "5432";
      const user = process.env.PGUSER;
      const password = encodeURIComponent(process.env.PGPASSWORD || "");
      const db = process.env.PGDATABASE;
      connectionString = `postgresql://${user}:${password}@${host}:${port}/${db}`;
    } else {
      throw new Error("DATABASE_URL or PG* environment variables are not set");
    }
    const disableSsl = /sslmode=disable/i.test(connectionString);
    const client = (0, import_postgres2.default)(connectionString, { ssl: disableSsl ? false : "require" });
    this.db = (0, import_postgres_js2.drizzle)(client, { schema: schema_exports });
    this.initMockData();
  }
  async initMockData() {
    try {
      const existingCats = await this.db.select().from(categories);
      if (existingCats.length === 0) {
        const cats = [
          { id: "fruits", name: "Mevalar", icon: "nutrition", color: "#1A9B5C", bgColor: "#E8F5E9" },
          { id: "vegetables", name: "Sabzavotlar", icon: "leaf", color: "#2ECC71", bgColor: "#F1F8E9" },
          { id: "dairy", name: "Sut mahsulotlari", icon: "flask", color: "#3498DB", bgColor: "#EBF5FB" },
          { id: "bakery", name: "Non mahsulotlari", icon: "pizza", color: "#E74C3C", bgColor: "#FDEDEC" },
          { id: "meat", name: "Go'sht mahsulotlari", icon: "fish", color: "#9B59B6", bgColor: "#F4ECF7" },
          { id: "ichimliklar", name: "Ichimliklar", icon: "wine", color: "#7C3AED", bgColor: "#EDE9FE" },
          { id: "shokoladlar", name: "Shokoladlar", icon: "gift-outline", color: "#B45309", bgColor: "#FEF3C7" },
          { id: "konservalar", name: "Konservalar", icon: "cube-outline", color: "#374151", bgColor: "#F3F4F6" }
        ];
        for (const cat of cats) {
          await this.db.insert(categories).values(cat);
        }
        const subcats = [
          // Under fruits
          { id: "sub-mevalar", name: "Mevalar", icon: "nutrition", color: "#FF6B35", bgColor: "#FFF0EB", categoryId: "fruits" },
          // Under vegetables
          { id: "sub-sabzavotlar", name: "Sabzavotlar", icon: "leaf", color: "#1A9B5C", bgColor: "#E8F5EE", categoryId: "vegetables" },
          // Under bakery
          { id: "sub-non", name: "Non mahsulotlari", icon: "pizza", color: "#F59E0B", bgColor: "#FFFBEB", categoryId: "bakery" },
          // Under konservalar
          { id: "sub-konserva", name: "Konservalar", icon: "cube-outline", color: "#374151", bgColor: "#F3F4F6", categoryId: "konservalar" },
          // Under murabbo va djemlar
          { id: "sub-murabbo", name: "Murabbo va djemlar", icon: "heart", color: "#DB2777", bgColor: "#FDF2F8", categoryId: "murabbo-va-djemlar" },
          // Under choy
          { id: "sub-choy", name: "Choy", icon: "cafe", color: "#6B7280", bgColor: "#F3F4F6", categoryId: "choy" },
          // Under coffee category
          { id: "sub-coffee-cat", name: "Coffee", icon: "cafe", color: "#6F4E37", bgColor: "#F5ECE5", categoryId: "coffee" },
          // Under ketchuplar
          { id: "sub-ketchup", name: "Ketchuplar", icon: "fast-food", color: "#DC2626", bgColor: "#FEF2F2", categoryId: "ketchuplar" },
          // Under makaron
          { id: "sub-makaron", name: "Makaron, un va yormalar", icon: "restaurant", color: "#D97706", bgColor: "#FFFBEB", categoryId: "makaron-un-yormalar" },
          // Under mayonezlar
          { id: "sub-mayonez", name: "Mayonezlar", icon: "restaurant", color: "#F59E0B", bgColor: "#FFFBEB", categoryId: "mayonezlar" },
          // Under sharbatlar category
          { id: "sub-sharbat-cat", name: "Sharbatlar", icon: "wine", color: "#F97316", bgColor: "#FFF7ED", categoryId: "sharbatlar" },
          // Under shokoladlar
          { id: "sub-shokolad", name: "Shokoladlar", icon: "gift-outline", color: "#92400E", bgColor: "#FEF3C7", categoryId: "shokoladlar" },
          // Under shokolatli-pastalar
          { id: "sub-pasta", name: "Shokolatli pastalar", icon: "cafe", color: "#78350F", bgColor: "#FEF3C7", categoryId: "shokolatli-pastalar" },
          // Under yog-va-souslar
          { id: "sub-yog", name: "Yog va souslar", icon: "flask", color: "#FBBF24", bgColor: "#FFFBEB", categoryId: "yog-va-souslar" },
          // Under yongok-va-sneklar
          { id: "sub-sneklar", name: "Yongok va sneklar", icon: "pizza", color: "#D97706", bgColor: "#FEF3C7", categoryId: "yongok-va-sneklar" },
          // Under bolalar-ovqatlar
          { id: "sub-bolalar", name: "Bolalar ovqatlar", icon: "heart", color: "#F472B6", bgColor: "#FDF2F8", categoryId: "bolalar-ovqatlar" },
          // Under oyinchoqlar
          { id: "sub-oyinchoq", name: "Oyinchoqlar", icon: "gift-outline", color: "#8B5CF6", bgColor: "#F5F3FF", categoryId: "oyinchoqlar" },
          // Under shampunlar
          { id: "sub-shampun", name: "Shampunlar", icon: "water", color: "#06B6D4", bgColor: "#ECFEFF", categoryId: "shampunlar" },
          // Under tagliklar
          { id: "sub-taglik", name: "Tagliklar", icon: "cube-outline", color: "#6B7280", bgColor: "#F9FAFB", categoryId: "tagliklar" },
          // Under ichimliklar
          { id: "sub-energetik", name: "Energetik ichimliklar", icon: "flash", color: "#F59E0B", bgColor: "#FEF3C7", categoryId: "ichimliklar" },
          // Under meat
          { id: "sub-gosht", name: "Go'sht", icon: "flame", color: "#EF4444", bgColor: "#FEF2F2", categoryId: "meat" },
          { id: "sub-kolbasa", name: "Kolbasa mahsulotlari", icon: "fast-food", color: "#DC2626", bgColor: "#FEF2F2", categoryId: "meat" },
          // Under dairy
          { id: "sub-pishloq", name: "Pishloq", icon: "restaurant", color: "#FBBF24", bgColor: "#FFFBEB", categoryId: "dairy" },
          { id: "sub-qatiq", name: "Qatiq mahsulotlari", icon: "water", color: "#3B82F6", bgColor: "#EFF6FF", categoryId: "dairy" },
          { id: "sub-tuxum", name: "Tuxum mahsulotlari", icon: "egg", color: "#F59E0B", bgColor: "#FFFBEB", categoryId: "dairy" },
          { id: "sub-yogurt", name: "Yogurt", icon: "water", color: "#8B5CF6", bgColor: "#F5F3FF", categoryId: "dairy" }
        ];
        for (const sub of subcats) {
          await this.db.insert(subcategories).values(sub);
        }
        console.log("\u2705 Default categories and subcategories created");
      }
      const existingAdmin = await this.db.select().from(users).where((0, import_drizzle_orm3.eq)(users.role, "admin")).limit(1);
      if (existingAdmin.length === 0) {
        const bcrypt2 = await import("bcryptjs");
        const hashedPassword = await bcrypt2.hash("Odamboy1307", 10);
        await this.db.insert(users).values({
          phoneNumber: "+998978562020",
          password: hashedPassword,
          role: "admin",
          name: "Admin"
        });
        console.log("\u2705 Default admin user created");
      }
      const existingProducts = await this.db.select().from(products);
      if (existingProducts.length === 0) {
        const sampleProducts = [
          {
            id: "apple-1",
            name: "Qizil olma",
            category: "fruits",
            price: 15e3,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
            description: "To'q qizil, shirin va mazali olma",
            brand: "Local Farm",
            weight: "1kg",
            stockQuantity: 100
          },
          {
            id: "banana-1",
            name: "Banan",
            category: "fruits",
            price: 2e4,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
            description: "Yetilgan, sariq banan",
            brand: "Tropical Fruits",
            weight: "1kg",
            stockQuantity: 50
          },
          {
            id: "tomato-1",
            name: "Pomidor",
            category: "vegetables",
            price: 8e3,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1546470427-e92b2c9c09d6?w=400",
            description: "Yangi, qizil pomidor",
            brand: "Green House",
            weight: "1kg",
            stockQuantity: 200
          }
        ];
        for (const product of sampleProducts) {
          await this.db.insert(products).values(product);
        }
        console.log("\u2705 Sample products created");
      }
    } catch (error) {
      console.error("\u274C Error initializing mock data:", error);
    }
  }
  async getUser(id) {
    const users2 = await this.db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, id));
    return users2[0];
  }
  async getUserByPhone(phoneNumber) {
    console.log("Database: Looking for phone:", phoneNumber);
    const users2 = await this.db.select().from(users).where((0, import_drizzle_orm3.eq)(users.phoneNumber, phoneNumber));
    console.log("Database: Found users:", users2);
    console.log("Database: Returning first user:", users2[0]);
    return users2[0];
  }
  async createUser(insertUser) {
    const result = await this.db.insert(users).values(insertUser).returning();
    await auditService.logInsert("users", result[0].id);
    return result[0];
  }
  async updateUser(id, updateUser, userId, ipAddress, userAgent) {
    const oldUser = await this.getUser(id);
    const result = await this.db.update(users).set({ ...updateUser, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(users.id, id)).returning();
    await auditService.logChange({
      tableName: "users",
      recordId: id,
      action: "UPDATE",
      oldValues: oldUser,
      newValues: result[0],
      userId,
      ipAddress,
      userAgent
    });
    return result[0];
  }
  async getUsers(includeDeleted = false) {
    if (includeDeleted) {
      return await this.db.select().from(users);
    }
    return await this.db.select().from(users).where((0, import_drizzle_orm3.isNull)(users.deletedAt));
  }
  async softDeleteUser(id, userId, ipAddress, userAgent) {
    const oldUser = await this.getUser(id);
    await this.db.update(users).set({ deletedAt: /* @__PURE__ */ new Date(), isActive: false }).where((0, import_drizzle_orm3.eq)(users.id, id));
    await auditService.logChange({
      tableName: "users",
      recordId: id,
      action: "DELETE",
      oldValues: oldUser,
      userId,
      ipAddress,
      userAgent
    });
  }
  async restoreUser(id, userId, ipAddress, userAgent) {
    const result = await this.db.update(users).set({ deletedAt: null, isActive: true }).where((0, import_drizzle_orm3.eq)(users.id, id)).returning();
    await auditService.logChange({
      tableName: "users",
      recordId: id,
      action: "UPDATE",
      newValues: result[0],
      userId,
      ipAddress,
      userAgent
    });
    return result[0];
  }
  async updateUserLocation(userId, latitude, longitude, address) {
    const result = await this.db.update(users).set({ latitude, longitude, address }).where((0, import_drizzle_orm3.eq)(users.id, userId)).returning();
    return result[0];
  }
  async getCouriers() {
    return await this.db.select().from(users).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(users.role, "courier"),
        (0, import_drizzle_orm3.isNull)(users.deletedAt)
      )
    );
  }
  async clearTestUsers() {
    await this.db.update(users).set({ deletedAt: /* @__PURE__ */ new Date(), isActive: false }).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(users.role, "customer"),
        (0, import_drizzle_orm3.isNull)(users.deletedAt)
      )
    );
  }
  async getProducts() {
    return await this.db.select().from(products).where((0, import_drizzle_orm3.isNull)(products.deletedAt));
  }
  async getProduct(id) {
    const products2 = await this.db.select().from(products).where((0, import_drizzle_orm3.eq)(products.id, id));
    return products2[0];
  }
  async createProduct(product) {
    const result = await this.db.insert(products).values(product).returning();
    await auditService.logInsert("products", result[0].id);
    return result[0];
  }
  async updateProduct(id, update, userId, ipAddress, userAgent) {
    const result = await this.db.update(products).set(update).where((0, import_drizzle_orm3.eq)(products.id, id)).returning();
    await auditService.logUpdate("products", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async softDeleteProduct(id, userId, ipAddress, userAgent) {
    await this.db.update(products).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(products.id, id));
    await auditService.logDelete("products", id, userId, ipAddress, userAgent);
  }
  async restoreProduct(id, userId, ipAddress, userAgent) {
    const result = await this.db.update(products).set({ deletedAt: null }).where((0, import_drizzle_orm3.eq)(products.id, id)).returning();
    await auditService.logRestore("products", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async getCategories() {
    return await this.db.select().from(categories).where((0, import_drizzle_orm3.isNull)(categories.deletedAt));
  }
  async createCategory(category) {
    const result = await this.db.insert(categories).values(category).returning();
    await auditService.logInsert("categories", result[0].id);
    return result[0];
  }
  async softDeleteCategory(id, userId, ipAddress, userAgent) {
    await this.db.update(categories).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(categories.id, id));
    await auditService.logDelete("categories", id, userId, ipAddress, userAgent);
  }
  async restoreCategory(id, userId, ipAddress, userAgent) {
    const result = await this.db.update(categories).set({ deletedAt: null }).where((0, import_drizzle_orm3.eq)(categories.id, id)).returning();
    await auditService.logRestore("categories", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async getSubcategories() {
    return await this.db.select().from(subcategories).where((0, import_drizzle_orm3.isNull)(subcategories.deletedAt));
  }
  async getSubcategoriesByCategory(categoryId) {
    return await this.db.select().from(subcategories).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(subcategories.categoryId, categoryId),
        (0, import_drizzle_orm3.isNull)(subcategories.deletedAt)
      )
    );
  }
  async createSubcategory(subcategory) {
    const result = await this.db.insert(subcategories).values(subcategory).returning();
    return result[0];
  }
  async softDeleteSubcategory(id, userId) {
    await this.db.update(subcategories).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(subcategories.id, id));
  }
  async getOrders() {
    return await this.db.select().from(orders);
  }
  async getOrder(id) {
    const result = await this.db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.id, id));
    return result[0];
  }
  async getOrdersByCustomer(customerId) {
    return await this.db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.customerId, customerId));
  }
  async createOrder(order) {
    const result = await this.db.insert(orders).values(order).returning();
    await auditService.logInsert("orders", result[0].id);
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId) {
          await this.db.update(products).set({ stockQuantity: import_drizzle_orm3.sql`GREATEST(0, stock_quantity - ${item.qty || 1})` }).where((0, import_drizzle_orm3.eq)(products.id, item.productId));
        }
      }
    }
    return result[0];
  }
  async updateOrderStatus(id, status, courierId, userId, ipAddress, userAgent) {
    const updateData = { status };
    if (courierId) {
      updateData.courierId = courierId;
    }
    const result = await this.db.update(orders).set(updateData).where((0, import_drizzle_orm3.eq)(orders.id, id)).returning();
    await auditService.logUpdate("orders", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async softDeleteOrder(id, userId, ipAddress, userAgent) {
    await this.db.update(orders).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(orders.id, id));
    await auditService.logDelete("orders", id, userId, ipAddress, userAgent);
  }
  async restoreOrder(id, userId, ipAddress, userAgent) {
    const result = await this.db.update(orders).set({ deletedAt: null }).where((0, import_drizzle_orm3.eq)(orders.id, id)).returning();
    await auditService.logRestore("orders", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async getPromoCode(code) {
    const promoCodes2 = await this.db.select().from(promoCodes).where((0, import_drizzle_orm3.eq)(promoCodes.code, code));
    return promoCodes2[0];
  }
  async getPromoCodes() {
    return await this.db.select().from(promoCodes);
  }
  async createPromoCode(promo) {
    const result = await this.db.insert(promoCodes).values(promo).returning();
    await auditService.logInsert("promoCodes", result[0].id);
    return result[0];
  }
  async updatePromoCode(id, promo, userId, ipAddress, userAgent) {
    const result = await this.db.update(promoCodes).set(promo).where((0, import_drizzle_orm3.eq)(promoCodes.id, id)).returning();
    await auditService.logUpdate("promoCodes", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async softDeletePromoCode(id, userId, ipAddress, userAgent) {
    await this.db.update(promoCodes).set({ deletedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(promoCodes.id, id));
    await auditService.logDelete("promoCodes", id, userId, ipAddress, userAgent);
  }
  async restorePromoCode(id, userId, ipAddress, userAgent) {
    const result = await this.db.update(promoCodes).set({ deletedAt: null }).where((0, import_drizzle_orm3.eq)(promoCodes.id, id)).returning();
    await auditService.logRestore("promoCodes", id, userId, ipAddress, userAgent);
    return result[0];
  }
  async getNotifications(userId) {
    return this.db.select().from(notifications).where((0, import_drizzle_orm3.eq)(notifications.userId, userId)).orderBy((0, import_drizzle_orm3.desc)(notifications.createdAt)).limit(50);
  }
  async getUnreadNotificationCount(userId) {
    const result = await this.db.select({ count: import_drizzle_orm3.sql`cast(count(*) as int)` }).from(notifications).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(notifications.userId, userId),
        (0, import_drizzle_orm3.eq)(notifications.isRead, false)
      )
    );
    return result[0]?.count ?? 0;
  }
  async markNotificationRead(id, userId) {
    await this.db.update(notifications).set({ isRead: true }).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(notifications.id, id),
        (0, import_drizzle_orm3.eq)(notifications.userId, userId)
      )
    );
  }
  async markAllNotificationsRead(userId) {
    await this.db.update(notifications).set({ isRead: true }).where(
      (0, import_drizzle_orm3.and)(
        (0, import_drizzle_orm3.eq)(notifications.userId, userId),
        (0, import_drizzle_orm3.eq)(notifications.isRead, false)
      )
    );
  }
  async createNotification(notification) {
    const result = await this.db.insert(notifications).values(notification).returning();
    return result[0];
  }
  async getStores() {
    return await this.db.select().from(stores).where((0, import_drizzle_orm3.isNull)(stores.deletedAt)).orderBy((0, import_drizzle_orm3.desc)(stores.createdAt));
  }
  async getStore(id) {
    const result = await this.db.select().from(stores).where((0, import_drizzle_orm3.eq)(stores.id, id));
    return result[0];
  }
  async getStoreByOwner(ownerId) {
    const result = await this.db.select().from(stores).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(stores.ownerId, ownerId), (0, import_drizzle_orm3.isNull)(stores.deletedAt)));
    return result[0];
  }
  async createStore(store) {
    const result = await this.db.insert(stores).values(store).returning();
    return result[0];
  }
  async updateStore(id, update) {
    const result = await this.db.update(stores).set({ ...update, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(stores.id, id)).returning();
    return result[0];
  }
  async softDeleteStore(id) {
    await this.db.update(stores).set({ deletedAt: /* @__PURE__ */ new Date(), isActive: false }).where((0, import_drizzle_orm3.eq)(stores.id, id));
  }
  async getProductsByStore(storeId) {
    return await this.db.select().from(products).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(products.storeId, storeId), (0, import_drizzle_orm3.isNull)(products.deletedAt))).orderBy((0, import_drizzle_orm3.desc)(products.createdAt));
  }
  async getProductCountByStore(storeId) {
    const result = await this.db.select({ count: import_drizzle_orm3.sql`count(*)::int` }).from(products).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(products.storeId, storeId), (0, import_drizzle_orm3.isNull)(products.deletedAt)));
    return result[0]?.count ?? 0;
  }
  async getOrdersByStore(storeId) {
    const storeProducts = await this.db.select({ id: products.id }).from(products).where((0, import_drizzle_orm3.eq)(products.storeId, storeId));
    if (storeProducts.length === 0)
      return [];
    const productIds = new Set(storeProducts.map((p) => p.id));
    const allOrders = await this.db.select().from(orders).orderBy((0, import_drizzle_orm3.desc)(orders.createdAt));
    const result = [];
    for (const order of allOrders) {
      const items = Array.isArray(order.items) ? order.items : [];
      const storeItems = items.filter(
        (item) => productIds.has(item.id || item.productId)
      );
      if (storeItems.length > 0) {
        result.push({ ...order, items: storeItems });
      }
    }
    return result;
  }
  async notifyStoresForOrder(order) {
    const items = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0)
      return [];
    const productIds = items.map((i) => i.id || i.productId).filter(Boolean);
    if (productIds.length === 0)
      return [];
    const products2 = await this.db.select({ id: products.id, name: products.name, storeId: products.storeId }).from(products).where((0, import_drizzle_orm3.inArray)(products.id, productIds));
    const storeItemsMap = /* @__PURE__ */ new Map();
    for (const item of items) {
      const productId = item.id || item.productId;
      const product = products2.find((p) => p.id === productId);
      if (!product?.storeId)
        continue;
      if (!storeItemsMap.has(product.storeId)) {
        storeItemsMap.set(product.storeId, []);
      }
      storeItemsMap.get(product.storeId).push({
        productName: product.name,
        quantity: item.quantity || 1
      });
    }
    const affectedOwnerIds = [];
    for (const [storeId, storeItems] of storeItemsMap) {
      const store = await this.getStore(storeId);
      if (!store || !store.isActive)
        continue;
      const itemsText = storeItems.map((i) => `${i.productName} x${i.quantity}`).join(", ");
      await this.createNotification({
        userId: store.ownerId,
        type: "new_order",
        title: "Yangi buyurtma!",
        message: `Buyurtma #${order.id.slice(-6).toUpperCase()}: ${itemsText}`,
        data: {
          orderId: order.id,
          items: storeItems,
          customerName: order.customerName,
          address: order.address
        },
        isRead: false,
        priority: "high"
      });
      affectedOwnerIds.push(store.ownerId);
    }
    return affectedOwnerIds;
  }
  async seedNotificationsForUser(userId) {
    const existing = await this.db.select({ count: import_drizzle_orm3.sql`cast(count(*) as int)` }).from(notifications).where((0, import_drizzle_orm3.eq)(notifications.userId, userId));
    if ((existing[0]?.count ?? 0) > 0)
      return;
    const now = /* @__PURE__ */ new Date();
    const samples = [
      {
        userId,
        type: "promo",
        title: "Chegirma mavjud!",
        message: "Barcha mevalar bo'limida 20% chegirma. Faqat bugun!",
        isRead: false,
        priority: "high",
        createdAt: new Date(now.getTime() - 5 * 60 * 1e3)
      },
      {
        userId,
        type: "order_update",
        title: "Buyurtmangiz yetkazildi",
        message: "Buyurtmangiz muvaffaqiyatli yetkazib berildi. Xaridingizdan mamnunmisiz?",
        isRead: false,
        priority: "normal",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1e3)
      },
      {
        userId,
        type: "product_available",
        title: "Mahsulot mavjud",
        message: "Siz kutgan Organik tarvuz yana do'konda paydo bo'ldi!",
        isRead: false,
        priority: "normal",
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1e3)
      },
      {
        userId,
        type: "promo",
        title: "Yangi promo-kod!",
        message: "CITY20 promo-kodidan foydalaning va 15 000 so'm chegirma oling.",
        isRead: true,
        priority: "normal",
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1e3)
      },
      {
        userId,
        type: "system",
        title: "City Marketga xush kelibsiz!",
        message: "Ilovamizdan foydalanganingiz uchun rahmat. Yaxshi xaridlar!",
        isRead: true,
        priority: "low",
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1e3)
      }
    ];
    for (const n of samples) {
      await this.db.insert(notifications).values(n);
    }
  }
};
var storage = new DbStorage();

// server/websocket.ts
var import_ws = require("ws");

// lib/jwt.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
init_env_config();
var JWT_EXPIRES_IN = getJwtExpiresIn();
function generateToken(payload) {
  return import_jsonwebtoken.default.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN
  });
}
function verifyToken(token) {
  try {
    const decoded = import_jsonwebtoken.default.verify(token, getJwtSecret());
    return decoded;
  } catch (error) {
    if (error instanceof import_jsonwebtoken.default.TokenExpiredError) {
      throw new Error("Token expired");
    } else if (error instanceof import_jsonwebtoken.default.JsonWebTokenError) {
      throw new Error("Invalid token");
    } else {
      throw new Error("Token verification failed");
    }
  }
}
function extractTokenFromHeader(authHeader) {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1];
}

// server/websocket.ts
var wss = null;
var userSockets = /* @__PURE__ */ new Map();
function setupWebSocket(httpServer) {
  wss = new import_ws.WebSocketServer({ server: httpServer, path: "/ws" });
  wss.on("connection", (ws) => {
    let userId = null;
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === "auth" && msg.token) {
          const payload = verifyToken(msg.token);
          const newUserId = payload.userId;
          if (userId && userId !== newUserId) {
            const oldSockets = userSockets.get(userId);
            if (oldSockets) {
              oldSockets.delete(ws);
              if (oldSockets.size === 0)
                userSockets.delete(userId);
            }
          }
          userId = newUserId;
          if (!userSockets.has(userId)) {
            userSockets.set(userId, /* @__PURE__ */ new Set());
          }
          userSockets.get(userId).add(ws);
          ws.send(JSON.stringify({ event: "auth-ok", userId }));
        } else if (msg.type === "deauth") {
          if (userId) {
            const sockets = userSockets.get(userId);
            if (sockets) {
              sockets.delete(ws);
              if (sockets.size === 0)
                userSockets.delete(userId);
            }
            userId = null;
          }
        }
      } catch (_) {
      }
    });
    ws.on("error", () => {
    });
    ws.on("close", () => {
      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(ws);
          if (sockets.size === 0) {
            userSockets.delete(userId);
          }
        }
      }
    });
  });
  console.log("[WS] WebSocket server attached on /ws");
}
function broadcast(event, data) {
  if (!wss)
    return;
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  wss.clients.forEach((client) => {
    if (client.readyState === import_ws.WebSocket.OPEN) {
      client.send(message);
    }
  });
}
function sendToUser(userId, event, data) {
  const sockets = userSockets.get(userId);
  if (!sockets)
    return;
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  sockets.forEach((ws) => {
    if (ws.readyState === import_ws.WebSocket.OPEN) {
      ws.send(message);
    }
  });
}

// server/routes.ts
var XLSX = __toESM(require("xlsx"));

// lib/password.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var SALT_ROUNDS = 12;
async function hashPassword(password) {
  try {
    const salt = await import_bcryptjs.default.genSalt(SALT_ROUNDS);
    const hashedPassword = await import_bcryptjs.default.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}
async function comparePassword(password, hashedPassword) {
  try {
    const isValid = await import_bcryptjs.default.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    console.error("Error comparing password:", error);
    throw new Error("Failed to compare password");
  }
}
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (password.length > 128) {
    errors.push("Password must be less than 128 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /letmein/i,
    /welcome/i
  ];
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push("Password cannot contain common patterns");
      break;
    }
  }
  if (/\s/.test(password)) {
    errors.push("Password cannot contain whitespace");
  }
  return {
    isValid: errors.length === 0,
    errors
  };
}

// lib/validation.ts
var import_zod3 = require("zod");
var PHONE_REGEX = /^\+998\d{9}$/;
var authSchemas = {
  register: import_zod3.z.object({
    phoneNumber: import_zod3.z.string().regex(PHONE_REGEX, "Invalid phone number format"),
    password: import_zod3.z.string().min(6, "Password must be at least 6 characters").max(128, "Password must be less than 128 characters"),
    name: import_zod3.z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters").regex(/^[a-zA-Z\s\u0400-\u04FF'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
    role: import_zod3.z.enum(["customer", "store", "courier"]).optional(),
    storeName: import_zod3.z.string().min(2).max(200).optional(),
    storeAddress: import_zod3.z.string().min(2).max(500).optional(),
    storePhone: import_zod3.z.string().optional(),
    storeDescription: import_zod3.z.string().max(1e3).optional()
  }).superRefine((data, ctx) => {
    if (data.role === "store") {
      if (!data.storeName) {
        ctx.addIssue({ code: "custom", path: ["storeName"], message: "Store name is required for store accounts" });
      }
      if (!data.storeAddress) {
        ctx.addIssue({ code: "custom", path: ["storeAddress"], message: "Store address is required for store accounts" });
      }
    }
  }),
  sendOtp: import_zod3.z.object({
    phoneNumber: import_zod3.z.string().regex(PHONE_REGEX, "Invalid phone number format"),
    purpose: import_zod3.z.enum(["register", "login"]).optional()
  }),
  verifyOtpRegister: import_zod3.z.object({
    phoneNumber: import_zod3.z.string().regex(PHONE_REGEX, "Invalid phone number format"),
    code: import_zod3.z.string().length(6, "OTP must be 6 digits"),
    name: import_zod3.z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
    role: import_zod3.z.enum(["customer", "store", "courier"]).optional(),
    storeName: import_zod3.z.string().min(2).max(200).optional(),
    storeAddress: import_zod3.z.string().min(2).max(500).optional()
  }),
  login: import_zod3.z.object({
    phoneNumber: import_zod3.z.string().regex(PHONE_REGEX, "Invalid phone number format"),
    password: import_zod3.z.string().min(1, "Password is required")
  }),
  updateLocation: import_zod3.z.object({
    userId: import_zod3.z.string().uuid("Invalid user ID"),
    latitude: import_zod3.z.string().regex(/^-?\d+\.?\d*$/, "Invalid latitude format"),
    longitude: import_zod3.z.string().regex(/^-?\d+\.?\d*$/, "Invalid longitude format"),
    address: import_zod3.z.string().min(5, "Address must be at least 5 characters").max(200, "Address must be less than 200 characters")
  })
};
function validateRequestBody(schema) {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof import_zod3.z.ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.errors.map((err) => err.message)
        });
      }
      return res.status(400).json({
        error: "Invalid request data"
      });
    }
  };
}

// server/sms-service.ts
var ESKIZ_EMAIL = process.env.ESKIZ_EMAIL || "";
var ESKIZ_PASSWORD = process.env.ESKIZ_PASSWORD || "";
var ESKIZ_BASE = "https://notify.eskiz.uz/api";
var _token = null;
var _tokenExpiry = 0;
async function getToken() {
  if (_token && Date.now() < _tokenExpiry)
    return _token;
  if (!ESKIZ_EMAIL || !ESKIZ_PASSWORD)
    return null;
  try {
    const res = await fetch(`${ESKIZ_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ESKIZ_EMAIL, password: ESKIZ_PASSWORD })
    });
    const data = await res.json();
    _token = data?.data?.token || null;
    _tokenExpiry = Date.now() + 28 * 60 * 1e3;
    return _token;
  } catch {
    return null;
  }
}
async function sendSms(phone, message) {
  const token = await getToken();
  if (!token) {
    console.warn("[SMS] Eskiz credentials not set \u2014 SMS not sent (dev mode)");
    return false;
  }
  try {
    const normalized = phone.replace(/^\+/, "");
    const res = await fetch(`${ESKIZ_BASE}/message/sms/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        mobile_phone: normalized,
        message,
        from: "4546",
        callback_url: ""
      })
    });
    const data = await res.json();
    return data?.status === "waiting" || data?.id != null;
  } catch (e) {
    console.error("[SMS] Send error:", e);
    return false;
  }
}
function isSmsConfigured() {
  return !!(ESKIZ_EMAIL && ESKIZ_PASSWORD);
}

// server/otp-service.ts
var import_postgres_js3 = require("drizzle-orm/postgres-js");
var import_postgres3 = __toESM(require("postgres"));
var import_drizzle_orm4 = require("drizzle-orm");
init_env_config();
function getDb() {
  const client = (0, import_postgres3.default)(getDatabaseUrl(), { max: 1 });
  return (0, import_postgres_js3.drizzle)(client, { schema: { otpCodes } });
}
function generateCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
var otpService = {
  async createOtp(phoneNumber, purpose = "register") {
    const db = getDb();
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1e3);
    await db.insert(otpCodes).values({
      phoneNumber,
      code,
      purpose,
      expiresAt
    });
    return code;
  },
  async verifyOtp(phoneNumber, code, purpose = "register") {
    const db = getDb();
    const now = /* @__PURE__ */ new Date();
    const rows = await db.select().from(otpCodes).where(
      (0, import_drizzle_orm4.and)(
        (0, import_drizzle_orm4.eq)(otpCodes.phoneNumber, phoneNumber),
        (0, import_drizzle_orm4.eq)(otpCodes.code, code),
        (0, import_drizzle_orm4.eq)(otpCodes.purpose, purpose),
        (0, import_drizzle_orm4.gt)(otpCodes.expiresAt, now),
        (0, import_drizzle_orm4.isNull)(otpCodes.usedAt)
      )
    ).limit(1);
    if (rows.length === 0)
      return false;
    await db.update(otpCodes).set({ usedAt: now }).where((0, import_drizzle_orm4.eq)(otpCodes.id, rows[0].id));
    return true;
  },
  async ensureTable() {
    const dbUrl = getDatabaseUrl();
    const client = (0, import_postgres3.default)(dbUrl, { max: 1 });
    try {
      await client`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          phone_number TEXT NOT NULL,
          code TEXT NOT NULL,
          purpose TEXT NOT NULL DEFAULT 'register',
          expires_at TIMESTAMP NOT NULL,
          used_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_codes(phone_number)
      `;
    } finally {
      await client.end();
    }
  }
};

// server/push-service.ts
var expo = null;
async function getExpo() {
  if (!expo) {
    const { Expo } = await import("expo-server-sdk");
    expo = new Expo();
  }
  return expo;
}
async function sendPushToUser(userId, title, body, data) {
  try {
    const user = await storage.getUser(userId);
    if (!user)
      return;
    const token = user.pushToken;
    const enabled = user.notificationsEnabled;
    if (!token || enabled === false)
      return;
    const expo2 = await getExpo();
    if (!expo2.constructor.isExpoPushToken(token)) {
      console.warn(`Push token for user ${userId} is not a valid Expo push token, skipping`);
      return;
    }
    const message = {
      to: token,
      sound: "default",
      title,
      body,
      data: data ?? {}
    };
    const receipts = await expo2.sendPushNotificationsAsync([message]);
    for (const receipt of receipts) {
      if (receipt.status === "error") {
        console.error("Push notification error:", receipt.message, receipt.details);
        if (receipt.details?.error === "DeviceNotRegistered") {
          await storage.updateUser(userId, { pushToken: null });
        }
      }
    }
  } catch (error) {
    console.error("Failed to send push notification:", error);
  }
}

// lib/auth-middleware.ts
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    if (!token) {
      res.status(401).json({
        error: "Access denied",
        message: "No token provided"
      });
      return;
    }
    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Authentication failed";
    if (message === "Token expired") {
      res.status(401).json({
        error: "Token expired",
        message: "Please login again"
      });
    } else if (message === "Invalid token") {
      res.status(401).json({
        error: "Invalid token",
        message: "Authentication failed"
      });
    } else {
      res.status(401).json({
        error: "Authentication failed",
        message: "Invalid credentials"
      });
    }
  }
}
function authorizeRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({
        error: "Access denied",
        message: "Authentication required"
      });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Access denied",
        message: "Insufficient permissions"
      });
      return;
    }
    next();
  };
}
var requireAdmin = authorizeRole(["admin"]);
var requireAdminOrCourier = authorizeRole(["admin", "courier"]);
var requireCustomer = authorizeRole(["customer"]);
var requireStore = authorizeRole(["store"]);
var requireAdminOrStore = authorizeRole(["admin", "store"]);
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);
    if (token) {
      const user = verifyToken(token);
      req.user = user;
    }
    next();
  } catch (error) {
    next();
  }
}

// lib/security.ts
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var import_helmet = __toESM(require("helmet"));
var createRateLimiter = (options) => {
  return (0, import_express_rate_limit.default)({
    windowMs: options?.windowMs || 15 * 60 * 1e3,
    // 15 minutes
    max: options?.max || 100,
    // Limit each IP to 100 requests per windowMs
    message: options?.message || {
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later."
    },
    standardHeaders: options?.standardHeaders !== false,
    // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: options?.legacyHeaders !== false,
    // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(options?.windowMs || 9e5)
        // 15 minutes in ms
      });
    }
  });
};
var rateLimiters = {
  // Rate limiting for auth endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 2e3,
    // High limit — Replit proxies ALL traffic through one IP
    message: {
      error: "Too many authentication attempts",
      message: "Please try again after 15 minutes."
    }
  }),
  // Moderate rate limiting for general API
  general: createRateLimiter({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 1e4
    // High limit — all users share one IP on Replit
  }),
  // Lenient rate limiting for data fetching
  data: createRateLimiter({
    windowMs: 15 * 60 * 1e3,
    // 15 minutes
    max: 2e4
    // High limit — all users share one IP on Replit
  }),
  // Very strict rate limiting for sensitive operations
  sensitive: createRateLimiter({
    windowMs: 60 * 60 * 1e3,
    // 1 hour
    max: 100,
    // 100 requests per hour
    message: {
      error: "Rate limit exceeded",
      message: "Please try again after 1 hour."
    }
  })
};
var helmetConfig = (0, import_helmet.default)({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Required for Expo
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
      fontSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  // Required for Expo
  hsts: {
    maxAge: 31536e3,
    // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});
var requestSizeLimit = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = req.headers["content-length"];
    if (contentLength && parseInt(contentLength) > maxSize) {
      return res.status(413).json({
        error: "Request entity too large",
        message: `Request size exceeds limit of ${maxSize / 1024 / 1024}MB`
      });
    }
    next();
  };
};
var securityMiddleware = [
  helmetConfig,
  requestSizeLimit(10 * 1024 * 1024)
  // 10MB limit
  // Note: CORS is handled by setupCors() in server/index.ts which supports Replit's proxy domain.
  // Do not add cors(corsOptions) here — it would override setupCors and block Replit domain origins.
];
var validateApiKey = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  const validApiKeys = (process.env.API_KEYS || "").split(",").filter(Boolean);
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }
  if (process.env.NODE_ENV === "production" && validApiKeys.length > 0) {
    if (!apiKey || !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: "Invalid API key",
        message: "A valid API key is required"
      });
    }
  }
  next();
};
var securityLogger = (req, res, next) => {
  const start = Date.now();
  console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get("User-Agent")}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "WARN" : "INFO";
    console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] [${logLevel}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`[SECURITY] Unauthorized access attempt: ${req.method} ${req.path} - IP: ${req.ip} - User-Agent: ${req.get("User-Agent")}`);
    }
    if (res.statusCode === 429) {
      console.warn(`[SECURITY] Rate limit exceeded: ${req.method} ${req.path} - IP: ${req.ip}`);
    }
  });
  next();
};

// lib/data-security.ts
function maskSensitiveData(data, type) {
  if (!data || typeof data !== "string") {
    return "[REDACTED]";
  }
  switch (type) {
    case "phone":
      if (data.length >= 10) {
        return `${data.substring(0, 3)}****${data.substring(data.length - 2)}`;
      }
      return data.substring(0, 3) + "****";
    case "password":
      return "******";
    case "email":
      const [localPart, domain] = data.split("@");
      if (localPart && domain) {
        return `${localPart.substring(0, 2)}***@${domain}`;
      }
      return "***@****.***";
    case "name":
      if (data.length > 2) {
        return `${data[0]}${"*".repeat(data.length - 2)}${data[data.length - 1]}`;
      }
      return data[0] + "*";
    case "general":
      if (data.length > 4) {
        return `${data.substring(0, 2)}${"*".repeat(data.length - 4)}${data.substring(data.length - 2)}`;
      }
      return data.substring(0, 2) + "**";
    default:
      return "[REDACTED]";
  }
}
function sanitizeForLogging(obj, sensitiveFields = ["password", "token", "secret", "key"]) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  const sanitized = { ...obj };
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  }
  for (const key in sanitized) {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeForLogging(sanitized[key], sensitiveFields);
    }
  }
  return sanitized;
}
var SecureLogger = class _SecureLogger {
  static instance;
  logLevel = "info";
  static getInstance() {
    if (!_SecureLogger.instance) {
      _SecureLogger.instance = new _SecureLogger();
    }
    return _SecureLogger.instance;
  }
  setLogLevel(level) {
    this.logLevel = level;
  }
  shouldLog(level) {
    const levels = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }
  debug(message, data) {
    if (this.shouldLog("debug")) {
      console.debug(`[DEBUG] ${message}`, this.sanitizeLogData(data));
    }
  }
  info(message, data) {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, this.sanitizeLogData(data));
    }
  }
  warn(message, data) {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, this.sanitizeLogData(data));
    }
  }
  error(message, error) {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, this.sanitizeLogData(error));
    }
  }
  sanitizeLogData(data) {
    if (!data)
      return data;
    if (data instanceof Error) {
      return {
        name: data.name,
        message: data.message
      };
    }
    if (typeof data === "object") {
      return sanitizeForLogging(data, ["password", "token", "secret", "key", "authorization", "cookie"]);
    }
    if (typeof data === "string") {
      if (/\+998\d{9}/.test(data)) {
        return maskSensitiveData(data, "phone");
      }
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
        return maskSensitiveData(data, "email");
      }
    }
    return data;
  }
};
function sanitizeRequest(req, res, next) {
  next();
}
function sanitizeResponse(req, res, next) {
  next();
}
var logger = SecureLogger.getInstance();

// server/routes.ts
async function registerRoutes(app2) {
  app2.use(securityMiddleware);
  app2.use(securityLogger);
  app2.use(validateApiKey);
  app2.use(sanitizeRequest);
  app2.use(sanitizeResponse);
  try {
    const { validateEnvironment: validateEnvironment2 } = (init_env_config(), __toCommonJS(env_config_exports));
    validateEnvironment2();
  } catch (error) {
    console.error("\u274C Environment validation failed. Server cannot start.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "development") {
    app2.delete("/api/dev/clear-test-users", async (_req, res) => {
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
  app2.use("/api/auth", rateLimiters.auth);
  otpService.ensureTable().catch((e) => console.error("[OTP] Table init error:", e));
  app2.post(
    "/api/auth/send-otp",
    validateRequestBody(authSchemas.sendOtp),
    async (req, res) => {
      try {
        const { phoneNumber, purpose = "register" } = req.body;
        if (purpose === "register") {
          const existing = await storage.getUserByPhone(phoneNumber);
          if (existing) {
            return res.status(400).json({ error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" });
          }
        }
        const code = await otpService.createOtp(phoneNumber, purpose);
        const message = `City Market: tasdiqlash kodi ${code}. Kod 5 daqiqa amal qiladi.`;
        const smsSent = await sendSms(phoneNumber, message);
        if (!smsSent && isSmsConfigured()) {
          return res.status(500).json({ error: "SMS yuborishda xatolik yuz berdi" });
        }
        const devCode = !isSmsConfigured() ? code : void 0;
        res.json({
          success: true,
          message: "Tasdiqlash kodi yuborildi",
          ...devCode ? { devCode } : {}
        });
      } catch (error) {
        console.error("Send OTP error:", error);
        res.status(500).json({ error: "Kod yuborishda xatolik" });
      }
    }
  );
  app2.post(
    "/api/auth/verify-otp-register",
    validateRequestBody(authSchemas.verifyOtpRegister),
    async (req, res) => {
      try {
        const { phoneNumber, code, name, role, storeName, storeAddress } = req.body;
        const valid = await otpService.verifyOtp(phoneNumber, code, "register");
        if (!valid) {
          return res.status(400).json({ error: "Kod noto'g'ri yoki muddati o'tgan" });
        }
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "Bu telefon raqam allaqachon ro'yxatdan o'tgan" });
        }
        const allowedRoles = ["customer", "store"];
        const userRole = allowedRoles.includes(role) ? role : "customer";
        const tempPassword = await hashPassword(Math.random().toString(36).slice(2) + Date.now());
        let user = await storage.createUser({
          phoneNumber,
          password: tempPassword,
          name,
          role: userRole
        });
        let store = null;
        if (userRole === "store") {
          store = await storage.createStore({
            ownerId: user.id,
            name: storeName || name || "Mening do'konim",
            address: storeAddress || null,
            phone: phoneNumber,
            isActive: true
          });
          await storage.updateUser(user.id, { storeId: store.id });
          user = { ...user, storeId: store.id };
        }
        const token = generateToken({
          userId: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
          user: userWithoutPassword,
          token,
          store
        });
      } catch (error) {
        console.error("Verify OTP register error:", error);
        res.status(500).json({ error: "Ro'yxatdan o'tishda xatolik" });
      }
    }
  );
  app2.get("/api/stores", async (_req, res) => {
    try {
      const stores2 = await storage.getStores();
      res.json(stores2.filter((s) => s.isActive && !s.deletedAt));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stores" });
    }
  });
  app2.post(
    "/api/auth/register",
    validateRequestBody(authSchemas.register),
    async (req, res) => {
      try {
        const { phoneNumber, password, name, role, storeName, storeAddress, storePhone, storeDescription } = req.body;
        const allowedRoles = ["customer", "store"];
        const userRole = allowedRoles.includes(role) ? role : "customer";
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "User with this phone number already exists" });
        }
        const hashedPassword = await hashPassword(password);
        let user = await storage.createUser({
          phoneNumber,
          password: hashedPassword,
          name,
          role: userRole
        });
        let store = null;
        if (userRole === "store") {
          store = await storage.createStore({
            ownerId: user.id,
            name: storeName || name || "Mening do'konim",
            description: storeDescription || null,
            address: storeAddress || null,
            phone: storePhone || phoneNumber,
            isActive: true
          });
          await storage.updateUser(user.id, { storeId: store.id });
          user = { ...user, storeId: store.id };
        }
        const token = generateToken({
          userId: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role
        });
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json({
          user: userWithoutPassword,
          token,
          store
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ error: "Failed to register user" });
      }
    }
  );
  app2.post(
    "/api/auth/login",
    validateRequestBody(authSchemas.login),
    async (req, res) => {
      try {
        const { phoneNumber, password } = req.body;
        logger.info("Login attempt", {
          phoneNumber: maskSensitiveData(phoneNumber, "phone")
        });
        const user = await storage.getUserByPhone(phoneNumber);
        if (!user) {
          logger.warn("Login failed: User not found", {
            phoneNumber: maskSensitiveData(phoneNumber, "phone")
          });
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
          logger.warn("Login failed: Invalid password", {
            phoneNumber: maskSensitiveData(phoneNumber, "phone")
          });
          return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = generateToken({
          userId: user.id,
          phoneNumber: user.phoneNumber,
          role: user.role
        });
        const { password: _, ...userWithoutPassword } = user;
        logger.info("Login successful", {
          userId: user.id,
          phoneNumber: maskSensitiveData(user.phoneNumber, "phone"),
          role: user.role
        });
        if (user.role === "customer") {
          try {
            await storage.seedNotificationsForUser(user.id);
          } catch (_2) {
          }
        }
        res.json({
          user: userWithoutPassword,
          token
        });
      } catch (error) {
        logger.error("Login error:", error);
        res.status(500).json({ error: "Failed to authenticate user" });
      }
    }
  );
  app2.put(
    "/api/user/location",
    authenticateToken,
    validateRequestBody(authSchemas.updateLocation),
    async (req, res) => {
      try {
        const { userId, latitude, longitude, address } = req.body;
        if (req.user.role !== "admin" && req.user.userId !== userId) {
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
  app2.use("/api", rateLimiters.general);
  app2.get(
    "/api/couriers",
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
  app2.post(
    "/api/auth/courier",
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { phoneNumber, password, name, vehicleType, courierStatus } = req.body;
        if (!phoneNumber || !password || !name) {
          return res.status(400).json({ error: "Missing required fields" });
        }
        const allowedVehicleTypes = ["on_foot", "bike", "scooter", "car"];
        if (vehicleType && !allowedVehicleTypes.includes(vehicleType)) {
          return res.status(400).json({ error: "Invalid vehicle type" });
        }
        const allowedStatuses = ["active", "on_leave", "suspended"];
        if (courierStatus && !allowedStatuses.includes(courierStatus)) {
          return res.status(400).json({ error: "Invalid courier status" });
        }
        const existing = await storage.getUserByPhone(phoneNumber);
        if (existing) {
          return res.status(400).json({ error: "User with this phone number already exists" });
        }
        const hashedPassword = await hashPassword(password);
        const user = await storage.createUser({
          phoneNumber,
          password: hashedPassword,
          name,
          role: "courier",
          vehicleType: vehicleType || "on_foot",
          courierStatus: courierStatus || "active"
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      } catch (error) {
        console.error("Error creating courier:", error);
        res.status(500).json({ error: "Failed to create courier" });
      }
    }
  );
  app2.patch(
    "/api/profile",
    authenticateToken,
    async (req, res) => {
      try {
        const { name, preferredPaymentMethod, notificationsEnabled } = req.body;
        const updates = {};
        if (name !== void 0) {
          if (typeof name !== "string" || name.trim().length < 1) {
            return res.status(400).json({ error: "Invalid name" });
          }
          updates.name = name.trim();
        }
        if (preferredPaymentMethod !== void 0) {
          const allowed = ["cash", "payme", "click", "uzcard"];
          if (!allowed.includes(preferredPaymentMethod)) {
            return res.status(400).json({ error: "Invalid payment method" });
          }
          updates.preferredPaymentMethod = preferredPaymentMethod;
        }
        if (notificationsEnabled !== void 0) {
          if (typeof notificationsEnabled !== "boolean") {
            return res.status(400).json({ error: "Invalid notificationsEnabled value" });
          }
          updates.notificationsEnabled = notificationsEnabled;
        }
        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: "No valid fields to update" });
        }
        const updated = await storage.updateUser(req.user.userId, updates);
        const { password: _, ...userWithoutPassword } = updated;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        res.status(500).json({ error: "Failed to update profile" });
      }
    }
  );
  app2.post(
    "/api/push-token",
    authenticateToken,
    async (req, res) => {
      try {
        const { pushToken } = req.body;
        if (pushToken !== null && typeof pushToken !== "string") {
          return res.status(400).json({ error: "Invalid push token" });
        }
        const updated = await storage.updateUser(req.user.userId, { pushToken });
        const { password: _, ...userWithoutPassword } = updated;
        res.json({ user: userWithoutPassword });
      } catch (error) {
        console.error("Error saving push token:", error);
        res.status(500).json({ error: "Failed to save push token" });
      }
    }
  );
  app2.patch(
    "/api/password",
    authenticateToken,
    async (req, res) => {
      try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
          return res.status(400).json({ error: "Both old and new password are required" });
        }
        const user = await storage.getUser(req.user.userId);
        if (!user)
          return res.status(404).json({ error: "User not found" });
        const isValid = await comparePassword(oldPassword, user.password);
        if (!isValid)
          return res.status(400).json({ error: "Old password is incorrect" });
        const strength = validatePasswordStrength(newPassword);
        if (!strength.isValid)
          return res.status(400).json({ error: strength.errors[0] });
        const hashed = await hashPassword(newPassword);
        await storage.updateUser(req.user.userId, { password: hashed });
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: "Failed to change password" });
      }
    }
  );
  app2.get(
    "/api/promo-codes",
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
  app2.post(
    "/api/promo-codes",
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
  app2.get(
    "/api/promo-codes/:code",
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
            cartTotal
          });
        }
        res.json(promo);
      } catch (error) {
        console.error("Error fetching promo code:", error);
        res.status(500).json({ error: "Failed to fetch promo code" });
      }
    }
  );
  app2.get(
    "/api/products",
    optionalAuth,
    async (_req, res) => {
      try {
        const products2 = await storage.getProducts();
        res.json(products2);
      } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
      }
    }
  );
  app2.post(
    "/api/products/import",
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
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        if (rows.length > 0) {
          console.log("[IMPORT] Column headers found:", Object.keys(rows[0]));
          console.log("[IMPORT] First row raw data:", rows[0]);
        }
        const normalizeRow = (raw) => {
          const trimmedRaw = {};
          for (const key of Object.keys(raw)) {
            trimmedRaw[key.trim().toLowerCase()] = raw[key];
          }
          raw = trimmedRaw;
          const aliases = {
            name: ["nomi", "mahsulot_nomi", "mahsulot nomi", "\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "n\u0430me", "product name", "product_name"],
            category: ["kategoriya", "kategoriy\u0430", "kategoria", "\u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F", "cat", "kategory"],
            price: ["narx", "narxi", "\u043D\u0430\u0440\u0445", "\u0446\u0435\u043D\u0430", "cost", "soum", "sum", "summa"],
            originalPrice: ["asl_narx", "asl narx", "asl_narxi", "original_price", "original price", "\u0441\u0442\u0430\u0440\u0430\u044F \u0446\u0435\u043D\u0430", "old_price", "old price"],
            unit: ["birlik", "o'lchov", "olchov", "birlik/o'lchov", "birlik/olchov", "\u0435\u0434\u0438\u043D\u0438\u0446\u0430", "measure"],
            image: ["rasm", "rasm_url", "rasm url", "\u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435", "img", "photo", "foto"],
            badge: ["yorliq", "badge", "\u043C\u0435\u0442\u043A\u0430", "label", "yorliq/nishon"],
            description: ["tavsif", "\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435", "desc", "info", "malumot"],
            brand: ["brend", "\u0431\u0440\u0435\u043D\u0434", "ishlab_chiqaruvchi", "manufacturer"],
            weight: ["og'irlik", "ogirlik", "og'irlik/hajm", "\u0432\u0435\u0441", "vazn", "hajm"],
            stockQuantity: ["ombor", "miqdor", "stock", "stock_quantity", "\u0437\u0430\u043F\u0430\u0441", "qoldiq", "soni"],
            rating: ["reyting", "\u0440\u0435\u0439\u0442\u0438\u043D\u0433", "baho"]
          };
          const normalized = { ...raw };
          for (const [key, alts] of Object.entries(aliases)) {
            if (normalized[key] == null || normalized[key] === "") {
              for (const alt of alts) {
                const exactMatch = Object.keys(raw).find(
                  (k) => k.trim().toLowerCase() === alt.toLowerCase()
                );
                if (exactMatch && raw[exactMatch] != null && raw[exactMatch] !== "") {
                  normalized[key] = raw[exactMatch];
                  break;
                }
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
        const inserted = [];
        const errors = [];
        const existingCategories = await storage.getCategories();
        const categoryById = new Map(existingCategories.map((c) => [c.id.toLowerCase(), c.id]));
        const categoryByName = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c.id]));
        const resolveCategory = async (raw) => {
          const val = raw.trim().toLowerCase();
          if (!val)
            return existingCategories[0]?.id ?? "other";
          if (categoryById.has(val))
            return categoryById.get(val);
          if (categoryByName.has(val))
            return categoryByName.get(val);
          for (const [name, id] of categoryByName) {
            if (name.includes(val) || val.includes(name))
              return id;
          }
          const newId = val.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 30) || `cat-${Date.now()}`;
          const colors = ["#16A34A", "#2563EB", "#DC2626", "#D97706", "#7C3AED", "#0891B2"];
          const color = colors[existingCategories.length % colors.length];
          const newCat = await storage.createCategory({
            id: newId,
            name: raw.trim(),
            icon: "grid-outline",
            color,
            bgColor: color + "22"
          });
          categoryById.set(newCat.id.toLowerCase(), newCat.id);
          categoryByName.set(newCat.name.toLowerCase(), newCat.id);
          existingCategories.push(newCat);
          return newCat.id;
        };
        for (let i = 0; i < rows.length; i++) {
          const row = normalizeRow(rows[i]);
          const rowNum = i + 2;
          const rawCategory = String(row.category || "").trim();
          const resolvedCategory = await resolveCategory(rawCategory);
          const productData = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${i}`,
            name: String(row.name || "").trim(),
            category: resolvedCategory,
            price: (() => {
              if (typeof row.price === "number" && !isNaN(row.price))
                return Math.round(row.price);
              const s = String(row.price ?? "").trim();
              if (!s)
                return 0;
              let cleaned = s.replace(/[\s\u00a0\u202f\u2009',]/g, "");
              if (/^\d+,\d{1,2}$/.test(s.trim()))
                cleaned = s.trim().replace(",", ".");
              cleaned = cleaned.replace(/[^0-9.]/g, "");
              const num = parseFloat(cleaned);
              return isNaN(num) ? 0 : Math.round(num);
            })(),
            originalPrice: (() => {
              if (!row.originalPrice)
                return void 0;
              if (typeof row.originalPrice === "number" && !isNaN(row.originalPrice))
                return Math.round(row.originalPrice);
              const s = String(row.originalPrice).trim();
              let cleaned = s.replace(/[\s\u00a0\u202f\u2009',]/g, "");
              if (/^\d+,\d{1,2}$/.test(s))
                cleaned = s.replace(",", ".");
              cleaned = cleaned.replace(/[^0-9.]/g, "");
              const num = parseFloat(cleaned);
              return isNaN(num) ? void 0 : Math.round(num);
            })(),
            unit: String(row.unit || "").trim() || "dona",
            image: (() => {
              const img = String(row.image || "").trim();
              if (!img || img.startsWith("data:"))
                return "https://placehold.co/300x300/e2e8f0/64748b?text=Rasm+yo%27q";
              return img;
            })(),
            badge: row.badge ? String(row.badge).trim() : void 0,
            description: row.description ? String(row.description).trim() : void 0,
            brand: row.brand ? String(row.brand).trim() : void 0,
            weight: row.weight ? String(row.weight).trim() : void 0,
            rating: (() => {
              const r = row.rating;
              if (r == null || r === "")
                return "5.0";
              const num = parseFloat(String(r));
              if (isNaN(num))
                return "5.0";
              return String(Math.min(Math.max(num, 1), 5).toFixed(1));
            })(),
            stockQuantity: (() => {
              const sq = row.stockQuantity;
              if (sq == null || sq === "")
                return 0;
              const num = Number(sq);
              return isNaN(num) ? 0 : Math.max(0, Math.floor(num));
            })(),
            inStock: true
          };
          if (!productData.name) {
            errors.push({ row: rowNum, error: "Mahsulot nomi bo'sh (name ustuni topilmadi yoki bo'sh)" });
            continue;
          }
          if (!productData.price || productData.price <= 0) {
            const rawPriceVal = row.price ?? "(topilmadi)";
            errors.push({ row: rowNum, error: `Narx noto'g'ri yoki topilmadi. Qiymat: "${rawPriceVal}". Ustun nomi "price", "narx", "narxi" yoki "\u0446\u0435\u043D\u0430" bo'lishi kerak.` });
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
          } catch (dbErr) {
            errors.push({ row: rowNum, error: dbErr?.message ?? "DB error" });
          }
        }
        broadcast("products-changed");
        res.json({
          inserted: inserted.length,
          total: rows.length,
          errors
        });
      } catch (error) {
        console.error("Error importing products:", error);
        res.status(500).json({ error: "Failed to parse or import Excel file" });
      }
    }
  );
  app2.post(
    "/api/products",
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
  app2.patch(
    "/api/products/:id",
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
  app2.delete(
    "/api/products/:id",
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
  app2.get(
    "/api/categories",
    optionalAuth,
    async (_req, res) => {
      try {
        const categories2 = await storage.getCategories();
        res.json(categories2);
      } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Failed to fetch categories" });
      }
    }
  );
  app2.get(
    "/api/subcategories",
    optionalAuth,
    async (_req, res) => {
      try {
        const subcategories2 = await storage.getSubcategories();
        res.json(subcategories2);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ error: "Failed to fetch subcategories" });
      }
    }
  );
  app2.get(
    "/api/categories/:id/subcategories",
    optionalAuth,
    async (req, res) => {
      try {
        const subcategories2 = await storage.getSubcategoriesByCategory(req.params.id);
        res.json(subcategories2);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        res.status(500).json({ error: "Failed to fetch subcategories" });
      }
    }
  );
  app2.post(
    "/api/subcategories",
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
  app2.delete(
    "/api/subcategories/:id",
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
  app2.post(
    "/api/categories",
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
  app2.delete(
    "/api/categories/:id",
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
  app2.get(
    "/api/orders/my",
    authenticateToken,
    async (req, res) => {
      try {
        const orders2 = await storage.getOrdersByCustomer(req.user.userId);
        res.json(orders2);
      } catch (error) {
        console.error("Error fetching customer orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );
  app2.get(
    "/api/orders",
    authenticateToken,
    requireAdminOrCourier,
    async (_req, res) => {
      try {
        const orders2 = await storage.getOrders();
        res.json(orders2);
      } catch (error) {
        console.error("Error fetching orders:", error);
        res.status(500).json({ error: "Failed to fetch orders" });
      }
    }
  );
  app2.post(
    "/api/orders",
    authenticateToken,
    requireCustomer,
    async (req, res) => {
      try {
        const result = insertOrderSchema.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ error: "Invalid order data", details: result.error });
        }
        const { items, promoCode, deliveryFee: clientDeliveryFee, deliveryType } = req.body;
        let serverSubtotal = 0;
        if (Array.isArray(items) && items.length > 0) {
          for (const item of items) {
            const qty = item.qty || 1;
            if (item.productId) {
              const product = await storage.getProduct(item.productId);
              if (!product) {
                return res.status(400).json({ error: `Mahsulot topilmadi: ${item.name}` });
              }
              if (product.stockQuantity !== null && product.stockQuantity < qty) {
                return res.status(400).json({ error: `Omborda yetarli mahsulot yo'q: ${product.name}` });
              }
              serverSubtotal += product.price * qty;
            } else {
              serverSubtotal += (item.price || 0) * qty;
            }
          }
        }
        let serverDiscountPercent = 0;
        let promoCodeId;
        if (promoCode) {
          const promo = await storage.getPromoCode(promoCode);
          const now = /* @__PURE__ */ new Date();
          if (promo && promo.isActive && promo.usedCount < promo.maxUses && (!promo.validUntil || new Date(promo.validUntil) > now) && (promo.minAmount <= 0 || serverSubtotal >= promo.minAmount)) {
            serverDiscountPercent = promo.discountPercent;
            promoCodeId = promo.id;
          }
        }
        const deliveryFee = deliveryType === "pickup" ? 0 : Math.max(0, Number(clientDeliveryFee) || 0);
        const serverTotal = Math.max(0, serverSubtotal + deliveryFee - Math.round(serverSubtotal * serverDiscountPercent / 100));
        const orderData = {
          ...result.data,
          customerId: req.user.userId,
          customerName: result.data.customerName || req.user.phoneNumber,
          phoneNumber: req.user.phoneNumber,
          status: "pending",
          discount: serverDiscountPercent,
          total: serverTotal,
          promoCodeId: promoCodeId ?? null
        };
        const order = await storage.createOrder(orderData);
        broadcast("orders-changed");
        try {
          const affectedOwnerIds = await storage.notifyStoresForOrder(order);
          for (const ownerId of affectedOwnerIds) {
            sendToUser(ownerId, "new-order", { orderId: order.id, total: order.total });
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
  app2.get(
    "/api/orders/:id",
    authenticateToken,
    async (req, res) => {
      try {
        const order = await storage.getOrder(req.params.id);
        if (!order)
          return res.status(404).json({ error: "Order not found" });
        const { role, userId } = req.user;
        if (role !== "admin" && role !== "courier" && order.customerId !== userId) {
          return res.status(403).json({ error: "Access denied" });
        }
        res.json(order);
      } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: "Failed to fetch order" });
      }
    }
  );
  const VALID_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["preparing", "delivering", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["delivering", "cancelled"],
    delivering: ["delivered"],
    delivered: [],
    cancelled: []
  };
  app2.patch(
    "/api/orders/:id/status",
    authenticateToken,
    requireAdminOrCourier,
    async (req, res) => {
      try {
        const { status, courierId } = req.body;
        const existing = await storage.getOrder(req.params.id);
        if (!existing)
          return res.status(404).json({ error: "Order not found" });
        const allowed = VALID_TRANSITIONS[existing.status] ?? [];
        if (!allowed.includes(status)) {
          return res.status(400).json({
            error: `'${existing.status}' holatidan '${status}' holatiga o'tish mumkin emas`
          });
        }
        const order = await storage.updateOrderStatus(req.params.id, status, courierId);
        broadcast("orders-changed");
        if (order.customerId) {
          sendToUser(order.customerId, "order-status-updated", {
            orderId: order.id,
            status: order.status
          });
          const statusLabels = {
            confirmed: "Buyurtmangiz tasdiqlandi",
            preparing: "Buyurtmangiz tayyorlanmoqda",
            ready: "Buyurtmangiz tayyor",
            delivering: "Buyurtmangiz yo'lda",
            delivered: "Buyurtmangiz yetkazildi",
            cancelled: "Buyurtmangiz bekor qilindi"
          };
          const label = statusLabels[order.status];
          if (label) {
            sendPushToUser(order.customerId, "City Market", `${label} \u2014 #${order.id.slice(-6).toUpperCase()}`, {
              orderId: order.id,
              status: order.status
            });
          }
        }
        res.json(order);
      } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status" });
      }
    }
  );
  app2.post(
    "/api/courier/location",
    authenticateToken,
    requireAdminOrCourier,
    async (req, res) => {
      try {
        const { orderId, latitude, longitude } = req.body;
        if (!orderId || latitude == null || longitude == null) {
          return res.status(400).json({ error: "orderId, latitude, longitude required" });
        }
        const order = await storage.getOrder(orderId);
        if (!order)
          return res.status(404).json({ error: "Order not found" });
        if (order.courierId && order.courierId !== req.user.userId && req.user.role !== "admin") {
          return res.status(403).json({ error: "Not your order" });
        }
        if (order.customerId) {
          sendToUser(order.customerId, "courier-location", {
            orderId,
            latitude,
            longitude
          });
        }
        res.json({ ok: true });
      } catch (error) {
        console.error("Error relaying courier location:", error);
        res.status(500).json({ error: "Failed to relay location" });
      }
    }
  );
  app2.get(
    "/api/notifications",
    authenticateToken,
    async (req, res) => {
      try {
        const notifications2 = await storage.getNotifications(req.user.userId);
        res.json(notifications2);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
      }
    }
  );
  app2.get(
    "/api/notifications/unread-count",
    authenticateToken,
    async (req, res) => {
      try {
        const count = await storage.getUnreadNotificationCount(req.user.userId);
        res.json({ count });
      } catch (error) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
      }
    }
  );
  app2.patch(
    "/api/notifications/read-all",
    authenticateToken,
    async (req, res) => {
      try {
        await storage.markAllNotificationsRead(req.user.userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking all read:", error);
        res.status(500).json({ error: "Failed to mark notifications as read" });
      }
    }
  );
  app2.patch(
    "/api/notifications/:id/read",
    authenticateToken,
    async (req, res) => {
      try {
        await storage.markNotificationRead(req.params.id, req.user.userId);
        res.json({ success: true });
      } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
      }
    }
  );
  app2.get(
    "/api/store/profile",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        res.json(store);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store profile" });
      }
    }
  );
  app2.patch(
    "/api/store/profile",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        const { name, description, address, phone, logo } = req.body;
        const updated = await storage.updateStore(store.id, { name, description, address, phone, logo });
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: "Failed to update store profile" });
      }
    }
  );
  app2.get(
    "/api/store/products",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        const products2 = await storage.getProductsByStore(store.id);
        res.json(products2);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store products" });
      }
    }
  );
  app2.post(
    "/api/store/products",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        if (!store.isActive)
          return res.status(403).json({ error: "Store is not active" });
        const productData = {
          ...req.body,
          id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          storeId: store.id,
          inStock: true,
          stockQuantity: req.body.stockQuantity || 0
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
  const storeProductUpdateHandler = [
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        const product = await storage.getProduct(req.params.id);
        if (!product || product.storeId !== store.id) {
          return res.status(403).json({ error: "Not your product" });
        }
        const { id: _id, storeId: _storeId, deletedAt: _deletedAt, createdAt: _createdAt, ...safeBody } = req.body;
        const updated = await storage.updateProduct(req.params.id, safeBody);
        broadcast("products-changed");
        res.json(updated);
      } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
      }
    }
  ];
  app2.patch("/api/store/products/:id", ...storeProductUpdateHandler);
  app2.put("/api/store/products/:id", ...storeProductUpdateHandler);
  app2.delete(
    "/api/store/products/:id",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
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
  app2.get(
    "/api/store/orders",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        const orders2 = await storage.getOrdersByStore(store.id);
        res.json(orders2);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store orders" });
      }
    }
  );
  app2.patch(
    "/api/store/orders/:id/status",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        const { status } = req.body;
        const allowed = ["preparing", "ready", "cancelled"];
        if (!status || !allowed.includes(status)) {
          return res.status(400).json({
            error: `Store owners can only set status to: ${allowed.join(", ")}`
          });
        }
        const storeOrders = await storage.getOrdersByStore(store.id);
        const orderBelongsToStore = storeOrders.some((o) => o.id === req.params.id);
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
  app2.get(
    "/api/store/stats",
    authenticateToken,
    requireStore,
    async (req, res) => {
      try {
        const store = await storage.getStoreByOwner(req.user.userId);
        if (!store)
          return res.status(404).json({ error: "Store not found" });
        const [products2, orders2] = await Promise.all([
          storage.getProductsByStore(store.id),
          storage.getOrdersByStore(store.id)
        ]);
        const today = /* @__PURE__ */ new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders2.filter((o) => new Date(o.createdAt) >= today);
        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
        res.json({
          totalProducts: products2.length,
          totalOrders: orders2.length,
          todayOrders: todayOrders.length,
          todayRevenue,
          pendingOrders: orders2.filter((o) => o.status === "pending" || o.status === "confirmed").length
        });
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch store stats" });
      }
    }
  );
  app2.get(
    "/api/admin/stores",
    authenticateToken,
    requireAdmin,
    async (_req, res) => {
      try {
        const stores2 = await storage.getStores();
        const storesWithDetails = await Promise.all(
          stores2.map(async (store) => {
            const [owner, productCount] = await Promise.all([
              storage.getUser(store.ownerId).catch(() => null),
              storage.getProductCountByStore(store.id).catch(() => 0)
            ]);
            return {
              ...store,
              ownerName: owner?.name || "Noma'lum",
              ownerPhone: owner?.phoneNumber ?? null,
              productCount
            };
          })
        );
        res.json(storesWithDetails);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch stores" });
      }
    }
  );
  app2.patch(
    "/api/admin/stores/:id",
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
  app2.delete(
    "/api/admin/stores/:id",
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
  app2.post(
    "/api/admin/stores",
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
          isActive: true
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
  const httpServer = (0, import_node_http.createServer)(app2);
  setupWebSocket(httpServer);
  return httpServer;
}

// server/index.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
(0, import_dotenv.config)();
var app = (0, import_express.default)();
app.set("trust proxy", 1);
var log = console.log;
function setupBasicSecurity(app2) {
  app2.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });
}
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origin = req.header("origin");
    const isLocalhost = origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:");
    const isExpoOrigin = origin?.includes("expo") || origin?.includes("exp.direct") || origin?.includes("exp://") || origin?.startsWith("http://192.168.") || origin?.startsWith("http://10.") || origin?.startsWith("http://172.") || !origin;
    const isReplitOrigin = origin?.includes(".replit.dev") || origin?.includes(".repl.co") || origin?.includes(".replit.app");
    if (isLocalhost || isExpoOrigin || isReplitOrigin || !origin) {
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
  app2.use(import_express.default.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  }));
  app2.use(import_express.default.urlencoded({
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
  if (req.body && typeof req.body === "object") {
    const checkAndSanitize = (obj) => {
      if (typeof obj === "object" && obj !== null) {
        for (const key in obj) {
          const val = obj[key];
          if (typeof val === "string") {
            if (detectSqlInjection(val))
              return true;
            obj[key] = sanitizeString(val);
          } else if (typeof val === "object") {
            if (checkAndSanitize(val))
              return true;
          }
        }
      }
      return false;
    };
    if (checkAndSanitize(req.body)) {
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
      if (!path2.startsWith("/api"))
        return;
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
function proxyToMetro(req, res) {
  const http = require("http");
  const headers = { ...req.headers, host: "localhost:8080" };
  delete headers["content-length"];
  delete headers["origin"];
  const options = {
    hostname: "localhost",
    port: 8080,
    path: req.url,
    method: req.method,
    headers
  };
  const proxyReq = http.request(options, (proxyRes) => {
    Object.keys(proxyRes.headers).forEach((key) => {
      try {
        res.setHeader(key, proxyRes.headers[key]);
      } catch (_) {
      }
    });
    res.status(proxyRes.statusCode);
    proxyRes.pipe(res, { end: true });
  });
  proxyReq.on("error", (err) => {
    log("Metro proxy error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: "Expo dev server not reachable. Make sure the Start Frontend workflow is running." });
    }
  });
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyStr = JSON.stringify(req.body);
    proxyReq.setHeader("content-length", Buffer.byteLength(bodyStr));
    proxyReq.write(bodyStr);
  }
  proxyReq.end();
}
function configureExpoAndLanding(app2) {
  app2.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  let landingPageTemplate = "";
  try {
    landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  } catch {
    log("Warning: landing-page.html not found, using minimal fallback");
    landingPageTemplate = "<!DOCTYPE html><html><body><h1>City Market API</h1></body></html>";
  }
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use("/assets", import_express.default.static(path.resolve(process.cwd(), "assets")));
  app2.get("/delete-account", (_req, res) => {
    res.send(`<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>City Market \u2014 Akkauntni O'chirish</title><style>body{font-family:sans-serif;max-width:700px;margin:40px auto;padding:0 20px;line-height:1.8;color:#333}h1{color:#16A34A;font-size:1.6rem}h2{color:#16A34A;font-size:1.1rem;margin-top:28px}.step{background:#f0fdf4;border-left:4px solid #16A34A;padding:14px 18px;border-radius:6px;margin:12px 0}.warning{background:#fff7ed;border-left:4px solid #f97316;padding:14px 18px;border-radius:6px;margin:16px 0}a{color:#16A34A}footer{margin-top:40px;color:#888;font-size:.9rem}</style></head><body><h1>Akkauntni O'chirish So'rovi</h1><p>City Market ilovasida akkauntingizni o'chirish uchun quyidagi ko'rsatmalarga amal qiling.</p><h2>Ilova orqali o'chirish (eng tez usul)</h2><div class="step"><strong>1-qadam:</strong> Ilovani oching va <em>Profil</em> bo'limiga o'ting.</div><div class="step"><strong>2-qadam:</strong> "Sozlamalar" yoki "Akkaunt" bo'limini tanlang.</div><div class="step"><strong>3-qadam:</strong> "Akkauntni o'chirish" tugmasini bosing va tasdiqlang.</div><h2>Elektron pochta orqali so'rov</h2><p>Agar ilovaga kira olmasangiz, quyidagi manzilga xat yuboring:</p><p><a href="mailto:support@citymarket.uz">support@citymarket.uz</a></p><p>Xatda quyidagilarni ko'rsating: to'liq ism, ro'yxatdan o'tgan telefon raqam.</p><div class="warning"><strong>Diqqat:</strong> Akkaunt o'chirilganda barcha buyurtmalar tarixi, profil ma'lumotlari va saqlangan manzillar butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi.</div><h2>O'chirish muddati</h2><p>So'rovingiz 7 ish kuni ichida ko'rib chiqiladi va bajariladi.</p><footer><p>City Market &copy; 2025 &nbsp;|&nbsp; <a href="/privacy">Maxfiylik siyosati</a></p></footer></body></html>`);
  });
  app2.get("/privacy", (_req, res) => {
    res.send(`<!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>City Market \u2014 Maxfiylik Siyosati</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.7;color:#333}h1{color:#1A9B5C}h2{margin-top:32px}</style></head><body><h1>City Market \u2014 Maxfiylik Siyosati</h1><p><strong>Kuchga kirish sanasi:</strong> 2025-yil 1-yanvar</p><h2>1. Yig'iladigan ma'lumotlar</h2><p>City Market ilovasi quyidagi ma'lumotlarni yig'ishi mumkin: ism, manzil, telefon raqam, buyurtma tarixi. Kamera ruxsati faqat mahsulot rasmlarini yuklash uchun ishlatiladi va rasmlar uchinchi shaxslarga uzatilmaydi.</p><h2>2. Ma'lumotlardan foydalanish</h2><p>Yig'ilgan ma'lumotlar faqat buyurtmalarni qayta ishlash, yetkazib berish va mijozlarga xizmat ko'rsatish maqsadida ishlatiladi.</p><h2>3. Ma'lumotlarni saqlash</h2><p>Shaxsiy ma'lumotlaringiz xavfsiz serverlarimizda saqlanadi va uchinchi shaxslarga sotilmaydi yoki uzatilmaydi.</p><h2>4. Foydalanuvchi huquqlari</h2><p>Siz istalgan vaqtda ma'lumotlaringizni o'chirish yoki ko'rish uchun biz bilan bog'lanishingiz mumkin.</p><h2>5. Bog'lanish</h2><p>Savollar uchun: <a href="mailto:support@citymarket.uz">support@citymarket.uz</a></p></body></html>`);
  });
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    const isMetroPath = req.path.startsWith("/node_modules/") || req.path.startsWith("/.expo/") || req.path.startsWith("/__metro") || req.path.startsWith("/__expo") || req.path === "/manifest" || req.path === "/_expo/loading" || req.path.endsWith(".bundle") || req.path.endsWith(".map");
    const platform = req.header("expo-platform");
    const hasExpoPlatform = platform && (platform === "ios" || platform === "android");
    return proxyToMetro(req, res);
  });
  app2.use(import_express.default.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Proxying Expo Go requests to Metro on port 8080");
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
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "0.0.0.0", () => {
    log(`express server serving on port ${port}`);
    log(`Security features enabled: Basic headers, Rate limiting, CORS, Input validation, XSS protection, SQL injection protection`);
  });
})();
