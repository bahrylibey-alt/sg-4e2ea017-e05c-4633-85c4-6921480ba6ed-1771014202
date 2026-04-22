import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * COMPLETE SYSTEM HEALTH CHECK
 * 
 * Tests:
 * 1. Link routing (published content → redirect)
 * 2. Autopilot state
 * 3. Product catalog (real vs mock)
 * 4. Integration status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('🏥 SYSTEM HEALTH CHECK STARTING...');
    const report: string[] = [];
    let allHealthy = true;

    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = user.id;

    // ===== CHECK 1: Published Content & Links =====
    report.push('═══════════════════════════════════════════════════');
    report.push('📝 CHECK 1: Published Content');
    report.push('═══════════════════════════════════════════════════');

    const { data: published, count: publishedCount } = await supabase
      .from('generated_content')
      .select('id, title, body, clicks, status', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(5);

    report.push(`Total Published: ${publishedCount || 0}`);

    if (published && published.length > 0) {
      report.push('\nRecent Items:');
      published.forEach((item, i) => {
        const hasUrl = item.body && /https?:\/\/[^\s<>"]+/.test(item.body);
        const status = hasUrl ? '✅' : '❌';
        report.push(`${i + 1}. ${status} ${item.title} (${item.clicks || 0} clicks)`);
        if (!hasUrl) allHealthy = false;
      });
    } else {
      report.push('⚠️  No published content');
      allHealthy = false;
    }

    // ===== CHECK 2: Draft Backlog =====
    report.push('');
    report.push('═══════════════════════════════════════════════════');
    report.push('📦 CHECK 2: Draft Backlog');
    report.push('═══════════════════════════════════════════════════');

    const { count: draftCount } = await supabase
      .from('generated_content')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'draft');

    report.push(`Total Drafts: ${draftCount || 0}`);

    if (draftCount && draftCount > 100) {
      report.push('⚠️  Large backlog detected - run emergency recovery');
      allHealthy = false;
    } else {
      report.push('✅ Backlog normal');
    }

    // ===== CHECK 3: Product Catalog =====
    report.push('');
    report.push('═══════════════════════════════════════════════════');
    report.push('🛍️  CHECK 3: Product Catalog');
    report.push('═══════════════════════════════════════════════════');

    const { data: products, count: productCount } = await supabase
      .from('product_catalog')
      .select('id, name, network', { count: 'exact' })
      .eq('user_id', userId)
      .limit(5);

    report.push(`Total Products: ${productCount || 0}`);

    if (products && products.length > 0) {
      const mockProducts = products.filter(p => p.name.includes('Auto Product'));
      if (mockProducts.length > 0) {
        report.push(`⚠️  ${mockProducts.length} mock products found`);
        allHealthy = false;
      } else {
        report.push('✅ All products appear real');
      }
    } else {
      report.push('⚠️  No products in catalog');
      allHealthy = false;
    }

    // ===== CHECK 4: Autopilot Status =====
    report.push('');
    report.push('═══════════════════════════════════════════════════');
    report.push('🤖 CHECK 4: Autopilot Status');
    report.push('═══════════════════════════════════════════════════');

    const { data: settings } = await supabase
      .from('user_settings')
      .select('autopilot_enabled, last_autopilot_run')
      .eq('user_id', userId)
      .maybeSingle();

    if (settings) {
      report.push(`Enabled: ${settings.autopilot_enabled ? 'Yes' : 'No'}`);
      
      if (settings.last_autopilot_run) {
        const lastRun = new Date(settings.last_autopilot_run);
        const hoursSince = (Date.now() - lastRun.getTime()) / (1000 * 60 * 60);
        report.push(`Last Run: ${Math.round(hoursSince)}h ago`);
        
        if (hoursSince > 24) {
          report.push('⚠️  Autopilot stale - may need restart');
          allHealthy = false;
        } else {
          report.push('✅ Recently active');
        }
      } else {
        report.push('⚠️  Never run');
        allHealthy = false;
      }
    } else {
      report.push('❌ Settings not found');
      allHealthy = false;
    }

    // ===== CHECK 5: Affiliate Integrations =====
    report.push('');
    report.push('═══════════════════════════════════════════════════');
    report.push('🔌 CHECK 5: Affiliate Integrations');
    report.push('═══════════════════════════════════════════════════');

    const { data: integrations, count: integrationCount } = await supabase
      .from('integrations')
      .select('provider, status', { count: 'exact' })
      .eq('user_id', userId)
      .eq('category', 'affiliate');

    report.push(`Connected Networks: ${integrationCount || 0}`);

    if (integrations && integrations.length > 0) {
      integrations.forEach(int => {
        const status = int.status === 'connected' ? '✅' : '❌';
        report.push(`${status} ${int.provider}`);
      });
    } else {
      report.push('⚠️  No affiliate networks connected');
      allHealthy = false;
    }

    // ===== FINAL VERDICT =====
    report.push('');
    report.push('═══════════════════════════════════════════════════');
    if (allHealthy) {
      report.push('✅ SYSTEM HEALTHY');
    } else {
      report.push('⚠️  ISSUES DETECTED');
      report.push('');
      report.push('Recommended Actions:');
      report.push('1. Run /api/emergency-recovery to fix issues');
      report.push('2. Connect affiliate networks in /integrations');
      report.push('3. Run product discovery for real data');
    }
    report.push('═══════════════════════════════════════════════════');

    console.log('✅ Health check complete');

    return res.status(200).json({
      success: true,
      healthy: allHealthy,
      report: report.join('\n'),
      stats: {
        published: publishedCount || 0,
        drafts: draftCount || 0,
        products: productCount || 0,
        integrations: integrationCount || 0
      }
    });

  } catch (error: any) {
    console.error('❌ Health check error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}