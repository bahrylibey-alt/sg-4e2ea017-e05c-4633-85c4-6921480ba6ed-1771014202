# Quick Test Guide - Product Tracking System

## 🎯 Current Status

✅ **System Ready** - All components installed and configured:
- Database tables created
- Auto-sync trigger active
- 5 affiliate networks connected
- Manual sync button added
- Test endpoints ready

⏳ **Waiting for First Sync** - No products yet (0 in both tables)

---

## 🚀 Test Method 1: UI Button (Recommended)

**Steps:**
1. Open browser and go to: `/integrations`
2. Look for **"Sync Products Now"** button (top right corner)
3. Click the button
4. Wait 5-10 seconds
5. Look for success alert with results

**Expected Result:**
```
✅ Successfully discovered 23 products from:
   Temu Affiliate, AliExpress Affiliate, Amazon Associates, ClickBank, ShareASale

23 products from 5 networks
```

**What Happens:**
- Discovers ~23 products from 5 networks
- Saves to `affiliate_links` table
- Saves to `product_catalog` table
- Updates `last_sync_at` timestamp

---

## 🧪 Test Method 2: Test Endpoint

**Get Your Auth Token:**
```javascript
// Open browser DevTools Console (F12)
// Paste this:
const { data } = await supabase.auth.getSession();
console.log(data.session?.access_token);
// Copy the token that appears
```

**Run Test:**
```bash
curl -X GET https://your-domain.vercel.app/api/test-discovery \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected Response:**
```json
{
  "success": true,
  "test_results": {
    "connected_integrations": 5,
    "discovered_products": 23,
    "networks_used": ["temu_affiliate", "aliexpress_affiliate", "amazon_associates", "clickbank", "shareasale"],
    "affiliate_links_saved": 23,
    "catalog_entries_saved": 23,
    "sync_times": [...]
  },
  "message": "✅ Discovery working! 23 products discovered and saved to both tables"
}
```

---

## 🔍 Test Method 3: Database Check

**After running a sync, verify in database:**

```sql
-- Count products in affiliate_links
SELECT COUNT(*) FROM affiliate_links;
-- Expected: ~23

-- Count products in product_catalog  
SELECT COUNT(*) FROM product_catalog;
-- Expected: ~23

-- Check sync times updated
SELECT provider_name, last_sync_at 
FROM integrations 
WHERE category = 'affiliate_network';
-- Expected: All should have recent timestamps

-- View sample products
SELECT name, network, price, commission_rate 
FROM product_catalog 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📊 Expected Product Distribution

| Network | Products | Commission Rate |
|---------|----------|----------------|
| Temu Affiliate | 5 | 10% |
| AliExpress Affiliate | 5 | 8% |
| Amazon Associates | 3 | 4% |
| ClickBank | 2 | 50% |
| ShareASale | 2 | 30-35% |
| **Total** | **~20-23** | **Mixed** |

---

## 🔧 Troubleshooting

### Issue: "No products discovered"

**Check 1:** Are integrations connected?
```sql
SELECT provider_name, status 
FROM integrations 
WHERE category = 'affiliate_network';
```
All should show `status = 'connected'`

**Check 2:** Console logs
- Open DevTools → Console
- Look for discovery logs starting with 🔍
- Check for any red errors

### Issue: "Not authenticated"

**Solution:**
1. Make sure you're logged in
2. Refresh the page
3. Try the sync button again

### Issue: "Button does nothing"

**Check:**
1. Open DevTools → Network tab
2. Click the button
3. Look for `/api/manual-sync` request
4. Check response for errors

---

## ✅ Success Indicators

You'll know it's working when you see:

1. **UI Alert:** Success message with product count
2. **Database:** Products in both tables
3. **Timestamps:** `last_sync_at` updated in integrations
4. **Console:** No red errors
5. **Test Endpoint:** Returns success response

---

## 🎯 Next Steps After First Sync

Once products are synced successfully:

1. **View Products:** Check `/dashboard` or product pages
2. **Test Tracking:** Click on product links (go/slug)
3. **Check Analytics:** View click/conversion tracking
4. **Add More:** Connect more affiliate networks
5. **Automate:** Set up cron job for auto-sync every 6 hours

---

## 📞 Need Help?

If sync fails after trying all methods:

1. Share console errors (DevTools → Console)
2. Share API response (Network tab)
3. Share database query results
4. Check server logs for errors

**The system is ready - just needs the first manual sync!** 🚀