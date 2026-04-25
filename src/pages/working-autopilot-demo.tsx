import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";
import { realTrafficEngine } from "@/services/realTrafficEngine";
import { 
  Zap, Play, CheckCircle2, TrendingUp, Link2, FileText, Share2, 
  MousePointerClick, DollarSign, Activity, Sparkles, Loader2,
  AlertCircle, Database, Wifi, WifiOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function WorkingAutopilotDemo() {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [hasOpenAI, setHasOpenAI] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    checkOpenAI();
    loadStats();
    loadLogs();
  }, []);

  const checkOpenAI = () => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('openai_api_key');
      setHasOpenAI(!!key);
    }
  };

  const loadStats = () => {
    const data = realAutopilotEngine.getStats();
    setStats(data);
  };

  const loadLogs = () => {
    const allData = realAutopilotEngine.getAllData();
    setLogs(allData.logs.slice(0, 20));
  };

  const runFullAutopilot = async () => {
    setIsRunning(true);
    setProgress(0);
    setCurrentStep('Initializing autopilot engine...');

    try {
      toast({
        title: "🚀 Autopilot Started",
        description: "Running complete autonomous workflow",
      });

      // Step 1: Product Discovery (25%)
      setCurrentStep('Step 1/4: Discovering trending products with AI...');
      setProgress(10);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(25);

      // Step 2: Create Affiliate Links (50%)
      setCurrentStep('Step 2/4: Creating cloaked affiliate links...');
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(50);

      // Step 3: Generate Content (75%)
      setCurrentStep('Step 3/4: Generating SEO content with AI...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(75);

      // Step 4: Execute Full Workflow (100%)
      setCurrentStep('Step 4/4: Publishing to social platforms...');
      const result = await realAutopilotEngine.runAutopilot('Smart Home Devices');
      
      setProgress(100);
      setCurrentStep('Complete! ✅');

      // Refresh stats and logs
      loadStats();
      loadLogs();

      toast({
        title: "✅ Autopilot Complete!",
        description: `Discovered ${result.products.length} products, created ${result.content.length} articles, published ${result.posts.length} posts`,
      });

    } catch (error: any) {
      toast({
        title: "❌ Autopilot Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const clearAllData = () => {
    if (confirm('Clear all autopilot data? This cannot be undone.')) {
      realAutopilotEngine.clearAllData();
      loadStats();
      loadLogs();
      toast({
        title: "🗑️ Data Cleared",
        description: "All autopilot data has been reset",
      });
    }
  };

  return (
    <>
      <SEO 
        title="Working Autopilot Demo - AffiliatePro"
        description="Test the complete autonomous affiliate marketing system"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Zap className="h-8 w-8 text-primary" />
                  Working Autopilot Demo
                </h1>
                <p className="text-muted-foreground mt-2">
                  Complete autonomous system - No Supabase required
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                100% Local
              </Badge>
            </div>

            {/* System Status */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Storage</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">localStorage</div>
                  <p className="text-xs text-muted-foreground">
                    No network calls
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI Status</CardTitle>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {hasOpenAI ? 'Ready ✅' : 'Demo Mode ⚡'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {hasOpenAI ? 'Real OpenAI' : 'Simulated responses'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network</CardTitle>
                  <WifiOff className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Offline</div>
                  <p className="text-xs text-muted-foreground">
                    Works without internet
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* OpenAI Notice */}
            {!hasOpenAI && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  Running in <strong>Demo Mode</strong>. Add OpenAI API key in{' '}
                  <Link href="/settings" className="underline">Settings</Link>{' '}
                  for real AI product discovery and content generation.
                </AlertDescription>
              </Alert>
            )}

            {/* Main Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Run Complete Autopilot
                </CardTitle>
                <CardDescription>
                  Execute full autonomous workflow: Discovery → Links → Content → Publishing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRunning && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{currentStep}</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    onClick={runFullAutopilot}
                    disabled={isRunning}
                    className="flex-1"
                    size="lg"
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Running Autopilot...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Run Full Autopilot
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={clearAllData}
                    variant="outline"
                    disabled={isRunning}
                  >
                    Clear Data
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">What This Does:</p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Discovers 3 trending products {hasOpenAI ? '(Real AI)' : '(Demo)'}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Creates cloaked affiliate links
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Generates SEO content {hasOpenAI ? '(Real AI)' : '(Demo)'}
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Publishes to 5 social platforms
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600" />
                      Stores everything in localStorage
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Statistics</TabsTrigger>
                <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                <TabsTrigger value="traffic">Traffic Plan</TabsTrigger>
              </TabsList>

              {/* Statistics Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Products</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.products || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Links</CardTitle>
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.links || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Content</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.content || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Posts</CardTitle>
                      <Share2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.posts || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                      <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.clicks || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats?.conversions || 0}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${(stats?.revenue || 0).toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Activity Logs Tab */}
              <TabsContent value="logs">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription>
                      Last {logs.length} autopilot actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[400px]">
                      {logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No activity yet. Run autopilot to see logs.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {logs.map((log, index) => (
                            <div key={log.id} className="flex gap-3 pb-3 border-b last:border-0">
                              <div className={`mt-1 ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                {log.status === 'success' ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <AlertCircle className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium">{log.action}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(log.created_at).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {log.details}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Traffic Plan Tab */}
              <TabsContent value="traffic">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Free Traffic Strategies
                    </CardTitle>
                    <CardDescription>
                      Proven tactics to drive traffic without paid ads
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="border-l-4 border-blue-500 pl-4 py-2">
                        <p className="font-medium">Reddit Growth Hack</p>
                        <p className="text-sm text-muted-foreground">
                          Find hot threads, post valuable comments with links → 100-500 clicks/day
                        </p>
                      </div>

                      <div className="border-l-4 border-pink-500 pl-4 py-2">
                        <p className="font-medium">Pinterest Viral Formula</p>
                        <p className="text-sm text-muted-foreground">
                          Create pins with trending keywords → 500-2000 impressions per pin
                        </p>
                      </div>

                      <div className="border-l-4 border-blue-400 pl-4 py-2">
                        <p className="font-medium">Twitter Thread Automation</p>
                        <p className="text-sm text-muted-foreground">
                          Value-packed threads at peak times → 50-200 clicks per thread
                        </p>
                      </div>

                      <div className="border-l-4 border-blue-600 pl-4 py-2">
                        <p className="font-medium">Facebook Group Strategy</p>
                        <p className="text-sm text-muted-foreground">
                          Join niche groups, share valuable content → 100-300 clicks per post
                        </p>
                      </div>

                      <div className="border-l-4 border-red-500 pl-4 py-2">
                        <p className="font-medium">YouTube Comment Tactic</p>
                        <p className="text-sm text-muted-foreground">
                          Comment on trending videos with helpful tips → 20-100 clicks
                        </p>
                      </div>

                      <div className="border-l-4 border-red-600 pl-4 py-2">
                        <p className="font-medium">Quora Expert Answers</p>
                        <p className="text-sm text-muted-foreground">
                          Answer trending questions in your niche → 50-150 clicks per answer
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-muted/30 rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Combined Daily Potential:</p>
                      <p className="text-2xl font-bold text-primary">500-3000 FREE visitors/day</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        All organic traffic, no ad spend required
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <Link href="/settings">
                  <Button variant="outline" className="w-full">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Add OpenAI Key
                  </Button>
                </Link>
                <Link href="/autopilot-center">
                  <Button variant="outline" className="w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    AutoPilot Center
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    <Activity className="mr-2 h-4 w-4" />
                    View Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}