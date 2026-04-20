# 🔍 TRACKING SYSTEM TEST GUIDE

## 📊 HOW TO TEST: TRAFFIC → CLICKS → CONVERSIONS → REVENUE

This guide explains how to test the complete tracking flow in your autopilot system.

---

## 🎯 TRACKING FLOW OVERVIEW

```
1. Traffic Sources (Pinterest, TikTok, etc.)
   ↓
2. User sees your post with affiliate link
   ↓
3. User clicks link → CLICK TRACKING
   ↓
4. User redirected to product page
   ↓
5. User makes purchase → CONVERSION TRACKING
   ↓
6. Affiliate network sends postback
   ↓
7. System matches conversion to click
   ↓
8. Revenue calculated and attributed → REVENUE TRACKING
```

---

## 🧪 MANUAL TESTING PROCEDURE

### **TEST 1: Click Tracking** (5 minutes)

**Step 1:** Get a test affiliate link from your dashboard
1. Go to `/dashboard`
2. Find a product in your catalog
3. Copy the affiliate link (format: `yoursite.com/go/abc123`)

**Step 2:** Test the click tracker
1. Open a new incognito/private browser window
2. Paste the affiliate link
3. Press Enter

**Step 3:** Verify click was tracked
1. Go to **Database** tab in Softgen
2. Open table `click_tracking`
3. **Expected:** New row with:
   - Your product ID
   - Timestamp (just now)
   - Source: "direct" or "test"
   - IP address
   - User agent

**✅ PASS:** Click appears in database  
**❌ FAIL:** No click recorded

---

### **TEST 2: Traffic Source Attribution** (10 minutes)

**Step 1:** Create test posts
1. Go to `/content-manager`
2. Create a new post
3. Select a product
4. Choose a traffic source (e.g., Pinterest)
5. Generate affiliate link

**Step 2:** Add UTM parameters manually
```
yoursite.com/go/abc123?utm_source=pinterest&utm_medium=pin&utm_campaign=test
```

**Step 3:** Click the link from different sources
- Click from "Pinterest" link
- Click from "TikTok" link
- Click from email link

**Step 4:** Check tracking data
1. Database → `click_tracking` table
2. **Expected:** Each click has correct:
   - `source_platform` (pinterest, tiktok, email)
   - `campaign_id`
   - `medium`

**✅ PASS:** Source is correctly identified  
**❌ FAIL:** All clicks show same source

---

### **TEST 3: Conversion Tracking** (Manual Postback)

Since real conversions require actual purchases, you can test with a manual postback:

**Step 1:** Get a test click ID
1. Database → `click_tracking`
2. Copy a recent `click_id`

**Step 2:** Send test postback
```bash
curl -X POST https://yoursite.com/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "TEST123",
    "click_id": "YOUR_CLICK_ID_HERE",
    "sale_amount": "50.00",
    "commission": "4.00",
    "status": "approved"
  }'
```

**Step 3:** Verify conversion
1. Database → `conversion_tracking` table
2. **Expected:** New row with:
   - `click_id` matching your test
   - `revenue` = 4.00
   - `status` = "approved"

**Step 4:** Check revenue attribution
1. Database → `click_tracking` table
2. Find your original click
3. **Expected:** `conversion_id` is now filled

**✅ PASS:** Conversion linked to click  
**❌ FAIL:** No conversion or not linked

---

### **TEST 4: Revenue Calculation** (5 minutes)

**Step 1:** Check product commission rates
1. Database → `product_catalog`
2. Find a product
3. Note the `commission_rate` (e.g., 8%)

**Step 2:** Calculate expected revenue
```
Sale Price × Commission Rate = Expected Revenue
$50.00 × 8% = $4.00
```

**Step 3:** Verify calculation
1. Database → `conversion_tracking`
2. Find your test conversion
3. **Expected:** `revenue` = $4.00 (matches calculation)

**Step 4:** Check total revenue
```sql
SELECT 
  SUM(revenue) as total_revenue,
  COUNT(*) as total_conversions,
  AVG(revenue) as avg_revenue
FROM conversion_tracking
WHERE user_id = 'YOUR_USER_ID';
```

**✅ PASS:** Revenue correctly calculated  
**❌ FAIL:** Revenue doesn't match commission rate

---

### **TEST 5: End-to-End Flow** (15 minutes)

**Complete workflow test:**

1. **Create Campaign**
   - Go to `/dashboard`
   - Click "Find Products"
   - Select a product
   
2. **Generate Link**
   - System creates unique affiliate link
   - Link format: `/go/{slug}`
   
3. **Simulate Click**
   - Click your affiliate link
   - Check `click_tracking` table
   
4. **Simulate Conversion**
   - Send test postback (see TEST 3)
   - Check `conversion_tracking` table
   
5. **Verify Attribution**
   - Click and conversion are linked
   - Revenue is calculated
   - ROI is tracked

6. **Check Analytics**
   - Go to `/analytics`
   - **Expected:** See your test data:
     - 1 click
     - 1 conversion
     - $X.XX revenue
     - X% conversion rate

**✅ PASS:** Complete flow works  
**❌ FAIL:** Any step breaks

---

## 🔧 AUTOMATED TESTING SCRIPTS

### **Database Validation Query**

Run this in Database tab to validate your tracking setup:

```sql
-- Check if tracking is working
SELECT 
  'Clicks' as metric,
  COUNT(*) as count,
  MAX(created_at) as last_tracked
FROM click_tracking
WHERE user_id = 'YOUR_USER_ID'

UNION ALL

SELECT 
  'Conversions' as metric,
  COUNT(*) as count,
  MAX(created_at) as last_tracked
FROM conversion_tracking
WHERE user_id = 'YOUR_USER_ID'

UNION ALL

SELECT 
  'Revenue' as metric,
  CAST(SUM(revenue) AS INTEGER) as count,
  MAX(created_at) as last_tracked
FROM conversion_tracking
WHERE user_id = 'YOUR_USER_ID';
```

**Expected Output:**
```
Clicks       | 10  | 2026-04-20 08:00:00
Conversions  | 2   | 2026-04-20 07:45:00
Revenue      | 8   | 2026-04-20 07:45:00
```

---

### **API Test Endpoints**

**Test Click Tracking:**
```bash
POST /api/tracking/clicks
Body: {
  "link_id": "abc123",
  "source": "test",
  "ip": "1.2.3.4"
}
```

**Test Conversion Tracking:**
```bash
POST /api/tracking/conversions
Body: {
  "click_id": "click123",
  "revenue": 4.00,
  "transaction_id": "tx123"
}
```

**Get Analytics:**
```bash
GET /api/tracking/analytics?period=7d
```

---

## 📊 VALIDATION CHECKLIST

After running all tests:

### **Click Tracking:**
- [ ] Clicks are recorded in database
- [ ] Source platform is identified correctly
- [ ] IP address and user agent captured
- [ ] Timestamp is accurate
- [ ] Link ID matches product

### **Conversion Tracking:**
- [ ] Conversions linked to original clicks
- [ ] Revenue calculated correctly
- [ ] Commission rate applied properly
- [ ] Status tracking works (pending, approved, rejected)
- [ ] Transaction IDs unique

### **Revenue Attribution:**
- [ ] Revenue assigned to correct product
- [ ] Revenue assigned to correct traffic source
- [ ] ROI calculated accurately
- [ ] Total revenue sums correctly
- [ ] Analytics dashboard shows correct numbers

### **End-to-End Flow:**
- [ ] Traffic → Click → Conversion → Revenue works
- [ ] No data loss at any step
- [ ] All IDs properly linked
- [ ] Analytics update in real-time
- [ ] Autopilot uses real tracking data

---

## 🎯 EXPECTED METRICS

**After 24 hours of real traffic:**

```
📊 CLICK TRACKING
- Clicks: 100-500 per day
- Sources: Pinterest (40%), TikTok (30%), Instagram (20%), Other (10%)
- CTR: 2-5% average

💰 CONVERSION TRACKING
- Conversions: 2-10 per day (2-5% conversion rate)
- Revenue: $20-100 per day
- AOV (Average Order Value): $30-50

📈 ROI METRICS
- Cost per click: $0.10-0.50
- Cost per conversion: $5-20
- Revenue per click: $0.20-0.50
- ROI: 200-400%
```

---

## 🚨 COMMON ISSUES & FIXES

### **Issue: No clicks tracked**
**Fix:**
1. Check `/api/tracking/clicks` endpoint works
2. Verify click tracker script is loaded
3. Check database permissions
4. Look for JavaScript errors in console

### **Issue: Conversions not linked to clicks**
**Fix:**
1. Verify `click_id` is passed in postback
2. Check postback URL format
3. Ensure affiliate network has correct postback URL
4. Test manual postback

### **Issue: Revenue calculation wrong**
**Fix:**
1. Check `commission_rate` in product_catalog
2. Verify sale_amount in postback
3. Ensure currency conversion is correct
4. Check for rounding errors

### **Issue: Analytics showing zero**
**Fix:**
1. Verify data exists in tables
2. Check date range filter
3. Ensure user_id filter is correct
4. Refresh analytics cache

---

## ✅ SUCCESS CRITERIA

**Your tracking system is working when:**

✅ Every click creates a record in `click_tracking`  
✅ Source platform is correctly identified  
✅ Conversions link back to original clicks  
✅ Revenue is calculated accurately  
✅ Analytics dashboard shows real data  
✅ ROI metrics are realistic (200-400%)  
✅ No data loss in the tracking flow  
✅ Autopilot uses real performance data  

---

**Last Updated:** 2026-04-20  
**System Version:** 7.0  
**Test Coverage:** Complete Tracking Flow  
**Status:** ✅ Validated