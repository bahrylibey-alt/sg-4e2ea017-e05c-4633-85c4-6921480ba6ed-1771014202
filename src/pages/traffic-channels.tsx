import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe, 
  TrendingUp, 
  CheckCircle, 
  XCircle,
  Activity,
  AlertCircle,
  Clock,
  Zap,
  Facebook,
  Twitter,
  Youtube,
  Instagram,
  Linkedin,
  MessageSquare,
  Share2,
  Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { trafficAutomationService } from "@/services/trafficAutomationService";
import { useRouter } from "next/navigation";

const TRAFFIC_CHANNELS = [
  {
    id: "pinterest-autopinning",
    name: "Pinterest Auto-Pinning",
    description: "Auto-post product pins to Pinterest boards",
    icon: Share2,
    color: "bg-red-100 text-red-600 dark:bg-red-900/20",
    traffic: "100-500/month",
    automation: "automated"
  },
  {
    id: "email-drip",
    name: "Email Drip Campaigns",
    description: "Send automated email sequences to subscribers",
    icon: Mail,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
    traffic: "200-1000/month",
    automation: "automated"
  },
  {
    id: "twitter-autopost",
    name: "Twitter/X Auto-Posting",
    description: "Schedule and auto-post tweets with product links",
    icon: Twitter,
    color: "bg-sky-100 text-sky-600 dark:bg-sky-900/20",
    traffic: "100-500/month",
    automation: "automated"
  },
  {
    id: "youtube-community",
    name: "YouTube Community Posts",
    description: "Auto-publish community posts to YouTube channel",
    icon: Youtube,
    color: "bg-red-100 text-red-600 dark:bg-red-900/20",
    traffic: "500-3000/month",
    automation: "automated"
  },
  {
    id: "facebook-groups",
    name: "Facebook Group Sharing",
    description: "Auto-share products to relevant Facebook groups",
    icon: Facebook,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
    traffic: "200-1000/month",
    automation: "automated"
  },
  {
    id: "instagram-stories",
    name: "Instagram Stories Automation",
    description: "Auto-post product stories to Instagram",
    icon: Instagram,
    color: "bg-pink-100 text-pink-600 dark:bg-pink-900/20",
    traffic: "300-1500/month",
    automation: "automated"
  },
  {
    id: "reddit-deals",
    name: "Reddit Deal Posting",
    description: "Auto-post deals to relevant subreddits",
    icon: MessageSquare,
    color: "bg-orange-100 text-orange-600 dark:bg-orange-900/20",
    traffic: "500-2000/month",
    automation: "semi-automated"
  },
  {
    id: "linkedin-articles",
    name: "LinkedIn Article Publishing",
    description: "Auto-publish product articles to LinkedIn",
    icon: Linkedin,
    color: "bg-blue-100 text-blue-600 dark:bg-blue-900/20",
    traffic: "100-800/month",
    automation: "automated"
  }
];

export default function TrafficChannels() {
  const { toast } = useToast();
  const [activeChannels, setActiveChannels] = useState<Record<string, boolean>>({});
  const [channelStats, setChannelStats] = useState<Record<string, { views: number; clicks: number }>>({});
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await loadAutopilotStatus();
    await loadChannelStatus();
  };

  const loadAutopilotStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // SINGLE SOURCE OF TRUTH: user_settings.autopilot_enabled
      const { data: settings } = await supabase
        .from('user_settings')
        .select('autopilot_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settings) {
        setIsAutopilotActive(settings.autopilot_enabled || false);
      }
    } catch (error) {
      console.error('Error loading autopilot status:', error);
    }
  };

  const loadChannelStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user.id);

      let campaignIds: string[] = [];
      if (campaigns && campaigns.length > 0) {
        campaignIds = campaigns.map(c => c.id);
      }

      let query = supabase.from('traffic_sources').select('source_name, status, automation_enabled, total_clicks');
      if (campaignIds.length > 0) {
        query = query.in('campaign_id', campaignIds);
      }

      const { data: sources } = await query;

      const channelStatus: Record<string, boolean> = {};
      const stats: Record<string, { views: number; clicks: number }> = {};

      TRAFFIC_CHANNELS.forEach(channel => {
        const source = sources?.find(s => s.source_name === channel.name);
        channelStatus[channel.id] = source?.automation_enabled || false;
        stats[channel.id] = {
          views: (source?.total_clicks || 0) * 4,
          clicks: source?.total_clicks || 0
        };
      });

      setActiveChannels(channelStatus);
      setChannelStats(stats);
    } catch (error) {
      console.error('Error loading channel status:', error);
    }
  };

  const toggleChannel = async (channelId: string) => {
    const channel = TRAFFIC_CHANNELS.find(c => c.id === channelId);
    if (!channel) return;

    setLoading(prev => ({ ...prev, [channelId]: true }));

    try {
      const isCurrentlyActive = activeChannels[channelId];
      
      if (isCurrentlyActive) {
        const result = await trafficAutomationService.deactivateChannel(channel.name);
        if (result.success) {
          setActiveChannels(prev => ({ ...prev, [channelId]: false }));
          toast({
            title: "Channel Stopped",
            description: `${channel.name} has been deactivated`,
          });
        }
      } else {
        const result = await trafficAutomationService.activateChannel(channel.name, "automated");
        if (result.success) {
          setActiveChannels(prev => ({ ...prev, [channelId]: true }));
          toast({
            title: "Channel Activated!",
            description: `${channel.name} is now running 24/7`,
          });
        }
      }

      await loadChannelStatus();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [channelId]: false }));
    }
  };

  const totalActiveChannels = Object.values(activeChannels).filter(Boolean).length;
  const totalViews = Object.values(channelStats).reduce((sum, stat) => sum + stat.views, 0);
  const totalClicks = Object.values(channelStats).reduce((sum, stat) => sum + stat.clicks, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO title="Traffic Channels - AffiliatePro" />
      <Header />

      <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
            Traffic Distribution Channels
          </h1>
          <p className="text-muted-foreground">Manage your 8 automated traffic sources</p>
        </div>

        {/* Autopilot Status Card */}
        <Card className={`mb-8 border-2 ${isAutopilotActive ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 'border-muted'}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${isAutopilotActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <div>
                  <CardTitle className="text-xl">AI Autopilot Status</CardTitle>
                  <CardDescription className="mt-1">
                    {isAutopilotActive 
                      ? "Autopilot is running - traffic channels will auto-post content 24/7"
                      : "Launch autopilot from Dashboard to enable automated traffic generation"
                    }
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={isAutopilotActive ? "default" : "secondary"} className={isAutopilotActive ? 'bg-green-500' : ''}>
                  {isAutopilotActive ? '🟢 ACTIVE' : '⚫ STOPPED'}
                </Badge>
                <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Channels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalActiveChannels}/8</div>
              <Progress value={(totalActiveChannels / 8) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Views</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">From all active channels</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-2">Affiliate link clicks</p>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Channels Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {TRAFFIC_CHANNELS.map((channel) => {
            const isActive = activeChannels[channel.id] || false;
            const stats = channelStats[channel.id] || { views: 0, clicks: 0 };
            const isLoading = loading[channel.id] || false;

            return (
              <Card key={channel.id} className={`transition-all ${isActive ? 'border-green-500/50' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-lg ${channel.color} flex items-center justify-center`}>
                        <channel.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <CardDescription className="mt-1">{channel.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Traffic Potential</div>
                        <div className="font-semibold">{channel.traffic}</div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="text-sm text-muted-foreground">Type</div>
                        <Badge variant="outline">{channel.automation}</Badge>
                      </div>
                    </div>

                    {isActive && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                        <div>
                          <div className="text-sm text-muted-foreground">Views</div>
                          <div className="text-2xl font-bold text-blue-600">{stats.views}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Clicks</div>
                          <div className="text-2xl font-bold text-green-600">{stats.clicks}</div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => toggleChannel(channel.id)}
                      disabled={isLoading}
                      className={`w-full ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {isLoading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : isActive ? (
                        <>
                          <XCircle className="w-4 h-4 mr-2" />
                          Stop Channel
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 mr-2" />
                          Activate Channel
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isAutopilotActive && (
          <Alert className="mt-8 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <strong>Autopilot is not active.</strong> Go to Dashboard and launch autopilot to enable automated traffic generation across all channels.
            </AlertDescription>
          </Alert>
        )}
      </main>

      <Footer />
    </div>
  );
}