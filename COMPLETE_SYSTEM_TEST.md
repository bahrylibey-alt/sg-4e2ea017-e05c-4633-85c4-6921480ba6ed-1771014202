# COMPLETE SYSTEM TEST - Click Tracking + Conversion Tracking + Intelligence Layer

## SYSTEM ARCHITECTURE

```
User clicks link → Click tracked → Conversion happens → Intelligence scores → Autopilot decides → System scales
```

## TEST 1: CLICK TRACKING FLOW

### Step 1: User clicks affiliate link
**URL:** `https://yourdomain.com/go/test-product-slug`

**What happens:**
1. `/go/[slug].tsx` page loads
2. Database query: `SELECT * FROM affiliate_links WHERE slug = 'test-product-slug'`
3. If found:
   - Updates `affiliate_links.clicks` and `affiliate_links.click_count` (+1)
   - Inserts into `click_events` table:
     ```sql
     INSERT INTO click_events (
       link_id, user_id, ip_address, user_agent, referrer,
       clicked_at, converted, is_bot, fraud_score
     )
     ```
   - Inserts into `activity_logs` for tracking
   - Redirects user to `affiliate_links.original_url`

**Database verification:**
```sql
-- Check click was recorded
SELECT clicks, click_count FROM affiliate_links WHERE slug = 'test-product-slug';

-- Check click event was logged
SELECT * FROM click_events WHERE link_id = (
  SELECT id FROM affiliate_links WHERE slug = 'test-product-slug'
) ORDER BY clicked_at DESC LIMIT 1;
```

**Expected result:**
- `clicks` and `click_count` both incremented by 1
- New row in `click_events` with correct metadata
- User redirected to Amazon/affiliate network

---

## TEST 2: CONVERSION TRACKING FLOW

### Step 2: User makes purchase
**What happens:**
1. Affiliate network (Amazon, Temu, etc.) sends postback to:
   `POST /api/postback?network=amazon&click_id=test-product-slug&amount=50&commission=5&status=approved`

2. Postback API (`/api/postback.ts`):
   - Finds affiliate link by `click_id` (matches `slug` or `cloaked_url`)
   - Updates `affiliate_links`:
     ```sql
     UPDATE affiliate_links SET
       conversions = conversions + 1,
       revenue = revenue + 5,
       conversion_rate = (conversions / clicks) * 100,
       last_conversion = NOW()
     WHERE id = link_id
     ```
   - Creates conversion event (if table exists):
     ```sql
     INSERT INTO conversion_events (
       affiliate_link_id, campaign_id, user_id,
       network, transaction_id, amount, commission, status
     )
     ```
   - Updates campaign totals
   - Sends webhook to Zapier

**Database verification:**
```sql
-- Check conversion was recorded
SELECT conversions, revenue, conversion_rate 
FROM affiliate_links 
WHERE slug = 'test-product-slug';

-- Check campaign totals updated
SELECT revenue FROM campaigns WHERE id = (
  SELECT campaign_id FROM affiliate_links WHERE slug = 'test-product-slug'
);
```

**Expected result:**
- `conversions` incremented by 1
- `revenue` increased by commission amount
- `conversion_rate` calculated correctly
- Campaign revenue updated

---

## TEST 3: INTELLIGENCE LAYER INTEGRATION

### Step 3: Autopilot scores the performance
**When:** Autopilot runs every 30 seconds (Edge Function: `autopilot-engine`)

**What happens:**
1. **Scoring Engine** runs (`scoringEngine.ts`):
   ```typescript
   For each posted_content:
   - Calculate CTR = (clicks / impressions) * 100
   - Calculate conversion_rate = (conversions / clicks) * 100
   - Calculate revenue_per_click = revenue / clicks
   - Calculate performance_score = weighted formula
   - Assign autopilot_state: testing, scaling, cooldown, killed
   ```

2. **Decision Engine** runs (`decisionEngine.ts`):
   ```typescript
   IF (CTR >= 2% OR clicks >= 20):
     - autopilot_state = 'scaling'
     - decision_type = 'scale'
     - Insert into autopilot_decisions
   
   ELSE IF (impressions >= 200 AND CTR < 1% AND conversions == 0):
     - autopilot_state = 'killed'
     - decision_type = 'kill'
     - Insert into autopilot_decisions
   ```

3. **Autopilot Actions**:
   - **Scaling products**: Create 5 new products next cycle
   - **Testing products**: Create 3 new products next cycle
   - **Killed products**: Skip creation, mark for cooldown

**Database verification:**
```sql
-- Check performance scores calculated
SELECT 
  product_name, clicks, conversions, ctr, 
  conversion_rate, performance_score, autopilot_state
FROM affiliate_links 
WHERE user_id = 'your-user-id'
ORDER BY performance_score DESC;

-- Check autopilot decisions logged
SELECT * FROM autopilot_decisions 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 10;

-- Check priority queue
SELECT * FROM autopilot_queue
WHERE user_id = 'your-user-id'
ORDER BY priority_score DESC;
```

**Expected result:**
- Posts with good performance get `scaling` state
- Posts with bad performance get `killed` state
- Decisions logged in `autopilot_decisions`
- Priority queue updated

---

## TEST 4: PROFIT DASHBOARD VERIFICATION

### Step 4: View real-time metrics
**Location:** Dashboard → "Profit Intelligence" tab

**What displays:**
1. **Total Revenue**: Sum of all `affiliate_links.revenue`
2. **CTR**: Average across all links
3. **Conversion Rate**: Average across all links
4. **Best Platform**: Platform with highest revenue (from `posted_content`)
5. **Best Product**: Product with highest performance_score
6. **Top 5 Posts**: Posts sorted by revenue

**Database queries used:**
```sql
-- Total revenue
SELECT SUM(revenue) FROM affiliate_links WHERE user_id = 'user-id';

-- Average CTR
SELECT AVG(ctr) FROM affiliate_links WHERE user_id = 'user-id' AND clicks > 0;

-- Best performing product
SELECT * FROM affiliate_links 
WHERE user_id = 'user-id'
ORDER BY performance_score DESC
LIMIT 1;

-- Top 5 posts
SELECT * FROM posted_content
WHERE user_id = 'user-id'
ORDER BY revenue DESC
LIMIT 5;
```

---

## TEST 5: END-TO-END COMPLETE FLOW

### Full Autopilot Cycle Test

1. **Enable Autopilot**: Dashboard → AI Autopilot → Toggle ON
2. **First Run**: Click "Run Cycle Now"
3. **Autopilot creates**:
   - 3-5 products (based on existing performance)
   - 2 content pieces
   - 2 social posts

4. **Simulate real traffic**:
   ```bash
   # Click on a product link
   curl https://yourdomain.com/go/autoproduct-123
   
   # Simulate conversion
   curl -X POST "https://yourdomain.com/api/postback?network=amazon&click_id=autoproduct-123&amount=50&commission=5&status=approved"
   ```

5. **Next Autopilot Run** (30 seconds later):
   - Scores the post: calculates CTR, conversion_rate, performance_score
   - Makes decision: scale/kill based on rules
   - Creates more products if scaling

6. **Check Profit Dashboard**:
   - See revenue updated
   - See CTR calculated
   - See best performers ranked

---

## VERIFICATION CHECKLIST

### ✅ Click Tracking
- [ ] Clicks increment in `affiliate_links` table
- [ ] Click events logged in `click_events` table
- [ ] Activity logs created
- [ ] User redirected to correct URL

### ✅ Conversion Tracking
- [ ] Conversions increment when postback received
- [ ] Revenue updated correctly
- [ ] Conversion rate calculated
- [ ] Campaign totals updated
- [ ] Webhook sent to Zapier

### ✅ Intelligence Layer
- [ ] Performance scores calculated (CTR, conversion_rate, revenue_per_click)
- [ ] Autopilot states assigned (testing, scaling, killed)
- [ ] Decisions logged in `autopilot_decisions`
- [ ] Priority queue updated based on performance

### ✅ Autopilot Actions
- [ ] Scaling products get 5 new products created
- [ ] Testing products get 3 new products created
- [ ] Killed products skipped
- [ ] Content generation works
- [ ] Posts published

### ✅ Profit Dashboard
- [ ] Total revenue displays correctly
- [ ] CTR displays correctly
- [ ] Conversion rate displays correctly
- [ ] Best platform identified
- [ ] Best product identified
- [ ] Top 5 posts ranked by revenue

---

## COMMON ISSUES & FIXES

### Issue 1: Clicks not tracking
**Check:**
- Is `slug` correct in database?
- Is link status = 'active'?
- Check browser console for errors

**Fix:**
- Verify slug exists: `SELECT * FROM affiliate_links WHERE slug = 'your-slug'`
- Check RLS policies allow public SELECT on active links

### Issue 2: Conversions not recording
**Check:**
- Is postback URL configured in affiliate network?
- Is `click_id` matching a real slug?
- Check API logs

**Fix:**
- Verify postback format matches expected parameters
- Check affiliate network dashboard for postback errors

### Issue 3: Autopilot not making decisions
**Check:**
- Are posts getting enough data? (impressions > 0, clicks > 0)
- Is autopilot enabled in user_settings?

**Fix:**
- Manually set test data:
  ```sql
  UPDATE posted_content SET
    impressions = 200,
    clicks = 10,
    conversions = 2,
    revenue = 15
  WHERE id = 'test-post-id';
  ```
- Run autopilot cycle manually

### Issue 4: Profit dashboard showing $0
**Check:**
- Do affiliate links have revenue > 0?
- Are conversions being tracked?

**Fix:**
- Test conversion tracking first (Test 2)
- Verify database has data: `SELECT SUM(revenue) FROM affiliate_links WHERE user_id = 'user-id'`

---

## SUCCESS CRITERIA

The system is working correctly when:

1. ✅ Clicks are tracked in real-time
2. ✅ Conversions update revenue when postback received
3. ✅ Autopilot scores posts every 30 seconds
4. ✅ Decisions are made (scale/kill) based on performance
5. ✅ Scaling products get more content created
6. ✅ Profit dashboard shows accurate revenue, CTR, conversions
7. ✅ Best performers are identified and ranked

This is the complete profit-seeking intelligence layer working as designed.