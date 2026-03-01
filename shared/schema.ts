import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
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
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  total: integer("total").notNull(),
  status: text("status").default("pending").notNull(),
  items: jsonb("items").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
