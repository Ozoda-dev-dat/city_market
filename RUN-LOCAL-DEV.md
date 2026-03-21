# 🚀 Local Development Setup Guide

This guide will help you run the Supermarket Go fullstack mobile app locally for internal development and testing.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local database)
- [Expo Go app](https://expo.dev/expo-go) on your mobile device (optional)

## 🛠️ Quick Start (Automated)

Run the automated setup script:

```bash
# Windows
setup-local-dev.bat

# Or manually follow steps below
```

## 🔧 Manual Setup

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Start Local Database Services

```bash
docker-compose -f docker-compose.dev.yml up -d
```

### 3. Set Up Environment Variables

Create `.env.local` file with:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_dev?sslmode=disable
NODE_ENV=development
JWT_SECRET=local-dev-secret-key-change-in-production
ENCRYPTION_KEY=local-dev-encryption-key-change-in-production
BACKUP_ENCRYPTION_KEY=local-dev-backup-key-change-in-production
SESSION_SECRET=local-dev-session-secret-change-in-production
REFRESH_TOKEN_SECRET=local-dev-refresh-secret-secret-change-in-production
API_SECRET=local-dev-api-secret-change-in-production
YOUR_DOMAIN=localhost
PRODUCTION_DOMAIN=localhost
API_KEYS=local-dev-api-key
```

### 4. Initialize Database

```bash
npm run db:setup
```

### 5. Start the Application

You need to run both the backend server and frontend:

#### Terminal 1 - Start Backend Server
```bash
npm run server:dev
```

#### Terminal 2 - Start Mobile App
```bash
npm start
```

## 📱 Accessing the Application

### Mobile App
- **Expo Go App**: Scan the QR code from terminal
- **Web Version**: Open `http://localhost:8081` in browser
- **Network Access**: Use your IP address for other devices on same network

### Backend API
- **Server**: `http://localhost:5001`
- **API Endpoints**: `http://localhost:5001/api/*`
- **Health Check**: `http://localhost:5001/health`

### Database Access
- **Host**: localhost
- **Port**: 5432
- **Database**: supermarket_go_dev
- **Username**: postgres
- **Password**: postgres

## 🔑 Default Login Credentials

### Admin User
- **Phone**: `+998901234567`
- **Password**: `admin`
- **Role**: Admin

### Test Customer
- **Phone**: `+998901234568`
- **Password**: `customer`
- **Role**: Customer

## 🛒 Features Available

### Customer Features
- Browse products by category
- Search products
- Add to cart
- Place orders
- Track order status
- View order history

### Admin Features
- Product management
- Order management
- User management
- Inventory tracking
- Sales analytics

### Courier Features
- View assigned orders
- Update order status
- Track deliveries

## 🔧 Development Commands

```bash
# Database operations
npm run db:push          # Push schema changes
npm run db:setup         # Reset and setup database

# Server operations
npm run server:dev       # Start development server
npm run server:build     # Build for production
npm run server:prod      # Start production server

# Mobile app operations
npm start                # Start Expo development server
npm run expo:build       # Build mobile app

# Testing
npm run test:unit        # Run unit tests
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests

# Code quality
npm run lint             # Check code style
npm run format:fix       # Fix code formatting
npm run type-check       # TypeScript type checking
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if database is running
docker-compose -f docker-compose.dev.yml ps

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres
```

### Port Conflicts
- **Server port**: Change in `.env.local` (PORT=5001)
- **Database port**: Change in `docker-compose.dev.yml`
- **Expo port**: Automatically managed by Expo

### Mobile App Issues
- Clear Expo cache: `npx expo start -c`
- Reset Metro bundler: Press `r` in Expo terminal
- Check network connectivity

### Permission Issues
- Run Docker Desktop as administrator
- Check firewall settings for ports 5001, 5432, 6379

## 🔄 Reset Development Environment

```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down -v

# Remove node modules
rm -rf node_modules

# Reinstall dependencies
npm install --legacy-peer-deps

# Restart setup
setup-local-dev.bat
```

## 📊 Monitoring

### Application Health
- **Health Check**: `http://localhost:5001/health`
- **Server Logs**: Console output from `npm run server:dev`

### Database Status
- **Connection Test**: `npm run db:setup`
- **Database Logs**: `docker-compose -f docker-compose.dev.yml logs postgres`

## 🚀 Production Deployment

For production deployment, refer to:
- `docker-compose.prod.yml` - Production containers
- `PRODUCTION_DEPLOYMENT.md` - Deployment guide
- `PRODUCTION_READINESS.md` - Production checklist

## 📞 Support

If you encounter issues:

1. Check this troubleshooting section
2. Review server console logs
3. Verify Docker containers are running
4. Check network connectivity
5. Ensure all environment variables are set

---

**🎯 Your Supermarket Go app is now ready for local development!**
