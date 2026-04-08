import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Mail, Share2, Video, MessageCircle, TrendingUp, Globe, CheckCircle, ExternalLink, Copy, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trafficAutomationService } from "@/services/trafficAutomationService";

const TRAFFIC_CHANNELS = [
  {
    id: 1,
    name: "Pinterest Auto-Pinning",
    icon: Share2,
    category: "Social",
    status: "automated",
    setup: "zapier",
    reach: "500-2000/month",
    description: "Automatically pin products to Pinterest boards",
    steps: [
      "Create Pinterest business account",
      "Set up Zapier: Google Sheets → Pinterest",
      "Add products to Sheet daily",
      "Zapier auto-pins with hashtags"
    ],
    zapierTemplate: "https://zapier.com/apps/google-sheets/integrations/pinterest"
  },
  {
    id: 2,
    name: "Email Drip Campaigns",
    icon: Mail,
    category: "Email",
    status: "automated",
    setup: "zapier",
    reach: "$1000-5000/month",
    description: "Send automated email sequences to your list",
    steps: [
      "Build email list (use EmailCaptureForm)",
      "Set up Zapier: Supabase → Mailchimp",
      "Create 5-email welcome sequence",
      "Auto-send when user subscribes"
    ],
    zapierTemplate: "https://zapier.com/apps/supabase/integrations/mailchimp"
  },
  {
    id: 3,
    name: "Twitter/X Auto-Posting",
    icon: MessageCircle,
    category: "Social",
    status: "automated",
    setup: "zapier",
    reach: "100-500/month",
    description: "Tweet products automatically 3x per day",
    steps: [
      "Create Twitter developer account",
      "Set up Zapier: RSS Feed → Twitter",
      "Schedule posts for peak times",
      "Include product links + hashtags"
    ],
    zapierTemplate: "https://zapier.com/apps/rss/integrations/twitter"
  },
  {
    id: 4,
    name: "YouTube Community Posts",
    icon: Video,
    category: "Video",
    status: "automated",
    setup: "zapier",
    reach: "500-3000/month",
    description: "Auto-post to YouTube community tab",
    steps: [
      "Have YouTube channel with 1000+ subs",
      "Set up Zapier: Google Sheets → YouTube",
      "Create product review posts",
      "Auto-publish weekly"
    ],
    zapierTemplate: "https://zapier.com/apps/google-sheets/integrations/youtube"
  },
  {
    id: 5,
    name: "Facebook Group Sharing",
    icon: Share2,
    category: "Social",
    status: "semi-automated",
    setup: "manual+zapier",
    reach: "200-1000/month",
    description: "Share deals in relevant FB groups",
    steps: [
      "Join 10+ relevant Facebook groups",
      "Create Zapier: Schedule → Notification",
      "Get daily reminders to post",
      "Share 2-3 products per day"
    ],
    zapierTemplate: "https://zapier.com/apps/schedule/integrations/slack"
  },
  {
    id: 6,
    name: "Instagram Stories Automation",
    icon: Share2,
    category: "Social",
    status: "semi-automated",
    setup: "zapier",
    reach: "300-1500/month",
    description: "Auto-publish product stories",
    steps: [
      "Connect Instagram business account",
      "Set up Zapier: Google Drive → Instagram",
      "Upload story templates to Drive",
      "Auto-post 2x daily"
    ],
    zapierTemplate: "https://zapier.com/apps/google-drive/integrations/instagram"
  },
  {
    id: 7,
    name: "Reddit Deal Posting",
    icon: Globe,
    category: "Community",
    status: "semi-automated",
    setup: "manual",
    reach: "200-1500/month",
    description: "Share deals in r/deals and niche subreddits",
    steps: [
      "Build Reddit karma (30+ days old account)",
      "Find 5-10 relevant subreddits",
      "Use Zapier for post reminders",
      "Manually post best deals"
    ],
    zapierTemplate: null
  },
  {
    id: 8,
    name: "LinkedIn Article Publishing",
    icon: TrendingUp,
    category: "Professional",
    status: "automated",
    setup: "zapier",
    reach: "100-800/month",
    description: "Auto-publish product reviews on LinkedIn",
    steps: [
      "Build LinkedIn connections (500+)",
      "Set up Zapier: Medium → LinkedIn",
      "Write articles on Medium first",
      "Auto-cross-post to LinkedIn"
    ],
    zapierTemplate: "https://zapier.com/apps/medium/integrations/linkedin"
  }
];

export default function TrafficChannels() {
  const { toast } = useToast();
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadAffiliateLinks(),
      loadActiveChannels()
    ]);
  };

  const loadAffiliateLinks = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('affiliate_links')
      .select('cloaked_url, product_name, network')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .limit(5);

    if (data) setAffiliateLinks(data);
  };

  const loadActiveChannels = async () => {
    const channels = await trafficAutomationService.getActiveChannels();
    setActiveChannels(channels);
    console.log("📊 Loaded active channels:", channels);
  };

  const activateChannel = async (channelName: string, channelType: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to activate traffic channels",
        variant: "destructive"
      });
      return;
    }

    setLoading(channelName);
    
    const result = await trafficAutomationService.activateChannel(channelName, channelType);
    
    if (result.success) {
      setActiveChannels([...activeChannels, channelName]);
      toast({
        title: "Channel Activated! 🚀",
        description: result.message,
      });
    } else {
      toast({
        title: "Activation Failed",
        description: result.message,
        variant: "destructive"
      });
    }

    setLoading(null);
  };

  const deactivateChannel = async (channelName: string) => {
    setLoading(channelName);

    const result = await trafficAutomationService.deactivateChannel(channelName);

    if (result.success) {
      setActiveChannels(activeChannels.filter(c => c !== channelName));
      toast({
        title: "Channel Stopped",
        description: result.message,
      });
    } else {
      toast({
        title: "Deactivation Failed",
        description: result.message,
        variant: "destructive"
      });
    }

    setLoading(null);
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard"
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">8 Automated Traffic Channels</h1>
          <p className="text-xl text-muted-foreground">
            Real traffic generation methods - runs 24/7 even when you navigate
          </p>
        </div>

        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Zap className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Combined Potential:</strong> 2,400-15,300 monthly visitors → $500-$5,000/month revenue
            <br />
            <strong>Setup Time:</strong> 2-4 hours total (one-time setup)
            <br />
            <strong>✨ NEW: Channels stay active even when you close browser!</strong>
          </AlertDescription>
        </Alert>

        {affiliateLinks.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Affiliate Links (Ready to Promote)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {affiliateLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <span className="flex-1 text-sm truncate">{link.product_name}</span>
                    <Badge variant="secondary">{link.network}</Badge>
                    <Button size="sm" variant="ghost" onClick={() => copyLink(link.cloaked_url)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {TRAFFIC_CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isActive = activeChannels.includes(channel.name);
            const isLoading = loading === channel.name;

            return (
              <Card key={channel.id} className={isActive ? "border-green-500 shadow-lg" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isActive ? "bg-green-500/10" : "bg-primary/10"}`}>
                        <Icon className={`w-6 h-6 ${isActive ? "text-green-600" : "text-primary"}`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{channel.name}</CardTitle>
                        <CardDescription>{channel.category}</CardDescription>
                      </div>
                    </div>
                    {isActive && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Running 24/7
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{channel.description}</p>

                  <div className="flex gap-2">
                    <Badge variant="secondary">{channel.reach}</Badge>
                    <Badge variant="outline">{channel.status}</Badge>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Setup Steps:</h4>
                    <ol className="space-y-1 text-sm text-muted-foreground">
                      {channel.steps.map((step, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-primary">{idx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {!isActive ? (
                      <Button
                        onClick={() => activateChannel(channel.name, channel.category)}
                        disabled={isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4 mr-2" />
                        )}
                        Activate
                      </Button>
                    ) : (
                      <Button
                        onClick={() => deactivateChannel(channel.name)}
                        disabled={isLoading}
                        variant="destructive"
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Stop Channel
                      </Button>
                    )}
                    {channel.zapierTemplate && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(channel.zapierTemplate, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Zapier
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>About Zapier Automation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>What is Zapier?</strong> Zapier connects your apps and automates workflows. 
              It's like hiring a virtual assistant that works 24/7 to post your affiliate links.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Free Plan</h4>
                <p className="text-sm text-muted-foreground">
                  5 Zaps (automations)<br />
                  100 tasks/month<br />
                  15-minute updates
                </p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <h4 className="font-semibold mb-2">Starter ($19.99/mo)</h4>
                <p className="text-sm text-muted-foreground">
                  20 Zaps<br />
                  750 tasks/month<br />
                  Best for these 8 channels
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Professional ($49/mo)</h4>
                <p className="text-sm text-muted-foreground">
                  Unlimited Zaps<br />
                  2,000 tasks/month<br />
                  For scaling traffic
                </p>
              </div>
            </div>

            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <strong>ROI Example:</strong> $19.99/mo Zapier + 8 channels = 2,400+ monthly visitors
                <br />
                At 2% conversion rate with $50 average commission = $2,400/month revenue
                <br />
                <strong>Net Profit: ~$2,380/month</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}