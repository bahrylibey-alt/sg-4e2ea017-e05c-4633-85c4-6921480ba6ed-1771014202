/**
 * Product Database for Affiliate Links
 * Add your products here with their tracking slugs
 */

export interface Product {
  id: string;
  name: string;
  slug: string;
  buttonText?: string;
  description?: string;
}

export const PRODUCTS: Record<string, Product> = {
  prod_001: {
    id: "prod_001",
    name: "Product One",
    slug: "fd590482-b702-40b6-874f-15660f71ddc5",
    buttonText: "Get This Product Now →",
    description: "Amazing product description"
  },
  prod_002: {
    id: "prod_002",
    name: "Product Two",
    slug: "2cdabf72-cbc7-4723-a624-62fb3854c283",
    buttonText: "Get This Product Now →",
    description: "Another great product"
  }
};

/**
 * Get product by ID
 */
export function getProduct(productId: string): Product | undefined {
  return PRODUCTS[productId];
}

/**
 * Get all products
 */
export function getAllProducts(): Product[] {
  return Object.values(PRODUCTS);
}

/**
 * Get product URL (integrates with existing /go/[slug] routing)
 */
export function getProductUrl(productId: string): string {
  const product = PRODUCTS[productId];
  if (!product) return "#";
  return `/go/${product.slug}`;
}