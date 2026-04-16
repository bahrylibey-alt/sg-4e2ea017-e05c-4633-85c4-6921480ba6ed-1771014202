# 🚀 AUTOPILOT SETUP GUIDE - REAL DATA ONLY

## ⚠️ CRITICAL: NO MOCK DATA

This system works ONLY with **REAL DATA** from actual affiliate networks and traffic platforms.

**NO fake clicks, NO mock products, NO generated data.**

---

## 🎯 WHAT YOU NEED

### 1. Affiliate Networks (REQUIRED)

You must connect at least ONE affiliate network with a valid API key:

- **Amazon Associates** (api_key + associate_tag)
- **AliExpress** (api_key)
- **Temu** (api_key)
- **ClickBank** (api_key + account_nickname)
- **ShareASale** (api_key + merchant_id)
- **Ebay Partner Network** (api_key)

### 2. Traffic Sources (RECOMMENDED)

Connect platforms where you'll post content:

- **Pinterest** (api_key for auto-posting)
- **TikTok** (api_key for auto-posting)
- **Twitter/X** (api_key for auto-posting)
- **Facebook** (api_key for auto-posting)

### 3. Tracking Setup (OPTIONAL BUT POWERFUL)

- **Postback URLs** - Get paid commissions tracked automatically
- **Webhook URLs** - Track clicks/views in real-time
- **Pixel Integration** - Track conversions

---

## 📋 SETUP STEPS

### Step 1: Connect Affiliate Networks

```
1. Go to /integrations
2. Find affiliate networks section
3. Click "Connect" on each network
4. Enter YOUR REAL API credentials
5. Save and test connection
```

**Where to get API keys:**
- Amazon: https://affiliate-program.amazon.com/assoc_credentials/home
- AliExpress: https://portals.aliexpress.com/developer
- Temu: Contact Temu affiliate support
- ClickBank: https://accounts.clickbank.com/
- ShareASale: https://www.shareasale.com/w3c/affiliates/affiliate-account.cfm

### Step 2: Configure Autopilot Settings

```
1. Go to /settings
2. Scroll to "Autopilot Settings"
3. Set:
   - Daily budget
   - Product price range
   - Preferred categories
   - Posting schedule
4. Enable autopilot toggle
5. Save settings
```

### Step 3: Run Product Discovery

**Option A: Automatic (Recommended)**
- Runs daily via cron job
- Discovers 10-50 products per day
- No action needed

**Option B: Manual**
```bash
# Test endpoint
GET /api/run-product-discovery?userId=YOUR_USER_ID

# Or trigger cron manually
GET /api/cron/discover-products
Authorization: Bearer YOUR_CRON_SECRET
```

### Step 4: Test Everything

```bash
# Run complete system test
GET /api/test-autopilot-complete?userId=YOUR_USER_ID

# Expected results:
# ✅ Affiliate networks: PASS
# ✅ Product catalog: PASS  
# ✅ Autopilot config: PASS
# ✅ Edge function: PASS
```

### Step 5: Monitor & Optimize

```
1. Check dashboard daily
2. Review autopilot decisions
3. Adjust settings based on performance
4. Scale winners, kill losers
```

---

## 🔄 HOW IT WORKS

### The Autopilot Flow

```
1. DISCOVER PRODUCTS
   ↓ (From real affiliate APIs)
2. ANALYZE PERFORMANCE
   ↓ (Real clicks, views, conversions)
3. MAKE DECISIONS
   ↓ (Scale winners, kill losers)
4. CREATE CONTENT
   ↓ (Auto-generate posts)
5. SCHEDULE POSTING
   ↓ (Across connected platforms)
6. TRACK RESULTS
   ↓ (Real revenue from postbacks)
7. REPEAT
```

### Data Sources

**Products** → Affiliate network APIs
**Clicks** → Traffic platform webhooks  
**Views** → Platform APIs
**Conversions** → Postback URLs
**Revenue** → Affiliate network reports

---

## 🧪 TESTING

### Quick System Check

```bash
# 1. Test database connection
GET /api/health-check

# 2. Test autopilot system
GET /api/test-autopilot-complete?userId=YOUR_USER_ID

# 3. Test product discovery
GET /api/run-product-discovery?userId=YOUR_USER_ID

# 4. Trigger autopilot manually
POST /api/autopilot/trigger
Body: { "userId": "YOUR_USER_ID" }
```

### What Each Test Checks

**health-check** - Database, integrations, system state
**test-autopilot-complete** - Full system readiness  
**run-product-discovery** - Network connections, API keys
**autopilot/trigger** - End-to-end execution

---

## ⚠️ COMMON ISSUES

### "No products found"

**Cause:** No affiliate networks connected OR no valid API keys
**Fix:** Go to /integrations, add real API credentials

### "System Status: CRITICAL"

**Cause:** Missing required configuration
**Fix:** Run `/api/test-autopilot-complete` to see exact issues

### "No conversions tracked"

**Cause:** Postback URLs not set up
**Fix:** Configure postback URLs in affiliate network dashboards

### "Edge Function error"

**Cause:** No products OR no user settings
**Fix:** 
1. Run product discovery
2. Save settings in /settings
3. Re-test

---

## 📊 EXPECTED TIMELINE

**Day 1** - Setup (connect networks, configure settings)
**Day 2-7** - Product discovery accumulates 50-200 products
**Week 2** - First conversions start flowing
**Week 3-4** - Autopilot learns patterns, scales winners
**Month 2+** - Full automation, consistent revenue

---

## 🚨 CRITICAL RULES

1. ❌ **NO MOCK DATA** - System rejects any fake/test data
2. ✅ **REAL API KEYS** - Must be valid credentials from actual networks
3. ✅ **REAL TRAFFIC** - Clicks must come from real users
4. ✅ **REAL CONVERSIONS** - Revenue must be from actual sales
5. ✅ **REAL PRODUCTS** - Products must exist in affiliate catalogs

---

## 💡 PRO TIPS

1. **Start with 1-2 networks** - Master them before adding more
2. **Focus on high-ticket products** - Better ROI per sale
3. **Test manually first** - Run discovery and autopilot manually before enabling auto mode
4. **Monitor daily** - Check dashboard for first 2 weeks
5. **Adjust based on data** - Let real results guide your settings

---

## 📞 SUPPORT

If tests fail after following this guide:

1. Run `/api/test-autopilot-complete?userId=YOUR_USER_ID`
2. Check each test result
3. Follow the "action" field for each failed test
4. Re-run test after fixes

**Need help?** Check logs in:
- Supabase Dashboard → Edge Functions → Logs
- Browser Console → Network tab
- Database → activity_logs table

---

## ✅ CHECKLIST

Before enabling autopilot, verify:

- [ ] At least 1 affiliate network connected with valid API key
- [ ] User settings saved in /settings
- [ ] Autopilot settings configured
- [ ] Product discovery run successfully (at least 10 products)
- [ ] System test passes: `/api/test-autopilot-complete`
- [ ] Edge Function test passes
- [ ] Tracking endpoints configured (optional but recommended)

**Once all checked:** Enable autopilot toggle in /settings. System will run automatically every 30 minutes.

---

Last Updated: 2026-04-16
Version: 5.0 (Real Data Only)