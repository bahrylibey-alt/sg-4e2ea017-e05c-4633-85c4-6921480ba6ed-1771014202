import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * Test endpoint to manually trigger autopilot and verify Zapier integration
 * GET /api/test-autopilot
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🧪 Testing autopilot → Zapier integration...");

    // Get the user (in production, this would come from session)
    const userId = "cd9e03a2-9620-44be-a934-ac2ed69db465";

    // Call the autopilot edge function
    const { data, error } = await supabase.functions.invoke('autopilot-engine', {
      body: { userId }
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return res.status(500).json({ 
        success: false,
        error: error.message,
        details: error
      });
    }

    console.log('✅ Autopilot executed:', data);

    // Check the latest autopilot log
    const { data: logData } = await supabase
      .from('autopilot_cron_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return res.status(200).json({
      success: true,
      message: "Autopilot triggered successfully!",
      results: data?.results || data,
      lastLog: logData,
      webhooksSent: data?.results?.webhooks_sent || 0,
      zapierUrl: "https://hooks.zapier.com/hooks/catch/27089231/u7q2xax/"
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message,
      stack: error.stack 
    });
  }
}