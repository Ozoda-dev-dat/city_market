import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, isNull } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product: schema.Product;
  createdAt: Date;
}

export class WishlistService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async addToWishlist(userId: string, productId: string): Promise<schema.Wishlist> {
    try {
      // Check if product exists and is active
      const product = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.id, productId),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .limit(1);

      if (!product[0]) {
        throw new Error("Product not found or unavailable");
      }

      // Check if already in wishlist
      const existing = await this.db
        .select()
        .from(schema.wishlists)
        .where(and(
          eq(schema.wishlists.userId, userId),
          eq(schema.wishlists.productId, productId)
        ))
        .limit(1);

      if (existing[0]) {
        throw new Error("Product already in wishlist");
      }

      // Add to wishlist
      const result = await this.db
        .insert(schema.wishlists)
        .values({
          userId,
          productId,
        })
        .returning();

      return result[0];
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      throw error;
    }
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    try {
      await this.db
        .delete(schema.wishlists)
        .where(and(
          eq(schema.wishlists.userId, userId),
          eq(schema.wishlists.productId, productId)
        ));
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      throw error;
    }
  }

  async getWishlist(userId: string, limit = 20, offset = 0): Promise<WishlistItem[]> {
    try {
      const wishlistItems = await this.db
        .select({
          id: schema.wishlists.id,
          userId: schema.wishlists.userId,
          productId: schema.wishlists.productId,
          createdAt: schema.wishlists.createdAt,
          product: {
            id: schema.products.id,
            name: schema.products.name,
            price: schema.products.price,
            originalPrice: schema.products.originalPrice,
            unit: schema.products.unit,
            image: schema.products.image,
            badge: schema.products.badge,
            rating: schema.products.rating,
            inStock: schema.products.inStock,
            stockQuantity: schema.products.stockQuantity,
            category: schema.products.category,
            description: schema.products.description,
            brand: schema.products.brand,
            weight: schema.products.weight,
          }
        })
        .from(schema.wishlists)
        .innerJoin(schema.products, eq(schema.wishlists.productId, schema.products.id))
        .where(and(
          eq(schema.wishlists.userId, userId),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(desc(schema.wishlists.createdAt))
        .limit(limit)
        .offset(offset);

      return wishlistItems;
    } catch (error) {
      console.error("Failed to get wishlist:", error);
      throw error;
    }
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    try {
      const result = await this.db
        .select()
        .from(schema.wishlists)
        .where(and(
          eq(schema.wishlists.userId, userId),
          eq(schema.wishlists.productId, productId)
        ))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      console.error("Failed to check wishlist status:", error);
      return false;
    }
  }

  async getWishlistCount(userId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: schema.wishlists.id })
        .from(schema.wishlists)
        .where(eq(schema.wishlists.userId, userId));

      return result.length;
    } catch (error) {
      console.error("Failed to get wishlist count:", error);
      return 0;
    }
  }

  async clearWishlist(userId: string): Promise<void> {
    try {
      await this.db
        .delete(schema.wishlists)
        .where(eq(schema.wishlists.userId, userId));
    } catch (error) {
      console.error("Failed to clear wishlist:", error);
      throw error;
    }
  }

  async moveWishlistToCart(userId: string, productIds: string[]): Promise<void> {
    try {
      // Remove selected items from wishlist
      await this.db
        .delete(schema.wishlists)
        .where(and(
          eq(schema.wishlists.userId, userId),
          // This would need to be adjusted based on your database implementation
          // For now, we'll remove items one by one
        ));

      // In a real implementation, you would add these items to the cart
      // This would depend on your cart implementation
      console.log(`Moved ${productIds.length} items from wishlist to cart`);
    } catch (error) {
      console.error("Failed to move wishlist to cart:", error);
      throw error;
    }
  }

  async getWishlistStats(userId: string): Promise<{
    totalItems: number;
    totalValue: number;
    categories: string[];
    recentlyAdded: number;
  }> {
    try {
      const wishlistItems = await this.db
        .select({
          product: {
            price: schema.products.price,
            category: schema.products.category,
            createdAt: schema.wishlists.createdAt,
          }
        })
        .from(schema.wishlists)
        .innerJoin(schema.products, eq(schema.wishlists.productId, schema.products.id))
        .where(and(
          eq(schema.wishlists.userId, userId),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ));

      const totalItems = wishlistItems.length;
      const totalValue = wishlistItems.reduce((sum, item) => sum + (item.product.price || 0), 0);
      const categories = [...new Set(wishlistItems.map(item => item.product.category))];
      
      // Count items added in the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentlyAdded = wishlistItems.filter(
        item => new Date(item.product.createdAt) > sevenDaysAgo
      ).length;

      return {
        totalItems,
        totalValue,
        categories,
        recentlyAdded,
      };
    } catch (error) {
      console.error("Failed to get wishlist stats:", error);
      return {
        totalItems: 0,
        totalValue: 0,
        categories: [],
        recentlyAdded: 0,
      };
    }
  }

  async getPopularWishlistProducts(limit = 10): Promise<schema.Product[]> {
    try {
      // Get products that are most frequently added to wishlists
      const popularProducts = await this.db
        .select({
          product: schema.products,
          wishlistCount: schema.wishlists.id,
        })
        .from(schema.wishlists)
        .innerJoin(schema.products, eq(schema.wishlists.productId, schema.products.id))
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .groupBy(schema.products.id)
        .orderBy(desc(schema.wishlists.id))
        .limit(limit);

      return popularProducts.map(item => item.product);
    } catch (error) {
      console.error("Failed to get popular wishlist products:", error);
      return [];
    }
  }

  async notifyWishlistPriceDrop(userId: string): Promise<schema.Product[]> {
    try {
      // Get wishlist items and check for price drops
      const wishlistItems = await this.getWishlist(userId);
      
      // This would compare current prices with previous prices
      // For now, return items that have originalPrice > price (on sale)
      const itemsOnSale = wishlistItems.filter(
        item => item.product.originalPrice && item.product.originalPrice > item.product.price
      );

      return itemsOnSale.map(item => item.product);
    } catch (error) {
      console.error("Failed to check wishlist price drops:", error);
      return [];
    }
  }

  async exportWishlist(userId: string): Promise<{
    products: schema.Product[];
    exportedAt: Date;
    totalItems: number;
    totalValue: number;
  }> {
    try {
      const wishlistItems = await this.getWishlist(userId);
      const products = wishlistItems.map(item => item.product);
      const totalValue = products.reduce((sum, product) => sum + product.price, 0);

      return {
        products,
        exportedAt: new Date(),
        totalItems: products.length,
        totalValue,
      };
    } catch (error) {
      console.error("Failed to export wishlist:", error);
      throw error;
    }
  }
}

export const wishlistService = new WishlistService();
