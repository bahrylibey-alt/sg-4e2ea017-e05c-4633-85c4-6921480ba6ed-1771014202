# 🧪 AUTOPILOT COMPLETE TEST GUIDE

## ⚠️ CRITICAL: REAL DATA ONLY

This system uses **ONLY REAL DATA** from:
- Affiliate network APIs (Amazon, AliExpress, etc.)
- Traffic platform webhooks (clicks, views)
- Postback URLs (conversions)

**NO MOCK DATA. NO FAKE DATA. NO GENERATED DATA.**

---

## 🚀 QUICK TEST

### Step 1: Run Complete System Test

```bash
# Visit test page
http://localhost:3000/test-complete-system

# Or call API directly
curl "http://localhost:3000/api/test-autopilot-complete?userId=YOUR_USER_ID"
```

### Step 2: Check Results

The test will verify:
- ✅ Database connection
- ✅ User settings exist
- ✅ Autopilot configuration
- ✅ Affiliate networks connected
- ✅ Traffic sources (optional)
- ✅ Product catalog has real products
- ✅ Tracking data (when available)
- ✅ Edge Function works

### Step 3: Fix Any Issues

The test output will tell you EXACTLY what to fix:

**Example Output:**
```json
{
  "status": "NOT_READY",
  "message": "❌ Critical issues found: 2",
  "results": [
    {
      "step": "4. Affiliate Networks",
      "status": "FAIL",
      "message": "NO AFFILIATE NETWORKS CONNECTED",
      "action": "Go to /integrations and connect Amazon or AliExpress"
    },
    {
      "step": "6. Product Catalog",
      "status": "FAIL",
      "message": "NO PRODUCTS FOUND",
      "action": "Run product discovery: /api/run-product-discovery?userId=YOUR_ID"
    }
  ],
  "actions": [
    "1. Connect affiliate networks in /integrations",
    "2. Run product discovery"
  ]
}
```

---

## 📋 DETAILED SETUP CHECKLIST

### 1️⃣ User Account Setup

```bash
# Create account or log in
http://localhost:3000

# Your user ID will be automatically detected
```

### 2️⃣ Connect Affiliate Networks

```bash
# Go to integrations page
http://localhost:3000/integrations

# Connect at least ONE network:
- Amazon Associates
- AliExpress
- ShareASale
- Impact
- CJ Affiliate
```

**CRITICAL:** Add REAL API keys, not placeholders like `"your_api_key_here"`

### 3️⃣ Run Product Discovery

```bash
# Manual trigger
curl "http://localhost:3000/api/run-product-discovery?userId=YOUR_USER_ID"

# Or click "Find Products" button in dashboard
http://localhost:3000/dashboard
```

**What it does:**
- Calls real affiliate network APIs
- Fetches actual products
- Saves to `affiliate_links` table
- NO mock products created

**Expected result:**
```json
{
  "success": true,
  "message": "Discovered 15 products from 2 networks",
  "result": {
    "totalDiscovered": 15,
    "byNetwork": {
      "amazon": 10,
      "aliexpress": 5
    }
  }
}
```

### 4️⃣ Configure Autopilot Settings

```bash
# Go to settings
http://localhost:3000/settings

# Configure:
- Daily budget: $100
- Min product price: $10
- Max product price: $500
- Preferred categories
```

### 5️⃣ Enable Autopilot

```bash
# In /settings, toggle "Enable Autopilot"

# Or via API
curl -X POST http://localhost:3000/api/autopilot/trigger \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

---

## 🔍 TESTING INDIVIDUAL COMPONENTS

### Test Edge Function

```bash
# The Edge Function processes products and makes decisions
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/autopilot-engine \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

**Expected response:**
```json
{
  "success": true,
  "processed": 15,
  "actions": {
    "promoted": 5,
    "paused": 2,
    "optimized": 8
  }
}
```

### Test Product Discovery

```bash
curl "http://localhost:3000/api/run-product-discovery?userId=YOUR_USER_ID"
```

### Test Tracking (After Real Traffic)

```bash
# Check clicks
SELECT COUNT(*) FROM click_events WHERE user_id = 'YOUR_USER_ID';

# Check views
SELECT COUNT(*) FROM view_events WHERE user_id = 'YOUR_USER_ID';

# Check conversions
SELECT COUNT(*) FROM conversion_events WHERE user_id = 'YOUR_USER_ID';
```

---

## ❌ COMMON ISSUES & FIXES

### Issue 1: "NO AFFILIATE NETWORKS CONNECTED"

**Fix:**
1. Go to `/integrations`
2. Click "Connect" on Amazon or AliExpress
3. Enter valid API credentials
4. Click "Save"
5. Re-run test

### Issue 2: "NO PRODUCTS FOUND"

**Fix:**
```bash
# Run product discovery
curl "http://localhost:3000/api/run-product-discovery?userId=YOUR_USER_ID"
```

### Issue 3: "Edge Function Error"

**Fix:**
1. Check Supabase Dashboard → Edge Functions
2. View logs for errors
3. Ensure function is deployed
4. Check function has correct permissions

### Issue 4: "No Real Tracking Data"

**This is EXPECTED initially!**

Tracking data comes from:
- Traffic sources (Pinterest, TikTok) sending webhooks
- Users clicking your affiliate links
- Conversions from affiliate networks

**To generate tracking data:**
1. Connect traffic sources in `/integrations`
2. Share your affiliate links
3. Wait for real traffic

---

## 📊 DASHBOARD NAVIGATION

### Main Dashboard
```
http://localhost:3000/dashboard
```
Shows:
- Autopilot status (ON/OFF)
- System health
- Issues detected
- Recommendations

### Test Page
```
http://localhost:3000/test-complete-system
```
Shows:
- Complete system test results
- Step-by-step status
- Actions needed

### Integrations
```
http://localhost:3000/integrations
```
Connect:
- Affiliate networks
- Traffic sources
- Payment gateways

---

## ✅ SUCCESS CRITERIA

System is ready when:
- ✅ At least 1 affiliate network connected with valid API key
- ✅ At least 1 product in catalog (from real API)
- ✅ Autopilot settings configured
- ✅ Edge Function responds without errors
- ✅ Test endpoint returns `"status": "READY"`

**Then enable autopilot in /settings!**

---

## 🎯 WHAT HAPPENS WHEN AUTOPILOT RUNS

Every 30 minutes, autopilot:

1. **Fetches real products** from connected affiliate networks
2. **Analyzes performance** using real tracking data
3. **Scores products** based on clicks, conversions, revenue
4. **Makes decisions:**
   - Promote high-performing products
   - Pause low-performing products
   - Optimize budgets and bids
5. **Executes actions** through affiliate APIs
6. **Logs everything** in activity_logs table

**NO MOCK DATA IS USED AT ANY STEP**

---

## 🚨 TROUBLESHOOTING

### Autopilot Not Running?

**Check:**
1. Is autopilot enabled in `/settings`?
2. Are affiliate networks connected?
3. Are there products in the catalog?
4. Check Edge Function logs in Supabase Dashboard

### No Products Discovered?

**Check:**
1. Are API keys valid (not `"your_api_key_here"`)?
2. Do API keys have correct permissions?
3. Are networks returning products for your search criteria?
4. Check network API status/rate limits

### Tracking Data Not Showing?

**This is normal initially!**

Tracking requires:
1. Real users clicking links
2. Traffic sources configured
3. Webhooks set up
4. Time for data to accumulate

---

## 📞 NEED HELP?

Run the diagnostic:
```bash
curl "http://localhost:3000/api/test-autopilot-complete?userId=YOUR_USER_ID"
```

The response will tell you EXACTLY what needs to be fixed.

---

Last Updated: 2026-04-16
Version: 6.0 (Real Data Only)