# 🚀 QUICK START GUIDE - FIX YOUR SYSTEM NOW

## ✅ WHAT WAS FIXED

Your system had these problems - **ALL NOW FIXED**:

1. ❌ Mock/fake products everywhere → ✅ Now uses ONLY real database products
2. ❌ Edge Function generated fake data → ✅ Now validates real products only
3. ❌ No real API integration → ✅ Now requires affiliate network APIs
4. ❌ Dashboard showed wrong status → ✅ Now shows accurate real-time status

## 🎯 YOUR NEXT STEPS (IN ORDER)

### STEP 1: Check Your System Status

Visit: **`/dashboard`**

You'll see:
- 🟢 **READY** = System configured and working
- 🟡 **PARTIAL** = Some configuration needed
- 🔴 **CRITICAL** = Must fix issues before autopilot works

### STEP 2: Connect Affiliate Networks

Visit: **`/integrations`**

**What you need:**

1. **Amazon Associates** (Recommended)
   - Sign up: https://affiliate-program.amazon.com
   - Get your API key
   - Add in `/integrations`

2. **AliExpress** (Optional)
   - Sign up: https://portals.aliexpress.com
   - Get API credentials
   - Add in `/integrations`

3. **Impact.com** (Optional)
   - For multiple networks in one place
   - Sign up: https://impact.com
   - Get API key

**After adding keys:**
- Click "Sync Products" button
- Wait 30-60 seconds
- You'll see products appear

### STEP 3: Discover Products

**Option A: From Dashboard**
- Click "Find Products" button
- System will discover products from connected networks

**Option B: Manual API Call**
- Visit: `/api/run-product-discovery`
- This runs product discovery manually

**What happens:**
- System checks your connected networks
- Fetches real products via APIs
- Saves to `product_catalog` table
- Creates affiliate links automatically

### STEP 4: Run Autopilot

**From Dashboard:**
- Click "Run Autopilot" button
- System will:
  1. Score all discovered products
  2. Identify best performers
  3. Optimize traffic routing
  4. Generate recommendations

**Expected Result:**
```
✅ Processed 15 products
✅ Found 8 high performers
✅ Optimized 3 campaigns
```

### STEP 5: Test Complete System

Visit: **`/test-complete-system`**

This page will:
- ✅ Test authentication
- ✅ Check integrations
- ✅ Verify products exist
- ✅ Test affiliate links
- ✅ Run autopilot cycle
- ✅ Show detailed results

## 📊 DIAGNOSTIC ENDPOINTS

### Quick Health Check
```
GET /api/system-health-check
```
Returns: Current system status (30 seconds)

### Full Diagnosis
```
GET /api/diagnose-system
```
Returns: Complete system analysis with recommendations

### Test Everything
```
GET /api/test-autopilot-complete
```
Returns: Step-by-step test results

## ⚠️ COMMON ISSUES & FIXES

### Issue: "No integrations connected"
**Fix:** 
1. Go to `/integrations`
2. Click "Connect" on Amazon Associates
3. Enter your API key
4. Click "Save"

### Issue: "No new products in 8 days"
**Fix:**
1. Go to `/integrations`
2. Click "Sync Products" on connected network
3. Wait 60 seconds
4. Refresh dashboard

### Issue: "No real tracking data yet"
**Fix:**
This is NORMAL for new setups. Real tracking data comes from:
- Real visitors clicking your links
- Real conversions happening
- Real API webhooks from affiliate networks

**Don't worry** - the system works without tracking data initially.

### Issue: "Edge Function not responding"
**Fix:**
1. Edge function may need redeployment
2. Check Supabase dashboard
3. Verify function is active
4. Check function logs for errors

## 🎯 SUCCESS CRITERIA

Your system is working when you see:

✅ **Dashboard shows:**
- Status: READY or PARTIAL
- Products: 10+ discovered
- Links: 10+ active
- Issues: 0-2 warnings only

✅ **Test page shows:**
- All steps PASS
- No FAIL status
- Products discovered
- Links created

✅ **Autopilot runs successfully:**
- No errors
- Finds high performers
- Makes recommendations
- Completes full cycle

## 🔄 CRON JOBS (AUTOMATIC)

These run automatically if configured:

**Product Discovery:**
- Runs: Every 6 hours
- Endpoint: `/api/cron/discover-products`
- Purpose: Find new high-converting products

**Autopilot Engine:**
- Runs: Every 30 minutes
- Endpoint: `/api/cron/autopilot`
- Purpose: Optimize campaigns automatically

## 📱 REAL DATA FLOW

```
Affiliate Network API
    ↓
Product Discovery (real products)
    ↓
Product Catalog (database)
    ↓
Affiliate Links (generated)
    ↓
Traffic Router (intelligent routing)
    ↓
Click Tracking (real clicks)
    ↓
Conversion Tracking (real sales)
    ↓
Commission Calculation (real money)
    ↓
Analytics Dashboard (real metrics)
```

## ✅ VERIFICATION CHECKLIST

Mark these as you complete them:

- [ ] Logged into the system
- [ ] Connected at least 1 affiliate network
- [ ] Added valid API key
- [ ] Clicked "Sync Products" or "Find Products"
- [ ] Saw products appear in catalog
- [ ] Clicked "Run Autopilot"
- [ ] Saw success message
- [ ] Checked `/test-complete-system`
- [ ] All tests show PASS
- [ ] Dashboard shows READY or PARTIAL

## 🆘 STILL HAVING ISSUES?

If you've followed all steps and still see problems:

1. **Check Console Logs** (F12 in browser)
2. **Run Full Diagnostic**: Visit `/api/diagnose-system`
3. **Check Database**: Use Database tab in Softgen
4. **Verify API Keys**: Make sure they're valid and not expired

---

**Last Updated:** 2026-04-16  
**System Version:** 6.0 (Real Data Only)  
**Author:** Softgen AI Agent