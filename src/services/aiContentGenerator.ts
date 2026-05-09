import { supabase } from "@/integrations/supabase/client";

/**
 * AI CONTENT GENERATOR FOR SOCIAL MEDIA
 * Automatically writes engaging posts for trending products
 * Platform-specific optimization (TikTok, Instagram, Pinterest, Twitter, etc.)
 */

interface ProductData {
  id: string;
  name: string;
  price: number;
  category: string;
  affiliate_url: string;
  image_url?: string;
}

interface GeneratedPost {
  platform: string;
  caption: string;
  hashtags: string[];
  cta: string;
  hook: string;
  emoji_count: number;
  character_count: number;
  estimated_engagement: number;
}

export const aiContentGenerator = {

  /**
   * Generate platform-specific social media post
   */
  async generatePost(
    product: ProductData,
    platform: 'tiktok' | 'instagram' | 'pinterest' | 'twitter' | 'facebook' | 'linkedin',
    tone: 'casual' | 'professional' | 'enthusiastic' | 'educational' = 'casual'
  ): Promise<GeneratedPost> {
    
    console.log(`🤖 Generating ${platform} post for: ${product.name}`);

    // Platform-specific templates and rules
    const platformRules = {
      tiktok: {
        maxLength: 2200,
        hashtagCount: 5,
        emojiDensity: 'high',
        hookStyle: 'shock-value',
        cta: 'Link in bio! 👆'
      },
      instagram: {
        maxLength: 2200,
        hashtagCount: 10,
        emojiDensity: 'medium',
        hookStyle: 'aspirational',
        cta: 'Link in bio to shop! ✨'
      },
      pinterest: {
        maxLength: 500,
        hashtagCount: 5,
        emojiDensity: 'low',
        hookStyle: 'informative',
        cta: 'Click to learn more →'
      },
      twitter: {
        maxLength: 280,
        hashtagCount: 3,
        emojiDensity: 'medium',
        hookStyle: 'provocative',
        cta: 'Details below 🧵'
      },
      facebook: {
        maxLength: 500,
        hashtagCount: 3,
        emojiDensity: 'medium',
        hookStyle: 'story-driven',
        cta: 'See more in comments!'
      },
      linkedin: {
        maxLength: 1300,
        hashtagCount: 5,
        emojiDensity: 'low',
        hookStyle: 'professional-insight',
        cta: 'Learn more in the comments'
      }
    };

    const rules = platformRules[platform];

    // Generate hook (attention-grabbing opening)
    const hook = this.generateHook(product, rules.hookStyle);

    // Generate main caption
    const caption = this.generateCaption(product, platform, tone, rules.maxLength);

    // Generate hashtags
    const hashtags = this.generateHashtags(product, platform, rules.hashtagCount);

    // Emoji optimization
    const emojiCount = this.countEmojis(caption);

    // Calculate estimated engagement score
    const estimatedEngagement = this.calculateEngagementScore(caption, hashtags, platform);

    return {
      platform,
      caption,
      hashtags,
      cta: rules.cta,
      hook,
      emoji_count: emojiCount,
      character_count: caption.length,
      estimated_engagement: estimatedEngagement
    };
  },

  /**
   * Generate attention-grabbing hook
   */
  generateHook(product: ProductData, style: string): string {
    const productName = product.name.split(' ').slice(0, 3).join(' ');
    
    const hooks: Record<string, string[]> = {
      'shock-value': [
        `I can't believe this ${product.category} is only $${product.price}! 😱`,
        `This ${productName} just changed EVERYTHING 🤯`,
        `Wait... this actually works?? (${productName}) 🔥`,
        `POV: You found the perfect ${product.category} ✨`
      ],
      'aspirational': [
        `Upgrade your ${product.category} game with this 💎`,
        `The ${productName} you've been waiting for ✨`,
        `Treating yourself to quality: ${productName} 🌟`,
        `This ${product.category} is giving luxury vibes 🤍`
      ],
      'informative': [
        `Here's why everyone loves this ${product.category} 👇`,
        `${productName} - Everything you need to know`,
        `The complete guide to choosing ${product.category}`,
        `Product spotlight: ${productName}`
      ],
      'provocative': [
        `Hot take: This ${product.category} is worth every penny`,
        `Why ${productName} is trending right now`,
        `Everyone's buying this ${product.category} and here's why`,
        `The ${productName} debate: Worth it?`
      ],
      'story-driven': [
        `I tried the ${productName} for 30 days...`,
        `My experience with this ${product.category}`,
        `How ${productName} changed my daily routine`,
        `A week with the ${product.category} everyone's talking about`
      ],
      'professional-insight': [
        `Industry perspective: Why ${product.category} matters`,
        `The ROI of quality: ${productName}`,
        `Market analysis: ${product.category} trends`,
        `Professional review: ${productName}`
      ]
    };

    const styleHooks = hooks[style] || hooks['casual'];
    return styleHooks[Math.floor(Math.random() * styleHooks.length)];
  },

  /**
   * Generate full caption with product benefits
   */
  generateCaption(product: ProductData, platform: string, tone: string, maxLength: number): string {
    const benefits = this.extractBenefits(product.name);
    const pricePoint = this.getPricePointMessage(product.price);
    
    let caption = `${this.generateHook(product, 'aspirational')}\n\n`;
    
    // Add benefits
    if (benefits.length > 0) {
      caption += benefits.slice(0, 3).map(b => `✨ ${b}`).join('\n') + '\n\n';
    }

    // Add price point
    caption += `${pricePoint}\n\n`;

    // Add call to action
    if (platform === 'tiktok' || platform === 'instagram') {
      caption += `Tap the link in bio to get yours! 👆\n\n`;
    } else if (platform === 'pinterest') {
      caption += `Click to shop now →\n\n`;
    }

    // Trim if too long
    if (caption.length > maxLength) {
      caption = caption.substring(0, maxLength - 3) + '...';
    }

    return caption;
  },

  /**
   * Extract product benefits from name
   */
  extractBenefits(productName: string): string[] {
    const benefits: string[] = [];
    
    if (productName.toLowerCase().includes('wireless')) benefits.push('No tangled wires');
    if (productName.toLowerCase().includes('portable')) benefits.push('Take it anywhere');
    if (productName.toLowerCase().includes('rechargeable')) benefits.push('Save on batteries');
    if (productName.toLowerCase().includes('smart')) benefits.push('Intelligent features');
    if (productName.toLowerCase().includes('waterproof')) benefits.push('Water resistant');
    if (productName.toLowerCase().includes('adjustable')) benefits.push('Customizable fit');
    if (productName.toLowerCase().includes('premium')) benefits.push('High-quality materials');
    if (productName.toLowerCase().includes('fast')) benefits.push('Quick performance');
    
    return benefits.length > 0 ? benefits : ['Great value', 'Highly rated', 'Customer favorite'];
  },

  /**
   * Get price point messaging
   */
  getPricePointMessage(price: number): string {
    if (price < 20) return `💰 Under $20!`;
    if (price < 50) return `💰 Great value at $${price}`;
    if (price < 100) return `💎 Premium quality for $${price}`;
    return `🌟 Investment piece at $${price}`;
  },

  /**
   * Generate relevant hashtags
   */
  generateHashtags(product: ProductData, platform: string, count: number): string[] {
    const category = product.category?.toLowerCase() || 'product';
    const price = product.price;
    
    const baseHashtags = [
      '#TrendingNow',
      '#MustHave',
      '#ProductReview',
      '#AmazonFinds',
      '#ShopSmart'
    ];

    const categoryHashtags: Record<string, string[]> = {
      'electronics': ['#TechGadgets', '#GadgetLovers', '#TechEssentials'],
      'fitness': ['#FitnessGear', '#WorkoutEssentials', '#FitnessMotivation'],
      'beauty': ['#BeautyEssentials', '#SkinCare', '#BeautyHacks'],
      'home': ['#HomeDecor', '#HomeEssentials', '#InteriorDesign'],
      'kitchen': ['#KitchenGadgets', '#CookingTools', '#KitchenEssentials'],
      'outdoor': ['#OutdoorGear', '#AdventureEssentials', '#ExploreMore']
    };

    const platformHashtags: Record<string, string[]> = {
      'tiktok': ['#TikTokMadeMeBuyIt', '#TikTokShop', '#ViralProducts'],
      'instagram': ['#InstaShop', '#ShopLocal', '#IGShopping'],
      'pinterest': ['#PinToShop', '#ShopTheLook', '#PinterestFinds']
    };

    let hashtags = [...baseHashtags];
    
    // Add category hashtags
    for (const [key, tags] of Object.entries(categoryHashtags)) {
      if (category.includes(key)) {
        hashtags.push(...tags);
      }
    }

    // Add platform-specific
    if (platformHashtags[platform]) {
      hashtags.push(...platformHashtags[platform]);
    }

    // Add price-based
    if (price < 25) hashtags.push('#AffordableLuxury', '#BudgetFriendly');
    if (price > 100) hashtags.push('#LuxuryItems', '#PremiumQuality');

    // Deduplicate and limit
    hashtags = Array.from(new Set(hashtags));
    return hashtags.slice(0, count);
  },

  /**
   * Count emojis in text
   */
  countEmojis(text: string): number {
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    return (text.match(emojiRegex) || []).length;
  },

  /**
   * Calculate estimated engagement score
   */
  calculateEngagementScore(caption: string, hashtags: string[], platform: string): number {
    let score = 50; // Base score

    // Length optimization
    const optimalLengths: Record<string, [number, number]> = {
      'tiktok': [100, 300],
      'instagram': [138, 400],
      'twitter': [71, 100],
      'pinterest': [100, 200]
    };

    const optimal = optimalLengths[platform] || [100, 300];
    if (caption.length >= optimal[0] && caption.length <= optimal[1]) {
      score += 15;
    }

    // Hashtag count
    if (hashtags.length >= 3 && hashtags.length <= 10) {
      score += 10;
    }

    // Emoji presence
    const emojiCount = this.countEmojis(caption);
    if (emojiCount > 0 && emojiCount < 10) {
      score += 10;
    }

    // Has call to action
    if (caption.toLowerCase().includes('link') || caption.toLowerCase().includes('shop')) {
      score += 10;
    }

    // Has question
    if (caption.includes('?')) {
      score += 5;
    }

    return Math.min(100, score);
  },

  /**
   * Generate multiple posts for a product across all platforms
   */
  async generateAllPlatforms(product: ProductData, userId: string): Promise<GeneratedPost[]> {
    const platforms: Array<'tiktok' | 'instagram' | 'pinterest' | 'twitter' | 'facebook' | 'linkedin'> = [
      'tiktok',
      'instagram',
      'pinterest',
      'twitter',
      'facebook',
      'linkedin'
    ];

    const posts: GeneratedPost[] = [];

    for (const platform of platforms) {
      const post = await this.generatePost(product, platform);
      posts.push(post);

      // Save to database
      await supabase.from('generated_content').insert({
        user_id: userId,
        title: `${platform} - ${product.name}`,
        body: post.caption,
        description: post.hashtags.join(' '),
        type: 'social',
        category: platform,
        status: 'draft'
      });
    }

    console.log(`✅ Generated ${posts.length} posts for ${product.name}`);
    return posts;
  },

  /**
   * Batch generate content for multiple products
   */
  async generateBatchContent(userId: string, limit: number = 10): Promise<{
    total_products: number;
    total_posts: number;
    posts_per_product: number;
  }> {
    console.log(`🚀 Batch generating content for top ${limit} products...`);

    // Get top products
    const { data: products } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(limit);

    if (!products || products.length === 0) {
      throw new Error('No products found');
    }

    let totalPosts = 0;

    for (const product of products) {
      const posts = await this.generateAllPlatforms(product, userId);
      totalPosts += posts.length;
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'content_generation',
      status: 'success',
      details: `Generated ${totalPosts} social media posts for ${products.length} products`,
      metadata: { products: products.length, posts: totalPosts }
    });

    return {
      total_products: products.length,
      total_posts: totalPosts,
      posts_per_product: 6
    };
  }
};