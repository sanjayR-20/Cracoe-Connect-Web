# Vercel Deployment Guide

## ✅ GitHub Status
- Latest commit: **72a29bd**
- Branch: **main**
- Status: **All changes pushed**

---

## Step 1: Login to Vercel

1. Go to https://vercel.com
2. Click "Login" or "Sign Up"
3. Choose "Continue with GitHub"
4. Authorize Vercel to access your GitHub

---

## Step 2: Import Project

### Option A: If Project Already Exists on Vercel
1. Go to https://vercel.com/dashboard
2. Find your project "Cracoe-Connect-Web"
3. Click on it
4. Vercel will auto-deploy the latest commit
5. Wait for deployment to complete (2-3 minutes)

### Option B: If New Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Search for "Cracoe-Connect-Web"
4. Click "Import"
5. Configure project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

---

## Step 3: Add Environment Variables

1. In Vercel project settings, click "Settings" tab
2. Click "Environment Variables" in left sidebar
3. Add these variables:

| Name | Value |
|------|-------|
| `REACT_APP_SUPABASE_URL` | `https://jybjhdzippgpbqtksjkr.supabase.co` |
| `REACT_APP_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5YmpoZHppcHBncGJxdGtzamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTkwMjIsImV4cCI6MjA4NTg3NTAyMn0.2_pO5bVY-PjN9J6NVP5Z49VSk69ADnemH_2hHyBsrCI` |
| `REACT_APP_SIGNALING_URL` | `ws://localhost:3000/ws` (or your backend URL) |

4. Click "Save" for each variable
5. Select "Production", "Preview", and "Development" for each

---

## Step 4: Redeploy (if needed)

1. Go to "Deployments" tab
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Wait for deployment to complete

---

## Step 5: Verify Deployment

1. Click "Visit" button to open your deployed site
2. Test login functionality
3. Verify Supabase connection works
4. Test task updates with authorized users
5. Check leaderboard displays correctly

---

## Quick Commands (Alternative: Vercel CLI)

If you prefer command line:

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from web directory
cd "e:\Cracoe connect\web"
vercel --prod
```

---

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify package.json has all dependencies
- Try building locally: `npm run build`

### Environment Variables Not Working
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)
- Verify no extra spaces in values

### Supabase Connection Fails
- Check environment variables are set
- Verify Supabase URL and key are correct
- Check browser console for errors

---

## Deployment URL

After deployment, your app will be available at:
- Production: `https://cracoe-connect-web.vercel.app` (or your custom domain)
- Preview: `https://cracoe-connect-web-git-main-[username].vercel.app`

---

## Auto-Deploy Setup

Vercel automatically deploys when you push to GitHub:
- Push to `main` branch → Production deployment
- Push to other branches → Preview deployment
- Pull requests → Preview deployment

✅ Your app is now live on Vercel!
