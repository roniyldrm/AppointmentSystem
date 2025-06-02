# Pre-Deployment Checklist

Follow this checklist **exactly** to avoid CORS errors:

## ✅ Step 1: Prepare MongoDB
- [ ] Create MongoDB Atlas cluster (or ensure existing one is accessible)
- [ ] Whitelist `0.0.0.0/0` in Network Access (for Render deployment)
- [ ] Get connection string for environment variable

## ✅ Step 2: Deploy Backend to Render FIRST
- [ ] Create new Web Service on Render
- [ ] Connect your GitHub repository
- [ ] Set build command: `go build -o main .`
- [ ] Set start command: `./main`
- [ ] Add environment variables:
  ```
  PORT=8080
  MONGODB_URI=mongodb+srv://your-mongo-atlas-connection-string
  JWT_SECRET=your-super-secure-jwt-secret-for-production
  JWT_REFRESH_SECRET=your-super-secure-refresh-secret-different-from-jwt
  MAILERSEND_API_KEY=mlsn.e8037a22dfb79211b6c58915d958459758b67dd111309d723757ea8043a5df66
  MAILERSEND_FROM_EMAIL=no-reply@test-r83ql3ppdmvgzw1j.mlsender.net
  MAILERSEND_FROM_NAME=e-pulse
  ```
- [ ] Deploy and wait for success
- [ ] **IMPORTANT**: Copy the Render URL (e.g., `https://your-app-name.onrender.com`)

## ✅ Step 3: Update Frontend Config
- [ ] Open `frontend/src/config/api.js`
- [ ] Replace `"https://your-render-app-name.onrender.com/api"` with your actual Render URL
- [ ] Replace `"wss://your-render-app-name.onrender.com"` with your actual Render URL
- [ ] Commit changes to GitHub

## ✅ Step 4: Deploy Frontend to Vercel
- [ ] Connect GitHub repository to Vercel
- [ ] Set root directory to `frontend/`
- [ ] Add environment variables:
  ```
  NODE_ENV=production
  REACT_APP_API_URL=https://your-render-app-name.onrender.com/api
  REACT_APP_WS_URL=wss://your-render-app-name.onrender.com
  ```
- [ ] Deploy and wait for success
- [ ] **IMPORTANT**: Copy the Vercel URL (e.g., `https://your-app-name.vercel.app`)

## ✅ Step 5: Update Backend CORS (CRITICAL!)
- [ ] Go back to Render dashboard
- [ ] Update environment variables:
  ```
  CORS_ORIGINS=https://your-app-name.vercel.app,https://your-app-name-git-main.vercel.app
  ```
- [ ] **IMPORTANT**: Replace with your actual Vercel URLs
- [ ] Redeploy the Render service
- [ ] Wait for deployment to complete

## ✅ Step 6: Test the Deployment
- [ ] Open your Vercel URL
- [ ] Open browser developer tools
- [ ] Try to login
- [ ] Check console for CORS errors
- [ ] Verify API calls show successful responses (status 200)
- [ ] Test appointment creation
- [ ] Test WebSocket notifications

## 🚨 Troubleshooting CORS Issues

If you still get CORS errors:

1. **Check exact domain spelling**: Make sure CORS_ORIGINS matches your Vercel domain exactly
2. **Include all Vercel domains**: Add both main and preview domains
3. **Restart Render service**: After changing CORS_ORIGINS, always restart
4. **Check HTTPS**: Both frontend and backend must use HTTPS in production
5. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)

## 📝 Common Mistakes

- ❌ Forgetting to update CORS_ORIGINS after frontend deployment
- ❌ Not restarting Render service after environment variable changes
- ❌ Using HTTP instead of HTTPS URLs
- ❌ Deploying frontend before backend
- ❌ Incorrect environment variable names

## ✅ Success Indicators

You'll know it's working when:
- [ ] No CORS errors in browser console
- [ ] Login works without errors
- [ ] API calls return data (not error messages)
- [ ] Real-time notifications work
- [ ] All features function as in development 