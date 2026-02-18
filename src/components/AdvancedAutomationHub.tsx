import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Target, 
  Zap,
  Shield,
  Mail,
  Globe,
  LineChart,
  Sparkles
} from "lucide-react";

export function AdvancedAutomationHub() {
  const [activeTools, setActiveTools] = useState<string[]>([]);

  const automationTools = [
    {
      id: "intelligent-routing",
      name: "AI Traffic Routing",
      description: "Smart traffic distribution across channels",
      icon: Brain,
      metric: "3.2x conversion improvement",
      status: "active"
    },
    {
      id: "dynamic-pricing",
      name: "Dynamic Pricing Engine",
      description: "Real-time price optimization",
      icon: DollarSign,
      metric: "28% revenue increase",
      status: "active"
    },
    {
      id: "fraud-detection",
      name: "Fraud Protection",
      description: "AI-powered fraud detection",
      icon: Shield,
      metric: "$12.4K saved monthly",
      status: "active"
    },
    {
      id: "email-automation",
      name: "Email Sequences",
      description: "Automated email campaigns",
      icon: Mail,
      metric: "42% open rate",
      status: "active"
    },
    {
      id: "social-proof",
      name: "Social Proof Engine",
      description: "Dynamic social proof widgets",
      icon: Users,
      metric: "18% conversion lift",
      status: "active"
    },
    {
      id: "ab-testing",
      name: "Auto A/B Testing",
      description: "Continuous optimization testing",
      icon: Target,
      metric: "5 active tests",
      status: "active"
    }
  ];

  const toggleTool = (toolId: string) => {
    setActiveTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  return (
    <div className="container py-16">
      <div className="text-center mb-12">
        <Badge className="mb-4" variant="secondary">
          <Sparkles className="h-3 w-3 mr-1" />
          Advanced Automation Suite
        </Badge>
        <h2 className="text-4xl font-bold mb-4">
          Next-Generation Marketing Automation
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Cutting-edge AI tools that work 24/7 to optimize every aspect of your campaigns
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-tools">AI Tools</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {automationTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-primary/10 w-fit">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant={tool.status === "active" ? "default" : "secondary"}>
                        {tool.status}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{tool.name}</CardTitle>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Performance</p>
                        <p className="text-lg font-bold text-green-500">{tool.metric}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleTool(tool.id)}
                      >
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                System Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Automation Rate</p>
                  <p className="text-3xl font-bold">94%</p>
                  <Progress value={94} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Active Tools</p>
                  <p className="text-3xl font-bold">12</p>
                  <Progress value={100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-3xl font-bold">2.4K</p>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Efficiency Gain</p>
                  <p className="text-3xl font-bold text-green-500">+156%</p>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-tools" className="space-y-6">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Intelligent Traffic Routing
                </CardTitle>
                <CardDescription>
                  AI analyzes user behavior and routes traffic to highest-converting channels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Google Ads</span>
                    <div className="flex items-center gap-2">
                      <Progress value={45} className="h-2 w-24" />
                      <span className="text-sm font-medium">45%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Facebook</span>
                    <div className="flex items-center gap-2">
                      <Progress value={30} className="h-2 w-24" />
                      <span className="text-sm font-medium">30%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Email</span>
                    <div className="flex items-center gap-2">
                      <Progress value={25} className="h-2 w-24" />
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Dynamic Pricing Optimization
                </CardTitle>
                <CardDescription>
                  Automatically adjusts pricing based on demand, competition, and user behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Base Price</p>
                    <p className="text-2xl font-bold">$49</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Optimized Price</p>
                    <p className="text-2xl font-bold text-green-500">$63</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Revenue Gain</p>
                    <p className="text-2xl font-bold text-green-500">+28%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Real-Time Fraud Detection
                </CardTitle>
                <CardDescription>
                  Advanced AI protects your budget from click fraud and invalid traffic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Bot Traffic Blocked</span>
                    </div>
                    <Badge variant="destructive">1,247 clicks</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm font-medium">Suspicious Activity</span>
                    </div>
                    <Badge variant="outline" className="border-orange-500 text-orange-500">342 clicks</Badge>
                  </div>
                  <div className="text-center pt-2">
                    <p className="text-sm text-muted-foreground">Total budget saved this month</p>
                    <p className="text-2xl font-bold text-green-500">$12,456</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "Conversion Rate", value: "+45%", trend: "up" },
                    { metric: "Revenue per Visit", value: "+32%", trend: "up" },
                    { metric: "Cost per Acquisition", value: "-28%", trend: "down" },
                    { metric: "Customer Lifetime Value", value: "+67%", trend: "up" }
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm">{item.metric}</span>
                      <span className={`text-sm font-bold ${item.trend === "up" ? "text-green-500" : "text-blue-500"}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "A/B Test: Headline Variant", status: "running", progress: 67 },
                    { name: "Budget Reallocation", status: "running", progress: 89 },
                    { name: "Bid Optimization", status: "running", progress: 45 },
                    { name: "Creative Refresh", status: "completed", progress: 100 }
                  ].map((opt, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{opt.name}</span>
                        <Badge variant={opt.status === "completed" ? "default" : "secondary"}>
                          {opt.status}
                        </Badge>
                      </div>
                      <Progress value={opt.progress} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                AI-Generated Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    priority: "high",
                    insight: "Facebook audience showing 3.2x higher engagement during evening hours",
                    action: "Shift 40% of budget to 6-10 PM time window",
                    impact: "+$2,400 projected monthly revenue"
                  },
                  {
                    priority: "medium",
                    insight: "Mobile users have 25% higher cart abandonment rate",
                    action: "Implement mobile-optimized checkout flow",
                    impact: "+156 estimated monthly conversions"
                  },
                  {
                    priority: "high",
                    insight: "Video ads outperforming image ads by 87%",
                    action: "Increase video ad budget by 50%",
                    impact: "+$3,800 projected monthly revenue"
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="flex items-start justify-between">
                      <Badge variant={item.priority === "high" ? "destructive" : "secondary"}>
                        {item.priority} priority
                      </Badge>
                      <Button variant="outline" size="sm">
                        Apply
                      </Button>
                    </div>
                    <div>
                      <p className="font-medium mb-1">💡 {item.insight}</p>
                      <p className="text-sm text-muted-foreground mb-1">
                        <strong>Recommended Action:</strong> {item.action}
                      </p>
                      <p className="text-sm text-green-500 font-medium">
                        <strong>Projected Impact:</strong> {item.impact}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}