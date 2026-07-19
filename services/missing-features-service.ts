import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, count } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { offlineService } from "./offline-service";
import { performanceService } from "./performance-service";
import { monitoringService } from "../server/monitoring-service";

export interface RecommendationEngine {
  generateRecommendations(userId: string): Promise<Recommendation[]>;
  trackUserBehavior(userId: string, action: string, context?: any): Promise<void>;
  analyzePurchaseHistory(userId: string): Promise<PurchaseAnalysis>;
  analyzeBrowsingHistory(userId: string): Promise<BrowsingAnalysis>;
  getPersonalizedContent(userId: string): Promise<PersonalizedContent>;
}

export interface Recommendation {
  id: string;
  type: 'product' | 'category' | 'order' | 'promo_code' | 'review';
  title: string;
  description: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  score: number;
  metadata?: any;
}

export interface PurchaseAnalysis {
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategories: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
  purchaseFrequency: string;
  lastPurchaseDate: Date;
  preferredPriceRange: {
    min: number;
    max: number;
  };
  seasonalTrends: Array<{
    month: string;
    amount: number;
    category: string;
  }>;
}

export interface BrowsingAnalysis {
  mostViewedCategories: Array<{
    category: string;
    viewCount: number;
    lastViewed: Date;
  }>;
  timeSpent: number;
  timeSpentByCategory: Record<string, number>;
  searchQueries: Array<{
      query: string;
      count: number;
      success: boolean;
      timestamp: Date;
    }>;
  popularSearchTerms: Array<{
      term: string;
      count: number;
      success: boolean;
    }>;
  sessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
}

export interface PersonalizedContent {
  recommendedProducts: Array<{
    product: schema.Product;
    score: number;
    reason: string;
  }>;
  recommendedCategories: Array<{
    category: schema.Category;
    score: number;
    reason: string;
  }>;
  personalizedOffers: Array<{
    title: string;
    discount: number;
    expiresAt: Date;
    applicable: boolean;
  }>;
  recentActivity: Array<{
    type: 'order' | 'review' | 'wishlist' | 'search';
    timestamp: Date;
    details: any;
  }>;
}

export class MissingFeaturesService {
  private db: ReturnType<typeof drizzle>;
  private recommendationEngine: RecommendationEngine;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
    this.recommendationEngine = new RecommendationEngine();
  }

  // Recommendation Engine
  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      const user = await this.getUserData(userId);
      
      const recommendations: Recommendation[] = [];

      // Product Recommendations
      const productRecommendations = await this.getProductRecommendations(user);
      recommendations.push(...productRecommendations);

      // Category Recommendations
      const categoryRecommendations = await this.getCategoryRecommendations(user);
      recommendations.push(...categoryRecommendations);

      // Order-based Recommendations
      orderRecommendations = await this.getOrderBasedRecommendations(user);
      recommendations.push(...orderRecommendations);

      // Personalized Content
      const personalizedContent = await this.getPersonalizedContent(user);
      recommendations.push(...personalContent.recommendedProducts);

      // Sort by score
      recommendations.sort((a, b) => b.score - a.score);

      return recommendations.slice(0, 20); // Top 20 recommendations
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      return [];
    }
  }

  private async getProductRecommendations(user: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Get user's purchase history
      const purchaseAnalysis = await this.analyzePurchaseHistory(user.id);

      // Get user's favorite categories
      const favoriteCategories = purchaseAnalysis.favoriteCategories;

      // Get user's browsing history
      const browsingAnalysis = await this.analyzeBrowsingHistory(user.id);

      // Get popular products
      const popularProducts = await this.getPopularProducts();

      // Generate product recommendations
      for (const product of popularProducts) {
        let score = 0;

        // Category preference boost
        const categoryMatch = favoriteCategories.find(c => c.category === product.categoryId);
        if (categoryMatch) {
          score += categoryMatch.count * 10;
        }

        // Price preference match
        if (purchaseAnalysis.preferredPriceRange.min <= product.price && product.price <= purchaseAnalysis.preferredPriceRange.max) {
          score += 15;
        }

        // Rating preference
        if (product.rating && product.rating >= 4.0) {
          score += product.rating * 5;
        }

        // Trending products
        const isTrending = await this.isTrendingProduct(product.id);
        if (isTrending) {
          score += 10;
        }

        // Stock availability
        if (product.inStock) {
          score += 5;
        }

        recommendations.push({
          id: product.id,
          type: 'product',
          title: product.name,
          description: this.getRecommendationReason(
            'product',
            {
              category: favoriteCategories.find(c => c.category === product.categoryId)?.category || 'General',
              price: purchaseAnalysis.preferredPriceRange,
              rating: product.rating,
              isTrending: await this.isTrendingProduct(product.id)
            }
          ),
          priority: this.getRecommendationPriority('product', score),
          score,
          metadata: {
            category: product.categoryId,
            price: product.price,
            rating: product.rating,
            inStock: product.inStock,
            isTrending: await this.isTrendingProduct(product.id)
          }
        });
      }
    } catch (error) {
      console.error('Failed to get product recommendations:', error);
      return [];
    }
  }

  private async getCategoryRecommendations(user: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Get user's favorite categories
      const purchaseAnalysis = await this.analyzePurchaseHistory(user.id);
      const favoriteCategories = purchaseAnalysis.favoriteCategories;

      // Get all active categories
      const categories = await this.db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.isActive, true))
        .orderBy(asc(schema.categories.name));

      // Generate category recommendations
      for (const category of categories) {
        let score = 0;

        // Category preference boost
        const categoryMatch = favoriteCategories.find(c => c.category === category.id);
        if (categoryMatch) {
          score += categoryMatch.count * 15;
        }

        // Category popularity
        const categoryPopularity = await this.getCategoryPopularity(category.id);
        score += categoryPopularity * 5;

        recommendations.push({
          id: category.id,
          type: 'category',
          title: category.name,
          description: this.getRecommendationReason('category', {
            category: category.name,
            popularity: categoryPopularity,
            userPreference: categoryMatch?.category || 'general'
          }),
          priority: this.getRecommendationPriority('category', score),
          score,
          metadata: {
            productCount: await this.getProductCountInCategory(category.id),
            popularity: categoryPopularity,
            userPreference: categoryMatch?.category || 'general'
          }
        });
      }
    } catch (error) {
      console.error('Failed to get category recommendations:', error);
      return [];
    }
  }

  private async getOrderBasedRecommendations(user: any): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    try {
      // Get user's order history
      const orders = await this.db
        .select({
          order: schema.orders,
          customer: {
            id: schema.users.id,
            name: schema.users.name,
            phoneNumber: schema.users.phoneNumber,
          }
        })
        .where(and(
          eq(schema.orders.customerId, user.id),
          isNull(schema.orders.deletedAt)
        ))
        .orderBy(desc(schema.orders.createdAt))
        .limit(10);

      // Generate order-based recommendations
      for (const order of orders) {
        let score = 0;

        // Order value preference
        if (order.order.total > 100000) {
          score += 20;
        }

        // Order frequency
        const orderCount = await this.getOrderCount(user.id);
        if (orderCount > 5) {
          score += 10;
        }

        // Recent orders get higher scores
        const daysSinceOrder = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceOrder < 7) {
          score += 15;
        }

        recommendations.push({
          id: order.id,
          type: 'order',
          title: `Order #${order.id}`,
          description: this.getRecommendationReason('order', {
            total: order.total,
            orderCount,
            daysSinceOrder,
            customer: order.customer.name
          }),
          priority: this.getRecommendationPriority('order', score),
          score,
          metadata: {
            orderTotal: order.total,
            orderCount: orderCount,
            customerName: order.customer.name,
            daysSinceOrder
          }
        });
      }
    } catch (error) {
      console.error('Failed to get order-based recommendations:', error);
      return [];
    }
  }

  private async getPersonalizedContent(user: any): Promise<PersonalizedContent> {
    const personalizedContent: PersonalizedContent = {
      recommendedProducts: [],
      recommendedCategories: [],
      personalizedOffers: [],
      recentActivity: []
    };

    try {
      // Get user's recent activity
      const recentActivity = await this.getRecentActivity(user.id);
      personalizedContent.recentActivity = recentActivity;

      // Get user's favorite categories and products
      const purchaseAnalysis = await this.analyzePurchaseHistory(user.id);
      
      // Get personalized product recommendations
      const productRecommendations = await this.getProductRecommendations(user);
      personalizedContent.recommendedProducts = productRecommendations;

      // Get personalized category recommendations
      const categoryRecommendations = await this.getCategoryRecommendations(user);
      personalizedContent.recommendedCategories = categoryRecommendations;

      // Generate personalized offers based on user behavior
      const personalizedOffers = await this.generatePersonalizedOffers(user, purchaseAnalysis);
      personalizedContent.personalizedOffers = personalizedOffers;

      return personalizedContent;
    } catch (error) {
      console.error('Failed to get personalized content:', error);
      return personalizedContent;
    }
  }

  private async generatePersonalizedOffers(user: any, purchaseAnalysis: PurchaseAnalysis): Promise<Array<{
    title: string;
    discount: number;
    expiresAt: Date;
    applicable: boolean;
  }>> {
    const offers = [];
    
    try {
      // Generate offers based on user behavior
      if (purchaseAnalysis.averageOrderValue > 50000) {
        offers.push({
          title: 'High-value customer discount',
          discount: 15,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          applicable: true
        });
      }

      if (purchaseAnalysis.averageOrderValue > 20000 && purchaseAnalysis.purchaseFrequency > 1) {
        offers.push({
          title: 'Loyal customer discount',
          discount: 10,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          applicable: true
        });
      }

      if (purchaseAnalysis.favoriteCategories.length > 0) {
        const topCategory = purchaseAnalysis.favoriteCategories[0];
        offers.push({
          title: `${topCategory.name} special offer`,
          discount: 12,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          applicable: true
        });
      }

      return offers;
    } catch (error) {
      console.error('Failed to generate personalized offers:', error);
      return [];
    }
  }

  private getRecommendationReason(type: string, context: any): string {
    switch (type) {
      case 'product':
        if (context.isTrending) {
          return 'Trending in your area';
        }
        if (context.category && context.category !== 'General') {
          return `Based on your interest in ${context.category}`;
        }
        if (context.price && context.price < context.preferredPriceRange.max) {
          return 'Great price for this product';
        }
        return 'Recommended based on your preferences';
      
      case 'category':
        if (context.popularity > 50) {
          return 'Popular category selection';
        }
        return 'Based on your shopping history';
      
      case 'order':
        if (context.daysSinceOrder < 7) {
          return 'Your recent order';
        }
        if (context.orderCount > 5) {
          return 'Frequent shopper discount';
        }
        return 'Based on your order history';
      
      default:
        return 'Recommended for you';
    }
  }

  private getRecommendationPriority(type: string, score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private async getUserData(userId: string): Promise<any> {
    try {
      const user = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!user[0]) {
        return null;
      }

      // Get user's order history
      const orders = await this.db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.customerId, userId))
        .orderBy(desc(schema.orders.createdAt))
        .limit(10);

      // Get user's reviews
      const reviews = await this.db
        .select()
        .from(schema.productReviews)
        .where(eq(schema.productReviews.userId, userId))
        .orderBy(desc(schema.productReviews.createdAt))
        .limit(10);

      // Get user's payment history
      const payments = await this.db
        .select()
        .from(schema.paymentTransactions)
        .where(eq(schema.paymentTransactions.userId, userId))
        .orderBy(desc(schema.paymentTransactions.createdAt))
        .limit(10);

      return {
        user: user[0],
        orders,
        reviews,
        payments,
        totalSpent: payments.reduce((sum, p) => p.total, 0),
        orderCount: orders.length,
        lastOrderDate: orders[0]?.createdAt || new Date()
      };
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  private async getPopularProducts(limit = 20): Promise<schema.Product[]> {
    try {
      return await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(desc(schema.products.rating))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get popular products:', error);
      return [];
    }
  }

  private async getCategoryPopularity(categoryId: string): Promise<number> {
    try {
      const productCount = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.products)
        .where(and(
          eq(schema.products.category, categoryId),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ));

      return Number(productCount[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get category popularity:', error);
      return 0;
    }
  }

  private async getProductCountInCategory(categoryId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.products)
        .where(and(
          eq(schema.products.category, categoryId),
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get product count in category:', error);
      return 0;
    }
  }

  private async isTrendingProduct(productId: string): Promise<boolean> {
    try {
      // In production, this would check if product has high view count or sales velocity
      const viewCount = Math.floor(Math.random() * 1000) + 500; // Mock data
      const salesVelocity = Math.floor(Math.random() * 10) + 1; // Mock data
      
      return viewCount > 800 || salesVelocity > 5;
    } catch (error) {
      console.error('Failed to check if product is trending:', error);
      return false;
    }
  }

  private async getRecentActivity(userId: string): Promise<Array<{
    type: 'order' | 'review' | 'wishlist' | 'search';
    timestamp: Date;
    details: any;
  }>> {
    try {
      const activities = [];
      
      // Get recent orders
      const orders = await this.db
        .select()
        .from(schema.orders)
        .where(and(
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt)
        ))
        .orderBy(desc(schema.orders.createdAt))
        .limit(10);

      for (const order of orders) {
          activities.push({
            type: 'order',
            timestamp: order.createdAt,
            details: {
              orderId: order.id,
              total: order.total,
              customerName: order.customerName,
              status: order.status
            }
          });
        }

      // Get recent reviews
      const reviews = await this.db
        .select()
        .from(schema.productReviews)
        .where(and(
          eq(schema.productReviews.userId, userId),
          isNull(schema.productReviews.deletedAt)
        ))
        .orderBy(desc(schema.productReviews.createdAt))
        .limit(10);

      for (const review of reviews) {
          activities.push({
            type: 'review',
            timestamp: review.createdAt,
            details: {
              reviewId: review.id,
              productId: review.productId,
              rating: review.rating,
              title: review.title,
              customerName: review.customerName
            }
          });
        }

      // Get recent searches
      const searches = await this.db
        .select()
        .from(schema.systemLogs)
        .where(and(
          eq(schema.systemLogs.userId, userId),
          eq(schema.systemLogs.module, 'search'),
          isNull(schema.systemLogs.deletedAt)
        ))
        .orderBy(desc(schema.systemLogs.createdAt))
        .limit(10);

      for (const search of searches) {
          activities.push({
            type: 'search',
            timestamp: search.createdAt,
            details: {
              query: search.message,
              success: search.level === 'info',
              module: 'search'
            }
          });
        }

      return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      return [];
    }
  }

  private async getOrderCount(userId: string): Promise<number> {
    try {
      const result = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.orders)
        .where(and(
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt)
        ));

      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Failed to get order count:', error);
      return 0;
    }
  }
}

export class RecommendationEngine {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async generateRecommendations(userId: string): Promise<Recommendation[]> {
    // This would use machine learning algorithms
    // For now, we'll use simple heuristics
    return [];
  }

  async trackUserBehavior(userId: string, action: string, context?: any): Promise<void> {
    // Track user behavior for recommendations
    // In production, this would store the data for ML training
    console.log(`User ${userId} performed ${action}:`, context);
  }

  async analyzePurchaseHistory(userId: string): Promise<PurchaseAnalysis> {
    // Analyze user's purchase patterns
    const orders = await this.db
      .select()
      .from(schema.orders)
      .where(and(
        eq(schema.orders.customerId, userId),
        isNull(schema.orders.deletedAt)
      ))
      .orderBy(desc(schema.orders.createdAt));

    const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = totalSpent / orders.length;
    
    const favoriteCategories = await this.getFavoriteCategories(userId);
    
    const purchaseFrequency = orders.length > 0 
      ? Math.floor((Date.now() - orders[0].createdAt.getTime()) / (1000 * 60 * 60 * 24)) / orders.length
      : 0;

    return {
      totalSpent,
      averageOrderValue,
      favoriteCategories,
      purchaseFrequency,
      lastPurchaseDate: orders[0]?.createdAt || new Date(),
      preferredPriceRange: {
        min: Math.min(...orders.map(o => o.total) || 0),
        max: Math.max(...orders.map(o => o.total) || 0)
      },
      seasonalTrends: await this.getSeasonalTrends(userId),
    };
  }

  async analyzeBrowsingHistory(userId: string): Promise<BrowsingAnalysis> {
    const logs = await this.db
      .select()
      .from(schema.systemLogs)
      .where(and(
        eq(schema.systemLogs.userId, userId),
        eq(schema.systemLogs.module, 'search'),
        isNull(schema.systemLogs.deletedAt)
      ))
      .orderBy(desc(schema.systemLogs.createdAt))
      .limit(100);

    const searchQueries = logs
      .filter(log => log.message.includes('search'))
      .map(log => ({
        query: log.message,
        count: logs.message.match(/\bsearch:\s*(\w+)/g)[1] || 'unknown',
        success: log.level === 'info',
        timestamp: log.createdAt
      }));

    const mostViewedCategories = await this.getMostViewedCategories(userId);
    const sessionDurations = logs
      .filter(log => log.message.includes('session'))
      .map(log => ({
        duration: parseInt(log.message.match(/\bsession:\s*(\w+)/g)[1] || '0'),
        timestamp: log.createdAt
      }));

    const totalSessionTime = sessionDurations.reduce((sum, duration) => sum + duration, 0);

    return {
      mostViewedCategories,
      searchQueries,
      popularSearchTerms: searchQueries
        .filter((item, index, arr) => arr.findIndex(i => i === index))
        .map(item => item.query)
        .reduce((acc, item) => acc + 1, {})
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      sessionDuration: totalSessionTime / (sessionDurations.length || 1),
      bounceRate: (sessionDurations.filter(d => d.duration > 30000).length / sessionDurations.length) * 100,
      pagesPerSession: Math.floor(totalSessionTime / (sessionDurations.length || 1)),
      timeSpentByCategory: Object.entries(
        sessionDurations.reduce((acc, d) => {
          const [category, duration] = d;
          acc[category] = (acc[category] || 0) + duration;
          return acc;
        }, {})
      ),
    };
  }

  async getPersonalizedContent(userId: string): Promise<PersonalizedContent> {
    // This would use ML to generate personalized content
    return {
      recommendedProducts: [],
      recommendedCategories: [],
      personalizedOffers: [],
      recentActivity: [],
    };
  }

  private async getFavoriteCategories(userId: string): Promise<Array<{
    category: string;
    count: number;
    amount: number;
  }>> {
    try {
      const orders = await this.db
        .select({
          order: schema.orders,
          customer: schema.users.name,
          total: schema.orders.total,
          createdAt: schema.orders.createdAt,
        })
        .where(and(
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt)
        ))
        .orderBy(desc(schema.orders.createdAt));

      const categoryCounts = orders.reduce((acc, order) => {
        const category = order.items?.[0]?.category || 'uncategorized';
        if (category) {
          acc[category] = (acc[category] || 0) + 1;
        }
        return acc;
      }, {});

      return Object.entries(categoryCounts)
        .map(([category, count]) => ({ category, count, amount }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to get favorite categories:', error);
      return [];
    }
  }

  private async getSeasonalTrends(userId: string): Promise<Array<{
    month: string;
    amount: number;
    category: string;
  }>> {
    try {
      const orders = await this.db
        .select({
          order: schema.orders,
          customer: schema.users.name,
          total: schema.orders.total,
          createdAt: schema.orders.createdAt,
        })
        .where(and(
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt),
          gte(schema.orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        ))
        .orderBy(desc(schema.orders.createdAt));

      const monthlyData = orders.reduce((acc, order) => {
        const month = order.createdAt.toISOString().substring(0, 7); // YYYY-MM
        const amount = order.total;
        const category = order.items?.[0]?.category || 'uncategorized';
        acc[month] = (acc[month] || 0) + amount;
        return acc;
      }, {});

      return Object.entries(monthlyData)
        .map(([month, data]) => ({
          month,
          amount: data.amount,
          category: data.category,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(0, 12); // Last 12 months
    } catch (error) {
      console.error('Failed to get seasonal trends:', error);
      return [];
    }
  }

  private async getMostViewedCategories(userId: string): Promise<Array<{
    category: string;
    viewCount: number;
    lastViewed: Date;
    timeSpent: number;
  }>> {
    try {
      const logs = await this.db
        .select({
          order: schema.orders,
          customer: schema.users.name,
          total: schema.orders.total,
          createdAt: schema.orders.createdAt,
        })
        .where(and(
          eq(schema.orders.customerId, userId),
          isNull(schema.orders.deletedAt)
        ))
        .orderBy(desc(schema.orders.createdAt))
        .limit(50);

      const categoryViews = logs
        .filter(log => log.message.includes('view') && log.message.includes('category'))
        .map(log => ({
          category: log.message.match(/category:\s*(\w+)/g)[1] || 'unknown',
          count: logs.message.match(/\bview:\s*(\w+)/g)[1] || 'unknown',
          timestamp: log.createdAt
        }))
        .reduce((acc, log) => {
          const category = log.message.match(/category:\s*(\w+)/g)[1] || 'unknown';
          acc[category] = (acc[category] || 'unknown') + 1;
          return acc;
        }, {})
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, 10)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return categoryViews;
    } catch (error) {
      console.error('Failed to get most viewed categories:', error);
      return [];
    }
  }

  private async getPopularProducts(limit = 20): Promise<schema.Product[]> {
    try {
      return await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(desc(schema.products.rating))
        .limit(limit);
    } catch (error) {
      console.error('Failed to get popular products:', error);
      return [];
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
