import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export interface AnalyticsService {
  trackEvent: (event: string, properties?: Record<string, any>) => Promise<void>;
  trackScreenView: (screenName: string) => Promise<void>;
  trackPurchase: (orderId: string, total: number, items: any[]) => Promise<void>;
  getAnalyticsData: () => Promise<AnalyticsData>;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topProducts: any[];
  recentActivity: AnalyticsEvent[];
}

class BasicAnalyticsService implements AnalyticsService {
  private readonly STORAGE_KEY = 'analytics_data';

  async trackEvent(event: string, properties?: Record<string, any>): Promise<void> {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    try {
      // Get existing events
      const existingData = await this.getAnalyticsData();
      existingData.recentActivity.unshift(analyticsEvent);
      
      // Keep only last 100 events
      if (existingData.recentActivity.length > 100) {
        existingData.recentActivity = existingData.recentActivity.slice(0, 100);
      }

      await this.saveAnalyticsData(existingData);
      console.log('Analytics event tracked:', analyticsEvent);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }

  async trackScreenView(screenName: string): Promise<void> {
    await this.trackEvent('screen_view', { screen_name: screenName });
  }

  async trackPurchase(orderId: string, total: number, items: any[]): Promise<void> {
    await this.trackEvent('purchase', {
      order_id: orderId,
      total_amount: total,
      items_count: items.length,
      items: items.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.qty
      }))
    });
  }

  async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : this.getEmptyAnalyticsData();
    } catch (error) {
      console.error('Error loading analytics data:', error);
      return this.getEmptyAnalyticsData();
    }
  }

  private async saveAnalyticsData(data: AnalyticsData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }

  private getEmptyAnalyticsData(): AnalyticsData {
    return {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      topProducts: [],
      recentActivity: []
    };
  }

  async calculateMetrics(orders: any[], products: any[]): Promise<void> {
    try {
      const totalOrders = orders.length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered');
      const totalRevenue = deliveredOrders.reduce((sum, o) => sum + o.total, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / deliveredOrders.length : 0;

      // Calculate top products
      const productSales: Record<string, { quantity: number; revenue: number }> = {};
      deliveredOrders.forEach(order => {
        order.items?.forEach((item: any) => {
          const productName = item.name;
          if (!productSales[productName]) {
            productSales[productName] = { quantity: 0, revenue: 0 };
          }
          productSales[productName].quantity += item.qty || 0;
          productSales[productName].revenue += (item.price * item.qty) || 0;
        });
      });

      const topProducts = Object.entries(productSales)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([name, data]) => ({ name, ...data }));

      const analyticsData: AnalyticsData = {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        topProducts,
        recentActivity: (await this.getAnalyticsData()).recentActivity
      };

      await this.saveAnalyticsData(analyticsData);
      console.log('Analytics metrics calculated:', { totalOrders, totalRevenue, averageOrderValue });
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
  }

  async clearAnalyticsData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('Analytics data cleared');
    } catch (error) {
      console.error('Error clearing analytics data:', error);
    }
  }
}

export default BasicAnalyticsService;
