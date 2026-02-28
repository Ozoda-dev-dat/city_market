# FreshMart - Supermarket App

A full-featured supermarket mobile app inspired by Korzinka Go, built with Expo React Native.

## Architecture

- **Frontend**: Expo Router (file-based routing), React Native, TypeScript
- **Backend**: Express.js (port 5000) — serves API routes and landing page
- **Dev Server**: Expo (port 8081) — mobile and web preview
- **State**: React Context (Cart + Products), AsyncStorage for persistence
- **Fonts**: Poppins (400, 500, 600, 700) via @expo-google-fonts/poppins
- **Icons**: @expo/vector-icons (Ionicons)

## Key Features

### Customer App (4 Tabs)
- **Home** (`app/(tabs)/index.tsx`): Auto-rotating banner carousel, categories grid, featured/sale products
- **Catalog** (`app/(tabs)/catalog.tsx`): Search, category filter, sort by price, product list
- **Cart** (`app/(tabs)/cart.tsx`): Item management, quantity controls, delivery threshold, checkout with success state
- **Profile** (`app/(tabs)/profile.tsx`): User info, order history, settings, admin panel entry

### Product Detail (`app/product/[id].tsx`)
- Full-screen product view with emoji hero, related products, like button, add-to-cart with quantity control

### Admin Panel (`app/admin/`)
- **Dashboard** (`index.tsx`): Stats overview (products, orders, revenue, pending), recent orders, quick actions
- **Products** (`products.tsx`): Full product list with search, edit and delete any product
- **Add/Edit Product** (`add-product.tsx`): Complete form — emoji picker, name, brand, description, category chips, price, original price, unit, badge, availability toggle
- **Orders** (`orders.tsx`): Order list with status tabs (All/Pending/Preparing/In Transit/Delivered), expandable order details with customer info and items
- **Categories** (`categories.tsx`): Category grid with product counts, progress bars, quick add-to-category shortcut

## State Management

### CartContext (`context/CartContext.tsx`)
- Persisted to AsyncStorage (`@freshmart_cart`)
- `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- Computed `totalItems` and `totalPrice`

### ProductsContext (`context/ProductsContext.tsx`)
- Merges static products from `constants/data.ts` with custom products from AsyncStorage
- Supports: `addProduct`, `updateProduct`, `deleteProduct`
- Deleted static products tracked by ID in `@freshmart_deleted_ids`
- Custom products stored in `@freshmart_custom_products`
- Edits to static products are stored as custom overrides

## Data

- 20 static products across 8 categories in `constants/data.ts`
- 8 categories: Fruits, Vegetables, Dairy, Meat, Bakery, Beverages, Snacks, Frozen
- Prices in UZS (Uzbek Som)
- Product fields: id, name, category, price, originalPrice, unit, image (emoji), badge, rating, description, brand, weight, inStock

## Color Scheme
- Primary: `#1A9B5C` (fresh green)
- Accent: `#FF6B35` (warm orange)  
- Background: `#F5F8F3` (light greenish white)
- Card: `#FFFFFF`

## Navigation Flow
- Admin accessed via Profile tab → "Admin Panel" card
- Product detail accessed from any product card (home or catalog)
- All admin screens use back button navigation (Stack-based)
