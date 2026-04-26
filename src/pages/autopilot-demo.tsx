import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";
import { 
  Sparkles, 
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Link as LinkIcon,
  FileText,
  Share2,
  Clock,
  Trash2,
  BarChart3
} from "lucide-react";

export default function AutopilotDemo() {
  const [mounted, setMounted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
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

  const loadStats = () => {
    const currentStats = realAutopilotEngine.getStats();
    setStats(currentStats);
    const allData = realAutopilotEngine.getAllData();
    setLogs(allData.logs || []);
  };

  // Load stats on client side only
  useEffect(() => {
    if (!mounted) return;
    
    loadStats();
    
    const interval = setInterval(loadStats, 2000);
    return () => clearInterval(interval);
  }, [mounted]);

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
      // Progress updates
      setProgress(10);
      setCurrentStep('🔍 AI discovering REAL trending products...');
      
      const result = await realAutopilotEngine.runAutopilot('Smart Home Devices');

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

  // Don't render dynamic content during SSR
  if (!mounted) {
    return (
      <>
        <SEO 
          title="Autopilot Demo - Real AI System"
          description="Working demonstration of 100% real AI-powered affiliate automation"
        />
        
        <div className="min-h-screen bg-background">
          <Header />
          
          <main className="max-w-6xl mx-auto px-4 py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading...</p>
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
        title="Autopilot Demo - Real AI System"
        description="Working demonstration of 100% real AI-powered affiliate automation"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-6xl mx-auto px-4 py-12 space-y-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">AutoPilot Demo</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              100% Real AI-Powered Affiliate Automation - No Mock Data
            </p>
            
            {hasApiKey ? (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                AI Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" />
                OpenAI Key Required
              </Badge>
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Run Autopilot</h2>
                
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
                    <h3 className="font-semibold">Statistics</h3>
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
            </div>

            <div className="lg:col-span-2">
              <Tabs defaultValue="results" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="results" className="space-y-4">
                  {results ? (
                    <>
                      <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            Products ({results.products.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {results.products.map((product: any, i: number) => (
                            <div key={i} className="border rounded-lg p-4 space-y-2">
                              <h4 className="font-semibold">{product.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {product.description}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <Badge variant="outline">${product.price}</Badge>
                                <Badge variant="outline">{product.network}</Badge>
                                <Badge variant="secondary">Score: {product.trend_score}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="p-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-semibold">
                            Articles ({results.content.length})
                          </h3>
                        </div>
                        <div className="space-y-3">
                          {results.content.map((article: any, i: number) => (
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
                      </Card>

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
                              <Badge>{post.platform}</Badge>
                              <p className="text-sm">{post.caption}</p>
                            </div>
                          ))}
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
                    <h3 className="text-lg font-semibold">Activity Logs</h3>
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
              </Tabs>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}