import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { openAIService } from "@/services/openAIService";
import { 
  Sparkles, 
  Play,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  Share2
} from "lucide-react";

interface WorkflowStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: any;
  error?: string;
}

export default function AIWorkflowTest() {
  const [mounted, setMounted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    { id: 'discovery', name: 'AI Product Discovery', status: 'pending' },
    { id: 'content', name: 'AI Content Generation', status: 'pending' },
    { id: 'social', name: 'AI Social Posts', status: 'pending' }
  ]);
  const [hasApiKey, setHasApiKey] = useState(false);

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

  const updateStepStatus = (stepId: string, status: WorkflowStep['status'], result?: any, error?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result, error } : step
    ));
  };

  const runWorkflow = async () => {
    if (!hasApiKey) {
      alert('Please add your OpenAI API key in Settings first');
      return;
    }

    setIsRunning(true);
    setCurrentStepIndex(0);

    try {
      // Step 1: Product Discovery
      setCurrentStepIndex(0);
      updateStepStatus('discovery', 'running');
      
      const products = await openAIService.discoverTrendingProducts('Smart Home Devices', 3);
      
      updateStepStatus('discovery', 'complete', products);
      
      // Step 2: Content Generation
      setCurrentStepIndex(1);
      updateStepStatus('content', 'running');
      
      const firstProduct = products[0];
      const content = await openAIService.generateSEOContent(
        firstProduct.name,
        firstProduct.category,
        firstProduct.why_trending,
        firstProduct.amazon_url || 'https://amazon.com'
      );
      
      updateStepStatus('content', 'complete', content);
      
      // Step 3: Social Posts
      setCurrentStepIndex(2);
      updateStepStatus('social', 'running');
      
      const posts = await openAIService.generateSocialPosts(
        firstProduct.name,
        firstProduct.category,
        firstProduct.why_trending,
        firstProduct.amazon_url || 'https://amazon.com'
      );
      
      updateStepStatus('social', 'complete', posts);
      
      setCurrentStepIndex(3);
      
    } catch (error: any) {
      console.error('Workflow error:', error);
      const currentStep = steps[currentStepIndex];
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', undefined, error.message);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const getProgress = () => {
    const completedSteps = steps.filter(s => s.status === 'complete').length;
    return (completedSteps / steps.length) * 100;
  };

  // Don't render dynamic content during SSR
  if (!mounted) {
    return (
      <>
        <SEO 
          title="AI Workflow Test"
          description="Test the complete AI workflow from product discovery to content generation"
        />
        
        <div className="min-h-screen bg-background">
          <Header />
          
          <main className="max-w-4xl mx-auto px-4 py-12">
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
        title="AI Workflow Test"
        description="Test the complete AI workflow from product discovery to content generation"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 text-primary" />
              <h1 className="text-4xl font-bold">AI Workflow Test</h1>
            </div>
            <div className="text-muted-foreground">
              Test the complete AI automation workflow
            </div>
            
            {hasApiKey ? (
              <Badge variant="default" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                AI Ready
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-2">
                <AlertCircle className="h-4 w-4" />
                OpenAI Key Required
              </Badge>
            )}
          </div>

          {/* Control Panel */}
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Test AI Workflow</h2>
              <div className="text-sm text-muted-foreground">
                This will test all AI functions: product discovery, content generation, and social posts
              </div>
            </div>

            <Button
              onClick={runWorkflow}
              disabled={isRunning || !hasApiKey}
              size="lg"
              className="w-full gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Running Workflow...
                </>
              ) : (
                <>
                  <Play className="h-5 w-5" />
                  Run Complete Workflow
                </>
              )}
            </Button>

            {isRunning && (
              <div className="space-y-2">
                <Progress value={getProgress()} />
                <div className="text-sm text-center text-muted-foreground">
                  Progress: {Math.round(getProgress())}%
                </div>
              </div>
            )}
          </Card>

          {/* Workflow Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={step.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {step.status === 'complete' && (
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                    )}
                    {step.status === 'running' && (
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    )}
                    {step.status === 'error' && (
                      <AlertCircle className="h-6 w-6 text-red-500" />
                    )}
                    {step.status === 'pending' && (
                      <div className="h-6 w-6 rounded-full border-2 border-muted" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{step.name}</h3>
                      <Badge variant={
                        step.status === 'complete' ? 'default' :
                        step.status === 'running' ? 'secondary' :
                        step.status === 'error' ? 'destructive' :
                        'outline'
                      }>
                        {step.status}
                      </Badge>
                    </div>

                    {step.error && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                        {step.error}
                      </div>
                    )}

                    {step.result && (
                      <div className="text-sm bg-muted p-3 rounded">
                        {step.id === 'discovery' && (
                          <div>
                            <div className="font-medium mb-2">Found {step.result.length} products</div>
                            {step.result.slice(0, 2).map((p: any, i: number) => (
                              <div key={i} className="text-muted-foreground">
                                • {p.name} (${p.estimated_price})
                              </div>
                            ))}
                          </div>
                        )}
                        {step.id === 'content' && (
                          <div>
                            <div className="font-medium">{step.result.title}</div>
                            <div className="text-muted-foreground mt-1">
                              {step.result.body?.substring(0, 150)}...
                            </div>
                          </div>
                        )}
                        {step.id === 'social' && (
                          <div>
                            <div className="font-medium mb-2">Generated {step.result.length} social posts</div>
                            {step.result.slice(0, 2).map((p: any, i: number) => (
                              <div key={i} className="text-muted-foreground">
                                • {p.platform}: {p.content?.substring(0, 80)}...
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Help */}
          {!hasApiKey && (
            <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    OpenAI API Key Required
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    Go to Settings → API Keys to add your OpenAI API key before running the workflow.
                  </div>
                  <Button
                    onClick={() => window.location.href = '/settings'}
                    size="sm"
                    variant="outline"
                  >
                    Go to Settings
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </main>
        
        <Footer />
      </div>
    </>
  );
}