# PRODUCT ADDITION FLOW TEST

## Test Scenario: Add Products to Campaign

### Step 1: Get Available Products
```typescript
import { productCatalogService } from "@/services/productCatalogService";

// Get top 10 products
const products = productCatalogService.getTopProducts(10);

console.log("Available products:", products.length);
products.forEach(p => {
  console.log(`- ${p.name} (${p.network}) - ${p.commission} commission`);
});
```

**Expected Output:**
```
Available products: 10
- Wireless Earbuds Bluetooth 5.3 (Temu Affiliate) - 20% commission
- Smart Watch Fitness Tracker (Temu Affiliate) - 20% commission
- Apple AirPods Pro (2nd Gen) (Amazon Associates) - 3% commission
...
```

---

### Step 2: Add Products to Campaign
```typescript
import { supabase } from "@/integrations/supabase/client";
import { productCatalogService } from "@/services/productCatalogService";

async function testProductAddition() {
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  
  // Create test campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .insert({
      user_id: user.id,
      name: "Test Campaign",
      goal: "sales",
      status: "active"
    })
    .select()
    .single();
  
  console.log("✅ Campaign created:", campaign.id);
  
  // Get products
  const products = productCatalogService.getTopProducts(5);
  const productIds = products.map(p => p.id);
  
  // Add to campaign
  const result = await productCatalogService.addProductsToCampaign(
    campaign.id,
    productIds
  );
  
  console.log("✅ Products added:", result.length);
  
  return { campaign, products: result };
}
```

**Expected Database Changes:**
- ✅ New row in `campaigns` table
- ✅ 5 new rows in `campaign_products` table
- ✅ All rows link to campaign via `campaign_id`

---

### Step 3: Create Affiliate Links
```typescript
import { affiliateLinkService } from "@/services/affiliateLinkService";

async function createLinksForProducts(campaignId, products) {
  const links = [];
  
  for (const product of products) {
    const result = await affiliateLinkService.createLink({
      originalUrl: product.url,
      productName: product.name,
      network: product.network,
      campaignId: campaignId,
      commissionRate: parseFloat(product.commission)
    });
    
    if (result.success) {
      links.push(result.link);
      console.log(`✅ Link created: ${result.link.cloaked_url}`);
    } else {
      console.error(`❌ Failed: ${product.name} - ${result.error}`);
    }
  }
  
  return links;
}
```

**Expected Output:**
```
✅ Link created: https://sale-makseb.vercel.app/go/a3Bc9x
✅ Link created: https://sale-makseb.vercel.app/go/x7Yz2p
✅ Link created: https://sale-makseb.vercel.app/go/m4Kl8n
✅ Link created: https://sale-makseb.vercel.app/go/q5Rt6w
✅ Link created: https://sale-makseb.vercel.app/go/f2Jh9s
```

**Expected Database Changes:**
- ✅ 5 new rows in `affiliate_links` table
- ✅ Each has unique `slug` and `cloaked_url`
- ✅ All link to `campaign_id`
- ✅ `status` = 'active'
- ✅ `clicks`, `conversions`, `revenue` = 0

---

### Step 4: Test Complete Flow
```typescript
async function testCompleteFlow() {
  console.log("🧪 TESTING COMPLETE PRODUCT FLOW\n");
  
  // Step 1: Create campaign + add products
  const { campaign, products } = await testProductAddition();
  console.log("\n📦 Products in campaign:", products.length);
  
  // Step 2: Create affiliate links
  const links = await createLinksForProducts(campaign.id, products);
  console.log("\n🔗 Affiliate links created:", links.length);
  
  // Step 3: Verify database state
  const { data: campaignProducts } = await supabase
    .from("campaign_products")
    .select("*")
    .eq("campaign_id", campaign.id);
  
  const { data: affiliateLinks } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("campaign_id", campaign.id);
  
  console.log("\n✅ DATABASE VERIFICATION:");
  console.log(`  - Campaign: ${campaign.name}`);
  console.log(`  - Products: ${campaignProducts?.length || 0}`);
  console.log(`  - Links: ${affiliateLinks?.length || 0}`);
  
  // Step 4: Test tracking
  if (affiliateLinks && affiliateLinks.length > 0) {
    const firstLink = affiliateLinks[0];
    
    // Simulate click
    await fetch('/api/tracking/clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        link_id: firstLink.id,
        platform: 'tiktok',
        user_id: campaign.user_id
      })
    });
    
    console.log("\n📊 Simulated click on:", firstLink.product_name);
    
    // Check updated count
    const { data: updatedLink } = await supabase
      .from("affiliate_links")
      .select("clicks")
      .eq("id", firstLink.id)
      .single();
    
    console.log(`  - Click count: ${updatedLink?.clicks || 0}`);
  }
  
  return { campaign, products, links };
}
```

**Expected Final Output:**
```
🧪 TESTING COMPLETE PRODUCT FLOW

✅ Campaign created: abc-123-def-456

📦 Products in campaign: 5

✅ Link created: https://sale-makseb.vercel.app/go/a3Bc9x
✅ Link created: https://sale-makseb.vercel.app/go/x7Yz2p
✅ Link created: https://sale-makseb.vercel.app/go/m4Kl8n
✅ Link created: https://sale-makseb.vercel.app/go/q5Rt6w
✅ Link created: https://sale-makseb.vercel.app/go/f2Jh9s

🔗 Affiliate links created: 5

✅ DATABASE VERIFICATION:
  - Campaign: Test Campaign
  - Products: 5
  - Links: 5

📊 Simulated click on: Wireless Earbuds Bluetooth 5.3
  - Click count: 1
```

---

## Verification Checklist

After running the test:

- [ ] `campaigns` table has 1 new row
- [ ] `campaign_products` table has 5 new rows
- [ ] `affiliate_links` table has 5 new rows
- [ ] All `affiliate_links` have unique slugs
- [ ] Click tracking increments `clicks` field
- [ ] `system_state` table updates `total_clicks`
- [ ] Cloaked URLs follow format: `{domain}/go/{slug}`

---

## Known Limitations

1. **Social Media Posting:** Requires API credentials (not included in test)
2. **Amazon API:** Real product data requires Amazon Product API key
3. **Domain:** Uses `NEXT_PUBLIC_APP_URL` or defaults to Vercel domain

---

## Run Test

```bash
# In browser console or test file
await testCompleteFlow();
```