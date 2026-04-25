import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, TrendingUp, Search, CheckCircle2, XCircle, Loader2, AlertCircle, ExternalLink, ShoppingCart, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DiscoveredProduct {
  name: string;
  category: string;
  trend_score: number;
  why_trending: string;
  target_audience: string;
  affiliate_potential: string;
  price_range: string;
  amazon_search_term: string;
  aliexpress_search_term: string;
  current_trend_data: string;
  amazon_url?: string;
  aliexpress_url?: string;
}

export default function TestAIDiscovery() {
  const { toast } = useToast();
  const [niche, setNiche] = useState("Smart Home Devices");
  const [productCount, setProductCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<DiscoveredProduct[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [testMode, setTestMode] = useState<'ai' | 'demo'>('demo');

  // Check for OpenAI API key
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('openai_api_key');
      setHasApiKey(!!key);
      setTestMode(key ? 'ai' : 'demo');
    }
  }, []);

  const niches = [
    "Smart Home Devices",
    "Kitchen Gadgets",
    "Fitness & Health",
    "Tech Accessories",
    "Beauty & Skincare",
    "Pet Products",
    "Office Productivity",
    "Gaming Accessories",
    "Sustainable Living",
    "Baby & Parenting"
  ];

  const currentYear = new Date().getFullYear();

  const discoverProducts = async () => {
    setLoading(true);
    setProducts([]);

    try {
      if (testMode === 'ai' && hasApiKey) {
        // Use real AI discovery
        const apiKey = localStorage.getItem('openai_api_key');
        
        const response = await fetch('/api/ai/discover-products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openai-key': apiKey || ''
          },
          body: JSON.stringify({
            niche,
            count: productCount,
            use_ai: true
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to discover products');
        }

        // Extract products with affiliate URLs
        const discoveredProducts = data.products.map((p: any) => ({
          name: p.name,
          category: p.category,
          trend_score: p.trend_score || 85,
          why_trending: p.description || p.metadata?.why_trending || 'Currently trending',
          target_audience: p.target_audience || 'General consumers',
          affiliate_potential: p.metadata?.affiliate_potential || 'high',
          price_range: p.metadata?.price_range || `$${p.price || 50}-$${(p.price || 50) * 2}`,
          amazon_search_term: p.metadata?.amazon_url || p.name,
          aliexpress_search_term: p.metadata?.aliexpress_url || p.name,
          current_trend_data: p.metadata?.current_trend_data || 'Trending now',
          amazon_url: p.metadata?.amazon_url || p.affiliate_url,
          aliexpress_url: p.metadata?.aliexpress_url
        }));

        setProducts(discoveredProducts);

        toast({
          title: "AI Discovery Complete!",
          description: `Found ${discoveredProducts.length} trending ${niche} products using OpenAI`,
        });
      } else {
        // Demo mode - simulated AI results
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay

        const demoProducts: DiscoveredProduct[] = [
          {
            name: `AI-Powered Smart ${niche} Hub ${currentYear}`,
            category: niche,
            trend_score: 95,
            why_trending: `Featured at CES ${currentYear}, viral on TikTok with 50M+ views, AI integration breakthrough`,
            target_audience: "Tech-savvy early adopters, smart home enthusiasts",
            affiliate_potential: "high",
            price_range: "$89-$179",
            amazon_search_term: `ai smart ${niche.toLowerCase()} ${currentYear}`,
            aliexpress_search_term: `ai ${niche.toLowerCase()} automation`,
            current_trend_data: `Google Trends: +280% spike in last 30 days, 40K+ Pinterest saves this week, Amazon Best Seller #3`,
            amazon_url: `https://www.amazon.com/s?k=ai+smart+${niche.toLowerCase().replace(/\s+/g, '+')}+${currentYear}&tag=yourstore-20`,
            aliexpress_url: `https://www.aliexpress.com/wholesale?SearchText=ai+${niche.toLowerCase().replace(/\s+/g, '+')}`
          },
          {
            name: `Ultra Premium ${niche} Pro ${currentYear} Edition`,
            category: niche,
            trend_score: 92,
            why_trending: `Influencer-endorsed (15M+ reach), Instagram viral (20M views), Premium quality movement in ${currentYear}`,
            target_audience: "Premium buyers, quality-focused consumers, professionals",
            affiliate_potential: "high",
            price_range: "$149-$299",
            amazon_search_term: `premium ${niche.toLowerCase()} ${currentYear} professional`,
            aliexpress_search_term: `luxury ${niche.toLowerCase()} pro`,
            current_trend_data: `YouTube: 800K+ review views, Reddit: Trending on r/BuyItForLife, 5-star rating surge`,
            amazon_url: `https://www.amazon.com/s?k=premium+${niche.toLowerCase().replace(/\s+/g, '+')}+${currentYear}&tag=yourstore-20`,
            aliexpress_url: `https://www.aliexpress.com/wholesale?SearchText=premium+${niche.toLowerCase().replace(/\s+/g, '+')}`
          },
          {
            name: `Eco-Friendly Sustainable ${niche} ${currentYear}`,
            category: niche,
            trend_score: 89,
            why_trending: `Earth Day ${currentYear} movement, carbon-neutral certified, Gen-Z sustainability trend`,
            target_audience: "Eco-conscious millennials, Gen-Z consumers, sustainability advocates",
            affiliate_potential: "high",
            price_range: "$59-$119",
            amazon_search_term: `eco friendly ${niche.toLowerCase()} sustainable ${currentYear}`,
            aliexpress_search_term: `green ${niche.toLowerCase()} eco`,
            current_trend_data: `TikTok: 100K+ #sustainability mentions, Pinterest: Trending in Eco Living, 4.8★ rating`,
            amazon_url: `https://www.amazon.com/s?k=eco+friendly+${niche.toLowerCase().replace(/\s+/g, '+')}+sustainable&tag=yourstore-20`,
            aliexpress_url: `https://www.aliexpress.com/wholesale?SearchText=eco+${niche.toLowerCase().replace(/\s+/g, '+')}`
          },
          {
            name: `Compact Space-Saving ${niche} ${currentYear}`,
            category: niche,
            trend_score: 86,
            why_trending: `Urban living trend, tiny home movement in ${currentYear}, minimalism surge`,
            target_audience: "Urban apartment dwellers, minimalists, small space owners",
            affiliate_potential: "medium",
            price_range: "$39-$79",
            amazon_search_term: `compact ${niche.toLowerCase()} space saving`,
            aliexpress_search_term: `mini ${niche.toLowerCase()} portable`,
            current_trend_data: `Google Trends: "compact ${niche.toLowerCase()}" +150%, Featured in Apartment Therapy, 12K+ saves`,
            amazon_url: `https://www.amazon.com/s?k=compact+${niche.toLowerCase().replace(/\s+/g, '+')}+space+saving&tag=yourstore-20`,
            aliexpress_url: `https://www.aliexpress.com/wholesale?SearchText=compact+${niche.toLowerCase().replace(/\s+/g, '+')}`
          },
          {
            name: `Smart App-Connected ${niche} ${currentYear}`,
            category: niche,
            trend_score: 93,
            why_trending: `IoT expansion in ${currentYear}, smart home integration breakthrough, app control trending`,
            target_audience: "Smart home users, tech enthusiasts, connected home owners",
            affiliate_potential: "high",
            price_range: "$99-$199",
            amazon_search_term: `smart app ${niche.toLowerCase()} wifi ${currentYear}`,
            aliexpress_search_term: `app control ${niche.toLowerCase()} bluetooth`,
            current_trend_data: `App Store: Top 10 in Home category, Smart Home Expo ${currentYear} featured, Twitter: 25K+ mentions`,
            amazon_url: `https://www.amazon.com/s?k=smart+app+${niche.toLowerCase().replace(/\s+/g, '+')}+wifi&tag=yourstore-20`,
            aliexpress_url: `https://www.aliexpress.com/wholesale?SearchText=smart+${niche.toLowerCase().replace(/\s+/g, '+')}`
          }
        ];

        setProducts(demoProducts.slice(0, productCount));

        toast({
          title: "Demo Discovery Complete!",
          description: `Found ${productCount} simulated trending products. Add OpenAI key for real AI discovery.`,
        });
      }
    } catch (error) {
      console.error('Product discovery error:', error);
      toast({
        title: "Discovery Failed",
        description: error instanceof Error ? error.message : "Failed to discover products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendBadge = (score: number) => {
    if (score >= 90) return { label: "🔥 Viral", color: "bg-red-500" };
    if (score >= 85) return { label: "⚡ Hot", color: "bg-orange-500" };
    if (score >= 80) return { label: "📈 Trending", color: "bg-yellow-500" };
    return { label: "📊 Growing", color: "bg-blue-500" };
  };

  return (
    <>
      <SEO 
        title="AI Product Discovery Test - AffiliatePro"
        description="Test real AI product discovery with trending 2026 products"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Sparkles className="h-8 w-8" />
              AI Product Discovery Test
            </h1>
            <p className="text-muted-foreground">
              Discover real trending products from {currentYear} using AI
            </p>
          </div>

          {/* Mode Indicator */}
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {hasApiKey ? (
                <span>
                  <Badge variant="default" className="mr-2">AI Mode</Badge>
                  Using OpenAI to discover real trending products from {currentYear}
                </span>
              ) : (
                <span>
                  <Badge variant="secondary" className="mr-2">Demo Mode</Badge>
                  Using simulated trending data. Add your OpenAI API key in <Link href="/settings" className="text-primary hover:underline">Settings</Link> for real AI discovery.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Discovery Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Product Discovery Settings</CardTitle>
              <CardDescription>
                Configure AI to find trending {currentYear} products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <Label htmlFor="niche">Product Niche</Label>
                  <Select value={niche} onValueChange={setNiche}>
                    <SelectTrigger id="niche">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map(n => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="count">Number of Products</Label>
                  <Select value={productCount.toString()} onValueChange={(v) => setProductCount(parseInt(v))}>
                    <SelectTrigger id="count">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Products</SelectItem>
                      <SelectItem value="5">5 Products</SelectItem>
                      <SelectItem value="10">10 Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="mode">Discovery Mode</Label>
                  <Select value={testMode} onValueChange={(v) => setTestMode(v as 'ai' | 'demo')} disabled={!hasApiKey}>
                    <SelectTrigger id="mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ai">AI Mode (Real OpenAI)</SelectItem>
                      <SelectItem value="demo">Demo Mode (Simulated)</SelectItem>
                    </SelectContent>
                  </Select>
                  {!hasApiKey && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Add API key to enable AI mode
                    </p>
                  )}
                </div>
              </div>

              <Button 
                onClick={discoverProducts} 
                disabled={loading}
                size="lg"
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Discovering Trending Products...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Discover {productCount} Trending {niche} Products
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {products.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">
                  Discovered Products ({products.length})
                </h2>
                <Badge variant="outline" className="text-sm">
                  {testMode === 'ai' ? '🤖 AI Powered' : '🎭 Demo Mode'}
                </Badge>
              </div>

              {products.map((product, index) => {
                const trendBadge = getTrendBadge(product.trend_score);
                return (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold">{product.name}</h3>
                            <Badge className={`${trendBadge.color} text-white`}>
                              {trendBadge.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4" />
                              Score: {product.trend_score}/100
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {product.price_range}
                            </span>
                            <Badge variant="secondary">{product.category}</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Why Trending:</h4>
                          <p className="text-sm text-muted-foreground">{product.why_trending}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Current Data:</h4>
                          <p className="text-sm text-muted-foreground">{product.current_trend_data}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Target Audience:</h4>
                          <p className="text-sm text-muted-foreground">{product.target_audience}</p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">Affiliate Potential:</h4>
                          <Badge variant={product.affiliate_potential === 'high' ? 'default' : 'secondary'}>
                            {product.affiliate_potential.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {product.amazon_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={product.amazon_url} target="_blank" rel="noopener noreferrer">
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Amazon
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                        {product.aliexpress_url && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={product.aliexpress_url} target="_blank" rel="noopener noreferrer">
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              AliExpress
                              <ExternalLink className="ml-2 h-3 w-3" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Instructions */}
          <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
            <h3 className="font-bold mb-3">🚀 How It Works</h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong>Demo Mode (Current):</strong>
                <ul className="list-disc list-inside mt-1 ml-4 space-y-1 text-muted-foreground">
                  <li>Uses realistic {currentYear} trending product data</li>
                  <li>Simulates AI discovery patterns</li>
                  <li>Shows how real AI discovery works</li>
                  <li>No API costs or setup required</li>
                </ul>
              </div>
              <div>
                <strong>AI Mode (With API Key):</strong>
                <ul className="list-disc list-inside mt-1 ml-4 space-y-1 text-muted-foreground">
                  <li>Add OpenAI API key in <Link href="/settings" className="text-primary hover:underline">Settings → API Keys</Link></li>
                  <li>Uses real GPT-4o-mini for product research</li>
                  <li>Discovers actual trending products from {currentYear}</li>
                  <li>Provides real trend data and market insights</li>
                  <li>Finds products across Amazon, AliExpress, and more</li>
                </ul>
              </div>
            </div>
          </Card>
        </main>
        <Footer />
      </div>
    </>
  );
}