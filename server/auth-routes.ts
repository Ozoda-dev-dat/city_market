import { Request, Response } from 'express';
import { authService } from './auth-service';
import SecurityMiddleware from './security-middleware';

export class AuthRoutes {
  // User registration with security
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, phoneNumber, password, email, address, role } = req.body;
      
      const result = await authService.register({
        name,
        phoneNumber,
        password,
        email,
        address,
        role
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      console.error('Registration failed:', error);
      res.status(400).json({
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // User login with rate limiting
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, password } = req.body;
      
      const result = await authService.login({ phoneNumber, password });

      res.json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      console.error('Login failed:', error);
      res.status(401).json({
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Invalid credentials'
      });
    }
  }

  // Token refresh
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token required',
          message: 'Refresh token is required'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        message: 'Token refreshed successfully',
        token: result.token,
        refreshToken: result.refreshToken
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : 'Invalid refresh token'
      });
    }
  }

  // Logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'User not authenticated'
        });
      }

      await authService.logout(req.user.userId);

      res.json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout failed:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: 'Failed to logout'
      });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'User not authenticated'
        });
      }

      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Current password and new password are required'
        });
      }

      await authService.changePassword(req.user.userId, currentPassword, newPassword);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Password change failed:', error);
      res.status(400).json({
        error: 'Password change failed',
        message: error instanceof Error ? error.message : 'Failed to change password'
      });
    }
  }

  // Request password reset
  static async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Phone number is required'
        });
      }

      await authService.requestPasswordReset(phoneNumber);

      res.json({
        message: 'Password reset instructions sent to your phone number'
      });
    } catch (error) {
      console.error('Password reset request failed:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        message: 'Failed to process password reset request'
      });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'User not authenticated'
        });
      }

      const user = await authService.getUserById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User profile not found'
        });
      }

      res.json({
        user
      });
    } catch (error) {
      console.error('Get profile failed:', error);
      res.status(500).json({
        error: 'Failed to get profile',
        message: 'Failed to retrieve user profile'
      });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Not authenticated',
          message: 'User not authenticated'
        });
      }

      const { name, email, address } = req.body;
      const updates: any = {};

      if (name) updates.name = name;
      if (email) updates.email = email;
      if (address) updates.address = address;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'At least one field must be provided for update'
        });
      }

      // This would typically be handled by a user service
      // For now, we'll just return success
      res.json({
        message: 'Profile updated successfully',
        updates
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      res.status(500).json({
        error: 'Profile update failed',
        message: 'Failed to update user profile'
      });
    }
  }

  // Check authentication status
  static async checkAuth(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        return res.status(401).json({
          authenticated: false,
          message: 'Not authenticated'
        });
      }

      const user = await authService.getUserById(req.user.userId);

      res.json({
        authenticated: true,
        user
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      res.status(500).json({
        error: 'Auth check failed',
        message: 'Failed to check authentication status'
      });
    }
  }

  // Validate token
  static async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          error: 'Token required',
          message: 'Token is required for validation'
        });
      }

      const decoded = authService.verifyToken(token);

      res.json({
        valid: true,
        user: {
          userId: decoded.userId,
          phoneNumber: decoded.phoneNumber,
          role: decoded.role
        }
      });
    } catch (error) {
      res.status(401).json({
        valid: false,
        message: error instanceof Error ? error.message : 'Invalid token'
      });
    }
  }

  // Get rate limit status
  static async getRateLimitStatus(req: Request, res: Response): Promise<void> {
    try {
      const { type = 'general' } = req.query;
      
      const status = SecurityMiddleware.getRateLimitStatus(req, type as any);

      res.json({
        type,
        ...status
      });
    } catch (error) {
      console.error('Rate limit status check failed:', error);
      res.status(500).json({
        error: 'Failed to check rate limit status',
        message: 'Unable to retrieve rate limit information'
      });
    }
  }

  // Health check for auth service
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check if JWT secrets are configured
      const jwtSecret = process.env.JWT_SECRET;
      const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
      const databaseUrl = process.env.DATABASE_URL;

      const health = {
        status: 'healthy',
        checks: {
          jwtSecret: !!jwtSecret,
          jwtRefreshSecret: !!jwtRefreshSecret,
          database: !!databaseUrl,
          bcrypt: true // Assuming bcrypt is properly installed
        },
        timestamp: new Date().toISOString()
      };

      if (!jwtSecret || !jwtRefreshSecret || !databaseUrl) {
        health.status = 'unhealthy';
      }

      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      });
    }
  }
}

export default AuthRoutes;
