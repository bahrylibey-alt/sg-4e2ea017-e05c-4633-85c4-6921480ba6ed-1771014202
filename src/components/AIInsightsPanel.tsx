import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Lightbulb, Target, RefreshCw, AlertCircle } from "lucide-react";
import { aiInsightsEngine } from "@/services/aiInsightsEngine";
import { useToast } from "@/hooks/use-toast";

interface AIInsightsPanelProps {
  userId: string;
}

export function AIInsightsPanel({ userId }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout - taking too long')), 15000)
      );

      const insightsPromise = aiInsightsEngine.generateInsights(userId);

      const data = await Promise.race([insightsPromise, timeoutPromise]) as any;
      
      setInsights(data);
      setError(null);
    } catch (error: any) {
      console.error("Failed to load insights:", error);
      setError(error.message || "Failed to load AI insights");
      
      // Don't show toast for timeout - just show error state
      if (!error.message?.includes('timeout')) {
        toast({
          title: "Error",
          description: "Failed to load AI insights",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, [userId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Analyzing your performance data...</p>
          </div>
          <p className="text-xs text-muted-foreground">This may take up to 15 seconds</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-orange-500">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <div className="space-y-3">
          <p className="text-sm text-orange-600">{error}</p>
          <Button onClick={loadInsights} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <p className="text-sm text-muted-foreground">No insights available yet. Post some content to get started!</p>
        <Button onClick={loadInsights} variant="outline" size="sm" className="mt-3">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </Card>
    );
  }

  const getTrafficStateBadge = () => {
    const { trafficState } = insights.summary;
    const colors = {
      NO_DATA: "bg-gray-500",
      LOW: "bg-yellow-500",
      ACTIVE: "bg-blue-500",
      SCALING: "bg-green-500",
    };
    return (
      <Badge className={colors[trafficState]}>
        {trafficState.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">AI Insights</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInsights}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="space-y-4">
          {/* Traffic State */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Traffic State:</span>
            {getTrafficStateBadge()}
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{insights.summary.totalPosts}</div>
              <div className="text-xs text-muted-foreground">Total Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{insights.summary.winners}</div>
              <div className="text-xs text-muted-foreground">Winners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{insights.summary.testing}</div>
              <div className="text-xs text-muted-foreground">Testing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{insights.summary.weak}</div>
              <div className="text-xs text-muted-foreground">Weak</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Performers */}
      {(insights.topPerformers.bestPlatform || insights.topPerformers.bestHook || insights.topPerformers.topProduct) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Top Performers</h3>
          </div>

          <div className="space-y-3">
            {insights.topPerformers.bestPlatform && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Best Platform:</span>
                <Badge variant="outline">{insights.topPerformers.bestPlatform}</Badge>
              </div>
            )}
            {insights.topPerformers.bestHook && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Best Hook:</span>
                <Badge variant="outline">{insights.topPerformers.bestHook}</Badge>
              </div>
            )}
            {insights.topPerformers.topProduct && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Top Product:</span>
                <div className="text-right">
                  <div className="text-sm font-medium">{insights.topPerformers.topProduct.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {(insights.topPerformers.topProduct.conversionRate * 100).toFixed(1)}% conversion
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Recommendations</h3>
          </div>

          <div className="space-y-3">
            {insights.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{rec.type.replace("_", " ")}</span>
                  <Badge
                    variant={
                      rec.priority === "HIGH"
                        ? "destructive"
                        : rec.priority === "MEDIUM"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {rec.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{rec.action}</p>
                <p className="text-xs text-muted-foreground mt-1">{rec.reason}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Next Steps */}
      {insights.nextSteps.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Next Steps</h3>
          </div>

          <ul className="space-y-2">
            {insights.nextSteps.map((step: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                <span className="text-sm">{step}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Key Insights */}
      {insights.insights.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold mb-3">Key Insights</h3>
          <ul className="space-y-2">
            {insights.insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span className="text-sm text-muted-foreground">{insight}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}