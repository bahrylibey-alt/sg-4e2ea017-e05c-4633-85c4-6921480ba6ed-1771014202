import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { action, user_id } = req.body;

    if (!action || !user_id) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "action and user_id are required" 
      });
    }

    console.log(`🤖 Triggering autopilot: ${action} for user ${user_id}`);

    // Get user session for authorization
    const { data: { session } } = await supabase.auth.getSession();
    
    // Call the edge function with proper authorization
    const { data, error } = await supabase.functions.invoke('autopilot-engine', {
      body: { action, user_id },
      headers: session ? {
        Authorization: `Bearer ${session.access_token}`
      } : {}
    });

    if (error) {
      console.error('❌ Edge function error:', error);
      return res.status(500).json({ 
        error: error.message,
        details: error
      });
    }

    console.log('✅ Edge function response:', data);

    return res.status(200).json({
      success: true,
      ...data
    });

  } catch (error: any) {
    console.error('❌ API Error:', error);
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
}