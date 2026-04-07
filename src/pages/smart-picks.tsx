import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bot, 
  ArrowLeft, 
  Menu, 
  Settings, 
  TrendingUp, 
  RefreshCw, 
  FileEdit, 
  Send,
  BarChart,
  Search,
  Sparkles,
  Target,
  Activity,
  FolderTree,
  DollarSign,
  Shield,
  Command,
  Zap,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { taskExecutor } from "@/services/taskExecutor";

export default function SmartPicksDashboard() {
  const { toast } = useToast();
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRunning, setIsRunning] = useState(true);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    toast({
      title: "Optimization Started",
      description: "AI is rewriting descriptions, fixing niches, and adjusting prices...",
    });
    
    setTimeout(() => {
      setIsOptimizing(false);
      toast({
        title: "Optimization Complete",
        description: "5 products have been fully optimized for conversion.",
      });
    }, 2500);
  };

  const adminTools = [
    { icon: BarChart, label: "Dashboard", color: "text-blue-500" },
    { icon: Search, label: "Product Discovery", color: "text-indigo-500" },
    { icon: Sparkles, label: "Content Generator", color: "text-yellow-500" },
    { icon: Zap, label: "Batch Generate", color: "text-orange-500" },
    { icon: Target, label: "SEO Optimizer", color: "text-red-500" },
    { icon: FileEdit, label: "Traffic Plan", color: "text-cyan-500", highlight: true },
    { icon: Activity, label: "Performance Monitor", color: "text-pink-500" },
    { icon: FolderTree, label: "Content Manager", color: "text-amber-500" },
    { icon: RefreshCw, label: "Rewrite Low Performers", color: "text-emerald-500" },
    { icon: DollarSign, label: "Commission Tracker", color: "text-green-500" },
    { icon: Shield, label: "Compliance", color: "text-slate-500" },
    { icon: Command, label: "AutoPilot Command Center", color: "text-purple-500" },
  ];

  const scheduledAutomations = [
    {
      title: "Daily Product Refresh",
      time: "3:00 AM Daily",
      description: "Scan all niches, add trending products, remove low performers",
      function: "autoRefreshAllProducts",
      icon: RefreshCw
    },
    {
      title: "Performance Optimization",
      time: "9:00 AM Daily",
      description: "Optimize top 5 underperforming products automatically",
      function: "autoOptimizeUnderperformers",
      icon: TrendingUp
    },
    {
      title: "SEO Content Rewriter",
      time: "Weekly",
      description: "Rewrite low-traffic articles for better rankings",
      function: "autoRewriteLowPerformers",
      icon: FileEdit
    },
    {
      title: "Publish Scheduled Posts",
      time: "Every 2 Hours",
      description: "Auto-publish articles when scheduled time arrives",
      function: "autoPublishToSocial",
      icon: Send
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <SEO title="SmartPicks | AI Automation Hub" />
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 pt-24 pb-20">
        {/* App Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-t-xl border-b mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="bg-teal-600 text-white w-8 h-8 rounded-md flex items-center justify-center font-bold">
              S
            </div>
            <h1 className="text-xl font-bold">SmartPicks</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="w-6 h-6" />
          </Button>
        </div>

        <Tabs defaultValue="hub" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hub">AI Hub</TabsTrigger>
            <TabsTrigger value="admin">Admin Tools</TabsTrigger>
            <TabsTrigger value="automations">Schedules</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
          </TabsList>

          {/* AI Automation Hub Tab */}
          <TabsContent value="hub" className="space-y-6">
            <div className="text-center py-6">
              <h2 className="text-4xl font-extrabold mb-4 text-slate-900 tracking-tight">AI Automation Hub</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Your complete affiliate marketing system runs on autopilot—products, content, optimization, and tracking all managed by AI
              </p>
            </div>

            <div className="flex items-center gap-2 text-2xl font-bold text-slate-800">
              <Bot className="w-7 h-7 text-teal-600" />
              Active AI Systems
            </div>

            <Card className="border-2 border-purple-100 shadow-md">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-inner">
                    <Bot className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold px-3 py-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                    Running
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold mb-3 text-slate-900">Auto Product Discovery</h3>
                <p className="text-slate-600 mb-6 text-lg">
                  AI finds trending products and adds them automatically
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">✓</div>
                    Web search
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">✓</div>
                    Smart categorization
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">✓</div>
                    Affiliate link generation
                  </div>
                </div>

                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-lg py-6 rounded-xl transition-all shadow-md">
                  Open Dashboard <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Auto-Optimize Top 5 Products</h3>
                    <p className="text-slate-600 max-w-md">
                      AI will automatically improve descriptions, fix niches, adjust pricing, and enhance features
                    </p>
                  </div>
                  <Button 
                    onClick={handleOptimize} 
                    disabled={isOptimizing}
                    className="bg-purple-600 hover:bg-purple-700 text-white min-w-[160px] shadow-sm"
                  >
                    {isOptimizing ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Optimizing...</>
                    ) : (
                      <><Sparkles className="w-4 h-4 mr-2" /> Optimize Now</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="pt-6">
              <div className="flex items-center gap-2 text-2xl font-bold text-slate-800 mb-6">
                <Target className="w-7 h-7 text-orange-500" />
                Top Priority Products
              </div>
              
              <div className="space-y-4">
                <Card className="shadow-sm border-slate-200 hover:border-teal-200 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                          Ab Roller Wheel
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">stagnant</Badge>
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-md">
                          Priority: 2
                        </div>
                        <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                          <Zap className="w-4 h-4 mr-2" /> Optimize
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">0</span> Clicks</div>
                      <div className="flex items-center gap-2"><span className="font-semibold text-slate-900">0</span> Conversions</div>
                      <div className="flex items-center gap-2">Rate: <span className="font-semibold text-slate-900">0.00%</span></div>
                      <div className="flex items-center gap-2">Revenue: <span className="font-semibold text-green-600">$0.00</span></div>
                    </div>

                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md text-sm font-medium border border-amber-100">
                      <span className="w-4 h-4 rounded-full border border-amber-600 flex items-center justify-center text-[10px]">!</span>
                      No clicks in 30+ days
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-slate-200 hover:border-teal-200 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                          Yoga Mat with Alignment
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">stagnant</Badge>
                        </h4>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-md">
                          Priority: 2
                        </div>
                        <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white">
                          Chat to Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Admin Tools Tab */}
          <TabsContent value="admin" className="space-y-6">
            <h2 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              Admin Tools
            </h2>
            <Card className="shadow-sm border-0 bg-white">
              <div className="divide-y divide-slate-100">
                {adminTools.map((tool, idx) => (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-4 p-5 hover:bg-slate-50 cursor-pointer transition-colors ${
                      tool.highlight ? 'bg-orange-50/50' : ''
                    }`}
                  >
                    <tool.icon className={`w-6 h-6 ${tool.color}`} />
                    <span className="font-semibold text-slate-700 text-lg">{tool.label}</span>
                  </div>
                ))}
                <Link href="/magic-tools" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-medium">Magic Tools</span>
                </Link>
              </div>
            </Card>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="automations" className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-6">
              <Clock className="w-7 h-7 text-indigo-600" />
              Scheduled Automations
            </h2>
            <div className="space-y-4">
              {scheduledAutomations.map((schedule, idx) => (
                <Card key={idx} className="shadow-sm hover:shadow-md transition-shadow border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-3">
                      <div className="flex items-start gap-4">
                        <schedule.icon className="w-6 h-6 text-indigo-600 mt-1" />
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{schedule.title}</h3>
                          <p className="text-slate-600 mt-2">{schedule.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-slate-50 font-semibold px-3 py-1 whitespace-nowrap">
                        {schedule.time}
                      </Badge>
                    </div>
                    <div className="mt-4 bg-slate-50 p-3 rounded-md border border-slate-100">
                      <code className="text-sm text-slate-500 font-mono">
                        Function: {schedule.function}
                      </code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Generated Content</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { title: "Discover the Best Home Organization Solutions Under $50", type: "review" },
                { title: "Best Home Organization Under $20-$50", type: "best-under-price" }
              ].map((content, idx) => (
                <Card key={idx} className="shadow-sm border-slate-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-5 h-5 rounded border border-slate-300 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-3">{content.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">Home Organization</Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">{content.type}</Badge>
                          <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-none font-semibold">published</Badge>
                        </div>
                        <p className="text-slate-600 mb-4 line-clamp-2">
                          Are you tired of clutter taking over your home? If so, investing in effective home organization solutions is the key...
                        </p>
                        <div className="flex items-center gap-6 text-slate-500 mb-4">
                          <span className="flex items-center gap-2"><Activity className="w-4 h-4" /> 0 views</span>
                          <span className="flex items-center gap-2"><Target className="w-4 h-4" /> 0 clicks</span>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" size="sm" className="font-semibold">
                            <Search className="w-4 h-4 mr-2" /> Preview
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <span className="font-bold text-lg">🗑</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}