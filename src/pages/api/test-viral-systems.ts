import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/integrations/supabase/client";

/**
 * TEST ALL VIRAL SYSTEMS
 * Tests referral, social sharing, content multiplier, email capture
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const results: any = {
    timestamp: new Date().toISOString(),
    systems: {}
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || 'test-user';

    // Test 1: Viral Mechanics Table
    const { data: viralMechanics, error: viralError } = await supabase
      .from('viral_mechanics')
      .select('*');
    
    results.systems.viralMechanics = {
      status: viralError ? 'FAILED' : 'OK',
      count: viralMechanics?.length || 0,
      data: viralMechanics || [],
      error: viralError?.message
    };

    // Test 2: Lead Captures
    const { data: leadCaptures, error: leadError } = await supabase
      .from('lead_captures')
      .select('*');
    
    results.systems.leadCaptures = {
      status: leadError ? 'FAILED' : 'OK',
      count: leadCaptures?.length || 0,
      data: leadCaptures || [],
      error: leadError?.message
    };

    // Test 3: Email Sequences
    const { data: emailSeqs, error: emailError } = await supabase
      .from('email_sequences')
      .select('*');
    
    results.systems.emailSequences = {
      status: emailError ? 'FAILED' : 'OK',
      count: emailSeqs?.length || 0,
      data: emailSeqs || [],
      error: emailError?.message
    };

    // Test 4: Social Sharing
    const { data: posts, error: postError } = await supabase
      .from('posted_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    results.systems.socialSharing = {
      status: postError ? 'FAILED' : 'OK',
      recentPosts: posts?.length || 0,
      data: posts || [],
      error: postError?.message
    };

    // Test 5: Content Multiplier
    const { data: genContent, error: genError } = await supabase
      .from('generated_content')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    results.systems.contentMultiplier = {
      status: genError ? 'FAILED' : 'OK',
      recentContent: genContent?.length || 0,
      data: genContent || [],
      error: genError?.message
    };

    // Overall Status
    const allOk = Object.values(results.systems).every((sys: any) => sys.status === 'OK');
    results.overallStatus = allOk ? 'ALL_SYSTEMS_OPERATIONAL' : 'SOME_SYSTEMS_FAILED';

    return res.status(200).json(results);

  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      results
    });
  }
}