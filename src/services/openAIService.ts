import { supabase } from "@/integrations/supabase/client";

interface ProductSuggestion {
  name: string;
  category: string;
  trend_score: number;
  why_trending: string;
  target_audience: string;
  affiliate_potential: "high" | "medium" | "low";
}

interface ContentGeneration {
  title: string;
  body: string;
  meta_description: string;
  seo_keywords: string[];
  target_audience: string;
}

interface SocialPost {
  platform: "reddit" | "twitter" | "linkedin" | "medium";
  content: string;
  hashtags: string[];
  title?: string;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || "";
  }

  private async makeRequest(endpoint: string, body: any) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return response.json();
  }

  async discoverTrendingProducts(niche: string, count: number = 5): Promise<ProductSuggestion[]> {
    const prompt = `You are a trending product discovery expert. Find ${count} real, currently trending products in the "${niche}" niche that are perfect for affiliate marketing.

For each product, provide:
- Exact product name (real products only)
- Category
- Trend score (1-100)
- Why it's trending right now
- Target audience
- Affiliate potential (high/medium/low)

Focus on products that:
- Are currently trending on social media, Google Trends, or e-commerce platforms
- Have strong affiliate programs (Amazon, AliExpress, ClickBank, etc.)
- Have high purchase intent
- Are NOT seasonal unless currently in season
- Have proven sales data

Return as JSON array with this exact structure:
[{
  "name": "Product Name",
  "category": "Category",
  "trend_score": 85,
  "why_trending": "Reason",
  "target_audience": "Audience",
  "affiliate_potential": "high"
}]`;

    const response = await this.makeRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a trending product discovery AI that only suggests real, currently trending products with affiliate potential." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.products || parsed;
  }

  async generateSEOContent(product: { name: string; category: string; target_audience: string }, affiliateLink: string): Promise<ContentGeneration> {
    const prompt = `Write a comprehensive, SEO-optimized affiliate marketing article about "${product.name}".

Product Details:
- Name: ${product.name}
- Category: ${product.category}
- Target Audience: ${product.target_audience}

Requirements:
- Title: Compelling, SEO-friendly (under 60 characters)
- Body: 800-1200 words, naturally incorporate the affiliate link
- Include: Benefits, features, use cases, comparison with alternatives
- Tone: Informative, persuasive, trustworthy
- SEO: Natural keyword placement, header structure
- Call-to-action: Encourage clicks on the affiliate link
- Format: Markdown with headers, bullet points, bold text

Affiliate Link to include: ${affiliateLink}

Return as JSON with this structure:
{
  "title": "Article Title",
  "body": "Full article in Markdown...",
  "meta_description": "SEO meta description (under 160 chars)",
  "seo_keywords": ["keyword1", "keyword2"],
  "target_audience": "Audience description"
}`;

    const response = await this.makeRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert SEO content writer specializing in affiliate marketing articles." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }

  async generateSocialPosts(article: { title: string; body: string }, affiliateLink: string): Promise<SocialPost[]> {
    const prompt = `Create engaging social media posts for this article: "${article.title}"

Article summary: ${article.body.substring(0, 300)}...
Affiliate link: ${affiliateLink}

Create posts for:
1. Reddit (detailed, value-focused, no hard sell)
2. Twitter/X (concise, engaging, with hashtags)
3. LinkedIn (professional, informative)
4. Medium (article introduction)

Each post should:
- Be platform-appropriate in tone and length
- Include the affiliate link naturally
- Use relevant hashtags
- Drive clicks without being spammy
- Provide real value

Return as JSON array:
[{
  "platform": "reddit",
  "content": "Post content...",
  "hashtags": ["tag1", "tag2"],
  "title": "Post title (for Reddit/Medium)"
}]`;

    const response = await this.makeRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a social media marketing expert who creates engaging, non-spammy posts." },
        { role: "user", content: prompt }
      ],
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const parsed = JSON.parse(content);
    return parsed.posts || parsed;
  }

  async optimizeSEO(content: { title: string; body: string }): Promise<{ title: string; meta_description: string; keywords: string[] }> {
    const prompt = `Optimize this content for SEO:

Title: ${content.title}
Content: ${content.body.substring(0, 500)}...

Provide:
- Optimized title (compelling, keyword-rich, under 60 chars)
- Meta description (under 160 chars, includes keywords and CTA)
- 5-7 relevant SEO keywords

Return as JSON:
{
  "title": "Optimized Title",
  "meta_description": "Description...",
  "keywords": ["keyword1", "keyword2"]
}`;

    const response = await this.makeRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an SEO expert who optimizes content for maximum search visibility." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content_response = response.choices[0].message.content;
    return JSON.parse(content_response);
  }

  async analyzePerformance(articles: any[]): Promise<{ insights: string[]; recommendations: string[] }> {
    const summary = articles.map(a => ({
      title: a.title,
      views: a.views || 0,
      clicks: a.clicks || 0,
      ctr: a.views > 0 ? ((a.clicks / a.views) * 100).toFixed(2) : 0
    }));

    const prompt = `Analyze these article performance metrics:

${JSON.stringify(summary, null, 2)}

Provide:
- 3-5 actionable insights about what's working/not working
- 3-5 specific recommendations to improve performance

Return as JSON:
{
  "insights": ["insight1", "insight2"],
  "recommendations": ["rec1", "rec2"]
}`;

    const response = await this.makeRequest("/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a data analyst expert in affiliate marketing performance." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  }
}

export const openAI = new OpenAIService();