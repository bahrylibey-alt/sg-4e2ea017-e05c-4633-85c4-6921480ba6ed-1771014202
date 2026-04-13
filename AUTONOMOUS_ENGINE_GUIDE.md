# AUTONOMOUS ENGINE — COMPLETE SYSTEM GUIDE

## 🎯 WHAT IT DOES

The autonomous engine turns your affiliate system into a **self-growing money machine** that:
- ✅ Scores every post automatically
- ✅ Identifies winners, testing, and weak performers
- ✅ Recommends scaling actions (never auto-executes)
- ✅ Learns from your best content
- ✅ Optimizes platform strategy
- ✅ Shows AI-powered insights

---

## 🔄 THE CORE LOOP (Runs every 30-60 min)

```
Discover → Generate → Post → Track → Score → Recommend → Scale
```

1. **Collect Data**: Pulls real views, clicks, conversions from `posted_content`
2. **Score Posts**: Calculates performance score (0-1 scale)
3. **Classify**: WINNER / TESTING / WEAK / NO_DATA
4. **Recommend**: Suggests actions (scale up, test variations, reduce)
5. **Scale Safely**: Max +25% per cycle, 20 posts/day limit

---

## 📊 SCORING FORMULA

```javascript
score = (CTR * 0.4) + (conversion_rate * 0.4) + (revenue_per_click * 0.2)
```

**Classification:**
- `score > 0.08` → **WINNER** (scale this)
- `0.03 - 0.08` → **TESTING** (try variations)
- `< 0.03` → **WEAK** (reduce priority)
- No data → **NO_DATA** (keep collecting)

---

## 🤖 DECISION ENGINE (SAFE MODE)

### For WINNERS (score > 0.08):
```
✅ Recommend: Create 3 variations
✅ Recommend: Increase posting frequency by 25%
❌ Does NOT: Auto-post or spam
```

### For TESTING (0.03 - 0.08):
```
✅ Recommend: Try different hook styles
✅ Recommend: Test new CTAs
❌ Does NOT: Scale prematurely
```

### For WEAK (< 0.03):
```
✅ Recommend: Reduce posting frequency
✅ Recommend: Test different products
❌ Does NOT: Delete content
```

---

## 🧬 VIRAL ENGINE (CONTROLLED)

### Step 1: Generate Variations
```javascript
// Example: Winner post gets 3 test variations
generateVariations(userId, postId);
// Returns: curiosity hook, benefit hook, question hook
```

### Step 2: Test Performance
```javascript
// System tracks each variation separately
// Scores independently over 24-48 hours
```

### Step 3: Scale ONLY Winners
```javascript
// If variation scores > 0.08:
//   → Recommend increasing that variation
// Never blindly duplicates all variations
```

---

## 📈 PLATFORM OPTIMIZATION

### Auto-Recommendations:
```javascript
// If platform conversion > 8%:
→ "Increase posting frequency on TikTok by 25%"

// If platform conversion < 3%:
→ "Reduce posting on Pinterest, focus on winners"

// System NEVER:
❌ Disables platforms automatically
❌ Stops user from posting manually
```

---

## 🧠 CONTENT DNA TRACKING

### What Gets Tracked:
- Hook type (curiosity, benefit, question, stat, story)
- Format (video, image, carousel)
- CTA style
- Performance score

### How It's Used:
```javascript
// System learns: "curiosity hooks work best for you"
// Next posts: Prioritizes curiosity-style content
// Never: Forces you to use only one type
```

---

## 🚦 TRAFFIC STATES

```
NO_DATA   → Need 100+ views to start scoring
LOW       → 100+ views, learning patterns
ACTIVE    → 10+ clicks, optimizing performance
SCALING   → Proven winners, scaling safely
```

**Dashboard adapts based on state:**
- NO_DATA: "Post content to start collecting data"
- LOW: "Learning your audience preferences"
- ACTIVE: "Optimizing based on performance"
- SCALING: "Scaling your best performers"

---

## 🛡️ SAFETY LIMITS (ANTI-CRASH)

### Hard Limits:
```javascript
MAX_POSTS_PER_DAY_PER_PLATFORM = 20;
MAX_SCALING_PERCENTAGE = 25; // Max +25% per cycle
MIN_DATA_THRESHOLD = 100; // Need 100+ views
```

### Fail-Safe Rules:
```
✅ If scoring fails → System continues posting
✅ If recommendations fail → Manual control works
✅ If viral engine crashes → Original system unaffected
```

---

## 🎨 AI INSIGHTS (UI)

### Dashboard Shows:
```
📊 Performance Summary
   - Total Posts: 47
   - Winners: 8
   - Testing: 23
   - Weak: 16

🏆 Top Performers
   - Best Platform: TikTok
   - Best Hook: "curiosity"
   - Top Product: "Kitchen Gadget XYZ" (12% conversion)

💡 Recommendations
   - SCALE_UP: Create 3 variations of top post
   - TEST_VARIATIONS: Try different hooks on Pinterest
   - REDUCE_PRIORITY: Lower frequency on Instagram

🎯 Next Steps
   - Focus on TikTok (your best platform)
   - Create variations of winners
   - Monitor conversion rates closely
```

### If No Data:
```
"Collecting data... Post content to start analysis"
```

---

## 🔌 API ENDPOINTS

### Tracking APIs:
```
POST /api/tracking/views
POST /api/tracking/clicks
POST /api/tracking/conversions
```

### Autopilot APIs:
```
POST /api/autopilot/score
POST /api/autopilot/recommend
```

### Cron Job:
```
GET /api/cron/autopilot
Runs every 30-60 min via Vercel cron
```

---

## 💾 DATABASE TABLES

### New Tables (Added by Autonomous Engine):
```sql
autopilot_scores
- Stores performance scores for all posts
- Updates every 30-60 min

autopilot_decisions
- Logs all recommendations
- Never auto-executes, only suggests

content_dna
- Tracks what works (hook types, formats)
- Used for future content optimization
```

### Existing Tables (Unchanged):
```
✅ posted_content (untouched)
✅ affiliate_links (untouched)
✅ campaigns (untouched)
✅ generated_content (untouched)
```

---

## 🧪 HOW TO TEST

### Step 1: Post Some Content
```
1. Create 5-10 posts manually
2. Wait 24 hours for data collection
```

### Step 2: Check Scores
```
Visit: Dashboard → AI Insights Tab
See: Performance scores, classifications
```

### Step 3: Review Recommendations
```
Dashboard shows:
- "SCALE_UP: This post is a winner"
- "TEST_VARIATIONS: Try different hooks"
```

### Step 4: Execute Manually
```
User decides:
✅ "Yes, scale this winner" → Creates variations manually
✅ "No, keep testing" → Ignores recommendation
```

---

## ⚠️ WHAT IT DOES NOT DO

### Never Auto-Executes:
```
❌ Delete posts
❌ Change user settings
❌ Spam content
❌ Override manual posts
❌ Disable platforms
❌ Modify existing campaigns
```

### Always Asks First:
```
✅ "Recommend scaling winner X?"
✅ "Suggest reducing platform Y?"
✅ "Try variation Z?"
```

---

## 🚀 FINAL WORKFLOW

```
1. User posts content (manually or via Magic Tools)
2. System tracks views/clicks/conversions
3. Every 30-60 min: Autonomous engine runs
4. Scores calculated, recommendations generated
5. Dashboard shows AI insights
6. User reviews and decides
7. User executes recommended actions (or ignores)
8. System learns from results
9. Loop continues → System grows smarter
```

---

## 🎯 SUCCESS METRICS

After 30 days of autonomous engine:
- ✅ Know your best platform
- ✅ Know your best hook types
- ✅ Know your top converting products
- ✅ Have clear scaling recommendations
- ✅ System makes data-driven suggestions

---

## 🔧 TROUBLESHOOTING

### "No insights showing"
```
→ Need 100+ views minimum
→ Wait 24-48 hours after first post
```

### "Scores seem wrong"
```
→ Check that clicks/conversions are tracking
→ Verify webhook setup for verified revenue
```

### "System not recommending anything"
```
→ Need at least 10 posts with 100+ views each
→ Check autopilot_scores table has data
```

---

## 📝 FINAL RULES

1. **If AI fails → System still works**
2. **If AI works → System grows automatically**
3. **User always has final say**
4. **Never breaks existing workflows**
5. **All recommendations are suggestions, not commands**

---

**Status: ✅ PRODUCTION READY**

The autonomous engine is a **safe intelligence layer** that adds smart recommendations without touching your existing posting/integration system.