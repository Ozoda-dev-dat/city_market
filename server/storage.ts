import { 
  type User, type Product, type Category, type Order, type PromoCode 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  getCouriers(): Promise<User[]>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, product: any): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  getCategories(): Promise<Category[]>;
  createCategory(category: any): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  
  getOrders(): Promise<Order[]>;
  createOrder(order: any): Promise<Order>;
  updateOrderStatus(id: string, status: string, courierId?: string): Promise<Order>;
  
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promo: any): Promise<PromoCode>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private categories: Map<string, Category>;
  private orders: Map<string, Order>;
  private promoCodes: Map<string, PromoCode>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.promoCodes = new Map();
    this.initMockData();
  }

  private initMockData() {
    const cats = [
      { id: "fruits", name: "Mevalar", icon: "nutrition", color: "#1A9B5C", bgColor: "#E8F5E9" },
      { id: "vegetables", name: "Sabzavotlar", icon: "leaf", color: "#2ECC71", bgColor: "#F1F8E9" },
    ];
    cats.forEach(c => this.categories.set(c.id, c as Category));
    
    // Default Admin
    this.createUser({ phoneNumber: "+998901234567", password: "admin", role: "admin", name: "Admin" });
  }

  async getUser(id: string) { return this.users.get(id); }
  async getUserByPhone(phoneNumber: string) { 
    return Array.from(this.users.values()).find(u => u.phoneNumber === phoneNumber); 
  }
  async createUser(insertUser: any) {
    const id = randomUUID();
    const user = { ...insertUser, id, role: insertUser.role || "customer" };
    this.users.set(id, user);
    return user;
  }
  async getCouriers() {
    return Array.from(this.users.values()).filter(u => u.role === "courier");
  }

  async getProducts() { return Array.from(this.products.values()); }
  async getProduct(id: string) { return this.products.get(id); }
  async createProduct(p: any) {
    const id = p.id || randomUUID();
    const product = { ...p, id, rating: "5.0", inStock: true };
    this.products.set(id, product);
    return product;
  }
  async updateProduct(id: string, update: any) {
    const existing = this.products.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { ...existing, ...update };
    this.products.set(id, updated);
    return updated;
  }
  async deleteProduct(id: string) { this.products.delete(id); }

  async getCategories() { return Array.from(this.categories.values()); }
  async createCategory(cat: any) {
    this.categories.set(cat.id, cat);
    return cat;
  }
  async deleteCategory(id: string) {
    this.categories.delete(id);
  }

  async getOrders() { return Array.from(this.orders.values()); }
  async createOrder(o: any) {
    const id = `BUY-${Math.floor(1000 + Math.random() * 9000)}`;
    const order = { ...o, id, createdAt: new Date(), status: "pending" };
    this.orders.set(id, order);
    return order;
  }
  async updateOrderStatus(id: string, status: string, courierId?: string) {
    const existing = this.orders.get(id);
    if (!existing) throw new Error("Not found");
    const updated = { 
      ...existing, 
      status, 
      courierId: courierId || existing.courierId,
      updatedAt: new Date()
    };
    this.orders.set(id, updated);
    return updated;
  }

  async getPromoCodes() {
    return Array.from(this.promoCodes.values());
  }

  async getPromoCode(code: string) {
    return Array.from(this.promoCodes.values()).find(p => p.code === code && p.isActive);
  }
  async createPromoCode(p: any) {
    const id = randomUUID();
    const promo = { ...p, id, isActive: true };
    this.promoCodes.set(id, promo);
    return promo;
  }
}

export const storage = new MemStorage();
