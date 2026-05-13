import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";
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
    // Create Supabase client with request cookies for proper authentication
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    });

    // Get authenticated user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[Simple Execute] Auth check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      authError: authError?.message 
    });

    let userId = user?.id;
    
    if (!userId) {
      // Try to get any user as fallback for testing
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      if (profiles && profiles.length > 0) {
        userId = profiles[0].id;
        console.log('[Simple Execute] Using fallback user:', userId);
      } else {
        return res.status(401).json({ 
          success: false,
          error: 'No authenticated user found. Please log in first.' 
        });
      }
    }

    console.log('[Simple Execute] Starting workflow for user:', userId);

    // Run the workflow
    const results = await simpleAutopilot.runWorkflow(userId);

    console.log('[Simple Execute] Workflow complete:', results);

    return res.status(200).json({
      success: results.success,
      message: `Workflow complete: ${results.productsAdded} products, ${results.contentGenerated} content, ${results.contentPosted} posted`,
      results,
      userId // Include userId in response for debugging
    });
  } catch (error: any) {
    console.error('[Simple Execute] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}