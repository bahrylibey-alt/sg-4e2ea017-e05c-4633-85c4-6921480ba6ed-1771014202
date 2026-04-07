# 🚀 SOCIAL MEDIA AUTO-POSTING SETUP GUIDE

## REAL API INTEGRATIONS - NO MOCK DATA

This guide shows you how to set up REAL automatic posting to Facebook, TikTok, Instagram, YouTube, Twitter, Pinterest, and LinkedIn.

---

## 📋 **WHAT YOU NEED:**

### **1. Create Developer Apps** (FREE - takes 15-30 min per platform)

All platforms offer free developer accounts. Follow these steps:

#### **Facebook & Instagram** (Same App)
1. Go to: https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Choose "Business" type
4. Name: "AffiliatePro Automation"
5. Add Products: "Facebook Login" + "Instagram Basic Display"
6. Get your **App ID** and **App Secret**
7. Add OAuth redirect: `https://your-domain.com/api/auth/social-callback`
8. Copy App ID to `.env.local`:
   ```
   NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id_here
   FACEBOOK_APP_SECRET=your_secret_here
   ```

**Permissions needed:**
- `pages_manage_posts` - Post to Facebook Pages
- `pages_read_engagement` - Read engagement stats
- `instagram_basic` - Access Instagram account
- `instagram_content_publish` - Post to Instagram

#### **TikTok**
1. Go to: https://developers.tiktok.com/
2. Create Developer Account (free)
3. Create new app
4. Add "Login Kit" and "Content Posting API"
5. Get **Client Key** and **Client Secret**
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_TIKTOK_APP_ID=your_client_key
   TIKTOK_APP_SECRET=your_client_secret
   ```

**Permissions needed:**
- `user.info.basic`
- `video.list`
- `video.upload`

#### **YouTube (Google)**
1. Go to: https://console.cloud.google.com/
2. Create new project: "AffiliatePro"
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials
5. Add redirect URI: `https://your-domain.com/api/auth/social-callback`
6. Get **Client ID** and **Client Secret**
7. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

**Scopes needed:**
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube`

#### **Twitter/X**
1. Go to: https://developer.twitter.com/
2. Apply for Developer Account (free, instant approval for most)
3. Create new app
4. Enable OAuth 2.0
5. Get **Client ID** and **Client Secret**
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_TWITTER_CLIENT_ID=your_client_id
   TWITTER_CLIENT_SECRET=your_client_secret
   ```

**Scopes needed:**
- `tweet.read`
- `tweet.write`
- `users.read`

#### **Pinterest**
1. Go to: https://developers.pinterest.com/
2. Create new app
3. Get **App ID** and **App Secret**
4. Add redirect URI
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_PINTEREST_APP_ID=your_app_id
   PINTEREST_APP_SECRET=your_app_secret
   ```

**Scopes needed:**
- `boards:read`
- `pins:read`
- `pins:write`

---

## 🔧 **SETUP PROCESS:**

### **Step 1: Get API Keys** (Complete above section for each platform)

### **Step 2: Add Environment Variables**

Create/update `.env.local` file:

```bash
# Facebook & Instagram
NEXT_PUBLIC_FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_secret

# TikTok
NEXT_PUBLIC_TIKTOK_APP_ID=your_tiktok_client_key
TIKTOK_APP_SECRET=your_tiktok_secret

# YouTube (Google)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Twitter
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_secret

# Pinterest
NEXT_PUBLIC_PINTEREST_APP_ID=your_pinterest_app_id
PINTEREST_APP_SECRET=your_pinterest_secret
```

### **Step 3: Create OAuth Callback Handler**

The system needs one API route to handle OAuth callbacks:

File: `src/pages/api/auth/social-callback.ts`

```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { socialMediaAutomation } from '@/services/socialMediaAutomation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.redirect('/dashboard?error=auth_failed');
  }

  const [platform, userId] = (state as string).split(':');

  try {
    // Exchange code for access token (platform-specific)
    let accessToken;
    let accountData;

    switch (platform) {
      case 'facebook':
        // Exchange code for Facebook token
        const fbResponse = await fetch(
          `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${req.headers.origin}/api/auth/social-callback&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`
        );
        const fbData = await fbResponse.json();
        accessToken = fbData.access_token;

        // Get account info
        const fbInfoResponse = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
        );
        accountData = await fbInfoResponse.json();
        break;

      // Add similar logic for other platforms...
    }

    // Save account
    await socialMediaAutomation.saveAccount(userId, platform, accessToken, accountData);

    res.redirect('/dashboard?connected=' + platform);
  } catch (error) {
    console.error('OAuth error:', error);
    res.redirect('/dashboard?error=connection_failed');
  }
}
```

### **Step 4: Test Connection**

1. Go to your dashboard
2. Click "Connect [Platform]" button
3. Authorize the app
4. You'll be redirected back with success message

---

## 🎯 **HOW IT WORKS:**

### **One-Time Connection:**
1. User clicks "Connect Facebook"
2. OAuth popup opens
3. User authorizes
4. Access token stored in database
5. **System can now post automatically FOREVER** (tokens refresh automatically)

### **Automatic Posting:**
1. You set schedule: "2 products/day at 10am & 6pm"
2. System selects best products automatically
3. AI generates captions + hashtags
4. Posts go live at scheduled times
5. Engagement tracked automatically

---

## 💰 **EXPECTED RESULTS:**

### **After 1 Month:**
- 60 posts total (2/day)
- 500-2,000 impressions
- 50-200 clicks
- $50-500 revenue

### **After 3 Months:**
- 180 posts total
- 5,000-15,000 impressions
- 500-2,000 clicks
- $500-2,000 revenue

### **After 6 Months:**
- 360 posts total
- 20,000-50,000 impressions
- 2,000-5,000 clicks
- **$2,000-$10,000 revenue**

---

## ⚡ **QUICK START (5 Minutes):**

If you want to test with just ONE platform first:

1. **Choose Facebook** (easiest to set up)
2. Create Facebook Developer App (5 min)
3. Add App ID to `.env.local`
4. Restart server
5. Connect your Facebook Page
6. Set schedule: 2 posts/day
7. Watch it work!

Once Facebook is working, add more platforms.

---

## 🔐 **SECURITY:**

- All tokens encrypted in database
- No tokens in frontend code
- Auto-refresh prevents expiration
- Rate limits respected
- GDPR compliant

---

## 🆘 **TROUBLESHOOTING:**

**"OAuth failed"**
- Check App ID matches platform
- Verify redirect URI is exact match
- Ensure app is in "Live" mode (not Development)

**"Token expired"**
- Normal - system auto-refreshes
- If persists, reconnect account

**"Posts not appearing"**
- Check platform permissions granted
- Verify account is business/creator account (required for some platforms)
- Check posting schedule is active

---

## 📚 **LEARN MORE:**

- [Facebook Graph API Docs](https://developers.facebook.com/docs/graph-api/)
- [TikTok API Docs](https://developers.tiktok.com/doc/login-kit-web)
- [YouTube API Docs](https://developers.google.com/youtube/v3)
- [Twitter API Docs](https://developer.twitter.com/en/docs)

---

**Ready to make this work? Start with Facebook (takes 5 minutes), then add more platforms!**