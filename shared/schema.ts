import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index, unique } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("customer").notNull(), // admin, courier, customer, store
  name: text("name"),
  address: text("address"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  storeId: varchar("store_id"), // FK set after stores table is defined — see FK constraint below
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index("idx_users_phone").on(table.phoneNumber),
  roleIdx: index("idx_users_role").on(table.role),
  activeIdx: index("idx_users_active").on(table.isActive),
  storeIdx: index("idx_users_store").on(table.storeId),
  locationIdx: index("idx_users_location").on(table.latitude, table.longitude),
}));

export const stores = pgTable("stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  logo: text("logo"),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_stores_owner").on(table.ownerId),
  activeIdx: index("idx_stores_active").on(table.isActive),
  nameIdx: index("idx_stores_name").on(table.name),
}));

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  bgColor: text("bg_color").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("idx_categories_name").on(table.name),
  activeIdx: index("idx_categories_active").on(table.isActive),
}));

export const subcategories = pgTable("subcategories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  bgColor: text("bg_color").notNull(),
  categoryId: varchar("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("idx_subcategories_name").on(table.name),
  categoryIdx: index("idx_subcategories_category").on(table.categoryId),
  activeIdx: index("idx_subcategories_active").on(table.isActive),
}));

export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().references(() => categories.id, { onDelete: "restrict" }),
  subcategoryId: varchar("subcategory_id").references(() => subcategories.id, { onDelete: "set null" }),
  storeId: varchar("store_id").references(() => stores.id, { onDelete: "set null" }),
  price: integer("price").notNull(),
  originalPrice: integer("original_price"),
  unit: text("unit").notNull(),
  image: text("image").notNull(),
  badge: text("badge"),
  rating: text("rating").default("5.0"),
  description: text("description"),
  brand: text("brand"),
  weight: text("weight"),
  inStock: boolean("in_stock").default(true).notNull(),
  stockQuantity: integer("stock_quantity").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("idx_products_name").on(table.name),
  categoryIdx: index("idx_products_category").on(table.category),
  storeIdx: index("idx_products_store").on(table.storeId),
  priceIdx: index("idx_products_price").on(table.price),
  stockIdx: index("idx_products_stock").on(table.stockQuantity),
  activeIdx: index("idx_products_active").on(table.isActive),
  inStockIdx: index("idx_products_in_stock").on(table.inStock),
}));

export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  minAmount: integer("min_amount").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  maxUses: integer("max_uses").default(100).notNull(),
  usedCount: integer("used_count").default(0).notNull(),
  validFrom: timestamp("valid_from").defaultNow().notNull(),
  validUntil: timestamp("valid_until"),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: index("idx_promo_codes_code").on(table.code),
  activeIdx: index("idx_promo_codes_active").on(table.isActive),
  validityIdx: index("idx_promo_codes_validity").on(table.validFrom, table.validUntil),
}));

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id").references(() => users.id, { onDelete: "restrict" }),
  courierId: varchar("courier_id").references(() => users.id, { onDelete: "set null" }),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  total: integer("total").notNull(),
  discount: integer("discount").default(0).notNull(),
  status: text("status").default("pending").notNull(),
  items: jsonb("items").notNull(),
  promoCodeId: varchar("promo_code_id").references(() => promoCodes.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  customerIdx: index("idx_orders_customer").on(table.customerId),
  courierIdx: index("idx_orders_courier").on(table.courierId),
  statusIdx: index("idx_orders_status").on(table.status),
  dateIdx: index("idx_orders_date").on(table.createdAt),
  phoneIdx: index("idx_orders_phone").on(table.phoneNumber),
  activeIdx: index("idx_orders_active").on(table.isActive),
}));

// Wishlist/Favorites table
export const wishlists = pgTable("wishlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userProductIdx: unique("idx_wishlists_user_product").on(table.userId, table.productId),
  userIdx: index("idx_wishlists_user").on(table.userId),
  productIdx: index("idx_wishlists_product").on(table.productId),
}));

// Product Reviews table
export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  comment: text("comment"),
  isVerified: boolean("is_verified").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("idx_reviews_product").on(table.productId),
  userIdx: index("idx_reviews_user").on(table.userId),
  ratingIdx: index("idx_reviews_rating").on(table.rating),
  productUserIdx: unique("idx_reviews_product_user").on(table.productId, table.userId),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // order_update, promo, product_available, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"), // additional data payload
  isRead: boolean("is_read").default(false).notNull(),
  priority: text("priority").default("normal").notNull(), // low, normal, high, urgent
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_notifications_user").on(table.userId),
  typeIdx: index("idx_notifications_type").on(table.type),
  readIdx: index("idx_notifications_read").on(table.isRead),
  priorityIdx: index("idx_notifications_priority").on(table.priority),
  expiresIdx: index("idx_notifications_expires").on(table.expiresAt),
}));

// Payment transactions table
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paymentMethod: text("payment_method").notNull(), // stripe, paypal, cash_on_delivery, etc.
  amount: integer("amount").notNull(),
 currency: text("currency").default("UZS").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed, refunded, cancelled
  gatewayTransactionId: text("gateway_transaction_id"), // External gateway transaction ID
  gatewayResponse: jsonb("gateway_response"), // Full response from payment gateway
  gatewayError: text("gateway_error"),
  processedAt: timestamp("processed_at"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: integer("refund_amount"),
  refundReason: text("refund_reason"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("idx_payment_transactions_order").on(table.orderId),
  userIdx: index("idx_payment_transactions_user").on(table.userId),
  statusIdx: index("idx_payment_transactions_status").on(table.status),
  methodIdx: index("idx_payment_transactions_method").on(table.paymentMethod),
  gatewayIdx: index("idx_payment_transactions_gateway").on(table.gatewayTransactionId),
  dateIdx: index("idx_payment_transactions_date").on(table.createdAt),
}));

// Payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // card, bank_account, digital_wallet
  provider: text("provider").notNull(), // stripe, paypal, etc.
  providerMethodId: text("provider_method_id").notNull(), // External method ID
  brand: text("brand"), // visa, mastercard, etc.
  last4: text("last4"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("idx_payment_methods_user").on(table.userId),
  typeIdx: index("idx_payment_methods_type").on(table.type),
  providerIdx: index("idx_payment_methods_provider").on(table.provider),
  defaultIdx: index("idx_payment_methods_default").on(table.isDefault),
}));

// Refunds table
export const refunds = pgTable("refunds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentTransactionId: varchar("payment_transaction_id").notNull().references(() => paymentTransactions.id, { onDelete: "cascade" }),
  orderId: varchar("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull(), // pending, approved, rejected, processed
  processedBy: varchar("processed_by").references(() => users.id, { onDelete: "set null" }),
  processedAt: timestamp("processed_at"),
  gatewayRefundId: text("gateway_refund_id"),
  gatewayResponse: jsonb("gateway_response"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  transactionIdx: index("idx_refunds_transaction").on(table.paymentTransactionId),
  orderIdx: index("idx_refunds_order").on(table.orderId),
  userIdx: index("idx_refunds_user").on(table.userId),
  statusIdx: index("idx_refunds_status").on(table.status),
  dateIdx: index("idx_refunds_date").on(table.createdAt),
}));

// Admin settings table
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  type: text("type").notNull(), // string, number, boolean, json
  description: text("description"),
  category: text("category").notNull(), // general, payment, email, security, etc.
  isPublic: boolean("is_public").default(false).notNull(),
  updatedBy: varchar("updated_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  keyIdx: index("idx_admin_settings_key", table.key),
  categoryIdx: index("idx_admin_settings_category", table.category),
  publicIdx: index("idx_admin_settings_public", table.isPublic),
}));

// Inventory movements table
export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // purchase, sale, adjustment, return, loss
  quantity: integer("quantity").notNull(),
  unitCost: integer("unit_cost"),
  totalCost: integer("total_cost"),
  reason: text("reason"),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  referenceId: varchar("reference_id"), // Order ID, Purchase ID, etc.
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("idx_inventory_movements_product", table.productId),
  typeIdx: index("idx_inventory_movements_type", table.type),
  userIdx: index("idx_inventory_movements_user", table.userId),
  dateIdx: index("idx_inventory_movements_date", table.createdAt),
  referenceIdx: index("idx_inventory_movements_reference", table.referenceId),
}));

// System logs table
export const systemLogs = pgTable("system_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  level: text("level").notNull(), // debug, info, warn, error, fatal
  message: text("message").notNull(),
  context: jsonb("context"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  module: text("module").notNull(),
  action: text("action"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  levelIdx: index("idx_system_logs_level", table.level),
  moduleIdx: index("idx_system_logs_module", table.module),
  userIdx: index("idx_system_logs_user", table.userId),
  dateIdx: index("idx_system_logs_date", table.createdAt),
  actionIdx: index("idx_system_logs_action", table.action),
}));

// Audit trail table for tracking changes
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tableName: text("table_name").notNull(),
  recordId: varchar("record_id").notNull(),
  action: text("action").notNull(), // INSERT, UPDATE, DELETE
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  tableIdx: index("idx_audit_logs_table").on(table.tableName),
  recordIdx: index("idx_audit_logs_record").on(table.recordId),
  actionIdx: index("idx_audit_logs_action").on(table.action),
  userIdx: index("idx_audit_logs_user").on(table.userId),
  dateIdx: index("idx_audit_logs_date").on(table.createdAt),
}));

export const insertWishlistSchema = createInsertSchema(wishlists, {
  userId: z.string().uuid(),
  productId: z.string().uuid(),
});

export const insertProductReviewSchema = createInsertSchema(productReviews, {
  rating: z.number().min(1).max(5),
  title: z.string().min(1).max(200).optional(),
  comment: z.string().min(1).max(1000).optional(),
  userId: z.string().uuid(),
  productId: z.string().uuid(),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions, {
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  paymentMethod: z.enum(["stripe", "paypal", "cash_on_delivery", "bank_transfer", "digital_wallet"]),
  amount: z.number().min(100),
  currency: z.string().length(3).default("UZS"),
  status: z.enum(["pending", "processing", "completed", "failed", "refunded", "cancelled"]),
  gatewayTransactionId: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
  refundReason: z.string().optional(),
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods, {
  userId: z.string().uuid(),
  type: z.enum(["card", "bank_account", "digital_wallet"]),
  provider: z.string().min(2),
  providerMethodId: z.string().min(1),
  brand: z.string().optional(),
  last4: z.string().length(4).optional(),
  expiryMonth: z.number().min(1).max(12).optional(),
  expiryYear: z.number().min(2024).max(2050).optional(),
});

export const insertAdminSettingSchema = createInsertSchema(adminSettings, {
  key: z.string().min(1).max(100),
  type: z.enum(["string", "number", "boolean", "json"]),
  value: z.string().min(1),
  category: z.enum(["general", "payment", "email", "security", "notification", "inventory"]),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(false),
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements, {
  productId: z.string().uuid(),
  type: z.enum(["purchase", "sale", "adjustment", "return", "loss"]),
  quantity: z.number(),
  unitCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  reason: z.string().max(500).optional(),
  userId: z.string().uuid().optional(),
  referenceId: z.string().uuid().optional(),
});

export const insertSystemLogSchema = createInsertSchema(systemLogs, {
  level: z.enum(["debug", "info", "warn", "error", "fatal"]),
  message: z.string().min(1).max(1000),
  module: z.string().min(1).max(50),
  action: z.string().max(100).optional(),
  duration: z.number().min(0).optional(),
  userId: z.string().uuid().optional(),
});

export const insertRefundSchema = createInsertSchema(refunds, {
  paymentTransactionId: z.string().uuid(),
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().min(1),
  reason: z.string().min(10).max(500),
  status: z.enum(["pending", "approved", "rejected", "processed"]),
  processedBy: z.string().uuid().optional(),
  gatewayRefundId: z.string().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications, {
  userId: z.string().uuid(),
  type: z.enum(["order_update", "promo", "product_available", "system", "reminder", "new_order"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(500),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

export const insertStoreSchema = createInsertSchema(stores, {
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  address: z.string().max(500).optional(),
  phone: z.string().optional(),
  logo: z.string().optional(),
});

// Enhanced validation schemas with database-level constraints
export const insertUserSchema = createInsertSchema(users, {
  phoneNumber: z.string().regex(/^\+998\d{9}$/, "Invalid Uzbek phone number format"),
  role: z.enum(["admin", "courier", "customer", "store"]),
  name: z.string().min(1).max(100).optional(),
  address: z.string().max(500).optional(),
});

export const insertProductSchema = createInsertSchema(products, {
  name: z.string().min(1).max(200),
  price: z.number().min(0).max(10000000),
  originalPrice: z.number().min(0).max(10000000).optional(),
  unit: z.string().min(1).max(20),
  rating: z.string().regex(/^\d+(\.\d+)?$/, "Invalid rating format").optional(),
  stockQuantity: z.number().min(0).max(10000).default(0),
});

export const insertOrderSchema = createInsertSchema(orders, {
  customerName: z.string().min(1).max(100),
  phoneNumber: z.string().regex(/^\+998\d{9}$/, "Invalid Uzbek phone number format"),
  address: z.string().min(1).max(500),
  total: z.number().min(0).max(10000000),
  discount: z.number().min(0).max(10000000).optional(),
  status: z.enum(["pending", "confirmed", "preparing", "ready", "delivering", "delivered", "cancelled"]).optional(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes, {
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/, "Promo code must be uppercase alphanumeric"),
  discountPercent: z.number().min(1).max(100),
  minAmount: z.number().min(0).default(0),
  maxUses: z.number().min(1).max(10000),
  usedCount: z.number().min(0).max(10000),
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1).max(50),
  icon: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  bgColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid background color format"),
});

export type User = typeof users.$inferSelect;
export type Store = typeof stores.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Subcategory = typeof subcategories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Wishlist = typeof wishlists.$inferSelect;
export type ProductReview = typeof productReviews.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type Refund = typeof refunds.$inferSelect;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type SystemLog = typeof systemLogs.$inferSelect;
