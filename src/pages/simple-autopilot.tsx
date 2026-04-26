import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";
import { Sparkles, Play, Loader2, CheckCircle2, AlertCircle, TrendingUp, Link as LinkIcon, FileText, Share2 } from "lucide-react";

export default function SimpleAutopilot() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check API key on load
  useState(() => {
    if (typeof window !== 'undefined') {
      const key = localStorage.getItem('openai_api_key');
      setHasApiKey(!!key && key.length > 0);
    }
  });

  const runAutopilot = async () => {
    setIsRunning(true);
    setProgress(0);
    setError('');
    setResults(null);

    try {
      // Check API key
      if (typeof window !== 'undefined') {
        const key = localStorage.getItem('openai_api_key');
        if (!key || key.length === 0) {
          setError('OpenAI API key required! Go to Settings → API Keys to add your key.');
          setIsRunning(false);
          return;
        }
      }

      // Step 1: Discover products
      setStep('🔍 AI discovering trending products...');
      setProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));

      const productResults = await realAutopilotEngine.runAutopilot('Smart Home Devices');

      // Step 2: Links created
      setStep('🔗 Created affiliate tracking links');
      setProgress(40);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Content generated
      setStep('✍️ AI writing articles...');
      setProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 4: Social posts
      setStep('📱 AI generating social posts...');
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Done
      setStep('✅ Autopilot complete!');
      setProgress(100);
      setResults(productResults);

    } catch (err: any) {
      console.error('Autopilot error:', err);
      setError(err.message || 'An error occurred. Check console for details.');
      setProgress(0);
      setStep('');
    } finally {
      setIsRunning(false);
    }
  };

  const stats = realAutopilotEngine.getStats();

  return (
    <>
      <SEO 
        title="Simple AutoPilot - 100% Real AI Automation"
        description="Clean, simple AI-powered affiliate automation"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-5xl mx-auto px-4 py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">Simple AutoPilot</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              100% Real AI-Powered Affiliate Automation
            </p>
            
            {hasApiKey ? (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                OpenAI Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                API Key Required
              </Badge>
            )}
          </div>

          {/* Main Card */}
          <Card className="p-8 space-y-6">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Run AI Autopilot</h2>
              <p className="text-muted-foreground">
                Click the button below to discover trending products, create affiliate links, 
                generate AI-written articles, and publish to social media - all in one click.
              </p>
            </div>

            {/* Run Button */}
            <Button
              onClick={runAutopilot}
              disabled={isRunning}
              size="lg"
              className="w-full gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Running AI Autopilot...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Run AI Autopilot
                </>
              )}
            </Button>

            {/* Progress */}
            {isRunning && (
              <div className="space-y-2">
                <Progress value={progress} />
                <p className="text-sm text-center text-muted-foreground">
                  {step}
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {error}
                </p>
              </div>
            )}

            {/* Statistics */}
            <div className="pt-6 border-t">
              <h3 className="font-semibold mb-4">Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Products</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.products}</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Links</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.links}</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Articles</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.content}</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Share2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Posts</p>
                  </div>
                  <p className="text-3xl font-bold">{stats.posts}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Results */}
          {results && (
            <div className="grid md:grid-cols-3 gap-6">
              {/* Products */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Products</h3>
                </div>
                <div className="space-y-3">
                  {results.products.map((p: any, i: number) => (
                    <div key={i} className="text-sm space-y-1">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground">${p.price}</p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Content */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Articles</h3>
                </div>
                <div className="space-y-3">
                  {results.content.map((c: any, i: number) => (
                    <div key={i} className="text-sm space-y-1">
                      <p className="font-medium line-clamp-2">{c.title}</p>
                      <p className="text-muted-foreground">
                        {c.body.split(' ').length} words
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Posts */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Social Posts</h3>
                </div>
                <div className="space-y-3">
                  {results.posts.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="text-sm">
                      <Badge variant="outline" className="mb-1">
                        {p.platform}
                      </Badge>
                      <p className="text-muted-foreground line-clamp-2">
                        {p.caption}
                      </p>
                    </div>
                  ))}
                  {results.posts.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      +{results.posts.length - 5} more posts
                    </p>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Help */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>No API Key?</strong> Go to Settings → API Keys to add your OpenAI key</li>
              <li>• <strong>JSON Error?</strong> This is normal - the system auto-retries and handles it</li>
              <li>• <strong>Want More Products?</strong> Run autopilot multiple times with different niches</li>
              <li>• <strong>View All Data?</strong> Check the Statistics section above</li>
            </ul>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
}