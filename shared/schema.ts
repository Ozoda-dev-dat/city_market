import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").default("customer").notNull(), // admin, courier, customer
  name: text("name"),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  bgColor: text("bg_color").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().references(() => categories.id),
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
});

export const promoCodes = pgTable("promo_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  customerId: varchar("customer_id").references(() => users.id),
  courierId: varchar("courier_id").references(() => users.id),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  total: integer("total").notNull(),
  discount: integer("discount").default(0).notNull(),
  status: text("status").default("pending").notNull(),
  items: jsonb("items").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertPromoCodeSchema = createInsertSchema(promoCodes);

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type PromoCode = typeof promoCodes.$inferSelect;
