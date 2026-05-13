import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { simpleAutopilot } from "@/services/simpleAutopilot";

/**
 * SIMPLE EXECUTE ENDPOINT
 * Runs the simple autopilot workflow
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.authorization;
    let userId = '00000000-0000-0000-0000-000000000000'; // Test user

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }

    console.log('[Simple Execute] Starting workflow for user:', userId);

    // Run the workflow
    const results = await simpleAutopilot.runWorkflow(userId);

    return res.status(200).json({
      success: results.success,
      message: `Workflow complete: ${results.productsAdded} products, ${results.contentGenerated} content, ${results.contentPosted} posted`,
      results
    });
  } catch (error: any) {
    console.error('[Simple Execute] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}