@echo off
echo 🌍 Starting Supermarket Go Global Setup...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the Supermarket-Go directory
    pause
    exit /b 1
)

REM Step 1: Install dependencies
echo 📦 Installing dependencies...
npm install --legacy-peer-deps
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Step 2: Setup database
echo 🗄️ Setting up database...
.\setup-sqlite-dev.bat
if errorlevel 1 (
    echo ❌ Failed to setup database
    pause
    exit /b 1
)

REM Step 3: Start backend server
echo 🚀 Starting backend server...
start "Backend Server" cmd /k "npm run server:dev:basic"

REM Wait for backend to start
echo ⏳ Waiting for backend server to start...
timeout /t 8 /nobreak > nul

REM Step 4: Start mobile app
echo 📱 Starting mobile app...
start "Mobile App" cmd /k "npm start"

REM Wait for mobile app to start
echo ⏳ Waiting for mobile app to start...
timeout /t 15 /nobreak > nul

echo.
echo 🔍 Checking if ngrok is available...
where ngrok >nul 2>nul
if errorlevel 1 (
    echo.
    echo ❌ ngrok not found! Please install ngrok first:
    echo    1. Go to https://ngrok.com/download
    echo    2. Download and extract ngrok.exe
    echo    3. Add ngrok.exe to your PATH
    echo    4. Or run: choco install ngrok
    echo.
    echo 📋 Manual steps to continue:
    echo    1. Backend server is running on http://localhost:5001
    echo    2. Mobile app is running on http://localhost:8081
    echo    3. Install ngrok and run: ngrok http 5001
    echo    4. In another terminal: ngrok http 8081
    echo.
    pause
    exit /b 1
)

REM Step 5: Start ngrok tunnels
echo 🌐 Starting ngrok tunnels for global access...
start "Backend ngrok" cmd /k "ngrok http 5001"
timeout /t 3 /nobreak > nul
start "Mobile ngrok" cmd /k "ngrok http 8081"

REM Wait for ngrok to start
echo ⏳ Waiting for ngrok tunnels to establish...
timeout /t 10 /nobreak > nul

echo.
echo 🎉 Setup complete!
echo.
echo 📋 What's running:
echo    ✅ Backend Server: http://localhost:5001
echo    ✅ Mobile App: http://localhost:8081
echo    ✅ Backend ngrok tunnel: Check "Backend ngrok" window
echo    ✅ Mobile ngrok tunnel: Check "Mobile ngrok" window
echo.
echo 🔗 What to share:
echo    1. Copy the HTTPS URL from "Mobile ngrok" window
echo    2. Share that URL with your remote user
echo    3. Login credentials: Phone +998901234567, Password: admin
echo.
echo 📱 Instructions for remote user:
echo    - Open the ngrok URL in their browser
echo    - Or scan the QR code if using mobile device
echo    - Login with the provided credentials
echo.
echo ⚠️  Important:
echo    - Keep all terminal windows open
echo    - ngrok URLs are temporary
echo    - Check firewall if URLs aren't accessible
echo.
echo 🛠️  Troubleshooting:
echo    - If ngrok fails, check https://ngrok.com/docs/troubleshooting
echo    - If ports are blocked, check Windows Firewall
echo    - If app doesn't load, restart the terminals
echo.
pause
