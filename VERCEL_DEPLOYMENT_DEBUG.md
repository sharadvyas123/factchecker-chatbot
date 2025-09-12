# Vercel Production Deployment Debug Guide

## 🚨 Critical Issues Fixed

### 1. Security Issue Fixed
- **REMOVED** hardcoded MongoDB credentials from `src/lib/mongodb.ts`
- Now requires `MONGODB_URI` environment variable (no fallback)

### 2. Error Logging Added
- Added proper error logging in login and register routes
- You can now see actual errors in Vercel function logs

## 🔧 Required Environment Variables in Vercel

Make sure these are set in your Vercel project settings:

### Required Variables:
```bash
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/factcheck-chatbot?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-jwt-secret-key-minimum-32-characters-long
N8N_WEBHOOK_URL=https://sharadvyas.app.n8n.cloud/webhook/fact-check
NODE_ENV=production
```

### Important Notes:
- `JWT_SECRET` must be at least 32 characters long
- `MONGODB_URI` must include your actual MongoDB Atlas credentials
- `NODE_ENV=production` enables secure cookies

## 🐛 Debugging Steps

### Step 1: Check Vercel Environment Variables
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Verify ALL required variables are set correctly
4. **Important**: Make sure there are no extra spaces or quotes

### Step 2: Check Vercel Function Logs
1. Go to your Vercel project dashboard
2. Click "Functions" tab
3. Find the failing API route (e.g., `/api/auth/login`)
4. Click "View Function Logs"
5. Look for the specific error message (now logged with `console.error`)

### Step 3: Common Production Issues

#### MongoDB Connection Issues:
- ✅ Check MongoDB Atlas IP whitelist (allow `0.0.0.0/0` for Vercel)
- ✅ Verify MongoDB URI is correct and includes database name
- ✅ Ensure MongoDB user has read/write permissions

#### JWT Issues:
- ✅ Verify `JWT_SECRET` is set and long enough
- ✅ Check cookie settings work with your domain

#### N8N Webhook Issues:
- ✅ Verify webhook URL is accessible from Vercel
- ✅ Check CORS settings if applicable

## 🚀 Deployment Commands

```bash
# Build locally to test
npm run build

# Deploy to Vercel (if using Vercel CLI)
vercel --prod

# Or commit and push to trigger automatic deployment
git add .
git commit -m "Fix production login issues"
git push origin main
```

## 📝 Testing After Deployment

1. Try to register a new user
2. Try to login with existing credentials
3. Check Vercel function logs for any errors
4. Test the chat functionality after login

## 🆘 If Issues Persist

1. **Check Function Logs**: The most important step - actual error messages are now logged
2. **Verify Environment Variables**: Double-check all variables are set correctly
3. **Test MongoDB Connection**: Use MongoDB Compass or mongo shell to verify connection
4. **Check Network Access**: Ensure your MongoDB Atlas cluster allows Vercel IPs

## 🔍 Expected Behavior Now

- ✅ Proper error logging in production
- ✅ No hardcoded credentials in code
- ✅ Validation for required environment variables
- ✅ Better security with production-ready settings
