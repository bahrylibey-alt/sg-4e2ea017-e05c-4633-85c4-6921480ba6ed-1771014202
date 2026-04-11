import { supabase } from "@/integrations/supabase/client";
import { 
  generateViralHooks, 
  storeContentDNA, 
  getWinningPatterns,
  getBlacklistedPatterns,
  mutateWinningHook,
  optimizeForPlatform,
  addClickMaximization
} from "./viralEngine";

/**
 * CONTENT INTELLIGENCE FILTER v2.0
 * Integrated with Viral Engine for pattern learning
 */

interface Hook {
  text: string;
  curiosity_score: number;
  clarity_score: number;
  emotion_score: number;
  total_score: number;
}

/**
 * Generate hooks using viral engine (10 patterns) or fallback to basic
 */
export async function generateHooks(params: {
  productName: string;
  niche: string;
  benefit?: string;
  platform?: 'tiktok' | 'pinterest' | 'instagram';
}): Promise<Hook[]> {
  const platform = params.platform || 'tiktok';
  
  // Try to get viral hooks first
  try {
    const viralHooks = await generateViralHooks({
      productName: params.productName,
      niche: params.niche,
      platform
    });

    // Get blacklisted patterns to filter out
    const blacklisted = await getBlacklistedPatterns(platform);

    // Filter out blacklisted patterns and convert to Hook format
    const validHooks = viralHooks
      .filter(vh => !blacklisted.includes(vh.pattern_type))
      .map(vh => ({
        text: vh.text,
        curiosity_score: vh.curiosity_score,
        clarity_score: vh.clarity_score,
        emotion_score: vh.emotion_score,
        total_score: vh.total_score
      }));

    if (validHooks.length > 0) {
      console.log(`🎯 Generated ${validHooks.length} viral hooks (filtered blacklist)`);
      return validHooks;
    }
  } catch (error) {
    console.error("Error generating viral hooks, using fallback:", error);
  }

  // Fallback to basic hook generation if viral engine fails
  const hooks: Hook[] = [];
  const templates = [
    `This ${params.productName} made me $127 in 1 day`,
    `Nobody is talking about this ${params.niche} product`,
    `I tested ${params.productName} so you don't waste money`,
    `This ${params.productName} changed everything for ${params.benefit || 'me'}`,
    `Most people don't know about ${params.productName}`,
    `The secret to ${params.benefit || 'success'} (it's this ${params.productName})`,
    `Hidden gem: ${params.productName} is underrated`,
    `I discovered ${params.productName} and it's crazy good`
  ];

  const shuffled = templates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  for (const template of selected) {
    const hook = scoreHook(template);
    hooks.push(hook);
  }

  return hooks.sort((a, b) => b.total_score - a.total_score);
}

function scoreHook(text: string): Hook {
  const lowerText = text.toLowerCase();

  const CURIOSITY_TRIGGERS = [
    "this made", "nobody is talking about", "tested so you don't",
    "changed everything", "most people don't know", "secret",
    "hidden", "discovered", "found out"
  ];

  const CLARITY_WORDS = [
    "$", "day", "week", "month", "minutes", "hours",
    "simple", "easy", "quick"
  ];

  const EMOTION_WORDS = [
    "amazing", "shocked", "surprised", "crazy", "insane",
    "unbelievable", "game-changer", "life-changing"
  ];

  let curiosityScore = 0;
  for (const trigger of CURIOSITY_TRIGGERS) {
    if (lowerText.includes(trigger)) curiosityScore += 8;
  }
  curiosityScore = Math.min(curiosityScore, 40);

  let clarityScore = 0;
  for (const word of CLARITY_WORDS) {
    if (lowerText.includes(word)) clarityScore += 6;
  }
  clarityScore = Math.min(clarityScore, 30);

  let emotionScore = 0;
  for (const word of EMOTION_WORDS) {
    if (lowerText.includes(word)) emotionScore += 6;
  }
  emotionScore = Math.min(emotionScore, 30);

  const totalScore = curiosityScore + clarityScore + emotionScore;

  return {
    text,
    curiosity_score: curiosityScore,
    clarity_score: clarityScore,
    emotion_score: emotionScore,
    total_score: totalScore
  };
}

/**
 * Generate final post using viral engine optimization
 */
export async function generateFinalPost(params: {
  hook: Hook;
  productName: string;
  affiliateUrl: string;
  platform: 'tiktok' | 'pinterest' | 'instagram';
}): Promise<string> {
  // Optimize hook for platform
  let optimized = optimizeForPlatform({
    hook: params.hook.text,
    platform: params.platform,
    productName: params.productName,
    affiliateUrl: params.affiliateUrl
  });

  // Add click maximization
  optimized = addClickMaximization(optimized, params.platform);

  return optimized;
}

export function humanizeContent(text: string): string {
  if (Math.random() < 0.3) {
    const emojis = ['👀', '🔥', '✨', '💯', '🎯'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    text = `${randomEmoji} ${text}`;
  }

  if (Math.random() < 0.1) {
    text = text.replace('!', '!!');
  }

  return text;
}

export async function trackContentPerformance(params: {
  contentId: string;
  hookScore: number;
  curiosityScore: number;
  clarityScore: number;
  emotionScore: number;
  platformOptimized: boolean;
  humanizationApplied: boolean;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("content_performance_tracking" as any).insert({
      content_id: params.contentId,
      user_id: user.id,
      hook_score: params.hookScore,
      curiosity_score: params.curiosityScore,
      clarity_score: params.clarityScore,
      emotion_score: params.emotionScore,
      platform_optimized: params.platformOptimized,
      humanization_applied: params.humanizationApplied,
      validation_status: 'TESTING'
    });
  } catch (error) {
    console.error("Error tracking content performance:", error);
  }
}

export async function validateContentAfter24h(contentId: string): Promise<'VALID' | 'FAILED'> {
  try {
    const { data: viewEvents } = await supabase
      .from("view_events" as any)
      .select("views")
      .eq("content_id", contentId);

    const totalViews = viewEvents?.reduce((sum: number, v: any) => sum + (v.views || 0), 0) || 0;

    let status: 'VALID' | 'FAILED' = 'FAILED';

    if (totalViews >= 100) {
      status = 'VALID';
    } else if (totalViews < 50) {
      status = 'FAILED';
    }

    await supabase
      .from("content_performance_tracking" as any)
      .update({
        validation_status: status
      })
      .eq("content_id", contentId);

    return status;
  } catch (error) {
    console.error("Error validating content:", error);
    return 'FAILED';
  }
}

// Re-export viral engine functions for easy access
export { 
  storeContentDNA, 
  getWinningPatterns, 
  mutateWinningHook,
  evaluatePostPerformance,
  executeViralLoop,
  isPostingSafe,
  updatePostingHistory,
  shouldScale,
  executeScaling,
  getRandomPostingDelay
} from "./viralEngine";
