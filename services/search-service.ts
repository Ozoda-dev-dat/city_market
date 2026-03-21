import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, or, ilike, sql, gte, lte, inArray, isNull } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  rating?: number;
  sortBy?: 'name' | 'price' | 'rating' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  products: schema.Product[];
  total: number;
  categories: schema.Category[];
  suggestions: string[];
}

export class SearchService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async searchProducts(filters: SearchFilters): Promise<SearchResult> {
    try {
      const {
        query,
        category,
        minPrice,
        maxPrice,
        inStock,
        rating,
        sortBy = 'name',
        sortOrder = 'asc',
        limit = 20,
        offset = 0
      } = filters;

      // Build search conditions
      const conditions = [
        isNull(schema.products.deletedAt),
        eq(schema.products.isActive, true)
      ];

      // Text search
      if (query) {
        conditions.push(
          or(
            ilike(schema.products.name, `%${query}%`),
            ilike(schema.products.description, `%${query}%`),
            ilike(schema.products.brand, `%${query}%`)
          )
        );
      }

      // Category filter
      if (category) {
        conditions.push(eq(schema.products.category, category));
      }

      // Price range filter
      if (minPrice !== undefined) {
        conditions.push(gte(schema.products.price, minPrice));
      }
      if (maxPrice !== undefined) {
        conditions.push(lte(schema.products.price, maxPrice));
      }

      // Stock filter
      if (inStock !== undefined) {
        conditions.push(eq(schema.products.inStock, inStock));
      }

      // Rating filter
      if (rating !== undefined) {
        conditions.push(gte(schema.products.rating, rating.toString()));
      }

      // Execute search with sorting
      const orderBy = this.buildOrderBy(sortBy, sortOrder);
      
      const products = await this.db
        .select()
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count
      const totalResult = await this.db
        .select({ count: sql`count(*)` })
        .from(schema.products)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      // Get categories for filtering
      const categories = await this.db
        .select()
        .from(schema.categories)
        .where(and(
          eq(schema.categories.isActive, true),
          isNull(schema.categories.deletedAt)
        ));

      // Generate search suggestions
      const suggestions = await this.generateSuggestions(query);

      return {
        products,
        total,
        categories,
        suggestions
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): any[] {
    const column = this.getColumn(sortBy);
    return sortOrder === 'desc' ? [column.desc()] : [column.asc()];
  }

  private getColumn(sortBy: string): any {
    switch (sortBy) {
      case 'price':
        return schema.products.price;
      case 'rating':
        return schema.products.rating;
      case 'created_at':
        return schema.products.createdAt;
      default:
        return schema.products.name;
    }
  }

  private async generateSuggestions(query?: string): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      // Get product name suggestions
      const productSuggestions = await this.db
        .select({ name: schema.products.name })
        .from(schema.products)
        .where(and(
          ilike(schema.products.name, `${query}%`),
          isNull(schema.products.deletedAt),
          eq(schema.products.isActive, true)
        ))
        .limit(5);

      // Get category suggestions
      const categorySuggestions = await this.db
        .select({ name: schema.categories.name })
        .from(schema.categories)
        .where(and(
          ilike(schema.categories.name, `${query}%`),
          eq(schema.categories.isActive, true),
          isNull(schema.categories.deletedAt)
        ))
        .limit(3);

      return [
        ...productSuggestions.map(p => p.name),
        ...categorySuggestions.map(c => c.name)
      ];
    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      return [];
    }
  }

  async getPopularSearches(limit = 10): Promise<string[]> {
    try {
      // This would typically be based on search analytics
      // For now, return popular product names
      const popularProducts = await this.db
        .select({ name: schema.products.name })
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(sql`RANDOM()`)
        .limit(limit);

      return popularProducts.map(p => p.name);
    } catch (error) {
      console.error('Failed to get popular searches:', error);
      return [];
    }
  }

  async getTrendingProducts(limit = 10): Promise<schema.Product[]> {
    try {
      // Get products with high ratings and recent activity
      const trendingProducts = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt),
          gte(schema.products.rating, '4.0'),
          eq(schema.products.inStock, true)
        ))
        .orderBy([
          schema.products.rating.desc(),
          schema.products.createdAt.desc()
        ])
        .limit(limit);

      return trendingProducts;
    } catch (error) {
      console.error('Failed to get trending products:', error);
      return [];
    }
  }

  async getSimilarProducts(productId: string, limit = 5): Promise<schema.Product[]> {
    try {
      // Get the current product
      const currentProduct = await this.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, productId))
        .limit(1);

      if (!currentProduct[0]) return [];

      // Find similar products based on category and price range
      const priceRange = currentProduct[0].price * 0.3; // 30% price variance

      const similarProducts = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.category, currentProduct[0].category),
          gte(schema.products.price, currentProduct[0].price - priceRange),
          lte(schema.products.price, currentProduct[0].price + priceRange),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt),
          sql`${schema.products.id} != ${productId}`
        ))
        .orderBy([
          schema.products.rating.desc(),
          schema.products.price.asc()
        ])
        .limit(limit);

      return similarProducts;
    } catch (error) {
      console.error('Failed to get similar products:', error);
      return [];
    }
  }

  async getProductsByCategory(categoryId: string, filters: Partial<SearchFilters> = {}): Promise<SearchResult> {
    return this.searchProducts({
      ...filters,
      category: categoryId
    });
  }

  async getDealsAndOffers(limit = 10): Promise<schema.Product[]> {
    try {
      // Get products with discounts (originalPrice > price)
      const deals = await this.db
        .select()
        .from(schema.products)
        .where(and(
          sql`${schema.products.originalPrice} > ${schema.products.price}`,
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt),
          eq(schema.products.inStock, true)
        ))
        .orderBy([
          sql`((${schema.products.originalPrice} - ${schema.products.price}) / ${schema.products.originalPrice}) DESC`,
          schema.products.price.asc()
        ])
        .limit(limit);

      return deals;
    } catch (error) {
      console.error('Failed to get deals and offers:', error);
      return [];
    }
  }

  async advancedSearch(searchParams: {
    query?: string;
    categories?: string[];
    priceRange?: { min: number; max: number };
    rating?: number;
    inStock?: boolean;
    hasDiscount?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<SearchResult> {
    try {
      const conditions = [
        isNull(schema.products.deletedAt),
        eq(schema.products.isActive, true)
      ];

      // Text search
      if (searchParams.query) {
        conditions.push(
          or(
            ilike(schema.products.name, `%${searchParams.query}%`),
            ilike(schema.products.description, `%${searchParams.query}%`),
            ilike(schema.products.brand, `%${searchParams.query}`)
          )
        );
      }

      // Multiple categories
      if (searchParams.categories && searchParams.categories.length > 0) {
        conditions.push(inArray(schema.products.category, searchParams.categories));
      }

      // Price range
      if (searchParams.priceRange) {
        conditions.push(
          and(
            gte(schema.products.price, searchParams.priceRange.min),
            lte(schema.products.price, searchParams.priceRange.max)
          )
        );
      }

      // Rating
      if (searchParams.rating) {
        conditions.push(gte(schema.products.rating, searchParams.rating.toString()));
      }

      // Stock filter
      if (searchParams.inStock !== undefined) {
        conditions.push(eq(schema.products.inStock, searchParams.inStock));
      }

      // Discount filter
      if (searchParams.hasDiscount) {
        conditions.push(sql`${schema.products.originalPrice} > ${schema.products.price}`);
      }

      const orderBy = this.buildOrderBy(
        searchParams.sortBy || 'name',
        searchParams.sortOrder || 'asc'
      );

      const products = await this.db
        .select()
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(...orderBy)
        .limit(searchParams.limit || 20)
        .offset(searchParams.offset || 0);

      const totalResult = await this.db
        .select({ count: sql`count(*)` })
        .from(schema.products)
        .where(and(...conditions));

      const total = Number(totalResult[0]?.count || 0);

      const categories = await this.db
        .select()
        .from(schema.categories)
        .where(and(
          eq(schema.categories.isActive, true),
          isNull(schema.categories.deletedAt)
        ));

      return {
        products,
        total,
        categories,
        suggestions: await this.generateSuggestions(searchParams.query)
      };
    } catch (error) {
      console.error('Advanced search failed:', error);
      throw error;
    }
  }

  async logSearch(userId: string, query: string, resultCount: number): Promise<void> {
    try {
      // Log search for analytics (optional)
      await this.db.insert(schema.auditLogs).values({
        tableName: 'search_analytics',
        recordId: userId,
        action: 'SEARCH',
        newValues: { query, resultCount },
        userId,
        createdAt: new Date()
      });
    } catch (error) {
      // Don't throw error for search logging
      console.error('Failed to log search:', error);
    }
  }
}

export const searchService = new SearchService();
