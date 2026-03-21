# CORS Configuration Guide

## Overview
This guide explains how to configure CORS (Cross-Origin Resource Sharing) for your Supermarket Go application to work with your custom domain.

## Environment Variables

Add these variables to your `.env` file:

```bash
# CORS Configuration
# Add your domain here for production deployment
YOUR_DOMAIN=yourdomain.com
PRODUCTION_DOMAIN=yourdomain.com
```

## Supported Origins

### 1. Custom Domains
- `https://yourdomain.com` (HTTPS)
- `http://yourdomain.com` (HTTP for development)

### 2. Local Development
- `http://localhost:*` (any port)
- `http://127.0.0.1:*` (any port)

### 3. Mobile App Origins
- Expo Go domains (contains "expo")
- Expo Direct domains (contains "exp.direct")
- Expo development URLs (contains "exp://")
- Local network IPs:
  - `http://192.168.*.*` (local WiFi networks)
  - `http://10.*.*.*` (corporate networks)
  - `http://172.*.*.*` (private networks)

### 4. Replit Domains
- Automatic support for Replit development domains

## CORS Headers

The server sends these CORS headers:

```http
Access-Control-Allow-Origin: [requesting origin]
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent, DNT, Cache-Control, X-Mx-ReqToken, Keep-Alive, X-Requested-With, If-Modified-Since
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

## Setup Instructions

### For Production Deployment

1. **Update your domain:**
   ```bash
   # Edit .env file
   YOUR_DOMAIN=your-actual-domain.com
   PRODUCTION_DOMAIN=your-actual-domain.com
   ```

2. **Restart the server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

### For Development

The CORS configuration automatically allows:
- Local development servers (localhost:8081, localhost:3000, etc.)
- Expo development servers
- Mobile app development

### For Mobile Apps

The configuration supports:
- **Expo Go**: Automatic approval
- **Expo Development Builds**: Automatic approval
- **Physical devices on local network**: Automatic approval
- **Simulators/Emulators**: Automatic approval

## Security Considerations

### Production Security
- Always use HTTPS in production
- Set specific domains instead of wildcards
- Remove development origins in production builds

### Development Flexibility
- Local development allows all origins for convenience
- Mobile app development supports various network configurations
- CORS max-age set to 24 hours to reduce preflight requests

## Troubleshooting

### Common CORS Issues

1. **"No 'Access-Control-Allow-Origin' header is present"**
   - Check if your domain is properly set in `.env`
   - Verify the request origin matches allowed origins

2. **"CORS policy: Cannot use wildcard in Access-Control-Allow-Origin"**
   - This occurs when `credentials: true` is used with wildcard origins
   - Our configuration uses specific origins to avoid this

3. **Mobile app CORS issues**
   - Ensure your mobile app is on the same network as the server
   - Check if the server IP is accessible from your device

### Testing CORS

Use these commands to test CORS:

```bash
# Test from browser
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:5001/api/auth/login

# Test with credentials
curl -H "Origin: https://yourdomain.com" \
     -H "Content-Type: application/json" \
     -X POST \
     -d '{"phone":"test","password":"test"}' \
     --cookie-jar cookies.txt \
     --cookie cookies.txt \
     http://localhost:5001/api/auth/login
```

## Deployment Examples

### Railway
```bash
# Set environment variables in Railway dashboard
YOUR_DOMAIN=yourapp.railway.app
PRODUCTION_DOMAIN=yourapp.railway.app
```

### Render
```bash
# Set environment variables in Render dashboard
YOUR_DOMAIN=yourapp.onrender.com
PRODUCTION_DOMAIN=yourapp.onrender.com
```

### Custom Domain
```bash
# For custom domains with SSL
YOUR_DOMAIN=yourdomain.com
PRODUCTION_DOMAIN=yourdomain.com
```

## Next Steps

1. Update your `.env` file with your actual domain
2. Test the CORS configuration with your frontend
3. Deploy to your hosting platform
4. Verify mobile app connectivity

The CORS configuration is now ready for production deployment and mobile app development!
