import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, 
  TrendingUp, 
  Lightbulb, 
  Clock, 
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { aiInsightsEngine } from "@/services/aiInsightsEngine";
import type { ChannelInsight, ContentAdjustment } from "@/services/aiInsightsEngine";

export function AIInsightsPanel() {
  const [insights, setInsights] = useState<ChannelInsight[]>([]);
  const [adjustments, setAdjustments] = useState<ContentAdjustment[]>([]);
  const [bestTimes, setBestTimes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [insightsData, adjustmentsData, timesData, summaryData] = await Promise.all([
        aiInsightsEngine.generateChannelInsights(user.id),
        aiInsightsEngine.generateContentAdjustments(user.id),
        aiInsightsEngine.getBestPostingTimes(user.id),
        aiInsightsEngine.getPerformanceSummary(user.id)
      ]);

      setInsights(insightsData);
      setAdjustments(adjustmentsData);
      setBestTimes(timesData);
      setSummary(summaryData);

    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInsights();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/20';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20';
      case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600';
      case 'B': return 'text-blue-600';
      case 'C': return 'text-yellow-600';
      case 'D': return 'text-orange-600';
      case 'F': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Summary */}
      {summary && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Performance Analysis</CardTitle>
                  <CardDescription>Real-time insights from your content data</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-6xl font-bold ${getGradeColor(summary.grade)} mb-2`}>
                  {summary.grade}
                </div>
                <div className="text-sm text-muted-foreground">Performance Grade</div>
                <Progress value={summary.score} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">{summary.score}/100</div>
              </div>
              
              <div className="border-l pl-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Top Win</div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{summary.topWin}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Top Opportunity</div>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{summary.topOpportunity}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-l pl-6">
                <div className="text-sm text-muted-foreground mb-2">Summary</div>
                <p className="text-sm leading-relaxed">{summary.summary}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Tabs */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">
            <TrendingUp className="w-4 h-4 mr-2" />
            Channel Insights ({insights.length})
          </TabsTrigger>
          <TabsTrigger value="adjustments">
            <Zap className="w-4 h-4 mr-2" />
            Content Tips ({adjustments.length})
          </TabsTrigger>
          <TabsTrigger value="timing">
            <Clock className="w-4 h-4 mr-2" />
            Best Times ({bestTimes.length})
          </TabsTrigger>
        </TabsList>

        {/* Channel Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No insights yet. Start posting content to get AI-powered recommendations.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">{insight.channel}</Badge>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority} priority
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">{insight.metric}</div>
                      <div className="text-sm font-semibold">
                        {insight.currentValue.toFixed(1)} → {insight.targetValue.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">📊 Insight</div>
                      <p className="text-sm text-muted-foreground">{insight.insight}</p>
                    </div>

                    <div className="border-t pt-3">
                      <div className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-600" />
                        Recommendation
                      </div>
                      <p className="text-sm">{insight.recommendation}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/20">
                        {insight.expectedImprovement}
                      </Badge>
                      <Button size="sm" variant="outline">
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Content Adjustments Tab */}
        <TabsContent value="adjustments" className="space-y-4">
          {adjustments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
                  <p>No adjustments needed! Your content is performing well.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            adjustments.map((adjustment, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <Badge variant="outline" className="capitalize">{adjustment.type}</Badge>
                    <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/20">
                      {adjustment.expectedImpact}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Current</div>
                        <div className="text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-900">
                          {adjustment.current}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Suggested</div>
                        <div className="text-sm bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200 dark:border-green-900">
                          {adjustment.suggested}
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <div className="text-xs text-muted-foreground mb-1">Why This Works</div>
                      <p className="text-sm">{adjustment.reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Best Times Tab */}
        <TabsContent value="timing" className="space-y-4">
          {bestTimes.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Need more data to determine best posting times.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            bestTimes.map((timing, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="outline" className="capitalize">{timing.platform}</Badge>
                    <Clock className="w-5 h-5 text-primary" />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Best Posting Hours</div>
                      <div className="flex gap-2">
                        {timing.bestHours.map((hour: number) => (
                          <Badge key={hour} variant="secondary" className="text-base px-4 py-2">
                            {hour}:00
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <p className="text-sm text-muted-foreground">{timing.reason}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}