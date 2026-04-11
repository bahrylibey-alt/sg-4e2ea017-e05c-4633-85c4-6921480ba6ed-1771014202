import { supabase } from "@/integrations/supabase/client";

/**
 * VIRAL ENGINE v1.0
 * Pattern learning + behavioral mimicry + viral loop optimization
 */

// ==========================================
// 1. VIRAL HOOK GENERATION ENGINE
// ==========================================

interface ViralHook {
  text: string;
  pattern_type: string;
  curiosity_score: number;
  emotion_score: number;
  clarity_score: number;
  total_score: number;
}

const VIRAL_PATTERNS = {
  money: (product: string, amount?: number) => 
    `This ${product} made $${amount || 127} in ${Math.floor(Math.random() * 24) + 1} hours`,
  
  curiosity: (product: string) => 
    `Nobody is talking about this ${product}`,
  
  warning: (product: string) => 
    `Stop buying ${product} until you see this`,
  
  test: (product: string) => 
    `I tested ${product} so you don't have to`,
  
  comparison: (product: string, competitor?: string) => 
    `${product} vs ${competitor || 'Expensive Brands'} — surprising result`,
  
  secret: (product: string) => 
    `This ${product} trick is hidden on Amazon`,
  
  shock: (product: string) => 
    `I didn't expect this ${product} to work`,
  
  lazy_win: (product: string) => 
    `Made money with this ${product} doing nothing`,
  
  problem: (product: string, problem?: string) => 
    `If you struggle with ${problem || 'cooking'}, try this ${product}`,
  
  social_proof: (product: string) => 
    `Thousands are buying this ${product} right now`
};

/**
 * Generate 10 viral hooks using pattern library
 */
export async function generateViralHooks(params: {
  productName: string;
  niche: string;
  platform: 'tiktok' | 'pinterest' | 'instagram';
}): Promise<ViralHook[]> {
  const hooks: ViralHook[] = [];
  const patternKeys = Object.keys(VIRAL_PATTERNS) as Array<keyof typeof VIRAL_PATTERNS>;

  for (const patternKey of patternKeys) {
    const pattern = VIRAL_PATTERNS[patternKey] as any;
    let hookText = '';

    // Generate hook text based on pattern
    switch (patternKey) {
      case 'money':
        hookText = pattern(params.productName, Math.floor(Math.random() * 200) + 50);
        break;
      case 'comparison':
        hookText = pattern(params.productName, 'Generic Brand');
        break;
      case 'problem':
        hookText = pattern(params.productName, getNicheProblem(params.niche));
        break;
      default:
        hookText = pattern(params.productName);
    }

    // Score the hook
    const scored = scoreViralHook(hookText, patternKey);
    hooks.push(scored);
  }

  // Sort by total score
  return hooks.sort((a, b) => b.total_score - a.total_score);
}

/**
 * Score a viral hook (0-30 scale)
 */
function scoreViralHook(text: string, patternType: string): ViralHook {
  const lowerText = text.toLowerCase();

  // Curiosity score (0-10)
  let curiosityScore = 0;
  const curiosityTriggers = ['nobody', 'secret', 'hidden', 'didn\'t expect', 'surprising', 'thousands'];
  curiosityTriggers.forEach(trigger => {
    if (lowerText.includes(trigger)) curiosityScore += 3;
  });
  curiosityScore = Math.min(curiosityScore, 10);

  // Emotion score (0-10)
  let emotionScore = 0;
  const emotionTriggers = ['made $', 'shocking', 'changed everything', 'stop', 'struggle', 'doing nothing'];
  emotionTriggers.forEach(trigger => {
    if (lowerText.includes(trigger)) emotionScore += 3;
  });
  emotionScore = Math.min(emotionScore, 10);

  // Clarity score (0-10)
  let clarityScore = 0;
  const clarityMarkers = ['$', 'hours', 'days', 'vs', 'this', 'try'];
  clarityMarkers.forEach(marker => {
    if (lowerText.includes(marker)) clarityScore += 2;
  });
  clarityScore = Math.min(clarityScore, 10);

  const totalScore = curiosityScore + emotionScore + clarityScore;

  return {
    text,
    pattern_type: patternType,
    curiosity_score: curiosityScore,
    emotion_score: emotionScore,
    clarity_score: clarityScore,
    total_score: totalScore
  };
}

function getNicheProblem(niche: string): string {
  const problemMap: Record<string, string> = {
    'kitchen': 'messy cooking',
    'fitness': 'losing weight',
    'tech': 'slow devices',
    'beauty': 'skincare issues',
    'home': 'clutter'
  };
  return problemMap[niche.toLowerCase()] || 'everyday problems';
}

// ==========================================
// 2. VIRAL DNA LEARNING SYSTEM
// ==========================================

interface ContentDNA {
  hook_type: string;
  format: string;
  platform: string;
  views: number;
  clicks: number;
  ctr: number;
  status: 'WINNER' | 'DEAD' | 'TESTING';
}

/**
 * Store content DNA for learning
 */
export async function storeContentDNA(params: {
  contentId: string;
  hookType: string;
  format: string;
  platform: string;
  views: number;
  clicks: number;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ctr = params.views > 0 ? (params.clicks / params.views) * 100 : 0;
    let status: 'WINNER' | 'DEAD' | 'TESTING' = 'TESTING';

    // Learning rule
    if (ctr >= 2) {
      status = 'WINNER';
    } else if (ctr < 1 && params.views >= 200) {
      status = 'DEAD';
    }

    await supabase.from("content_dna" as any).insert({
      user_id: user.id,
      content_id: params.contentId,
      hook_type: params.hookType,
      format: params.format,
      platform: params.platform,
      views: params.views,
      clicks: params.clicks,
      ctr,
      status
    });

    console.log(`📊 DNA stored: ${params.hookType} - ${status} (CTR: ${ctr.toFixed(2)}%)`);
  } catch (error) {
    console.error("Error storing content DNA:", error);
  }
}

/**
 * Get winning patterns for cloning
 */
export async function getWinningPatterns(platform: string): Promise<ContentDNA[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("content_dna" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .eq("status", "WINNER")
      .order("ctr", { ascending: false })
      .limit(5);

    return (data as any) || [];
  } catch (error) {
    console.error("Error getting winning patterns:", error);
    return [];
  }
}

/**
 * Get blacklisted patterns to avoid
 */
export async function getBlacklistedPatterns(platform: string): Promise<string[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from("content_dna" as any)
      .select("hook_type")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .eq("status", "DEAD");

    return (data as any[])?.map((d: any) => d.hook_type) || [];
  } catch (error) {
    console.error("Error getting blacklisted patterns:", error);
    return [];
  }
}

// ==========================================
// 3. CONTENT MUTATION ENGINE
// ==========================================

/**
 * Create 5 variations of a winning hook
 */
export function mutateWinningHook(originalHook: string, patternType: string): string[] {
  const mutations: string[] = [];

  // Variation 1: Rewrite with different wording
  mutations.push(rewriteHook(originalHook));

  // Variation 2: Change tone (casual → excited)
  mutations.push(changeTone(originalHook, 'excited'));

  // Variation 3: Shorten
  mutations.push(shortenHook(originalHook));

  // Variation 4: Add emotion
  mutations.push(addEmotion(originalHook));

  // Variation 5: Change structure
  mutations.push(changeStructure(originalHook));

  return mutations;
}

function rewriteHook(hook: string): string {
  const synonyms: Record<string, string[]> = {
    'made': ['earned', 'got', 'pulled in'],
    'changed': ['transformed', 'revolutionized', 'flipped'],
    'nobody': ['most people don\'t', 'hardly anyone', 'few know'],
    'this': ['this thing', 'it', 'this product']
  };

  let rewritten = hook;
  Object.entries(synonyms).forEach(([word, replacements]) => {
    if (rewritten.toLowerCase().includes(word)) {
      const replacement = replacements[Math.floor(Math.random() * replacements.length)];
      rewritten = rewritten.replace(new RegExp(word, 'gi'), replacement);
    }
  });

  return rewritten;
}

function changeTone(hook: string, tone: 'excited' | 'casual' | 'neutral'): string {
  if (tone === 'excited') {
    return hook + ' 🤯';
  } else if (tone === 'casual') {
    return 'So... ' + hook.toLowerCase();
  }
  return hook;
}

function shortenHook(hook: string): string {
  const words = hook.split(' ');
  if (words.length > 8) {
    return words.slice(0, 8).join(' ') + '...';
  }
  return hook;
}

function addEmotion(hook: string): string {
  const emotions = ['😱', '🔥', '💯', '👀', '✨'];
  const randomEmoji = emotions[Math.floor(Math.random() * emotions.length)];
  return `${randomEmoji} ${hook}`;
}

function changeStructure(hook: string): string {
  // Question format
  if (!hook.includes('?')) {
    return hook.replace(/\.$/, '') + '?';
  }
  // Statement format
  return hook.replace(/\?$/, '.');
}

// ==========================================
// 4. HUMAN BEHAVIOR SIMULATION
// ==========================================

/**
 * Get random posting delay (30-180 minutes)
 */
export function getRandomPostingDelay(): number {
  const minDelay = 30 * 60 * 1000; // 30 min
  const maxDelay = 180 * 60 * 1000; // 180 min
  return Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);
}

/**
 * Vary content style randomly
 */
export function getRandomContentStyle(): 'casual' | 'excited' | 'neutral' {
  const styles: Array<'casual' | 'excited' | 'neutral'> = ['casual', 'excited', 'neutral'];
  return styles[Math.floor(Math.random() * styles.length)];
}

// ==========================================
// 5. PLATFORM ATTACK STRATEGY
// ==========================================

/**
 * Optimize hook for specific platform
 */
export function optimizeForPlatform(params: {
  hook: string;
  platform: 'tiktok' | 'pinterest' | 'instagram';
  productName: string;
  affiliateUrl: string;
}): string {
  let optimized = params.hook;

  if (params.platform === 'tiktok') {
    // TikTok: ultra short, emotional, fast
    optimized = shortenHook(optimized);
    optimized = addEmotion(optimized);
    optimized += '\n\n👉 Link in bio';
  } else if (params.platform === 'pinterest') {
    // Pinterest: keyword SEO, long descriptions
    optimized = `${optimized}\n\n✨ ${params.productName} Review & Guide`;
    optimized += '\n\n📌 Save this for later!';
    optimized += '\n\nClick to shop →';
  } else if (params.platform === 'instagram') {
    // Instagram: storytelling, carousel
    optimized = `${optimized}\n\n📸 Swipe to see more`;
    optimized += '\n\n💬 Would you try this?';
    optimized += '\n\n🔗 Link in bio';
  }

  return optimized;
}

// ==========================================
// 6. FIRST 1000 VIEWS STRATEGY
// ==========================================

/**
 * Evaluate post performance and decide action
 */
export async function evaluatePostPerformance(params: {
  contentId: string;
  views: number;
  hoursElapsed: number;
}): Promise<'kill' | 'duplicate' | 'monitor'> {
  // Kill if under 50 views after 6h
  if (params.hoursElapsed >= 6 && params.views < 50) {
    console.log(`❌ Kill format: ${params.views} views after 6h`);
    return 'kill';
  }

  // Kill if under 100 views after 24h
  if (params.hoursElapsed >= 24 && params.views < 100) {
    console.log(`❌ Kill format: ${params.views} views after 24h`);
    return 'kill';
  }

  // Duplicate if 500+ views
  if (params.views >= 500) {
    console.log(`🚀 Duplicate 3x: ${params.views} views`);
    return 'duplicate';
  }

  return 'monitor';
}

// ==========================================
// 7. CLICK MAXIMIZATION ENGINE
// ==========================================

/**
 * Add CTA and curiosity gap to content
 */
export function addClickMaximization(content: string, platform: string): string {
  const ctas = [
    'Link in bio 👆',
    'Check this out →',
    'See for yourself 👀',
    'Click to shop 🛒'
  ];

  const randomCta = ctas[Math.floor(Math.random() * ctas.length)];

  // Add curiosity gap
  const curiosityGaps = [
    '\n\nYou won\'t believe what happened next...',
    '\n\nThe results shocked me...',
    '\n\nWait till you see this...'
  ];

  const randomGap = curiosityGaps[Math.floor(Math.random() * curiosityGaps.length)];

  return content + randomGap + '\n\n' + randomCta;
}

// ==========================================
// 8. VIRAL LOOP SYSTEM
// ==========================================

/**
 * Execute viral loop: post → track → score → mutate → repost
 */
export async function executeViralLoop(params: {
  platform: 'tiktok' | 'pinterest' | 'instagram';
  productName: string;
  niche: string;
}): Promise<{ success: boolean; action: string }> {
  try {
    // Get winning patterns
    const winners = await getWinningPatterns(params.platform);

    if (winners.length > 0) {
      // We have winners - mutate and repost
      const topWinner = winners[0];
      console.log(`🏆 Found winner: ${topWinner.hook_type} (CTR: ${topWinner.ctr.toFixed(2)}%)`);

      // Scale pattern - this signals to increase posting frequency
      return { success: true, action: 'scale_winner' };
    } else {
      // No winners yet - test new patterns
      console.log('🧪 Testing new patterns');
      return { success: true, action: 'test_new_patterns' };
    }
  } catch (error) {
    console.error("Error executing viral loop:", error);
    return { success: false, action: 'error' };
  }
}

// ==========================================
// 9. ANTI-SUPPRESSION SYSTEM
// ==========================================

interface PostingHistory {
  last_post_time: Date;
  recent_hooks: string[];
  recent_patterns: string[];
}

const postingHistory: PostingHistory = {
  last_post_time: new Date(),
  recent_hooks: [],
  recent_patterns: []
};

/**
 * Check if posting is safe (avoid suppression)
 */
export function isPostingSafe(): { safe: boolean; reason?: string; waitMinutes?: number } {
  const now = new Date();
  const timeSinceLastPost = now.getTime() - postingHistory.last_post_time.getTime();
  const minutesSinceLastPost = timeSinceLastPost / (1000 * 60);

  // Minimum 30 min between posts
  if (minutesSinceLastPost < 30) {
    return { 
      safe: false, 
      reason: 'Too frequent - wait to avoid spam detection',
      waitMinutes: 30 - minutesSinceLastPost
    };
  }

  // Check for duplicate patterns (max 3 same pattern in recent history)
  const recentPatterns = postingHistory.recent_patterns.slice(-10);
  const patternCounts: Record<string, number> = {};
  recentPatterns.forEach(p => {
    patternCounts[p] = (patternCounts[p] || 0) + 1;
  });

  const maxRepeats = Math.max(...Object.values(patternCounts));
  if (maxRepeats >= 3) {
    return { 
      safe: false, 
      reason: 'Too many similar patterns - switch style',
      waitMinutes: 60
    };
  }

  return { safe: true };
}

/**
 * Update posting history (call after each post)
 */
export function updatePostingHistory(hook: string, patternType: string): void {
  postingHistory.last_post_time = new Date();
  postingHistory.recent_hooks.push(hook);
  postingHistory.recent_patterns.push(patternType);

  // Keep only last 20 entries
  if (postingHistory.recent_hooks.length > 20) {
    postingHistory.recent_hooks.shift();
    postingHistory.recent_patterns.shift();
  }
}

/**
 * Handle suppression detection
 */
export async function handleSuppressionDetected(): Promise<void> {
  console.log('⚠️ Suppression detected - pausing for 6-12 hours');
  
  // Log safety intervention
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("autopilot_safety_log").insert({
      user_id: user.id,
      action: 'suppression_pause',
      reason: 'Platform suppression detected - pausing to reset',
      metadata: { pause_duration_hours: 6 }
    });
  }
}

// ==========================================
// 10. SCALE ENGINE
// ==========================================

/**
 * Determine if content should scale
 */
export function shouldScale(params: {
  views: number;
  ctr: number;
}): { scale: boolean; frequency_multiplier: number } {
  if (params.views > 1000 && params.ctr >= 2) {
    console.log('🚀 SCALE TRIGGER: 1000+ views, 2%+ CTR');
    return { scale: true, frequency_multiplier: 2 };
  }

  return { scale: false, frequency_multiplier: 1 };
}

/**
 * Execute scaling actions
 */
export async function executeScaling(params: {
  contentId: string;
  platform: string;
  hookType: string;
}): Promise<void> {
  console.log(`📈 Scaling content: ${params.hookType} on ${params.platform}`);

  // Mark for cloning
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("autopilot_decisions").insert({
      user_id: user.id,
      entity_type: 'content',
      entity_id: params.contentId,
      decision_type: 'scale',
      reason: 'High performance: 1000+ views, 2%+ CTR',
      metrics: { 
        action: 'double_frequency',
        expand_platform: true
      }
    });
  }
}