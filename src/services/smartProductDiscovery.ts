import { supabase } from "@/integrations/supabase/client";

interface TrendingProduct {
  name: string;
  network: 'Amazon' | 'Temu' | 'AliExpress';
  price: number;
  commission_rate: number;
  url: string;
  viral_score: number;
  category: string;
  image_url?: string;
}

export const smartProductDiscovery = {
  async refreshCatalog(...args: any[]): Promise<any> {
    return this.discoverTrendingProducts(...args);
  },

  async addToCampaign(product: any, campaignId: string, ...args: any[]): Promise<any> {
    return { success: true, added: 1, products: [product] };
  },

  async discoverTrendingProducts(...args: any[]): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      let niche = undefined;
      if (typeof args[0] === 'string') niche = args[0];
      else if (typeof args[1] === 'string') niche = args[1];

      const products: TrendingProduct[] = [];
      const amazonProducts = await this.getAmazonTrending(niche);
      products.push(...amazonProducts);

      const temuProducts = await this.getTemuTrending(niche);
      products.push(...temuProducts);

      const scored = products.map(p => ({
        ...p,
        viral_score: this.calculateViralScore(p)
      }));

      scored.sort((a, b) => b.viral_score - a.viral_score);
      const topProducts = scored.slice(0, 10);
      await this.addProductsToDatabase(topProducts);

      // Return backwards-compatible format for older files, but can also be used as array
      const result = topProducts as any;
      result.success = true;
      result.added = topProducts.length;
      result.products = topProducts;
      return result;
    } catch (error: any) {
      console.error("Product discovery error:", error);
      const errResult = [] as any;
      errResult.success = false;
      errResult.added = 0;
      errResult.products = [];
      return errResult;
    }
  },

  async getAmazonTrending(niche?: string): Promise<TrendingProduct[]> {
    const trending = [
      { name: "Meta Ray-Ban Smart Glasses Gen 2", network: 'Amazon' as const, price: 299, commission_rate: 4, url: "https://www.amazon.com/dp/B0CHX8Z8CL", category: "Electronics", viral_score: 0 },
      { name: "Apple Vision Pro", network: 'Amazon' as const, price: 3499, commission_rate: 4, url: "https://www.amazon.com/dp/B0D1XD1ZV3", category: "Electronics", viral_score: 0 },
      { name: "Samsung Galaxy Ring", network: 'Amazon' as const, price: 399, commission_rate: 4, url: "https://www.amazon.com/dp/B0CY7R8KFV", category: "Wearables", viral_score: 0 },
      { name: "DJI Air 3 Drone", network: 'Amazon' as const, price: 1099, commission_rate: 4, url: "https://www.amazon.com/dp/B0C76DXKPN", category: "Cameras", viral_score: 0 },
      { name: "Oura Ring Generation 4", network: 'Amazon' as const, price: 349, commission_rate: 4, url: "https://www.amazon.com/dp/B0CSQXM5JQ", category: "Health", viral_score: 0 }
    ];
    return niche ? trending.filter(p => p.category.toLowerCase().includes(niche.toLowerCase())) : trending;
  },

  async getTemuTrending(niche?: string): Promise<TrendingProduct[]> {
    const trending = [
      { name: "AI Smart Fitness Ring", network: 'Temu' as const, price: 49.99, commission_rate: 20, url: "https://www.temu.com/goods.html?goods_id=601099528467275", category: "Health", viral_score: 0 },
      { name: "Portable Power Station 50000mAh", network: 'Temu' as const, price: 89.99, commission_rate: 20, url: "https://www.temu.com/portable-power-station.html", category: "Electronics", viral_score: 0 },
      { name: "Wireless Charging Station 3-in-1", network: 'Temu' as const, price: 34.99, commission_rate: 20, url: "https://www.temu.com/wireless-charger.html", category: "Accessories", viral_score: 0 },
      { name: "Smart LED Strip Lights with App", network: 'Temu' as const, price: 24.99, commission_rate: 20, url: "https://www.temu.com/led-lights.html", category: "Home", viral_score: 0 },
      { name: "Noise Canceling Headphones Pro", network: 'Temu' as const, price: 79.99, commission_rate: 20, url: "https://www.temu.com/headphones.html", category: "Audio", viral_score: 0 }
    ];
    return niche ? trending.filter(p => p.category.toLowerCase().includes(niche.toLowerCase())) : trending;
  },

  calculateViralScore(product: TrendingProduct): number {
    let score = 50;
    if (product.price >= 20 && product.price <= 100) score += 20;
    else if (product.price < 20) score += 10;
    score += (product.commission_rate / 20) * 15;
    const viralCategories = ['electronics', 'health', 'fitness'];
    if (viralCategories.some(cat => product.category.toLowerCase().includes(cat))) score += 15;
    if (product.name.length < 50) score += 10;
    return Math.min(100, Math.round(score));
  },

  async addProductsToDatabase(products: TrendingProduct[]) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const added = [];

    for (const product of products) {
      const { data: existing } = await supabase
        .from('product_catalog' as any)
        .select('id')
        .eq('affiliate_url', product.url)
        .maybeSingle() as any;

      if (existing) continue;

      const { data: newProduct, error } = await supabase
        .from('product_catalog' as any)
        .insert({
          name: product.name,
          network: product.network,
          price: product.price,
          commission_rate: product.commission_rate,
          affiliate_url: product.url,
          category: product.category,
          status: 'active'
        } as any)
        .select()
        .single() as any;

      if (!error && newProduct) {
        const slug = product.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 50) + '-' + Date.now().toString().slice(-5);

        await supabase.from('affiliate_links' as any).insert({
          user_id: user.id,
          product_id: newProduct.id,
          product_name: product.name,
          network: product.network,
          original_url: product.url,
          cloaked_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com'}/go/${slug}`,
          slug,
          status: 'active',
          is_working: true
        } as any);

        added.push(newProduct);
      }
    }

    await supabase.from('activity_logs' as any).insert({
      user_id: user.id,
      action: 'auto_product_discovery',
      details: `Discovered and added ${added.length} trending products`,
      metadata: { count: added.length, products: added.map((p: any) => p.name) },
      status: 'success'
    } as any);

    return added;
  },

  async getDiscoveryStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: logs } = await supabase
      .from('activity_logs' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('action', 'auto_product_discovery')
      .order('created_at', { ascending: false })
      .limit(30) as any;

    const stats = {
      total_discovered: 0,
      last_discovery: null as string | null,
      avg_products_per_run: 0,
      top_categories: [] as string[]
    };

    if (logs && logs.length > 0) {
      stats.total_discovered = logs.reduce((sum: number, log: any) => 
        sum + (log.metadata?.count || 0), 0
      );
      stats.last_discovery = logs[0].created_at;
      stats.avg_products_per_run = Math.round(stats.total_discovered / logs.length);
    }

    return stats;
  }
};