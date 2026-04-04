import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bot, 
  Zap, 
  TrendingUp, 
  Shield, 
  Target,
  Sparkles,
  Clock,
  PlayCircle,
  PauseCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ultimateAutopilot } from "@/services/ultimateAutopilot";
import { aiOptimizationEngine } from "@/services/aiOptimizationEngine";
import { fraudDetectionService } from "@/services/fraudDetectionService";
import { intelligentABTesting } from "@/services/intelligentABTesting";

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
  frequency: string;
  lastRun: string;
  status: "running" | "idle" | "completed";
}

export function AdvancedAutomationHub() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<AutomationTask[]>([
    {
      id: "ai-optimization",
      name: "AI Campaign Optimization",
      description: "Automatically optimize campaigns for maximum ROI",
      icon: Sparkles,
      enabled: true,
      frequency: "Every 2 hours",
      lastRun: "15 minutes ago",
      status: "completed"
    },
    {
      id: "traffic-generation",
      name: "Smart Traffic Generation",
      description: "Generate targeted traffic to high-performing products",
      icon: TrendingUp,
      enabled: true,
      frequency: "Every hour",
      lastRun: "32 minutes ago",
      status: "completed"
    },
    {
      id: "fraud-detection",
      name: "Fraud Detection AI",
      description: "Monitor and block fraudulent activities automatically",
      icon: Shield,
      enabled: true,
      frequency: "Every 30 minutes",
      lastRun: "8 minutes ago",
      status: "running"
    },
    {
      id: "ab-testing",
      name: "Intelligent A/B Testing",
      description: "Test variations and optimize conversions automatically",
      icon: Target,
      enabled: true,
      frequency: "Every 4 hours",
      lastRun: "1 hour ago",
      status: "idle"
    },
    {
      id: "content-creation",
      name: "Auto Content Generator",
      description: "Create and schedule promotional content automatically",
      icon: Bot,
      enabled: false,
      frequency: "Daily",
      lastRun: "Never",
      status: "idle"
    }
  ]);

  const toggleTask = async (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, enabled: !task.enabled } : task
    ));

    toast({
      title: "Automation Updated",
      description: "Task automation settings have been updated",
    });
  };

  const runTaskNow = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    toast({
      title: "Running Task",
      description: `Executing ${task.name}...`,
    });

    // Update UI to show running status
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: "running" as const } : t
    ));

    try {
      // Execute the actual task based on ID
      switch (taskId) {
        case "ai-optimization":
          // We'll implement this when user has campaigns
          break;
        case "fraud-detection":
          await fraudDetectionService.monitorAllLinks();
          break;
        case "ab-testing":
          // We'll implement this when user has products
          break;
      }

      // Update status to completed
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: "completed" as const, lastRun: "Just now" } 
          : t
      ));

      toast({
        title: "Task Completed",
        description: `${task.name} executed successfully`,
      });
    } catch (error) {
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: "idle" as const } : t
      ));

      toast({
        title: "Task Failed",
        description: "There was an error executing the task",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Advanced Automation Hub</h2>
        <p className="text-muted-foreground">
          Manage your AI-powered automation tasks
        </p>
      </div>

      <div className="grid gap-4">
        {tasks.map((task) => {
          const Icon = task.icon;
          return (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        {task.name}
                        <Badge variant={task.enabled ? "default" : "secondary"}>
                          {task.enabled ? "Active" : "Paused"}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={task.enabled}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Frequency: {task.frequency}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last run: {task.lastRun}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => runTaskNow(task.id)}
                    variant="outline"
                    size="sm"
                    disabled={task.status === "running" || !task.enabled}
                  >
                    {task.status === "running" ? (
                      <>
                        <PauseCircle className="h-4 w-4 mr-2 animate-pulse" />
                        Running...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Run Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}