@echo off
echo Setting up SQLite-based local development for Supermarket Go...

REM Create local environment file for SQLite
echo DATABASE_URL=sqlite:./supermarket_go_dev.db > .env.local
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
echo 🗄️ Setting up SQLite database...
npm run db:setup:sqlite

echo.
echo 🎉 SQLite-based local development setup complete!
echo.
echo To start the application:
echo   1. Server:   npm run server:dev
echo   2. Mobile:   npm start
echo.
echo Database file: supermarket_go_dev.db
echo Default admin login: +998901234567 / admin
echo.
pause
