# Netlify Deployment Guide for Sale Makseb

## Quick Overview
Netlify is a modern hosting platform that automatically deploys your site from GitHub and supports custom domains with free SSL certificates.

---

## Step 1: Prepare Your Repository

### Ensure Your Code is on GitHub
1. Make sure all your latest changes are committed
2. Push to your GitHub repository
3. Note your repository URL (e.g., `github.com/yourusername/sale-makseb`)

---

## Step 2: Create Netlify Account

1. Go to [netlify.com](https://www.netlify.com)
2. Click **"Sign up"**
3. Choose **"Sign up with GitHub"** (recommended for easier deployment)
4. Authorize Netlify to access your GitHub repositories

---

## Step 3: Deploy Your Site

### 3.1 Import Your Project
1. From Netlify dashboard, click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository from the list
4. If you don't see it, click **"Configure Netlify on GitHub"** to grant access

### 3.2 Configure Build Settings
Netlify should auto-detect Next.js settings, but verify:

- **Branch to deploy:** `main` (or your default branch)
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Functions directory:** (leave empty for Next.js)

### 3.3 Click **"Deploy site"**
- First deployment takes 2-5 minutes
- You'll get a temporary URL like: `random-name-123456.netlify.app`

---

## Step 4: Add Environment Variables

**CRITICAL:** Your app needs these to work properly.

1. In Netlify dashboard, go to: **Site settings** → **Environment variables**
2. Click **"Add a variable"** and add each one:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_ACCESS_TOKEN=your_access_token

# Add any other API keys you're using
OPENAI_API_KEY=your_openai_key
ZAPIER_WEBHOOK_URL=your_zapier_webhook
AMAZON_ASSOCIATES_TAG=your_amazon_tag
```

**Where to find these:**
- Supabase values: Your Supabase project settings
- API keys: Your respective service dashboards
- Check `.env.local` file for all required variables

3. After adding all variables, click **"Deploy site"** again to rebuild with the new environment

---

## Step 5: Set Up Custom Domain

### 5.1 Add Domain to Netlify
1. In Netlify dashboard: **Domain settings** → **Add custom domain**
2. Enter your domain name (e.g., `yourdomain.com`)
3. Click **"Verify"** → **"Add domain"**

### 5.2 Configure DNS

**Option A: Use Netlify DNS (Recommended - Easiest)**
1. Netlify will show you their nameservers (e.g., `dns1.p03.nsone.net`)
2. Go to your domain registrar (GoDaddy, Namecheap, etc.)
3. Find DNS settings
4. Replace existing nameservers with Netlify's nameservers
5. Save changes

**Option B: Keep Your DNS Provider**
1. Get your Netlify site's URL from **Domain settings**
2. In your domain registrar's DNS settings, add:
   - **A Record:** Point `@` to Netlify's IP (shown in dashboard)
   - **CNAME Record:** Point `www` to your Netlify subdomain

### 5.3 Enable HTTPS
1. In Netlify: **Domain settings** → **HTTPS**
2. Click **"Verify DNS configuration"**
3. Once verified, click **"Provision certificate"**
4. SSL certificate is issued automatically (takes a few minutes)

**Wait 24-48 hours for full DNS propagation**

---

## Step 6: Configure Redirects & Headers

Create a `netlify.toml` file in your project root for better configuration:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"

# Security headers
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

---

## Step 7: Update Supabase Redirect URLs

Since you're changing from Vercel to Netlify:

1. Go to your Supabase project dashboard
2. Navigate to: **Authentication** → **URL Configuration**
3. Update **Site URL** to: `https://yourdomain.com`
4. Add to **Redirect URLs:**
   ```
   https://yourdomain.com/**
   https://yourdomain.netlify.app/**
   ```
5. Save changes

---

## Step 8: Test Everything

### 8.1 Test Basic Functionality
- Visit your new domain
- Create an account
- Log in
- Test product links
- Check tracking

### 8.2 Test API Routes
Your API routes are at: `yourdomain.com/api/*`
- Test click tracking
- Test webhooks
- Verify analytics

### 8.3 Monitor Deployment
- In Netlify: **Deploys** tab shows build logs
- Check for any errors
- Each commit to GitHub auto-deploys

---

## Important Notes for Your Project

### ⚠️ Cron Jobs & Scheduled Tasks
**ISSUE:** Netlify doesn't support cron jobs natively like Vercel.

**Solutions:**
1. **Use External Cron Service (Recommended):**
   - [EasyCron](https://www.easycron.com/) - Free tier available
   - [cron-job.org](https://cron-job.org) - Free service
   - Set up to hit your API endpoints:
     - `https://yourdomain.com/api/cron/autopilot` (every 30 min)
     - `https://yourdomain.com/api/cron/discover-products` (daily)

2. **Use Netlify Functions + GitHub Actions:**
   - Trigger functions via GitHub Actions scheduled workflows
   - More complex but free

3. **Use Zapier:**
   - Schedule Zaps to hit your endpoints
   - Paid after free tier

### ⚠️ API Route Limits
- Netlify Functions timeout: 10 seconds (free tier) / 26 seconds (paid)
- If your autopilot takes longer, split into smaller functions

### ⚠️ Database Connections
- Your Supabase connection works fine
- No changes needed

---

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify site created and deployed
- [ ] All environment variables added
- [ ] First deployment successful
- [ ] Custom domain added
- [ ] DNS configured at registrar
- [ ] HTTPS/SSL certificate provisioned
- [ ] Supabase redirect URLs updated
- [ ] Test user signup/login
- [ ] Test product links
- [ ] Test click tracking
- [ ] Set up external cron service
- [ ] Monitor first 24 hours

---

## Troubleshooting

### Build Fails
- Check **Deploys** → **Deploy log** for errors
- Verify all environment variables are set
- Ensure Node version matches (18+)

### Domain Not Working
- DNS can take 24-48 hours
- Verify nameservers are correctly set
- Use [DNS Checker](https://dnschecker.org) to verify propagation

### API Routes Not Working
- Check function logs in Netlify dashboard
- Verify environment variables
- Test endpoints directly: `yourdomain.com/api/test`

### SSL Certificate Issues
- Ensure DNS is fully propagated
- Re-verify DNS configuration in Netlify
- Try provisioning certificate again

---

## After Deployment

### Monitor Performance
- Netlify Analytics (paid add-on) or use Google Analytics
- Check Supabase dashboard for database activity
- Monitor error rates

### Set Up Notifications
- Netlify can send deploy notifications
- Set up email alerts for failed deployments

### Regular Updates
- Every GitHub push triggers auto-deployment
- Test in a staging branch first
- Merge to main when ready

---

## Cost Comparison

### Netlify Pricing
- **Free Tier:**
  - 300 build minutes/month
  - 100GB bandwidth
  - Automatic SSL
  - Perfect for starting out

- **Pro Tier ($19/month):**
  - Longer function timeout
  - More bandwidth
  - Better support

### vs Vercel
- Similar pricing structure
- Vercel better for Next.js-specific features
- Netlify better for general static sites
- Both work great for your project

---

## Need Help?

If you encounter issues:
1. Check Netlify's [Next.js deployment docs](https://docs.netlify.com/integrations/frameworks/next-js/)
2. Review deploy logs in Netlify dashboard
3. Test locally first: `npm run build` → `npm start`
4. Check Netlify community forums

---

**You're all set! Your site will be live once DNS propagates. 🚀**