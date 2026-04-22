import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";

/**
 * Test endpoint to debug autopilot publishing step-by-step
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Get user - try multiple methods
    const { data: settings } = await supabaseAdmin.from('user_settings').select('user_id').limit(1).maybeSingle();
    let userId = settings?.user_id;

    if (!userId) {
      const { data: links } = await supabaseAdmin.from('affiliate_links').select('user_id').limit(1).maybeSingle();
      userId = links?.user_id;
    }

    if (!userId) {
      return res.status(400).json({ error: 'No user found' });
    }

    // Get trending products
    const { data: trending } = await supabaseAdmin
      .from('affiliate_links')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('clicks', { ascending: false })
      .limit(10);

    const report = {
      userId,
      trending: trending?.map(p => ({
        name: p.product_name,
        network: p.network,
        slug: p.slug,
        clicks: p.clicks
      })),
      publishingTest: null as any
    };

    // Test publishing
    const publishResult = await smartProductDiscovery.publishTrendingProducts(userId, 5);
    report.publishingTest = publishResult;

    // Verify
    const { data: newContent } = await supabaseAdmin
      .from('generated_content')
      .select('id, title, body, created_at')
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5);

    return res.status(200).json({
      ...report,
      newContent: newContent?.map(c => ({
        id: c.id,
        title: c.title,
        hasAffiliateLink: c.body?.includes('/go/'),
        created: c.created_at
      }))
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}