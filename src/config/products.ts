import { supabase } from "@/integrations/supabase/client";

/**
 * Product Database for Affiliate Links
 * Now connected to real database - auto-discovered products
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  buttonText?: string;
  description?: string;
  originalUrl?: string;
  clicks?: number;
  conversions?: number;
  status?: string;
  network?: string;
}

/**
 * Get product from database by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    // Try affiliate_links first
    const { data: affiliateLink } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle();

    if (affiliateLink) {
      return {
        id: affiliateLink.id,
        name: affiliateLink.product_name || 'Product',
        slug: affiliateLink.slug,
        buttonText: `Get ${affiliateLink.product_name || 'This Product'} Now →`,
        description: affiliateLink.network ? `From ${affiliateLink.network}` : undefined,
        originalUrl: affiliateLink.original_url,
        clicks: affiliateLink.clicks || 0,
        conversions: affiliateLink.conversions || 0,
        status: affiliateLink.status,
        network: affiliateLink.network
      };
    }

    // Try generated_content as fallback
    const { data: content } = await supabase
      .from('generated_content')
      .select('*')
      .eq('id', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (content) {
      const urlMatch = content.body?.match(/https?:\/\/[^\s<>"']+/);
      return {
        id: content.id,
        name: content.title,
        slug: content.id,
        buttonText: `Get ${content.title} →`,
        description: content.body?.substring(0, 150),
        originalUrl: urlMatch?.[0],
        clicks: content.clicks || 0,
        status: content.status
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

/**
 * Get all active products from database with optional network filter
 */
export async function getAllProducts(limit: number = 50, options?: { 
  network?: string;
  excludeNetworks?: string[];
}): Promise<Product[]> {
  try {
    let query = supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active');

    if (options?.network) {
      query = query.eq('network', options.network);
    }

    if (options?.excludeNetworks && options.excludeNetworks.length > 0) {
      query = query.not('network', 'in', `(${options.excludeNetworks.join(',')})`);
    }

    const { data: links } = await query
      .order('clicks', { ascending: false })
      .limit(limit);

    if (!links) return [];

    return links.map(link => ({
      id: link.id,
      name: link.product_name || 'Product',
      slug: link.slug,
      buttonText: `Get ${link.product_name || 'This Product'} Now →`,
      description: link.network ? `From ${link.network}` : undefined,
      originalUrl: link.original_url,
      clicks: link.clicks || 0,
      conversions: link.conversions || 0,
      status: link.status,
      network: link.network
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Get products by network
 */
export async function getProductsByNetwork(network: string, limit: number = 20): Promise<Product[]> {
  return getAllProducts(limit, { network });
}

/**
 * Get trending products (most clicks) from all networks
 */
export async function getTrendingProducts(limit: number = 10): Promise<Product[]> {
  try {
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active')
      .order('clicks', { ascending: false })
      .limit(limit);

    if (!links) return [];

    return links.map(link => ({
      id: link.id,
      name: link.product_name || 'Product',
      slug: link.slug,
      buttonText: `Get ${link.product_name || 'This Product'} Now →`,
      description: link.network ? `From ${link.network}` : undefined,
      originalUrl: link.original_url,
      clicks: link.clicks || 0,
      conversions: link.conversions || 0,
      status: link.status,
      network: link.network
    }));
  } catch (error) {
    console.error('Error fetching trending products:', error);
    return [];
  }
}

/**
 * Get product URL (integrates with existing /go/[slug] routing)
 */
export function getProductUrl(slug: string): string {
  if (!slug) return "#";
  return `/go/${slug}`;
}

/**
 * Search products by name
 */
export async function searchProducts(query: string): Promise<Product[]> {
  try {
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active')
      .ilike('product_name', `%${query}%`)
      .limit(20);

    if (!links) return [];

    return links.map(link => ({
      id: link.id,
      name: link.product_name || 'Product',
      slug: link.slug,
      buttonText: `Get ${link.product_name || 'This Product'} Now →`,
      description: link.network ? `From ${link.network}` : undefined,
      originalUrl: link.original_url,
      clicks: link.clicks || 0,
      conversions: link.conversions || 0,
      status: link.status,
      network: link.network
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

/**
 * Get network statistics
 */
export async function getNetworkStats(): Promise<Array<{ network: string; count: number; clicks: number }>> {
  try {
    const { data: links } = await supabase
      .from('affiliate_links')
      .select('network, clicks')
      .eq('status', 'active');

    if (!links) return [];

    const stats = links.reduce((acc, link) => {
      const network = link.network || 'Unknown';
      if (!acc[network]) {
        acc[network] = { network, count: 0, clicks: 0 };
      }
      acc[network].count++;
      acc[network].clicks += link.clicks || 0;
      return acc;
    }, {} as Record<string, { network: string; count: number; clicks: number }>);

    return Object.values(stats).sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching network stats:', error);
    return [];
  }
}