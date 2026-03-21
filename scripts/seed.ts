import { storage } from "../server/storage";
import * as data from "../constants/data";

async function seed() {
  console.log("Seeding database...");

  const CATEGORIES = (data as any).CATEGORIES || [];
  const PRODUCTS = (data as any).PRODUCTS || [];
  const ORDERS_DATA = (data as any).ORDERS_DATA || [];

  console.log(`Found ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${ORDERS_DATA.length} orders`);

  // Seed Categories
  for (const cat of CATEGORIES) {
    try {
      await storage.createCategory({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        bgColor: cat.bgColor || cat.color + "20",
      });
    } catch (e) {
      console.error(`Error seeding category ${cat.id}:`, e);
    }
  }

  // Seed Products
  for (const prod of PRODUCTS) {
    try {
      await storage.createProduct({
        id: prod.id,
        name: prod.name,
        category: prod.category,
        price: prod.price,
        originalPrice: prod.originalPrice,
        unit: prod.unit,
        image: prod.image,
        badge: prod.badge,
        rating: String(prod.rating),
        description: prod.description,
        brand: prod.brand,
        weight: prod.weight,
        inStock: prod.inStock,
      });
    } catch (e) {
      console.error(`Error seeding product ${prod.id}:`, e);
    }
  }

  // Seed Orders
  for (const order of ORDERS_DATA) {
    try {
      await storage.createOrder({
        id: order.id,
        customerName: order.customer,
        phoneNumber: order.phone,
        address: order.address,
        total: order.total,
        status: order.status,
        items: order.items,
      });
    } catch (e) {
      console.error(`Error seeding order ${order.id}:`, e);
    }
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
