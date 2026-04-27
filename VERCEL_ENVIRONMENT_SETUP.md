# Vercel Environment Variables Setup

## Problem
Your production site shows "Failed to fetch" when trying to sign in/sign up because the environment variables are not configured in Vercel.

## Solution: Add Environment Variables to Vercel

### Step 1: Open Vercel Dashboard
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Find your project: `sg-48a75671-d21c-4654-89ba-2f744e62`
3. Click on the project

### Step 2: Add Environment Variables
1. Click **Settings** (top navigation)
2. Click **Environment Variables** (left sidebar)
3. Add these variables one by one:

#### Required Variables:

**1. NEXT_PUBLIC_SUPABASE_URL**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://lfpwqhafnnrhgxjdpqvf.supabase.co`
- Environment: **Production**, **Preview**, **Development** (select all 3)
- Click **Save**

**2. NEXT_PUBLIC_SUPABASE_ANON_KEY**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcHdxaGFmbm5yaGd4amRwcXZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyOTQ4NDcsImV4cCI6MjA1NDg3MDg0N30.KrLO6e0xcWwfnMD9JWUD59lZrAm62JtMxBDa61h9ywA`
- Environment: **Production**, **Preview**, **Development** (select all 3)
- Click **Save**

**3. NEXT_PUBLIC_SITE_URL**
- Key: `NEXT_PUBLIC_SITE_URL`
- Value: `https://sg-48a75671-d21c-4654-89ba-2f744e62.vercel.app`
- Environment: **Production**, **Preview**, **Development** (select all 3)
- Click **Save**

**4. SUPABASE_SERVICE_ROLE_KEY**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcHdxaGFmbm5yaGd4amRwcXZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTI5NDg0NywiZXhwIjoyMDU0ODcwODQ3fQ.QQ0Kt0wKZqhV0YDnKhZW2CUqS-Jn87i5nFwKnuU4N5o`
- Environment: **Production**, **Preview**, **Development** (select all 3)
- Click **Save**

**5. CRON_SECRET**
- Key: `CRON_SECRET`
- Value: `sk_cron_live_f8b2e4c6a1d9f3e7b5a2c8d4e6f9a1b3c5d7e9f2a4b6c8d0`
- Environment: **Production**, **Preview**, **Development** (select all 3)
- Click **Save**

**6. ZAPIER_WEBHOOK_URL (Optional)**
- Key: `ZAPIER_WEBHOOK_URL`
- Value: `https://hooks.zapier.com/hooks/catch/20810298/2aogfp5/`
- Environment: **Production**, **Preview**, **Development** (select all 3)
- Click **Save**

### Step 3: Redeploy
1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait 2-3 minutes for the build to complete

### Step 4: Test
1. Visit your production site: `https://sg-48a75671-d21c-4654-89ba-2f744e62.vercel.app`
2. Click "Sign In" or "Get Started Free"
3. Try to create an account or sign in
4. Should work without "Failed to fetch" error

## Troubleshooting

### Still getting "Failed to fetch"?
1. Check browser console (F12 → Console tab)
2. Look for error messages
3. Visit `/supabase-connection-test` to diagnose

### Environment variables not showing?
1. Make sure you selected all 3 environments (Production, Preview, Development)
2. Make sure you clicked "Save" for each variable
3. Redeploy after adding all variables

### How to verify environment variables are set?
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. You should see all 6 variables listed
3. Each should show "Production, Preview, Development" under "Environments"

## Alternative: Use Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add NEXT_PUBLIC_SITE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add CRON_SECRET
vercel env add ZAPIER_WEBHOOK_URL

# Redeploy
vercel --prod
```

## Security Notes
- **NEVER commit** environment variables to Git
- Keep `.env.local` in `.gitignore` (already done)
- The `SUPABASE_SERVICE_ROLE_KEY` is sensitive - only add it in Vercel, never in frontend code
- `NEXT_PUBLIC_*` variables are safe to expose to the browser