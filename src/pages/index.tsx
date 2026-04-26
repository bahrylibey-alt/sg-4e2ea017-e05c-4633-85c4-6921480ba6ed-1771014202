import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";
import { 
  Rocket,
  Sparkles, 
  Play,
  Pause,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Link as LinkIcon,
  FileText,
  Share2,
  DollarSign,
  Eye,
  MousePointerClick,
  AlertCircle,
  Trash2,
  RefreshCw,
  Settings,
  BarChart3
} from "lucide-react";

export default function CommandCenter() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [error, setError] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [niche, setNiche] = useState("Smart Home Devices");
  const [stats, setStats] = useState({
    products: 0,
    links: 0,
    content: 0,
    posts: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check API key on mount
  useEffect(() => {
    if (!mounted) return;
    
    const checkKey = () => {
      const key = localStorage.getItem('openai_api_key');
      setHasApiKey(!!key && key.length > 0);
    };
    
    checkKey();
  }, [mounted]);

  // Load stats on client side only
  useEffect(() => {
    if (!mounted) return;
    
    const loadStats = () => {
      const currentStats = realAutopilotEngine.getStats();
      setStats(currentStats);
    };
    
    loadStats();
    
    const interval = setInterval(loadStats, 2000);
    return () => clearInterval(interval);
  }, [mounted]);

  const runAutopilot = async () => {
    setIsRunning(true);
    setProgress(0);
    setError('');
    setResults(null);

    try {
      if (typeof window !== 'undefined') {
        const key = localStorage.getItem('openai_api_key');
        if (!key || key.length === 0) {
          setError('OpenAI API key required! Go to Settings to add your key.');
          setIsRunning(false);
          return;
        }
      }

      setCurrentStep('🔍 AI discovering trending products...');
      setProgress(20);

      const productResults = await realAutopilotEngine.runAutopilot(niche);

      setCurrentStep('🔗 Created affiliate tracking links');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('✍️ AI writing articles...');
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('📱 AI generating social posts...');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentStep('✅ Autopilot complete!');
      setProgress(100);
      setResults(productResults);

    } catch (err: any) {
      console.error('Autopilot error:', err);
      setError(err.message || 'An error occurred. Check console for details.');
      setProgress(0);
      setCurrentStep('');
    } finally {
      setIsRunning(false);
    }
  };

  const clearAllData = () => {
    if (confirm('⚠️ This will delete ALL products, links, articles, and posts. Are you sure?')) {
      realAutopilotEngine.clearAllData();
      setResults(null);
    }
  };

  // Don't render dynamic content during SSR
  if (!mounted) {
    return (
      <>
        <SEO 
          title="AutoPilot Command Center - Affiliate Automation"
          description="Master control center for your autonomous affiliate marketing system"
        />
        
        <div className="min-h-screen bg-background">
          <Header />
          
          <main className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading Command Center...</p>
            </div>
          </main>
          
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="AutoPilot Command Center - Affiliate Automation"
        description="Master control center for your autonomous affiliate marketing system"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Rocket className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">AutoPilot Command Center</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Master Control for Your Autonomous Affiliate System
            </p>
            
            {hasApiKey ? (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                AI Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                Setup Required
              </Badge>
            )}
          </div>

          {/* Real-Time Statistics Dashboard */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Products</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.products}</p>
              <p className="text-xs text-muted-foreground">AI-discovered</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Links</p>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.links}</p>
              <p className="text-xs text-muted-foreground">Affiliate URLs</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Articles</p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.content}</p>
              <p className="text-xs text-muted-foreground">AI-written</p>
            </Card>

            <Card className="p-6 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Posts</p>
                <Share2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold">{stats.posts}</p>
              <p className="text-xs text-muted-foreground">Social posts</p>
            </Card>
          </div>

          {/* AutoPilot Control Panel */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                AI AutoPilot
              </h2>
              <p className="text-muted-foreground">
                Discover trending products, generate content, and create social posts - all in one click
              </p>
            </div>

            {!hasApiKey && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                      OpenAI API Key Required
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Add your OpenAI API key in Settings to enable real AI-powered automation.
                    </p>
                    <Button
                      onClick={() => router.push('/settings')}
                      size="sm"
                      variant="outline"
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Go to Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Product Niche</label>
                <Input
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g., Smart Home Devices, Fitness Gear, Kitchen Gadgets"
                  disabled={isRunning}
                />
              </div>

              <Button
                onClick={runAutopilot}
                disabled={isRunning || !hasApiKey}
                size="lg"
                className="w-full gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running AutoPilot...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Run AI AutoPilot
                  </>
                )}
              </Button>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {currentStep}
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
          </Card>

          {/* Results Tabs */}
          {(results || stats.products > 0) && (
            <Tabs defaultValue="products" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="content">Articles</TabsTrigger>
                <TabsTrigger value="posts">Social Posts</TabsTrigger>
              </TabsList>

              <TabsContent value="products" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    AI-Discovered Products ({stats.products})
                  </h3>
                  {stats.products === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No products yet. Run AutoPilot to discover trending products.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {results?.products.map((product: any, i: number) => (
                        <div key={i} className="border rounded-lg p-4 space-y-2">
                          <h4 className="font-semibold">{product.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">${product.price}</Badge>
                            <Badge variant="outline">{product.network}</Badge>
                            <Badge variant="secondary">Score: {product.trend_score}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    AI-Written Articles ({stats.content})
                  </h3>
                  {stats.content === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No articles yet. Run AutoPilot to generate content.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {results?.content.map((article: any, i: number) => (
                        <div key={i} className="border rounded-lg p-4 space-y-2">
                          <h4 className="font-semibold">{article.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {article.body.substring(0, 200)}...
                          </p>
                          <Badge variant="secondary">
                            {article.body.split(' ').length} words
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="posts" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Social Media Posts ({stats.posts})
                  </h3>
                  {stats.posts === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No posts yet. Run AutoPilot to generate social content.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {results?.posts.slice(0, 10).map((post: any, i: number) => (
                        <div key={i} className="border rounded-lg p-4 space-y-2">
                          <Badge>{post.platform}</Badge>
                          <p className="text-sm">{post.caption}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          )}

          {/* System Actions */}
          {stats.products > 0 && (
            <Card className="p-6">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/settings')}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Button
                  variant="destructive"
                  onClick={clearAllData}
                  className="gap-2 ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </Button>
              </div>
            </Card>
          )}

          {/* Quick Help */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-3">Quick Start Guide</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Step 1:</strong> Add your OpenAI API key in Settings</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Step 2:</strong> Enter a product niche (e.g., "Smart Home Devices")</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Step 3:</strong> Click "Run AI AutoPilot" and wait ~15-20 seconds</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Step 4:</strong> Review products, articles, and social posts in tabs above</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Step 5:</strong> Share content to Reddit, Pinterest, Twitter to drive traffic!</span>
              </li>
            </ul>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
}