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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: "Missing required fields",
        message: "userId is required" 
      });
    }

    console.log(`🤖 Triggering autopilot for user ${userId}`);

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('autopilot-engine', {
      body: { userId }
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