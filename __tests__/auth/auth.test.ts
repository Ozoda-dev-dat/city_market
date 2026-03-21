import { authService } from '../../server/auth-service';
import ErrorHandler from '../../server/error-handler';

describe('Authentication Service', () => {
  describe('Password Security', () => {
    test('should hash password securely', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await authService.hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBe(60); // bcrypt hash length
    });

    test('should verify password correctly', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await authService.hashPassword(password);
      
      const isValid = await authService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('should reject weak passwords', async () => {
      const weakPassword = '12345678';
      
      try {
        await authService.hashPassword(weakPassword);
        fail('Should have thrown an error for weak password');
      } catch (error) {
        expect(error.message).toContain('Password must be at least 8 characters');
      }
    });

    test('should validate password strength', async () => {
      const weakPasswords = [
        'short',
        'nouppercase',
        '12345678',
        'password',
        'PASSWORD'
      ];

      for (const weakPassword of weakPasswords) {
        try {
          await authService.hashPassword(weakPassword);
          fail(`Should have rejected weak password: ${weakPassword}`);
        } catch (error) {
          expect(error.message).toContain('Password must be at least 8 characters');
        }
      }
    });
  });

  describe('User Registration', () => {
    test('should register new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        email: 'john@example.com',
        role: 'customer'
      };

      const result = await authService.register(userData);

      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined(); // Password should not be returned
      expect(result.user.name).toBe(userData.name);
      expect(result.user.phoneNumber).toBe(userData.phoneNumber);
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe(userData.role);
      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    test('should reject duplicate phone numbers', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      // First registration should succeed
      await authService.register(userData);

      // Second registration with same phone number should fail
      try {
        await authService.register(userData);
        fail('Should have thrown an error for duplicate phone number');
      } catch (error) {
        expect(error.message).toContain('already exists');
      }
    });

    test('should validate registration data', async () => {
      const invalidData = {
        name: '', // Empty name
        phoneNumber: 'invalid', // Invalid phone number
        password: 'weak', // Weak password
        role: 'invalid' // Invalid role
      };

      // Test each validation rule
      try {
        await authService.register(invalidData);
        fail('Should have thrown an error for invalid data');
      } catch (error) {
        expect(error.message).toContain('at least 2 characters long');
      }
    });
  });

  describe('User Login', () => {
    test('should login with valid credentials', async () => {
      // First register a user
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const registerResult = await authService.register(userData);

      // Now login with the same credentials
      const loginCredentials = {
        phoneNumber: userData.phoneNumber,
        password: userData.password
      };

      const loginResult = await authService.login(loginCredentials);

      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.id).toBe(registerResult.user.id);
      expect(loginResult.user.name).toBe(userData.name);
      expect(loginResult.user.phoneNumber).toBe(userData.phoneNumber);
      expect(loginResult.token).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const invalidCredentials = {
        phoneNumber: '+998901234567',
        password: 'wrongpassword'
      };

      try {
        await authService.login(invalidCredentials);
        fail('Should have thrown an error for invalid credentials');
      } catch (error) {
        expect(error.message).toContain('Invalid credentials');
      }
    });

    test('should reject login attempts for inactive users', async () => {
      // Register a user
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const registerResult = await authService.register(userData);

      // Manually deactivate user (simulated)
      // In a real app, this would be done via the database

      try {
        await authService.login({
          phoneNumber: userData.phoneNumber,
          password: userData.password
        });
        fail('Should have thrown an error for inactive user');
      } catch (error) {
        expect(error.message).toContain('Invalid credentials');
      }
    });
  });

  describe('Token Management', () => {
    test('should generate valid JWT tokens', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const result = await authService.register(userData);

      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should verify JWT tokens correctly', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const result = await authService.register(userData);

      const decoded = authService.verifyToken(result.token);

      expect(decoded.userId).toBe(userData.id);
      expect(decoded.phoneNumber).toBe(userData.phoneNumber);
      expect(decoded.role).toBe(userData.role);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });

    test('should reject invalid tokens', async () => {
      try {
        authService.verifyToken('invalid.token.here');
        fail('Should have thrown an error for invalid token');
      } catch (error) {
        expect(error.message).toContain('Invalid or expired token');
      }
    });

    test('should refresh tokens successfully', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const result = await authService.register(userData);
      const originalToken = result.token;

      // Refresh the token
      const refreshResult = await authService.refreshToken(result.refreshToken);

      expect(refreshResult.token).toBeDefined();
      expect(refreshResult.refreshToken).toBeDefined();
      expect(refreshResult.token).not.toBe(originalToken);
    });

    test('should reject invalid refresh tokens', async () => {
      try {
        await authService.refreshToken('invalid.refresh.token');
        fail('Should have thrown an error for invalid refresh token');
      } catch (error) {
        expect(error.message).toContain('Invalid or expired refresh token');
      }
    });
  });

  describe('Password Management', () => {
    test('should change password successfully', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const registerResult = await authService.register(userData);

      // Change password
      await authService.changePassword(
        registerResult.user.id,
        'SecurePass123!',
        'NewSecurePass456!'
      );

      // Verify new password works
      const loginResult = await authService.login({
        phoneNumber: userData.phoneNumber,
        password: 'NewSecurePass456!'
      });

      expect(loginResult.user.id).toBe(registerResult.user.id);
    });

    test('should reject password change with wrong current password', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const registerResult = await authService.register(userData);

      try {
        await authService.changePassword(
          registerResult.user.id,
          'wrongpassword',
          'NewSecurePass456!'
        );
        fail('Should have thrown an error for wrong current password');
      } catch (error) {
        expect(error.message).toContain('Current password is incorrect');
      }
    });

    test('should validate new password strength', async () => {
      const userData = {
        name: 'John Doe',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      const registerResult = await authService.register(userData);

      try {
        await authService.changePassword(
          registerResult.user.id,
          'weak',
          ''
        );
        fail('Should have thrown an error for weak password');
      } catch (error) {
        expect(error.message).toContain('must be at least 8 characters');
      }
    });
  });

  describe('Permission System', () => {
    test('should check user permissions correctly', async () => {
      const adminUser = {
        id: 'admin-user-id',
        phoneNumber: '+998901234567',
        role: 'admin'
      };

      const customerUser = {
        id: 'customer-user-id',
        phoneNumber: '+998901234568',
        role: 'customer'
      };

      // Admin should have all permissions
      const adminPermissions = [
        'user.create', 'user.read', 'user.update', 'user.delete',
        'product.create', 'product.read', 'product.update', 'product.delete',
        'order.create', 'order.read', 'order.update', 'order.delete',
        'settings.manage'
      ];

      for (const permission of adminPermissions) {
        const hasPermission = await authService.hasPermission(adminUser.id, permission);
        expect(hasPermission).toBe(true);
      }

      // Customer should have limited permissions
      const customerPermissions = [
        'order.create', 'order.read', 'order.update',
        'product.read', 'category.read',
        'review.create', 'review.read',
        'wishlist.read', 'wishlist.manage',
        'profile.read', 'profile.update'
      ];

      for (const permission of customerPermissions) {
        const hasPermission = await authService.hasPermission(customerUser.id, permission);
        expect(hasPermission).toBe(true);
      }
    });

    test('should reject unauthorized access', async () => {
      const customerUser = {
        id: 'customer-user-id',
        phoneNumber: '+9981234568',
        role: 'customer'
      };

      // Customer should not have admin permissions
      const adminPermissions = [
        'user.delete', 'product.delete', 'settings.manage'
      ];

      for (const permission of adminPermissions) {
        const hasPermission = await authService.hasPermission(customerUser.id, permission);
        expect(hasPermission).toBe(false);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors', async () => {
      const invalidData = {
        name: '',
        phoneNumber: 'invalid',
        password: 'weak',
        role: 'invalid'
      };

      try {
        await authService.register(invalidData);
        fail('Should have thrown a validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('at least 2 characters long');
      }
    });

    test('should handle database connection errors', async () => {
      // Mock database error
      const originalConnect = postgres;
      postgres = jest.fn(() => {
        throw new Error('Database connection failed');
      });

      try {
        // This would typically fail with a database error
        const auth = new AuthService();
        await auth.register({
          name: 'Test User',
          phoneNumber: '+998901234567',
          password: 'SecurePass123!',
          role: 'customer'
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('DATABASE_URL is not set');
      }

      // Restore original connection
      postgres = originalConnect;
    });

    test('should log errors securely', async () => {
      const userData = {
        name: 'Test User',
        phoneNumber: '+998901234567',
        password: 'SecurePass123!',
        role: 'customer'
      };

      // This would log the error without sensitive data
      try {
        await authService.register(userData);
      } catch (error) {
        // Error should be logged without password or sensitive data
        expect(error.message).toBeDefined();
        expect(error.stack).toBeDefined();
      }
    });
  });
});

export default AuthRoutes;
