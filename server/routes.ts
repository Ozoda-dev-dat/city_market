import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/auth/register", async (req, res) => {
    const { phoneNumber, password, name } = req.body;
    const existing = await storage.getUserByPhone(phoneNumber);
    if (existing) return res.status(400).json({ error: "User exists" });
    const user = await storage.createUser({ phoneNumber, password, name, role: "customer" });
    res.json(user);
  });

  app.post("/api/auth/login", async (req, res) => {
    const { phoneNumber, password } = req.body;
    const user = await storage.getUserByPhone(phoneNumber);
    if (!user || user.password !== password) return res.status(401).json({ error: "Invalid credentials" });
    res.json(user);
  });

  app.get("/api/couriers", async (_req, res) => {
    const couriers = await storage.getCouriers();
    res.json(couriers);
  });

  app.post("/api/auth/courier", async (req, res) => {
    const { phoneNumber, password, name } = req.body;
    const user = await storage.createUser({ phoneNumber, password, name, role: "courier" });
    res.json(user);
  });

  app.post("/api/promo-codes", async (req, res) => {
    const promo = await storage.createPromoCode(req.body);
    res.json(promo);
  });

  app.get("/api/promo-codes/:code", async (req, res) => {
    const promo = await storage.getPromoCode(req.params.code);
    if (!promo) return res.status(404).json({ error: "Invalid promo" });
    res.json(promo);
  });

  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: result.error });
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
    if (!result.success) return res.status(400).json({ error: result.error });
    const order = await storage.createOrder(result.data);
    res.json(order);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    const { status, courierId } = req.body;
    const order = await storage.updateOrderStatus(req.params.id, status, courierId);
    res.json(order);
  });

  const httpServer = createServer(app);
  return httpServer;
}
