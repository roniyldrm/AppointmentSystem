# Deployment Guide - Vercel Frontend + Render Backend

This guide helps you deploy your Hospital Appointment System to avoid CORS errors.

## Step 1: Prepare Backend for Render

### Environment Variables on Render
Set these environment variables in your Render dashboard:

```
PORT=8080
MONGODB_URI=mongodb+srv://your-mongo-atlas-connection-string
JWT_SECRET=your-super-secure-jwt-secret-for-production
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-different-from-jwt
MAILERSEND_API_KEY=mlsn.e8037a22dfb79211b6c58915d958459758b67dd111309d723757ea8043a5df66
MAILERSEND_FROM_EMAIL=no-reply@test-r83ql3ppdmvgzw1j.mlsender.net
MAILERSEND_FROM_NAME=e-pulse
```

**IMPORTANT:** After deploying frontend to Vercel, update CORS_ORIGINS:
```
CORS_ORIGINS=https://your-app-name.vercel.app,https://your-app-name-git-main.vercel.app
```

### Render Deployment Settings
- **Build Command:** `go build -o main .`
- **Start Command:** `./main`
- **Auto-Deploy:** Enable for main branch

## Step 2: Update Frontend for Production

### Create Production API Config
Update `frontend/src/config/api.js`:

```javascript
// Dynamic API URL based on environment
const API_URL = process.env.NODE_ENV === 'production' 
  ? "https://your-render-app-name.onrender.com/api"  // Replace with your Render URL
  : "http://localhost:8080/api";

const WS_URL_BASE = process.env.NODE_ENV === 'production'
  ? "wss://your-render-app-name.onrender.com"        // Replace with your Render URL
  : "ws://localhost:8080";
```

### Vercel Environment Variables
In your Vercel dashboard, set:
```
NODE_ENV=production
REACT_APP_API_URL=https://your-render-app-name.onrender.com/api
```

## Step 3: Deployment Order (IMPORTANT!)

### 1. Deploy Backend First
1. Deploy backend to Render
2. Note the URL: `https://your-app-name.onrender.com`
3. Update CORS_ORIGINS in Render environment variables

### 2. Deploy Frontend Second
1. Update API_URL in frontend config with Render URL
2. Deploy to Vercel
3. Note the URL: `https://your-app-name.vercel.app`

### 3. Update Backend CORS
1. Go back to Render dashboard
2. Update CORS_ORIGINS environment variable:
   ```
   CORS_ORIGINS=https://your-app-name.vercel.app,https://your-app-name-git-main.vercel.app
   ```
3. Restart the Render service

## Step 4: Common CORS Issues & Solutions

### Issue: "CORS policy: No 'Access-Control-Allow-Origin'"
**Solution:** Ensure CORS_ORIGINS includes your exact Vercel domain

### Issue: "Mixed Content" (HTTP vs HTTPS)
**Solution:** Use HTTPS for both frontend and backend URLs

### Issue: WebSocket Connection Fails
**Solution:** Use `wss://` for production WebSocket URLs

### Issue: Preflight OPTIONS Requests Fail
**Solution:** Your current backend config already handles this with:
```go
AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "PATCH"}
AllowedHeaders: []string{"Content-Type", "Authorization"}
```

## Step 5: Testing the Deployment

### Test Checklist:
- [ ] Login/Registration works
- [ ] API calls return data (not CORS errors)
- [ ] WebSocket notifications work
- [ ] All CRUD operations function
- [ ] Admin panel accessible

### Quick CORS Test:
Open browser console and check for CORS errors. Should see successful API calls like:
```
Making POST request to: https://your-render-app.onrender.com/api/auth/login
Response status: 200
```

## Step 6: Environment Variables Template

### Render Backend Variables:
```
PORT=8080
MONGODB_URI=mongodb+srv://...
CORS_ORIGINS=https://your-vercel-app.vercel.app,https://your-vercel-app-git-main.vercel.app
JWT_SECRET=production-jwt-secret-here
JWT_REFRESH_SECRET=production-refresh-secret-here
MAILERSEND_API_KEY=mlsn.e8037a22dfb79211b6c58915d958459758b67dd111309d723757ea8043a5df66
MAILERSEND_FROM_EMAIL=no-reply@test-r83ql3ppdmvgzw1j.mlsender.net
MAILERSEND_FROM_NAME=e-pulse
```

### Vercel Frontend Variables:
```
NODE_ENV=production
REACT_APP_API_URL=https://your-render-app.onrender.com/api
```

## Troubleshooting

### If you still get CORS errors:
1. Check exact domain spelling in CORS_ORIGINS
2. Include both www and non-www versions if needed
3. Check if Render service restarted after environment variable changes
4. Verify API_URL matches Render domain exactly

### WebSocket Issues:
1. Use `wss://` not `ws://` for production
2. Ensure Render supports WebSocket connections
3. Check firewall/proxy settings 