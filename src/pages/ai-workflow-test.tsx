import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, TrendingUp, FileText, Share2, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function AIWorkflowTest() {
  const [niche, setNiche] = useState("Kitchen Gadgets");
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  async function runDiscoverProducts() {
    setLoading("discover");
    setResults(null);
    try {
      const response = await fetch("/api/ai/discover-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, count: 5 })
      });
      const data = await response.json();
      setResults({ type: "discover", data });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
    } finally {
      setLoading(null);
    }
  }

  async function runGenerateContent(productId?: string) {
    setLoading("generate");
    setResults(null);
    try {
      const response = await fetch("/api/ai/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId || results?.data?.products?.[0]?.id })
      });
      const data = await response.json();
      setResults({ type: "generate", data });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
    } finally {
      setLoading(null);
    }
  }

  async function runAutoPublish(contentId?: string) {
    setLoading("publish");
    setResults(null);
    try {
      const response = await fetch("/api/ai/auto-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_id: contentId || results?.data?.content?.id })
      });
      const data = await response.json();
      setResults({ type: "publish", data });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
    } finally {
      setLoading(null);
    }
  }

  async function runFullWorkflow() {
    setLoading("full");
    setResults(null);
    try {
      const response = await fetch("/api/ai/full-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, auto_publish: true })
      });
      const data = await response.json();
      setResults({ type: "full", data });
    } catch (error) {
      setResults({ type: "error", error: (error as Error).message });
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <SEO 
        title="AI Workflow Test - AffiliatePro"
        description="Test OpenAI-powered automation workflows"
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
                Test OpenAI-powered automation: Trend discovery, content generation, and auto-publishing
              </p>
            </div>

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
                        </p>
                      </div>
                    </div>

                    {/* Products Discovered */}
                    {results.type === "discover" && results.data?.products && (
                      <div className="mt-6">
                        <h4 className="font-bold mb-4">Discovered Products ({results.data.products.length})</h4>
                        <div className="space-y-3">
                          {results.data.products.map((product: any) => (
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
                          {results.data.posts.map((post: any) => (
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
                                    <div className="flex gap-2 mt-2">
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
                        <div className="grid grid-cols-3 gap-4">
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
                        {results.data.results.errors && results.data.results.errors.length > 0 && (
                          <Card className="p-4 mt-4 bg-red-50 border-red-200">
                            <h5 className="font-bold text-red-800 mb-2">Errors ({results.data.results.errors.length})</h5>
                            <ul className="text-sm text-red-600 space-y-1">
                              {results.data.results.errors.map((err: string, i: number) => (
                                <li key={i}>• {err}</li>
                              ))}
                            </ul>
                          </Card>
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
              <h3 className="font-bold mb-3">🚀 Setup Instructions</h3>
              <ol className="text-sm space-y-2 list-decimal list-inside">
                <li>Add your OpenAI API key to <code className="bg-muted px-2 py-1 rounded">.env.local</code></li>
                <li>Set <code className="bg-muted px-2 py-1 rounded">OPENAI_API_KEY=sk-...</code></li>
                <li>Restart the dev server with <code className="bg-muted px-2 py-1 rounded">npm run dev</code></li>
                <li>Test individual functions or run the full workflow</li>
                <li>Check your database for new products, content, and social posts</li>
              </ol>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}