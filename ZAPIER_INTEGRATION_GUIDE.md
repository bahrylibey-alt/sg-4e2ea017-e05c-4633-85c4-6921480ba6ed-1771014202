# ZAPIER INTEGRATION GUIDE
## Connect Your App to Real Social Media

## 🎯 WHAT THIS DOES

Autopilot creates posts in your database every 30 seconds.
Zapier picks them up and posts to your REAL social media accounts.
Real followers see the posts → Click links → Generate revenue.

---

## 📋 STEP-BY-STEP SETUP

### PART 1: CREATE ZAPIER WEBHOOK

1. **Go to Zapier.com** → Click "Create Zap"

2. **Set Trigger:**
   - App: "Webhooks by Zapier"
   - Event: "Catch Hook"
   - Click "Continue"
   - **COPY THE WEBHOOK URL** (looks like: `https://hooks.zapier.com/hooks/catch/12345/abcde/`)

3. **Test the webhook:**
   - Zapier will wait for test data
   - Keep this tab open

---

### PART 2: UPDATE YOUR APP

1. **Go to your app** → Dashboard → Settings → Integrations

2. **Find Zapier section**

3. **Paste the webhook URL** you copied from Step 1

4. **Click "Save"** or "Update Integration"

5. **Click "Test Connection"** - This sends a test webhook to Zapier

6. **Go back to Zapier tab** → Click "Test trigger" 
   - You should see test data appear
   - Click "Continue"

---

### PART 3: ADD SOCIAL MEDIA ACTIONS

Now add actions to post to your real social media:

#### ACTION 1: Post to Facebook

1. **Click "+ Add Step"** → Search "Facebook"
2. **Event:** "Create Page Post"
3. **Connect your Facebook account**
4. **Map the data:**
   - Page: Select your Facebook page
   - Message: `caption` (from webhook data)
   - Link: `link_url` (from webhook data)
5. **Test the action** → Should post to Facebook
6. **Click "Continue"**

#### ACTION 2: Post to Instagram (Optional)

1. **Click "+ Add Step"** → Search "Instagram"
2. **Event:** "Create Media Post"
3. **Connect your Instagram Business account**
4. **Map the data:**
   - Caption: `caption`
   - Image URL: `image_url` (from webhook)
5. **Test and Continue**

#### ACTION 3: Post to Twitter (Optional)

1. **Click "+ Add Step"** → Search "Twitter"
2. **Event:** "Create Tweet"
3. **Connect your Twitter account**
4. **Map the data:**
   - Message: `caption`
   - Include link: `link_url`
5. **Test and Continue**

---

### PART 4: TURN ON THE ZAP

1. **Name your Zap:** "Autopilot to Social Media"
2. **Click "Publish"** or "Turn On"
3. **Zap Status:** Should show "ON" with green checkmark

---

## ✅ VERIFICATION

### Test the Complete Flow:

1. **Go to Dashboard → AI Autopilot**
2. **Click "Run Cycle Now"**
3. **Wait 30 seconds**
4. **Check Zapier** → Go to "Zap History" → Should see successful runs
5. **Check your social media** → New post should appear on Facebook/Instagram/Twitter

---

## 📊 WHAT DATA GETS SENT TO ZAPIER

Every time autopilot creates a post, it sends this JSON to your webhook:

```json
{
  "event": "post.created",
  "data": {
    "id": "uuid-of-post",
    "platform": "facebook",
    "caption": "Check out this amazing product! #affiliate",
    "link_url": "https://yourapp.com/go/product-slug",
    "image_url": "https://example.com/product-image.jpg",
    "hashtags": ["affiliate", "product", "deal"],
    "created_at": "2026-04-11T08:00:00Z"
  },
  "timestamp": "2026-04-11T08:00:00Z"
}
```

---

## 🔄 ALTERNATIVE: POLLING METHOD

If you don't want to use webhooks, Zapier can also **poll** for new content:

1. **Create Zap** → Trigger: "Webhooks by Zapier - Retrieve Poll"
2. **URL:** `https://yourapp.vercel.app/api/zapier/content-feed`
3. **Schedule:** Every 5 minutes
4. **Zapier fetches new posts** with `status='pending'`
5. **Then posts to social media**

This is already set up in your app! Just configure the Zap.

---

## 🐛 TROUBLESHOOTING

### Issue: Zapier not receiving posts

**Check:**
- Is webhook URL correct? (Should start with `https://hooks.zapier.com/`)
- Is Zap turned ON?
- Go to Dashboard → Database tab → `integrations` table → Check `config` column

**Fix:**
- Update webhook URL in Settings → Integrations
- Make sure `status='connected'` in integrations table

### Issue: Posts created but not appearing on social media

**Check:**
- Zapier Zap History → Any errors?
- Social media accounts connected in Zapier?
- Do you have posting permissions?

**Fix:**
- Reconnect social accounts in Zapier
- Check Facebook/Instagram Business Manager permissions
- Test each action in Zapier manually

### Issue: Revenue not increasing after posts go live

**Check:**
- Are people clicking the links? (Check Dashboard → Analytics)
- Are affiliate links working? (Click one yourself)
- Is conversion tracking set up? (Check Dashboard → Traffic Sources)

**Fix:**
- Make sure affiliate links redirect correctly
- Check postback URL is configured in affiliate network
- Verify click tracking works: `/go/product-slug` should redirect

---

## 🎉 SUCCESS METRICS

When working correctly, you should see:

1. ✅ Autopilot runs every 30 seconds
2. ✅ Posts appear in Database → `posted_content` table
3. ✅ Zapier Zap History shows successful runs
4. ✅ Posts appear on your real Facebook/Instagram/Twitter
5. ✅ Clicks increase in Dashboard → Analytics
6. ✅ Revenue increases in Profit Intelligence tab

---

## 📞 NEED HELP?

If you're stuck, check:
- Zapier Zap History for error messages
- Browser console (F12) for network errors
- Database tab → `webhook_logs` table for sent webhooks

The system is ready - you just need to connect the real Zapier webhook URL!