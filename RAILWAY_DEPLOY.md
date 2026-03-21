# Deploy to Railway for free public access

## Steps:
1. Install Railway CLI: npm install -g @railway/cli
2. Login: railway login
3. Initialize: railway init
4. Deploy: railway up

## Or use GitHub integration:
1. Push your code to GitHub
2. Go to railway.app
3. Connect your GitHub repo
4. Deploy automatically

## Environment Variables needed:
- DATABASE_URL=postgresql://neondb_owner:npg_9mqBLiolPX8O@ep-shy-fog-a4rjc23q-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
- NODE_ENV=production
