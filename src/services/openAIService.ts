import { supabase } from "@/integrations/supabase/client";

interface ProductSuggestion {
  name: string;
  category: string;
  trend_score: number;
  why_trending: string;
  target_audience: string;
  affiliate_potential: "high" | "medium" | "low";
  price_range: string;
  estimated_price: number;
  amazon_url: string;
  aliexpress_url: string;
  amazon_search_term: string;
  aliexpress_search_term: string;
  current_trend_data: string;
}

interface ContentGeneration {
  title: string;
  body: string;
  meta_description: string;
  seo_keywords: string[];
  target_audience: string;
}

interface SocialPost {
  platform: "reddit" | "twitter" | "linkedin" | "medium" | "pinterest" | "tiktok" | "facebook" | "instagram";
  content: string;
  hashtags: string[];
  title?: string;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey?: string) {
    // Check localStorage for API key (browser only)
    if (typeof window !== 'undefined') {
      this.apiKey = apiKey || localStorage.getItem('openai_api_key') || "";
    } else {
      this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
    }
  }

  private async makeRequest(endpoint: string, body: any) {
    if (!this.apiKey) {
      throw new Error("OpenAI API key is required. Add your key in Settings → API Keys to enable real AI discovery and content generation.");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.statusText} - ${error}`);
    }

    return response.json();
  }

  async discoverTrendingProducts(niche: string, count: number = 5): Promise<ProductSuggestion[]> {
    const currentDate = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();
    
    const prompt = `You are a professional trend analyst with access to real-time market data for ${currentYear}.

CRITICAL: You MUST find REAL, CURRENTLY TRENDING products that people can buy TODAY on Amazon or AliExpress.

Find ${count} REAL trending products in the "${niche}" niche that are:
1. Actually available for purchase right now
2. Have verifiable social media buzz or news coverage
3. Are trending in ${currentYear} (not old products from 2024-2025)
4. Perfect for affiliate marketing (high commission potential)
5. Have REAL Amazon or AliExpress product pages

For each product, provide:
1. EXACT product name (as it appears on the marketplace)
2. Category
3. Trend score (1-100) based on CURRENT data (Google Trends, social mentions, sales rank)
4. Why it's trending RIGHT NOW (specific events, viral moments, influencer mentions)
5. Target audience (be specific)
6. Affiliate potential (high/medium/low)
7. Price range (e.g., "$50-$100")
8. Estimated exact price
9. Real Amazon URL with affiliate tag placeholder: https://amazon.com/dp/[ASIN]?tag=YOURTAG-20
10. Real AliExpress product URL if available
11. EXACT search term that will find this product on Amazon
12. EXACT search term for AliExpress
13. Current trend data with SPECIFIC metrics (Google Trends %, TikTok views, Reddit mentions, etc.)

VALIDATION RULES:
- Product MUST be released or trending in ${currentYear}
- Must have REAL social proof (cite specific numbers: "50M TikTok views", "5K Reddit upvotes")
- Amazon URL must be valid format with real ASIN
- Price must be reasonable and market-accurate
- Trend data must include SPECIFIC METRICS, not vague claims

Return as JSON array with this EXACT structure:
{
  "products": [
    {
      "name": "Exact Product Name Here (Brand + Model)",
      "category": "Specific Category",
      "trend_score": 95,
      "why_trending": "Went viral on TikTok with 50M views in March 2026 after influencer @techguru reviewed it. Featured in WSJ tech section.",
      "target_audience": "Tech enthusiasts aged 25-40, early adopters, smart home users",
      "affiliate_potential": "high",
      "price_range": "$80-$150",
      "estimated_price": 129.99,
      "amazon_url": "https://amazon.com/dp/B0ABC12345?tag=YOURTAG-20",
      "aliexpress_url": "https://aliexpress.com/item/1234567890.html",
      "amazon_search_term": "brand model year smart device",
      "aliexpress_search_term": "smart device brand model",
      "current_trend_data": "Google Trends: +320% spike (March 2026), TikTok: 50M views #smarttech, Reddit: 8.5K upvotes r/gadgets, Amazon Best Seller Rank: #3 in category"
    }
  ]
}

IMPORTANT: Every product MUST have REAL, VERIFIABLE data. No generic examples.`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a professional market analyst specializing in identifying trending products for ${currentYear}. You ONLY suggest products with REAL, verifiable trend data and actual marketplace availability. You provide specific metrics and cite sources.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      
      if (!parsed.products || parsed.products.length === 0) {
        throw new Error("OpenAI did not return any products. Try a different niche or check your API key.");
      }

      return parsed.products;
    } catch (error: any) {
      console.error('OpenAI product discovery error:', error);
      throw new Error(`Failed to discover trending products: ${error.message}. Make sure your OpenAI API key is valid and has credits.`);
    }
  }

  async generateSEOContent(productName: string, category: string, description: string, affiliateLink: string): Promise<ContentGeneration> {
    const currentYear = new Date().getFullYear();
    
    const prompt = `Write a comprehensive, authentic affiliate marketing article about "${productName}" for ${currentYear}.

Product Details:
- Name: ${productName}
- Category: ${category}
- Description: ${description}
- Affiliate Link: ${affiliateLink}
- Year: ${currentYear}

WRITING REQUIREMENTS:
1. NATURAL TONE: Write like a real person sharing a genuine recommendation (not robotic or salesy)
2. AUTHENTIC VOICE: Use conversational language, personal insights, real experiences
3. LENGTH: 800-1200 words of valuable, engaging content
4. STRUCTURE: 
   - Compelling intro that hooks the reader
   - Personal story or relatable scenario
   - Detailed product analysis (features, benefits, use cases)
   - Honest pros and cons
   - Real-world comparisons with ${currentYear} alternatives
   - Specific use cases and examples
   - Natural call-to-action (not pushy)
5. SEO OPTIMIZATION:
   - Natural keyword placement (not forced)
   - Header hierarchy (H2, H3)
   - Scannable with bullet points
   - Internal linking opportunities
6. AFFILIATE LINK:
   - Include ${affiliateLink} naturally 2-3 times in context
   - Don't make it feel like an ad
   - Provide value first, link second

TONE: Helpful, genuine, knowledgeable, enthusiastic but balanced

Return as JSON with this structure:
{
  "title": "Engaging Title That Mentions ${currentYear} (under 60 chars)",
  "body": "Full article in Markdown with natural flow, personal insights, and genuine recommendations...",
  "meta_description": "Compelling description that makes people want to click (under 160 chars)",
  "seo_keywords": ["natural", "keyword", "phrases"],
  "target_audience": "Specific audience description"
}`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are an expert content writer who creates authentic, helpful affiliate marketing articles. You write like a real person sharing genuine recommendations, not a robot or salesperson. Your content is valuable, engaging, and optimized for ${currentYear} SEO trends.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error: any) {
      console.error('OpenAI content generation error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateSocialPosts(productName: string, category: string, description: string, affiliateLink: string): Promise<SocialPost[]> {
    const currentYear = new Date().getFullYear();
    
    const prompt = `Create AUTHENTIC, NATURAL social media posts for "${productName}" in ${currentYear}.

Product: ${productName}
Category: ${category}
Description: ${description}
Link: ${affiliateLink}

CRITICAL REQUIREMENTS - READ CAREFULLY:
1. NATURAL LANGUAGE: Write like a real person excited to share something cool (NOT robotic marketing speak)
2. PLATFORM-SPECIFIC: Each platform has a unique voice and style
3. NO EMOJIS OVERLOAD: Use 1-2 relevant emojis max, or none
4. NO GENERIC PHRASES: Avoid "game-changer", "revolutionary", "must-have" unless genuinely appropriate
5. AUTHENTIC EXCITEMENT: Sound genuinely enthusiastic, not fake-salesy
6. INCLUDE LINK NATURALLY: Work in ${affiliateLink} without making it feel like spam

PLATFORM GUIDELINES:

**Pinterest:**
- Natural, benefit-focused description
- Keywords for discovery
- Helpful, not salesy
Example: "This solved my [problem] instantly. Perfect for [use case]. [Benefit 1] + [Benefit 2]. Full review: [link]"

**TikTok:**
- Conversational, casual, friendly
- Hook in first 5 words
- Relatable scenario
Example: "Okay so I've been using this for 3 weeks and wow. [Specific result]. If you [relatable situation], you need this. Link below"

**Twitter/X:**
- Concise, informative, valuable
- Thread-starter format
- Engaging without being clickbait
Example: "Just tested ${productName} for 2 weeks. Here's what actually happened: [specific result]. Thread 🧵 [link]"

**Instagram:**
- Visual storytelling
- Personal experience
- Genuine recommendation
Example: "Didn't think I needed this until I tried it. Now I use it daily for [specific use]. Life's easier when [benefit]. Check it out: [link]"

**Facebook:**
- Longer, more detailed
- Personal story or review
- Community-focused
Example: "Anyone else struggle with [problem]? Found this solution and it's been a game-changer. Here's my honest experience after [time period]... [link]"

Create 5 posts (Pinterest, TikTok, Twitter, Instagram, Facebook) that sound GENUINELY HUMAN.

Return as JSON:
{
  "posts": [
    {
      "platform": "pinterest",
      "content": "Natural, helpful post content...",
      "hashtags": ["relevant", "searchable", "tags"],
      "title": "Pin title (for Pinterest)"
    }
  ]
}`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a social media expert who creates authentic, engaging posts that sound like real people sharing genuine recommendations. You NEVER use robotic marketing language. You write naturally, enthusiastically, and helpfully for ${currentYear} audiences.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.9,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed.posts || [];
    } catch (error: any) {
      console.error('OpenAI social posts error:', error);
      throw new Error(`Failed to generate social posts: ${error.message}`);
    }
  }

  async optimizeSEO(content: { title: string; body: string }): Promise<{ title: string; meta_description: string; keywords: string[] }> {
    const currentYear = new Date().getFullYear();
    
    const prompt = `Optimize this content for ${currentYear} SEO best practices:

Title: ${content.title}
Content: ${content.body.substring(0, 500)}...

Provide:
- Optimized title (compelling, keyword-rich, mentions ${currentYear}, under 60 chars)
- Meta description (engaging, includes keywords, clear CTA, under 160 chars)
- 5-7 relevant SEO keywords for ${currentYear} (natural phrases people actually search)

Return as JSON:
{
  "title": "Optimized Title ${currentYear}",
  "meta_description": "Description that makes people click...",
  "keywords": ["long tail keyword phrase", "another search term"]
}`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are an SEO expert who optimizes content for maximum search visibility in ${currentYear}. You understand current search trends, algorithm updates, and user intent.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const content_response = response.choices[0].message.content;
      return JSON.parse(content_response);
    } catch (error: any) {
      console.error('OpenAI SEO optimization error:', error);
      throw new Error(`Failed to optimize SEO: ${error.message}`);
    }
  }

  async analyzePerformance(articles: any[]): Promise<{ insights: string[]; recommendations: string[] }> {
    const currentYear = new Date().getFullYear();
    
    const summary = articles.map(a => ({
      title: a.title,
      views: a.views || 0,
      clicks: a.clicks || 0,
      ctr: a.views > 0 ? ((a.clicks / a.views) * 100).toFixed(2) : 0
    }));

    const prompt = `Analyze these article performance metrics for ${currentYear}:

${JSON.stringify(summary, null, 2)}

Provide:
- 3-5 actionable insights about what's working/not working
- 3-5 specific recommendations to improve performance in ${currentYear}
- Focus on current ${currentYear} trends and best practices

Return as JSON:
{
  "insights": ["Data-driven insight with specific metrics", "Another insight"],
  "recommendations": ["Actionable recommendation with clear next steps", "Another rec"]
}`;

    try {
      const response = await this.makeRequest("/chat/completions", {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a data analyst expert in affiliate marketing performance for ${currentYear}. You provide actionable insights based on current market trends and proven strategies.`
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error: any) {
      console.error('OpenAI performance analysis error:', error);
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }
}

export const openAI = new OpenAIService();