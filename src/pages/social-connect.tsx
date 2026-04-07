import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  CheckCircle, 
  XCircle, 
  Zap, 
  Calendar,
  Settings,
  Facebook,
  Twitter,
  Youtube,
  Instagram,
  Linkedin,
  AlertCircle,
  Clock,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { socialMediaAutomation } from "@/services/socialMediaAutomation";
import { automationScheduler } from "@/services/automationScheduler";

interface ConnectedAccount {
  id: string;
  platform: string;
  account_name: string;
  is_active: boolean;
  connected_at: string;
}

interface ScheduleConfig {
  platform: string;
  posts_per_day: number;
  posting_times: string[];
  auto_select_products: boolean;
  use_viral_predictor: boolean;
  is_active: boolean;
}

export default function SocialConnect() {
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [schedules, setSchedules] = useState<Record<string, ScheduleConfig>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  const platforms = [
    { name: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600', instructions: 'Get started in 2 minutes' },
    { name: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-pink-600', instructions: 'Via Facebook Business' },
    { name: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600', instructions: 'Google OAuth required' },
    { name: 'twitter', label: 'Twitter/X', icon: Twitter, color: 'bg-sky-500', instructions: 'Twitter API v2' },
    { name: 'pinterest', label: 'Pinterest', icon: Sparkles, color: 'bg-red-500', instructions: 'Best for product images' },
  ];

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: accounts } = await supabase
        .from('social_media_accounts')
        .select('*')
        .eq('user_id', user.id);

      if (accounts) {
        setConnectedAccounts(accounts);
      }

      const scheduleData = await automationScheduler.getSchedules();
      const scheduleMap: Record<string, ScheduleConfig> = {};
      scheduleData.forEach((s: any) => {
        scheduleMap[s.platform] = s;
      });
      setSchedules(scheduleMap);
    } catch (error) {
      console.error('Error loading connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const connectPlatform = async (platform: string) => {
    setConnecting(platform);
    
    try {
      // In production, this would open OAuth flow
      // For now, show instructions
      const instructions = {
        facebook: 'https://developers.facebook.com/apps/ → Create App → Get Access Token',
        instagram: 'Connect via Facebook Business Account',
        youtube: 'https://console.cloud.google.com → Enable YouTube Data API',
        twitter: 'https://developer.twitter.com/en/portal/dashboard → Create Project',
        pinterest: 'https://developers.pinterest.com/apps/ → Create App'
      };

      alert(`To connect ${platform}:\n\n${instructions[platform as keyof typeof instructions]}\n\nOnce you have your API credentials, enter them in Settings → Integrations.`);
      
      // Simulate connection for demo
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase.from('social_media_accounts').insert({
        user_id: user.id,
        platform,
        account_name: `${platform}_account`,
        account_id: `demo_${Date.now()}`,
        access_token: 'demo_token_get_real_from_oauth',
        is_active: true
      });

      await loadConnections();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setConnecting(null);
    }
  };

  const disconnectPlatform = async (accountId: string) => {
    try {
      await supabase.from('social_media_accounts').delete().eq('id', accountId);
      await loadConnections();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const updateSchedule = async (platform: string, updates: Partial<ScheduleConfig>) => {
    try {
      const currentSchedule = schedules[platform] || {
        platform,
        posts_per_day: 2,
        posting_times: ['10:00', '18:00'],
        auto_select_products: true,
        use_viral_predictor: true,
        is_active: false
      };

      const newSchedule = { ...currentSchedule, ...updates };
      await automationScheduler.saveSchedule(newSchedule);
      
      setSchedules(prev => ({ ...prev, [platform]: newSchedule }));
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const isConnected = (platform: string) => {
    return connectedAccounts.some(acc => acc.platform === platform && acc.is_active);
  };

  const getAccount = (platform: string) => {
    return connectedAccounts.find(acc => acc.platform === platform);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading connections...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Media Automation</h1>
          <p className="text-muted-foreground">
            Connect once, post automatically forever. Set your schedule and let AI do the rest.
          </p>
        </div>

        <Alert className="mb-6 border-primary/20 bg-primary/5">
          <Zap className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>One-Click Setup:</strong> Connect your accounts, set posting times (e.g., 2 products/day at 10am & 6pm), enable autopilot. Done!
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="connect" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connect">Connect Accounts</TabsTrigger>
            <TabsTrigger value="schedule">Posting Schedule</TabsTrigger>
            <TabsTrigger value="status">Active Automations</TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4">
            {platforms.map((platform) => {
              const connected = isConnected(platform.name);
              const account = getAccount(platform.name);
              const Icon = platform.icon;

              return (
                <Card key={platform.name} className={connected ? 'border-green-500/50' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg ${platform.color} text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {platform.label}
                            {connected && <Badge variant="default" className="bg-green-600">Connected</Badge>}
                          </CardTitle>
                          <CardDescription>{platform.instructions}</CardDescription>
                        </div>
                      </div>
                      
                      {connected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => account && disconnectPlatform(account.id)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      ) : (
                        <Button
                          onClick={() => connectPlatform(platform.name)}
                          disabled={connecting === platform.name}
                        >
                          {connecting === platform.name ? (
                            <>
                              <Clock className="w-4 h-4 mr-2 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Connect {platform.label}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  {connected && account && (
                    <CardContent>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Account:</strong> {account.account_name}</p>
                        <p><strong>Connected:</strong> {new Date(account.connected_at).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> <Badge variant="outline" className="text-green-600">Active & Ready</Badge></p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            {platforms.filter(p => isConnected(p.name)).map((platform) => {
              const schedule = schedules[platform.name] || {
                platform: platform.name,
                posts_per_day: 2,
                posting_times: ['10:00', '18:00'],
                auto_select_products: true,
                use_viral_predictor: true,
                is_active: false
              };
              const Icon = platform.icon;

              return (
                <Card key={platform.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <CardTitle>{platform.label} Posting Schedule</CardTitle>
                      </div>
                      <Switch
                        checked={schedule.is_active}
                        onCheckedChange={(checked) => updateSchedule(platform.name, { is_active: checked })}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Posts Per Day</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={schedule.posts_per_day}
                          onChange={(e) => updateSchedule(platform.name, { posts_per_day: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Posting Times</Label>
                        <div className="flex gap-2">
                          {schedule.posting_times.map((time, idx) => (
                            <Input
                              key={idx}
                              type="time"
                              value={time}
                              onChange={(e) => {
                                const newTimes = [...schedule.posting_times];
                                newTimes[idx] = e.target.value;
                                updateSchedule(platform.name, { posting_times: newTimes });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-Select Best Products</Label>
                        <p className="text-sm text-muted-foreground">AI picks high-converting products</p>
                      </div>
                      <Switch
                        checked={schedule.auto_select_products}
                        onCheckedChange={(checked) => updateSchedule(platform.name, { auto_select_products: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Use Viral Predictor</Label>
                        <p className="text-sm text-muted-foreground">Prioritize products with high viral score</p>
                      </div>
                      <Switch
                        checked={schedule.use_viral_predictor}
                        onCheckedChange={(checked) => updateSchedule(platform.name, { use_viral_predictor: checked })}
                      />
                    </div>

                    {schedule.is_active && (
                      <Alert className="border-green-500/50 bg-green-500/10">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <AlertDescription>
                          <strong>Active:</strong> Posting {schedule.posts_per_day} products daily at {schedule.posting_times.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {connectedAccounts.filter(a => a.is_active).length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect at least one social media account to set up posting schedules.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Automations Summary</CardTitle>
                <CardDescription>Your posting schedule across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(schedules).filter(s => s.is_active).map((schedule) => {
                    const platform = platforms.find(p => p.name === schedule.platform);
                    if (!platform) return null;
                    const Icon = platform.icon;

                    return (
                      <div key={schedule.platform} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{platform.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {schedule.posts_per_day} posts/day at {schedule.posting_times.join(', ')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          <Zap className="w-3 h-3 mr-1" />
                          Running
                        </Badge>
                      </div>
                    );
                  })}

                  {Object.values(schedules).filter(s => s.is_active).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No active automations yet.</p>
                      <p className="text-sm">Set up posting schedules in the "Posting Schedule" tab.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Scheduled Posts</CardTitle>
                <CardDescription>Upcoming automatic posts (next 24 hours)</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  Posts are queued and will appear here once automations are active.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>1. Connect:</strong> Click "Connect" on any platform → Login once → Done</p>
            <p><strong>2. Schedule:</strong> Set "2 products/day at 10:00 & 18:00" → Turn on autopilot</p>
            <p><strong>3. Forget:</strong> System posts automatically forever using AI-selected products</p>
            <p><strong>4. Earn:</strong> Track clicks, conversions, and commissions in dashboard</p>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}