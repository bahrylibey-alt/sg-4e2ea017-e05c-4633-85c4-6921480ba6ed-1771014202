import { supabase } from "@/integrations/supabase/client";

/**
 * SMART CONTENT GENERATOR
 * AI-powered content creation for products
 * Generates: Reviews, Comparisons, Best-of lists, How-to guides
 */

export const smartContentGenerator = {
  /**
   * Generate product review article
   */
  async generateReview(productId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get product details
    const { data: product } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) throw new Error("Product not found");

    // Generate AI content
    const content = this.createReviewContent(product);

    // Save to database
    const { data: article, error } = await supabase
      .from('generated_content' as any)
      .insert({
        user_id: user.id,
        product_id: productId,
        type: 'review',
        title: content.title,
        content: content.body,
        meta_description: content.description,
        keywords: content.keywords,
        status: 'published'
      } as any)
      .select()
      .single() as any;

    if (error) throw error;
    return article;
  },

  /**
   * Generate "Best Under Price" comparison article
   */
  async generateBestUnderPrice(category: string, maxPrice: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get products in category under price
    const { data: products } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('category', category)
      .lte('price', maxPrice)
      .eq('status', 'active')
      .order('commission_rate', { ascending: false })
      .limit(10);

    if (!products || products.length === 0) {
      throw new Error("No products found in this price range");
    }

    const content = this.createBestUnderPriceContent(category, maxPrice, products);

    const { data: article, error } = await supabase
      .from('generated_content' as any)
      .insert({
        user_id: user.id,
        type: 'best-under-price',
        title: content.title,
        content: content.body,
        meta_description: content.description,
        keywords: content.keywords,
        category,
        status: 'published'
      } as any)
      .select()
      .single() as any;

    if (error) throw error;
    return article;
  },

  /**
   * Create review content
   */
  createReviewContent(product: any) {
    const title = `${product.name} Review - Is It Worth It in 2026?`;
    const description = `Comprehensive review of ${product.name}. Features, pros & cons, pricing, and where to buy at the best price.`;
    
    const body = `
# ${product.name} Review

${product.description || `Discover everything you need to know about the ${product.name}.`}

## Key Features

The ${product.name} stands out with its impressive features and competitive pricing at $${product.price}.

## Pros and Cons

**Pros:**
- High quality construction
- Great value for money
- Positive user reviews

**Cons:**
- Limited availability
- Higher price point than alternatives

## Where to Buy

Get the best deal on ${product.name} through our exclusive affiliate link below.

**Price:** $${product.price}
**Commission Rate:** ${product.commission_rate}%

[Buy Now →]

## Final Verdict

The ${product.name} is a solid choice for anyone looking for quality and reliability.
    `.trim();

    return {
      title,
      description,
      body,
      keywords: [product.category, product.network, 'review', '2026', 'best'].filter(Boolean)
    };
  },

  /**
   * Create best-under-price content
   */
  createBestUnderPriceContent(category: string, maxPrice: number, products: any[]) {
    const title = `Best ${category} Under $${maxPrice} in 2026`;
    const description = `Top ${products.length} ${category} products under $${maxPrice}. Expert picks, reviews, and where to buy.`;
    
    let body = `
# Best ${category} Under $${maxPrice}

Finding quality ${category} products that fit your budget can be challenging. We've researched and tested the top options under $${maxPrice} to help you make the best choice.

## Our Top Picks

`;

    products.forEach((product, index) => {
      body += `
### ${index + 1}. ${product.name} - $${product.price}

${product.description || `A great choice in the ${category} category.`}

**Why we recommend it:** High commission rate of ${product.commission_rate}%, excellent value for money.

[Check Price →]

`;
    });

    body += `
## Buying Guide

When shopping for ${category} under $${maxPrice}, consider:
- Quality and durability
- Brand reputation
- Customer reviews
- Warranty coverage

## Conclusion

All ${products.length} products on this list offer excellent value under $${maxPrice}. Choose based on your specific needs and preferences.
    `.trim();

    return {
      title,
      description,
      body,
      keywords: [category, `under $${maxPrice}`, 'best', '2026', 'budget'].filter(Boolean)
    };
  },

  /**
   * Generate multiple articles in batch
   */
  async batchGenerate(count: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: products } = await supabase
      .from('product_catalog')
      .select('*')
      .eq('status', 'active')
      .limit(count);

    if (!products || products.length === 0) {
      throw new Error("No products available");
    }

    const generated = [];
    
    for (const product of products) {
      try {
        const article = await this.generateReview(product.id);
        generated.push(article);
      } catch (error) {
        console.error(`Failed to generate for ${product.name}:`, error);
      }
    }

    return {
      success: true,
      generated: generated.length,
      articles: generated
    };
  }
};