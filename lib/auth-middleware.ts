import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../lib/jwt';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      rateLimit?: number;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided',
      });
      return;
    }

    const user = verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    
    if (message === 'Token expired') {
      res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    } else if (message === 'Invalid token') {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed',
      });
    } else {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid credentials',
      });
    }
  }
}

/**
 * Role-based authorization middleware
 */
export function authorizeRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Access denied',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = authorizeRole(['admin']);

/**
 * Admin or Courier middleware
 */
export const requireAdminOrCourier = authorizeRole(['admin', 'courier']);

/**
 * Customer-only middleware
 */
export const requireCustomer = authorizeRole(['customer']);

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't block if no token
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      const user = verifyToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Don't block the request, just continue without user
    next();
  }
}

/**
 * Check if user can access their own resource
 */
export function requireOwnership(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required',
    });
    return;
  }

  const requestedUserId = req.params.userId || req.params.id;
  
  if (req.user.role !== 'admin' && req.user.userId !== requestedUserId) {
    res.status(403).json({
      error: 'Access denied',
      message: 'You can only access your own resources',
    });
    return;
  }

  next();
}

/**
 * Rate limiting based on user role
 */
export function createRateLimitByRole(limits: { [key: string]: number }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Default rate limit for unauthenticated users
      req.rateLimit = limits.default || 10;
    } else {
      // Rate limit based on user role
      req.rateLimit = limits[req.user.role] || limits.default || 100;
    }
    
    next();
  };
}

/**
 * API Key authentication middleware (for future use)
 */
export function authenticateApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  const validApiKey = process.env.API_KEY;

  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      error: 'Invalid API key',
      message: 'Authentication failed',
    });
    return;
  }

  next();
}

/**
 * Check if user account is active (for future implementation)
 */
export function requireActiveAccount(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'Access denied',
      message: 'Authentication required',
    });
    return;
  }

  // TODO: Implement account status check
  // For now, we assume all accounts are active
  next();
}
