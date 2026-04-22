import { useState, useEffect } from "react";
import { ProductLink, InlineProductLink, ProductBox } from "@/components/ProductLink";
import { getAllProducts, getTrendingProducts, type Product } from "@/config/products";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

/**
 * Test Page for Database-Connected Affiliate Link System
 * Visit: /test-simple-links
 */
export default function TestSimpleLinksPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [allProducts, trendingProducts] = await Promise.all([
        getAllProducts(5),
        getTrendingProducts(3)
      ]);
      setProducts(allProducts);
      setTrending(trendingProducts);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading products from database...</p>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="mt-8 text-center">
            <h1 className="text-2xl font-bold mb-4">No Products Found</h1>
            <p className="text-muted-foreground mb-6">
              No active products in your database yet. Add some products first!
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const firstProduct = products[0];
  const secondProduct = products[1] || firstProduct;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mt-4 mb-2">
            Database-Connected Affiliate Links
          </h1>
          <p className="text-muted-foreground">
            Real products from your auto-discovery system with dynamic SEO
          </p>
        </div>

        {/* Test Cases */}
        <div className="space-y-12">
          {/* 1. Product Link Button */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Product Link Button</h2>
            <p className="text-muted-foreground">
              Simple button that links to product via /go/[slug] with click tracking
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <ProductLink slug={firstProduct.slug} />
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {`<ProductLink slug="${firstProduct.slug}" />`}
            </pre>
          </section>

          {/* 2. Inline Product Link */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Inline Product Link</h2>
            <p className="text-muted-foreground">
              Link within text content
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <p className="text-lg">
                Check out <InlineProductLink slug={firstProduct.slug} /> for amazing deals!
              </p>
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {`Check out <InlineProductLink slug="${firstProduct.slug}" /> for amazing deals!`}
            </pre>
          </section>

          {/* 3. Product Box */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Product Box</h2>
            <p className="text-muted-foreground">
              Full product showcase box with SEO-rich data
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <ProductBox slug={secondProduct.slug} />
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {`<ProductBox slug="${secondProduct.slug}" />`}
            </pre>
          </section>

          {/* 4. Trending Products */}
          {trending.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Trending Products (Most Clicks)</h2>
              <p className="text-muted-foreground">
                Auto-fetched from database based on click performance
              </p>
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                {trending.map(product => (
                  <ProductBox key={product.id} slug={product.slug} />
                ))}
              </div>
            </section>
          )}

          {/* 5. All Active Products */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. All Active Products</h2>
            <p className="text-muted-foreground">
              Latest products from your affiliate system
            </p>
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              {products.slice(0, 3).map(product => (
                <ProductBox key={product.id} slug={product.slug} />
              ))}
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-4 bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <h2 className="text-2xl font-semibold">✨ Real Database Integration</h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold mb-1">🔗 Auto-Discovery</h3>
                <p className="text-muted-foreground">
                  Products are automatically discovered and added to your database via the autopilot system
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">📊 Real-Time Data</h3>
                <p className="text-muted-foreground">
                  Components fetch live data from <code className="bg-muted px-2 py-1 rounded">affiliate_links</code> table with click counts and status
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">🎯 SEO Optimized</h3>
                <p className="text-muted-foreground">
                  Each product page generates dynamic meta tags with product name and description for better SEO
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">📈 Click Tracking</h3>
                <p className="text-muted-foreground">
                  All clicks are tracked automatically through <code className="bg-muted px-2 py-1 rounded">/go/[slug]</code> routing
                </p>
              </div>
            </div>
          </section>

          {/* Usage Guide */}
          <section className="space-y-4 bg-muted/50 rounded-lg p-6">
            <h2 className="text-2xl font-semibold">How to Use</h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold mb-1">1. Import Components</h3>
                <pre className="bg-background p-3 rounded mt-2 text-xs overflow-x-auto">
                  {`import { ProductLink, ProductBox } from "@/components/ProductLink";`}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Use Product Slug</h3>
                <pre className="bg-background p-3 rounded mt-2 text-xs overflow-x-auto">
                  {`<ProductLink slug="your-product-slug-from-database" />
<ProductBox slug="your-product-slug-from-database" />`}
                </pre>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. That's It!</h3>
                <p className="text-muted-foreground">
                  Components automatically fetch product data, track clicks, and provide SEO benefits
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Stats */}
        <div className="mt-12 p-6 bg-card border border-border rounded-lg">
          <h3 className="font-semibold mb-4">📊 Database Stats:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Active Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + (p.clicks || 0), 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Trending</p>
              <p className="text-2xl font-bold">{trending.length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Conversions</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + (p.conversions || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}