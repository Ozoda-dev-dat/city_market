import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const product = await storage.createProduct(result.data);
    res.json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    const product = await storage.updateProduct(req.params.id, req.body);
    res.json(product);
  });

  app.delete("/api/products/:id", async (req, res) => {
    await storage.deleteProduct(req.params.id);
    res.sendStatus(204);
  });

  app.get("/api/categories", async (_req, res) => {
    const categories = await storage.getCategories();
    res.json(categories);
  });

  app.get("/api/orders", async (_req, res) => {
    const orders = await storage.getOrders();
    res.json(orders);
  });

  app.post("/api/orders", async (req, res) => {
    const result = insertOrderSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const order = await storage.createOrder(result.data);
    res.json(order);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { status } = req.body;
    const order = await storage.updateOrderStatus(req.params.id, status);
    res.json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}
