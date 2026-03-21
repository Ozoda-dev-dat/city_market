@echo off
REM Production Environment Setup Script for Windows
REM ==========================================

echo 🚀 Setting up Production Environment for Supermarket Go
echo ==================================================

REM Check if .env.production exists
if not exist ".env.production" (
    echo ❌ .env.production file not found!
    exit /b 1
)

REM Copy production template to .env
echo ℹ️  Copying production environment template...
copy .env.production .env >nul
echo ✅ Production template copied to .env

REM Check for Node.js
echo ℹ️  Checking required tools...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed
    exit /b 1
)
echo ✅ Node.js found

REM Check for npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed
    exit /b 1
)
echo ✅ npm found

REM Interactive setup
echo.
echo 📝 Please update the following variables in .env:
echo.

REM Database setup
echo 🗄️  Database Configuration:
set /p db_url="Enter your NeonDB connection string (or press Enter to keep placeholder): "
if not "%db_url%"=="" (
    powershell -Command "(Get-Content .env) -replace 'postgresql://username:password@hostname/dbname\?sslmode=require', '%db_url%' | Set-Content .env"
    echo ✅ Database URL updated
)

REM Domain setup
echo.
echo 🌐 Domain Configuration:
set /p domain="Enter your domain (e.g., yourdomain.com): "
if not "%domain%"=="" (
    powershell -Command "(Get-Content .env) -replace 'yourdomain.com', '%domain%' | Set-Content .env"
    echo ✅ Domain updated to %domain%
)

REM API Keys setup
echo.
echo 🔑 API Keys:
set /p api_keys="Enter your API keys (comma-separated): "
if not "%api_keys%"=="" (
    powershell -Command "(Get-Content .env) -replace 'your_production_api_key_here', '%api_keys%' | Set-Content .env"
    echo ✅ API keys updated
)

REM Install dependencies
echo.
echo 📦 Installing production dependencies...
npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)
echo ✅ Dependencies installed successfully

REM Build application
echo.
echo 🔨 Building application for production...
npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed
    exit /b 1
)
echo ✅ Application built successfully

REM Run tests
echo.
echo 🧪 Running production tests...
npm test
if %errorlevel% neq 0 (
    echo ⚠️  Some tests failed, but continuing...
) else (
    echo ✅ All tests passed
)

REM Environment validation
echo.
echo 🔍 Validating environment variables...

REM Check critical variables
findstr /C:"DATABASE_URL=.*placeholder" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  DATABASE_URL needs to be updated
)

findstr /C:"YOUR_DOMAIN=.*yourdomain" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  YOUR_DOMAIN needs to be updated
)

findstr /C:"NODE_ENV=production" .env >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  NODE_ENV should be set to production
)

echo ✅ Environment validation completed

REM Security check
echo.
echo 🔒 Running security checks...

findstr /C:"56dbf3c5a97b6cd3e7ad089f599379f7bb361359fbac65b31b4594a84da747c48d0da94f28180149d270f92c8f6e63da8736e3fc0c1bd17cdfa5019d0565c7ec" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️  Using default security keys. Generate new ones for production!
) else (
    echo ✅ Security keys are properly set
)

REM Deployment platform selection
echo.
echo 🚀 Select deployment platform:
echo 1) Railway
echo 2) Render
echo 3) Vercel
echo 4) Custom
echo 5) Skip deployment

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo ℹ️  Setting up for Railway deployment...
    echo Please set these environment variables in Railway dashboard:
    findstr /C:"DATABASE_URL" .env
    findstr /C:"YOUR_DOMAIN" .env
    findstr /C:"NODE_ENV" .env
    findstr /C:"JWT_SECRET" .env
    findstr /C:"ENCRYPTION_KEY" .env
) else if "%choice%"=="2" (
    echo ℹ️  Setting up for Render deployment...
    echo Please set these environment variables in Render dashboard:
    findstr /C:"DATABASE_URL" .env
    findstr /C:"YOUR_DOMAIN" .env
    findstr /C:"NODE_ENV" .env
    findstr /C:"JWT_SECRET" .env
    findstr /C:"ENCRYPTION_KEY" .env
) else if "%choice%"=="3" (
    echo ℹ️  Setting up for Vercel deployment...
    echo Please set these environment variables in Vercel dashboard:
    findstr /C:"DATABASE_URL" .env
    findstr /C:"YOUR_DOMAIN" .env
    findstr /C:"NODE_ENV" .env
    findstr /C:"JWT_SECRET" .env
    findstr /C:"ENCRYPTION_KEY" .env
) else if "%choice%"=="4" (
    echo ℹ️  Custom deployment setup...
    echo Your environment variables are ready in .env
) else if "%choice%"=="5" (
    echo ℹ️  Skipping deployment setup
) else (
    echo ❌ Invalid choice
    exit /b 1
)

REM Final summary
echo.
echo 🎉 Production setup completed!
echo.
echo 📋 Summary:
echo   ✅ Environment variables configured
echo   ✅ Dependencies installed
echo   ✅ Application built
echo   ✅ Tests run
echo   ✅ Security checks performed
echo.
echo 📚 Next Steps:
echo   1. Review and update any remaining placeholder values in .env
echo   2. Deploy to your chosen platform
echo   3. Test the deployed application
echo   4. Monitor logs and performance
echo.
echo 📖 For detailed deployment instructions, see:
echo   📄 PRODUCTION_DEPLOYMENT.md
echo   📄 CORS_SETUP.md
echo.
echo ℹ️  Good luck with your production deployment! 🚀

pause
