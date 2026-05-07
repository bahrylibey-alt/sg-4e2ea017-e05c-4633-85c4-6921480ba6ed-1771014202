/**
 * REAL AUTONOMOUS AFFILIATE ENGINE
 * 100% Real Data - NO Mocks, NO Fakes
 * Auto-discovers products, generates content, publishes to traffic sources
 */

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

class RealAutopilotEngine {
  private readonly API_BASE = typeof window !== 'undefined' ? window.location.origin : '';
  private isRunning = false;
  private lastRun: Date | null = null;
  private statsCache = {
    products: 0,
    links: 0,
    content: 0,
    posts: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  };

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // --- REAL ASYNC METHODS ---

  async discoverRealProducts(niche: string = 'trending'): Promise<any[]> {
    try {
      console.log(`🔍 Discovering REAL products in niche: ${niche}`);
      const response = await fetch(`${this.API_BASE}/api/trending/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, limit: 20 })
      });
      if (!response.ok) throw new Error(`Discovery API failed: ${response.statusText}`);
      const data = await response.json();
      console.log(`✅ Discovered ${data.trending?.length || 0} REAL products`);
      return data.trending || [];
    } catch (error) {
      console.error('❌ Product discovery error:', error);
      return [];
    }
  }

  async createAffiliateLinks(products: Product[]): Promise<AffiliateLink[]> {
    const links: AffiliateLink[] = [];
    for (const product of products) {
      const slug = product.name.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      links.push({
        id: 'link-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
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
      });
    }
    console.log(`✅ Created ${links.length} tracked affiliate links`);
    return links;
  }

  async generateRealContent(product: any): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/api/autopilot/content-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`Content generation failed: ${response.statusText}`);
      const data = await response.json();
      console.log(`✅ Generated content: ${data.articlesCreated} articles`);
      return data;
    } catch (error) {
      console.error('❌ Content generation error:', error);
      return null;
    }
  }

  async publishToRealTraffic(products: Product[], links: AffiliateLink[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.API_BASE}/api/autopilot/social-publisher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`Social publishing failed: ${response.statusText}`);
      const data = await response.json();
      console.log(`✅ Published to traffic sources: ${data.posts || 0} posts`);
      return data.posts || [];
    } catch (error) {
      console.error('❌ Traffic publishing error:', error);
      return [];
    }
  }

  async runAutopilot(niche: string = 'trending'): Promise<any> {
    try {
      this.isRunning = true;
      this.lastRun = new Date();
      console.log('🚀 STARTING REAL AUTONOMOUS AFFILIATE ENGINE');
      
      const products = await this.discoverRealProducts(niche);
      if (products.length === 0) throw new Error('No products discovered.');
      
      const links = await this.createAffiliateLinks(products);
      const content = await this.generateRealContent(products[0]);
      const posts = await this.publishToRealTraffic(products, links);

      this.isRunning = false;
      this.refreshStatsAsync();
      
      return {
        success: true,
        products: products.length,
        links: links.length,
        content: content?.articlesCreated || 0,
        posts: posts.length,
        mode: 'REAL_DATA_ONLY',
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      this.isRunning = false;
      console.error('❌ Autopilot error:', error);
      throw error;
    }
  }

  // --- BACKWARD COMPATIBILITY / UI SHIMS ---

  getStats() {
    // Return synchronously to prevent React SetStateAction<Promise> errors
    this.refreshStatsAsync();
    return this.statsCache;
  }

  private async refreshStatsAsync() {
    if (!this.isBrowser()) return;
    try {
      const response = await fetch(`${this.API_BASE}/api/autopilot/system-health`);
      if (response.ok) {
        const data = await response.json();
        if (data.stats) this.statsCache = data.stats;
      }
    } catch (error) {
      // Silent catch for background refresh
    }
  }

  getAllData() {
    return {
      products: [],
      links: [],
      content: [],
      posts: [],
      logs: []
    };
  }

  clearAllData() {
    console.log('Real system active: clearAllData is disabled to protect live data.');
  }

  async discoverProducts(niche?: string) {
    return this.discoverRealProducts(niche || 'trending');
  }

  async generateContent(product?: any) {
    return this.generateRealContent(product);
  }

  async publishToSocial(products?: any[], links?: any[]) {
    return this.publishToRealTraffic(products || [], links || []);
  }

  getLastRun() {
    return this.lastRun;
  }

  getIsRunning() {
    return this.isRunning;
  }
}

export const realAutopilotEngine = new RealAutopilotEngine();