import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * SIMPLE DIAGNOSTIC ENDPOINT
 * Quick check of what's working and what's not
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const report: any = {
    timestamp: new Date().toISOString(),
    status: 'checking',
    checks: {}
  };

  try {
    // Check 1: Database Connection
    const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
    report.checks.database = dbError ? 'FAILED' : 'OK';

    // Check 2: Products
    const { data: products, error: prodError } = await supabase
      .from('product_catalog')
      .select('*', { count: 'exact', head: true });
    report.checks.products = {
      status: prodError ? 'FAILED' : 'OK',
      count: products || 0
    };

    // Check 3: Bridge Pages
    const { count: bridgeCount } = await supabase
      .from('bridge_pages')
      .select('*', { count: 'exact', head: true });
    report.checks.bridgePages = {
      status: 'OK',
      count: bridgeCount || 0
    };

    // Check 4: Generated Content
    const { count: contentCount } = await supabase
      .from('generated_content')
      .select('*', { count: 'exact', head: true });
    report.checks.generatedContent = {
      status: 'OK',
      count: contentCount || 0
    };

    // Check 5: Posted Content
    const { count: postCount } = await supabase
      .from('posted_content')
      .select('*', { count: 'exact', head: true });
    report.checks.postedContent = {
      status: 'OK',
      count: postCount || 0
    };

    // Check 6: Lead Magnets
    const { count: leadCount } = await supabase
      .from('lead_magnets')
      .select('*', { count: 'exact', head: true });
    report.checks.leadMagnets = {
      status: 'OK',
      count: leadCount || 0
    };

    // Check 7: Email Sequences
    const { count: emailCount } = await supabase
      .from('email_sequences')
      .select('*', { count: 'exact', head: true });
    report.checks.emailSequences = {
      status: 'OK',
      count: emailCount || 0
    };

    // Check 8: Tracking Pixels
    const { count: pixelCount } = await supabase
      .from('tracking_pixels')
      .select('*', { count: 'exact', head: true });
    report.checks.trackingPixels = {
      status: 'OK',
      count: pixelCount || 0
    };

    // Check 9: System State
    const { data: systemState } = await supabase
      .from('system_state')
      .select('*')
      .limit(1)
      .maybeSingle();
    report.checks.systemState = {
      status: 'OK',
      state: systemState?.state || 'INACTIVE'
    };

    // Overall status
    const allOk = Object.values(report.checks).every((check: any) => 
      typeof check === 'string' ? check === 'OK' : check.status === 'OK'
    );
    report.status = allOk ? 'HEALTHY' : 'ISSUES_FOUND';

    // Recommendations
    report.recommendations = [];
    if ((report.checks.products?.count || 0) === 0) {
      report.recommendations.push('No products found - run product discovery');
    }
    if ((report.checks.bridgePages?.count || 0) === 0) {
      report.recommendations.push('No bridge pages - run complete workflow');
    }
    if ((report.checks.generatedContent?.count || 0) === 0) {
      report.recommendations.push('No content generated - check content generator');
    }
    if ((report.checks.postedContent?.count || 0) === 0) {
      report.recommendations.push('No posts created - check posting system');
    }

    return res.status(200).json(report);

  } catch (error: any) {
    report.status = 'ERROR';
    report.error = error.message;
    return res.status(500).json(report);
  }
}