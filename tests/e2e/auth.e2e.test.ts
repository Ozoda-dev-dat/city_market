const { device, element, by, expect } = require('detox');

describe('Authentication E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should allow user to register', async () => {
    // Navigate to registration
    await element(by.id('register-button')).tap();
    
    // Fill registration form
    await element(by.id('name-input')).typeText('John Doe');
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('confirm-password-input')).typeText('password123');
    
    // Submit registration
    await element(by.id('register-submit-button')).tap();
    
    // Verify successful registration
    await expect(element(by.text('Welcome, John Doe'))).toBeVisible();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should allow user to login', async () => {
    // Navigate to login
    await element(by.id('login-button')).tap();
    
    // Fill login form
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    
    // Submit login
    await element(by.id('login-submit-button')).tap();
    
    // Verify successful login
    await expect(element(by.text('Welcome back!'))).toBeVisible();
    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should show error for invalid credentials', async () => {
    // Navigate to login
    await element(by.id('login-button')).tap();
    
    // Fill invalid credentials
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('wrongpassword');
    
    // Submit login
    await element(by.id('login-submit-button')).tap();
    
    // Verify error message
    await expect(element(by.text('Invalid phone number or password'))).toBeVisible();
  });

  it('should allow user to logout', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    
    // Logout
    await element(by.id('logout-button')).tap();
    
    // Confirm logout
    await element(by.id('confirm-logout')).tap();
    
    // Verify logged out
    await expect(element(by.id('login-screen'))).toBeVisible();
  });
});

describe('Shopping Cart E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should add items to cart', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Navigate to products
    await element(by.id('products-tab')).tap();
    
    // Wait for products to load
    await waitFor(element(by.id('product-list')).toBeVisible());
    
    // Add first product to cart
    await element(by.id('product-item-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    
    // Navigate to cart
    await element(by.id('cart-tab')).tap();
    
    // Verify item in cart
    await expect(element(by.id('cart-item-0'))).toBeVisible();
    await expect(element(by.text('1'))).toBeVisible(); // Quantity
  });

  it('should update item quantity', async () => {
    // Add item to cart first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    await element(by.id('product-item-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-tab')).tap();
    
    // Update quantity
    await element(by.id('quantity-increase')).tap();
    await element(by.id('quantity-increase')).tap();
    
    // Verify updated quantity
    await expect(element(by.text('3'))).toBeVisible();
  });

  it('should remove items from cart', async () => {
    // Add item to cart first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    await element(by.id('product-item-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-tab')).tap();
    
    // Remove item
    await element(by.id('remove-item-0')).tap();
    
    // Verify cart is empty
    await expect(element(by.text('Your cart is empty'))).toBeVisible();
  });

  it('should proceed to checkout', async () => {
    // Add items to cart
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    await element(by.id('product-item-0')).tap();
    await element(by.id('add-to-cart-button')).tap();
    await element(by.id('cart-tab')).tap();
    
    // Proceed to checkout
    await element(by.id('checkout-button')).tap();
    
    // Verify checkout screen
    await expect(element(by.id('checkout-screen'))).toBeVisible();
    await expect(element(by.text('Order Summary'))).toBeVisible();
  });
});

describe('Product Browsing E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display product list', async () => {
    // Navigate to products
    await element(by.id('products-tab')).tap();
    
    // Verify products load
    await waitFor(element(by.id('product-list')).toBeVisible();
    await expect(element(by.id('product-item-0'))).toBeVisible();
  });

  it('should search products', async () => {
    // Navigate to products
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    
    // Search for product
    await element(by.id('search-input')).typeText('Apple');
    
    // Verify search results
    await waitFor(element(by.text('Search Results'))).toBeVisible();
    await expect(element(by.id('search-result-0'))).toBeVisible();
  });

  it('should filter products by category', async () => {
    // Navigate to products
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    
    // Open category filter
    await element(by.id('category-filter')).tap();
    
    // Select category
    await element(by.text('Fruits')).tap();
    
    // Verify filtered results
    await expect(element(by.text('Fruits'))).toBeVisible();
  });

  it('should view product details', async () => {
    // Navigate to products
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    
    // Tap on product
    await element(by.id('product-item-0')).tap();
    
    // Verify product details
    await expect(element(by.id('product-details'))).toBeVisible();
    await expect(element(by.id('product-name'))).toBeVisible();
    await expect(element(by.id('product-price'))).toBeVisible();
    await expect(element(by.id('product-description'))).toBeVisible();
  });
});

describe('Profile Management E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should update user profile', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    
    // Edit profile
    await element(by.id('edit-profile-button')).tap();
    
    // Update name
    await element(by.id('name-input')).clearText();
    await element(by.id('name-input')).typeText('Jane Doe');
    
    // Save changes
    await element(by.id('save-profile-button')).tap();
    
    // Verify updated name
    await expect(element(by.text('Jane Doe'))).toBeVisible();
  });

  it('should update user location', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    
    // Update location
    await element(by.id('location-button')).tap();
    await element(by.id('address-input')).typeText('123 Main St, City, State');
    await element(by.id('save-location-button')).tap();
    
    // Verify location updated
    await expect(element(by.text('123 Main St, City, State'))).toBeVisible();
  });

  it('should view order history', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    
    // View order history
    await element(by.id('order-history-button')).tap();
    
    // Verify order history screen
    await expect(element(by.id('order-history'))).toBeVisible();
    await expect(element(by.text('Order History'))).toBeVisible();
  });
});

describe('Error Handling E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should handle network errors gracefully', async () => {
    // Mock network failure
    await device.setNetworkConnection('offline');
    
    // Try to login
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Verify error message
    await expect(element(by.text('No internet connection'))).toBeVisible();
    
    // Restore network
    await device.setNetworkConnection('wifi');
  });

  it('should handle form validation errors', async () => {
    // Navigate to registration
    await element(by.id('register-button')).tap();
    
    // Submit empty form
    await element(by.id('register-submit-button')).tap();
    
    // Verify validation errors
    await expect(element(by.text('Name is required'))).toBeVisible();
    await expect(element(by.text('Phone number is required'))).toBeVisible();
    await expect(element(by.text('Password is required'))).toBeVisible();
  });

  it('should handle server errors gracefully', async () => {
    // Mock server error
    // This would require mocking the API endpoints
    
    // Try to login with valid credentials
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Verify error handling
    // This would depend on the actual API implementation
  });
});

describe('Performance E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should load home screen quickly', async () => {
    const startTime = Date.now();
    
    // Wait for home screen to load
    await waitFor(element(by.id('home-screen'))).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // Verify load time is acceptable (less than 3 seconds)
    expect(loadTime).toBeLessThan(3000);
  });

  it('should handle large product lists efficiently', async () => {
    // Navigate to products
    await element(by.id('products-tab')).tap();
    
    // Wait for products to load
    await waitFor(element(by.id('product-list')).toBeVisible();
    
    // Scroll through list
    await element(by.id('product-list')).scrollTo('bottom');
    
    // Verify scrolling is smooth
    await expect(element(by.id('product-item-49'))).toBeVisible();
  });

  it('should handle cart operations efficiently', async () => {
    // Login first
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).typeText('+1234567890');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-submit-button')).tap();
    
    // Add multiple items to cart
    await element(by.id('products-tab')).tap();
    await waitFor(element(by.id('product-list')).toBeVisible();
    
    const startTime = Date.now();
    
    // Add 5 items
    for (let i = 0; i < 5; i++) {
      await element(by.id(`product-item-${i}`)).tap();
      await element(by.id('add-to-cart-button')).tap();
      await element(by.id('back-button')).tap();
    }
    
    const operationTime = Date.now() - startTime;
    
    // Verify operations are efficient (less than 5 seconds)
    expect(operationTime).toBeLessThan(5000);
    
    // Navigate to cart
    await element(by.id('cart-tab')).tap();
    
    // Verify all items are in cart
    await expect(element(by.id('cart-item-0'))).toBeVisible();
    await expect(element(by.id('cart-item-4'))).toBeVisible();
  });
});

describe('Accessibility E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should have proper accessibility labels', async () => {
    // Verify accessibility labels on login screen
    await expect(element(by.id('login-button')).toHaveLabel('Login'));
    await expect(element(by.id('phone-input')).toHaveLabel('Phone Number'));
    await expect(element(by.id('password-input')).toHaveLabel('Password'));
  });

  it('should support screen reader navigation', async () => {
    // Enable accessibility
    await device.setAccessibilitySettings({
      screenReader: true,
    });
    
    // Navigate through app using screen reader
    await element(by.id('login-button')).tap();
    await element(by.id('phone-input')).tap();
    await element(by.id('password-input')).tap();
    await element(by.id('login-submit-button')).tap();
    
    // Verify screen reader announces actions
    // This would depend on the actual screen reader implementation
  });

  it('should support keyboard navigation', async () => {
    // Enable keyboard navigation
    await device.setAccessibilitySettings({
      keyboardNavigation: true,
    });
    
    // Navigate using keyboard
    await device.pressBack(); // Go back
    await device.pressBack(); // Go back to login
    
    // Verify keyboard focus
    await expect(element(by.id('phone-input'))).toBeFocused();
  });
});
