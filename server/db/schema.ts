import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull(),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  priceInt: integer("price_int").notNull(), // UZS
  imageUrl: text("image_url").notNull(),
  isPopular: integer("is_popular", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(new Date()),
});

export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export type Category = z.infer<typeof selectCategorySchema>;
export type Product = z.infer<typeof selectProductSchema>;
