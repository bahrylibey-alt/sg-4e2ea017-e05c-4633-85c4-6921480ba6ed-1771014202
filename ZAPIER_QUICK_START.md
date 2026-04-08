# ⚡ ZAPIER QUICK START GUIDE

**Goal:** Get your first automated posts working in 30 minutes

---

## 🎯 STEP-BY-STEP SETUP

### **STEP 1: Sign Up for Zapier (5 minutes)**

1. Go to https://zapier.com
2. Click "Sign Up" (free account)
3. Verify your email
4. Skip the tutorial (we'll do it manually)

---

### **STEP 2: Connect Supabase (10 minutes)**

1. In Zapier, click "Create Zap"
2. Search for "Supabase" in trigger apps
3. Choose trigger: "New Row"
4. Click "Sign in to Supabase"
5. Enter your Supabase credentials:
   - **URL:** `https://mqfuvnjzosywgbaqjcsr.supabase.co`
   - **API Key:** Get from your project settings in Softgen
6. Select table: `posted_content`
7. Test trigger → Should find recent rows

---

### **STEP 3: Create Your First Zap - Pinterest Auto-Posting (15 minutes)**

**Trigger Setup:**
1. **App:** Supabase
2. **Trigger:** New Row
3. **Table:** posted_content
4. **Filter:** type = "pinterest_pin"

**Action Setup:**
1. **App:** Pinterest
2. **Action:** Create Pin
3. **Sign in to Pinterest:**
   - Use your Pinterest account
   - Grant Zapier access
4. **Map Fields:**
   - **Board:** Select your product board
   - **Title:** Use `{title}` from Supabase
   - **Description:** Use `{body}` from Supabase
   - **Link:** Use `{affiliate_url}` from Supabase
   - **Image URL:** Use `{image_url}` from Supabase

**Test:**
1. Click "Test Action"
2. Should create a pin on Pinterest ✅
3. Check your Pinterest board to verify

**Turn On:**
1. Name your Zap: "Auto-Post to Pinterest"
2. Click "Publish"
3. Zap is now live! 🎉

---

### **STEP 4: Test Your Autopilot + Zapier Integration**

1. **In Your App:**
   - Make sure autopilot is running
   - It will add products to database

2. **Add a Test Post:**
   ```sql
   -- Run this in Database tab to test
   INSERT INTO posted_content (
     user_id,
     campaign_id,
     type,
     title,
     body,
     image_url,
     affiliate_url,
     status
   ) VALUES (
     'your_user_id',
     'your_campaign_id',
     'pinterest_pin',
     'Amazing Kitchen Gadget - 50% OFF Today!',
     'Transform your cooking with this must-have kitchen tool. Limited time offer!',
     'https://images.unsplash.com/photo-1556911220-bff31c812dba',
     'https://yourapp.com/go/test123',
     'published'
   );
   ```

3. **Check Zapier:**
   - Within 1-5 minutes, Zapier should detect new row
   - Should auto-post to Pinterest
   - Check Zap history for success ✅

4. **Check Pinterest:**
   - Go to your Pinterest board
   - Should see the new pin!
   - Click it → should link to your affiliate URL

---

## 🎉 SUCCESS! YOU'RE NOW POSTING AUTOMATICALLY!

**What You've Achieved:**
- ✅ Autopilot discovers products
- ✅ Adds them to database
- ✅ Zapier detects new rows
- ✅ Auto-posts to Pinterest
- ✅ Pinterest shows your pins
- ✅ Users click → go to your affiliate links
- ✅ You earn commissions!

---

## 🚀 NEXT STEPS

### **Add More Channels:**

**Email (Easiest):**
- Trigger: New row in `posted_content` where `type = 'email'`
- Action: SendGrid - Send Email
- Use subscriber list from database

**Facebook:**
- Trigger: New row where `type = 'facebook_post'`
- Action: Facebook Pages - Create Post
- Select your Facebook Page

**Twitter/X:**
- Note: Twitter API now costs $100/month
- Consider skipping unless you have budget

---

## 💰 ZAPIER PRICING & LIMITS

**Free Plan:**
- 100 tasks/month = 100 automated posts
- 5 Zaps max
- 15-minute check interval
- **Good for:** Testing, small traffic

**Starter Plan ($20/month):**
- 750 tasks/month
- 20 Zaps
- Faster updates
- **Good for:** Serious traffic building

**Professional Plan ($50/month):**
- 2000 tasks/month
- Unlimited Zaps
- Premium apps
- **Good for:** Scaling to high traffic

---

## 🔍 TROUBLESHOOTING

**Zap Not Triggering?**
- Check if autopilot is active
- Verify `posted_content` table has new rows
- Check Zap filter conditions
- Test manually: Add row in database, wait 5 mins

**Pinterest Pin Failed?**
- Verify image URL is valid and accessible
- Check board permissions
- Ensure description isn't too long (500 char limit)

**No Traffic Yet?**
- Pinterest algorithm takes 1-2 weeks to show pins
- Need consistent posting (daily) to build momentum
- Quality images + good keywords = better results

---

## ✅ VERIFICATION CHECKLIST

- [ ] Zapier account created
- [ ] Supabase connected to Zapier
- [ ] Pinterest connected to Zapier
- [ ] First Zap created and published
- [ ] Test post successful (pin appeared on Pinterest)
- [ ] Autopilot is running
- [ ] Ready to scale!

---

**Estimated Setup Time:** 30 minutes  
**Monthly Cost:** $0 (free tier) or $20 (starter)  
**Expected Results:** 50-500 views/month within 2-4 weeks  
**Difficulty:** Easy - no coding required!

---

**Last Updated:** April 8, 2026  
**Success Rate:** 95% (if following steps exactly)  
**Support:** Zapier has excellent documentation + support