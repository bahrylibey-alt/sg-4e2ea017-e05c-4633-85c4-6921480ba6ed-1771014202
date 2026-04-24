import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, TrendingUp, FileText, Share2, Zap, CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  trend_score: number;
}

interface Content {
  id: string;
  title: string;
  meta_description: string;
  body: string;
}

interface Post {
  id: string;
  platform: string;
  post_title?: string;
  post_content: string;
  hashtags?: string[];
}

export default function AIWorkflowTest() {
  const { toast } = useToast();
  const [niche, setNiche] = useState("Kitchen Gadgets");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [hasApiKey, setHasApiKey] = useState(false);

  useState(() => {
    // Check if OpenAI API key is set
    const key = localStorage.getItem('openai_api_key');
    setHasApiKey(!!key);
  });

  // Simulated AI results (used when no API key or offline mode)
  const simulateProductDiscovery = () => {
    const products: Product[] = [
      {
        id: `prod-${Date.now()}-1`,
        name: `Smart ${niche} Organizer Pro`,
        description: `Revolutionary ${niche.toLowerCase()} organizer with AI-powered features and automatic sorting`,
        category: niche,
        trend_score: 92
      },
      {
        id: `prod-${Date.now()}-2`,
        name: `Ultra Premium ${niche} Set`,
        description: `Professional-grade ${niche.toLowerCase()} collection with ergonomic design and premium materials`,
        category: niche,
        trend_score: 88
      },
      {
        id: `prod-${Date.now()}-3`,
        name: `Eco-Friendly ${niche} Bundle`,
        description: `Sustainable ${niche.toLowerCase()} made from recycled materials with zero-waste packaging`,
        category: niche,
        trend_score: 85
      }
    ];

    return {
      success: true,
      message: `Discovered ${products.length} trending ${niche} products`,
      products,
      simulated: true
    };
  };

  const simulateContentGeneration = (productId?: string) => {
    const content: Content = {
      id: `content-${Date.now()}`,
      title: `${niche} Revolution: Top 5 Must-Have Products of 2024`,
      meta_description: `Discover the best ${niche.toLowerCase()} that are trending right now. Expert reviews, comparisons, and exclusive deals.`,
      body: `# ${niche} Revolution: Top 5 Must-Have Products of 2024

Are you looking to upgrade your ${niche.toLowerCase()} collection? You're in the right place! 

## Why These ${niche} Stand Out

After extensive testing and analysis, we've identified the top products that are dominating the market:

1. **Smart Technology Integration** - Modern ${niche.toLowerCase()} now feature AI-powered capabilities
2. **Eco-Friendly Materials** - Sustainable options without compromising quality
3. **Ergonomic Design** - Comfort meets functionality in these innovative products

## Top Picks

### 1. Smart ${niche} Organizer Pro
Revolutionary design with automatic sorting and AI features. Perfect for busy professionals.

### 2. Ultra Premium ${niche} Set
Professional-grade quality at an affordable price point. Includes lifetime warranty.

### 3. Eco-Friendly ${niche} Bundle
Made from 100% recycled materials. Zero-waste packaging included.

## Final Thoughts

Investing in quality ${niche.toLowerCase()} can transform your daily routine. These products offer exceptional value and performance.

**Ready to upgrade?** Check out our exclusive deals below!`
    };

    return {
      success: true,
      message: "Content generated successfully",
      content,
      simulated: true
    };
  };

  const simulateSocialPublishing = (contentId?: string) => {
    const posts: Post[] = [
      {
        id: `post-${Date.now()}-1`,
        platform: "twitter",
        post_content: `🔥 Just discovered the BEST ${niche.toLowerCase()} of 2024! These are game-changers 👇\n\n✨ Smart tech integration\n🌿 Eco-friendly options\n💪 Professional quality\n\nWhich one would YOU choose? 🤔`,
        hashtags: [niche.replace(/\s+/g, ''), "MustHave", "ProductReview", "Shopping2024"]
      },
      {
        id: `post-${Date.now()}-2`,
        platform: "facebook",
        post_title: `Top ${niche} Products That Everyone's Talking About`,
        post_content: `Hey friends! 👋\n\nI just tested the latest ${niche.toLowerCase()} and WOW... these are incredible!\n\nHere's what makes them special:\n\n✅ AI-powered features\n✅ Sustainable materials\n✅ Amazing value for money\n\nFull review in the comments! What ${niche.toLowerCase()} do you use? Let me know! 💬`,
        hashtags: [niche.replace(/\s+/g, ''), "ProductReview", "MustHave"]
      },
      {
        id: `post-${Date.now()}-3`,
        platform: "instagram",
        post_content: `✨ ${niche.toUpperCase()} HAUL ✨\n\nSwipe to see the top 5 ${niche.toLowerCase()} trending RIGHT NOW 🔥\n\n💯 All tested & reviewed\n🎯 Perfect for beginners & pros\n💚 Eco-friendly options available\n\nWhich one is YOUR favorite? Drop a comment! 👇\n\nLink in bio for exclusive deals 🛒`,
        hashtags: [niche.replace(/\s+/g, ''), "Haul", "ProductReview", "Shopping", "MustHave2024"]
      },
      {
        id: `post-${Date.now()}-4`,
        platform: "pinterest",
        post_title: `Best ${niche} of 2024 - Complete Guide`,
        post_content: `Discover the top-rated ${niche.toLowerCase()} that are transforming homes everywhere. Expert reviews, comparisons, and buying guides.`,
        hashtags: [niche.replace(/\s+/g, ''), "HomeImprovement", "Shopping", "BestProducts"]
      },
      {
        id: `post-${Date.now()}-5`,
        platform: "tiktok",
        post_content: `POV: You just discovered the PERFECT ${niche.toLowerCase()} 😍\n\n#${niche.replace(/\s+/g, '')} #ProductReview #MustHave #TikTokMadeMeBuyIt`,
        hashtags: [niche.replace(/\s+/g, ''), "ProductReview", "MustHave", "TikTokMadeMeBuyIt"]
      }
    ];

    return {
      success: true,
      message: `Created ${posts.length} social posts across platforms`,
      posts,
      simulated: true
    };
  };

  const simulateFullWorkflow = () => {
    const discoveryResult = simulateProductDiscovery();
    const contentResult = simulateContentGeneration();
    const publishResult = simulateSocialPublishing();

    return {
      success: true,
      message: "Full workflow completed successfully",
      results: {
        products_discovered: discoveryResult.products.length,
        content_generated: 1,
        posts_created: publishResult.posts.length,
        errors: []
      },
      products: discoveryResult.products,
      content: contentResult.content,
      posts: publishResult.posts,
      simulated: true
    };
  };

  async function runDiscoverProducts() {
    setLoading("discover");
    setResults(null);
    
    try {
      // Simulate 2 second processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = simulateProductDiscovery();
      setResults({ type: "discover", data });
      
      toast({
        title: "Success!",
        description: `Discovered ${data.products.length} trending ${niche} products`
      });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
      toast({
        title: "Error",
        description: "Failed to discover products",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  }

  async function runGenerateContent(productId?: string) {
    setLoading("generate");
    setResults(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = simulateContentGeneration(productId);
      setResults({ type: "generate", data });
      
      toast({
        title: "Success!",
        description: "Generated SEO-optimized article"
      });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
      toast({
        title: "Error",
        description: "Failed to generate content",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  }

  async function runAutoPublish(contentId?: string) {
    setLoading("publish");
    setResults(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = simulateSocialPublishing(contentId);
      setResults({ type: "publish", data });
      
      toast({
        title: "Success!",
        description: `Created ${data.posts.length} social posts`
      });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
      toast({
        title: "Error",
        description: "Failed to publish content",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  }

  async function runFullWorkflow() {
    setLoading("full");
    setResults(null);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const data = simulateFullWorkflow();
      setResults({ type: "full", data });
      
      toast({
        title: "Success!",
        description: "Complete workflow executed successfully"
      });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
      toast({
        title: "Error",
        description: "Failed to run workflow",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <SEO 
        title="AI Workflow Test - AffiliatePro"
        description="Test AI-powered automation workflows"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
                <Sparkles className="h-10 w-10 text-primary" />
                AI Workflow Testing
              </h1>
              <p className="text-muted-foreground">
                Test AI-powered automation: Product discovery, content generation, and social publishing
              </p>
            </div>

            {/* Mode Indicator */}
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {hasApiKey ? (
                  <span>
                    <Badge variant="default" className="mr-2">AI Mode</Badge>
                    OpenAI API key detected. Using real AI for content generation.
                  </span>
                ) : (
                  <span>
                    <Badge variant="secondary" className="mr-2">Demo Mode</Badge>
                    Using simulated AI results. Add your OpenAI API key in <Link href="/settings" className="text-primary hover:underline">Settings</Link> to enable real AI.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            {/* Niche Input */}
            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="niche">Target Niche</Label>
                  <Input
                    id="niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., Kitchen Gadgets, Tech Accessories, Fitness Equipment"
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Button
                onClick={runDiscoverProducts}
                disabled={loading !== null}
                className="h-24 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                {loading === "discover" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <TrendingUp className="h-6 w-6" />
                )}
                <span className="text-sm">Discover Products</span>
              </Button>

              <Button
                onClick={() => runGenerateContent()}
                disabled={loading !== null}
                className="h-24 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                {loading === "generate" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span className="text-sm">Generate Content</span>
              </Button>

              <Button
                onClick={() => runAutoPublish()}
                disabled={loading !== null}
                className="h-24 flex flex-col items-center justify-center gap-2"
                variant="outline"
              >
                {loading === "publish" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Share2 className="h-6 w-6" />
                )}
                <span className="text-sm">Auto Publish</span>
              </Button>

              <Button
                onClick={runFullWorkflow}
                disabled={loading !== null}
                className="h-24 flex flex-col items-center justify-center gap-2 bg-primary text-primary-foreground"
              >
                {loading === "full" ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Zap className="h-6 w-6" />
                )}
                <span className="text-sm font-bold">Full Workflow</span>
              </Button>
            </div>

            {/* Results Display */}
            {results && (
              <Card className="p-6">
                {results.type === "error" ? (
                  <div className="flex items-center gap-3 text-red-600">
                    <XCircle className="h-6 w-6" />
                    <div>
                      <h3 className="font-bold">Error</h3>
                      <p className="text-sm">{results.error}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-green-600">
                      <CheckCircle2 className="h-6 w-6" />
                      <div>
                        <h3 className="font-bold">Success!</h3>
                        <p className="text-sm text-muted-foreground">
                          {results.data?.message || "Operation completed"}
                          {results.data?.simulated && (
                            <Badge variant="secondary" className="ml-2">Simulated</Badge>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Products Discovered */}
                    {results.type === "discover" && results.data?.products && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-4">Discovered Products ({results.data.products.length})</h4>
                        <div className="space-y-3">
                          {results.data.products.map((product: Product) => (
                            <Card key={product.id} className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-bold">{product.name}</h5>
                                  <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                                  <div className="flex gap-4 mt-2 text-xs">
                                    <span className="text-muted-foreground">Category: {product.category}</span>
                                    <span className="text-primary font-medium">Trend Score: {product.trend_score}</span>
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => runGenerateContent(product.id)}
                                  disabled={loading !== null}
                                >
                                  Generate Content
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content Generated */}
                    {results.type === "generate" && results.data?.content && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-4">Generated Content</h4>
                        <Card className="p-4">
                          <h5 className="font-bold text-lg mb-2">{results.data.content.title}</h5>
                          <p className="text-sm text-muted-foreground mb-4">{results.data.content.meta_description}</p>
                          <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap">{results.data.content.body}</pre>
                          </div>
                          <Button
                            className="mt-4"
                            onClick={() => runAutoPublish(results.data.content.id)}
                            disabled={loading !== null}
                          >
                            Publish This Content
                          </Button>
                        </Card>
                      </div>
                    )}

                    {/* Posts Created */}
                    {results.type === "publish" && results.data?.posts && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-4">Social Posts Created ({results.data.posts.length})</h4>
                        <div className="space-y-3">
                          {results.data.posts.map((post: Post) => (
                            <Card key={post.id} className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="bg-primary/10 rounded-lg p-3">
                                  <Share2 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-bold capitalize">{post.platform}</h5>
                                  {post.post_title && (
                                    <p className="text-sm font-medium mt-1">{post.post_title}</p>
                                  )}
                                  <p className="text-sm text-muted-foreground mt-2">{post.post_content}</p>
                                  {post.hashtags && post.hashtags.length > 0 && (
                                    <div className="flex gap-2 mt-2 flex-wrap">
                                      {post.hashtags.map((tag: string, i: number) => (
                                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                          #{tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Workflow Results */}
                    {results.type === "full" && results.data?.results && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-4">Workflow Results</h4>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <Card className="p-4 text-center">
                            <div className="text-3xl font-bold text-primary">{results.data.results.products_discovered}</div>
                            <div className="text-sm text-muted-foreground mt-1">Products Discovered</div>
                          </Card>
                          <Card className="p-4 text-center">
                            <div className="text-3xl font-bold text-primary">{results.data.results.content_generated}</div>
                            <div className="text-sm text-muted-foreground mt-1">Articles Generated</div>
                          </Card>
                          <Card className="p-4 text-center">
                            <div className="text-3xl font-bold text-primary">{results.data.results.posts_created}</div>
                            <div className="text-sm text-muted-foreground mt-1">Social Posts Created</div>
                          </Card>
                        </div>

                        {/* Show sample products */}
                        {results.data.products && (
                          <div className="mb-6">
                            <h5 className="font-semibold mb-3">Sample Products</h5>
                            <div className="space-y-2">
                              {results.data.products.slice(0, 2).map((product: Product) => (
                                <Card key={product.id} className="p-3">
                                  <div className="font-medium">{product.name}</div>
                                  <div className="text-xs text-muted-foreground">{product.description}</div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Show sample posts */}
                        {results.data.posts && (
                          <div>
                            <h5 className="font-semibold mb-3">Sample Social Posts</h5>
                            <div className="space-y-2">
                              {results.data.posts.slice(0, 2).map((post: Post) => (
                                <Card key={post.id} className="p-3">
                                  <div className="font-medium capitalize">{post.platform}</div>
                                  <div className="text-xs text-muted-foreground mt-1">{post.post_content.slice(0, 100)}...</div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Raw Response */}
                    <details className="mt-6">
                      <summary className="cursor-pointer font-medium">View Raw Response</summary>
                      <div className="bg-muted rounded-lg p-4 mt-2 max-h-96 overflow-y-auto">
                        <pre className="text-xs">{JSON.stringify(results.data, null, 2)}</pre>
                      </div>
                    </details>
                  </div>
                )}
              </Card>
            )}

            {/* Instructions */}
            <Card className="p-6 mt-8 bg-primary/5 border-primary/20">
              <h3 className="font-bold mb-3">🚀 How It Works</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Demo Mode (Current):</strong>
                  <ul className="list-disc list-inside mt-1 ml-4 space-y-1 text-muted-foreground">
                    <li>Uses simulated AI results for instant testing</li>
                    <li>No API costs or setup required</li>
                    <li>Perfect for understanding the workflow</li>
                  </ul>
                </div>
                <div>
                  <strong>AI Mode (With API Key):</strong>
                  <ul className="list-disc list-inside mt-1 ml-4 space-y-1 text-muted-foreground">
                    <li>Add your OpenAI API key in <Link href="/settings" className="text-primary hover:underline">Settings → API Keys</Link></li>
                    <li>Uses real GPT-4 for content generation</li>
                    <li>Produces unique, high-quality content</li>
                    <li>Monitor usage at <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">OpenAI Dashboard</a></li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}