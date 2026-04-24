import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check ALL tables for existing data
    const tables = [
      'generated_content',
      'product_catalog',
      'affiliate_links',
      'posted_content',
      'click_events',
      'commissions',
      'campaigns',
      'profiles'
    ];

    const results: Record<string, any> = {};

    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(10);

      results[table] = {
        count: count || 0,
        error: error?.message || null,
        sample_data: data || [],
        has_data: (count || 0) > 0
      };
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
      summary: {
        total_tables_checked: tables.length,
        tables_with_data: Object.values(results).filter((r: any) => r.has_data).length,
        tables_empty: Object.values(results).filter((r: any) => !r.has_data).length
      }
    });
  } catch (error: unknown) {
    console.error("Diagnostic error:", error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    });
  }
}