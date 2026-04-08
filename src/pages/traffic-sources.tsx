import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Zap, 
  Users, 
  BarChart3,
  Share2,
  Search,
  Mail,
  Video,
  ShoppingBag,
  CheckCircle,
  ExternalLink,
  Copy,
  Lightbulb
} from "lucide-react";
import { 
  REAL_TRAFFIC_SOURCES,
  getAutomatableTrafficSources,
  calculatePotentialTraffic,
  trackTrafficEvent,
  getRealTimeTrafficStats,
  type TrafficSource
} from "@/services/realTrafficSources";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TrafficSourcesPage() {
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    loadAffiliateLinks();
  }, []);

  const loadAffiliateLinks = async () => {
    const { data } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active')
      .limit(5);
    
    if (data) setAffiliateLinks(data);
  };

  const copyLink = (link: string) => {
    const fullUrl = `${window.location.origin}/go/${link}`;
    navigator.clipboard.writeText(fullUrl);
    toast({
      title: "Link Copied!",
      description: "Share this link to generate traffic"
    });
  };

  const activateSource = async (sourceName: string) => {
    if (session) {
      await trafficGenerationService.activateTrafficSource(session.user.id, sourceName);
      setActiveSources([...activeSources, sourceName]);
      toast({
        title: "Traffic Source Activated!",
        description: `${sourceName} is now active`
      });
    }
  };

  const freeSources = realTrafficSources.filter(s => s.type === "free");
  const paidSources = realTrafficSources.filter(s => s.type === "paid");

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Real Traffic Sources</h1>
          <p className="text-muted-foreground text-lg">
            Generate real traffic to your affiliate links - no mock data, just proven methods
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Active Links</span>
              </div>
              <p className="text-3xl font-bold">{affiliateLinks.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Traffic Sources</span>
              </div>
              <p className="text-3xl font-bold">{freeSources.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-muted-foreground">Active Now</span>
              </div>
              <p className="text-3xl font-bold">{activeSources.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Est. Monthly</span>
              </div>
              <p className="text-3xl font-bold">$0-5k</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="free" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="free">Free Traffic</TabsTrigger>
            <TabsTrigger value="paid">Paid Traffic</TabsTrigger>
            <TabsTrigger value="money">Money Strategies</TabsTrigger>
          </TabsList>

          {/* Free Traffic Sources */}
          <TabsContent value="free" className="space-y-4">
            <div className="grid gap-4">
              {freeSources.map((source, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {source.name}
                          {activeSources.includes(source.name) && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          Est. Traffic: {source.estimatedTraffic} visitors/month • {source.difficulty} difficulty
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">{source.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">How to use:</h4>
                        <ol className="space-y-2">
                          {source.instructions.map((instruction, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-primary font-semibold">{i + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      
                      {source.automationLevel !== "full-auto" && affiliateLinks.length > 0 && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-semibold mb-2">Your links to share:</p>
                          <div className="space-y-2">
                            {affiliateLinks.slice(0, 3).map((link) => (
                              <div key={link.id} className="flex items-center justify-between gap-2 p-2 bg-background rounded">
                                <span className="text-xs truncate flex-1">{link.product_name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyLink(link.slug)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => activateSource(source.name)}
                        disabled={activeSources.includes(source.name)}
                        className="w-full"
                      >
                        {activeSources.includes(source.name) ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Activated
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Start Using This Source
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Paid Traffic Sources */}
          <TabsContent value="paid" className="space-y-4">
            <div className="grid gap-4">
              {paidSources.map((source, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{source.name}</CardTitle>
                        <CardDescription className="mt-2">
                          Est. Traffic: {source.estimatedTraffic} visitors/month • Requires budget
                        </CardDescription>
                      </div>
                      <Badge variant="default" className="bg-blue-600">{source.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Setup steps:</h4>
                        <ol className="space-y-2">
                          {source.instructions.map((instruction, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-primary font-semibold">{i + 1}.</span>
                              <span>{instruction}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm">
                          💡 <strong>Tip:</strong> Start with $5-10/day budget. Track ROI and scale what works.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Money-Making Strategies */}
          <TabsContent value="money" className="space-y-4">
            <div className="grid gap-4">
              {moneyMakingStrategies.map((strategy, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          {strategy.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {strategy.description}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-lg font-bold">
                        {strategy.potential}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4 text-muted-foreground" />
                          <span>Difficulty: {strategy.difficulty}</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Action steps:</h4>
                        <ol className="space-y-2">
                          {strategy.actionSteps.map((step, i) => (
                            <li key={i} className="flex gap-2 text-sm">
                              <span className="text-primary font-semibold">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <Button className="w-full" variant="outline">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Start This Strategy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <Card className="mt-8 border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">Ready to Generate Real Traffic?</h3>
              <p className="text-muted-foreground">
                Start with free methods today. Pick 2-3 traffic sources and commit to them for 30 days.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" onClick={() => window.location.href = "/dashboard"}>
                  <Share2 className="w-4 h-4 mr-2" />
                  View My Links
                </Button>
                <Button size="lg" variant="outline" onClick={() => window.open("https://www.youtube.com/results?search_query=affiliate+marketing+traffic", "_blank")}>
                  <Video className="w-4 h-4 mr-2" />
                  Watch Tutorials
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}