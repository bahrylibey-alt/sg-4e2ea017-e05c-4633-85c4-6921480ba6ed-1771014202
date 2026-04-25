# Complete Affiliate System Test - End-to-End Validation

**Last Updated:** 2026-04-25
**Purpose:** Validate that ALL posts have valid affiliate links and proper tracking

---

## 🎯 Critical Requirements

Every piece of content MUST have:
1. ✅ **Valid Product** - Real product from catalog with affiliate URL
2. ✅ **Affiliate Link** - Cloaked tracking link (e.g., `/go/product-123`)
3. ✅ **Click Tracking** - Record every click in `click_events` table
4. ✅ **Conversion Tracking** - Record sales in `conversion_events` table
5. ✅ **Revenue Attribution** - Link clicks → conversions → revenue

---

## 📊 Database Schema Validation

### **Product Catalog Table**
```sql
product_catalog:
  ✅ id (uuid)
  ✅ name (text) - Product name
  ✅ description (text) - Product details
  ✅ price (numeric) - Product price
  ✅ commission_rate (numeric) - Earnings percentage
  ✅ affiliate_url (text) - CRITICAL: Must be valid URL
  ✅ image_url (text) - Product image
  ✅ category (text) - Product category
  ✅ network (text) - Amazon, AliExpress, etc.
  ✅ status (text) - active/paused/archived
  ✅ user_id (uuid) - Owner
```

### **Affiliate Links Table**
```sql
affiliate_links:
  ✅ id (uuid)
  ✅ user_id (uuid)
  ✅ product_id (uuid) - Links to product_catalog
  ✅ original_url (text) - Real affiliate URL
  ✅ cloaked_url (text) - Your domain (/go/slug)
  ✅ slug (text) - Short identifier
  ✅ clicks (integer) - Total clicks
  ✅ conversions (integer) - Total sales
  ✅ revenue (numeric) - Total earnings
  ✅ status (text) - active/paused/archived
```

### **Posted Content Table**
```sql
posted_content:
  ✅ id (uuid)
  ✅ user_id (uuid)
  ✅ product_id (uuid) - CRITICAL: Links to product
  ✅ link_id (uuid) - CRITICAL: Links to affiliate_links
  ✅ platform (text) - Pinterest, TikTok, etc.
  ✅ caption (text) - Post content
  ✅ post_url (text) - Platform post URL
  ✅ clicks (integer) - Tracked clicks
  ✅ conversions (integer) - Tracked sales
  ✅ revenue (numeric) - Tracked earnings
```

### **Click Events Table**
```sql
click_events:
  ✅ id (uuid)
  ✅ link_id (uuid) - CRITICAL: Which link was clicked
  ✅ content_id (uuid) - Which post generated the click
  ✅ platform (text) - Where click came from
  ✅ converted (boolean) - Did it result in sale?
  ✅ ip_address (text) - Visitor IP
  ✅ user_agent (text) - Browser info
  ✅ country (text) - Geo location
  ✅ clicked_at (timestamp) - When it happened
```

### **Conversion Events Table**
```sql
conversion_events:
  ✅ id (uuid)
  ✅ click_id (text) - Links to click_events
  ✅ content_id (uuid) - Which post converted
  ✅ user_id (uuid) - Who earned commission
  ✅ revenue (numeric) - Sale amount
  ✅ source (text) - Network that paid
  ✅ verified (boolean) - Confirmed by network
```

---

## 🔄 Complete Data Flow

```
1. PRODUCT DISCOVERY
   ↓
   [Product added to product_catalog]
   - name: "Smart WiFi Coffee Maker"
   - affiliate_url: "https://amazon.com/dp/B08X123?tag=yourstore-20"
   - price: $79.99
   - commission_rate: 8%
   ↓

2. AFFILIATE LINK CREATION
   ↓
   [Affiliate link created in affiliate_links]
   - product_id: [product.id]
   - original_url: "https://amazon.com/dp/B08X123?tag=yourstore-20"
   - cloaked_url: "https://yoursite.com/go/coffee-maker-123"
   - slug: "coffee-maker-123"
   ↓

3. CONTENT GENERATION
   ↓
   [Content created in generated_content]
   - title: "Best Smart Coffee Makers 2026"
   - body: "...check out this amazing coffee maker..."
   - Links to product_id
   ↓

4. SOCIAL PUBLISHING
   ↓
   [Post created in posted_content]
   - product_id: [product.id]
   - link_id: [affiliate_link.id]
   - caption: "☕ Transform your mornings! https://yoursite.com/go/coffee-maker-123"
   - platform: "pinterest"
   ↓

5. USER CLICKS LINK
   ↓
   [Click recorded in click_events]
   - link_id: [affiliate_link.id]
   - content_id: [posted_content.id]
   - platform: "pinterest"
   - ip_address: "1.2.3.4"
   - clicked_at: NOW()
   ↓
   [User redirected to Amazon]
   ↓

6. USER PURCHASES PRODUCT
   ↓
   [Conversion recorded in conversion_events]
   - click_id: [click_event.id]
   - content_id: [posted_content.id]
   - user_id: [your_user_id]
   - revenue: $6.40 (8% of $79.99)
   - source: "amazon"
   - verified: true
   ↓

7. STATS UPDATED
   ↓
   affiliate_links.clicks += 1
   affiliate_links.conversions += 1
   affiliate_links.revenue += $6.40
   posted_content.clicks += 1
   posted_content.conversions += 1
   posted_content.revenue += $6.40
```

---

## ✅ System Validation Checklist

### **1. Product Catalog Validation**

```sql
-- Check all products have valid affiliate URLs
SELECT 
  id,
  name,
  affiliate_url,
  CASE 
    WHEN affiliate_url IS NULL THEN '❌ Missing'
    WHEN affiliate_url = '' THEN '❌ Empty'
    WHEN affiliate_url NOT LIKE 'http%' THEN '❌ Invalid format'
    ELSE '✅ Valid'
  END as url_status
FROM product_catalog
WHERE status = 'active';

-- Expected: ALL products should show ✅ Valid
```

### **2. Affiliate Links Validation**

```sql
-- Check all links are properly configured
SELECT 
  al.id,
  al.slug,
  al.original_url,
  al.cloaked_url,
  p.name as product_name,
  CASE 
    WHEN al.product_id IS NULL THEN '❌ No product'
    WHEN al.original_url IS NULL THEN '❌ No URL'
    WHEN al.slug IS NULL THEN '❌ No slug'
    ELSE '✅ Valid'
  END as link_status
FROM affiliate_links al
LEFT JOIN product_catalog p ON p.id = al.product_id
WHERE al.status = 'active';

-- Expected: ALL links should show ✅ Valid
```

### **3. Posted Content Validation**

```sql
-- Check all posts have products AND links
SELECT 
  pc.id,
  pc.platform,
  p.name as product_name,
  al.cloaked_url as affiliate_link,
  CASE 
    WHEN pc.product_id IS NULL THEN '❌ No product'
    WHEN pc.link_id IS NULL THEN '❌ No link'
    WHEN pc.caption NOT LIKE '%' || al.cloaked_url || '%' THEN '❌ Link not in caption'
    ELSE '✅ Valid'
  END as post_status
FROM posted_content pc
LEFT JOIN product_catalog p ON p.id = pc.product_id
LEFT JOIN affiliate_links al ON al.id = pc.link_id
WHERE pc.status = 'posted';

-- Expected: ALL posts should show ✅ Valid
```

### **4. Click Tracking Validation**

```sql
-- Check clicks are properly attributed
SELECT 
  ce.id,
  al.slug as link_slug,
  pc.platform as source_platform,
  ce.clicked_at,
  CASE 
    WHEN ce.link_id IS NULL THEN '❌ No link'
    WHEN ce.content_id IS NULL THEN '❌ No content'
    ELSE '✅ Valid'
  END as click_status
FROM click_events ce
LEFT JOIN affiliate_links al ON al.id = ce.link_id
LEFT JOIN posted_content pc ON pc.id = ce.content_id
ORDER BY ce.clicked_at DESC
LIMIT 100;

-- Expected: ALL clicks should show ✅ Valid
```

### **5. Conversion Tracking Validation**

```sql
-- Check conversions are linked to clicks
SELECT 
  cv.id,
  cv.revenue,
  ce.id as click_event_id,
  al.slug as link_slug,
  pc.platform,
  CASE 
    WHEN cv.click_id IS NULL THEN '❌ No click_id'
    WHEN cv.content_id IS NULL THEN '❌ No content'
    WHEN cv.revenue <= 0 THEN '❌ No revenue'
    ELSE '✅ Valid'
  END as conversion_status
FROM conversion_events cv
LEFT JOIN click_events ce ON ce.click_id::text = cv.click_id
LEFT JOIN affiliate_links al ON al.id = ce.link_id
LEFT JOIN posted_content pc ON pc.id = cv.content_id
ORDER BY cv.created_at DESC;

-- Expected: ALL conversions should show ✅ Valid
```

---

## 🧪 End-to-End Test Procedure

### **Test 1: Product Discovery**

1. **Run Product Discovery**
   ```
   Go to: /autopilot-center
   Click: "Product Discovery" → "Run Now"
   ```

2. **Validate Products**
   ```sql
   SELECT name, affiliate_url, price, commission_rate
   FROM product_catalog
   WHERE created_at > NOW() - INTERVAL '5 minutes'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

3. **Expected Result:**
   ```
   ✅ 3-5 new products
   ✅ All have affiliate_url starting with http
   ✅ All have price > 0
   ✅ All have commission_rate > 0
   ```

### **Test 2: Affiliate Link Creation**

1. **Check Affiliate Links**
   ```sql
   SELECT 
     al.slug,
     al.original_url,
     al.cloaked_url,
     p.name
   FROM affiliate_links al
   JOIN product_catalog p ON p.id = al.product_id
   WHERE al.created_at > NOW() - INTERVAL '5 minutes'
   ORDER BY al.created_at DESC;
   ```

2. **Expected Result:**
   ```
   ✅ Links created for new products
   ✅ slug is unique and readable
   ✅ original_url matches product.affiliate_url
   ✅ cloaked_url format: /go/{slug}
   ```

### **Test 3: Content Generation**

1. **Run Content Generator**
   ```
   Go to: /autopilot-center
   Click: "Content Generator" → "Run Now"
   ```

2. **Validate Content**
   ```sql
   SELECT 
     gc.title,
     gc.body,
     p.name as product_name
   FROM generated_content gc
   LEFT JOIN product_catalog p ON gc.body LIKE '%' || p.name || '%'
   WHERE gc.created_at > NOW() - INTERVAL '5 minutes'
   ORDER BY gc.created_at DESC;
   ```

3. **Expected Result:**
   ```
   ✅ 1-3 new articles
   ✅ Articles mention product names
   ✅ Content is SEO-optimized
   ```

### **Test 4: Social Publishing**

1. **Run Social Publisher**
   ```
   Go to: /autopilot-center
   Click: "Social Publisher" → "Run Now"
   ```

2. **Validate Posts**
   ```sql
   SELECT 
     pc.platform,
     pc.caption,
     p.name as product_name,
     al.cloaked_url
   FROM posted_content pc
   JOIN product_catalog p ON p.id = pc.product_id
   JOIN affiliate_links al ON al.id = pc.link_id
   WHERE pc.created_at > NOW() - INTERVAL '5 minutes'
   ORDER BY pc.created_at DESC;
   ```

3. **Expected Result:**
   ```
   ✅ 3-5 new posts
   ✅ Each has product_id
   ✅ Each has link_id
   ✅ Caption includes cloaked_url
   ✅ Posted to multiple platforms
   ```

### **Test 5: Click Tracking**

1. **Simulate Click**
   ```
   Get a cloaked URL from posted_content
   Visit: https://yoursite.com/go/product-slug
   ```

2. **Validate Click**
   ```sql
   SELECT 
     ce.*,
     al.slug,
     pc.platform
   FROM click_events ce
   JOIN affiliate_links al ON al.id = ce.link_id
   LEFT JOIN posted_content pc ON pc.id = ce.content_id
   WHERE ce.clicked_at > NOW() - INTERVAL '1 minute'
   ORDER BY ce.clicked_at DESC
   LIMIT 1;
   ```

3. **Expected Result:**
   ```
   ✅ New click_event created
   ✅ link_id is set
   ✅ content_id is set (if from post)
   ✅ ip_address is captured
   ✅ Redirected to affiliate URL
   ```

### **Test 6: Conversion Tracking**

1. **Simulate Conversion**
   ```
   POST /api/postback
   {
     "click_id": "clk_abc123",
     "revenue": 6.40,
     "transaction_id": "order_xyz789"
   }
   ```

2. **Validate Conversion**
   ```sql
   SELECT 
     cv.*,
     ce.id as click_id,
     al.slug,
     pc.platform
   FROM conversion_events cv
   LEFT JOIN click_events ce ON ce.click_id::text = cv.click_id
   LEFT JOIN affiliate_links al ON al.id = ce.link_id
   LEFT JOIN posted_content pc ON pc.id = cv.content_id
   WHERE cv.created_at > NOW() - INTERVAL '1 minute'
   ORDER BY cv.created_at DESC
   LIMIT 1;
   ```

3. **Expected Result:**
   ```
   ✅ New conversion_event created
   ✅ click_id links to click_events
   ✅ revenue > 0
   ✅ content_id is set
   ✅ Stats updated in affiliate_links
   ✅ Stats updated in posted_content
   ```

---

## 🚨 Common Issues & Fixes

### **Issue 1: Posts Without Products**

**Problem:** Posted content missing product_id

**Check:**
```sql
SELECT id, platform, caption, product_id
FROM posted_content
WHERE product_id IS NULL
AND created_at > NOW() - INTERVAL '1 day';
```

**Fix:**
- Update content generation to ALWAYS reference products
- Ensure autopilot selects products before posting

### **Issue 2: Posts Without Links**

**Problem:** Posted content missing link_id

**Check:**
```sql
SELECT id, platform, caption, link_id
FROM posted_content
WHERE link_id IS NULL
AND created_at > NOW() - INTERVAL '1 day';
```

**Fix:**
- Create affiliate_links BEFORE posting
- Link posts to affiliate_links table

### **Issue 3: Broken Affiliate URLs**

**Problem:** Products with invalid affiliate URLs

**Check:**
```sql
SELECT id, name, affiliate_url
FROM product_catalog
WHERE affiliate_url NOT LIKE 'http%'
OR affiliate_url IS NULL
OR LENGTH(affiliate_url) < 10;
```

**Fix:**
- Validate URLs during product discovery
- Only save products with valid affiliate URLs

### **Issue 4: Clicks Not Tracked**

**Problem:** Users click links but no click_events

**Check:**
```sql
SELECT 
  al.slug,
  al.clicks as db_clicks,
  COUNT(ce.id) as actual_clicks
FROM affiliate_links al
LEFT JOIN click_events ce ON ce.link_id = al.id
WHERE al.created_at > NOW() - INTERVAL '1 day'
GROUP BY al.id, al.slug, al.clicks
HAVING al.clicks != COUNT(ce.id);
```

**Fix:**
- Check `/go/[slug].tsx` redirect page
- Ensure API call to track click
- Verify click_events insert policy

### **Issue 5: Conversions Not Attributed**

**Problem:** Sales happen but not linked to clicks

**Check:**
```sql
SELECT 
  cv.id,
  cv.click_id,
  cv.revenue,
  ce.id as matching_click
FROM conversion_events cv
LEFT JOIN click_events ce ON ce.click_id::text = cv.click_id
WHERE cv.created_at > NOW() - INTERVAL '1 day'
AND ce.id IS NULL;
```

**Fix:**
- Ensure click_id is stored during redirect
- Match click_id format in postback
- Verify click_events has click_id field

---

## 📈 Success Metrics

After running complete autopilot workflow:

```sql
-- Overall System Health
SELECT 
  'Products' as metric,
  COUNT(*) as total,
  COUNT(CASE WHEN affiliate_url LIKE 'http%' THEN 1 END) as valid,
  ROUND(100.0 * COUNT(CASE WHEN affiliate_url LIKE 'http%' THEN 1 END) / COUNT(*), 2) as pct
FROM product_catalog
WHERE status = 'active'

UNION ALL

SELECT 
  'Affiliate Links',
  COUNT(*),
  COUNT(CASE WHEN product_id IS NOT NULL AND original_url LIKE 'http%' THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN product_id IS NOT NULL AND original_url LIKE 'http%' THEN 1 END) / COUNT(*), 2)
FROM affiliate_links
WHERE status = 'active'

UNION ALL

SELECT 
  'Posted Content',
  COUNT(*),
  COUNT(CASE WHEN product_id IS NOT NULL AND link_id IS NOT NULL THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN product_id IS NOT NULL AND link_id IS NOT NULL THEN 1 END) / COUNT(*), 2)
FROM posted_content
WHERE status = 'posted'

UNION ALL

SELECT 
  'Click Events',
  COUNT(*),
  COUNT(CASE WHEN link_id IS NOT NULL THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN link_id IS NOT NULL THEN 1 END) / COUNT(*), 2)
FROM click_events
WHERE clicked_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
  'Conversions',
  COUNT(*),
  COUNT(CASE WHEN click_id IS NOT NULL AND revenue > 0 THEN 1 END),
  ROUND(100.0 * COUNT(CASE WHEN click_id IS NOT NULL AND revenue > 0 THEN 1 END) / COUNT(*), 2)
FROM conversion_events
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Target: 100% valid for all metrics** ✅

---

## 🎯 Final Validation

Run this comprehensive query to verify EVERYTHING:

```sql
-- Complete System Validation
WITH recent_posts AS (
  SELECT * FROM posted_content 
  WHERE created_at > NOW() - INTERVAL '24 hours'
)
SELECT 
  COUNT(DISTINCT rp.id) as total_posts,
  COUNT(DISTINCT CASE WHEN rp.product_id IS NOT NULL THEN rp.id END) as posts_with_products,
  COUNT(DISTINCT CASE WHEN rp.link_id IS NOT NULL THEN rp.id END) as posts_with_links,
  COUNT(DISTINCT CASE WHEN p.affiliate_url LIKE 'http%' THEN rp.id END) as posts_with_valid_urls,
  COUNT(DISTINCT ce.id) as total_clicks,
  COUNT(DISTINCT cv.id) as total_conversions,
  COALESCE(SUM(cv.revenue), 0) as total_revenue,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN rp.product_id IS NOT NULL THEN rp.id END) / NULLIF(COUNT(DISTINCT rp.id), 0), 2) as product_coverage_pct,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN rp.link_id IS NOT NULL THEN rp.id END) / NULLIF(COUNT(DISTINCT rp.id), 0), 2) as link_coverage_pct
FROM recent_posts rp
LEFT JOIN product_catalog p ON p.id = rp.product_id
LEFT JOIN affiliate_links al ON al.id = rp.link_id
LEFT JOIN click_events ce ON ce.content_id = rp.id
LEFT JOIN conversion_events cv ON cv.content_id = rp.id;
```

**Expected Results:**
```
total_posts: 10+
posts_with_products: 10+ (100%)
posts_with_links: 10+ (100%)
posts_with_valid_urls: 10+ (100%)
total_clicks: varies
total_conversions: varies
total_revenue: varies
product_coverage_pct: 100.00
link_coverage_pct: 100.00
```

---

## ✅ System is Valid When:

1. ✅ **All products** have valid affiliate URLs
2. ✅ **All affiliate links** reference products
3. ✅ **All posts** include product_id AND link_id
4. ✅ **All clicks** are tracked in click_events
5. ✅ **All conversions** link back to clicks
6. ✅ **Revenue flows** product → post → click → conversion
7. ✅ **Stats update** in real-time across all tables

**When these conditions are met, your affiliate system is PRODUCTION-READY!** 🚀