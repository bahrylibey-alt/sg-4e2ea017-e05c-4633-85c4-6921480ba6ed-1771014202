import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  TrendingUp, 
  Link2, 
  FileText, 
  Target, 
  PlayCircle, 
  PauseCircle,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Rocket
} from "lucide-react";

interface AutopilotActivity {
  id: string;
  type: "link_cloaked" | "content_generated" | "campaign_optimized" | "conversion_tracked" | "product_discovered";
  title: string;
  description: string;
  timestamp: Date;
  status: "success" | "processing" | "pending";
}

interface AutopilotMetric {
  label: string;
  value: string;
  change: string;
  icon: React.ElementType;
  color: string;
}

export function AutopilotDashboard() {
  const [isAutopilotActive, setIsAutopilotActive] = useState(true);
  const [activities, setActivities] = useState<AutopilotActivity[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Initialize with recent activities
    const initialActivities: AutopilotActivity[] = [
      {
        id: "1",
        type: "link_cloaked",
        title: "Link Cloaked",
        description: "Amazon product link shortened and tracked",
        timestamp: new Date(Date.now() - 2 * 60000),
        status: "success"
      },
      {
        id: "2",
        type: "content_generated",
        title: "Content Generated",
        description: "Product review for 'Digital Marketing Course' created",
        timestamp: new Date(Date.now() - 5 * 60000),
        status: "success"
      },
      {
        id: "3",
        type: "campaign_optimized",
        title: "Campaign Optimized",
        description: "Summer Launch campaign CTR improved by 12%",
        timestamp: new Date(Date.now() - 15 * 60000),
        status: "success"
      },
      {
        id: "4",
        type: "conversion_tracked",
        title: "Conversion Tracked",
        description: "$89 commission from SEO Tools Suite",
        timestamp: new Date(Date.now() - 30 * 60000),
        status: "success"
      }
    ];
    
    setActivities(initialActivities);
  }, []);

  // Simulate real-time activity updates
  useEffect(() => {
    if (!mounted || !isAutopilotActive) return;

    const activityTypes = [
      {
        type: "link_cloaked" as const,
        title: "Link Cloaked",
        descriptions: [
          "ClickBank product link shortened",
          "ShareASale affiliate link tracked",
          "Commission Junction link optimized",
          "Amazon product link cloaked"
        ]
      },
      {
        type: "content_generated" as const,
        title: "Content Generated",
        descriptions: [
          "Blog post draft created for trending product",
          "Social media posts scheduled",
          "Product comparison article generated",
          "Email sequence drafted"
        ]
      },
      {
        type: "campaign_optimized" as const,
        title: "Campaign Optimized",
        descriptions: [
          "Ad targeting improved based on performance",
          "Landing page headline A/B test winner applied",
          "Email subject line optimized",
          "CTA button color changed for better conversion"
        ]
      },
      {
        type: "conversion_tracked" as const,
        title: "Conversion Tracked",
        descriptions: [
          "$45 commission from Premium Theme",
          "$120 commission from Course Bundle",
          "$67 commission from SEO Tools",
          "$89 commission from E-commerce Pack"
        ]
      },
      {
        type: "product_discovered" as const,
        title: "Product Discovered",
        descriptions: [
          "High-converting fitness program found",
          "New software tool with 50% commission",
          "Trending course added to recommendations",
          "Premium service with recurring commissions"
        ]
      }
    ];

    const interval = setInterval(() => {
      const randomActivity = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const randomDescription = randomActivity.descriptions[Math.floor(Math.random() * randomActivity.descriptions.length)];
      
      const newActivity: AutopilotActivity = {
        id: Date.now().toString(),
        type: randomActivity.type,
        title: randomActivity.title,
        description: randomDescription,
        timestamp: new Date(),
        status: "success"
      };
      
      setActivities(prev => [newActivity, ...prev].slice(0, 10));
    }, 15000); // New activity every 15 seconds

    return () => clearInterval(interval);
  }, [mounted, isAutopilotActive]);

  const metrics: AutopilotMetric[] = [
    {
      label: "Links Tracked",
      value: "1,247",
      change: "+23 today",
      icon: Link2,
      color: "text-blue-500"
    },
    {
      label: "Content Generated",
      value: "89",
      change: "+12 today",
      icon: FileText,
      color: "text-purple-500"
    },
    {
      label: "Campaigns Active",
      value: "24",
      change: "3 optimizing",
      icon: Target,
      color: "text-orange-500"
    },
    {
      label: "Auto Conversions",
      value: "$2,847",
      change: "+18% today",
      icon: TrendingUp,
      color: "text-green-500"
    }
  ];

  const getActivityIcon = (type: AutopilotActivity["type"]) => {
    switch (type) {
      case "link_cloaked":
        return Link2;
      case "content_generated":
        return FileText;
      case "campaign_optimized":
        return Target;
      case "conversion_tracked":
        return TrendingUp;
      case "product_discovered":
        return Rocket;
    }
  };

  const getActivityColor = (type: AutopilotActivity["type"]) => {
    switch (type) {
      case "link_cloaked":
        return "text-blue-500 bg-blue-500/10";
      case "content_generated":
        return "text-purple-500 bg-purple-500/10";
      case "campaign_optimized":
        return "text-orange-500 bg-orange-500/10";
      case "conversion_tracked":
        return "text-green-500 bg-green-500/10";
      case "product_discovered":
        return "text-pink-500 bg-pink-500/10";
    }
  };

  const getTimeAgo = (date: Date) => {
    if (!mounted) return "Just now";
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (!mounted) return null;

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-muted/30" data-section="autopilot">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            <Zap className="w-3 h-3 mr-1" />
            Autopilot Dashboard
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Your Affiliate Business on <span className="text-primary">Autopilot</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time monitoring of automated tasks and campaign performance
          </p>
        </div>

        {/* Autopilot Status */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isAutopilotActive ? "bg-green-500 animate-pulse" : "bg-muted"
                }`}>
                  {isAutopilotActive ? (
                    <Zap className="w-6 h-6 text-white" />
                  ) : (
                    <PauseCircle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">
                    Autopilot Status: {isAutopilotActive ? "Active" : "Paused"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isAutopilotActive 
                      ? "All systems running smoothly • Processing tasks automatically"
                      : "Automation paused • Click to resume automatic operations"
                    }
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsAutopilotActive(!isAutopilotActive)}
                variant={isAutopilotActive ? "outline" : "default"}
                size="lg"
                className="gap-2"
              >
                {isAutopilotActive ? (
                  <>
                    <PauseCircle className="w-4 h-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>

            {isAutopilotActive && (
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">System Performance</span>
                  <span className="font-semibold text-green-500">98% Optimal</span>
                </div>
                <Progress value={98} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </CardTitle>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Live Activity Feed
                </CardTitle>
                <CardDescription>Real-time updates from your automated systems</CardDescription>
              </div>
              {isAutopilotActive && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity. Activate autopilot to start tracking.</p>
                </div>
              ) : (
                activities.map((activity) => {
                  const Icon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);
                  
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">{activity.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}