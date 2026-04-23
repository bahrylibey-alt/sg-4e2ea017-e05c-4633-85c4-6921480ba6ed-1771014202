# Vercel Cron Jobs Setup

## Automatic Daily Product Discovery

The system uses Vercel Cron Jobs to automatically discover and publish trending products every day.

## Cron Schedule

**Product Discovery:** Runs daily at 2:00 AM UTC
```
Path: /api/cron/discover-products
Schedule: 0 2 * * * (Every day at 2 AM UTC)
```

**Autopilot:** Runs every 6 hours
```
Path: /api/cron/autopilot
Schedule: 0 */6 * * * (Every 6 hours)
```

## How It Works

1. **Discovery Phase**
   - Scans Amazon, Temu, AliExpress for trending products
   - Adds new products to `affiliate_links` table
   - Tracks metrics: clicks, commission rates, network

2. **Publishing Phase**
   - Generates high-quality content for top products
   - Embeds affiliate tracking links (`/go/[slug]`)
   - Publishes to `generated_content` table
   - Visible on `/trending` page immediately

3. **Traffic Simulation** (optional)
   - Simulates realistic click patterns
   - Updates analytics data
   - Provides revenue estimates

## Testing Cron Jobs Manually

### Test Product Discovery
```bash
curl https://your-domain.vercel.app/api/cron/discover-products
```

### Test Autopilot
```bash
curl https://your-domain.vercel.app/api/cron/autopilot
```

### Complete System Test
```bash
curl https://your-domain.vercel.app/api/test-complete-flow
```

## Deployment

Cron jobs are automatically deployed with your Vercel app. No additional setup required!

### Enable Cron Jobs in Vercel:
1. Deploy your app to Vercel
2. Vercel automatically detects `vercel.json` cron configuration
3. Cron jobs start running on schedule
4. View logs in Vercel Dashboard → Functions → Cron Jobs

## Security

Cron jobs are protected by Vercel's automatic `CRON_SECRET` header. Only Vercel's cron system can trigger these endpoints.

## Monitoring

Check cron job execution:
- Vercel Dashboard → Deployments → Functions
- Look for `/api/cron/discover-products` logs
- Verify `generated_content` table updates daily

## Troubleshooting

**Cron not running?**
- Check Vercel Dashboard → Settings → Environment Variables
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify cron syntax in `vercel.json`

**No products discovered?**
- Test manually: `curl /api/cron/discover-products`
- Check Supabase database for active products
- Review function logs in Vercel

## Manual Triggers

You can also trigger discovery manually from:
- Admin Dashboard → Settings → Autopilot
- Direct API call (requires authentication)
- Vercel Dashboard → Functions → Run Now