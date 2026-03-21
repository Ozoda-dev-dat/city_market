# Production Deployment Guide

## Environment Variables Setup

This guide covers setting up production environment variables for the Supermarket Go application.

## Quick Setup

### 1. Copy Production Template
```bash
cp .env.production .env
```

### 2. Update Required Variables

#### Database Configuration
```bash
# Replace with your actual NeonDB connection string
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

#### Domain Configuration
```bash
# Replace with your actual domain
YOUR_DOMAIN=yourdomain.com
PRODUCTION_DOMAIN=yourdomain.com
API_URL=https://yourdomain.com/api
EXPO_PUBLIC_API_URL=https://yourdomain.com/api
```

#### API Keys
```bash
# Replace with your actual API keys
API_KEYS=your_production_api_key_here
```

## Environment Variables Explained

### 🔐 **Security Configuration**
- `NODE_ENV=production`: Enables production optimizations
- `JWT_SECRET`: Secure JWT token signing (128 chars)
- `ENCRYPTION_KEY`: Data encryption key (128 chars)
- `SESSION_SECRET`: Session management key (128 chars)

### 🌐 **Domain & CORS**
- `YOUR_DOMAIN`: Your main domain for CORS
- `PRODUCTION_DOMAIN`: Production domain alias
- `API_URL`: Backend API URL
- `EXPO_PUBLIC_API_URL`: Frontend API URL

### 📊 **Monitoring & Analytics**
- `SENTRY_DSN`: Error tracking
- `ANALYTICS_ID`: Google Analytics
- `LOG_LEVEL`: Logging verbosity (info/warn/error)

### 💳 **Payment Processing**
- `STRIPE_PUBLISHABLE_KEY`: Stripe public key
- `STRIPE_SECRET_KEY`: Stripe private key

### 🔔 **Push Notifications**
- `EXPO_PUSH_NOTIFICATION_KEY`: Expo push notifications

### 📧 **Email Configuration**
- `SMTP_HOST`: Your email server
- `SMTP_USER`: Email username
- `SMTP_PASS`: Email password

### 🔥 **Firebase (Optional)**
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase service account key

## Platform-Specific Setup

### Railway Deployment
```bash
# Set environment variables in Railway dashboard
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
YOUR_DOMAIN=yourapp.railway.app
PRODUCTION_DOMAIN=yourapp.railway.app
NODE_ENV=production
```

### Render Deployment
```bash
# Set environment variables in Render dashboard
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
YOUR_DOMAIN=yourapp.onrender.com
PRODUCTION_DOMAIN=yourapp.onrender.com
NODE_ENV=production
```

### Vercel Deployment
```bash
# Set environment variables in Vercel dashboard
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
YOUR_DOMAIN=yourapp.vercel.app
PRODUCTION_DOMAIN=yourapp.vercel.app
NODE_ENV=production
```

### Custom Domain Setup
```bash
# For custom domains with SSL
YOUR_DOMAIN=yourdomain.com
PRODUCTION_DOMAIN=yourdomain.com
API_URL=https://yourdomain.com/api
EXPO_PUBLIC_API_URL=https://yourdomain.com/api
```

## Security Best Practices

### ✅ **Required for Production**
- Set `NODE_ENV=production`
- Use HTTPS URLs for all domains
- Replace all placeholder keys with secure values
- Enable SSL certificates for custom domains
- Set up proper database connection with SSL

### 🔒 **Security Headers**
- `COOKIE_SECURE=true`: HTTPS-only cookies
- `COOKIE_SAME_SITE=strict`: CSRF protection
- `RATE_LIMIT_*`: API rate limiting

### 📝 **Logging & Monitoring**
- `LOG_LEVEL=info`: Appropriate logging verbosity
- `SENTRY_DSN`: Error tracking setup
- `LOG_FILE`: Centralized logging

## Testing Production Setup

### 1. Environment Validation
```bash
# Test database connection
npm run test:db

# Test environment variables
npm run test:env

# Test API connectivity
npm run test:api
```

### 2. CORS Testing
```bash
# Test CORS with your domain
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://yourdomain.com/api/auth/login
```

### 3. Security Testing
```bash
# Test JWT token generation
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"phone":"test","password":"test"}' \
     https://yourdomain.com/api/auth/login
```

## Deployment Checklist

### Before Deployment
- [ ] Update `DATABASE_URL` with production NeonDB
- [ ] Set your domain in `YOUR_DOMAIN` and `PRODUCTION_DOMAIN`
- [ ] Replace placeholder API keys
- [ ] Set `NODE_ENV=production`
- [ ] Configure SSL certificates (if self-hosted)
- [ ] Set up monitoring (Sentry, Analytics)

### After Deployment
- [ ] Test database connectivity
- [ ] Verify CORS configuration
- [ ] Test authentication flow
- [ ] Check mobile app connectivity
- [ ] Monitor error logs
- [ ] Verify SSL certificates

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check connection string format
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

#### CORS Issues
```bash
# Verify domain matches exactly
YOUR_DOMAIN=yourdomain.com  # No https:// prefix
PRODUCTION_DOMAIN=yourdomain.com
```

#### Environment Variables Not Loading
```bash
# Ensure .env is in project root
# Check file permissions
# Verify variable names match exactly
```

### Debug Mode
```bash
# Enable debug logging temporarily
LOG_LEVEL=debug
NODE_ENV=production
```

## Environment Variable Templates

### Development (.env.development)
```bash
NODE_ENV=development
YOUR_DOMAIN=localhost:8081
PRODUCTION_DOMAIN=localhost:8081
API_URL=http://localhost:5001/api
EXPO_PUBLIC_API_URL=http://localhost:5001/api
```

### Staging (.env.staging)
```bash
NODE_ENV=staging
YOUR_DOMAIN=staging.yourdomain.com
PRODUCTION_DOMAIN=staging.yourdomain.com
API_URL=https://staging.yourdomain.com/api
EXPO_PUBLIC_API_URL=https://staging.yourdomain.com/api
```

## Next Steps

1. **Update `.env`** with your production values
2. **Test locally** with production environment
3. **Deploy** to your hosting platform
4. **Monitor** application performance
5. **Scale** as needed

Your production environment is now configured and ready for deployment!
