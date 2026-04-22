import { ProductLink, InlineProductLink, ProductBox } from "@/components/ProductLink";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Test Page for Simple Affiliate Link System
 * Visit: /test-simple-links
 */
export default function TestSimpleLinksPage() {
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
            Simple Affiliate Link System
          </h1>
          <p className="text-muted-foreground">
            Test the new lightweight affiliate link embedding system
          </p>
        </div>

        {/* Test Cases */}
        <div className="space-y-12">
          {/* 1. Product Link Button */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Product Link Button</h2>
            <p className="text-muted-foreground">
              Simple button that links to product via /go/[slug]
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <ProductLink productId="prod_001" />
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {`<ProductLink productId="prod_001" />`}
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
                Check out <InlineProductLink productId="prod_001" /> for amazing deals!
              </p>
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {`Check out <InlineProductLink productId="prod_001" /> for amazing deals!`}
            </pre>
          </section>

          {/* 3. Product Box */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Product Box</h2>
            <p className="text-muted-foreground">
              Full product showcase box
            </p>
            <div className="bg-card border border-border rounded-lg p-6">
              <ProductBox productId="prod_002" />
            </div>
            <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
              {`<ProductBox productId="prod_002" />`}
            </pre>
          </section>

          {/* 4. Multiple Products */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Multiple Products</h2>
            <p className="text-muted-foreground">
              Embed multiple products in content
            </p>
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <ProductBox productId="prod_001" />
              <ProductBox productId="prod_002" />
            </div>
          </section>

          {/* 5. Variants */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Button Variants</h2>
            <p className="text-muted-foreground">
              Different styles for different contexts
            </p>
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Default:</p>
                <ProductLink productId="prod_001" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Outline:</p>
                <ProductLink productId="prod_001" variant="outline" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Ghost:</p>
                <ProductLink productId="prod_001" variant="ghost" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Large Size:</p>
                <ProductLink productId="prod_001" size="lg" />
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="space-y-4 bg-primary/5 border-2 border-primary/20 rounded-lg p-6">
            <h2 className="text-2xl font-semibold">How It Works</h2>
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold mb-1">1. Add Products</h3>
                <p className="text-muted-foreground">
                  Edit <code className="bg-muted px-2 py-1 rounded">src/config/products.ts</code> to add your products with their tracking slugs
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">2. Use Components</h3>
                <p className="text-muted-foreground">
                  Import and use ProductLink, InlineProductLink, or ProductBox in any page/component
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">3. Tracking Works Automatically</h3>
                <p className="text-muted-foreground">
                  All links use your existing <code className="bg-muted px-2 py-1 rounded">/go/[slug]</code> routing for click tracking
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Test Links */}
        <div className="mt-12 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-4">Test the Links:</h3>
          <div className="space-y-2 text-sm">
            <p>1. Click any product link above</p>
            <p>2. It should redirect via /go/[slug]</p>
            <p>3. Check tracking in your analytics</p>
          </div>
        </div>
      </div>
    </div>
  );
}