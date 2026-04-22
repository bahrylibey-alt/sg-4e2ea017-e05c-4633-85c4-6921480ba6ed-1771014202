import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * FIX CONTENT URLs - Inject affiliate URLs into all published content
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🔧 FIXING CONTENT URLs...');

    // Get all users
    const { data: allUsers } = await supabase
      .from('profiles')
      .select('id')
      .limit(10);

    if (!allUsers || allUsers.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No users found'
      });
    }

    const results = [];

    for (const { id: userId } of allUsers) {
      console.log(`\n📝 Processing user: ${userId}`);

      // Get all published content
      const { data: content } = await supabase
        .from('generated_content')
        .select('id, title, body, campaign_id')
        .eq('user_id', userId)
        .eq('status', 'published')
        .limit(50);

      if (!content || content.length === 0) {
        console.log('No published content found');
        continue;
      }

      console.log(`Found ${content.length} published items`);

      let updated = 0;

      for (const item of content) {
        // Check if already has URL
        const hasUrl = /https?:\/\/[^\s<>"']+/.test(item.body);
        if (hasUrl) {
          console.log(`✓ ${item.title} - already has URL`);
          continue;
        }

        // Find related affiliate link
        let affiliateUrl = null;

        if (item.campaign_id) {
          const { data: link } = await supabase
            .from('affiliate_links')
            .select('slug, original_url')
            .eq('campaign_id', item.campaign_id)
            .eq('status', 'active')
            .maybeSingle();

          if (link) {
            affiliateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com'}/go/${link.slug}`;
          }
        }

        // Fallback: Create generic Amazon link
        if (!affiliateUrl) {
          const productName = item.title.replace(/^Review:\s*/, '').replace(/\s*-\s*\d+$/, '');
          affiliateUrl = `https://www.amazon.com/s?k=${encodeURIComponent(productName)}`;
        }

        // Update content with URL
        const updatedBody = `${item.body}\n\n<p><a href="${affiliateUrl}" target="_blank" rel="noopener" style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Get This Product Now →</a></p>`;

        await supabase
          .from('generated_content')
          .update({
            body: updatedBody,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        updated++;
        console.log(`✅ ${item.title} - URL injected`);
      }

      results.push({
        userId,
        total: content.length,
        updated
      });
    }

    console.log('\n✅ CONTENT URLs FIXED');

    return res.status(200).json({
      success: true,
      message: 'Content URLs fixed',
      results
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}