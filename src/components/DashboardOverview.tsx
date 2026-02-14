import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Link2, 
  FileText,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  color: string;
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: Date;
  status: "success" | "pending" | "error";
}

export function DashboardOverview() {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const initialStats: QuickStat[] = [
      {
        label: "Today's Revenue",
        value: "$2,847",
        change: "+18.2%",
        trend: "up",
        icon: DollarSign,
        color: "text-green-500"
      },
      {
        label: "Active Links",
        value: "1,247",
        change: "+23",
        trend: "up",
        icon: Link2,
        color: "text-blue-500"
      },
      {
        label: "Conversions",
        value: "89",
        change: "+12",
        trend: "up",
        icon: Target,
        color: "text-purple-500"
      },
      {
        label: "Content Pieces",
        value: "156",
        change: "+8",
        trend: "up",
        icon: FileText,
        color: "text-orange-500"
      }
    ];
    
    const initialActivities: RecentActivity[] = [
      { id: "1", action: "Campaign optimized: Summer Launch", timestamp: new Date(Date.now() - 120000), status: "success" },
      { id: "2", action: "Link cloaked: Amazon product #A8821", timestamp: new Date(Date.now() - 300000), status: "success" },
      { id: "3", action: "Content generated: Product review", timestamp: new Date(Date.now() - 600000), status: "success" },
      { id: "4", action: "Conversion tracked: $89 commission", timestamp: new Date(Date.now() - 900000), status: "success" }
    ];
    
    setStats(initialStats);
    setActivities(initialActivities);
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setStats(prev => prev.map(stat => {
        const randomChange = (Math.random() - 0.4) * 5;
        const currentValue = parseInt(stat.value.replace(/[$,]/g, ""));
        const newValue = Math.max(0, currentValue + Math.floor(randomChange));
        
        return {
          ...stat,
          value: stat.label.includes("Revenue") ? `$${newValue.toLocaleString()}` : newValue.toLocaleString()
        };
      }));
      
      // Add new activity
      const newActivities = [
        "Campaign optimized automatically",
        "New product discovered",
        "Link performance improved",
        "Content scheduled for posting",
        "A/B test completed",
        "Conversion tracked"
      ];
      
      const newActivity: RecentActivity = {
        id: Date.now().toString(),
        action: newActivities[Math.floor(Math.random() * newActivities.length)],
        timestamp: new Date(),
        status: "success"
      };
      
      setActivities(prev => [newActivity, ...prev].slice(0, 8));
    }, 25000);

    return () => clearInterval(interval);
  }, [mounted]);

  const getTimeAgo = (date: Date) => {
    if (!mounted) return "Just now";
    
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  if (!mounted) return null;

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="flex items-center gap-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Status & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* System Status */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Automation Status
                </CardTitle>
                <Badge className="bg-green-500 hover:bg-green-600">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1.5" />
                  All Systems Active
                </Badge>
              </div>
              <CardDescription>Real-time monitoring of automated processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-semibold text-foreground">Link Tracking</div>
                      <div className="text-sm text-muted-foreground">Processing 1,247 links</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-foreground">Content Generator</div>
                      <div className="text-sm text-muted-foreground">89 pieces generated</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                    <div>
                      <div className="font-semibold text-foreground">Campaign Optimizer</div>
                      <div className="text-sm text-muted-foreground">24 campaigns monitored</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-500">Active</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                    <div>
                      <div className="font-semibold text-foreground">Analytics Engine</div>
                      <div className="text-sm text-muted-foreground">Real-time tracking active</div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-orange-500/10 text-orange-500">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest automated actions across your system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(activity.timestamp)}</p>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Everything Running Smoothly
                </h3>
                <p className="text-sm text-muted-foreground">
                  All automation systems are active and performing optimally
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline">View Full Report</Button>
                <Button className="gap-2">
                  <Target className="w-4 h-4" />
                  New Campaign
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}