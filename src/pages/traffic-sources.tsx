import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  Globe,
  Zap,
  CheckCircle,
  ArrowRight,
  Play,
  Target,
  BarChart3
} from "lucide-react";

interface TrafficSource {
  id: string;
  name: string;
  description: string;
  category: string;
  potential_visitors: string;
  setup_time: string;
  cost: string;
  difficulty: string;
  status: "available" | "active" | "coming_soon";
  icon: string;
}

const TRAFFIC_SOURCES: TrafficSource[] = [
  {
    id: "pinterest",
    name: "Pinterest Marketing",
    description: "Pin your products to boards - 450M active users, 89% use it for purchase inspiration",
    category: "social",
    potential_visitors: "10,000-50,000/month",
    setup_time: "2 hours",
    cost: "Free",
    difficulty: "Easy",
    status: "available",
    icon: "📌"
  },
  {
    id: "reddit",
    name: "Reddit Communities",
    description: "Share in relevant subreddits - 430M monthly users, highly engaged niche communities",
    category: "social",
    potential_visitors: "5,000-25,000/month",
    setup_time: "1 hour",
    cost: "Free",
    difficulty: "Medium",
    status: "available",
    icon: "🤖"
  },
  {
    id: "quora",
    name: "Quora Answers",
    description: "Answer questions with product recommendations - 300M monthly visitors",
    category: "content",
    potential_visitors: "3,000-15,000/month",
    setup_time: "1 hour",
    cost: "Free",
    difficulty: "Easy",
    status: "available",
    icon: "❓"
  },
  {
    id: "medium",
    name: "Medium Articles",
    description: "Write product reviews and guides - 170M monthly readers",
    category: "content",
    potential_visitors: "5,000-20,000/month",
    setup_time: "3 hours",
    cost: "Free",
    difficulty: "Medium",
    status: "available",
    icon: "📝"
  },
  {
    id: "youtube_shorts",
    name: "YouTube Shorts",
    description: "Create 60-second product videos - 30B daily views",
    category: "video",
    potential_visitors: "20,000-100,000/month",
    setup_time: "4 hours",
    cost: "Free",
    difficulty: "Medium",
    status: "available",
    icon: "🎬"
  },
  {
    id: "tiktok",
    name: "TikTok Viral Videos",
    description: "Short product demos and reviews - 1B monthly users",
    category: "video",
    potential_visitors: "50,000-500,000/month",
    setup_time: "3 hours",
    cost: "Free",
    difficulty: "Medium",
    status: "available",
    icon: "🎵"
  },
  {
    id: "instagram_reels",
    name: "Instagram Reels",
    description: "Product showcase reels - 2B monthly users",
    category: "video",
    potential_visitors: "15,000-75,000/month",
    setup_time: "3 hours",
    cost: "Free",
    difficulty: "Medium",
    status: "available",
    icon: "📸"
  },
  {
    id: "twitter_threads",
    name: "Twitter/X Threads",
    description: "Product recommendation threads - 550M monthly users",
    category: "social",
    potential_visitors: "5,000-30,000/month",
    setup_time: "1 hour",
    cost: "Free",
    difficulty: "Easy",
    status: "available",
    icon: "🐦"
  },
  {
    id: "linkedin_articles",
    name: "LinkedIn Articles",
    description: "B2B product reviews - 900M professionals",
    category: "content",
    potential_visitors: "3,000-15,000/month",
    setup_time: "2 hours",
    cost: "Free",
    difficulty: "Easy",
    status: "available",
    icon: "💼"
  }
];

export default function TrafficSourcesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total_visitors: 0,
    active_sources: 0,
    total_revenue: 0,
    conversion_rate: 0
  });

  useEffect(() => {
    loadUserAndStats();
  }, []);

  const loadUserAndStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    setUserId(user.id);

    try {
      // 1. Get or create a default campaign for this user
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      let currentCampaignId = campaigns && campaigns.length > 0 ? campaigns[0].id : null;

      if (!currentCampaignId) {
        const { data: newCampaign } = await supabase
          .from('campaigns')
          .insert({
            user_id: user.id,
            name: 'Default Traffic Campaign',
            goal: 'traffic',
            status: 'active'
          })
          .select('id')
          .single();
          
        if (newCampaign) currentCampaignId = newCampaign.id;
      }

      if (currentCampaignId) {
        setCampaignId(currentCampaignId);
        
        // 2. Load active traffic sources linked to this campaign
        const { data: sources } = await supabase
          .from('traffic_sources')
          .select('source_name')
          .eq('campaign_id', currentCampaignId)
          .eq('status', 'active');

        if (sources) {
          setActiveSources(sources.map(s => s.source_name));
        }
      }

      // 3. Load real stats from traffic_events table
      const { data: events } = await supabase
        .from('traffic_events')
        .select('event_type, user_id')
        .eq('user_id', user.id);

      if (events) {
        const pageviews = events.filter(e => e.event_type === 'pageview').length;
        const clicks = events.filter(e => e.event_type === 'click').length;
        const conversions = events.filter(e => e.event_type === 'conversion').length;

        // Get REAL revenue from affiliate_links table
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('id')
          .eq('user_id', user.id);

        let totalRevenue = 0;
        if (campaigns && campaigns.length > 0) {
          const campaignIds = campaigns.map(c => c.id);
          const { data: links } = await supabase
            .from('affiliate_links')
            .select('revenue')
            .in('campaign_id', campaignIds);

          if (links) {
            totalRevenue = links.reduce((sum, link) => sum + (link.revenue || 0), 0);
          }
        }

        setStats({
          total_visitors: pageviews,
          active_sources: activeSources.length, // use activeSources state which is loaded from database
          total_revenue: Math.round(totalRevenue * 100) / 100,
          conversion_rate: pageviews > 0 ? (conversions / pageviews) * 100 : 0
        });
      }
    } catch (error) {
      console.error("Error loading traffic stats:", error);
    }
  };

  const activateSource = async (sourceId: string) => {
    if (!userId || !campaignId) {
      toast({ title: "Setup Required", description: "Campaign initialization pending", variant: "destructive" });
      return;
    }

    const source = TRAFFIC_SOURCES.find(s => s.id === sourceId);
    if (!source) return;

    try {
      // Save to database using campaign_id
      const { error } = await supabase
        .from('traffic_sources')
        .upsert({
          campaign_id: campaignId,
          source_type: 'social', // Maps to allowed values constraint
          source_name: source.name,
          status: 'active',
          automation_enabled: true
        }, { onConflict: 'campaign_id,source_name' });

      if (error) throw error;

      // Update local state
      setActiveSources(prev => [...prev, source.name]);
      setStats(prev => ({ ...prev, active_sources: prev.active_sources + 1 }));

      toast({
        title: `🚀 ${source.name} Activated!`,
        description: "Traffic source is now active and ready to generate visitors."
      });

      // Track activation in activity log
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'traffic_source_activated',
        status: 'success',
        details: `Activated: ${source.name}`,
        metadata: { source_id: sourceId, source_name: source.name }
      });

    } catch (error: any) {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deactivateSource = async (sourceId: string) => {
    if (!campaignId) return;

    const source = TRAFFIC_SOURCES.find(s => s.id === sourceId);
    if (!source) return;

    try {
      const { error } = await supabase
        .from('traffic_sources')
        .update({ 
          status: 'paused',
          automation_enabled: false 
        })
        .eq('campaign_id', campaignId)
        .eq('source_name', source.name);

      if (error) throw error;

      // Update local state
      setActiveSources(prev => prev.filter(s => s !== source.name));
      setStats(prev => ({ ...prev, active_sources: Math.max(0, prev.active_sources - 1) }));

      toast({
        title: `⏸️ ${source.name} Paused`,
        description: "Traffic source has been paused."
      });

    } catch (error: any) {
      toast({
        title: "Deactivation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'Hard': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const filterSources = (category: string) => {
    if (category === 'all') return TRAFFIC_SOURCES;
    return TRAFFIC_SOURCES.filter(s => s.category === category);
  };

  return (
    <>
      <Head>
        <title>Free Traffic Sources - AffiliatePro</title>
      </Head>

      <div className="min-h-screen bg-background">
        <Header />

        <main className="container mx-auto px-4 pt-24 pb-16 max-w-7xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              9 Proven Free Traffic Sources
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Free Traffic Sources
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get highly targeted buyers without spending a penny on ads. These 9 traffic sources bring 100,000+ visitors per month.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-950/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.total_visitors.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Visitors</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-950/20 rounded-lg">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.active_sources}</div>
                    <div className="text-sm text-muted-foreground">Active Sources</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-950/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">${stats.total_revenue.toFixed(2)}</div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-950/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.conversion_rate.toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Conversion</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs Filter */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl mx-auto">
              <TabsTrigger value="all">All Sources</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="video">Video</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Traffic Sources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterSources(activeTab).map((source) => {
              const isActive = activeSources.includes(source.name);
              
              return (
                <Card key={source.id} className={`hover:shadow-lg transition-shadow ${isActive ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="text-4xl">{source.icon}</div>
                        {isActive && (
                          <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={getDifficultyColor(source.difficulty)}>
                        {source.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{source.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{source.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Potential Traffic:</span>
                        <span className="font-semibold text-primary">{source.potential_visitors}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Setup Time:</span>
                        <span className="font-semibold">{source.setup_time}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-semibold text-green-600">{source.cost}</span>
                      </div>
                    </div>

                    {isActive ? (
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => deactivateSource(source.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Active - Click to Pause
                      </Button>
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={() => activateSource(source.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Activate Source
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-purple-600/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Ready to Scale Your Traffic?</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Activate all 9 traffic sources and let the autopilot manage everything for you. Set it up once, generate traffic forever.
              </p>
              <Button size="lg" onClick={() => router.push('/dashboard')}>
                <Zap className="w-5 h-5 mr-2" />
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
}