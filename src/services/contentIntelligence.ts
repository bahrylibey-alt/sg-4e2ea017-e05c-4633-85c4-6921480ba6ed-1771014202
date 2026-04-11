import { supabase } from "@/integrations/supabase/client";

/**
 * CONTENT INTELLIGENCE FILTER
 * Scores hooks before posting - only quality content gets through
 */

interface Hook {
  text: string;
  curiosity_score: number;
  clarity_score: number;
  emotion_score: number;
  total_score: number;
}

const CURIOSITY_TRIGGERS = [
  "this made",
  "nobody is talking about",
  "tested so you don't",
  "changed everything",
  "most people don't know",
  "secret",
  "hidden",
  "discovered",
  "found out"
];

const CLARITY_WORDS = [
  "$",
  "day",
  "week",
  "month",
  "minutes",
  "hours",
  "simple",
  "easy",
  "quick"
];

const EMOTION_WORDS = [
  "amazing",
  "shocked",
  "surprised",
  "crazy",
  "insane",
  "unbelievable",
  "game-changer",
  "life-changing"
];

/**
 * Generate 3 hooks and pick the best
 */
export async function generateHooks(params: {
  productName: string;
  niche: string;
  benefit?: string;
}): Promise<Hook[]> {
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

  // Pick 3 random templates
  const shuffled = templates.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  for (const template of selected) {
    const hook = scoreHook(template);
    hooks.push(hook);
  }

  return hooks.sort((a, b) => b.total_score - a.total_score);
}

/**
 * Score a single hook
 */
function scoreHook(text: string): Hook {
  const lowerText = text.toLowerCase();

  // Curiosity score (0-40)
  let curiosityScore = 0;
  for (const trigger of CURIOSITY_TRIGGERS) {
    if (lowerText.includes(trigger)) {
      curiosityScore += 8;
    }
  }
  curiosityScore = Math.min(curiosityScore, 40);

  // Clarity score (0-30)
  let clarityScore = 0;
  for (const word of CLARITY_WORDS) {
    if (lowerText.includes(word)) {
      clarityScore += 6;
    }
  }
  clarityScore = Math.min(clarityScore, 30);

  // Emotion score (0-30)
  let emotionScore = 0;
  for (const word of EMOTION_WORDS) {
    if (lowerText.includes(word)) {
      emotionScore += 6;
    }
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
 * Generate final post from best hook
 */
export async function generateFinalPost(params: {
  hook: Hook;
  productName: string;
  affiliateUrl: string;
  platform: 'tiktok' | 'pinterest' | 'instagram';
}): Promise<string> {
  let post = params.hook.text;

  // Platform-specific formatting
  if (params.platform === 'pinterest') {
    // Pinterest: keyword-heavy, SEO-focused
    post += `\n\n✨ ${params.productName} Review & Guide\n`;
    post += `\nClick to see why this is trending →`;
  } else if (params.platform === 'tiktok') {
    // TikTok: short, punchy, emotional
    post += `\n\n→ See it here`;
    post += `\n\n#${params.productName.replace(/\s+/g, '')}`;
  } else if (params.platform === 'instagram') {
    // Instagram: storytelling, carousel-friendly
    post += `\n\nSwipe to see more →`;
    post += `\n\n💬 Would you try this?`;
  }

  return post;
}

/**
 * Humanize content (add imperfection)
 */
export function humanizeContent(text: string): string {
  // Random emoji addition (30% chance)
  if (Math.random() < 0.3) {
    const emojis = ['👀', '🔥', '✨', '💯', '🎯'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    text = `${randomEmoji} ${text}`;
  }

  // Random slight typo (10% chance) - VERY subtle
  if (Math.random() < 0.1) {
    text = text.replace('!', '!!');
  }

  return text;
}

/**
 * Track content performance
 */
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

    await supabase.from("content_performance").insert({
      content_id: params.contentId,
      user_id: user.id,
      hook_score: params.hookScore,
      curiosity_score: params.curiosityScore,
      clarity_score: params.clarityScore,
      emotion_score: params.emotionScore,
      platform_optimized: params.platformOptimized,
      humanization_applied: params.humanizationApplied,
      status: 'TESTING'
    });
  } catch (error) {
    console.error("Error tracking content performance:", error);
  }
}

/**
 * Validate content performance after 24h
 */
export async function validateContentAfter24h(contentId: string): Promise<'VALID' | 'FAILED'> {
  try {
    // Get view events for this content
    const { data: viewEvents } = await supabase
      .from("view_events")
      .select("views")
      .eq("content_id", contentId);

    const totalViews = viewEvents?.reduce((sum, v) => sum + (v.views || 0), 0) || 0;

    let status: 'VALID' | 'FAILED' = 'FAILED';

    if (totalViews >= 100) {
      status = 'VALID';
    } else if (totalViews < 50) {
      status = 'FAILED';
    }

    // Update performance status
    await supabase
      .from("content_performance")
      .update({
        status,
        views_24h: totalViews
      })
      .eq("content_id", contentId);

    return status;
  } catch (error) {
    console.error("Error validating content:", error);
    return 'FAILED';
  }
}