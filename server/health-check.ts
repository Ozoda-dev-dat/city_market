import express from "express";
import cors from "cors";
import { db } from "./db";
import { categories, products } from "./db/schema";
import { eq, and, like, sql } from "drizzle-orm";

const app = express();
const port = parseInt(process.env.PORT || "3001", 10);

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/categories", async (req, res) => {
  try {
    const result = await db.select().from(categories);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/products", async (req, res) => {
  try {
    const { categoryId, query, popular } = req.query;
    let conditions = [];

    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId as string)));
    }
    if (query) {
      conditions.push(like(products.name, `%${query}%`));
    }
    if (popular === "true") {
      conditions.push(eq(products.isPopular, true));
    }

    const result = await db
      .select()
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Health-check Express server running on port ${port}`);
});
