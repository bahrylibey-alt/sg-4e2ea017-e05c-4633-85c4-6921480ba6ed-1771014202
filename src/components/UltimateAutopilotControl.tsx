import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Rocket, Zap, TrendingUp, Shield, RefreshCw, Sparkles } from "lucide-react";
import { ultimateAutopilot } from "@/services/ultimateAutopilot";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { useToast } from "@/hooks/use-toast";

export function UltimateAutopilotControl() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [linkHealth, setLinkHealth] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadLinkHealth();
  }, []);

  const loadLinkHealth = async () => {
    const health = await linkHealthMonitor.getHealthDashboard();
    setLinkHealth(health);
  };

  const handleUltimateDeploy = async () => {
    setIsDeploying(true);
    try {
      const result = await ultimateAutopilot.oneClickUltimateDeploy({
        dailyBudget: 1000,
        targetRevenue: 10000,
        autoOptimize: true,
        autoRepairLinks: true,
        autoRotateProducts: true,
        smartTrafficRouting: true,
      });

      setDeploymentResult(result);

      if (result.success) {
        toast({
          title: "🚀 Ultimate Autopilot Deployed!",
          description: `Created ${result.productsAdded} products, ${result.tasksCreated} tasks. Estimated daily revenue: $${result.estimatedRevenue}`,
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: result.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Deployment error:", error);
      toast({
        title: "Error",
        description: "Failed to deploy autopilot system",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleAutoRepair = async () => {
    setIsRepairing(true);
    try {
      const result = await linkHealthMonitor.oneClickAutoRepair();

      if (result.success) {
        toast({
          title: "🔧 Auto-Repair Complete!",
          description: `Fixed ${result.repairedCount} broken links, added ${result.newLinks.length} fresh products`,
        });
        await loadLinkHealth();
      } else {
        toast({
          title: "Repair Failed",
          description: "Unable to repair links",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Repair error:", error);
      toast({
        title: "Error",
        description: "Failed to repair links",
        variant: "destructive",
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleAutoRotate = async () => {
    try {
      const result = await linkHealthMonitor.autoRotateProducts();

      if (result.success) {
        toast({
          title: "🔄 Products Rotated!",
          description: `Removed ${result.removed} underperformers, added ${result.added} trending products`,
        });
        await loadLinkHealth();
      }
    } catch (error) {
      console.error("Rotation error:", error);
      toast({
        title: "Error",
        description: "Failed to rotate products",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Ultimate Deploy Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-6 w-6 text-primary" />
                Ultimate Autopilot System
              </CardTitle>
              <CardDescription>
                Deploy the most sophisticated affiliate marketing system with one click
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              ULTIMATE
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!deploymentResult && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>One-Click Deploy:</strong> Creates complete campaign with 15 verified products, 10 advanced automation tasks, smart traffic routing, AI optimization, and 24/7 monitoring.
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleUltimateDeploy}
            disabled={isDeploying}
            size="lg"
            className="w-full"
          >
            {isDeploying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Deploying Ultimate System...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Ultimate Autopilot
              </>
            )}
          </Button>

          {deploymentResult && deploymentResult.success && (
            <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-green-900 dark:text-green-100">
                ✅ Deployment Successful!
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Products Added</p>
                  <p className="font-bold">{deploymentResult.productsAdded}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tasks Created</p>
                  <p className="font-bold">{deploymentResult.tasksCreated}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Initial Traffic</p>
                  <p className="font-bold">{deploymentResult.initialTraffic}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Est. Daily Revenue</p>
                  <p className="font-bold">${deploymentResult.estimatedRevenue}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Active Features:</p>
                <div className="flex flex-wrap gap-2">
                  {deploymentResult.features.map((feature: string) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Health & Auto-Repair Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Link Health Monitor & Auto-Repair
          </CardTitle>
          <CardDescription>
            Automatically detect and fix broken affiliate links
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {linkHealth && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Links</div>
                <div className="text-2xl font-bold">{linkHealth?.totalLinks || 0}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Broken Links</div>
                <div className="text-2xl font-bold text-red-500">{linkHealth?.brokenLinks || 0}</div>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Health Score</div>
                <div className="text-2xl font-bold text-green-500">{linkHealth?.healthScore || 0}%</div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleAutoRepair}
              disabled={isRepairing}
              className="w-full"
            >
              {isRepairing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Auto-Repair Broken Links
                </>
              )}
            </Button>

            <Button onClick={handleAutoRotate} variant="outline" className="flex-1">
              <TrendingUp className="mr-2 h-4 w-4" />
              Auto-Rotate Products
            </Button>
          </div>

          {linkHealth && linkHealth.needsRepair.length > 0 && (
            <Alert>
              <AlertDescription>
                Found {linkHealth.needsRepair.length} links that need attention. Click Auto-Repair to fix them automatically.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}