import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, desc, asc, isNull, sql } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";

export interface SystemSetting extends schema.AdminSetting {
  parsedValue?: any;
}

export interface SettingsCategory {
  category: string;
  settings: SystemSetting[];
  description: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  systemAlerts: boolean;
}

export interface PaymentSettings {
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  cashOnDeliveryEnabled: boolean;
  autoRefundEnabled: boolean;
  refundPeriodDays: number;
  currency: string;
  minimumAmount: number;
}

export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  supportPhone: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
}

export interface SecuritySettings {
  passwordMinLength: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  allowedOrigins: string[];
}

export class AdminSettingsService {
  private db: ReturnType<typeof drizzle>;
  private cache: Map<string, any> = new Map();

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
    
    // Initialize default settings
    this.initializeDefaultSettings();
  }

  private async initializeDefaultSettings(): Promise<void> {
    try {
      const defaultSettings = [
        // General settings
        { key: 'site_name', value: 'Supermarket Go', type: 'string', category: 'general', description: 'Site name' },
        { key: 'site_description', value: 'Modern supermarket management system', type: 'string', category: 'general', description: 'Site description' },
        { key: 'contact_email', value: 'admin@supermarket.uz', type: 'string', category: 'general', description: 'Contact email' },
        { key: 'support_phone', value: '+998901234567', type: 'string', category: 'general', description: 'Support phone number' },
        { key: 'timezone', value: 'Asia/Tashkent', type: 'string', category: 'general', description: 'Default timezone' },
        { key: 'language', value: 'uz', type: 'string', category: 'general', description: 'Default language' },
        { key: 'maintenance_mode', value: 'false', type: 'boolean', category: 'general', description: 'Maintenance mode toggle' },
        { key: 'allow_registration', value: 'true', type: 'boolean', category: 'general', description: 'Allow new user registration' },
        { key: 'require_email_verification', value: 'true', type: 'boolean', category: 'general', description: 'Require email verification' },
        
        // Payment settings
        { key: 'stripe_enabled', value: 'true', type: 'boolean', category: 'payment', description: 'Enable Stripe payments' },
        { key: 'paypal_enabled', value: 'true', type: 'boolean', category: 'payment', description: 'Enable PayPal payments' },
        { key: 'cash_on_delivery_enabled', value: 'true', type: 'boolean', category: 'payment', description: 'Enable cash on delivery' },
        { key: 'auto_refund_enabled', value: 'true', type: 'boolean', category: 'payment', description: 'Enable automatic refunds' },
        { key: 'refund_period_days', value: '30', type: 'number', category: 'payment', description: 'Refund period in days' },
        { key: 'currency', value: 'UZS', type: 'string', category: 'payment', description: 'Default currency' },
        { key: 'minimum_amount', value: '1000', type: 'number', category: 'payment', description: 'Minimum payment amount' },
        
        // Notification settings
        { key: 'email_notifications_enabled', value: 'true', type: 'boolean', category: 'notification', description: 'Enable email notifications' },
        { key: 'push_notifications_enabled', value: 'true', type: 'boolean', category: 'notification', description: 'Enable push notifications' },
        { key: 'sms_notifications_enabled', value: 'false', type: 'boolean', category: 'notification', description: 'Enable SMS notifications' },
        { key: 'order_notifications', value: 'true', type: 'boolean', category: 'notification', description: 'Order status notifications' },
        { key: 'low_stock_alerts', value: 'true', type: 'boolean', category: 'notification', description: 'Low stock alerts' },
        { key: 'system_alerts', value: 'true', type: 'boolean', category: 'notification', description: 'System alerts' },
        
        // Security settings
        { key: 'password_min_length', value: '8', type: 'number', category: 'security', description: 'Minimum password length' },
        { key: 'session_timeout', value: '24', type: 'number', category: 'security', description: 'Session timeout in hours' },
        { key: 'max_login_attempts', value: '5', type: 'number', category: 'security', description: 'Maximum login attempts' },
        { key: 'lockout_duration', value: '15', type: 'number', category: 'security', description: 'Account lockout duration in minutes' },
        { key: 'two_factor_auth', value: 'false', type: 'boolean', category: 'security', description: 'Two-factor authentication' },
        { key: 'ip_whitelist', value: '[]', type: 'json', category: 'security', description: 'Whitelisted IP addresses' },
        { key: 'allowed_origins', value: '[]', type: 'json', category: 'security', description: 'Allowed origins for CORS' },
        
        // Inventory settings
        { key: 'low_stock_threshold', value: '10', type: 'number', category: 'inventory', description: 'Low stock threshold' },
        { key: 'auto_reorder_enabled', value: 'false', type: 'boolean', category: 'inventory', description: 'Enable automatic reordering' },
        { key: 'reorder_point_percentage', value: '0.2', type: 'number', category: 'inventory', description: 'Reorder point as percentage' },
        { key: 'inventory_alert_days', value: '30', type: 'number', category: 'inventory', description: 'Days to keep inventory alerts' },
        
        // Analytics settings
        { key: 'analytics_retention_days', value: '90', type: 'number', category: 'analytics', description: 'Analytics data retention period in days' },
        { key: 'export_enabled', value: 'true', type: 'boolean', category: 'analytics', description: 'Enable data export' },
        { key: 'report_generation_enabled', value: 'true', type: 'boolean', category: 'analytics', description: 'Enable report generation' },
        { key: 'real_time_analytics', value: 'true', type: 'boolean', category: 'analytics', description: 'Real-time analytics' },
      ];

      for (const setting of defaultSettings) {
        await this.createSetting(setting, 'system');
      }

      console.log('✅ Default settings initialized');
    } catch (error) {
      console.error('Failed to initialize default settings:', error);
    }
  }

  async createSetting(
    settingData: {
      key: string;
      value: string;
      type: 'string' | 'number' | 'boolean' | 'json';
      category: string;
      description?: string;
      isPublic?: boolean;
      updatedBy?: string;
    },
    createdBy?: string
  ): Promise<schema.AdminSetting> {
    try {
      // Check if setting already exists
      const existing = await this.db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, settingData.key))
        .limit(1);

      if (existing[0]) {
        throw new Error(`Setting with key '${settingData.key}' already exists`);
      }

      // Create setting
      const result = await this.db
        .insert(schema.adminSettings)
        .values({
          ...settingData,
          isPublic: settingData.isPublic || false,
          updatedBy: settingData.updatedBy || createdBy,
        })
        .returning();

      // Clear cache for this category
      this.cache.clear();

      // Log setting creation
      await this.db.insert(schema.auditLogs).values({
        tableName: 'admin_settings',
        recordId: result[0].id,
        action: 'INSERT',
        newValues: result[0],
        userId: settingData.updatedBy || createdBy,
        createdAt: new Date(),
      });

      // Clear cache for affected category
      this.cache.clear();

      return result[0];
    } catch (error) {
      console.error('Failed to create setting:', error);
      throw error;
    }
  }

  async updateSetting(
    key: string,
    value: string,
    updatedBy: string
  ): Promise<schema.AdminSetting> {
    try {
      // Get current setting
      const currentSetting = await this.db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, key))
        .limit(1);

      if (!currentSetting[0]) {
        throw new Error(`Setting with key '${key}' not found`);
      }

      // Validate value type
      this.validateSettingType(currentSetting[0].type, value);

      // Update setting
      const result = await this.db
        .update(schema.adminSettings)
        .set({
          value,
          updatedAt: new Date(),
          updatedBy
        })
        .where(eq(schema.adminSettings.key, key))
        .returning();

      // Clear cache
      this.cache.delete(key);

      // Log setting update
      await this.db.insert(schema.auditLogs).values({
        tableName: 'admin_settings',
        recordId: key,
        action: 'UPDATE',
        oldValues: { value: currentSetting[0].value },
        newValues: { value },
        userId: updatedBy,
        createdAt: new Date(),
      });

      return result[0];
    } catch (error) {
      console.error('Failed to update setting:', error);
      throw error;
    }
  }

  async getSetting(key: string): Promise<SystemSetting | null> {
    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const setting = await this.db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, key))
        .limit(1);

      if (!setting[0]) {
        return null;
      }

      // Parse value based on type
      const parsedValue = this.parseSettingValue(setting[0].type, setting[0].value);
      
      const systemSetting: SystemSetting = {
        ...setting[0],
        parsedValue
      };

      // Cache the result
      this.cache.set(key, systemSetting);

      return systemSetting;
    } catch (error) {
      console.error('Failed to get setting:', error);
      return null;
    }
  }

  async getSettingsByCategory(category: string): Promise<SettingsCategory | null> {
    try {
      const settings = await this.db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.category, category))
        .orderBy(asc(schema.adminSettings.key));

      if (settings.length === 0) {
        return null;
      }

      return {
        category,
        settings: settings.map(s => ({
          ...s,
          parsedValue: this.parseSettingValue(s.type, s.value)
        })),
        description: this.getCategoryDescription(category)
      };
    } catch (error) {
      console.error('Failed to get settings by category:', error);
      return null;
    }
  }

  async getAllSettings(isPublic = false): Promise<SystemSetting[]> {
    try {
      let conditions: any[] = [];

      if (!isPublic) {
        conditions.push(eq(schema.adminSettings.isPublic, false));
      }

      const settings = await this.db
        .select()
        .from(schema.adminSettings)
        .where(and(...conditions))
        .orderBy(asc(schema.adminSettings.category), asc(schema.adminSettings.key));

      return settings.map(setting => ({
        ...setting,
        parsedValue: this.parseSettingValue(setting.type, setting.value)
      }));
    } catch (error) {
      console.error('Failed to get all settings:', error);
      return [];
    }
  }

  async deleteSetting(key: string, deletedBy: string): Promise<void> {
    try {
      // Get current setting
      const currentSetting = await this.db
        .select()
        .from(schema.adminSettings)
        .where(eq(schema.adminSettings.key, key))
        .limit(1);

      if (!currentSetting[0]) {
        throw new Error(`Setting with key '${key}' not found`);
      }

      // Soft delete setting
      await this.db
        .update(schema.adminSettings)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.adminSettings.key, key));

      // Log deletion
      await this.db.insert(schema.auditLogs).values({
        tableName: 'admin_settings',
        recordId: key,
        action: 'DELETE',
        oldValues: currentSetting[0],
        userId: deletedBy,
        createdAt: new Date(),
      });

      // Clear cache
      this.cache.delete(key);
    } catch (error) {
      console.error('Failed to delete setting:', error);
      throw error;
    }
  }

  async bulkUpdateSettings(
    updates: Array<{
      key: string;
      value: string;
      updatedBy: string;
    }>,
    createdBy: string
  ): Promise<number> {
    try {
      let updatedCount = 0;

      for (const update of updates) {
        try {
          await this.updateSetting(update.key, update.value, update.updatedBy);
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update setting ${update.key}:`, error);
        }
      }

      return updatedCount;
    } catch (error) {
      console.error('Failed to bulk update settings:', error);
      throw error;
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const settings = await this.getSettingsByCategory('notification');
      
      if (!settings) {
        return {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          orderNotifications: true,
          lowStockAlerts: true,
          systemAlerts: true
        };
      }

      const parsedSettings: NotificationSettings = {
        emailNotifications: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'email_notifications_enabled')?.value || 'true'),
        pushNotifications: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'push_notifications_enabled')?.value || 'true'),
        smsNotifications: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'sms_notifications_enabled')?.value || 'false'),
        orderNotifications: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'order_notifications')?.value || 'true'),
        lowStockAlerts: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'low_stock_alerts')?.value || 'true'),
        systemAlerts: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'system_alerts')?.value || 'true')
      };

      return parsedSettings;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      return {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        orderNotifications: true,
        lowStockAlerts: true,
        systemAlerts: true
      };
    }
  }

  async getPaymentSettings(): Promise<PaymentSettings> {
    try {
      const settings = await this.getSettingsByCategory('payment');
      
      if (!settings) {
        return {
          stripeEnabled: true,
          paypalEnabled: true,
          cashOnDeliveryEnabled: true,
          autoRefundEnabled: true,
          refundPeriodDays: 30,
          currency: 'UZS',
          minimumAmount: 1000
        };
      }

      const parsedSettings: PaymentSettings = {
        stripeEnabled: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'stripe_enabled')?.value || 'true'),
        paypalEnabled: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'paypal_enabled')?.value || 'true'),
        cashOnDeliveryEnabled: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'cash_on_delivery_enabled')?.value || 'true'),
        autoRefundEnabled: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'auto_refund_enabled')?.value || 'true'),
        refundPeriodDays: this.parseSettingValue('number', settings.settings.find(s => s.key === 'refund_period_days')?.value || '30'),
        currency: this.parseSettingValue('string', settings.settings.find(s => s.key === 'currency')?.value || 'UZS'),
        minimumAmount: this.parseSettingValue('number', settings.settings.find(s => s.key === 'minimum_amount')?.value || '1000')
      };

      return parsedSettings;
    } catch (error) {
      console.error('Failed to get payment settings:', error);
      return {
        stripeEnabled: true,
        paypalEnabled: true,
        cashOnDeliveryEnabled: true,
        autoRefundEnabled: true,
        refundPeriodDays: 30,
        currency: 'UZS',
        minimumAmount: 1000
      };
    }
  }

  async getGeneralSettings(): Promise<GeneralSettings> {
    try {
      const settings = await this.getSettingsByCategory('general');
      
      if (!settings) {
        return {
          siteName: 'Supermarket Go',
          siteDescription: 'Modern supermarket management system',
          contactEmail: 'admin@supermarket.uz',
          supportPhone: '+998901234567',
          timezone: 'Asia/Tashkent',
          language: 'uz',
          maintenanceMode: false,
          allowRegistration: true,
          requireEmailVerification: true
        };
      }

      const parsedSettings: GeneralSettings = {
        siteName: this.parseSettingValue('string', settings.settings.find(s => s.key === 'site_name')?.value || 'Supermarket Go'),
        siteDescription: this.parseSettingValue('string', settings.settings.find(s => s.key === 'site_description')?.value || 'Modern supermarket management system'),
        contactEmail: this.parseSettingValue('string', settings.settings.find(s => s.key === 'contact_email')?.value || 'admin@supermarket.uz'),
        supportPhone: this.parseSettingValue('string', settings.settings.find(s => s.key === 'support_phone')?.value || '+998901234567'),
        timezone: this.parseSettingValue('string', settings.settings.find(s => s.key === 'timezone')?.value || 'Asia/Tashkent'),
        language: this.parseSettingValue('string', settings.settings.find(s => s.key === 'language')?.value || 'uz'),
        maintenanceMode: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'maintenance_mode')?.value || 'false'),
        allowRegistration: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'allow_registration')?.value || 'true'),
        requireEmailVerification: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'require_email_verification')?.value || 'true')
      };

      return parsedSettings;
    } catch (error) {
      console.error('Failed to get general settings:', error);
      return {
        siteName: 'Supermarket Go',
        siteDescription: 'Modern supermarket management system',
        contactEmail: 'admin@supermarket.uz',
        supportPhone: '+998901234567',
        timezone: 'Asia/Tashkent',
        language: 'uz',
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true
      };
    }
  }

  async getSecuritySettings(): Promise<SecuritySettings> {
    try {
      const settings = await this.getSettingsByCategory('security');
      
      if (!settings) {
        return {
          passwordMinLength: 8,
          sessionTimeout: 24,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
          twoFactorAuth: false,
          ipWhitelist: [],
          allowedOrigins: []
        };
      }

      const parsedSettings: SecuritySettings = {
        passwordMinLength: this.parseSettingValue('number', settings.settings.find(s => s.key === 'password_min_length')?.value || '8'),
        sessionTimeout: this.parseSettingValue('number', settings.settings.find(s => s.key === 'session_timeout')?.value || '24'),
        maxLoginAttempts: this.parseSettingValue('number', settings.settings.find(s => s.key === 'max_login_attempts')?.value || '5'),
        lockoutDuration: this.parseSettingValue('number', settings.settings.find(s => s.key === 'lockout_duration')?.value || '15'),
        twoFactorAuth: this.parseSettingValue('boolean', settings.settings.find(s => s.key === 'two_factor_auth')?.value || 'false'),
        ipWhitelist: this.parseSettingValue('json', settings.settings.find(s => s.key === 'ip_whitelist')?.value || '[]'),
        allowedOrigins: this.parseSettingValue('json', settings.settings.find(s => s.key === 'allowed_origins')?.value || '[]')
      };

      return parsedSettings;
    } catch (error) {
      console.error('Failed to get security settings:', error);
      return {
        passwordMinLength: 8,
        sessionTimeout: 24,
        maxLoginAttempts: 5,
        lockoutDuration: 15,
        twoFactorAuth: false,
        ipWhitelist: [],
        allowedOrigins: []
      };
    }
  }

  async validateSettingType(expectedType: string, value: string): boolean {
    try {
      switch (expectedType) {
        case 'boolean':
          return ['true', 'false'].includes(value.toLowerCase());
        case 'number':
          return !isNaN(Number(value)) && !isNaN(parseFloat(value));
        case 'json':
          try {
            JSON.parse(value);
            return true;
          } catch {
            return false;
          }
        case 'string':
          return typeof value === 'string';
        default:
          return true;
      }
    } catch (error) {
      return false;
    }
  }

  private parseSettingValue(type: string, value: string): any {
    try {
      switch (type) {
        case 'boolean':
          return value === 'true';
        case 'number':
          return Number(value);
        case 'json':
          return JSON.parse(value);
        default:
          return value;
      }
    } catch (error) {
      return value;
    }
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      general: 'General site configuration',
      payment: 'Payment processing settings',
      notification: 'Notification preferences',
      security: 'Security and access control',
      inventory: 'Inventory management',
      analytics: 'Analytics and reporting'
    };

    return descriptions[category] || 'Unknown category';
  }

  async exportSettings(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const settings = await this.getAllSettings();

      if (format === 'csv') {
        const headers = [
          'Key', 'Value', 'Type', 'Category', 'Description', 'Is Public', 'Updated At'
        ];
        
        const csvRows = [
          headers.join(','),
          ...settings.map(s => [
            s.key,
            s.value,
            s.type,
            s.category,
            s.description || '',
            s.isPublic ? 'Yes' : 'No',
            s.updatedAt?.toISOString() || ''
          ].join(','))
        ];

        return csvRows.join('\n');
      } else {
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          settings: settings.map(s => ({
            id: s.id,
            key: s.key,
            value: s.value,
            type: s.type,
            category: s.category,
            description: s.description,
            isPublic: s.isPublic,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt
          }))
        }, null, 2);
      }
    } catch (error) {
      console.error('Failed to export settings:', error);
      throw error;
    }
  }

  async importSettings(data: Array<{
    key: string;
    value: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    category: string;
    description?: string;
    isPublic?: boolean;
  }>, updatedBy?: string): Promise<number> {
    try {
      let importedCount = 0;

      for (const setting of data) {
        try {
          await this.createSetting(setting, updatedBy);
          importedCount++;
        } catch (error) {
          console.error(`Failed to import setting ${setting.key}:`, error);
        }
      }

      return importedCount;
    } catch (error) {
      console.error('Failed to import settings:', error);
      throw error;
    }
  }

  async resetToDefaults(category?: string): Promise<number> {
    try {
      let conditions: any[] = [];

      if (category) {
        conditions.push(eq(schema.adminSettings.category, category));
      }

      // Get all settings to reset
      const settings = await this.db
        .select()
        .from(schema.adminSettings)
        .where(and(...conditions));

      let resetCount = 0;

      for (const setting of settings) {
        // Get default value for this setting
        const defaultValue = this.getDefaultValue(setting.key);
        
        if (defaultValue !== null) {
          await this.db
            .update(schema.adminSettings)
            .set({
              value: defaultValue,
              updatedAt: new Date()
            })
            .where(eq(schema.adminSettings.id, setting.id));
          
          resetCount++;
        }
      }

      // Clear cache
      this.cache.clear();

      return resetCount;
    } catch (error) {
      console.error('Failed to reset settings:', error);
      throw error;
    }
  }

  private getDefaultValue(key: string): string | null {
    const defaults: Record<string, string> = {
      'site_name': 'Supermarket Go',
      'site_description': 'Modern supermarket management system',
      'contact_email': 'admin@supermarket.uz',
      'support_phone': '+998901234567',
      'timezone': 'Asia/Tashkent',
      'language': 'uz',
      'maintenance_mode': 'false',
      'allow_registration': 'true',
      'require_email_verification': 'true',
      'stripe_enabled': 'true',
      'paypal_enabled': 'true',
      'cash_on_delivery_enabled': 'true',
      'auto_refund_enabled': 'true',
      'refund_period_days': '30',
      'currency': 'UZS',
      'minimum_amount': '1000',
      'email_notifications_enabled': 'true',
      'push_notifications_enabled': 'true',
      'sms_notifications_enabled': 'false',
      'order_notifications': 'true',
      'low_stock_alerts': 'true',
      'system_alerts': 'true',
      'password_min_length': '8',
      'session_timeout': '24',
      'max_login_attempts': '5',
      'lockout_duration': '15',
      'two_factor_auth': 'false',
      'ip_whitelist': '[]',
      'allowed_origins': '[]',
      'low_stock_threshold': '10',
      'auto_reorder_enabled': 'false',
      'reorder_point_percentage': '0.2',
      'inventory_alert_days': '30',
      'analytics_retention_days': '90',
      'export_enabled': 'true',
      'report_generation_enabled': 'true',
      'real_time_analytics': 'true'
    };

    return defaults[key] || null;
  }

  async scheduleSettingsCleanup(): Promise<void> {
    try {
      const schedule = require('node-schedule');
      
      // Clean expired system logs (older than 90 days)
      schedule.scheduleJob('0 2 * * * *', async () => {
        try {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          
          const result = await this.db
            .delete(schema.systemLogs)
            .where(and(
              lte(schema.systemLogs.createdAt, ninetyDaysAgo)
            ));

          console.log(`🗑️ Cleaned ${result.length} old system logs`);
        } catch (error) {
          console.error('❌ Failed to cleanup system logs:', error);
        }
      });

      // Clean old audit logs (older than 1 year)
      schedule.scheduleJob('0 3 * * * *', async () => {
        try {
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1, oneYearAgo.getMonth(), oneYearAgo.getDate());
          
          const result = await this.db
            .delete(schema.auditLogs)
            .where(and(
              lte(schema.auditLogs.createdAt, oneYearAgo)
            ));

          console.log(`🗑️ Cleaned ${result.length} old audit logs`);
        } catch (error) {
          console.error('❌ Failed to cleanup audit logs:', error);
        }
      });

      console.log('✅ Settings cleanup scheduled (daily at 2 AM and 3 AM)');
    } catch (error) {
      console.error('Failed to schedule settings cleanup:', error);
    }
  }
}

export const adminSettingsService = new AdminSettingsService();
