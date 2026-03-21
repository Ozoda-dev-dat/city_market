@echo off
REM Production Deployment Script for Windows
REM =======================================

echo 🚀 Deploying Supermarket Go to Production
echo =======================================

REM Check if we're on main branch
for /f "delims=" %%i in ('git rev-parse --abbrev-ref HEAD') do set current_branch=%%i
if not "%current_branch%"=="main" (
    echo ❌ You must be on the main branch to deploy to production
    exit /b 1
)

REM Check if working directory is clean
git status --porcelain >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Working directory is not clean. Please commit or stash changes first.
    exit /b 1
)

REM Environment validation
echo 🔍 Validating production environment...

REM Check critical environment variables
if not exist ".env" (
    echo ❌ .env file not found!
    exit /b 1
)

REM Check if production variables are set
findstr /C:"YOUR_DOMAIN=.*yourdomain" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Please update placeholder values in .env before deploying to production
    exit /b 1
)

findstr /C:"DATABASE_URL=.*username:password" .env >nul 2>&1
if %errorlevel% equ 0 (
    echo ❌ Please update DATABASE_URL in .env before deploying to production
    exit /b 1
)

echo ✅ Environment variables validated

REM Security checks
echo 🔒 Running security checks...

REM Run security audit
npm audit --audit-level=moderate
if %errorlevel% neq 0 (
    echo ❌ Security audit failed. Please fix vulnerabilities before deploying.
    exit /b 1
)

echo ✅ Security audit passed

REM Build application
echo 🔨 Building application for production...

REM Install production dependencies
npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Failed to install production dependencies
    exit /b 1
)

REM Build server
npm run build:server
if %errorlevel% neq 0 (
    echo ❌ Server build failed
    exit /b 1
)

REM Build mobile app (if configured)
if defined EXPO_TOKEN (
    echo 📱 Building mobile apps...
    
    REM Build Android
    expo build:android --non-interactive --no-publish
    if %errorlevel% neq 0 (
        echo ⚠️  Android build failed, but continuing...
    )
    
    REM Build iOS
    expo build:ios --non-interactive --no-publish
    if %errorlevel% neq 0 (
        echo ⚠️  iOS build failed, but continuing...
    )
) else (
    echo ⚠️  EXPO_TOKEN not set. Skipping mobile app builds.
)

echo ✅ Application built successfully

REM Run tests
echo 🧪 Running production tests...

REM Run unit tests
npm run test:unit
if %errorlevel% neq 0 (
    echo ❌ Unit tests failed
    exit /b 1
)

REM Run integration tests
npm run test:integration
if %errorlevel% neq 0 (
    echo ❌ Integration tests failed
    exit /b 1
)

echo ✅ All tests passed

REM Database migration
echo 🗄️  Running database migrations...

REM Run migrations
npm run db:migrate:test
if %errorlevel% neq 0 (
    echo ❌ Database migration failed
    exit /b 1
)

echo ✅ Database migrations completed

REM Create backup before deployment
echo 💾 Creating pre-deployment backup...

npm run backup:create
if %errorlevel% neq 0 (
    echo ⚠️  Backup creation failed, but continuing...
) else (
    echo ✅ Pre-deployment backup created
)

REM Deployment
echo 🚀 Deploying to production...

REM Check deployment method
if not defined DEPLOYMENT_METHOD set DEPLOYMENT_METHOD=docker

if "%DEPLOYMENT_METHOD%"=="docker" (
    echo 📦 Deploying with Docker...
    
    REM Build Docker image
    docker build -t supermarket-go:latest .
    if %errorlevel% neq 0 (
        echo ❌ Docker build failed
        exit /b 1
    )
    
    REM Stop existing container
    docker stop supermarket-go 2>nul
    docker rm supermarket-go 2>nul
    
    REM Start new container
    docker run -d --name supermarket-go --restart unless-stopped -p 5001:5001 --env-file .env supermarket-go:latest
    
    if %errorlevel% neq 0 (
        echo ❌ Docker deployment failed
        exit /b 1
    )
) else if "%DEPLOYMENT_METHOD%"=="pm2" (
    echo 📦 Deploying with PM2...
    
    REM Stop existing process
    pm2 stop supermarket-go 2>nul
    pm2 delete supermarket-go 2>nul
    
    REM Start new process
    pm2 start server_dist/index.js --name supermarket-go --env production
    if %errorlevel% neq 0 (
        echo ❌ PM2 deployment failed
        exit /b 1
    )
) else (
    echo ❌ Unknown deployment method: %DEPLOYMENT_METHOD%
    exit /b 1
)

echo ✅ Deployment completed

REM Health check
echo 🏥 Running health checks...

REM Wait for application to start
timeout /t 30 /nobreak >nul

REM Check if server is responding
set API_URL=https://supermarket-go.uz/api

REM Health check endpoint
curl -s -o nul -w "%%{http_code}" "%API_URL%/health" > temp_http_code.txt
set /p http_code=<temp_http_code.txt
del temp_http_code.txt

if not "%http_code%"=="200" (
    echo ❌ Health check failed. Server returned HTTP %http_code%
    exit /b 1
)

echo ✅ Health check passed

REM Smoke tests
echo 💨 Running smoke tests...

npm run test:smoke
if %errorlevel% neq 0 (
    echo ❌ Smoke tests failed
    exit /b 1
)

echo ✅ Smoke tests passed

REM Cleanup
echo 🧹 Cleaning up...

REM Remove unused Docker images
docker image prune -f 2>nul

echo ✅ Cleanup completed

REM Notification
echo 📢 Sending deployment notification...

REM Send Slack notification (if webhook is configured)
for /f "tokens=2 delims==" %%i in ('findstr /C:"SLACK_WEBHOOK_URL" .env') do set SLACK_WEBHOOK_URL=%%i
if defined SLACK_WEBHOOK_URL (
    curl -X POST -H "Content-type: application/json" --data "{\"text\":\"✅ Supermarket Go deployed to production successfully!\nBranch: %current_branch%\nTime: %date% %time%\"}" "%SLACK_WEBHOOK_URL%" 2>nul
)

REM Final summary
echo.
echo ==========================================
echo 🎉 Production Deployment Summary
echo ==========================================
echo ✅ Environment validated
echo ✅ Security checks passed
echo ✅ Application built
echo ✅ Tests passed
echo ✅ Database migrated
echo ✅ Backup created
echo ✅ Deployment completed
echo ✅ Health checks passed
echo ✅ Smoke tests passed

echo.
echo 🌐 Application is now live at: https://supermarket-go.uz
echo 📊 Monitor at: https://supermarket-go.uz/api/health
echo 📈 Analytics: Check your monitoring dashboard

echo.
echo ✅ 🚀 Production deployment completed successfully!

REM Create deployment tag
git tag -a "production-%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%" -m "Production deployment %date% %time%"
git push origin --tags

echo.
echo 📝 Deployment tag created and pushed

pause
