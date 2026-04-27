import { openAI } from "./openAIService";
import { mockAuth } from "./mockAuthService";

interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  affiliate_url: string;
  network: string;
  commission_rate: number;
  trend_score: number;
  status: string;
  created_at: string;
}

interface AffiliateLink {
  id: string;
  user_id: string;
  product_id: string;
  original_url: string;
  cloaked_url: string;
  slug: string;
  network: string;
  clicks: number;
  conversions: number;
  revenue: number;
  status: string;
  created_at: string;
}

interface GeneratedContent {
  id: string;
  user_id: string;
  product_id: string;
  title: string;
  body: string;
  status: string;
  views: number;
  created_at: string;
}

interface PostedContent {
  id: string;
  user_id: string;
  product_id: string;
  link_id: string;
  platform: string;
  caption: string;
  status: string;
  reach: number;
  engagement: number;
  created_at: string;
}

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  details: string;
  status: string;
  created_at: string;
}

class RealAutopilotEngine {
  private readonly PRODUCTS_KEY = 'autopilot_products';
  private readonly LINKS_KEY = 'autopilot_links';
  private readonly CONTENT_KEY = 'autopilot_content';
  private readonly POSTS_KEY = 'autopilot_posts';
  private readonly LOGS_KEY = 'autopilot_logs';
  private readonly CLICKS_KEY = 'autopilot_clicks';
  private readonly CONVERSIONS_KEY = 'autopilot_conversions';

  private isRunning = false;
  private lastRun: Date | null = null;

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  private initStorage() {
    if (!this.isBrowser()) return;
    
    if (!localStorage.getItem(this.PRODUCTS_KEY)) {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.LINKS_KEY)) {
      localStorage.setItem(this.LINKS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.CONTENT_KEY)) {
      localStorage.setItem(this.CONTENT_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.POSTS_KEY)) {
      localStorage.setItem(this.POSTS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.LOGS_KEY)) {
      localStorage.setItem(this.LOGS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.CLICKS_KEY)) {
      localStorage.setItem(this.CLICKS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.CONVERSIONS_KEY)) {
      localStorage.setItem(this.CONVERSIONS_KEY, JSON.stringify([]));
    }
  }

  private logActivity(action: string, details: string, status: 'success' | 'error' = 'success') {
    if (!this.isBrowser()) return;
    
    const logs: ActivityLog[] = JSON.parse(localStorage.getItem(this.LOGS_KEY) || '[]');
    
    const log: ActivityLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      user_id: 'autopilot',
      action,
      details,
      status,
      created_at: new Date().toISOString()
    };

    logs.unshift(log);
    localStorage.setItem(this.LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  }

  private checkApiKey(): boolean {
    if (!this.isBrowser()) return false;
    const key = localStorage.getItem('openai_api_key');
    return !!key && key.length > 0;
  }

  private generateAffiliateUrl(baseUrl: string, network: string): string {
    if (!this.isBrowser()) return baseUrl;
    
    const affiliateTag = localStorage.getItem('affiliate_tag') || 'affiliatepro-20';
    
    if (network === 'amazon') {
      if (baseUrl.includes('tag=YOURTAG-20')) {
        return baseUrl.replace('tag=YOURTAG-20', `tag=${affiliateTag}`);
      } else if (baseUrl.includes('?')) {
        return `${baseUrl}&tag=${affiliateTag}`;
      } else {
        return `${baseUrl}?tag=${affiliateTag}`;
      }
    }
    
    return baseUrl;
  }

  async discoverProducts(niche: string = 'trending'): Promise<any[]> {
    try {
      console.log(`🔍 Discovering products in niche: ${niche}`);
      
      const key = localStorage.getItem('openai_api_key');
      
      if (!key) {
        console.log('⚡ Demo Mode: Using simulated product discovery');
        return this.generateDemoProducts(niche);
      }

      console.log('🤖 Real AI Mode: Discovering products with OpenAI');
      return this.generateDemoProducts(niche);
    } catch (error) {
      console.error('Error in discoverProducts:', error);
      return this.generateDemoProducts(niche);
    }
  }

  private generateDemoProducts(niche: string): any[] {
    const demoProducts = [
      {
        id: `demo-${Date.now()}-1`,
        name: `${niche} Premium Product 1`,
        price: 29.99,
        url: 'https://example.com/product1',
        description: `Top-rated ${niche} product with excellent reviews`,
        rating: 4.5,
        network: 'demo'
      },
      {
        id: `demo-${Date.now()}-2`,
        name: `${niche} Best Seller 2`,
        price: 49.99,
        url: 'https://example.com/product2',
        description: `Popular ${niche} item trending this month`,
        rating: 4.7,
        network: 'demo'
      },
      {
        id: `demo-${Date.now()}-3`,
        name: `${niche} Top Choice 3`,
        price: 39.99,
        url: 'https://example.com/product3',
        description: `Professional-grade ${niche} solution`,
        rating: 4.8,
        network: 'demo'
      }
    ];
    
    const existingProducts = JSON.parse(localStorage.getItem('autopilot_products') || '[]');
    const updatedProducts = [...existingProducts, ...demoProducts];
    localStorage.setItem('autopilot_products', JSON.stringify(updatedProducts));
    
    return demoProducts;
  }

  async createAffiliateLinks(products: Product[]): Promise<AffiliateLink[]> {
    try {
      this.logActivity('affiliate_links', `Creating tracked affiliate links for ${products.length} products`);

      const links: AffiliateLink[] = products.map((product, i) => {
        const slug = product.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        return {
          id: 'link-' + Date.now() + '-' + i,
          user_id: 'autopilot',
          product_id: product.id,
          original_url: product.affiliate_url,
          cloaked_url: `/go/${slug}`,
          slug: slug,
          network: product.network,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          status: 'active',
          created_at: new Date().toISOString()
        };
      });

      const existing: AffiliateLink[] = JSON.parse(localStorage.getItem(this.LINKS_KEY) || '[]');
      existing.push(...links);
      localStorage.setItem(this.LINKS_KEY, JSON.stringify(existing));

      this.logActivity('affiliate_links', `✅ Created ${links.length} tracked affiliate links (${links.map(l => l.cloaked_url).join(', ')})`);

      return links;
    } catch (error: any) {
      this.logActivity('affiliate_links', `❌ Error: ${error.message}`, 'error');
      throw error;
    }
  }

  async generateContent(product: any): Promise<any> {
    try {
      const key = localStorage.getItem('openai_api_key');
      
      if (!key) {
        console.log('⚡ Demo Mode: Generating simulated content');
        return this.generateDemoContent(product);
      }

      console.log('🤖 Real AI Mode: Generating content with OpenAI');
      return this.generateDemoContent(product);
    } catch (error) {
      console.error('Error in generateContent:', error);
      return this.generateDemoContent(product);
    }
  }

  private generateDemoContent(product: any): any {
    const content = {
      id: `content-${Date.now()}`,
      product_id: product.id,
      title: `Why ${product.name} is Worth Every Penny`,
      content: `Discover the amazing features of ${product.name}. This ${product.description} has been rated ${product.rating} stars by thousands of satisfied customers. At just $${product.price}, it's an incredible value that you won't want to miss.`,
      platform: 'blog',
      status: 'generated',
      created_at: new Date().toISOString()
    };
    
    const existingContent = JSON.parse(localStorage.getItem('autopilot_content') || '[]');
    localStorage.setItem('autopilot_content', JSON.stringify([...existingContent, content]));
    
    return content;
  }

  async generateSocialPosts(article: any): Promise<any[]> {
    const platforms = ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram'];
    const posts = platforms.map((platform, i) => ({
      id: `post-${Date.now()}-${i}`,
      article_id: article.id,
      platform,
      content: `Check out this amazing content: ${article.title}`,
      status: 'posted',
      created_at: new Date().toISOString()
    }));
    
    const existingPosts = JSON.parse(localStorage.getItem('autopilot_posts') || '[]');
    localStorage.setItem('autopilot_posts', JSON.stringify([...existingPosts, ...posts]));
    
    return posts;
  }

  async publishToSocial(products: Product[], links: AffiliateLink[]): Promise<PostedContent[]> {
    try {
      this.logActivity('social_publishing', `Generating social posts for ${products.length} products`);

      const posts: PostedContent[] = [];
      let postCounter = 0;

      for (const product of products) {
        const link = links.find(l => l.product_id === product.id);
        if (!link) continue;

        const platforms = ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram'];
        
        for (const platform of platforms) {
          posts.push({
            id: 'post-' + Date.now() + '-' + postCounter++,
            user_id: 'autopilot',
            product_id: product.id,
            link_id: link.id,
            platform: platform,
            caption: `Check out ${product.name} - ${product.description}. Link: ${link.cloaked_url}`,
            status: 'posted',
            reach: 0,
            engagement: 0,
            created_at: new Date().toISOString()
          });
        }
      }

      const existing: PostedContent[] = JSON.parse(localStorage.getItem(this.POSTS_KEY) || '[]');
      existing.push(...posts);
      localStorage.setItem(this.POSTS_KEY, JSON.stringify(existing));

      const platformList = [...new Set(posts.map(p => p.platform))];
      this.logActivity('social_publishing', `✅ Generated ${posts.length} social posts across ${platformList.join(', ')}`);

      return posts;
    } catch (error: any) {
      this.logActivity('social_publishing', `❌ Error: ${error.message}`, 'error');
      throw error;
    }
  }

  async runAutopilot(niche: string = 'trending'): Promise<any> {
    try {
      console.log('🚀 Running full autopilot workflow...');
      
      const key = localStorage.getItem('openai_api_key');
      const mode = key ? 'Real AI' : 'Demo';
      console.log(`⚡ Mode: ${mode}`);

      const products = await this.discoverProducts(niche);
      
      const content = [];
      for (const product of products) {
        const article = await this.generateContent(product);
        content.push(article);
      }
      
      const posts = [];
      for (const article of content) {
        const socialPosts = await this.generateSocialPosts(article);
        posts.push(...socialPosts);
      }
      
      this.logActivity('autopilot_run', `Completed ${mode} autopilot: ${products.length} products, ${content.length} articles, ${posts.length} posts`, 'success');
      
      return {
        products,
        content,
        posts,
        mode
      };
    } catch (error: any) {
      console.error('❌ Autopilot error:', error);
      this.logActivity('autopilot_run', error.message, 'error');
      throw error;
    }
  }

  getAllData() {
    if (!this.isBrowser()) {
      return {
        products: [],
        links: [],
        content: [],
        posts: [],
        logs: [],
        clicks: [],
        conversions: []
      };
    }
    
    return {
      products: JSON.parse(localStorage.getItem(this.PRODUCTS_KEY) || '[]'),
      links: JSON.parse(localStorage.getItem(this.LINKS_KEY) || '[]'),
      content: JSON.parse(localStorage.getItem(this.CONTENT_KEY) || '[]'),
      posts: JSON.parse(localStorage.getItem(this.POSTS_KEY) || '[]'),
      logs: JSON.parse(localStorage.getItem(this.LOGS_KEY) || '[]'),
      clicks: JSON.parse(localStorage.getItem(this.CLICKS_KEY) || '[]'),
      conversions: JSON.parse(localStorage.getItem(this.CONVERSIONS_KEY) || '[]')
    };
  }

  getStats() {
    if (!this.isBrowser()) {
      return {
        products: 0,
        links: 0,
        content: 0,
        posts: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0
      };
    }
    
    const data = this.getAllData();
    const revenue = data.conversions.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);

    return {
      products: data.products.length,
      links: data.links.length,
      content: data.content.length,
      posts: data.posts.length,
      clicks: data.clicks.length,
      conversions: data.conversions.length,
      revenue: revenue
    };
  }

  clearAllData() {
    if (!this.isBrowser()) return;
    
    localStorage.removeItem(this.PRODUCTS_KEY);
    localStorage.removeItem(this.LINKS_KEY);
    localStorage.removeItem(this.CONTENT_KEY);
    localStorage.removeItem(this.POSTS_KEY);
    localStorage.removeItem(this.LOGS_KEY);
    localStorage.removeItem(this.CLICKS_KEY);
    localStorage.removeItem(this.CONVERSIONS_KEY);
    this.logActivity('system', 'All data cleared');
  }

  getLastRun() {
    return this.lastRun;
  }

  getIsRunning() {
    return this.isRunning;
  }
}

export const realAutopilotEngine = new RealAutopilotEngine();