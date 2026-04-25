import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rocket, Database, Zap, TrendingUp, FileText, Link as LinkIcon,
  Share2, Eye, MousePointerClick, DollarSign, CheckCircle2, 
  XCircle, Loader2, AlertCircle, Activity, BarChart, Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
  duration?: number;
}

export default function UltimateSystemTest() {
  const { toast } = useToast();
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [niche, setNiche] = useState('Smart Home Devices');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('openai_api_key');
      setHasApiKey(!!key);
    }
    loadSystemStats();
  }, []);

  const updateTestResult = (name: string, status: TestResult['status'], message: string, data?: any, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, status, message, data, duration } : r);
      }
      return [...prev, { name, status, message, data, duration }];
    });
  };

  const runCompleteSystemTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);
    setCurrentTest('');

    try {
      // Test 1: Check API Key
      setCurrentTest('Checking OpenAI API key...');
      setProgress(10);
      const apiKeyStart = Date.now();
      
      if (!hasApiKey) {
        updateTestResult(
          'API Key Check',
          'error',
          '❌ OpenAI API key required. Add your key in Settings → API Keys',
          null,
          Date.now() - apiKeyStart
        );
        throw new Error('OpenAI API key required');
      }

      updateTestResult(
        'API Key Check',
        'success',
        '✅ OpenAI API key configured',
        null,
        Date.now() - apiKeyStart
      );

      // Test 2: Product Discovery
      setCurrentTest('AI discovering trending products...');
      setProgress(25);
      const productStart = Date.now();

      const products = await realAutopilotEngine.discoverProducts(niche, 3);
      
      updateTestResult(
        'Product Discovery',
        'success',
        `✅ AI discovered ${products.length} real trending products`,
        { products },
        Date.now() - productStart
      );
      setProgress(40);

      // Test 3: Affiliate Links
      setCurrentTest('Creating tracked affiliate links...');
      const linkStart = Date.now();

      const links = await realAutopilotEngine.createAffiliateLinks(products);

      updateTestResult(
        'Affiliate Links',
        'success',
        `✅ Created ${links.length} cloaked affiliate links`,
        { links },
        Date.now() - linkStart
      );
      setProgress(60);

      // Test 4: Content Generation
      setCurrentTest('AI writing SEO-optimized articles...');
      const contentStart = Date.now();

      const content = await realAutopilotEngine.generateContent(products, links);

      updateTestResult(
        'Content Generation',
        'success',
        `✅ Generated ${content.length} AI-written articles (800-1200 words)`,
        { content },
        Date.now() - contentStart
      );
      setProgress(80);

      // Test 5: Social Publishing
      setCurrentTest('AI generating authentic social posts...');
      const publishStart = Date.now();

      const posts = await realAutopilotEngine.publishToSocial(products, links);

      updateTestResult(
        'Social Publishing',
        'success',
        `✅ Generated ${posts.length} authentic social posts`,
        { posts },
        Date.now() - publishStart
      );
      setProgress(100);

      setCurrentTest('Complete!');
      setIsRunning(false);

      loadSystemStats();

      toast({
        title: "✅ System Test Complete",
        description: "All tests passed successfully with real AI!"
      });

    } catch (error: any) {
      updateTestResult('System Error', 'error', `❌ ${error.message}`);
      setIsRunning(false);
      setCurrentTest('');
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadSystemStats = () => {
    const stats = realAutopilotEngine.getStats();
    setSystemStats(stats);
  };

  const clearAllData = () => {
    if (confirm('Clear all data? This cannot be undone.')) {
      realAutopilotEngine.clearAllData();
      loadSystemStats();
      setTestResults([]);
      toast({
        title: "Data Cleared",
        description: "All data has been removed"
      });
    }
  };

  return (
    <>
      <SEO 
        title="Ultimate System Test - Verify Complete Workflow"
        description="Comprehensive end-to-end test of the entire affiliate marketing automation system"
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Database className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-bold">Ultimate System Test</h1>
              </div>
              <p className="text-xl text-muted-foreground">
                Verify complete workflow with 100% real AI automation
              </p>
            </div>

            {/* API Key Status */}
            <Alert className={hasApiKey ? "border-green-500" : "border-yellow-500"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {hasApiKey ? (
                  <span>
                    <Badge variant="default" className="mr-2">AI Ready</Badge>
                    OpenAI API key detected. System ready for real AI automation.
                  </span>
                ) : (
                  <span>
                    <Badge variant="secondary" className="mr-2">Setup Required</Badge>
                    Add OpenAI key in <Link href="/settings" className="text-primary hover:underline">Settings</Link> to enable real AI features.
                  </span>
                )}
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="test" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="test">Run Tests</TabsTrigger>
                <TabsTrigger value="stats">System Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="space-y-6">
                {/* Run Test Button */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-primary" />
                      Run Complete System Test
                    </CardTitle>
                    <CardDescription>
                      Tests: Product Discovery → Links → Content → Social Publishing
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Product Niche</label>
                      <select
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        disabled={isRunning}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="Smart Home Devices">Smart Home Devices</option>
                        <option value="Kitchen Gadgets">Kitchen Gadgets</option>
                        <option value="Fitness Equipment">Fitness Equipment</option>
                        <option value="Tech Accessories">Tech Accessories</option>
                        <option value="Outdoor Gear">Outdoor Gear</option>
                      </select>
                    </div>

                    <Button
                      onClick={runCompleteSystemTest}
                      disabled={isRunning || !hasApiKey}
                      size="lg"
                      className="w-full"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Running Tests...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Run Complete System Test
                        </>
                      )}
                    </Button>

                    {isRunning && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{currentTest}</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Test Results */}
                {testResults.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Results</CardTitle>
                      <CardDescription>
                        Real-time results from AI automation
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {testResults.map((result, index) => (
                          <div 
                            key={index}
                            className={`p-4 rounded-lg border ${
                              result.status === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                              result.status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                              result.status === 'running' ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' :
                              'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {result.status === 'success' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                {result.status === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
                                {result.status === 'running' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                                {result.status === 'pending' && <Clock className="h-5 w-5 text-gray-400" />}
                                <div>
                                  <h4 className="font-semibold">{result.name}</h4>
                                  <p className="text-sm text-muted-foreground">{result.message}</p>
                                </div>
                              </div>
                              {result.duration && (
                                <Badge variant="outline">{result.duration}ms</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stats" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="h-5 w-5 text-primary" />
                      System Statistics
                    </CardTitle>
                    <CardDescription>
                      Real-time data from localStorage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {systemStats ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Products</span>
                            </div>
                            <p className="text-2xl font-bold">{systemStats.products}</p>
                          </Card>

                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <LinkIcon className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Links</span>
                            </div>
                            <p className="text-2xl font-bold">{systemStats.links}</p>
                          </Card>

                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Content</span>
                            </div>
                            <p className="text-2xl font-bold">{systemStats.content}</p>
                          </Card>

                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Share2 className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Posts</span>
                            </div>
                            <p className="text-2xl font-bold">{systemStats.posts}</p>
                          </Card>

                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <MousePointerClick className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Clicks</span>
                            </div>
                            <p className="text-2xl font-bold">{systemStats.clicks}</p>
                          </Card>

                          <Card className="p-4 bg-primary/5">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Conversions</span>
                            </div>
                            <p className="text-2xl font-bold">{systemStats.conversions}</p>
                          </Card>

                          <Card className="p-4 bg-primary/5 col-span-2">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Total Revenue</span>
                            </div>
                            <p className="text-2xl font-bold">${systemStats.revenue.toFixed(2)}</p>
                          </Card>
                        </div>

                        <div className="mt-6 flex gap-3">
                          <Button 
                            onClick={loadSystemStats} 
                            variant="outline" 
                            className="flex-1"
                          >
                            Refresh Stats
                          </Button>
                          <Button 
                            onClick={clearAllData} 
                            variant="outline" 
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            Clear All Data
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                        <p className="text-muted-foreground">Loading statistics...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
}