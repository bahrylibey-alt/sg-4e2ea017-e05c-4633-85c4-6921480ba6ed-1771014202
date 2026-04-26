import { supabase } from "@/integrations/supabase/client";

/**
 * Bulletproof JSON extraction from OpenAI response
 * Handles: markdown blocks, trailing text, nested JSON, arrays, broken formatting
 */
function extractJSON(content: string): any {
  // Log raw response for debugging
  console.log('🔍 OpenAI Response (first 500 chars):', content.substring(0, 500));
  
  try {
    // Strategy 1: Direct parse (fastest)
    try {
      const result = JSON.parse(content);
      console.log('✅ Direct JSON parse succeeded');
      return result;
    } catch (e) {
      // Continue to extraction strategies
    }

    let cleaned = content.trim();
    
    // Strategy 2: Strip markdown code blocks
    if (cleaned.includes('```')) {
      const match = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (match) {
        cleaned = match[1].trim();
        console.log('📝 Removed markdown code blocks');
      }
    }
    
    // Strategy 3: Find first { or [ and last } or ]
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    const lastBrace = cleaned.lastIndexOf('}');
    const lastBracket = cleaned.lastIndexOf(']');
    
    // Determine if it's an object or array
    const isArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace);
    
    if (isArray && firstBracket !== -1 && lastBracket !== -1) {
      cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      console.log('📦 Extracted JSON array');
    } else if (!isArray && firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      console.log('📦 Extracted JSON object');
    }
    
    // Strategy 4: Parse the extracted JSON
    try {
      const result = JSON.parse(cleaned);
      console.log('✅ Extraction succeeded');
      return result;
    } catch (parseError: any) {
      console.error('❌ Parse failed after extraction');
      console.error('Cleaned content:', cleaned.substring(0, 300));
      throw parseError;
    }
    
  } catch (error: any) {
    console.error('❌ JSON extraction failed completely');
    console.error('Error:', error.message);
    console.error('Raw response (first 1000 chars):', content.substring(0, 1000));
    console.error('Raw response (last 500 chars):', content.substring(Math.max(0, content.length - 500)));
    
    throw new Error(`Failed to parse OpenAI response: ${error.message}. Response started with: ${content.substring(0, 100)}...`);
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

  async discoverTrendingProducts(niche: string, count: number = 3): Promise<ProductSuggestion[]> {
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
              content: `You are a product research AI. Return ONLY valid JSON, no markdown, no explanations, no extra text.

CRITICAL: Your entire response must be parseable as JSON. Start with [ and end with ].`
            },
            {
              role: 'user',
              content: `Find ${count} REAL trending products in the "${niche}" category for 2026.

Requirements:
- Must be actually available on Amazon or AliExpress
- Must have verifiable social media buzz (TikTok, Reddit, etc.)
- Include specific trend metrics
- Return ONLY a JSON array

Format (ONLY THIS, NOTHING ELSE):
[
  {
    "name": "Product Name",
    "category": "${niche}",
    "why_trending": "Specific reason with metrics",
    "trend_score": 95,
    "estimated_price": 99.99,
    "amazon_url": "https://amazon.com/dp/B0XXXXX",
    "aliexpress_url": "",
    "affiliate_potential": "high"
  }
]`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
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
  ): Promise<{ title: string; body: string; meta_description: string; seo_keywords: string[] }> {
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
              content: `You are a content writer AI. Return ONLY valid JSON, no markdown, no explanations.

CRITICAL: Your entire response must be parseable as JSON. Start with { and end with }.`
            },
            {
              role: 'user',
              content: `Write an authentic product review article.

Product: ${productName}
Category: ${category}
Description: ${description}
Link: ${affiliateLink}

Write 800-1200 words in natural, conversational language. Include the link naturally in the conclusion.

Return ONLY this JSON (no markdown, no extra text):
{
  "title": "Article title (60-70 chars)",
  "body": "Full article (800-1200 words, include ${affiliateLink})",
  "meta_description": "SEO description (150-160 chars)",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"]
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
  ): Promise<Array<{ platform: string; content: string; title?: string; hashtags?: string[] }>> {
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
              content: `You are a social media AI. Return ONLY valid JSON, no markdown, no explanations.

CRITICAL: Your entire response must be parseable as JSON. Start with [ and end with ].`
            },
            {
              role: 'user',
              content: `Create 5 authentic social posts (one per platform).

Product: ${productName}
Category: ${category}
Description: ${description}
Link: ${affiliateLink}

Write naturally, like a real person. Include ${affiliateLink} in each post.

Platforms: pinterest, tiktok, twitter, facebook, instagram

Return ONLY this JSON array (no markdown, no extra text):
[
  {
    "platform": "pinterest",
    "content": "Post content with ${affiliateLink}",
    "title": "Short title",
    "hashtags": ["tag1", "tag2"]
  }
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