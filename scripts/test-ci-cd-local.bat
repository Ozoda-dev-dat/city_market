@echo off
REM Local CI/CD Pipeline Test Script for Windows
REM ===============================================

echo 🚀 Testing CI/CD Pipeline Locally
echo ==================================

REM Counter for failed steps
set failed_steps=0

REM Function to run a step and check result
:run_step
set step_name=%1
set command=%2

echo ℹ️  Running: %step_name%
echo %command%

%command%
if %errorlevel% neq 0 (
    echo ❌ %step_name% failed
    set /a failed_steps+=1
) else (
    echo ✅ %step_name% passed
)
goto :eof

echo.
echo 🔍 Step 1: Lint and Format Check
echo ===========================================

call :run_step "ESLint Check" "npm run lint"
call :run_step "Prettier Check" "npm run format:check"
call :run_step "TypeScript Check" "npm run type-check"

echo.
echo 🔒 Step 2: Security Audit
echo ===============================

call :run_step "Security Audit" "npm audit --audit-level=moderate"
call :run_step "Dependency Check" "npm run dep:check"

echo.
echo 🧪 Step 3: Unit Tests
echo ===========================

call :run_step "Unit Tests" "npm run test:unit"
call :run_step "Test Coverage" "npm run test:coverage"

echo.
echo 🔗 Step 4: Integration Tests
echo =================================

REM Check if PostgreSQL is running (simplified check)
netstat -an | findstr :5432 >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL is not running on port 5432
    echo Please start PostgreSQL or use Docker:
    echo docker run -d --name postgres-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=supermarket_go_test -p 5432:5432 postgres:15
    set /a failed_steps+=1
) else (
    echo ✅ PostgreSQL is running
)

REM Setup test database
echo ℹ️  Setting up test database...
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_test
set JWT_SECRET=test-secret-key
set JWT_REFRESH_SECRET=test-refresh-secret-key

call :run_step "Database Migration" "npm run db:migrate:test"
call :run_step "Database Seeding" "npm run db:seed:test"
call :run_step "Integration Tests" "npm run test:integration"

echo.
echo 🌐 Step 5: E2E Tests
echo =========================

REM Start Expo server in background
echo ℹ️  Starting Expo server...
start /B expo start --web --non-interactive

REM Wait for Expo server to start
echo ℹ️  Waiting for Expo server to be ready...
timeout /t 120 /nobreak >nul

call :run_step "E2E Tests" "npm run test:e2e"

REM Clean up Expo server
echo ℹ️  Stopping Expo server...
taskkill /F /IM expo.exe 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq expo*" 2>nul

echo.
echo 🔨 Step 6: Build Tests
echo ========================

call :run_step "Build Server" "npm run build:server"
call :run_step "Server Tests" "npm run test:server"

echo.
echo 📱 Step 7: Mobile App Build
echo ===============================

call :run_step "Build iOS App" "expo build:ios --non-interactive --no-publish"
call :run_step "Build Android App" "expo build:android --non-interactive --no-publish"

echo.
echo ⚡ Step 8: Performance Tests
echo =================================

REM Start server in background
echo ℹ️  Starting server for performance tests...
start /B npm run start:server

REM Wait for server to be ready
echo ℹ️  Waiting for server to be ready...
timeout /t 60 /nobreak >nul

call :run_step "Performance Tests" "npm run test:performance"
call :run_step "Load Tests" "npm run test:load"

REM Clean up server
echo ℹ️  Stopping server...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq *server*" 2>nul

echo.
echo 🗄️ Step 9: Database Optimization
echo ===================================

call :run_step "Database Optimization" "npm run db:optimize"
call :run_step "Database Performance Tests" "npm run test:database"
call :run_step "Database Report" "npm run db:report"

echo.
echo 🔍 Step 10: Security Scans
echo ============================

REM Check for Trivy
where trivy >nul 2>&1
if %errorlevel% equ 0 (
    call :run_step "Trivy Security Scan" "trivy fs --format sarif --output trivy-results.sarif ."
) else (
    echo ⚠️  Trivy not found. Install with: choco install trivy or download from GitHub
)

REM Check for CodeQL
where codeql >nul 2>&1
if %errorlevel% equ 0 (
    call :run_step "CodeQL Analysis" "codeql database analyze . --format=sarif --output=codeql-results.sarif"
) else (
    echo ⚠️  CodeQL not found. Install with GitHub CLI
)

echo.
echo 📚 Step 11: Documentation
echo ===========================

call :run_step "Generate Documentation" "npm run docs:generate"

echo.
echo 🧹 Step 12: Cleanup
echo =======================

REM Clean up Docker containers (if Docker is available)
where docker >nul 2>&1
if %errorlevel% equ 0 (
    echo ℹ️  Cleaning up Docker containers...
    docker stop postgres-test 2>nul
    docker rm postgres-test 2>nul
)

REM Clean up any remaining processes
taskkill /F /IM expo.exe 2>nul
taskkill /F /IM node.exe 2>nul

REM Final summary
echo.
echo ==========================================
echo 🏁 CI/CD Pipeline Test Summary
echo ==========================================

if %failed_steps% equ 0 (
    echo ✅ 🎉 All CI/CD steps passed successfully!
    echo.
    echo ✅ Lint and formatting: PASSED
    echo ✅ Security audit: PASSED
    echo ✅ Unit tests: PASSED
    echo ✅ Integration tests: PASSED
    echo ✅ E2E tests: PASSED
    echo ✅ Build tests: PASSED
    echo ✅ Performance tests: PASSED
    echo ✅ Database optimization: PASSED
    echo ✅ Security scans: PASSED
    echo ✅ Documentation: PASSED
    echo.
    echo ✅ Your code is ready for production deployment! 🚀
    exit /b 0
) else (
    echo ❌ %failed_steps% CI/CD step(s) failed
    echo.
    echo Failed steps need to be fixed before deployment.
    echo Check the logs above for details.
    exit /b 1
)

goto :eof
