# Affiliate Network API Setup Guide - Get Real Revenue Tracking

## 🎯 Goal
Configure your affiliate networks to send conversion data to your system via webhooks/postbacks.

---

## 📍 Your Postback URL

**Copy this URL** - you'll need it for each affiliate network:

```
https://your-domain.vercel.app/api/postback
```

Replace `your-domain` with your actual Vercel domain.

---

## 1️⃣ Amazon Associates Setup

### Step 1: Get Your Amazon Associate ID
1. Go to https://affiliate-program.amazon.com/
2. Sign in to your account
3. Find your **Associate ID** (format: `yourname-20`)

### Step 2: Add Tracking ID to Your Links
Amazon Associates doesn't support postback webhooks, but tracks via:
- **Affiliate links** with your tag: `?tag=yourname-20`
- **Reports** in Amazon dashboard (manual check)

**Limitation:** Amazon requires manual revenue checking in their dashboard. No automatic webhook.

**Alternative:** Use Amazon Product Advertising API for automated tracking (advanced)

### Your Amazon Links Should Look Like:
```
https://www.amazon.com/dp/B0D18S9TB2?tag=yourname-20
```

---

## 2️⃣ Temu Affiliate Program Setup

### Step 1: Join Temu Affiliate Program
1. Go to https://seller.temu.com/affiliate
2. Apply for affiliate partnership
3. Get approved (usually 1-3 days)

### Step 2: Configure Postback URL
1. Login to Temu Affiliate Dashboard
2. Go to **Settings** → **Tracking & Conversion**
3. Add your postback URL:
   ```
   https://your-domain.vercel.app/api/postback
   ```
4. Select these parameters to send:
   - `order_id` (required)
   - `commission` (required)
   - `sale_amount` (required)
   - `click_id` (required - this is your link slug)

### Step 3: Test Postback
Temu will send a test conversion. Check your `/api/postback` endpoint logs.

**Expected Postback Format:**
```json
{
  "order_id": "TM123456789",
  "commission": "15.50",
  "sale_amount": "155.00",
  "click_id": "your-product-slug",
  "status": "confirmed"
}
```

---

## 3️⃣ AliExpress Affiliate Program Setup

### Step 1: Join AliExpress Affiliate
1. Go to https://portals.aliexpress.com/
2. Sign up for Affiliate Program
3. Get your **App Key** and **Tracking ID**

### Step 2: Use Tracking Links
AliExpress provides tracking links through their API:
```
https://s.click.aliexpress.com/e/_your_tracking_code
```

### Step 3: Check Reports
- AliExpress doesn't support postback webhooks directly
- Revenue tracked via their dashboard reports
- Export reports and import to your system

**Alternative:** Use AliExpress API for automated sync (advanced)

---

## 4️⃣ ClickBank Setup (Digital Products)

### Step 1: Get ClickBank Account
1. Go to https://www.clickbank.com/
2. Sign up as an affiliate
3. Get your **Account Nickname**

### Step 2: Configure Instant Notification URL (IPN)
1. Login to ClickBank
2. Go to **Settings** → **My Site**
3. Add Instant Notification URL:
   ```
   https://your-domain.vercel.app/api/postback
   ```
4. Enable these notification types:
   - SALE
   - BILL
   - RFND (refund)

### Step 3: Verify Secret Key
ClickBank sends a `secret_key` with each postback for security.
1. Copy your secret key from ClickBank settings
2. Add to your `.env.local`:
   ```
   CLICKBANK_SECRET_KEY=your_secret_key_here
   ```

**Expected Postback Format:**
```
POST /api/postback
ctransaction=SALE&ctransreceipt=ABC12345&ctransamount=47.00&caffitid=your-affiliate-id&caccountamount=23.50
```

---

## 5️⃣ ShareASale Setup

### Step 1: Join ShareASale
1. Go to https://www.shareasale.com/
2. Apply as an affiliate
3. Get approved (review process)

### Step 2: Configure Postback Pixel
1. Login to ShareASale dashboard
2. Go to **Tools** → **Tracking Pixel**
3. Add your postback URL:
   ```
   https://your-domain.vercel.app/api/postback?merchant_id=[[merchantID]]&order_id=[[ordernumber]]&amount=[[amount]]&commission=[[commission]]
   ```

### Step 3: Enable Auto-Deposit
ShareASale requires minimum $50 for payout. Enable auto-deposit in settings.

**Expected Postback Format:**
```
GET /api/postback?merchant_id=12345&order_id=SS789&amount=99.99&commission=9.99
```

---

## 🧪 Testing Your Postback Endpoint

### Test 1: Manual Postback Simulation
```bash
# Test with curl
curl -X POST https://your-domain.vercel.app/api/postback \
  -H "Content-Type: application/json" \
  -d '{
    "network": "temu_affiliate",
    "order_id": "TEST123",
    "commission": "15.50",
    "sale_amount": "155.00",
    "click_id": "test-product-slug",
    "status": "confirmed"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Conversion tracked successfully",
  "conversion_id": "uuid-here"
}
```

### Test 2: Check Database
```sql
SELECT * FROM conversion_events ORDER BY created_at DESC LIMIT 5;
```

You should see your test conversion appear.

### Test 3: Check Dashboard
1. Go to `/dashboard`
2. Refresh page
3. Revenue should update with test conversion

---

## 🔒 Security Best Practices

### 1. Validate Postback Sources
Only accept postbacks from known IP ranges:
- **Temu IPs:** (check their documentation)
- **ClickBank IPs:** (check their documentation)
- **ShareASale IPs:** (check their documentation)

### 2. Use Secret Keys
Always verify `secret_key` or signature sent by affiliate networks.

### 3. Prevent Duplicate Conversions
Your `/api/postback` already checks for duplicate `order_id` to prevent double-counting.

---

## 📊 What Happens When Postback Arrives

```
1. User clicks your /go/[slug] link
   ↓
2. System tracks click in click_events table
   ↓
3. User lands on affiliate product page
   ↓
4. User makes a purchase
   ↓
5. Affiliate network sends postback to /api/postback
   ↓
6. System records in conversion_events table
   ↓
7. System updates system_state with new revenue
   ↓
8. Dashboard shows updated revenue in real-time
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "Postback URL not reachable"
**Fix:** Make sure your Vercel domain is live and `/api/postback` returns 200 OK

### Issue 2: "Conversions not showing in dashboard"
**Fix:** Check conversion_events table, verify click_id matches a real link slug

### Issue 3: "Revenue is $0 despite conversions"
**Fix:** Verify commission field is populated in postback data

---

## 🎯 Next Steps

1. ✅ Set up postback URLs in affiliate dashboards
2. ✅ Test with manual curl request
3. ✅ Generate real traffic (see TRAFFIC_GENERATION_GUIDE.md)
4. ✅ Monitor first real conversion
5. ✅ Scale successful products

---

**Last Updated:** 2026-04-14  
**Status:** Ready for Production  
**Support:** Contact your affiliate network's support team for postback setup help