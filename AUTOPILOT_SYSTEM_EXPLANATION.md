# 🤖 HOW THE AI AUTOPILOT SYSTEM WORKS (END-TO-END)

The AffiliatePro Autopilot System is a highly advanced, fully automated engine that handles every aspect of your affiliate marketing business, from product discovery to revenue tracking. 

Here is the exact step-by-step flow of how the system functions:

## 1. PRODUCT DISCOVERY (The Intake)
**Service:** `smartProductDiscovery.ts`
* **Action:** The system connects securely to your integrated affiliate networks (Amazon, Impact, CJ, AliExpress).
* **Intelligence:** It doesn't just pull any product. It looks at your `autopilot_settings` (budget, price limits) and retrieves products that fit your specific criteria.
* **Output:** Only real products with active, valid affiliate links are saved into your `product_catalog` database table.

## 2. TRAFFIC GENERATION (The Engine)
**Service:** `trafficAutomationService.ts` & `smartCampaignService.ts`
* **Action:** The system creates and schedules campaigns across your connected traffic sources (TikTok, Pinterest, Instagram).
* **Intelligence:** It automatically generates content descriptions and optimal posting times.
* **Output:** Your affiliate links are pushed out to the world to generate impressions and clicks.

## 3. TRACKING & CLICKS (The Data Gathering)
**Service:** `tracking/clicks.ts` & `tracking/views.ts`
* **Action:** When a user clicks your affiliate link on a traffic source, the click is intercepted and tracked.
* **Intelligence:** The system logs the source platform, the specific product, the user's location, and the timestamp. This data is securely stored in your database.
* **Output:** Accurate, real-time click-through rates (CTR) and engagement metrics are mapped to each product.

## 4. CONVERSIONS & REVENUE (The Payoff)
**Service:** `tracking/conversions.ts` & `zapier/webhook.ts`
* **Action:** When a user purchases the product, the affiliate network fires a postback/webhook back to AffiliatePro.
* **Intelligence:** The system matches the conversion back to the exact click and traffic source that generated it.
* **Output:** Real revenue is added to your dashboard, and the specific product and traffic source are credited for the sale.

## 5. AI SCORING & OPTIMIZATION (The Brain)
**Service:** `scoringEngine.ts` & `decisionEngine.ts`
* **Action:** The Autopilot runs on a schedule (or manually via the dashboard) and analyzes all the accumulated data.
* **Intelligence:** It calculates an advanced score (0.0 to 1.0) based on:
  * **Viral Coefficient:** Is the content being shared?
  * **Engagement Velocity:** How fast are people clicking?
  * **Revenue Potential:** Clicks × Conversion Rate × Commission.
* **Output:** Products are categorized as:
  * **WINNER (>0.08):** Automatically scales budget and frequency.
  * **TESTING (0.03-0.08):** Continues running to gather more data.
  * **KILL (<0.03):** Pauses the campaign to stop wasting resources.

---

## 🎯 END-TO-END VALIDATION

To prove this entire system works flawlessly without fake data:

1. **You must be logged in** (The 401 error is now permanently fixed).
2. **Connect a Real Network** in `/integrations` to fetch actual products.
3. **Click "Find Products"** on the Dashboard.
4. **Click "Run Autopilot"** — you will see the AI immediately begin scoring your newly imported products and making intelligent routing decisions based on their real performance metrics.