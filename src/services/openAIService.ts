import { supabase } from "@/integrations/supabase/client";

/**
 * Extract JSON from OpenAI response (handles markdown code blocks)
 */
function extractJSON(content: string): any {
  try {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    
    // Remove ```json and ``` wrappers
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*\n?/, '').replace(/\n?```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    
    // Find JSON object boundaries
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // Parse JSON
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON extraction failed:', error);
    console.error('Content:', content.substring(0, 500));
    throw new Error('Failed to parse OpenAI response as JSON');
  }
}

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
      const parsed = extractJSON(content);
      
      if (!parsed.products || parsed.products.length === 0) {
        throw new Error("OpenAI did not return any products. Try a different niche or check your API key.");
      }

      return parsed.products;
    } catch (error: any) {
      console.error('OpenAI product discovery error:', error);
      throw new Error(`Failed to discover products: ${error.message}`);
    }
  }

  /**
   * Generate SEO-optimized content for a product
   */
  async generateSEOContent(
    productName: string,
    category: string,
    description: string,
    affiliateLink: string
  ): Promise<{ title: string; body: string; meta_description: string }> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional content writer who creates authentic, engaging product reviews. 

CRITICAL RULES:
1. Write like a REAL PERSON sharing genuine experience
2. Use conversational, natural language
3. Include specific details and insights
4. Be honest about pros and cons
5. NO robotic or salesy language
6. NO emoji spam
7. Create content that sounds genuinely helpful

Return ONLY valid JSON (no markdown, no code blocks).`
            },
            {
              role: 'user',
              content: `Write an authentic, engaging product review article.

Product: ${productName}
Category: ${category}
Description: ${description}
Affiliate Link: ${affiliateLink}

Requirements:
- Length: 800-1200 words
- Tone: Conversational, like talking to a friend
- Structure: Personal hook → Analysis → Pros/Cons → Recommendation
- Include the affiliate link naturally in the conclusion
- Write like you actually tested the product
- Be specific with details (not generic)

Return JSON format:
{
  "title": "Engaging article title (60-70 chars)",
  "body": "Full article content (800-1200 words, natural language, includes affiliate link)",
  "meta_description": "SEO description (150-160 chars)"
}`
            }
          ],
          temperature: 0.8,
          max_tokens: 3000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return extractJSON(content);
    } catch (error: any) {
      console.error('OpenAI content generation error:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  /**
   * Generate authentic social media posts
   */
  async generateSocialPosts(
    productName: string,
    category: string,
    description: string,
    affiliateLink: string
  ): Promise<Array<{ platform: string; content: string }>> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a social media expert who creates AUTHENTIC, NATURAL posts that sound genuinely human.

CRITICAL RULES:
1. Write like a REAL PERSON, not a marketer
2. Use conversational, relatable language
3. Be platform-specific (Pinterest ≠ TikTok ≠ Twitter)
4. NO emoji spam (use sparingly, naturally)
5. NO generic phrases ("Amazing deal!", "Don't miss out!")
6. Sound like you genuinely tried the product
7. Include personal insights and specific details

Return ONLY valid JSON (no markdown, no code blocks).`
            },
            {
              role: 'user',
              content: `Create 5 authentic social media posts (one per platform).

Product: ${productName}
Category: ${category}
Description: ${description}
Affiliate Link: ${affiliateLink}

Create ONE post for each platform:
1. Pinterest: Visual description with genuine recommendation (200-300 chars)
2. TikTok: Viral hook + authentic insight (100-150 chars)
3. Twitter: Conversational thread starter (200-280 chars)
4. Facebook: Value-focused personal story (250-350 chars)
5. Instagram: Natural caption with authentic voice (150-200 chars)

REQUIREMENTS:
- Sound genuinely human, not robotic
- Include the affiliate link naturally
- Platform-specific language and formatting
- Personal, relatable tone
- Minimal emojis (only where natural)

Return JSON array format:
[
  {
    "platform": "pinterest",
    "content": "Post content with ${affiliateLink}"
  },
  ...
]`
            }
          ],
          temperature: 0.9,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      return extractJSON(content);
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
      return extractJSON(content_response);
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
      return extractJSON(content);
    } catch (error: any) {
      console.error('OpenAI performance analysis error:', error);
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }
}

export const openAI = new OpenAIService();