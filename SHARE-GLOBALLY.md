# 🌍 Share Supermarket Go App Globally

Step-by-step commands to run the app and share it with someone in another region.

## 🚀 Quick Setup Commands

### Step 1: Install Dependencies
```bash
cd c:\Users\user\Desktop\Supermarket-Go
npm install --legacy-peer-deps
```

### Step 2: Setup Local Database
```bash
.\setup-sqlite-dev.bat
```

### Step 3: Start Backend Server
```bash
npm run server:dev:basic
```
*(Keep this terminal open)*

### Step 4: Start Mobile App (New Terminal)
```bash
# Open new terminal window
cd c:\Users\user\Desktop\Supermarket-Go
npm start
```
*(Keep this terminal open)*

## 🌐 Making It Accessible Globally

### Option 1: Using ngrok (Recommended)

#### Step 5a: Install ngrok
```bash
# Download ngrok from https://ngrok.com/download
# Or use chocolatey:
choco install ngrok
```

#### Step 6a: Expose Backend API
```bash
# In new terminal
ngrok http 5001
```
*Copy the HTTPS URL (e.g., https://abc123.ngrok.io)*

#### Step 7a: Expose Mobile App
```bash
# In another terminal
ngrok http 8081
```
*Copy the HTTPS URL (e.g., https://def456.ngrok.io)*

#### Step 8a: Update Environment
```bash
# Create .env.production file
echo API_URL=https://abc123.ngrok.io > .env.production
echo EXPO_PUBLIC_API_URL=https://abc123.ngrok.io >> .env.production
echo EXPO_PUBLIC_DOMAIN=https://def456.ngrok.io >> .env.production
```

### Option 2: Using Railway/Render (Cloud Deployment)

#### Step 5b: Deploy Backend to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy backend
railway up
```

#### Step 6b: Get Railway URL
```bash
railway domains
```
*Copy the Railway URL*

#### Step 7c: Update Mobile App Config
```bash
# Update app.json or constants
# Replace localhost with Railway URL
```

## 📱 Sharing Instructions

### For ngrok Method:
1. **Backend API**: Share `https://abc123.ngrok.io`
2. **Mobile App**: Share `https://def456.ngrok.io` 
3. **QR Code**: Share ngrok mobile URL
4. **Login**: +998901234567 / admin

### For Cloud Deployment:
1. **Backend API**: Share Railway/Render URL
2. **Mobile App**: Deploy to Expo hosting
3. **Login**: +998901234567 / admin

## 🔧 Complete Script

### Automated Setup Script
```bash
@echo off
echo Starting Supermarket Go Global Setup...

REM Step 1: Install dependencies
echo Installing dependencies...
npm install --legacy-peer-deps

REM Step 2: Setup database
echo Setting up database...
.\setup-sqlite-dev.bat

REM Step 3: Start servers
echo Starting backend server...
start "Backend Server" cmd /k "npm run server:dev:basic"

echo Waiting for server to start...
timeout /t 5

echo Starting mobile app...
start "Mobile App" cmd /k "npm start"

echo Waiting for mobile app to start...
timeout /t 10

REM Step 4: Start ngrok tunnels
echo Starting ngrok tunnels...
start "Backend ngrok" cmd /k "ngrok http 5001"
start "Mobile ngrok" cmd /k "ngrok http 8081"

echo.
echo 🎉 Setup complete!
echo.
echo Please share these URLs with your remote user:
echo 1. Backend API: ngrok will show URL in terminal
echo 2. Mobile App: ngrok will show URL in terminal
echo 3. Login: +998901234567 / admin
echo.
pause
```

## 📋 What to Share

### Required Information:
1. **Mobile App URL**: ngrok HTTPS URL for port 8081
2. **Backend API URL**: ngrok HTTPS URL for port 5001 (if needed for API testing)
3. **Login Credentials**: 
   - Phone: +998901234567
   - Password: admin
4. **Instructions**: "Open the mobile app URL in your browser or scan QR code"

### Example Message:
```
Hi! I've shared our supermarket app with you:

📱 Mobile App: https://abc123.ngrok.io
🔐 Login: Phone +998901234567, Password: admin

You can:
- Browse products by category
- Search for items
- View shopping cart
- Place orders
- Access admin features

Let me know if you have any issues accessing it!
```

## 🛠️ Troubleshooting

### ngrok Issues:
```bash
# Check ngrok status
ngrok diagnose

# Restart ngrok
ngrok http 5001 --log=stdout
```

### Port Conflicts:
```bash
# Check what's using ports
netstat -ano | findstr :5001
netstat -ano | findstr :8081

# Kill processes if needed
taskkill /PID <PID> /F
```

### Firewalls:
- Allow ports 5001, 8081 through Windows Firewall
- Check antivirus isn't blocking ngrok

## 🔒 Security Notes

- ngrok URLs are temporary (expire after some time)
- Consider using password protection for sensitive demos
- For production, use proper cloud hosting
- Change default admin password before sharing

---

**🌍 Your app is now ready to share globally!**
