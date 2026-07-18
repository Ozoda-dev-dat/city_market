import { 
  type User, type Product, type Category, type Order, type PromoCode 
} from "../shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { eq, and, isNull } from "drizzle-orm";
import Database from "better-sqlite3";
import * as schema from "../shared/schema";

// SQLite-based storage implementation
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, user: any): Promise<User>;
  getUsers(): Promise<User[]>;
  getCouriers(): Promise<User[]>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, product: any): Promise<Product>;
  
  getCategories(): Promise<Category[]>;
  createCategory(category: any): Promise<Category>;
  
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: any): Promise<Order>;
  updateOrder(id: string, order: any): Promise<Order>;
  
  getPromoCodes(): Promise<PromoCode[]>;
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promo: any): Promise<PromoCode>;
}

class SQLiteStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sqlite = new Database("supermarket_go_dev.db");
    this.db = drizzle(sqlite, { schema });
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.phoneNumber, phone));
    return users[0];
  }

  async createUser(user: any): Promise<User> {
    const [newUser] = await this.db.insert(schema.users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, user: any): Promise<User> {
    const [updatedUser] = await this.db
      .update(schema.users)
      .set(user)
      .where(eq(schema.users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(schema.users);
  }

  async getCouriers(): Promise<User[]> {
    return await this.db.select().from(schema.users).where(eq(schema.users.role, "courier"));
  }

  // Product operations
  async getProducts(): Promise<Product[]> {
    return await this.db.select().from(schema.products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const products = await this.db.select().from(schema.products).where(eq(schema.products.id, id));
    return products[0];
  }

  async createProduct(product: any): Promise<Product> {
    const [newProduct] = await this.db.insert(schema.products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: string, product: any): Promise<Product> {
    const [updatedProduct] = await this.db
      .update(schema.products)
      .set(product)
      .where(eq(schema.products.id, id))
      .returning();
    return updatedProduct;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await this.db.select().from(schema.categories);
  }

  async createCategory(category: any): Promise<Category> {
    const [newCategory] = await this.db.insert(schema.categories).values(category).returning();
    return newCategory;
  }

  // Order operations
  async getOrders(): Promise<Order[]> {
    return await this.db.select().from(schema.orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const orders = await this.db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return orders[0];
  }

  async createOrder(order: any): Promise<Order> {
    const [newOrder] = await this.db.insert(schema.orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: string, order: any): Promise<Order> {
    const [updatedOrder] = await this.db
      .update(schema.orders)
      .set(order)
      .where(eq(schema.orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Promo code operations
  async getPromoCodes(): Promise<PromoCode[]> {
    return await this.db.select().from(schema.promoCodes);
  }

  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    const promos = await this.db.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, code));
    return promos[0];
  }

  async createPromoCode(promo: any): Promise<PromoCode> {
    const [newPromo] = await this.db.insert(schema.promoCodes).values(promo).returning();
    return newPromo;
  }
}

export const storage = new SQLiteStorage();
