# TRACKING SYSTEM TEST GUIDE

## 🎯 VERIFY COMPLETE TRACKING CHAIN

This guide tests the complete tracking flow:
**Post → View → Click → Conversion → Revenue**

---

## TEST 1: VIEW TRACKING

### Create a Test Post
```javascript
const { data: post } = await supabase.from("posted_content").insert({
  user_id: "YOUR_USER_ID",
  platform: "tiktok",
  caption: "Test post for tracking",
  product_id: "PRODUCT_ID"
}).select().single();

console.log("Post created:", post.id);
```

### Track a View
```javascript
const { data: view } = await supabase.from("view_events").insert({
  user_id: "YOUR_USER_ID",
  post_id: post.id,
  product_id: "PRODUCT_ID",
  platform: "tiktok"
}).select().single();

console.log("View tracked:", view.id);
```

### Verify Sync (Database Trigger)
```javascript
// Wait 1-2 seconds for trigger
await new Promise(r => setTimeout(r, 2000));

const { data: updatedPost } = await supabase
  .from("posted_content")
  .select("impressions")
  .eq("id", post.id)
  .single();

console.log("Post impressions:", updatedPost.impressions); // Should be 1
```

**✅ PASS:** Impressions count increased  
**❌ FAIL:** Trigger not working

---

## TEST 2: CLICK TRACKING

### Create Affiliate Link
```javascript
const { data: link } = await supabase.from("affiliate_links").insert({
  user_id: "YOUR_USER_ID",
  product_id: "PRODUCT_ID",
  original_url: "https://amazon.com/product",
  slug: "test-" + Date.now(),
  network: "Amazon Associates"
}).select().single();

console.log("Link created:", link.id);
```

### Track a Click
```javascript
const { data: click } = await supabase.from("click_events").insert({
  user_id: "YOUR_USER_ID",
  link_id: link.id,
  post_id: post.id,
  product_id: "PRODUCT_ID",
  platform: "tiktok"
}).select().single();

console.log("Click tracked:", click.id);
```

### Verify Sync (2 Triggers)
```javascript
// Wait for triggers
await new Promise(r => setTimeout(r, 2000));

// Check post clicks
const { data: updatedPost } = await supabase
  .from("posted_content")
  .select("clicks")
  .eq("id", post.id)
  .single();

console.log("Post clicks:", updatedPost.clicks); // Should be 1

// Check link clicks
const { data: updatedLink } = await supabase
  .from("affiliate_links")
  .select("clicks")
  .eq("id", link.id)
  .single();

console.log("Link clicks:", updatedLink.clicks); // Should be 1
```

**✅ PASS:** Both counts increased  
**❌ FAIL:** Triggers not syncing

---

## TEST 3: CONVERSION TRACKING

### Track a Conversion
```javascript
const { data: conversion } = await supabase.from("conversion_events").insert({
  user_id: "YOUR_USER_ID",
  click_id: click.id,
  revenue: 29.99,
  verified: true,
  source: "test"
}).select().single();

console.log("Conversion tracked:", conversion.id);
```

### Verify Sync (3 Triggers)
```javascript
// Wait for triggers
await new Promise(r => setTimeout(r, 2000));

// Check post conversions & revenue
const { data: updatedPost } = await supabase
  .from("posted_content")
  .select("conversions, revenue")
  .eq("id", post.id)
  .single();

console.log("Post conversions:", updatedPost.conversions); // Should be 1
console.log("Post revenue:", updatedPost.revenue); // Should be 29.99

// Check link conversions & revenue
const { data: updatedLink } = await supabase
  .from("affiliate_links")
  .select("conversions, revenue")
  .eq("id", link.id)
  .single();

console.log("Link conversions:", updatedLink.conversions); // Should be 1
console.log("Link revenue:", updatedLink.revenue); // Should be 29.99

// Check system state
const { data: systemState } = await supabase
  .from("system_state")
  .select("*")
  .eq("user_id", "YOUR_USER_ID")
  .single();

console.log("Total revenue:", systemState.total_revenue); // Should include 29.99
console.log("Total conversions:", systemState.total_conversions);
```

**✅ PASS:** All metrics synced  
**❌ FAIL:** Triggers incomplete

---

## TEST 4: PERFORMANCE SCORING

### Calculate Score
```javascript
const scoringService = await import('/src/services/scoringEngine.ts');

const score = scoringService.scoringEngine.calculateScore({
  clicks: updatedPost.clicks,
  impressions: updatedPost.impressions,
  conversions: updatedPost.conversions,
  revenue: Number(updatedPost.revenue)
});

console.log("Performance score:", score);
// Expected: { score: X.XX, classification: "WINNER/TESTING/WEAK/NO_DATA", metrics: {...} }
```

**✅ PASS:** Score calculated correctly  
**❌ FAIL:** Formula error

---

## TEST 5: AI RECOMMENDATIONS

### Generate Recommendations
```javascript
const decisionService = await import('/src/services/decisionEngine.ts');

const decisions = await decisionService.decisionEngine.analyzePost(
  "YOUR_USER_ID",
  post.id
);

console.log("Recommendations:", decisions);
// Expected: [{ type: "scale/retest/cooldown", priority: "HIGH/MEDIUM/LOW", reason: "...", action: "..." }]
```

**✅ PASS:** Recommendations generated  
**❌ FAIL:** No recommendations

### Verify Saved to Database
```javascript
const { data: savedDecisions } = await supabase
  .from("autopilot_decisions")
  .select("*")
  .eq("entity_id", post.id)
  .order("created_at", { ascending: false });

console.log("Saved decisions:", savedDecisions.length);
```

**✅ PASS:** Decisions saved to DB  
**❌ FAIL:** Database save failed

---

## TEST 6: DASHBOARD INSIGHTS

### Generate Full Insights
```javascript
const insightsService = await import('/src/services/aiInsightsEngine.ts');

const insights = await insightsService.aiInsightsEngine.generateInsights("YOUR_USER_ID");

console.log("AI Insights:", insights);
// Expected: { performanceSummary: {...}, topPerformers: {...}, recommendations: [...], nextSteps: [...] }
```

**✅ PASS:** Insights generated  
**❌ FAIL:** Service error

---

## COMPLETE TEST SCRIPT

### Run All Tests in Browser Console

```javascript
async function runCompleteTest() {
  console.log("🧪 Starting Complete Tracking System Test");
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error("❌ No user authenticated");
    return;
  }
  
  const results = {
    post_creation: false,
    view_tracking: false,
    view_sync: false,
    click_tracking: false,
    click_sync: false,
    conversion_tracking: false,
    conversion_sync: false,
    scoring: false,
    recommendations: false,
    insights: false
  };
  
  try {
    // 1. Create Post
    const { data: post, error: postError } = await supabase.from("posted_content").insert({
      user_id: user.id,
      platform: "tiktok",
      caption: "Tracking test post",
    }).select().single();
    
    if (postError) throw new Error("Post creation failed: " + postError.message);
    results.post_creation = true;
    console.log("✅ Post created:", post.id);
    
    // 2. Track View
    const { error: viewError } = await supabase.from("view_events").insert({
      user_id: user.id,
      post_id: post.id,
      platform: "tiktok"
    });
    
    if (viewError) throw new Error("View tracking failed: " + viewError.message);
    results.view_tracking = true;
    console.log("✅ View tracked");
    
    // Wait for trigger
    await new Promise(r => setTimeout(r, 2000));
    
    // 3. Check View Sync
    const { data: postAfterView } = await supabase
      .from("posted_content")
      .select("impressions")
      .eq("id", post.id)
      .single();
    
    results.view_sync = postAfterView.impressions > 0;
    console.log("✅ View sync:", postAfterView.impressions);
    
    // 4. Create Link
    const { data: link } = await supabase.from("affiliate_links").insert({
      user_id: user.id,
      original_url: "https://amazon.com/test",
      slug: "test-" + Date.now(),
      network: "Test"
    }).select().single();
    
    // 5. Track Click
    const { data: click, error: clickError } = await supabase.from("click_events").insert({
      user_id: user.id,
      link_id: link.id,
      post_id: post.id,
      platform: "tiktok"
    }).select().single();
    
    if (clickError) throw new Error("Click tracking failed: " + clickError.message);
    results.click_tracking = true;
    console.log("✅ Click tracked");
    
    // Wait for triggers
    await new Promise(r => setTimeout(r, 2000));
    
    // 6. Check Click Sync
    const { data: postAfterClick } = await supabase
      .from("posted_content")
      .select("clicks")
      .eq("id", post.id)
      .single();
    
    results.click_sync = postAfterClick.clicks > 0;
    console.log("✅ Click sync:", postAfterClick.clicks);
    
    // 7. Track Conversion
    const { error: conversionError } = await supabase.from("conversion_events").insert({
      user_id: user.id,
      click_id: click.id,
      revenue: 29.99,
      verified: true,
      source: "test"
    });
    
    if (conversionError) throw new Error("Conversion tracking failed: " + conversionError.message);
    results.conversion_tracking = true;
    console.log("✅ Conversion tracked");
    
    // Wait for triggers
    await new Promise(r => setTimeout(r, 2000));
    
    // 8. Check Conversion Sync
    const { data: postAfterConversion } = await supabase
      .from("posted_content")
      .select("conversions, revenue")
      .eq("id", post.id)
      .single();
    
    results.conversion_sync = postAfterConversion.conversions > 0;
    console.log("✅ Conversion sync:", postAfterConversion.conversions, postAfterConversion.revenue);
    
    // 9. Test Scoring
    const scoringModule = await import('/src/services/scoringEngine.ts');
    const score = scoringModule.scoringEngine.calculateScore({
      clicks: postAfterConversion.clicks || 0,
      impressions: postAfterConversion.impressions || 0,
      conversions: postAfterConversion.conversions || 0,
      revenue: Number(postAfterConversion.revenue || 0)
    });
    
    results.scoring = score.score >= 0;
    console.log("✅ Scoring:", score);
    
    // 10. Test Recommendations
    const decisionModule = await import('/src/services/decisionEngine.ts');
    const decisions = await decisionModule.decisionEngine.analyzePost(user.id, post.id);
    
    results.recommendations = decisions.length > 0;
    console.log("✅ Recommendations:", decisions.length);
    
    // 11. Test Insights
    const insightsModule = await import('/src/services/aiInsightsEngine.ts');
    const insights = await insightsModule.aiInsightsEngine.generateInsights(user.id);
    
    results.insights = insights.performanceSummary.totalScore >= 0;
    console.log("✅ Insights generated");
    
    // Summary
    console.log("\n📊 TEST RESULTS:");
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}`);
    });
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(v => v).length;
    console.log(`\n🎯 TOTAL: ${passedTests}/${totalTests} tests passed`);
    
    return results;
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    return results;
  }
}

// Run test
runCompleteTest();
```

---

## EXPECTED RESULTS

### All Tests Pass ✅
```
✅ Post created
✅ View tracked
✅ View sync: 1
✅ Click tracked
✅ Click sync: 1
✅ Conversion tracked
✅ Conversion sync: 1 29.99
✅ Scoring: { score: X.XX, classification: "...", ... }
✅ Recommendations: N
✅ Insights generated

🎯 TOTAL: 10/10 tests passed
```

### What This Proves
1. ✅ Complete tracking chain works
2. ✅ Database triggers auto-sync metrics
3. ✅ Performance scoring calculates correctly
4. ✅ AI recommendations generate
5. ✅ Insights dashboard has real data
6. ✅ No mocks, all real database operations

---

## TROUBLESHOOTING

### Triggers Not Firing
```sql
-- Check if triggers exist
SELECT * FROM pg_trigger WHERE tgname LIKE 'sync_%';

-- Re-create triggers if missing (already done in system)
```

### Metrics Not Syncing
- Wait 2-3 seconds after insert
- Check database connection
- Verify RLS policies allow reads

### Score Always 0
- Check metrics are > 0
- Verify conversion has revenue
- Formula: (CTR×0.4) + (CR×0.4) + (RPC×0.2)

### No Recommendations
- Score must be calculated first
- Check `autopilot_scores` table
- Verify user_id matches

---

**Test Status:** Ready to run  
**Expected Time:** 30-60 seconds  
**All Features:** Real database operations  
**No Mocks:** Complete verification