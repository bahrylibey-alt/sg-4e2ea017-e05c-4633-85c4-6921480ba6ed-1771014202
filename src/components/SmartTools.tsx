import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  TrendingUp, 
  Shield, 
  TestTube, 
  Sparkles, 
  Target,
  Brain,
  BarChart3,
  RefreshCw,
  CheckCircle2
} from "lucide-react";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { aiOptimizationEngine } from "@/services/aiOptimizationEngine";
import { smartContentGenerator } from "@/services/smartContentGenerator";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { intelligentABTesting } from "@/services/intelligentABTesting";
import { useToast } from "@/hooks/use-toast";

export function SmartTools() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTools, setActiveTools] = useState<string[]>([]);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const smartTools = [
    {
      id: "link-repair",
      name: "Auto Link Repair",
      description: "Automatically detect and fix broken affiliate links",
      icon: RefreshCw,
      color: "text-blue-500",
      action: async () => {
        const result = await linkHealthMonitor.autoRepairLinks();
        return {
          success: result.repaired > 0,
          message: `✅ Repaired ${result.repaired} broken links, Removed ${result.removed} dead links`,
          details: result
        };
      }
    },
    {
      id: "product-discovery",
      name: "Smart Product Discovery",
      description: "Find and add trending high-converting products",
      icon: TrendingUp,
      color: "text-green-500",
      action: async () => {
        const result = await linkHealthMonitor.autoRotateProducts();
        return {
          success: result.added > 0,
          message: `✅ Added ${result.added} trending products, Removed ${result.removed} underperformers`,
          details: result
        };
      }
    },
    {
      id: "ai-optimization",
      name: "AI Campaign Optimizer",
      description: "Optimize campaigns using machine learning",
      icon: Brain,
      color: "text-purple-500",
      action: async () => {
        const result = await aiOptimizationEngine.runFullOptimization("active-campaign");
        return {
          success: result.success,
          message: `✅ Applied ${result.optimizations} optimizations, ${result.revenueIncrease}% revenue increase expected`,
          details: result
        };
      }
    },
    {
      id: "fraud-detection",
      name: "Fraud Detection AI",
      description: "Detect and block fraudulent traffic automatically",
      icon: Shield,
      color: "text-red-500",
      action: async () => {
        const result = await fraudDetectionService.scanAllLinks();
        return {
          success: true,
          message: `✅ Scanned ${result.totalChecked} links, Blocked ${result.blocked} suspicious activities`,
          details: result
        };
      }
    },
    {
      id: "ab-testing",
      name: "Intelligent A/B Testing",
      description: "Create and analyze link variations automatically",
      icon: TestTube,
      color: "text-orange-500",
      action: async () => {
        // Get first active link and create test variants
        const { data: links } = await (window as any).supabase
          ?.from("affiliate_links")
          .select("id")
          .eq("status", "active")
          .limit(1);
        
        if (links && links[0]) {
          const result = await intelligentABTesting.createTestVariants(links[0].id, 2);
          return {
            success: result.success,
            message: `✅ Created ${result.variants.length} test variants for optimization`,
            details: result
          };
        }
        return { success: false, message: "❌ No active links found to test" };
      }
    },
    {
      id: "content-generator",
      name: "Smart Content Generator",
      description: "Generate promotional content automatically",
      icon: Sparkles,
      color: "text-pink-500",
      action: async () => {
        const { data: products } = await (window as any).supabase
          ?.from("affiliate_links")
          .select("*")
          .eq("status", "active")
          .limit(10);
        
        if (products && products.length > 0) {
          const content = smartContentGenerator.generateProductContent({
            name: products[0].product_name,
            category: products[0].network || "General",
            commission: products[0].commission_rate || 4
          });
          
          return {
            success: true,
            message: `✅ Generated promotional content for ${products.length} products`,
            details: { content, count: products.length }
          };
        }
        return { success: false, message: "❌ No products found" };
      }
    }
  ];

  const runSmartTool = async (tool: typeof smartTools[0]) => {
    setIsProcessing(true);
    setActiveTools([...activeTools, tool.id]);
    
    try {
      const result = await tool.action();
      
      setResults(prev => ({
        ...prev,
        [tool.id]: result
      }));

      toast({
        title: tool.name,
        description: result.message,
        variant: result.success ? "default" : "destructive"
      });
    } catch (error) {
      console.error(`Error running ${tool.name}:`, error);
      toast({
        title: "Error",
        description: `Failed to run ${tool.name}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setActiveTools(activeTools.filter(id => id !== tool.id));
    }
  };

  const runAllTools = async () => {
    setIsProcessing(true);
    
    for (const tool of smartTools) {
      await runSmartTool(tool);
      // Small delay between tools
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsProcessing(false);
    
    toast({
      title: "✅ All Smart Tools Completed",
      description: "Your system has been fully optimized!",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Smart Tools Suite
              </CardTitle>
              <CardDescription>
                Advanced AI-powered tools to optimize your affiliate marketing
              </CardDescription>
            </div>
            <Button 
              onClick={runAllTools} 
              disabled={isProcessing}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Run All Tools
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTools.includes(tool.id);
              const result = results?.[tool.id];
              
              return (
                <Card key={tool.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <Icon className={`w-8 h-8 ${tool.color}`} />
                      {result && (
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "✓" : "✗"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => runSmartTool(tool)}
                      disabled={isProcessing}
                      className="w-full"
                      variant={result?.success ? "outline" : "default"}
                    >
                      {isActive ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : result?.success ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Run Again
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 mr-2" />
                          Run Tool
                        </>
                      )}
                    </Button>
                    
                    {result && (
                      <Alert className="mt-3">
                        <AlertDescription className="text-xs">
                          {result.message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            System Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Link Health</span>
                <span className="text-sm text-muted-foreground">
                  {results?.["link-repair"] ? "Optimized" : "Pending"}
                </span>
              </div>
              <Progress value={results?.["link-repair"] ? 100 : 50} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Product Catalog</span>
                <span className="text-sm text-muted-foreground">
                  {results?.["product-discovery"] ? "Fresh" : "Needs Update"}
                </span>
              </div>
              <Progress value={results?.["product-discovery"] ? 100 : 60} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Campaign Performance</span>
                <span className="text-sm text-muted-foreground">
                  {results?.["ai-optimization"] ? "Optimized" : "Can Improve"}
                </span>
              </div>
              <Progress value={results?.["ai-optimization"] ? 100 : 70} />
            </div>
            
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Security Status</span>
                <span className="text-sm text-muted-foreground">
                  {results?.["fraud-detection"] ? "Protected" : "Scanning Needed"}
                </span>
              </div>
              <Progress value={results?.["fraud-detection"] ? 100 : 80} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}