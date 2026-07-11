import { Request, Response } from 'express';
import { adminDashboardService } from '../services/admin-dashboard-service';
import { inventoryService } from '../services/inventory-service';
import { adminUserService } from '../services/admin-user-service';
import { adminSettingsService } from '../services/admin-settings-service';
import { auditService } from './audit-service';

export class AdminRoutes {
  // Dashboard routes
  static async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminDashboardService.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  }

  static async getSalesData(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as 'today' | 'week' | 'month' | 'year' || 'week';
      const salesData = await adminDashboardService.getSalesData(period);
      res.json(salesData);
    } catch (error) {
      console.error('Failed to get sales data:', error);
      res.status(500).json({ error: 'Failed to get sales data' });
    }
  }

  static async getUserGrowthStats(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as 'week' | 'month' | 'year' || 'month';
      const growthStats = await adminDashboardService.getUserGrowthStats(period);
      res.json(growthStats);
    } catch (error) {
      console.error('Failed to get user growth stats:', error);
      res.status(500).json({ error: 'Failed to get user growth stats' });
    }
  }

  static async getSystemHealth(req: Request, res: Response): Promise<void> {
    try {
      const health = await adminDashboardService.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Failed to get system health:', error);
      res.status(500).json({ error: 'Failed to get system health' });
    }
  }

  // Inventory routes
  static async getInventory(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const category = req.query.category as string;
      const stockStatus = req.query.stockStatus as 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

      const inventory = await inventoryService.getAllInventory(limit, offset, category, stockStatus);
      res.json(inventory);
    } catch (error) {
      console.error('Failed to get inventory:', error);
      res.status(500).json({ error: 'Failed to get inventory' });
    }
  }

  static async getInventoryStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await inventoryService.getInventoryStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get inventory stats:', error);
      res.status(500).json({ error: 'Failed to get inventory stats' });
    }
  }

  static async getStockAlerts(req: Request, res: Response): Promise<void> {
    try {
      const alerts = await inventoryService.getStockAlerts();
      res.json(alerts);
    } catch (error) {
      console.error('Failed to get stock alerts:', error);
      res.status(500).json({ error: 'Failed to get stock alerts' });
    }
  }

  static async updateStock(req: Request, res: Response): Promise<void> {
    try {
      const { productId, newStock, movementType, quantity, reason, unitCost, referenceId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const movement = await inventoryService.updateStock(
        productId,
        newStock,
        movementType,
        quantity,
        reason,
        userId,
        referenceId,
        unitCost
      );

      await auditService.logUpdate('products', productId, userId, req.ip, req.get('user-agent'));

      res.json(movement);
    } catch (error) {
      console.error('Failed to update stock:', error);
      res.status(500).json({ error: 'Failed to update stock' });
    }
  }

  static async getInventoryReport(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as 'json' | 'csv' || 'json';
      const report = await inventoryService.generateInventoryReport(format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory-report.json');
      }
      
      res.send(report);
    } catch (error) {
      console.error('Failed to generate inventory report:', error);
      res.status(500).json({ error: 'Failed to generate inventory report' });
    }
  }

  // User management routes
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const role = req.query.role as string;
      const status = req.query.status as 'all' | 'active' | 'inactive';
      const search = req.query.search as string;

      const users = await adminUserService.getAllUsers(limit, offset, role, status, search);
      res.json(users);
    } catch (error) {
      console.error('Failed to get users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  }

  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await adminUserService.getUserStats();
      res.json(stats);
    } catch (error) {
      console.error('Failed to get user stats:', error);
      res.status(500).json({ error: 'Failed to get user stats' });
    }
  }

  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = req.body;
      const user = await adminUserService.createUser(userData);
      await auditService.logInsert('users', user.id, req.user?.id, req.ip, req.get('user-agent'));
      res.status(201).json(user);
    } catch (error) {
      console.error('Failed to create user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await adminUserService.updateUser(id, updates, updatedBy);
      await auditService.logUpdate('users', id, updatedBy, req.ip, req.get('user-agent'));
      res.json(user);
    } catch (error) {
      console.error('Failed to update user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deletedBy = req.user?.id;

      if (!deletedBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await adminUserService.softDeleteUser(id, deletedBy);
      await auditService.logDelete('users', id, deletedBy, req.ip, req.get('user-agent'));
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async restoreUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const restoredBy = req.user?.id;

      if (!restoredBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await adminUserService.restoreUser(id, restoredBy);
      await auditService.logRestore('users', id, restoredBy, req.ip, req.get('user-agent'));
      res.json(user);
    } catch (error) {
      console.error('Failed to restore user:', error);
      res.status(500).json({ error: 'Failed to restore user' });
    }
  }

  static async getUserActivity(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      
      const activity = await adminUserService.getUserActivity(id, days);
      res.json(activity);
    } catch (error) {
      console.error('Failed to get user activity:', error);
      res.status(500).json({ error: 'Failed to get user activity' });
    }
  }

  static async exportUsers(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as 'json' | 'csv' || 'json';
      const role = req.query.role as string;
      const status = req.query.status as 'all' | 'active' | 'inactive';
      const dateRange = req.query.dateRange ? JSON.parse(req.query.dateRange as string) : undefined;

      const exportData = await adminUserService.exportUsers(format, role, status, dateRange);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=users-export.json');
      }
      
      res.send(exportData);
    } catch (error) {
      console.error('Failed to export users:', error);
      res.status(500).json({ error: 'Failed to export users' });
    }
  }

  // Settings routes
  static async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const isPublic = req.query.public === 'true';
      const settings = await adminSettingsService.getAllSettings(isPublic);
      res.json(settings);
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  }

  static async getSettingsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const settings = await adminSettingsService.getSettingsByCategory(category);
      res.json(settings);
    } catch (error) {
      console.error('Failed to get settings by category:', error);
      res.status(500).json({ error: 'Failed to get settings by category' });
    }
  }

  static async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const updatedBy = req.user?.id;

      if (!updatedBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const setting = await adminSettingsService.updateSetting(key, value, updatedBy);
      res.json(setting);
    } catch (error) {
      console.error('Failed to update setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }

  static async createSetting(req: Request, res: Response): Promise<void> {
    try {
      const settingData = req.body;
      const createdBy = req.user?.id;

      const setting = await adminSettingsService.createSetting(settingData, createdBy);
      res.status(201).json(setting);
    } catch (error) {
      console.error('Failed to create setting:', error);
      res.status(500).json({ error: 'Failed to create setting' });
    }
  }

  static async deleteSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const deletedBy = req.user?.id;

      if (!deletedBy) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      await adminSettingsService.deleteSetting(key, deletedBy);
      res.status(204).send();
    } catch (error) {
      console.error('Failed to delete setting:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  }

  static async getPaymentSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await adminSettingsService.getPaymentSettings();
      res.json(settings);
    } catch (error) {
      console.error('Failed to get payment settings:', error);
      res.status(500).json({ error: 'Failed to get payment settings' });
    }
  }

  static async getSecuritySettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await adminSettingsService.getSecuritySettings();
      res.json(settings);
    } catch (error) {
      console.error('Failed to get security settings:', error);
      res.status(500).json({ error: 'Failed to get security settings' });
    }
  }

  static async getNotificationSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await adminSettingsService.getNotificationSettings();
      res.json(settings);
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      res.status(500).json({ error: 'Failed to get notification settings' });
    }
  }

  static async getGeneralSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await adminSettingsService.getGeneralSettings();
      res.json(settings);
    } catch (error) {
      console.error('Failed to get general settings:', error);
      res.status(500).json({ error: 'Failed to get general settings' });
    }
  }

  static async exportSettings(req: Request, res: Response): Promise<void> {
    try {
      const format = req.query.format as 'json' | 'csv' || 'json';
      const exportData = await adminSettingsService.exportSettings(format);
      
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=settings-export.csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=settings-export.json');
      }
      
      res.send(exportData);
    } catch (error) {
      console.error('Failed to export settings:', error);
      res.status(500).json({ error: 'Failed to export settings' });
    }
  }

  static async resetSettings(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.body;
      const resetCount = await adminSettingsService.resetToDefaults(category);
      res.json({ resetCount });
    } catch (error) {
      console.error('Failed to reset settings:', error);
      res.status(500).json({ error: 'Failed to reset settings' });
    }
  }
}

export default AdminRoutes;
