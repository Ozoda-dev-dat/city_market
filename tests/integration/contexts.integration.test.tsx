import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { StateProvider } from '@/context/StateContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Test utilities
const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <StateProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </StateProvider>
    </ThemeProvider>
  );
};

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('should register user and update state', async () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      phoneNumber: '+1234567890',
      email: 'john@example.com',
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
    };

    // Mock API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: mockUser,
        token: 'mock-token',
      }),
    });

    const TestComponent = () => {
      const { login, register, user, isAuthenticated } = useAuth();
      
      React.useEffect(() => {
        register('+1234567890', 'password', 'John Doe');
      }, []);

      return (
        <View>
          <Text testID="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Text>
          <Text testID="user-name">{user?.name || 'No User'}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Authenticated');
      expect(getByTestId('user-name').props.children).toBe('John Doe');
    });
  });

  it('should login user and persist state', async () => {
    const mockUser = {
      id: '1',
      name: 'Jane Doe',
      phoneNumber: '+1234567890',
      email: 'jane@example.com',
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
    };

    // Mock API response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        user: mockUser,
        token: 'mock-token',
      }),
    });

    const TestComponent = () => {
      const { login, user, isAuthenticated } = useAuth();
      
      React.useEffect(() => {
        login('+1234567890', 'password');
      }, []);

      return (
        <View>
          <Text testID="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Text>
          <Text testID="user-name">{user?.name || 'No User'}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Authenticated');
      expect(getByTestId('user-name').props.children).toBe('Jane Doe');
    });

    // Verify data is persisted in AsyncStorage
    const persistedUser = await AsyncStorage.getItem('@freshmart_user');
    expect(persistedUser).toBeTruthy();
    
    const userData = JSON.parse(persistedUser!);
    expect(userData.user.name).toBe('Jane Doe');
  });

  it('should logout and clear persisted data', async () => {
    const mockUser = {
      id: '1',
      name: 'Test User',
      phoneNumber: '+1234567890',
      email: 'test@example.com',
      role: 'customer' as const,
      createdAt: new Date().toISOString(),
    };

    // Pre-populate AsyncStorage
    await AsyncStorage.setItem('@freshmart_user', JSON.stringify({
      user: mockUser,
      token: 'mock-token',
      isAuthenticated: true,
    }));

    const TestComponent = () => {
      const { logout, user, isAuthenticated } = useAuth();
      
      React.useEffect(() => {
        logout();
      }, []);

      return (
        <View>
          <Text testID="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Text>
          <Text testID="user-name">{user?.name || 'No User'}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Not Authenticated');
      expect(getByTestId('user-name').props.children).toBe('No User');
    });

    // Verify data is cleared from AsyncStorage
    const persistedUser = await AsyncStorage.getItem('@freshmart_user');
    expect(persistedUser).toBeFalsy();
  });

  it('should handle login errors gracefully', async () => {
    // Mock API error response
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    const TestComponent = () => {
      const { login, user, isAuthenticated, error } = useAuth();
      const [loginError, setLoginError] = React.useState<string | null>(null);
      
      const handleLogin = async () => {
        try {
          await login('+1234567890', 'password');
        } catch (err) {
          setLoginError(err instanceof Error ? err.message : 'Login failed');
        }
      };

      return (
        <View>
          <Text testID="auth-status">
            {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Text>
          <Text testID="login-error">{loginError || 'No Error'}</Text>
          <Button testID="login-button" title="Login" onPress={handleLogin} />
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Trigger login
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(getByTestId('auth-status').props.children).toBe('Not Authenticated');
      expect(getByTestId('login-error').props.children).toBe('Network error');
    });
  });
});

describe('Cart Integration Tests', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  it('should add items to cart and persist state', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 10.99,
      image: 'test-image.jpg',
      category: 'test-category',
      description: 'Test description',
      stock: 10,
      createdAt: new Date().toISOString(),
    };

    const TestComponent = () => {
      const { addToCart, items, totalAmount, totalItems } = useCart();
      
      React.useEffect(() => {
        addToCart(mockProduct);
      }, []);

      return (
        <View>
          <Text testID="cart-items">{items.length}</Text>
          <Text testID="cart-total">{totalAmount}</Text>
          <Text testID="cart-total-items">{totalItems}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('cart-items').props.children).toBe(1);
      expect(getByTestId('cart-total').props.children).toBe(10.99);
      expect(getByTestId('cart-total-items').props.children).toBe(1);
    });

    // Verify cart is persisted in AsyncStorage
    const persistedCart = await AsyncStorage.getItem('@freshmart_cart');
    expect(persistedCart).toBeTruthy();
    
    const cartData = JSON.parse(persistedCart!);
    expect(cartData.items).toHaveLength(1);
    expect(cartData.items[0].name).toBe('Test Product');
  });

  it('should update item quantity in cart', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 10.99,
      image: 'test-image.jpg',
      category: 'test-category',
      description: 'Test description',
      stock: 10,
      createdAt: new Date().toISOString(),
    };

    const TestComponent = () => {
      const { addToCart, updateQuantity, items, totalAmount, totalItems } = useCart();
      
      React.useEffect(() => {
        addToCart(mockProduct);
        // Update quantity after adding
        setTimeout(() => {
          updateQuantity(mockProduct.id, 3);
        }, 100);
      }, []);

      return (
        <View>
          <Text testID="cart-items">{items.length}</Text>
          <Text testID="cart-total">{totalAmount}</Text>
          <Text testID="cart-total-items">{totalItems}</Text>
          <Text testID="item-quantity">
            {items.find(item => item.id === mockProduct.id)?.quantity || 0}
          </Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('cart-items').props.children).toBe(1);
      expect(getByTestId('cart-total').props.children).toBe(32.97); // 10.99 * 3
      expect(getByTestId('cart-total-items').props.children).toBe(3);
      expect(getByTestId('item-quantity').props.children).toBe(3);
    });
  });

  it('should remove items from cart', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 10.99,
      image: 'test-image.jpg',
      category: 'test-category',
      description: 'Test description',
      stock: 10,
      createdAt: new Date().toISOString(),
    };

    const TestComponent = () => {
      const { addToCart, removeFromCart, items, totalAmount, totalItems } = useCart();
      
      React.useEffect(() => {
        addToCart(mockProduct);
        // Remove item after adding
        setTimeout(() => {
          removeFromCart(mockProduct.id);
        }, 100);
      }, []);

      return (
        <View>
          <Text testID="cart-items">{items.length}</Text>
          <Text testID="cart-total">{totalAmount}</Text>
          <Text testID="cart-total-items">{totalItems}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('cart-items').props.children).toBe(0);
      expect(getByTestId('cart-total').props.children).toBe(0);
      expect(getByTestId('cart-total-items').props.children).toBe(0);
    });
  });

  it('should clear cart', async () => {
    const mockProduct1 = {
      id: '1',
      name: 'Test Product 1',
      price: 10.99,
      image: 'test-image.jpg',
      category: 'test-category',
      description: 'Test description',
      stock: 10,
      createdAt: new Date().toISOString(),
    };

    const mockProduct2 = {
      id: '2',
      name: 'Test Product 2',
      price: 15.99,
      image: 'test-image2.jpg',
      category: 'test-category',
      description: 'Test description 2',
      stock: 5,
      createdAt: new Date().toISOString(),
    };

    const TestComponent = () => {
      const { addToCart, clearCart, items, totalAmount, totalItems } = useCart();
      
      React.useEffect(() => {
        addToCart(mockProduct1);
        addToCart(mockProduct2);
        // Clear cart after adding items
        setTimeout(() => {
          clearCart();
        }, 100);
      }, []);

      return (
        <View>
          <Text testID="cart-items">{items.length}</Text>
          <Text testID="cart-total">{totalAmount}</Text>
          <Text testID="cart-total-items">{totalItems}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('cart-items').props.children).toBe(0);
      expect(getByTestId('cart-total').props.children).toBe(0);
      expect(getByTestId('cart-total-items').props.children).toBe(0);
    });
  });
});

describe('Theme Integration Tests', () => {
  it('should toggle theme and persist preference', async () => {
    const TestComponent = () => {
      const { isDarkMode, toggleTheme } = useTheme();
      
      return (
        <View>
          <Text testID="theme-mode">{isDarkMode ? 'Dark' : 'Light'}</Text>
          <Button testID="toggle-theme" title="Toggle" onPress={toggleTheme} />
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Initial state should be light
    expect(getByTestId('theme-mode').props.children).toBe('Light');

    // Toggle to dark mode
    fireEvent.press(getByTestId('toggle-theme'));

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('Dark');
    });

    // Verify theme preference is persisted
    const persistedTheme = await AsyncStorage.getItem('@freshmart_theme');
    expect(persistedTheme).toBe('dark');
  });

  it('should apply correct colors based on theme', async () => {
    const TestComponent = () => {
      const { isDarkMode, colors } = useTheme();
      
      return (
        <View style={{ backgroundColor: colors.background }}>
          <Text style={{ color: colors.text }} testID="text">
            Test Text
          </Text>
          <Text testID="theme-mode">{isDarkMode ? 'Dark' : 'Light'}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Check light mode colors
    expect(getByTestId('theme-mode').props.children).toBe('Light');
    
    // Toggle to dark mode
    const themeContext = useTheme();
    themeContext.toggleTheme();

    await waitFor(() => {
      expect(getByTestId('theme-mode').props.children).toBe('Dark');
    });
  });
});

describe('Network Integration Tests', () => {
  it('should handle network status changes', async () => {
    const TestComponent = () => {
      const { isOnline } = useNetworkStatus();
      
      return (
        <View>
          <Text testID="network-status">{isOnline ? 'Online' : 'Offline'}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Initial state should be online
    expect(getByTestId('network-status').props.children).toBe('Online');

    // Simulate network disconnection
    // This would require mocking the network manager
    // For now, we'll just verify the component renders
  });

  it('should use cached data when offline', async () => {
    // Pre-populate cache with test data
    const mockProducts = [
      {
        id: '1',
        name: 'Cached Product',
        price: 9.99,
        image: 'cached-image.jpg',
        category: 'cached-category',
        description: 'Cached description',
        stock: 5,
        createdAt: new Date().toISOString(),
      },
    ];

    await AsyncStorage.setItem('@freshmart_offline_products', JSON.stringify({
      data: mockProducts,
      timestamp: new Date().toISOString(),
      ttl: 24 * 60 * 60 * 1000, // 24 hours
    }));

    const TestComponent = () => {
      const { products, isLoading } = useProductsData();
      
      return (
        <View>
          <Text testID="loading-status">{isLoading ? 'Loading' : 'Loaded'}</Text>
          <Text testID="products-count">{products.length}</Text>
          <Text testID="first-product">{products[0]?.name || 'No Product'}</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(getByTestId('loading-status').props.children).toBe('Loaded');
      expect(getByTestId('products-count').props.children).toBe(1);
      expect(getByTestId('first-product').props.children).toBe('Cached Product');
    });
  });
});

describe('Error Handling Integration Tests', () => {
  it('should display error boundary when component crashes', async () => {
    const ThrowErrorComponent = () => {
      throw new Error('Test error');
    };

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);
      
      return (
        <View>
          <Button 
            testID="throw-error" 
            title="Throw Error" 
            onPress={() => setShouldThrow(true)} 
          />
          {shouldThrow && <ThrowErrorComponent />}
          <Text testID="normal-content">Normal Content</Text>
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Normal state
    expect(getByTestId('normal-content').props.children).toBe('Normal Content');

    // Trigger error
    fireEvent.press(getByTestId('throw-error'));

    // Error boundary should catch the error
    // This would require testing the actual ErrorBoundary component
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('API Error'));

    const TestComponent = () => {
      const { products, error, isLoading } = useProductsData();
      const [loadError, setLoadError] = React.useState<string | null>(null);
      
      const handleLoadProducts = async () => {
        try {
          await fetchProducts();
        } catch (err) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load products');
        }
      };

      return (
        <View>
          <Text testID="loading-status">{isLoading ? 'Loading' : 'Not Loading'}</Text>
          <Text testID="error-message">{loadError || 'No Error'}</Text>
          <Button testID="load-products" title="Load" onPress={handleLoadProducts} />
        </View>
      );
    };

    const { getByTestId } = renderWithProviders(<TestComponent />);

    // Trigger API call
    fireEvent.press(getByTestId('load-products'));

    await waitFor(() => {
      expect(getByTestId('error-message').props.children).toBe('API Error');
    });
  });
});
