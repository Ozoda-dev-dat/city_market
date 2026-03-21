@echo off
echo Setting up local development environment for Supermarket Go...

REM Create local environment file
echo DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supermarket_go_dev?sslmode=disable > .env.local
echo NODE_ENV=development >> .env.local
echo JWT_SECRET=local-dev-secret-key-change-in-production >> .env.local
echo ENCRYPTION_KEY=local-dev-encryption-key-change-in-production >> .env.local
echo BACKUP_ENCRYPTION_KEY=local-dev-backup-key-change-in-production >> .env.local
echo SESSION_SECRET=local-dev-session-secret-change-in-production >> .env.local
echo REFRESH_TOKEN_SECRET=local-dev-refresh-secret-change-in-production >> .env.local
echo API_SECRET=local-dev-api-secret-change-in-production >> .env.local
echo YOUR_DOMAIN=localhost >> .env.local
echo PRODUCTION_DOMAIN=localhost >> .env.local
echo API_KEYS=local-dev-api-key >> .env.local

echo.
echo ✅ Local environment file created: .env.local
echo.
echo Starting local database services...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo ⏳ Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo.
echo 🗄️ Setting up database...
npm run db:setup

echo.
echo 🎉 Local development setup complete!
echo.
echo To start the application:
echo   1. Server:   npm run server:dev
echo   2. Mobile:   npm start
echo.
echo Database: localhost:5432
echo Username: postgres
echo Password: postgres
echo.
pause
