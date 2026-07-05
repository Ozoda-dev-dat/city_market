import { 
  type User, type Product, type Category, type Order, type PromoCode, type Subcategory, type Store
} from "@shared/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, isNull, desc, sql, inArray } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { auditService } from "./audit-service";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: string, user: any, userId?: string, ipAddress?: string, userAgent?: string): Promise<User>;
  softDeleteUser(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  restoreUser(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<User>;
  updateUserLocation(userId: string, latitude: string, longitude: string, address: string): Promise<User>;
  getUsers(): Promise<User[]>;
  getCouriers(): Promise<User[]>;
  clearTestUsers(): Promise<void>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: any): Promise<Product>;
  updateProduct(id: string, product: any, userId?: string, ipAddress?: string, userAgent?: string): Promise<Product>;
  softDeleteProduct(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  restoreProduct(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Product>;
  
  getCategories(): Promise<Category[]>;
  createCategory(category: any): Promise<Category>;
  softDeleteCategory(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  restoreCategory(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Category>;

  getSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]>;
  createSubcategory(subcategory: any): Promise<Subcategory>;
  softDeleteSubcategory(id: string, userId?: string): Promise<void>;
  
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  createOrder(order: any): Promise<Order>;
  updateOrderStatus(id: string, status: string, courierId?: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Order>;
  softDeleteOrder(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  restoreOrder(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Order>;
  
  getPromoCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promo: any): Promise<PromoCode>;
  getPromoCodes(): Promise<PromoCode[]>;
  updatePromoCode(id: string, promo: any, userId?: string, ipAddress?: string, userAgent?: string): Promise<PromoCode>;
  softDeletePromoCode(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void>;
  restorePromoCode(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<PromoCode>;

  getNotifications(userId: string): Promise<any[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationRead(id: string, userId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  createNotification(notification: any): Promise<any>;

  getStores(): Promise<Store[]>;
  getStore(id: string): Promise<Store | undefined>;
  getStoreByOwner(ownerId: string): Promise<Store | undefined>;
  createStore(store: any): Promise<Store>;
  updateStore(id: string, store: any): Promise<Store>;
  softDeleteStore(id: string): Promise<void>;
  getProductsByStore(storeId: string): Promise<Product[]>;
  getProductCountByStore(storeId: string): Promise<number>;
  getOrdersByStore(storeId: string): Promise<Order[]>;
  notifyStoresForOrder(order: Order): Promise<string[]>;
}

export class DbStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    let connectionString: string;

    if (process.env.DATABASE_URL) {
      connectionString = process.env.DATABASE_URL.trim();
      const psqlMatch = connectionString.match(/^psql\s+'(.+)'$/);
      if (psqlMatch) connectionString = psqlMatch[1];
    } else if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
      const host = process.env.PGHOST;
      const port = process.env.PGPORT || '5432';
      const user = process.env.PGUSER;
      const password = encodeURIComponent(process.env.PGPASSWORD || '');
      const db = process.env.PGDATABASE;
      connectionString = `postgresql://${user}:${password}@${host}:${port}/${db}`;
    } else {
      throw new Error("DATABASE_URL or PG* environment variables are not set");
    }

    const disableSsl = /sslmode=disable/i.test(connectionString);
    const client = postgres(connectionString, { ssl: disableSsl ? false : 'require' });
    this.db = drizzle(client, { schema });
    
    this.initMockData();
  }

  private async initMockData() {
    try {
      // Check if categories exist
      const existingCats = await this.db.select().from(schema.categories);
      
      if (existingCats.length === 0) {
        // Create default main categories
        const cats = [
          { id: "fruits",      name: "Mevalar",           icon: "nutrition",    color: "#1A9B5C", bgColor: "#E8F5E9" },
          { id: "vegetables",  name: "Sabzavotlar",        icon: "leaf",         color: "#2ECC71", bgColor: "#F1F8E9" },
          { id: "dairy",       name: "Sut mahsulotlari",   icon: "flask",        color: "#3498DB", bgColor: "#EBF5FB" },
          { id: "bakery",      name: "Non mahsulotlari",   icon: "pizza",        color: "#E74C3C", bgColor: "#FDEDEC" },
          { id: "meat",        name: "Go'sht mahsulotlari",icon: "fish",         color: "#9B59B6", bgColor: "#F4ECF7" },
          { id: "ichimliklar", name: "Ichimliklar",        icon: "wine",         color: "#7C3AED", bgColor: "#EDE9FE" },
          { id: "shokoladlar", name: "Shokoladlar",        icon: "gift-outline", color: "#B45309", bgColor: "#FEF3C7" },
          { id: "konservalar", name: "Konservalar",        icon: "cube-outline", color: "#374151", bgColor: "#F3F4F6" },
        ];
        
        for (const cat of cats) {
          await this.db.insert(schema.categories).values(cat);
        }

        // Create default subcategories
        const subcats = [
          // Under ichimliklar
          { id: "sub-coffee",     name: "Coffee",               icon: "cafe",       color: "#6F4E37", bgColor: "#F5ECE5", categoryId: "ichimliklar" },
          { id: "sub-energetik",  name: "Energetik ichimliklar",icon: "flash",      color: "#F59E0B", bgColor: "#FEF3C7", categoryId: "ichimliklar" },
          { id: "sub-sharbatlar", name: "Sharbatlar",           icon: "wine",       color: "#F97316", bgColor: "#FFF7ED", categoryId: "ichimliklar" },
          // Under meat
          { id: "sub-parranda",   name: "Go'sht va parranda",   icon: "restaurant", color: "#9B59B6", bgColor: "#F4ECF7", categoryId: "meat" },
          { id: "sub-kolbasa",    name: "Kolbasa mahsulotlari", icon: "fast-food",  color: "#DC2626", bgColor: "#FEF2F2", categoryId: "meat" },
          // Under dairy
          { id: "sub-pishloq",    name: "Pishloq",              icon: "restaurant", color: "#FBBF24", bgColor: "#FFFBEB", categoryId: "dairy" },
          { id: "sub-qatiq",      name: "Qatiq mahsulotlari",   icon: "water",      color: "#3B82F6", bgColor: "#EFF6FF", categoryId: "dairy" },
          { id: "sub-tuxum",      name: "Tuxum mahsulotlari",   icon: "egg",        color: "#F59E0B", bgColor: "#FFFBEB", categoryId: "dairy" },
          { id: "sub-yogurt",     name: "Yogurt",               icon: "water",      color: "#8B5CF6", bgColor: "#F5F3FF", categoryId: "dairy" },
        ];

        for (const sub of subcats) {
          await this.db.insert(schema.subcategories).values(sub);
        }
        
        console.log("✅ Default categories and subcategories created");
      }

      // Check if admin user exists
      const existingAdmin = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, "admin"))
        .limit(1);

      if (existingAdmin.length === 0) {
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash("admin", 10);
        // Create default admin
        await this.db.insert(schema.users).values({
          phoneNumber: "+998901234567",
          password: hashedPassword,
          role: "admin",
          name: "Admin"
        });
        
        console.log("✅ Default admin user created");
      }

      // Create sample products if none exist
      const existingProducts = await this.db.select().from(schema.products);
      
      if (existingProducts.length === 0) {
        const sampleProducts = [
          {
            id: "apple-1",
            name: "Qizil olma",
            category: "fruits",
            price: 15000,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
            description: "To'q qizil, shirin va mazali olma",
            brand: "Local Farm",
            weight: "1kg",
            stockQuantity: 100
          },
          {
            id: "banana-1",
            name: "Banan",
            category: "fruits",
            price: 20000,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400",
            description: "Yetilgan, sariq banan",
            brand: "Tropical Fruits",
            weight: "1kg",
            stockQuantity: 50
          },
          {
            id: "tomato-1",
            name: "Pomidor",
            category: "vegetables",
            price: 8000,
            unit: "kg",
            image: "https://images.unsplash.com/photo-1546470427-e92b2c9c09d6?w=400",
            description: "Yangi, qizil pomidor",
            brand: "Green House",
            weight: "1kg",
            stockQuantity: 200
          }
        ];

        for (const product of sampleProducts) {
          await this.db.insert(schema.products).values(product);
        }
        
        console.log("✅ Sample products created");
      }

    } catch (error) {
      console.error("❌ Error initializing mock data:", error);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    return users[0];
  }

  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    console.log("Database: Looking for phone:", phoneNumber);
    const users = await this.db.select().from(schema.users).where(eq(schema.users.phoneNumber, phoneNumber));
    console.log("Database: Found users:", users);
    console.log("Database: Returning first user:", users[0]);
    return users[0];
  }

  async createUser(insertUser: any): Promise<User> {
    const result = await this.db.insert(schema.users).values(insertUser).returning();
    await auditService.logInsert("users", result[0].id);
    return result[0];
  }

  async updateUser(id: string, updateUser: any, userId?: string, ipAddress?: string, userAgent?: string): Promise<User> {
    const oldUser = await this.getUser(id);
    const result = await this.db
      .update(schema.users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();
    await auditService.logChange({
      tableName: "users",
      recordId: id,
      action: "UPDATE",
      oldValues: oldUser,
      newValues: result[0],
      userId,
      ipAddress,
      userAgent,
    });
    return result[0];
  }

  async getUsers(includeDeleted = false): Promise<User[]> {
    if (includeDeleted) {
      return await this.db.select().from(schema.users);
    }
    return await this.db.select().from(schema.users).where(isNull(schema.users.deletedAt));
  }

  async softDeleteUser(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const oldUser = await this.getUser(id);
    await this.db
      .update(schema.users)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(schema.users.id, id));
    await auditService.logChange({
      tableName: "users",
      recordId: id,
      action: "DELETE",
      oldValues: oldUser,
      userId,
      ipAddress,
      userAgent,
    });
  }

  async restoreUser(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<User> {
    const result = await this.db
      .update(schema.users)
      .set({ deletedAt: null, isActive: true })
      .where(eq(schema.users.id, id))
      .returning();
    await auditService.logChange({
      tableName: "users",
      recordId: id,
      action: "UPDATE",
      newValues: result[0],
      userId,
      ipAddress,
      userAgent,
    });
    return result[0];
  }

  async updateUserLocation(userId: string, latitude: string, longitude: string, address: string): Promise<User> {
    const result = await this.db
      .update(schema.users)
      .set({ latitude, longitude, address })
      .where(eq(schema.users.id, userId))
      .returning();
    return result[0];
  }

  async getCouriers(): Promise<User[]> {
    return await this.db.select().from(schema.users).where(
      and(
        eq(schema.users.role, "courier"),
        isNull(schema.users.deletedAt)
      )
    );
  }

  async clearTestUsers(): Promise<void> {
    // Soft delete all customer users except admin
    await this.db
      .update(schema.users)
      .set({ deletedAt: new Date(), isActive: false })
      .where(
        and(
          eq(schema.users.role, "customer"),
          isNull(schema.users.deletedAt)
        )
      );
  }

  async getProducts(): Promise<Product[]> {
    return await this.db.select().from(schema.products).where(isNull(schema.products.deletedAt));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const products = await this.db.select().from(schema.products).where(eq(schema.products.id, id));
    return products[0];
  }

  async createProduct(product: any): Promise<Product> {
    const result = await this.db.insert(schema.products).values(product).returning();
    await auditService.logInsert("products", result[0].id);
    return result[0];
  }

  async updateProduct(id: string, update: any, userId?: string, ipAddress?: string, userAgent?: string): Promise<Product> {
    const result = await this.db
      .update(schema.products)
      .set(update)
      .where(eq(schema.products.id, id))
      .returning();
    await auditService.logUpdate("products", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async softDeleteProduct(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.db
      .update(schema.products)
      .set({ deletedAt: new Date() })
      .where(eq(schema.products.id, id));
    await auditService.logDelete("products", id, userId, ipAddress, userAgent);
  }

  async restoreProduct(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Product> {
    const result = await this.db
      .update(schema.products)
      .set({ deletedAt: null })
      .where(eq(schema.products.id, id))
      .returning();
    await auditService.logRestore("products", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async getCategories(): Promise<Category[]> {
    return await this.db.select().from(schema.categories).where(isNull(schema.categories.deletedAt));
  }

  async createCategory(category: any): Promise<Category> {
    const result = await this.db.insert(schema.categories).values(category).returning();
    await auditService.logInsert("categories", result[0].id);
    return result[0];
  }

  async softDeleteCategory(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.db
      .update(schema.categories)
      .set({ deletedAt: new Date() })
      .where(eq(schema.categories.id, id));
    await auditService.logDelete("categories", id, userId, ipAddress, userAgent);
  }

  async restoreCategory(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Category> {
    const result = await this.db
      .update(schema.categories)
      .set({ deletedAt: null })
      .where(eq(schema.categories.id, id))
      .returning();
    await auditService.logRestore("categories", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async getSubcategories(): Promise<Subcategory[]> {
    return await this.db.select().from(schema.subcategories).where(isNull(schema.subcategories.deletedAt));
  }

  async getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
    return await this.db.select().from(schema.subcategories).where(
      and(
        eq(schema.subcategories.categoryId, categoryId),
        isNull(schema.subcategories.deletedAt)
      )
    );
  }

  async createSubcategory(subcategory: any): Promise<Subcategory> {
    const result = await this.db.insert(schema.subcategories).values(subcategory).returning();
    return result[0];
  }

  async softDeleteSubcategory(id: string, userId?: string): Promise<void> {
    await this.db
      .update(schema.subcategories)
      .set({ deletedAt: new Date() })
      .where(eq(schema.subcategories.id, id));
  }

  async getOrders(): Promise<Order[]> {
    return await this.db.select().from(schema.orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await this.db.select().from(schema.orders).where(eq(schema.orders.id, id));
    return result[0];
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.customerId, customerId));
  }

  async createOrder(order: any): Promise<Order> {
    const result = await this.db.insert(schema.orders).values(order).returning();
    await auditService.logInsert("orders", result[0].id);

    // Decrement stock for each item that has a productId
    if (Array.isArray(order.items)) {
      for (const item of order.items) {
        if (item.productId) {
          await this.db
            .update(schema.products)
            .set({ stockQuantity: sql`GREATEST(0, stock_quantity - ${item.qty || 1})` })
            .where(eq(schema.products.id, item.productId));
        }
      }
    }

    return result[0];
  }

  async updateOrderStatus(id: string, status: string, courierId?: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Order> {
    const updateData: any = { status };
    if (courierId) {
      updateData.courierId = courierId;
    }
    
    const result = await this.db
      .update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, id))
      .returning();
    await auditService.logUpdate("orders", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async softDeleteOrder(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.db
      .update(schema.orders)
      .set({ deletedAt: new Date() })
      .where(eq(schema.orders.id, id));
    await auditService.logDelete("orders", id, userId, ipAddress, userAgent);
  }

  async restoreOrder(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<Order> {
    const result = await this.db
      .update(schema.orders)
      .set({ deletedAt: null })
      .where(eq(schema.orders.id, id))
      .returning();
    await auditService.logRestore("orders", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async getPromoCode(code: string): Promise<PromoCode | undefined> {
    const promoCodes = await this.db.select().from(schema.promoCodes).where(eq(schema.promoCodes.code, code));
    return promoCodes[0];
  }

  async getPromoCodes(): Promise<PromoCode[]> {
    return await this.db.select().from(schema.promoCodes);
  }

  async createPromoCode(promo: any): Promise<PromoCode> {
    const result = await this.db.insert(schema.promoCodes).values(promo).returning();
    await auditService.logInsert("promoCodes", result[0].id);
    return result[0];
  }

  async updatePromoCode(id: string, promo: any, userId?: string, ipAddress?: string, userAgent?: string): Promise<PromoCode> {
    const result = await this.db
      .update(schema.promoCodes)
      .set(promo)
      .where(eq(schema.promoCodes.id, id))
      .returning();
    await auditService.logUpdate("promoCodes", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async softDeletePromoCode(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.db
      .update(schema.promoCodes)
      .set({ deletedAt: new Date() })
      .where(eq(schema.promoCodes.id, id));
    await auditService.logDelete("promoCodes", id, userId, ipAddress, userAgent);
  }

  async restorePromoCode(id: string, userId?: string, ipAddress?: string, userAgent?: string): Promise<PromoCode> {
    const result = await this.db
      .update(schema.promoCodes)
      .set({ deletedAt: null })
      .where(eq(schema.promoCodes.id, id))
      .returning();
    await auditService.logRestore("promoCodes", id, userId, ipAddress, userAgent);
    return result[0];
  }

  async getNotifications(userId: string): Promise<any[]> {
    return this.db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.notifications)
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        )
      );
    return result[0]?.count ?? 0;
  }

  async markNotificationRead(id: string, userId: string): Promise<void> {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.id, id),
          eq(schema.notifications.userId, userId)
        )
      );
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await this.db
      .update(schema.notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        )
      );
  }

  async createNotification(notification: any): Promise<any> {
    const result = await this.db
      .insert(schema.notifications)
      .values(notification)
      .returning();
    return result[0];
  }

  async getStores(): Promise<Store[]> {
    return await this.db
      .select()
      .from(schema.stores)
      .where(isNull(schema.stores.deletedAt))
      .orderBy(desc(schema.stores.createdAt));
  }

  async getStore(id: string): Promise<Store | undefined> {
    const result = await this.db
      .select()
      .from(schema.stores)
      .where(eq(schema.stores.id, id));
    return result[0];
  }

  async getStoreByOwner(ownerId: string): Promise<Store | undefined> {
    const result = await this.db
      .select()
      .from(schema.stores)
      .where(and(eq(schema.stores.ownerId, ownerId), isNull(schema.stores.deletedAt)));
    return result[0];
  }

  async createStore(store: any): Promise<Store> {
    const result = await this.db.insert(schema.stores).values(store).returning();
    return result[0];
  }

  async updateStore(id: string, update: any): Promise<Store> {
    const result = await this.db
      .update(schema.stores)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(schema.stores.id, id))
      .returning();
    return result[0];
  }

  async softDeleteStore(id: string): Promise<void> {
    await this.db
      .update(schema.stores)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(schema.stores.id, id));
  }

  async getProductsByStore(storeId: string): Promise<Product[]> {
    return await this.db
      .select()
      .from(schema.products)
      .where(and(eq(schema.products.storeId, storeId), isNull(schema.products.deletedAt)))
      .orderBy(desc(schema.products.createdAt));
  }

  async getProductCountByStore(storeId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.products)
      .where(and(eq(schema.products.storeId, storeId), isNull(schema.products.deletedAt)));
    return result[0]?.count ?? 0;
  }

  async getOrdersByStore(storeId: string): Promise<Order[]> {
    const storeProducts = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.storeId, storeId));

    if (storeProducts.length === 0) return [];

    const productIds = new Set(storeProducts.map((p) => p.id));

    const allOrders = await this.db
      .select()
      .from(schema.orders)
      .orderBy(desc(schema.orders.createdAt));

    // Filter orders to only those containing this store's products,
    // and strip items from other stores so owners see only their own data
    const result: Order[] = [];
    for (const order of allOrders) {
      const items: any[] = Array.isArray(order.items) ? order.items : [];
      const storeItems = items.filter((item: any) =>
        productIds.has(item.id || item.productId)
      );
      if (storeItems.length > 0) {
        result.push({ ...order, items: storeItems } as Order);
      }
    }
    return result;
  }

  async notifyStoresForOrder(order: Order): Promise<string[]> {
    const items: any[] = Array.isArray(order.items) ? order.items : [];
    if (items.length === 0) return [];

    const productIds = items.map((i: any) => i.id || i.productId).filter(Boolean);
    if (productIds.length === 0) return [];

    const products = await this.db
      .select({ id: schema.products.id, name: schema.products.name, storeId: schema.products.storeId })
      .from(schema.products)
      .where(inArray(schema.products.id, productIds));

    const storeItemsMap = new Map<string, { productName: string; quantity: number }[]>();

    for (const item of items) {
      const productId = item.id || item.productId;
      const product = products.find((p) => p.id === productId);
      if (!product?.storeId) continue;

      if (!storeItemsMap.has(product.storeId)) {
        storeItemsMap.set(product.storeId, []);
      }
      storeItemsMap.get(product.storeId)!.push({
        productName: product.name,
        quantity: item.quantity || 1,
      });
    }

    const affectedOwnerIds: string[] = [];

    for (const [storeId, storeItems] of storeItemsMap) {
      const store = await this.getStore(storeId);
      if (!store || !store.isActive) continue;

      const itemsText = storeItems
        .map((i) => `${i.productName} x${i.quantity}`)
        .join(", ");

      await this.createNotification({
        userId: store.ownerId,
        type: "new_order",
        title: "Yangi buyurtma!",
        message: `Buyurtma #${order.id.slice(-6).toUpperCase()}: ${itemsText}`,
        data: {
          orderId: order.id,
          items: storeItems,
          customerName: order.customerName,
          address: order.address,
        },
        isRead: false,
        priority: "high",
      });

      affectedOwnerIds.push(store.ownerId);
    }

    return affectedOwnerIds;
  }

  async seedNotificationsForUser(userId: string): Promise<void> {
    const existing = await this.db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId));
    if ((existing[0]?.count ?? 0) > 0) return;

    const now = new Date();
    const samples = [
      {
        userId,
        type: "promo",
        title: "Chegirma mavjud!",
        message: "Barcha mevalar bo'limida 20% chegirma. Faqat bugun!",
        isRead: false,
        priority: "high",
        createdAt: new Date(now.getTime() - 5 * 60 * 1000),
      },
      {
        userId,
        type: "order_update",
        title: "Buyurtmangiz yetkazildi",
        message: "Buyurtmangiz muvaffaqiyatli yetkazib berildi. Xaridingizdan mamnunmisiz?",
        isRead: false,
        priority: "normal",
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
      {
        userId,
        type: "product_available",
        title: "Mahsulot mavjud",
        message: "Siz kutgan Organik tarvuz yana do'konda paydo bo'ldi!",
        isRead: false,
        priority: "normal",
        createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      },
      {
        userId,
        type: "promo",
        title: "Yangi promo-kod!",
        message: "CITY20 promo-kodidan foydalaning va 15 000 so'm chegirma oling.",
        isRead: true,
        priority: "normal",
        createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        userId,
        type: "system",
        title: "City Marketga xush kelibsiz!",
        message: "Ilovamizdan foydalanganingiz uchun rahmat. Yaxshi xaridlar!",
        isRead: true,
        priority: "low",
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const n of samples) {
      await this.db.insert(schema.notifications).values(n);
    }
  }
}

export const storage = new DbStorage();
