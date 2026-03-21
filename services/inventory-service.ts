import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql, gte, lte, lt } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface InventoryItem extends schema.Product {
  totalSold: number;
  totalRevenue: number;
  lastMovement?: schema.InventoryMovement;
  lowStockThreshold: number;
  movementHistory: Array<schema.InventoryMovement>;
}

export interface InventoryMovementWithDetails extends schema.InventoryMovement {
  product: {
    id: string;
    name: string;
    sku?: string;
  };
  user?: {
    id: string;
    name: string;
  };
  reference?: {
    id: string;
    type: string;
  };
}

export interface InventoryStats {
  totalProducts: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalMovements: number;
  topMovingProducts: Array<{
    product: schema.Product;
    movements: number;
    quantity: number;
  }>;
  stockValueByCategory: Record<string, number>;
  movementsByType: Record<string, number>;
}

export interface StockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  status: 'low' | 'critical' | 'out';
  lastMovementDate?: Date;
}

export class InventoryService {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }

  async getAllInventory(
    limit = 50,
    offset = 0,
    category?: string,
    stockStatus?: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  ): Promise<InventoryItem[]> {
    try {
      let conditions = [
        eq(schema.products.isActive, true),
        isNull(schema.products.deletedAt)
      ];

      if (category) {
        conditions.push(eq(schema.products.category, category));
      }

      if (stockStatus === 'in_stock') {
        conditions.push(gte(schema.products.stockQuantity, 11));
      } else if (stockStatus === 'low_stock') {
        conditions.push(and(
          lte(schema.products.stockQuantity, 10),
          gte(schema.products.stockQuantity, 1)
        ));
      } else if (stockStatus === 'out_of_stock') {
        conditions.push(eq(schema.products.stockQuantity, 0));
      }

      const products = await this.db
        .select()
        .from(schema.products)
        .where(and(...conditions))
        .orderBy(desc(schema.products.createdAt))
        .limit(limit)
        .offset(offset);

      const inventoryItems: InventoryItem[] = [];

      for (const product of products) {
        // Calculate mock sales data (in production, this would come from order items)
        const totalSold = Math.floor(Math.random() * 1000);
        const totalRevenue = product.price * totalSold;
        
        // Get last movement
        const lastMovement = await this.db
          .select()
          .from(schema.inventoryMovements)
          .where(eq(schema.inventoryMovements.productId, product.id))
          .orderBy(desc(schema.inventoryMovements.createdAt))
          .limit(1);

        // Get movement history (last 10)
        const movementHistory = await this.db
          .select()
          .from(schema.inventoryMovements)
          .where(eq(schema.inventoryMovements.productId, product.id))
          .orderBy(desc(schema.inventoryMovements.createdAt))
          .limit(10);

        inventoryItems.push({
          ...product,
          totalSold,
          totalRevenue,
          lastMovement: lastMovement[0],
          lowStockThreshold: 10,
          movementHistory
        });
      }

      return inventoryItems;
    } catch (error) {
      console.error('Failed to get inventory:', error);
      throw error;
    }
  }

  async getInventoryItem(productId: string): Promise<InventoryItem | null> {
    try {
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
        return null;
      }

      // Get movement history
      const movementHistory = await this.db
        .select()
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.productId, productId))
        .orderBy(desc(schema.inventoryMovements.createdAt))
        .limit(20);

      const lastMovement = movementHistory[0];

      return {
        ...product[0],
        totalSold: Math.floor(Math.random() * 1000),
        totalRevenue: product[0].price * Math.floor(Math.random() * 1000),
        lastMovement,
        lowStockThreshold: 10,
        movementHistory
      };
    } catch (error) {
      console.error('Failed to get inventory item:', error);
      throw error;
    }
  }

  async updateStock(
    productId: string,
    newStock: number,
    movementType: 'purchase' | 'sale' | 'adjustment' | 'return' | 'loss',
    quantity: number,
    reason: string,
    userId: string,
    referenceId?: string,
    unitCost?: number
  ): Promise<schema.InventoryMovement> {
    try {
      // Get current stock
      const currentProduct = await this.db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, productId))
        .limit(1);

      if (!currentProduct[0]) {
        throw new Error('Product not found');
      }

      const previousStock = currentProduct[0].stockQuantity;
      
      // Validate stock update
      if (movementType === 'sale' && quantity > previousStock) {
        throw new Error('Cannot sell more than available stock');
      }

      if (newStock < 0) {
        throw new Error('Stock cannot be negative');
      }

      // Calculate costs
      const unitCostValue = unitCost || currentProduct[0].price;
      const totalCostValue = unitCostValue * Math.abs(quantity);

      // Create inventory movement record
      const movement = await this.db
        .insert(schema.inventoryMovements)
        .values({
          productId,
          type: movementType,
          quantity,
          unitCost: unitCostValue,
          totalCost: totalCostValue,
          reason,
          previousStock,
          newStock,
          userId,
          referenceId,
          metadata: {
            previousStock,
            newStock,
            unitCost: unitCostValue,
            totalCost: totalCostValue
          }
        })
        .returning();

      // Update product stock
      await this.db
        .update(schema.products)
        .set({
          stockQuantity: newStock,
          updatedAt: new Date(),
          // Update inStock status
          inStock: newStock > 0,
        })
        .where(eq(schema.products.id, productId));

      // Log the movement
      await this.db.insert(schema.auditLogs).values({
        tableName: 'products',
        recordId: productId,
        action: 'UPDATE',
        oldValues: { stockQuantity: previousStock },
        newValues: { stockQuantity: newStock },
        userId,
        createdAt: new Date(),
      });

      // Check if stock is low and create alert
      if (newStock <= 5) {
        await this.createStockAlert(productId, newStock);
      }

      return movement[0];
    } catch (error) {
      console.error('Failed to update stock:', error);
      throw error;
    }
  }

  async bulkUpdateStock(
    updates: Array<{
      productId: string;
      newStock: number;
      movementType: 'purchase' | 'sale' | 'adjustment' | 'return' | 'loss';
      quantity: number;
      reason: string;
      unitCost?: number;
    }>,
    userId: string
  ): Promise<schema.InventoryMovement[]> {
    try {
      const movements: schema.InventoryMovement[] = [];

      for (const update of updates) {
        const movement = await this.updateStock(
          update.productId,
          update.newStock,
          update.movementType,
          update.quantity,
          update.reason,
          userId,
          undefined,
          update.unitCost
        );
        movements.push(movement);
      }

      return movements;
    } catch (error) {
      console.error('Failed to bulk update stock:', error);
      throw error;
    }
  }

  async getInventoryMovements(
    productId?: string,
    movementType?: string,
    limit = 50,
    offset = 0,
    dateRange?: { start: Date; end: Date }
  ): Promise<InventoryMovementWithDetails[]> {
    try {
      let conditions: any[] = [isNull(schema.inventoryMovements.deletedAt)];

      if (productId) {
        conditions.push(eq(schema.inventoryMovements.productId, productId));
      }

      if (movementType) {
        conditions.push(eq(schema.inventoryMovements.type, movementType));
      }

      if (dateRange) {
        conditions.push(
          gte(schema.inventoryMovements.createdAt, dateRange.start),
          lte(schema.inventoryMovements.createdAt, dateRange.end)
        );
      }

      const movements = await this.db
        .select({
          movement: schema.inventoryMovements,
          product: {
            id: schema.products.id,
            name: schema.products.name,
            sku: schema.products.sku,
          },
          user: {
            id: schema.users.id,
            name: schema.users.name,
          }
        })
        .from(schema.inventoryMovements)
        .innerJoin(schema.products, eq(schema.inventoryMovements.productId, schema.products.id))
        .leftJoin(schema.users, eq(schema.inventoryMovements.userId, schema.users.id))
        .where(and(...conditions))
        .orderBy(desc(schema.inventoryMovements.createdAt))
        .limit(limit)
        .offset(offset);

      return movements.map(m => ({
        ...m.movement,
        product: m.product,
        user: m.user || undefined,
        reference: m.movement.referenceId ? {
          id: m.movement.referenceId,
          type: 'order' // Simplified - in production you'd look up the reference
        } : undefined
      }));
    } catch (error) {
      console.error('Failed to get inventory movements:', error);
      throw error;
    }
  }

  async getInventoryStats(): Promise<InventoryStats> {
    try {
      // Total products
      const totalProductsResult = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ));

      const totalProducts = Number(totalProductsResult[0]?.count || 0);

      // Total value
      const totalValueResult = await this.db
        .select({ value: sql`SUM(stock_quantity * price)` })
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ));

      const totalValue = Number(totalValueResult[0]?.value || 0);

      // Low stock products
      const lowStockResult = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          lte(schema.products.stockQuantity, 10),
          gte(schema.products.stockQuantity, 1),
          isNull(schema.products.deletedAt)
        ));

      const lowStockProducts = Number(lowStockResult[0]?.count || 0);

      // Out of stock products
      const outOfStockResult = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          eq(schema.products.stockQuantity, 0),
          isNull(schema.products.deletedAt)
        ));

      const outOfStockProducts = Number(outOfStockResult[0]?.count || 0);

      // Total movements
      const totalMovementsResult = await this.db
        .select({ count: sql`COUNT(*)` })
        .from(schema.inventoryMovements)
        .where(isNull(schema.inventoryMovements.deletedAt));

      const totalMovements = Number(totalMovementsResult[0]?.count || 0);

      // Top moving products
      const topMovingProductsResult = await this.db
        .select({
          product: schema.products,
          movements: sql`COUNT(*)`,
          quantity: sql`SUM(ABS(quantity))`
        })
        .from(schema.inventoryMovements)
        .innerJoin(schema.products, eq(schema.inventoryMovements.productId, schema.products.id))
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.inventoryMovements.deletedAt)
        ))
        .groupBy(schema.inventoryMovements.productId)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);

      const topMovingProducts = topMovingProductsResult.map(p => ({
        product: p.product,
        movements: Number(p.movements),
        quantity: Number(p.quantity)
      }));

      // Stock value by category
      const stockValueByCategoryResult = await this.db
        .select({
          category: schema.categories.name,
          value: sql`SUM(p.stock_quantity * p.price)`
        })
        .from(schema.products)
        .innerJoin(schema.categories, eq(schema.products.category, schema.categories.id))
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .groupBy(schema.categories.name)
        .orderBy(desc(sql`SUM(p.stock_quantity * p.price)`));

      const stockValueByCategory: Record<string, number> = {};
      stockValueByCategoryResult.forEach(row => {
        stockValueByCategory[row.category] = Number(row.value);
      });

      // Movements by type
      const movementsByTypeResult = await this.db
        .select({
          type: schema.inventoryMovements.type,
          count: sql`COUNT(*)`,
          quantity: sql`SUM(ABS(quantity))`
        })
        .from(schema.inventoryMovements)
        .where(isNull(schema.inventoryMovements.deletedAt))
        .groupBy(schema.inventoryMovements.type)
        .orderBy(desc(sql`COUNT(*)`));

      const movementsByType: Record<string, number> = {};
      movementsByTypeResult.forEach(row => {
        movementsByType[row.type] = Number(row.count);
      });

      return {
        totalProducts,
        totalValue,
        lowStockProducts,
        outOfStockProducts,
        totalMovements,
        topMovingProducts,
        stockValueByCategory,
        movementsByType
      };
    } catch (error) {
      console.error('Failed to get inventory stats:', error);
      throw error;
    }
  }

  async getStockAlerts(): Promise<StockAlert[]> {
    try {
      const alerts: StockAlert[] = [];

      // Low stock alerts
      const lowStockProducts = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          lte(schema.products.stockQuantity, 10),
          gte(schema.products.stockQuantity, 1),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(asc(schema.products.stockQuantity));

      lowStockProducts.forEach(product => {
        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock: product.stockQuantity,
          threshold: 10,
          status: product.stockQuantity <= 5 ? 'critical' : 'low'
        });
      });

      // Out of stock alerts
      const outOfStockProducts = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          eq(schema.stockQuantity, 0),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(desc(schema.products.updatedAt));

      outOfStockProducts.forEach(product => {
        alerts.push({
          productId: product.id,
          productName: product.name,
          currentStock: 0,
          threshold: 1,
          status: 'out'
        });
      });

      return alerts;
    } catch (error) {
      console.error('Failed to get stock alerts:', error);
      throw error;
    }
  }

  private async createStockAlert(productId: string, currentStock: number): Promise<void> {
    try {
      // In a real implementation, this would send notifications or create alert records
      console.log(`Stock alert created for product ${productId}: ${currentStock} units remaining`);
    } catch (error) {
      console.error('Failed to create stock alert:', error);
    }
  }

  async generateInventoryReport(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const inventory = await this.getAllInventory(1000);
      const stats = await this.getInventoryStats();

      if (format === 'csv') {
        const headers = [
          'Product ID', 'Name', 'Category', 'SKU', 'Current Stock',
          'Unit Price', 'Total Value', 'Status', 'Last Updated'
        ];
        
        const csvRows = [
          headers.join(','),
          ...inventory.map(item => [
            item.id,
            item.name,
            item.category,
            item.sku || '',
            item.stockQuantity.toString(),
            item.price.toString(),
            (item.stockQuantity * item.price).toString(),
            item.inStock ? 'In Stock' : 'Out of Stock',
            item.updatedAt.toISOString()
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          generatedAt: new Date().toISOString(),
          stats,
          inventory: inventory.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            sku: item.sku,
            stockQuantity: item.stockQuantity,
            price: item.price,
            originalPrice: item.originalPrice,
            unit: item.unit,
            inStock: item.inStock,
            image: item.image,
            rating: item.rating,
            totalSold: item.totalSold,
            totalRevenue: item.totalRevenue,
            lowStockThreshold: item.lowStockThreshold,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error('Failed to generate inventory report:', error);
      throw error;
    }
  }

  async forecastDemand(productId: string, days = 30): Promise<{
    productId: string;
    currentStock: number;
    forecast: Array<{
      date: string;
      predictedDemand: number;
      recommendedStock: number;
      confidence: number;
    }>;
  }> {
    try {
      const product = await this.getInventoryItem(productId);
      
      if (!product) {
        throw new Error('Product not found');
      }

      // Simplified demand forecasting (in production, you'd use more sophisticated algorithms)
      const forecast = [];
      const avgDailyDemand = product.totalSold / 30; // Assume 30 days period
      const safetyStock = Math.ceil(avgDailyDemand * 7); // 7 days safety stock
      const reorderPoint = Math.ceil(avgDailyDemand * 3); // 3 days reorder point

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        
        const predictedDemand = Math.max(0, Math.floor(avgDailyDemand + (Math.random() - 0.5) * 2));
        const recommendedStock = Math.max(0, predictedDemand + safetyStock);
        const confidence = 0.7 + (Math.random() * 0.2); // 70-90% confidence

        forecast.push({
          date: date.toISOString().split('T')[0],
          predictedDemand,
          recommendedStock,
          confidence
        });
      }

      return {
        productId,
        currentStock: product.stockQuantity,
        forecast
      };
    } catch (error) {
      console.error('Failed to forecast demand:', error);
      throw error;
    }
  }

  async setLowStockThreshold(productId: string, threshold: number): Promise<void> {
    try {
      // In a real implementation, this would be stored in a separate product settings table
      console.log(`Low stock threshold set to ${threshold} for product ${productId}`);
    } catch (error) {
      console.error('Failed to set low stock threshold:', error);
      throw error;
    }
  }

  async getReorderRecommendations(): Promise<Array<{
    productId: string;
    productName: string;
    currentStock: number;
    recommendedStock: number;
    urgency: 'low' | 'medium' | 'high' | 'critical';
    daysOfStock: number;
  }>> {
    try {
      const products = await this.db
        .select()
        .from(schema.products)
        .where(and(
          eq(schema.products.isActive, true),
          isNull(schema.products.deletedAt)
        ))
        .orderBy(asc(schema.products.stockQuantity));

      const recommendations = [];

      for (const product of products) {
        // Simplified calculation - in production, you'd use historical data
        const avgDailyDemand = Math.floor(Math.random() * 20) + 5; // 5-25 units per day
        const daysOfStock = product.stockQuantity / avgDailyDemand;
        
        let urgency: 'low' | 'medium' | 'high' | 'critical';
        let recommendedStock: number;

        if (daysOfStock <= 0) {
          urgency = 'critical';
          recommendedStock = avgDailyDemand * 30; // 30 days supply
        } else if (daysOfStock <= 3) {
          urgency = 'high';
          recommendedStock = avgDailyDemand * 14; // 14 days supply
        } else if (daysOfStock <= 7) {
          urgency = 'medium';
          recommendedStock = avgDailyDemand * 10; // 10 days supply
        } else {
          urgency = 'low';
          recommendedStock = product.stockQuantity;
        }

        if (daysOfStock <= 14) {
          recommendations.push({
            productId: product.id,
            productName: product.name,
            currentStock: product.stockQuantity,
            recommendedStock,
            urgency,
            daysOfStock: Math.floor(daysOfStock)
          });
        }
      }

      return recommendations.sort((a, b) => {
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      });
    } catch (error) {
      console.error('Failed to get reorder recommendations:', error);
      throw error;
    }
  }
}

export const inventoryService = new InventoryService();
