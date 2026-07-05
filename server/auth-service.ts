import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, and, isNull } from "drizzle-orm";
import postgres from "postgres";
import * as schema from "../shared/schema";
import { sendSms } from "./sms-service";

export interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface RegisterData {
  name: string;
  phoneNumber: string;
  password: string;
  email?: string;
  address?: string;
  role?: string;
}

export interface JWTPayload {
  userId: string;
  phoneNumber: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthResult {
  user: Omit<schema.User, 'password'>;
  token: string;
  refreshToken: string;
}

export class AuthService {
  private db: ReturnType<typeof drizzle> | null = null;
  private jwtSecret: string | null = null;
  private jwtRefreshSecret: string | null = null;
  private saltRounds: number = 12;

  constructor() {}

  private getDb() {
    if (this.db) return this.db;
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    const client = postgres(process.env.DATABASE_URL);
    this.db = drizzle(client, { schema });
    return this.db;
  }

  private getJwtSecret() {
    if (this.jwtSecret) return this.jwtSecret;
    const secret = process.env.JWT_SECRET || process.env.SESSION_SECRET || "default-jwt-secret-change-in-prod";
    this.jwtSecret = secret;
    return secret;
  }

  private getJwtRefreshSecret() {
    if (this.jwtRefreshSecret) return this.jwtRefreshSecret;
    const secret = process.env.JWT_REFRESH_SECRET || process.env.SESSION_SECRET || "default-refresh-secret-change-in-prod";
    this.jwtRefreshSecret = secret;
    return secret;
  }

  // Password hashing
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      console.error('Failed to hash password:', error);
      throw new Error('Password hashing failed');
    }
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Failed to verify password:', error);
      throw new Error('Password verification failed');
    }
  }

  // User registration with secure password hashing
  async register(userData: RegisterData): Promise<AuthResult> {
    try {
      // Validate input
      this.validateRegisterData(userData);

      // Check if user already exists
      const existingUser = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.phoneNumber, userData.phoneNumber))
        .limit(1);

      if (existingUser[0]) {
        throw new Error('User with this phone number already exists');
      }

      // Hash password securely
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user with hashed password
      const result = await this.db
        .insert(schema.users)
        .values({
          name: userData.name,
          phoneNumber: userData.phoneNumber,
          password: hashedPassword,
          email: userData.email,
          address: userData.address,
          role: userData.role || 'customer',
          isActive: true,
        })
        .returning();

      const user = result[0];

      // Remove password from user object before returning
      const { password, ...userWithoutPassword } = user;

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Log registration (without sensitive data)
      await this.logUserAction('register', user.id, {
        phoneNumber: userData.phoneNumber,
        role: userData.role || 'customer'
      });

      // Send the account password via SMS so the user has a copy of it
      sendSms(
        userData.phoneNumber,
        `City Market: sizning hisobingiz yaratildi. Telefon: ${userData.phoneNumber}, parol: ${userData.password}`
      ).catch((err) => {
        console.error('Failed to send registration SMS:', err);
      });

      return {
        user: userWithoutPassword,
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  // User login with secure password verification
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Validate input
      this.validateLoginCredentials(credentials);

      // Find user by phone number
      const user = await this.db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.phoneNumber, credentials.phoneNumber),
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt)
        ))
        .limit(1);

      if (!user[0]) {
        throw new Error('Invalid credentials');
      }

      // Verify password securely
      const isValidPassword = await this.verifyPassword(credentials.password, user[0].password);
      
      if (!isValidPassword) {
        // Log failed login attempt (without password)
        await this.logUserAction('login_failed', user[0].id, {
          phoneNumber: credentials.phoneNumber,
          reason: 'invalid_password'
        });
        throw new Error('Invalid credentials');
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user[0];

      // Generate tokens
      const token = this.generateToken(user[0]);
      const refreshToken = this.generateRefreshToken(user[0]);

      // Log successful login
      await this.logUserAction('login_success', user[0].id, {
        phoneNumber: credentials.phoneNumber
      });

      return {
        user: userWithoutPassword,
        token,
        refreshToken
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // JWT token generation
  private generateToken(user: schema.User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role
    };

    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: '1h', // Short-lived access token
      issuer: 'supermarket-go',
      audience: 'supermarket-go-users'
    });
  }

  private generateRefreshToken(user: schema.User): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      role: user.role
    };

    return jwt.sign(payload, this.getJwtRefreshSecret(), {
      expiresIn: '7d', // Longer-lived refresh token
      issuer: 'supermarket-go',
      audience: 'supermarket-go-users'
    });
  }

  // Token verification
  verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.getJwtSecret(), {
        issuer: 'supermarket-go',
        audience: 'supermarket-go-users'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  verifyRefreshToken(refreshToken: string): JWTPayload {
    try {
      const decoded = jwt.verify(refreshToken, this.getJwtRefreshSecret(), {
        issuer: 'supermarket-go',
        audience: 'supermarket-go-users'
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
    }
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Get user from database
      const user = await this.db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.id, decoded.userId),
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt)
        ))
        .limit(1);

      if (!user[0]) {
        throw new Error('User not found or inactive');
      }

      // Generate new tokens
      const newToken = this.generateToken(user[0]);
      const newRefreshToken = this.generateRefreshToken(user[0]);

      // Log token refresh
      await this.logUserAction('token_refresh', user[0].id);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Password change
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Validate new password
      this.validatePassword(newPassword);

      // Get user
      const user = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!user[0]) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValidPassword = await this.verifyPassword(currentPassword, user[0].password);
      
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await this.db
        .update(schema.users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, userId));

      // Log password change
      await this.logUserAction('password_changed', userId);
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  // Password reset request
  async requestPasswordReset(phoneNumber: string): Promise<void> {
    try {
      // Find user
      const user = await this.db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.phoneNumber, phoneNumber),
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt)
        ))
        .limit(1);

      if (!user[0]) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate reset token (in production, you'd send this via SMS/email)
      const resetToken = this.generatePasswordResetToken(user[0]);

      // Log password reset request
      await this.logUserAction('password_reset_requested', user[0].id, {
        phoneNumber
      });

      // In production, send reset token via SMS/email
      console.log(`Password reset token for ${phoneNumber}: ${resetToken}`);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  private generatePasswordResetToken(user: schema.User): string {
    const payload = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      type: 'password_reset'
    };

    return jwt.sign(payload, this.getJwtSecret(), {
      expiresIn: '1h',
      issuer: 'supermarket-go'
    });
  }

  // Input validation methods
  private validateRegisterData(data: RegisterData): void {
    if (!data.name || data.name.length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }

    if (!data.phoneNumber || !this.isValidPhoneNumber(data.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    if (data.email && !this.isValidEmail(data.email)) {
      throw new Error('Invalid email format');
    }

    if (data.role && !['admin', 'courier', 'customer'].includes(data.role)) {
      throw new Error('Invalid role specified');
    }
  }

  private validateLoginCredentials(credentials: LoginCredentials): void {
    if (!credentials.phoneNumber || !this.isValidPhoneNumber(credentials.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }

    if (!credentials.password) {
      throw new Error('Password is required');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
  }

  private isStrongPassword(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Uzbekistan phone number validation
    const phoneRegex = /^\+998\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Secure logging (without sensitive data)
  private async logUserAction(action: string, userId: string, metadata?: any): Promise<void> {
    try {
      // Remove sensitive data from metadata
      const sanitizedMetadata = metadata ? {
        ...metadata,
        password: undefined,
        token: undefined
      } : {};

      await this.getDb().insert(schema.systemLogs).values({
        level: 'info',
        message: `User action: ${action}`,
        context: sanitizedMetadata,
        userId,
        module: 'auth',
        action,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Failed to log user action:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  // Logout
  async logout(userId: string): Promise<void> {
    try {
      // Log logout
      await this.logUserAction('logout', userId);
      
      // In production, you might want to invalidate the token in a blacklist
      // For now, we just log the action
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Get user by ID (without password)
  async getUserById(userId: string): Promise<Omit<schema.User, 'password'> | null> {
    try {
      const user = await this.db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.id, userId),
          eq(schema.users.isActive, true),
          isNull(schema.users.deletedAt)
        ))
        .limit(1);

      if (!user[0]) {
        return null;
      }

      const { password, ...userWithoutPassword } = user[0];
      return userWithoutPassword;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      return null;
    }
  }

  // Check if user has permission
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      
      if (!user) {
        return false;
      }

      const rolePermissions = this.getRolePermissions(user.role);
      return rolePermissions.includes(permission);
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  private getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'product.create', 'product.read', 'product.update', 'product.delete',
        'order.create', 'order.read', 'order.update', 'order.delete',
        'category.create', 'category.read', 'category.update', 'category.delete',
        'promo.create', 'promo.read', 'promo.update', 'promo.delete',
        'payment.read', 'payment.process', 'payment.refund',
        'inventory.read', 'inventory.update', 'inventory.manage',
        'analytics.read', 'settings.manage',
        'system.logs'
      ],
      courier: [
        'order.read', 'order.update', 'order.location',
        'analytics.read'
      ],
      customer: [
        'order.create', 'order.read', 'order.update',
        'product.read', 'category.read',
        'review.create', 'review.read',
        'wishlist.read', 'wishlist.manage',
        'profile.read', 'profile.update'
      ]
    };

    return permissions[role] || [];
  }
}

export const authService = new AuthService();
