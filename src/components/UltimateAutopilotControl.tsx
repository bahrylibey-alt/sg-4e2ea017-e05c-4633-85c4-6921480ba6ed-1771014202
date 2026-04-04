import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Rocket, Activity, TrendingUp, Zap, AlertCircle, CheckCircle2 } from "lucide-react";
import { ultimateAutopilot } from "@/services/ultimateAutopilot";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { useToast } from "@/hooks/use-toast";

export function UltimateAutopilotControl() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [linkHealth, setLinkHealth] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    const data = await ultimateAutopilot.getDashboardData();
    if (data) {
      setDashboardData(data);
      if (data.campaign) {
        const health = await linkHealthMonitor.getHealthDashboard(data.campaign.id);
        setLinkHealth(health);
      }
    }
    setIsLoading(false);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const result = await ultimateAutopilot.oneClickUltimateDeploy();
      
      if (result.success) {
        toast({
          title: "🚀 Ultimate Autopilot Deployed!",
          description: `Campaign created with ${result.productsAdded} products, ${result.tasksCreated} automated tasks. Est. Revenue: $${result.estimatedRevenue}/month`,
        });
        
        await loadDashboard();
      } else {
        toast({
          title: "Deployment Failed",
          description: "Please check console for details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Deploy error:", error);
      toast({
        title: "Deployment Error",
        description: "An error occurred during deployment",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAutoRepair = async () => {
    if (!dashboardData?.campaign) {
      toast({
        title: "No Campaign Found",
        description: "Deploy autopilot first to enable auto-repair",
        variant: "destructive",
      });
      return;
    }
    
    setIsRepairing(true);
    try {
      const result = await linkHealthMonitor.oneClickAutoRepair(
        dashboardData.campaign.id,
        dashboardData.campaign.user_id
      );
      
      toast({
        title: "Auto-Repair Complete",
        description: `Scanned ${result.totalChecked} links. Removed ${result.removed} broken links. Added ${result.replaced} fresh products.`,
      });
      
      await loadDashboard();
    } catch (error) {
      console.error("Repair error:", error);
      toast({
        title: "Repair Failed",
        description: "Please check console for details",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Ultimate Autopilot Control
              </CardTitle>
              <CardDescription>
                Deploy complete hands-free affiliate marketing system in one click
              </CardDescription>
            </div>
            {dashboardData?.campaign && (
              <Badge variant="default" className="h-8">
                <Activity className="h-4 w-4 mr-2" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Deployment Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Deploy</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleDeploy} 
                  disabled={isDeploying}
                  className="w-full"
                  size="lg"
                >
                  {isDeploying ? (
                    <>
                      <Activity className="mr-2 h-5 w-5 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Rocket className="mr-2 h-5 w-5" />
                      Deploy Ultimate Autopilot
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Creates campaign, adds 15 trending products, generates links, starts 24/7 automation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Link Health Monitor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Total Links</div>
                    <div className="text-2xl font-bold">{linkHealth?.totalLinks || 0}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Broken</div>
                    <div className="text-2xl font-bold text-red-500">{linkHealth?.brokenLinks || 0}</div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Health</div>
                    <div className="text-2xl font-bold text-green-500">{linkHealth?.healthScore || 0}%</div>
                  </div>
                </div>

                <Button 
                  onClick={handleAutoRepair} 
                  disabled={isRepairing || !dashboardData?.campaign}
                  className="w-full"
                  variant="outline"
                >
                  {isRepairing ? (
                    <>
                      <Activity className="mr-2 h-4 w-4 animate-spin" />
                      Repairing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Auto-Repair Broken Links
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Dashboard Stats */}
          {dashboardData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Active Products</div>
                    <div className="text-2xl font-bold">{dashboardData.products?.length || 0}</div>
                    <Progress value={dashboardData.products?.length ? 100 : 0} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Total Clicks</div>
                    <div className="text-2xl font-bold">{dashboardData.totalClicks || 0}</div>
                    <Progress value={Math.min((dashboardData.totalClicks / 1000) * 100, 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Conversions</div>
                    <div className="text-2xl font-bold">{dashboardData.totalConversions || 0}</div>
                    <Progress value={Math.min((dashboardData.totalConversions / 50) * 100, 100)} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="text-2xl font-bold">${dashboardData.totalRevenue?.toFixed(0) || 0}</div>
                    <Progress value={Math.min((dashboardData.totalRevenue / 5000) * 100, 100)} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Tasks */}
          {dashboardData?.tasks && dashboardData.tasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Automation Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dashboardData.tasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <div>
                          <div className="font-medium">{task.task_type}</div>
                          <div className="text-xs text-muted-foreground">
                            Priority: {task.priority} | Success: {task.success_count || 0}
                          </div>
                        </div>
                      </div>
                      <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What Gets Deployed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">15 Trending Products</div>
                    <div className="text-sm text-muted-foreground">Latest high-converting Amazon products</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Smart Traffic Generation</div>
                    <div className="text-sm text-muted-foreground">Automated multi-channel traffic sources</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">AI Optimization</div>
                    <div className="text-sm text-muted-foreground">Automatic revenue & conversion optimization</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">24/7 Monitoring</div>
                    <div className="text-sm text-muted-foreground">Continuous performance tracking & alerts</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Auto Link Repair</div>
                    <div className="text-sm text-muted-foreground">Detects & replaces broken affiliate links</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Content Automation</div>
                    <div className="text-sm text-muted-foreground">Auto-generates promotional content</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}