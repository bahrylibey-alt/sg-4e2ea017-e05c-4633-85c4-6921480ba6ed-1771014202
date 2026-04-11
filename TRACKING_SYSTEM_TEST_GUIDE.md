# TRACKING SYSTEM TEST GUIDE
## Verify Click → Conversion → Intelligence → Profit Flow

## 🎯 WHAT WE'RE TESTING

The complete profit-seeking loop:
1. **Click Tracking**: User clicks link → system records it
2. **Conversion Tracking**: User buys → system records revenue
3. **Intelligence Scoring**: System calculates performance
4. **Autopilot Decisions**: System scales winners, kills losers
5. **Profit Dashboard**: Shows what's making money

---

## ✅ PRE-TEST CHECKLIST

Before starting, verify:
- [ ] You're logged in
- [ ] Dashboard loads without errors
- [ ] Autopilot is enabled (Dashboard → AI Autopilot tab → Toggle ON)
- [ ] At least 1 product exists in database

---

## 🧪 TEST 1: CLICK TRACKING

### What to test:
Does the system track clicks when someone clicks an affiliate link?

### Steps:

1. **Go to Dashboard → Overview tab**
   - Note the current click count

2. **Open a new tab**
   - Go to: `https://yourdomain.com/go/test-tracking-product`
   - You should be redirected to Amazon/affiliate network

3. **Return to Dashboard**
   - Refresh the page
   - Click count should increase by +1

### ✅ Expected Result:
- Clicks increment in real-time
- Click event logged in database
- User redirected to correct URL

### ❌ If it doesn't work:
- Check browser console for errors
- Verify the slug exists: Go to Database tab → `affiliate_links` table → check `slug` column
- Check RLS policies allow public SELECT on active links

---

## 🧪 TEST 2: CONVERSION TRACKING

### What to test:
Does the system record revenue when a conversion happens?

### Steps:

1. **Simulate a conversion via API**
   - Open a new browser tab
   - Go to: `https://yourdomain.com/api/postback?network=amazon&click_id=test-tracking-product&amount=50&commission=5&status=approved`
   - You should see: `{"success": true, "message": "Conversion tracked"}`

2. **Go to Dashboard → Profit Intelligence tab**
   - Check "Total Revenue" - should show $5.00
   - Check "Conversion Rate" - should be calculated
   - Check top products - test-tracking-product should appear

### ✅ Expected Result:
- Revenue increases by commission amount
- Conversion count increments
- Conversion rate calculated
- Profit Dashboard shows updated revenue

### ❌ If it doesn't work:
- Check API response for error messages
- Verify postback URL parameters are correct
- Check Database tab → `affiliate_links` → `revenue` column

---

## 🧪 TEST 3: INTELLIGENCE LAYER SCORING

### What to test:
Does the autopilot score posts and assign states (testing/scaling/killed)?

### Steps:

1. **Go to Dashboard → AI Autopilot tab**
   - Click "Run Cycle Now"
   - Wait for success message

2. **Check Database tab → `affiliate_links` table**
   - Look for columns: `ctr`, `performance_score`, `autopilot_state`
   - Values should be calculated (not null)

3. **Go to Dashboard → Profit Intelligence tab**
   - Check "Performance Metrics" section
   - Should show CTR, conversion rate, performance scores

### ✅ Expected Result:
- CTR calculated: (clicks / impressions) × 100
- Performance score calculated
- Autopilot state assigned: testing, scaling, cooldown, or killed
- Decisions logged in `autopilot_decisions` table

### ❌ If it doesn't work:
- Check browser console for autopilot errors
- Verify Edge Function is deployed: Database tab → Edge Functions
- Check autopilot logs: Database tab → `autopilot_cron_log`

---

## 🧪 TEST 4: AUTOPILOT DECISIONS

### What to test:
Does autopilot make smart decisions (scale winners, kill losers)?

### Steps:

1. **Create a "winning" post** (manually set high performance):
   ```sql
   -- Go to Database tab → SQL Editor → Run this:
   
   UPDATE posted_content SET
     impressions = 300,
     clicks = 10,
     conversions = 2,
     revenue = 20
   WHERE id = (SELECT id FROM posted_content LIMIT 1);
   ```

2. **Run autopilot cycle**
   - Dashboard → AI Autopilot tab → "Run Cycle Now"

3. **Check decisions**
   - Database tab → `autopilot_decisions` table
   - Should see decision_type = 'scale'
   - Reason should explain why (e.g., "CTR above threshold")

4. **Check if autopilot creates more products for winners**
   - Dashboard → Overview tab
   - Products count should increase by 5 (scaling) or 3 (testing)

### ✅ Expected Result:
- High performing posts get "scaling" state
- Autopilot creates 5 new products for scaling posts
- Decision logged in `autopilot_decisions` table
- Low performing posts get "killed" state after 200 impressions, CTR <1%, no conversions

### ❌ If it doesn't work:
- Verify scoring ran: Check `affiliate_links.ctr` is calculated
- Check decision engine rules: Database tab → `autopilot_decisions`
- Verify Edge Function logs: Database tab → Logs section

---

## 🧪 TEST 5: PROFIT DASHBOARD

### What to test:
Does the Profit Dashboard show accurate revenue and best performers?

### Steps:

1. **Go to Dashboard → Profit Intelligence tab**

2. **Verify metrics display**:
   - ✅ Total Revenue shows sum of all conversions
   - ✅ CTR shows average click-through rate
   - ✅ Conversion Rate shows percentage
   - ✅ Best Platform identified (highest revenue platform)
   - ✅ Best Product shown (highest performance score)
   - ✅ Top 5 Posts ranked by revenue

3. **Cross-check with database**:
   ```sql
   -- Go to Database tab → SQL Editor → Run:
   
   SELECT SUM(revenue) as total_revenue
   FROM affiliate_links;
   
   SELECT AVG(ctr) as avg_ctr
   FROM affiliate_links
   WHERE clicks > 0;
   ```

### ✅ Expected Result:
- Dashboard numbers match database queries
- Best performers are correctly identified
- Metrics update in real-time (every 5 seconds)

### ❌ If it doesn't work:
- Check browser console for errors
- Verify data exists: Database tab → `affiliate_links` → check revenue > 0
- Refresh the page

---

## 🎉 SUCCESS CRITERIA

The system is working correctly when:

1. ✅ **Click Tracking**: Clicks increment when link is clicked
2. ✅ **Conversion Tracking**: Revenue updates when postback received
3. ✅ **Intelligence Scoring**: CTR, performance_score, autopilot_state calculated
4. ✅ **Autopilot Decisions**: Scale decisions made for good performers
5. ✅ **Profit Dashboard**: Shows accurate revenue, CTR, best performers

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Failed to fetch" error when running autopilot
**Fix:**
- Edge Function not deployed
- Go to Database tab → Edge Functions → Verify `autopilot-engine` exists
- If missing, contact support to redeploy

### Issue: Clicks not tracking
**Fix:**
- Check `/go/[slug].tsx` page for errors
- Verify slug exists in database
- Check RLS policies: Database tab → RLS Policies → `affiliate_links`

### Issue: Conversions not recording
**Fix:**
- Verify postback URL parameters: `network`, `click_id`, `amount`, `commission`, `status`
- Check API logs: Browser console → Network tab
- Verify `click_id` matches a real product slug

### Issue: Profit Dashboard shows $0
**Fix:**
- Run Test 2 (Conversion Tracking) to add test revenue
- Verify data exists: Database tab → `affiliate_links` → check `revenue` column
- Refresh the dashboard

### Issue: Autopilot not making decisions
**Fix:**
- Ensure posts have enough data (impressions > 0, clicks > 0)
- Run Test 4 to manually set high performance data
- Check Edge Function logs: Database tab → Logs

---

## 📊 QUICK DATABASE CHECKS

Run these queries in Database tab → SQL Editor to verify data:

```sql
-- 1. Check click tracking
SELECT slug, clicks, click_count 
FROM affiliate_links 
ORDER BY clicks DESC 
LIMIT 10;

-- 2. Check conversion tracking
SELECT slug, conversions, revenue, conversion_rate 
FROM affiliate_links 
WHERE revenue > 0 
ORDER BY revenue DESC 
LIMIT 10;

-- 3. Check intelligence scoring
SELECT slug, ctr, performance_score, autopilot_state 
FROM affiliate_links 
WHERE performance_score > 0 
ORDER BY performance_score DESC 
LIMIT 10;

-- 4. Check autopilot decisions
SELECT decision_type, reason, created_at 
FROM autopilot_decisions 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check posted content performance
SELECT platform, clicks, conversions, revenue, ctr 
FROM posted_content 
WHERE revenue > 0 
ORDER BY revenue DESC 
LIMIT 10;
```

---

## ✅ SYSTEM STATUS

Run this to get complete system health:

```sql
SELECT 
  (SELECT COUNT(*) FROM affiliate_links) as total_products,
  (SELECT SUM(clicks) FROM affiliate_links) as total_clicks,
  (SELECT SUM(conversions) FROM affiliate_links) as total_conversions,
  (SELECT SUM(revenue) FROM affiliate_links) as total_revenue,
  (SELECT COUNT(*) FROM posted_content) as total_posts,
  (SELECT COUNT(*) FROM autopilot_decisions) as total_decisions,
  (SELECT COUNT(*) FROM affiliate_links WHERE autopilot_state = 'scaling') as scaling_products,
  (SELECT COUNT(*) FROM affiliate_links WHERE autopilot_state = 'killed') as killed_products;
```

This shows if your profit-seeking intelligence layer is working correctly!