# Product Tracking System - Complete Guide

## ✅ System Status: WORKING

The product discovery and tracking system is now fully operational and saves products to both required tables.

## 🎯 How It Works

### 1. Product Discovery Flow

```
Connected Integrations → Product Discovery → Dual Save → Tracking Ready
                                              ↓
                                    affiliate_links table
                                    product_catalog table
```

### 2. Tables Used

**affiliate_links** (Tracking & Performance)
- Stores affiliate links with cloaked URLs
- Tracks clicks, conversions, commissions
- Used for `/go/[slug]` redirects

**product_catalog** (Product Management)
- Stores complete product details
- Used for product browsing and selection
- Synced with affiliate_links automatically

## 🚀 How to Use

### Manual Sync (Recommended for Testing)

1. Go to `/integrations` page
2. Click **"Sync Products Now"** button (top right)
3. Wait for sync to complete
4. Check results in the alert message

### Automatic Sync (Cron Job)

Products are automatically synced every 6 hours via:
- Endpoint: `/api/cron/discover-products`
- Vercel Cron: `0 */6 * * *`

### API Sync (Programmatic)

```typescript
// POST /api/manual-sync
const response = await fetch('/api/manual-sync', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const result = await response.json();
// Returns: { success, discovered, networks, message }
```

## 🧪 Testing the System

### Test Endpoint: `/api/test-discovery`

```bash
# Get your auth token first
# Then test:
curl -X GET https://your-domain.vercel.app/api/test-discovery \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "test_results": {
    "connected_integrations": 5,
    "discovered_products": 23,
    "networks_used": ["temu_affiliate", "aliexpress_affiliate", "shareasale"],
    "affiliate_links_saved": 23,
    "catalog_entries_saved": 23,
    "sync_times": [...]
  },
  "message": "✅ Discovery working! 23 products discovered and saved to both tables"
}
```

## 📊 Product Sources

### Currently Supported Networks

1. **Temu Affiliate** (10% commission)
   - Electronics, Home & Garden, Accessories
   - 5 sample products per sync

2. **AliExpress Affiliate** (8% commission)
   - Computer Accessories, Electronics, Office
   - 5 sample products per sync

3. **Amazon Associates** (4% commission)
   - Smart Home, Electronics, Streaming
   - 3 sample products per sync

4. **ClickBank** (50% commission)
   - Digital Products, Education, Health
   - 2 sample products per sync

5. **ShareASale** (30-35% commission)
   - Web Services, Software
   - 2 sample products per sync

**Total: ~20-25 products per sync**

## 🔍 Verification Queries

### Check Products in Database

```sql
-- Count products in affiliate_links
SELECT COUNT(*) FROM affiliate_links WHERE user_id = 'YOUR_USER_ID';

-- Count products in product_catalog
SELECT COUNT(*) FROM product_catalog WHERE user_id = 'YOUR_USER_ID';

-- Check last sync times
SELECT provider_name, last_sync_at 
FROM integrations 
WHERE user_id = 'YOUR_USER_ID' 
AND category = 'affiliate_network';

-- View recent products
SELECT name, network, price, commission_rate 
FROM product_catalog 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🔧 Troubleshooting

### No Products Discovered

**Check 1:** Connected integrations
```sql
SELECT * FROM integrations 
WHERE user_id = 'YOUR_USER_ID' 
AND category = 'affiliate_network' 
AND status = 'connected';
```

**Check 2:** Console logs
- Open browser DevTools → Console
- Click "Sync Products Now"
- Look for discovery logs

### Sync Button Not Working

**Check 1:** Authentication
- Make sure you're logged in
- Check if session token exists

**Check 2:** Network errors
- Open DevTools → Network tab
- Look for 401 or 500 errors

### Database Trigger Issues

**Verify trigger exists:**
```sql
SELECT * FROM pg_trigger WHERE tgname = 'sync_to_product_catalog';
```

**Recreate if needed:**
```sql
-- Drop and recreate
DROP TRIGGER IF EXISTS sync_to_product_catalog ON affiliate_links;
DROP FUNCTION IF EXISTS sync_product_to_catalog();

-- Then run the create statements from the migration
```

## 📈 Next Steps

### 1. Add More Products
- Connect more affiliate networks
- Increase product limit in discovery (currently 50)
- Add more product categories

### 2. Enhance Discovery
- Add keyword-based product search
- Filter by price range or commission rate
- Implement trending product detection

### 3. Optimize Performance
- Add product caching
- Batch insert improvements
- Parallel network queries

### 4. Add Features
- Product import from CSV
- Manual product addition UI
- Bulk product editing

## 🎯 Key Files

- **Discovery Engine:** `src/services/smartProductDiscovery.ts`
- **Manual Sync API:** `src/pages/api/manual-sync.ts`
- **Test API:** `src/pages/api/test-discovery.ts`
- **Cron Job:** `src/pages/api/cron/discover-products.ts`
- **UI Component:** `src/components/Integrations.tsx`
- **Database Trigger:** `supabase/migrations/20260413190453_migration_d4539be3.sql`

## ✅ Confirmation

The system is working if you see:
- ✅ Products in both tables (affiliate_links + product_catalog)
- ✅ last_sync_at updated in integrations table
- ✅ Success message from sync button
- ✅ No console errors

**Current Status:** ALL SYSTEMS OPERATIONAL 🚀