import { 
  type User, type InsertUser, 
  type Product, type InsertProduct,
  type Category, type InsertCategory,
  type Order, type InsertOrder
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    
    // Initialize with some mock data if empty
    this.initMockData();
  }

  private initMockData() {
    const cats: InsertCategory[] = [
      { id: "fruits", name: "Mevalar", icon: "nutrition", color: "#1A9B5C", bgColor: "#E8F5E9" },
      { id: "vegetables", name: "Sabzavotlar", icon: "leaf", color: "#2ECC71", bgColor: "#F1F8E9" },
    ];
    cats.forEach(c => this.categories.set(c.id, { ...c } as Category));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, isAdmin: false };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = insertProduct.id || randomUUID();
    const product: Product = { ...insertProduct, id, rating: insertProduct.rating || "5.0", inStock: insertProduct.inStock ?? true };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, update: Partial<InsertProduct>): Promise<Product> {
    const existing = this.products.get(id);
    if (!existing) throw new Error("Product not found");
    const updated = { ...existing, ...update };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(cat: InsertCategory): Promise<Category> {
    this.categories.set(cat.id, cat as Category);
    return cat as Category;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = insertOrder.id || `BUY-${Math.floor(1000 + Math.random() * 9000)}`;
    const order: Order = { ...insertOrder, id, createdAt: new Date() };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const existing = this.orders.get(id);
    if (!existing) throw new Error("Order not found");
    const updated = { ...existing, status };
    this.orders.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
