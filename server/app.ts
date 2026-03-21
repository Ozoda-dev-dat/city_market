import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import SecurityMiddleware from './security-middleware';
import AuthRoutes from './auth-routes';
import AdminRoutes from './admin-routes';
import PaymentWebhooks from './payment-webhooks';

// Environment variables
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const app = express();

// Security middleware
app.use(helmet()); // Security headers
app.use(SecurityMiddleware.cors); // CORS
app.use(SecurityMiddleware.securityHeaders); // Additional security headers
app.use(SecurityMiddleware.requestSizeLimit(10 * 1024 * 1024)); // 10MB limit
app.use(SecurityMiddleware.sanitizeInput); // SQL injection prevention
app.use(SecurityMiddleware.preventXSS); // XSS prevention
app.use(SecurityMiddleware.secureLogging); // Secure logging

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
app.use(SecurityMiddleware.rateLimit('general'));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// Auth routes with rate limiting
app.post('/api/auth/register', 
  SecurityMiddleware.rateLimit('register'),
  SecurityMiddleware.validateInput('phoneNumber', 'phoneNumber'),
  SecurityMiddleware.validateInput('password', 'password'),
  AuthRoutes.register
);

app.post('/api/auth/login', 
  SecurityMiddleware.rateLimit('login'),
  SecurityMiddleware.validateInput('phoneNumber', 'phoneNumber'),
  AuthRoutes.login
);

app.post('/api/auth/refresh', AuthRoutes.refreshToken);
app.post('/api/auth/logout', 
  SecurityMiddleware.authenticateToken,
  AuthRoutes.logout
);

app.post('/api/auth/change-password', 
  SecurityMiddleware.authenticateToken,
  AuthRoutes.changePassword
);

app.post('/api/auth/request-password-reset', 
  SecurityMiddleware.rateLimit('passwordReset'),
  SecurityMiddleware.validateInput('phoneNumber', 'phoneNumber'),
  AuthRoutes.requestPasswordReset
);

app.get('/api/auth/profile', 
  SecurityMiddleware.authenticateToken,
  AuthRoutes.getProfile
);

app.put('/api/auth/profile', 
  SecurityMiddleware.authenticateToken,
  AuthRoutes.updateProfile
);

app.get('/api/auth/check', 
  SecurityMiddleware.authenticateToken,
  AuthRoutes.checkAuth
);

app.post('/api/auth/validate', AuthRoutes.validateToken);
app.get('/api/auth/rate-limit', AuthRoutes.getRateLimitStatus);
app.get('/api/auth/health', AuthRoutes.healthCheck);

// Admin routes with authentication
app.get('/api/admin/dashboard', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('analytics.read'),
  AdminRoutes.getDashboardStats
);

app.get('/api/admin/sales', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('analytics.read'),
  AdminRoutes.getSalesData
);

app.get('/api/admin/users', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.read'),
  AdminRoutes.getUsers
);

app.get('/api/admin/users/stats', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('analytics.read'),
  AdminRoutes.getUserStats
);

app.post('/api/admin/users', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.create'),
  AdminRoutes.createUser
);

app.put('/api/admin/users/:id', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.update'),
  AdminRoutes.updateUser
);

app.delete('/api/admin/users/:id', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.delete'),
  AdminRoutes.deleteUser
);

app.post('/api/admin/users/:id/restore', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.update'),
  AdminRoutes.restoreUser
);

app.get('/api/admin/users/:id/activity', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.read'),
  AdminRoutes.getUserActivity
);

app.get('/api/admin/users/export', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('user.read'),
  AdminRoutes.exportUsers
);

// Inventory routes
app.get('/api/admin/inventory', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('inventory.read'),
  AdminRoutes.getInventory
);

app.get('/api/admin/inventory/stats', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('inventory.read'),
  AdminRoutes.getInventoryStats
);

app.get('/api/admin/inventory/alerts', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('inventory.read'),
  AdminRoutes.getStockAlerts
);

app.put('/api/admin/inventory/update-stock', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('inventory.update'),
  AdminRoutes.updateStock
);

app.get('/api/admin/inventory/report', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('inventory.read'),
  AdminRoutes.getInventoryReport
);

// Settings routes
app.get('/api/admin/settings', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.getSettings
);

app.get('/api/admin/settings/:category', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.getSettingsByCategory
);

app.put('/api/admin/settings/:key', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.updateSetting
);

app.post('/api/admin/settings', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.createSetting
);

app.delete('/api/admin/settings/:key', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.deleteSetting
);

app.get('/api/admin/settings/payment', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.getPaymentSettings
);

app.get('/api/admin/settings/security', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.getSecuritySettings
);

app.get('/api/admin/settings/notifications', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.getNotificationSettings
);

app.get('/api/admin/settings/general', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.getGeneralSettings
);

app.get('/api/admin/settings/export', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.exportSettings
);

app.post('/api/admin/settings/reset', 
  SecurityMiddleware.authenticateToken,
  SecurityMiddleware.requirePermission('settings.manage'),
  AdminRoutes.resetSettings
);

// Payment webhook routes
app.post('/api/webhooks/stripe', 
  SecurityMiddleware.sanitizeInput,
  PaymentWebhooks.handleStripeWebhook
);

app.post('/api/webhooks/paypal', 
  SecurityMiddleware.sanitizeInput,
  PaymentWebhooks.handlePayPalWebhook
);

app.post('/api/webhooks/:provider', 
  SecurityMiddleware.sanitizeInput,
  PaymentWebhooks.handleGenericWebhook
);

// API rate limiting for authenticated routes
app.use('/api', SecurityMiddleware.rateLimit('api'));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Don't expose error details in production
  const isDevelopment = NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${NODE_ENV}`);
  console.log(`🔐 Security middleware enabled`);
  console.log(`📊 Rate limiting enabled`);
  console.log(`🛡️ Secure logging enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
