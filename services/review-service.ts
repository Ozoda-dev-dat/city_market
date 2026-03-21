import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface ReviewWithDetails extends schema.ProductReview {
  user: {
    id: string;
    name: string;
  };
  product: {
    id: string;
    name: string;
    image: string;
  };
  helpfulCount: number;
  userHasHelpful?: boolean;
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  verifiedReviews: number;
  recentReviews: number;
}

export interface ReviewSummary {
  productId: string;
  stats: ReviewStats;
  topReviews: ReviewWithDetails[];
}

export class ReviewService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async createReview(reviewData: {
    productId: string;
    userId: string;
    rating: number;
    title?: string;
    comment?: string;
  }): Promise<schema.ProductReview> {
    try {
      // Validate rating
      if (reviewData.rating < 1 || reviewData.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Check if user has already reviewed this product
      const existingReview = await this.db
        .select()
        .from(schema.productReviews)
        .where(and(
          eq(schema.productReviews.productId, reviewData.productId),
          eq(schema.productReviews.userId, reviewData.userId)
        ))
        .limit(1);

      if (existingReview[0]) {
        throw new Error("You have already reviewed this product");
      }

      // Verify product exists
      const product = await this.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, reviewData.productId))
        .limit(1);

      if (!product[0]) {
        throw new Error("Product not found");
      }

      // Create review
      const result = await this.db
        .insert(schema.productReviews)
        .values({
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
          productId: reviewData.productId,
          userId: reviewData.userId,
          isVerified: false, // Could be verified based on purchase history
        })
        .returning();

      // Update product rating
      await this.updateProductRating(reviewData.productId);

      return result[0];
    } catch (error) {
      console.error("Failed to create review:", error);
      throw error;
    }
  }

  async updateReview(
    reviewId: string,
    userId: string,
    updateData: {
      rating?: number;
      title?: string;
      comment?: string;
    }
  ): Promise<schema.ProductReview> {
    try {
      // Verify review belongs to user
      const existingReview = await this.db
        .select()
        .from(schema.productReviews)
        .where(and(
          eq(schema.productReviews.id, reviewId),
          eq(schema.productReviews.userId, userId)
        ))
        .limit(1);

      if (!existingReview[0]) {
        throw new Error("Review not found or access denied");
      }

      // Update review
      const result = await this.db
        .update(schema.productReviews)
        .set({
          ...updateData,
          updatedAt: new Date()
        })
        .where(eq(schema.productReviews.id, reviewId))
        .returning();

      // Update product rating
      await this.updateProductRating(existingReview[0].productId);

      return result[0];
    } catch (error) {
      console.error("Failed to update review:", error);
      throw error;
    }
  }

  async deleteReview(reviewId: string, userId: string): Promise<void> {
    try {
      // Get review before deletion
      const review = await this.db
        .select()
        .from(schema.productReviews)
        .where(and(
          eq(schema.productReviews.id, reviewId),
          eq(schema.productReviews.userId, userId)
        ))
        .limit(1);

      if (!review[0]) {
        throw new Error("Review not found or access denied");
      }

      // Delete review
      await this.db
        .delete(schema.productReviews)
        .where(eq(schema.productReviews.id, reviewId));

      // Update product rating
      await this.updateProductRating(review[0].productId);
    } catch (error) {
      console.error("Failed to delete review:", error);
      throw error;
    }
  }

  async getProductReviews(
    productId: string,
    limit = 10,
    offset = 0,
    sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful' = 'newest'
  ): Promise<ReviewWithDetails[]> {
    try {
      let orderBy;

      switch (sortBy) {
        case 'oldest':
          orderBy = [asc(schema.productReviews.createdAt)];
          break;
        case 'highest':
          orderBy = [desc(schema.productReviews.rating), desc(schema.productReviews.helpfulCount)];
          break;
        case 'lowest':
          orderBy = [asc(schema.productReviews.rating), asc(schema.productReviews.helpfulCount)];
          break;
        case 'helpful':
          orderBy = [desc(schema.productReviews.helpfulCount), desc(schema.productReviews.createdAt)];
          break;
        default: // newest
          orderBy = [desc(schema.productReviews.createdAt)];
      }

      const reviews = await this.db
        .select({
          review: schema.productReviews,
          user: {
            id: schema.users.id,
            name: schema.users.name,
          },
          product: {
            id: schema.products.id,
            name: schema.products.name,
            image: schema.products.image,
          }
        })
        .from(schema.productReviews)
        .innerJoin(schema.users, eq(schema.productReviews.userId, schema.users.id))
        .innerJoin(schema.products, eq(schema.productReviews.productId, schema.products.id))
        .where(eq(schema.productReviews.productId, productId))
        .orderBy(...orderBy)
        .limit(limit)
        .offset(offset);

      return reviews.map(r => ({
        ...r.review,
        user: r.user,
        product: r.product,
        helpfulCount: r.review.helpfulCount
      }));
    } catch (error) {
      console.error("Failed to get product reviews:", error);
      throw error;
    }
  }

  async getUserReviews(
    userId: string,
    limit = 20,
    offset = 0
  ): Promise<ReviewWithDetails[]> {
    try {
      const reviews = await this.db
        .select({
          review: schema.productReviews,
          user: {
            id: schema.users.id,
            name: schema.users.name,
          },
          product: {
            id: schema.products.id,
            name: schema.products.name,
            image: schema.products.image,
          }
        })
        .from(schema.productReviews)
        .innerJoin(schema.users, eq(schema.productReviews.userId, schema.users.id))
        .innerJoin(schema.products, eq(schema.productReviews.productId, schema.products.id))
        .where(eq(schema.productReviews.userId, userId))
        .orderBy(desc(schema.productReviews.createdAt))
        .limit(limit)
        .offset(offset);

      return reviews.map(r => ({
        ...r.review,
        user: r.user,
        product: r.product,
        helpfulCount: r.review.helpfulCount
      }));
    } catch (error) {
      console.error("Failed to get user reviews:", error);
      throw error;
    }
  }

  async getReviewStats(productId: string): Promise<ReviewStats> {
    try {
      const reviews = await this.db
        .select()
        .from(schema.productReviews)
        .where(eq(schema.productReviews.productId, productId));

      const totalReviews = reviews.length;
      const verifiedReviews = reviews.filter(r => r.isVerified).length;
      
      // Calculate average rating
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

      reviews.forEach(review => {
        ratingDistribution[review.rating]++;
      });

      // Count recent reviews (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentReviews = reviews.filter(r => new Date(r.createdAt) > thirtyDaysAgo).length;

      return {
        averageRating,
        totalReviews,
        ratingDistribution,
        verifiedReviews,
        recentReviews
      };
    } catch (error) {
      console.error("Failed to get review stats:", error);
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedReviews: 0,
        recentReviews: 0
      };
    }
  }

  async markReviewHelpful(reviewId: string, userId: string): Promise<void> {
    try {
      // This would typically use a separate helpful_votes table
      // For now, just increment the helpful count
      await this.db
        .update(schema.productReviews)
        .set({
          helpfulCount: sql`${schema.productReviews.helpfulCount} + 1`
        })
        .where(eq(schema.productReviews.id, reviewId));

      // Log the helpful vote
      await this.db.insert(schema.auditLogs).values({
        tableName: 'product_reviews',
        recordId: reviewId,
        action: 'UPDATE',
        newValues: { helpfulVote: true },
        userId,
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Failed to mark review helpful:", error);
      throw error;
    }
  }

  async getReviewSummary(productId: string): Promise<ReviewSummary> {
    try {
      const [stats, topReviews] = await Promise.all([
        this.getReviewStats(productId),
        this.getProductReviews(productId, 5, 0, 'helpful')
      ]);

      return {
        productId,
        stats,
        topReviews
      };
    } catch (error) {
      console.error("Failed to get review summary:", error);
      throw error;
    }
  }

  async getTopRatedProducts(limit = 10): Promise<Array<{
    product: schema.Product;
    stats: ReviewStats;
  }>> {
    try {
      // Get products with the highest average ratings
      const productsWithReviews = await this.db
        .select({
          product: schema.products,
          avgRating: sql`AVG(${schema.productReviews.rating})`,
          reviewCount: sql`COUNT(${schema.productReviews.id})`
        })
        .from(schema.products)
        .leftJoin(schema.productReviews, eq(schema.products.id, schema.productReviews.productId))
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .groupBy(schema.products.id)
        .having(sql`COUNT(${schema.productReviews.id}) >= 3`) // At least 3 reviews
        .orderBy(sql`AVG(${schema.productReviews.rating}) DESC`)
        .limit(limit);

      const result = [];
      
      for (const item of productsWithReviews) {
        const stats = await this.getReviewStats(item.product.id);
        result.push({
          product: item.product,
          stats
        });
      }

      return result;
    } catch (error) {
      console.error("Failed to get top rated products:", error);
      return [];
    }
  }

  async verifyReview(reviewId: string): Promise<void> {
    try {
      await this.db
        .update(schema.productReviews)
        .set({ isVerified: true })
        .where(eq(schema.productReviews.id, reviewId));

      // Update product rating
      const review = await this.db
        .select()
        .from(schema.productReviews)
        .where(eq(schema.productReviews.id, reviewId))
        .limit(1);

      if (review[0]) {
        await this.updateProductRating(review[0].productId);
      }
    } catch (error) {
      console.error("Failed to verify review:", error);
      throw error;
    }
  }

  private async updateProductRating(productId: string): Promise<void> {
    try {
      const stats = await this.getReviewStats(productId);
      
      await this.db
        .update(schema.products)
        .set({
          rating: stats.averageRating.toFixed(1)
        })
        .where(eq(schema.products.id, productId));
    } catch (error) {
      console.error("Failed to update product rating:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  async getRecentReviews(limit = 20): Promise<ReviewWithDetails[]> {
    try {
      const reviews = await this.db
        .select({
          review: schema.productReviews,
          user: {
            id: schema.users.id,
            name: schema.users.name,
          },
          product: {
            id: schema.products.id,
            name: schema.products.name,
            image: schema.products.image,
          }
        })
        .from(schema.productReviews)
        .innerJoin(schema.users, eq(schema.productReviews.userId, schema.users.id))
        .innerJoin(schema.products, eq(schema.productReviews.productId, schema.products.id))
        .orderBy(desc(schema.productReviews.createdAt))
        .limit(limit);

      return reviews.map(r => ({
        ...r.review,
        user: r.user,
        product: r.product,
        helpfulCount: r.review.helpfulCount
      }));
    } catch (error) {
      console.error("Failed to get recent reviews:", error);
      return [];
    }
  }

  async searchReviews(query: string, limit = 20): Promise<ReviewWithDetails[]> {
    try {
      const reviews = await this.db
        .select({
          review: schema.productReviews,
          user: {
            id: schema.users.id,
            name: schema.users.name,
          },
          product: {
            id: schema.products.id,
            name: schema.products.name,
            image: schema.products.image,
          }
        })
        .from(schema.productReviews)
        .innerJoin(schema.users, eq(schema.productReviews.userId, schema.users.id))
        .innerJoin(schema.products, eq(schema.productReviews.productId, schema.products.id))
        .where(sql`
          ${schema.productReviews.title} ILIKE ${'%' + query + '%'} OR 
          ${schema.productReviews.comment} ILIKE ${'%' + query + '%'} OR
          ${schema.products.name} ILIKE ${'%' + query + '%'}
        `)
        .orderBy(desc(schema.productReviews.createdAt))
        .limit(limit);

      return reviews.map(r => ({
        ...r.review,
        user: r.user,
        product: r.product,
        helpfulCount: r.review.helpfulCount
      }));
    } catch (error) {
      console.error("Failed to search reviews:", error);
      return [];
    }
  }

  async exportReviews(productId?: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      let reviews: ReviewWithDetails[];
      
      if (productId) {
        reviews = await this.getProductReviews(productId, 1000);
      } else {
        reviews = await this.getRecentReviews(1000);
      }

      if (format === 'csv') {
        const headers = [
          'Review ID', 'Product Name', 'User Name', 'Rating', 'Title', 
          'Comment', 'Created At', 'Helpful Count', 'Verified'
        ];
        
        const csvRows = [
          headers.join(','),
          ...reviews.map(review => [
            review.id,
            review.product.name,
            review.user.name,
            review.rating.toString(),
            review.title || '',
            review.comment || '',
            review.createdAt.toISOString(),
            review.helpfulCount.toString(),
            review.isVerified.toString()
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          productId: productId || 'all',
          totalReviews: reviews.length,
          reviews: reviews.map(review => ({
            id: review.id,
            productName: review.product.name,
            userName: review.user.name,
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            createdAt: review.createdAt,
            helpfulCount: review.helpfulCount,
            isVerified: review.isVerified
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error("Failed to export reviews:", error);
      throw error;
    }
  }
}

export const reviewService = new ReviewService();
