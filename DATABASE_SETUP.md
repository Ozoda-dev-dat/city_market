# 🗄️ NeonDB Database Setup Guide

This guide will help you set up NeonDB for persistent data storage in your Supermarket app.

## 📋 Prerequisites

- NeonDB account and project
- Node.js installed
- Your NeonDB connection string

## 🚀 Setup Steps

### 1. Get Your NeonDB Connection String

1. Go to your [NeonDB dashboard](https://neon.tech)
2. Select your project
3. Go to **Connection Details**
4. Copy the **Connection string** (looks like: `postgresql://username:password@hostname/dbname?sslmode=require`)

### 2. Configure Environment Variables

Create a `.env` file in your project root:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and replace with your actual connection string:

```env
DATABASE_URL=postgresql://your-username:your-password@your-hostname/your-dbname?sslmode=require
```

### 3. Install Dependencies

```bash
npm install postgres
```

### 4. Set Up the Database

Run the database setup script:

```bash
npm run db:setup
```

This will:
- ✅ Create all necessary tables
- ✅ Set up relationships
- ✅ Create default admin user
- ✅ Add sample categories and products

### 5. Start the Application

```bash
# Start the backend server
npm run server:dev

# In another terminal, start the frontend
npm start
```

## 📊 Database Schema

The following tables will be created:

### 👥 Users
- `id` - Primary key
- `phoneNumber` - Unique phone number
- `password` - User password
- `role` - admin/courier/customer
- `name` - Display name

### 📦 Products
- `id` - Product ID
- `name` - Product name
- `category` - Category reference
- `price` - Price in UZS
- `unit` - Unit (kg, pieces, etc.)
- `image` - Product image URL
- `inStock` - Stock availability

### 🏷️ Categories
- `id` - Category ID
- `name` - Category name
- `icon` - Icon name
- `color` - Theme color
- `bgColor` - Background color

### 🛒 Orders
- `id` - Order ID
- `customerId` - Customer reference
- `courierId` - Courier reference
- `status` - Order status
- `items` - Order items (JSON)
- `total` - Total amount
- `createdAt` - Order timestamp

### 🎫 Promo Codes
- `id` - Promo ID
- `code` - Promo code
- `discountPercent` - Discount percentage
- `isActive` - Active status

## 🔧 Default Data Created

### Admin User
- **Phone:** `+998901234567`
- **Password:** `admin`
- **Role:** `admin`

### Categories
- Mevalar (Fruits)
- Sabzavotlar (Vegetables)
- Sut mahsulotlari (Dairy)
- Non mahsulotlari (Bakery)
- Go'sht mahsulotlari (Meat)

### Sample Products
- Qizil olma (Apple)
- Banan (Banana)
- Pomidor (Tomato)

## 🔄 Migration Commands

```bash
# Push schema changes to database
npm run db:push

# View database status
npm run db:studio  # If drizzle studio is configured
```

## 🚨 Important Notes

1. **Data Persistence:** All data is now stored in NeonDB and will persist between server restarts
2. **Backup:** NeonDB automatically handles backups
3. **SSL Required:** All connections use SSL for security
4. **Environment Variables:** Never commit `.env` file to version control

## 🐛 Troubleshooting

### Connection Issues
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npm run db:setup
```

### Migration Issues
```bash
# Reset and re-run migrations
npm run db:push --force
```

### Permission Issues
Make sure your NeonDB user has the necessary permissions to create tables.

## 🎉 Benefits of NeonDB

- ✅ **Persistent Storage:** Data survives server restarts
- ✅ **Automatic Backups:** Built-in backup system
- ✅ **Scalability:** Handles growth automatically
- ✅ **Security:** SSL connections and secure by default
- ✅ **Performance:** Fast PostgreSQL database

## 📞 Support

If you encounter issues:

1. Check your NeonDB dashboard for connection status
2. Verify your connection string format
3. Ensure all dependencies are installed
4. Check the server logs for detailed error messages

---

**🎯 Your Supermarket app is now ready for production with persistent NeonDB storage!**
