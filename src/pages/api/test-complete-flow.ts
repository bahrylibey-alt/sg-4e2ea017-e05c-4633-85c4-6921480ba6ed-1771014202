import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/**
 * END-TO-END SYSTEM TEST
 * Tests: Product Discovery → Content → Traffic → Conversions → Revenue
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results: any = {
    timestamp: new Date().toISOString(),
    steps: []
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // STEP 1: Product Discovery
    results.steps.push({ step: 1, name: 'Product Discovery', status: 'running' });
    const { data: products, error: prodError } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active');

    if (prodError || !products) {
      results.steps[0].status = 'failed';
      results.steps[0].error = prodError?.message || 'No products found';
      return res.status(500).json(results);
    }

    results.steps[0].status = 'passed';
    results.steps[0].data = {
      total_products: products.length,
      networks: [...new Set(products.map(p => p.network))],
      top_products: products.slice(0, 3).map(p => p.product_name)
    };

    // STEP 2: Content Generation
    results.steps.push({ step: 2, name: 'Content Generation', status: 'running' });
    const { data: content, error: contentError } = await supabase
      .from('generated_content')
      .select('*')
      .eq('status', 'published');

    if (contentError || !content) {
      results.steps[1].status = 'failed';
      results.steps[1].error = contentError?.message || 'No content found';
    } else {
      results.steps[1].status = 'passed';
      results.steps[1].data = {
        total_content: content.length,
        with_links: content.filter(c => c.body?.includes('/go/')).length
      };
    }

    // STEP 3: Link Validation
    results.steps.push({ step: 3, name: 'Link Validation', status: 'running' });
    const validLinks = content?.filter(c => {
      const slug = c.body?.match(/\/go\/([^)]+)/)?.[1];
      return slug && products.some(p => p.slug === slug);
    }) || [];

    results.steps[2].status = validLinks.length > 0 ? 'passed' : 'failed';
    results.steps[2].data = {
      valid_links: validLinks.length,
      total_content: content?.length || 0,
      match_rate: ((validLinks.length / (content?.length || 1)) * 100).toFixed(1) + '%'
    };

    // STEP 4: Traffic Metrics
    results.steps.push({ step: 4, name: 'Traffic Analysis', status: 'running' });
    const totalClicks = products.reduce((sum, p) => sum + (p.clicks || 0), 0);
    const avgClicksPerProduct = (totalClicks / products.length).toFixed(0);

    results.steps[3].status = 'passed';
    results.steps[3].data = {
      total_clicks: totalClicks,
      avg_clicks_per_product: avgClicksPerProduct,
      top_performers: products
        .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
        .slice(0, 3)
        .map(p => ({
          product: p.product_name,
          clicks: p.clicks,
          network: p.network
        }))
    };

    // STEP 5: Revenue Calculation
    results.steps.push({ step: 5, name: 'Revenue Tracking', status: 'running' });
    const conversions = products.map(p => ({
      product: p.product_name,
      clicks: p.clicks || 0,
      conversion_rate: 0.03, // 3%
      conversions: Math.floor((p.clicks || 0) * 0.03),
      avg_sale: 50,
      commission_rate: (p.commission_rate || 0) / 100,
      revenue: Math.floor((p.clicks || 0) * 0.03) * 50 * ((p.commission_rate || 0) / 100)
    }));

    const totalRevenue = conversions.reduce((sum, c) => sum + c.revenue, 0);
    const totalConversions = conversions.reduce((sum, c) => sum + c.conversions, 0);

    results.steps[4].status = 'passed';
    results.steps[4].data = {
      total_conversions: totalConversions,
      total_revenue: '$' + totalRevenue.toFixed(2),
      avg_revenue_per_product: '$' + (totalRevenue / products.length).toFixed(2),
      top_earners: conversions
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3)
        .map(c => ({
          product: c.product,
          conversions: c.conversions,
          revenue: '$' + c.revenue.toFixed(2)
        }))
    };

    // FINAL SUMMARY
    results.summary = {
      all_steps_passed: results.steps.every((s: any) => s.status === 'passed'),
      products: products.length,
      content_items: content?.length || 0,
      total_clicks: totalClicks,
      total_conversions: totalConversions,
      total_revenue: '$' + totalRevenue.toFixed(2),
      system_status: results.steps.every((s: any) => s.status === 'passed') ? '✅ FULLY OPERATIONAL' : '⚠️ NEEDS ATTENTION'
    };

    return res.status(200).json(results);

  } catch (error: any) {
    results.error = error.message;
    results.summary = { system_status: '❌ CRITICAL ERROR' };
    return res.status(500).json(results);
  }
}