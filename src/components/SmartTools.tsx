import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Zap, TrendingUp, Target, DollarSign, Shield, FlaskConical, Sparkles, BarChart3 } from "lucide-react";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { smartProductDiscovery } from "@/services/smartProductDiscovery";
import { aiOptimizationEngine } from "@/services/aiOptimizationEngine";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { intelligentABTesting } from "@/services/intelligentABTesting";
import { supabase } from "@/integrations/supabase/client";

interface SmartTool {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  action: () => Promise<{ success: boolean; message: string; details?: any }>;
}

export function SmartTools() {
  const [runningTool, setRunningTool] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string; details?: any }>>({});

  const tools: SmartTool[] = [
    {
      id: "link-repair",
      name: "Auto Link Repair",
      description: "Detect and fix broken affiliate links automatically",
      icon: Zap,
      color: "text-blue-500",
      action: async () => {
        try {
          const result = await linkHealthMonitor.oneClickAutoRepair();
          return {
            success: true,
            message: `✅ Scanned ${result.totalChecked} links. Removed ${result.invalidRemoved + result.duplicatesRemoved} broken links and Added ${result.replaced} fresh verified products.`,
            details: result
          };
        } catch (error) {
          console.error("Link repair error:", error);
          return {
            success: false,
            message: "❌ Link repair failed. Check console for details."
          };
        }
      }
    },
    {
      id: "product-discovery",
      name: "Smart Product Discovery",
      description: "Find and add trending products automatically",
      icon: TrendingUp,
      color: "text-green-500",
      action: async () => {
        try {
          // Get first active campaign and user
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id, user_id")
            .eq("status", "active")
            .limit(1);

          if (!campaigns || campaigns.length === 0) {
            return {
              success: false,
              message: "❌ No active campaigns found. Create a campaign first."
            };
          }

          const campaign = campaigns[0];
          const result = await smartProductDiscovery.addToCampaign(
            campaign.id,
            campaign.user_id,
            10
          );

          return {
            success: result.success,
            message: `✅ Added ${result.added} trending products to campaign`,
            details: result
          };
        } catch (error) {
          console.error("Product discovery error:", error);
          return {
            success: false,
            message: "❌ Product discovery failed. Check console for details."
          };
        }
      }
    },
    {
      id: "campaign-optimizer",
      name: "AI Campaign Optimizer",
      description: "Optimize campaigns for maximum revenue",
      icon: Target,
      color: "text-purple-500",
      action: async () => {
        try {
          // Get first active campaign
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id")
            .eq("status", "active")
            .limit(1);

          if (!campaigns || campaigns.length === 0) {
            return {
              success: false,
              message: "❌ No active campaigns found"
            };
          }

          const result = await aiOptimizationEngine.optimizeCampaign(campaigns[0].id);
          return {
            success: result.success,
            message: `✅ Applied ${result.optimizations} optimizations. Estimated ${result.revenueIncrease}% revenue increase`,
            details: result
          };
        } catch (error) {
          console.error("Campaign optimization error:", error);
          return {
            success: false,
            message: "❌ Optimization failed. Check console for details."
          };
        }
      }
    },
    {
      id: "revenue-maximizer",
      name: "Revenue Maximizer",
      description: "Maximize revenue across all campaigns",
      icon: DollarSign,
      color: "text-yellow-500",
      action: async () => {
        try {
          // Get all active campaigns
          const { data: campaigns } = await supabase
            .from("campaigns")
            .select("id")
            .eq("status", "active");

          if (!campaigns || campaigns.length === 0) {
            return {
              success: false,
              message: "❌ No active campaigns found"
            };
          }

          let totalOptimizations = 0;
          for (const campaign of campaigns) {
            const result = await aiOptimizationEngine.optimizeCampaign(campaign.id);
            totalOptimizations += result.optimizations || 0;
          }

          return {
            success: true,
            message: `✅ Applied ${totalOptimizations} revenue optimizations across ${campaigns.length} campaigns`
          };
        } catch (error) {
          console.error("Revenue maximizer error:", error);
          return {
            success: false,
            message: "❌ Revenue maximization failed"
          };
        }
      }
    },
    {
      id: "fraud-detection",
      name: "Fraud Detection AI",
      description: "Detect and block suspicious traffic",
      icon: Shield,
      color: "text-red-500",
      action: async () => {
        try {
          const result = await fraudDetectionService.monitorAllLinks();
          return {
            success: true,
            message: `✅ Scanned ${result.totalChecked} links. Blocked ${result.blocked} suspicious activities`,
            details: result
          };
        } catch (error) {
          console.error("Fraud detection error:", error);
          return {
            success: false,
            message: "❌ Fraud detection failed"
          };
        }
      }
    },
    {
      id: "ab-testing",
      name: "A/B Testing Suite",
      description: "Create and analyze link variations",
      icon: FlaskConical,
      color: "text-indigo-500",
      action: async () => {
        try {
          // Get first active link
          const { data: links } = await supabase
            .from("affiliate_links")
            .select("id")
            .eq("status", "active")
            .limit(1);

          if (!links || links.length === 0) {
            return {
              success: false,
              message: "❌ No active links found to test"
            };
          }

          const result = await intelligentABTesting.createTestVariants(links[0].id, 2);
          return {
            success: result.success,
            message: `✅ Created ${result.variants.length} test variants`,
            details: result
          };
        } catch (error) {
          console.error("A/B testing error:", error);
          return {
            success: false,
            message: "❌ A/B testing failed"
          };
        }
      }
    },
    {
      id: "analytics",
      name: "Performance Analytics",
      description: "Generate comprehensive performance report",
      icon: BarChart3,
      color: "text-cyan-500",
      action: async () => {
        try {
          // Get analytics data
          const { data: links, error } = await supabase
            .from("affiliate_links")
            .select("clicks, conversions, revenue")
            .eq("status", "active");

          if (error || !links) {
            return {
              success: false,
              message: "❌ Failed to fetch analytics data"
            };
          }

          const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
          const totalConversions = links.reduce((sum, l) => sum + (l.conversions || 0), 0);
          const totalRevenue = links.reduce((sum, l) => sum + (l.revenue || 0), 0);
          const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0";

          return {
            success: true,
            message: `✅ ${totalClicks} clicks, ${totalConversions} conversions (${conversionRate}% rate), $${totalRevenue.toFixed(2)} revenue`,
            details: { totalClicks, totalConversions, totalRevenue, conversionRate }
          };
        } catch (error) {
          console.error("Analytics error:", error);
          return {
            success: false,
            message: "❌ Analytics generation failed"
          };
        }
      }
    }
  ];

  const runSmartTool = async (tool: SmartTool) => {
    setRunningTool(tool.id);
    try {
      const result = await tool.action();
      setResults(prev => ({ ...prev, [tool.id]: result }));
    } catch (error) {
      console.error(`Error running tool ${tool.id}:`, error);
      setResults(prev => ({
        ...prev,
        [tool.id]: { success: false, message: "❌ Tool execution failed" }
      }));
    } finally {
      setRunningTool(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Smart Tools Suite
              </CardTitle>
              <CardDescription>
                AI-powered tools to optimize your affiliate marketing
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool) => (
              <Card key={tool.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-muted`}>
                          <tool.icon className={`h-5 w-5 ${tool.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => runSmartTool(tool)}
                      disabled={runningTool === tool.id}
                      className="w-full"
                      size="sm"
                    >
                      {runningTool === tool.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        "Run Tool"
                      )}
                    </Button>

                    {results[tool.id] && (
                      <Alert variant={results[tool.id].success ? "default" : "destructive"}>
                        <AlertDescription className="text-sm">
                          {results[tool.id].message}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}