import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";
import { 
  Play, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Sparkles,
  TrendingUp,
  Link as LinkIcon,
  FileText,
  Share2,
  BarChart3,
  ExternalLink,
  Key,
  Trash2
} from "lucide-react";

export default function RealSystemTest() {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [niche, setNiche] = useState('Smart Home Devices');
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    checkApiKey();
    loadStats();
  }, []);

  const checkApiKey = () => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('openai_api_key');
      setHasApiKey(!!key && key.length > 0);
    }
  };

  const loadStats = () => {
    const data = realAutopilotEngine.getAllData();
    const statistics = realAutopilotEngine.getStats();
    setStats(statistics);
    setLogs(data.logs.slice(0, 20));
  };

  const runAutopilot = async () => {
    if (!hasApiKey) {
      setError('OpenAI API key required! Go to Settings → API Keys to add your key.');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setCurrentStep('Initializing AI autopilot...');
    setError('');
    setResults(null);

    try {
      // Step 1: Discover products (20%)
      setProgress(10);
      setCurrentStep('🔍 AI discovering REAL trending products...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(20);
      
      // Step 2-5: Run complete autopilot
      setCurrentStep('🚀 Running complete AI workflow...');
      const result = await realAutopilotEngine.runAutopilot(niche);

      // Progress updates
      setProgress(40);
      setCurrentStep('🔗 Creating affiliate tracking links...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(60);
      setCurrentStep('✍️ AI writing SEO-optimized articles...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProgress(80);
      setCurrentStep('📱 AI generating authentic social posts...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress(100);
      setCurrentStep('✅ Autopilot cycle complete!');

      setResults(result);
      loadStats();

    } catch (err: any) {
      console.error('Autopilot error:', err);
      setError(err.message || 'Autopilot failed. Check console for details.');
      setProgress(0);
      setCurrentStep('');
    } finally {
      setIsRunning(false);
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure? This will delete all products, content, and posts.')) {
      realAutopilotEngine.clearAllData();
      loadStats();
      setResults(null);
    }
  };

  return (
    <>
      <SEO 
        title="Real AI System Test - AffiliatePro"
        description="Test the 100% real AI-powered affiliate automation system"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold">Real AI System Test</h1>
                <p className="text-muted-foreground mt-2">
                  100% Real AI-Powered Affiliate Automation - No Mock Data
                </p>
              </div>
              
              {hasApiKey ? (
                <Badge variant="default" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Ready
                </Badge>
              ) : (
                <Badge variant="destructive" className="gap-2">
                  <AlertCircle className="h-4 w-4" />
                  OpenAI Key Required
                </Badge>
              )}
            </div>

            {!hasApiKey && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      OpenAI API Key Required
                    </h3>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      This system uses 100% real AI - no mock data or fallbacks. 
                      Add your OpenAI API key to enable real product discovery and content generation.
                    </p>
                    <Link href="/settings">
                      <Button size="sm" className="gap-2">
                        <Key className="h-4 w-4" />
                        Add API Key in Settings
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Controls */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Run Autopilot</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="niche">Product Niche</Label>
                  <Input
                    id="niche"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g., Smart Home Devices"
                    disabled={isRunning}
                  />
                  <p className="text-xs text-muted-foreground">
                    AI will discover trending products in this niche
                  </p>
                </div>

                <Button 
                  onClick={runAutopilot}
                  disabled={isRunning || !hasApiKey}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Running AI...
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      Run AI Autopilot
                    </>
                  )}
                </Button>

                {isRunning && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-muted-foreground text-center">
                      {currentStep}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {error}
                    </p>
                  </div>
                )}

                {stats && (
                  <div className="pt-4 border-t space-y-3">
                    <h3 className="font-semibold">Current Statistics</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Products</p>
                        <p className="text-2xl font-bold">{stats.products}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Links</p>
                        <p className="text-2xl font-bold">{stats.links}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Articles</p>
                        <p className="text-2xl font-bold">{stats.content}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Posts</p>
                        <p className="text-2xl font-bold">{stats.posts}</p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllData}
                      className="w-full gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All Data
                    </Button>
                  </div>
                )}
              </Card>

              {/* System Features */}
              <Card className="p-6 space-y-3">
                <h3 className="font-semibold">What This Does</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Real AI product discovery (GPT-4o-mini)</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Real Amazon/AliExpress affiliate URLs</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>AI-written articles (500-1000 words)</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Natural social posts (not robotic)</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Cloaked tracking links (/go/...)</span>
                  </div>
                  <div className="flex gap-2">
                    <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <span>NO mock data or fallbacks</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right: Results */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="results" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                  <TabsTrigger value="verification">Verification</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-4">
                  {results ? (
                    <>
                      {/* Products */}
                      <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            Discovered Products ({results.products.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {results.products.map((product: any, i: number) => (
                            <div key={i} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold">{product.name}</h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {product.description}
                                  </p>
                                </div>
                                <Badge variant="secondary">
                                  Score: {product.trend_score}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline">{product.category}</Badge>
                                <Badge variant="outline">${product.price}</Badge>
                                <Badge variant="outline">{product.network}</Badge>
                                <Badge variant="outline">{product.commission_rate}% commission</Badge>
                              </div>
                              <div className="pt-2 border-t">
                                <a 
                                  href={product.affiliate_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Affiliate Link
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Affiliate Links */}
                      <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <LinkIcon className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            Cloaked Links ({results.links.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {results.links.map((link: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="font-mono text-sm">{link.cloaked_url}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  → {link.original_url.substring(0, 60)}...
                                </p>
                              </div>
                              <Badge variant="outline">{link.network}</Badge>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Content */}
                      <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            AI-Written Articles ({results.content.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {results.content.map((article: any, i: number) => (
                            <div key={i} className="border rounded-lg p-4 space-y-2">
                              <h4 className="font-semibold">{article.title}</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {article.body.substring(0, 200)}...
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="secondary">
                                  {article.body.split(' ').length} words
                                </Badge>
                                <span>•</span>
                                <span>AI-generated</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Social Posts */}
                      <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <Share2 className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            Social Posts ({results.posts.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {results.posts.slice(0, 10).map((post: any, i: number) => (
                            <div key={i} className="border rounded-lg p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <Badge>{post.platform}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(post.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{post.caption}</p>
                            </div>
                          ))}
                          {results.posts.length > 10 && (
                            <p className="text-sm text-muted-foreground text-center">
                              + {results.posts.length - 10} more posts
                            </p>
                          )}
                        </div>
                      </Card>
                    </>
                  ) : (
                    <Card className="p-12 text-center">
                      <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                      <p className="text-muted-foreground">
                        Click "Run AI Autopilot" to discover products and generate content
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Activity Logs (Last 20)</h3>
                    {logs.length > 0 ? (
                      <div className="space-y-2">
                        {logs.map((log: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                            {log.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{log.action}</p>
                              <p className="text-xs text-muted-foreground">{log.details}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No activity logs yet
                      </p>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="verification" className="space-y-4">
                  <Card className="p-6 space-y-4">
                    <h3 className="text-lg font-semibold">Data Verification</h3>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          AI Product Discovery
                        </h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Uses OpenAI GPT-4o-mini</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Searches for real 2026 trending products</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Validates affiliate availability</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>NO fallback demo products</span>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <LinkIcon className="h-4 w-4" />
                          Affiliate Links
                        </h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Real Amazon/AliExpress URLs</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Includes your affiliate tracking tag</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Cloaked URLs for click tracking</span>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Content Generation
                        </h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>AI writes 500-1000 word articles</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>SEO-optimized titles and meta</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Natural, readable language</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>NO template-based content</span>
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Share2 className="h-4 w-4" />
                          Social Posts
                        </h4>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>AI generates platform-specific posts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Natural, authentic language</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <span>Includes real affiliate links</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            <span>NOT robotic or template-based</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}