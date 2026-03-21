# Deploy to Render.com for free public API

## Steps:
1. Go to render.com
2. Sign up for free account
3. Create new "Web Service"
4. Connect your GitHub repo
5. Set build command: "npm install"
6. Set start command: "npm run server:dev"
7. Add environment variable: DATABASE_URL=postgresql://neondb_owner:npg_9mqBLiolPX8O@ep-shy-fog-a4rjc23q-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require

## Result:
- Your API gets a public URL like: https://your-app.onrender.com
- Use this URL in EXPO_PUBLIC_API_URL
- Share your Expo tunnel URL with friends
