import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TrendingUp, ExternalLink, ShoppingCart, Loader2 } from "lucide-react";

interface TrendingProduct {
  id: string;
  title: string;
  body: string;
  network: string;
  slug: string;
  clicks: number;
  created_at: string;
}

export default function TrendingProductsPage() {
  const [products, setProducts] = useState<TrendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchTrendingProducts();
  }, []);

  const fetchTrendingProducts = async () => {
    setIsLoading(true);
    try {
      const { data: content } = await supabase
        .from("generated_content")
        .select("id, title, body, clicks, created_at")
        .eq("status", "published")
        .order("clicks", { ascending: false })
        .limit(50);

      if (content) {
        const productsWithMeta = content.map(item => {
          // Extract slug from markdown link format: [Get Product Now](/go/slug)
          const linkMatch = item.body?.match(/\[.*?\]\(\/go\/([^)]+)\)/);
          const slug = linkMatch ? linkMatch[1] : "";
          
          let network = "Unknown";
          if (item.body?.includes("Amazon")) network = "Amazon";
          else if (item.body?.includes("Temu")) network = "Temu";
          else if (item.body?.includes("AliExpress")) network = "AliExpress";

          return {
            id: item.id,
            title: item.title,
            body: item.body || "",
            network,
            slug,
            clicks: item.clicks || 0,
            created_at: item.created_at
          };
        });

        setProducts(productsWithMeta.filter(p => p.slug));
      }
    } catch (error) {
      console.error("Error fetching trending products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = filter === "all" 
    ? products 
    : products.filter(p => p.network.toLowerCase() === filter.toLowerCase());

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case "amazon": return "bg-orange-500";
      case "temu": return "bg-purple-500";
      case "aliexpress": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const extractDescription = (body: string) => {
    const lines = body.split("\n").filter(line => line.trim() && !line.includes("[Get"));
    return lines.slice(1, 3).join(" ").substring(0, 150) + "...";
  };

  return (
    <>
      <SEO 
        title="Trending Products - Top Deals from Amazon, Temu & AliExpress"
        description="Discover the hottest trending products with exclusive deals from Amazon, Temu, and AliExpress. Updated daily with the best offers."
        image="/og-image.png"
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <TrendingUp className="h-10 w-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-bold">
                  Trending Products
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Discover the hottest deals from Amazon, Temu, and AliExpress. Updated daily with products people are loving right now.
              </p>
            </div>
          </section>

          {/* Filter Bar */}
          <section className="border-b bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex flex-wrap gap-3 items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  size="sm"
                >
                  All Networks
                </Button>
                <Button
                  variant={filter === "amazon" ? "default" : "outline"}
                  onClick={() => setFilter("amazon")}
                  size="sm"
                >
                  Amazon
                </Button>
                <Button
                  variant={filter === "temu" ? "default" : "outline"}
                  onClick={() => setFilter("temu")}
                  size="sm"
                >
                  Temu
                </Button>
                <Button
                  variant={filter === "aliexpress" ? "default" : "outline"}
                  onClick={() => setFilter("aliexpress")}
                  size="sm"
                >
                  AliExpress
                </Button>
              </div>
            </div>
          </section>

          {/* Products Grid */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-20">
                  <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">No products found</h3>
                  <p className="text-muted-foreground">
                    {filter === "all" 
                      ? "No trending products available yet. Check back soon!"
                      : `No ${filter} products available. Try another filter.`
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-semibold">
                      {filteredProducts.length} {filter === "all" ? "Trending" : filter} Products
                    </h2>
                    <div className="text-sm text-muted-foreground">
                      Sorted by popularity
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                      <Card key={product.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                        <CardContent className="p-6">
                          {/* Network Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <Badge className={`${getNetworkColor(product.network)} text-white`}>
                              {product.network}
                            </Badge>
                            {product.clicks > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                {product.clicks} clicks
                              </div>
                            )}
                          </div>

                          {/* Product Title */}
                          <h3 className="text-lg font-semibold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.title.replace(` - Trending on ${product.network}`, "")}
                          </h3>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                            {extractDescription(product.body)}
                          </p>

                          {/* CTA Button */}
                          <a
                            href={`/go/${product.slug}`}
                            className="block"
                            target="_blank"
                            rel="noopener sponsored nofollow"
                          >
                            <Button className="w-full group-hover:shadow-md transition-shadow" size="lg">
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Get This Deal
                              <ExternalLink className="ml-2 h-4 w-4" />
                            </Button>
                          </a>

                          {/* Timestamp */}
                          <div className="mt-4 text-xs text-muted-foreground text-center">
                            Added {new Date(product.created_at).toLocaleDateString()}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-primary/5 py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Never Miss a Hot Deal
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                New trending products added daily. Bookmark this page to stay updated on the latest deals.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" onClick={() => window.location.reload()}>
                  Refresh Products
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
                  Back to Top
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}