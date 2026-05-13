import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";
import { simpleAutopilot } from "@/services/simpleAutopilot";

/**
 * SIMPLE EXECUTE - Actually runs the workflow
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please log in to run the autopilot'
      });
    }

    console.log('[Simple Execute] Starting for user:', user.id);

    // Run workflow
    const results = await simpleAutopilot.runWorkflow(user.id);

    return res.status(200).json({
      success: results.success,
      results,
      message: results.success 
        ? `Workflow complete! Added ${results.productsAdded} products, generated ${results.contentGenerated} content, posted ${results.contentPosted} pieces`
        : 'Workflow encountered errors'
    });

  } catch (error: any) {
    console.error('[Simple Execute] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}