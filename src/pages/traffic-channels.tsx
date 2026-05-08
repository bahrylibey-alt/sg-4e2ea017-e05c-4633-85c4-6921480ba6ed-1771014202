import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Zap, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type TrafficSource = {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'inactive';
  connected: boolean;
  estimated_daily_traffic: number;
  posts_today: number;
  last_post?: string;
};

export default function TrafficChannels() {
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [sources, setSources] = useState<TrafficSource[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const MAGIC_TRAFFIC_SOURCES = [
    { platform: 'Pinterest', icon: '📌', estimatedTraffic: 12000 },
    { platform: 'Reddit', icon: '🔴', estimatedTraffic: 8000 },
    { platform: 'Medium', icon: '📝', estimatedTraffic: 5000 },
    { platform: 'Quora', icon: '❓', estimatedTraffic: 3000 },
    { platform: 'Twitter', icon: '𝕏', estimatedTraffic: 6000 },
    { platform: 'LinkedIn', icon: '💼', estimatedTraffic: 4000 },
    { platform: 'YouTube', icon: '📺', estimatedTraffic: 15000 },
    { platform: 'TikTok', icon: '🎵', estimatedTraffic: 20000 },
    { platform: 'Instagram', icon: '📷', estimatedTraffic: 10000 },
    { platform: 'Tumblr', icon: '🌐', estimatedTraffic: 2000 },
    { platform: 'Discord', icon: '💬', estimatedTraffic: 5000 },
    { platform: 'Telegram', icon: '✈️', estimatedTraffic: 4000 }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Try to get first profile
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        if (profiles && profiles.length > 0) {
          setUserId(profiles[0].id);
        }
      } else {
        setUserId(user.id);
      }

      // Get campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', user?.id || (profiles && profiles[0]?.id));

      if (!campaigns || campaigns.length === 0) {
        // No campaigns - show all sources as disconnected
        const defaultSources: TrafficSource[] = MAGIC_TRAFFIC_SOURCES.map(s => ({
          id: s.platform.toLowerCase(),
          name: s.platform,
          platform: s.platform,
          status: 'inactive',
          connected: false,
          estimated_daily_traffic: s.estimatedTraffic,
          posts_today: 0
        }));
        setSources(defaultSources);
        setLoading(false);
        return;
      }

      const campaignIds = campaigns.map(c => c.id);

      // Get traffic sources
      const { data: trafficSources } = await supabase
        .from('traffic_sources')
        .select('*')
        .in('campaign_id', campaignIds);

      // Map to our format
      const mappedSources: TrafficSource[] = MAGIC_TRAFFIC_SOURCES.map(magicSource => {
        const dbSource = trafficSources?.find(ts => 
          ts.source_name?.toLowerCase() === magicSource.platform.toLowerCase()
        );

        return {
          id: dbSource?.id || magicSource.platform.toLowerCase(),
          name: magicSource.platform,
          platform: magicSource.platform,
          status: dbSource?.status === 'active' ? 'active' : 'inactive',
          connected: !!dbSource,
          estimated_daily_traffic: magicSource.estimatedTraffic,
          posts_today: 0,
          last_post: dbSource?.updated_at
        };
      });

      setSources(mappedSources);
    } catch (error: any) {
      console.error('Failed to load traffic sources:', error);
      toast({
        title: "Error",
        description: "Failed to load traffic sources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const autoActivateAll = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    setActivating(true);
    try {
      const response = await fetch('/api/traffic/auto-distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          auto_discover: true 
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Success!",
          description: `Activated ${result.distributed_to} traffic sources`,
        });
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to activate');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActivating(false);
    }
  };

  const toggleSource = async (sourceId: string, currentStatus: boolean) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive"
      });
      return;
    }

    try {
      const source = sources.find(s => s.id === sourceId);
      if (!source) return;

      // Update local state immediately for better UX
      setSources(prev => prev.map(s => 
        s.id === sourceId 
          ? { ...s, status: currentStatus ? 'inactive' : 'active' }
          : s
      ));

      // Find or create campaign
      let { data: campaign } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (!campaign) {
        const { data: newCamp } = await supabase
          .from('campaigns')
          .insert({
            user_id: userId,
            name: 'Magic Traffic Engine',
            goal: 'traffic'
          })
          .select()
          .single();
        campaign = newCamp;
      }

      if (!campaign) throw new Error('Failed to create campaign');

      // Update or create traffic source
      if (source.connected) {
        // Update existing
        await supabase
          .from('traffic_sources')
          .update({ 
            status: currentStatus ? 'inactive' : 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', sourceId);
      } else {
        // Create new
        await supabase
          .from('traffic_sources')
          .insert({
            campaign_id: campaign.id,
            source_type: 'social',
            source_name: source.platform,
            status: 'active',
            automation_enabled: true
          });
      }

      toast({
        title: currentStatus ? "Deactivated" : "Activated",
        description: `${source.platform} is now ${currentStatus ? 'OFF' : 'ON'}`,
      });

      await loadData();
    } catch (error: any) {
      console.error('Failed to toggle source:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      // Revert local state on error
      await loadData();
    }
  };

  const activeCount = sources.filter(s => s.status === 'active').length;
  const connectedCount = sources.filter(s => s.connected).length;
  const totalEstimatedTraffic = sources
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.estimated_daily_traffic, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Traffic Channels Control</h1>
          <p className="text-lg text-gray-600">12 Advanced Traffic Sources - Turn ON/OFF individually</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{activeCount}/12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{connectedCount}/12</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Est. Daily Traffic</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{totalEstimatedTraffic.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Quick Action</CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={autoActivateAll} 
                disabled={activating}
                className="w-full"
                size="sm"
              >
                {activating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Auto-Activate All
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Sources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source) => {
            const magicSource = MAGIC_TRAFFIC_SOURCES.find(ms => ms.platform === source.platform);
            return (
              <Card key={source.id} className={`border-2 ${source.status === 'active' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{magicSource?.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{source.platform}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={source.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {source.status === 'active' ? '✅ ON' : '⏸️ OFF'}
                          </Badge>
                          {source.connected ? (
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700 border-yellow-300">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Not Setup
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={source.status === 'active'}
                      onCheckedChange={() => toggleSource(source.id, source.status === 'active')}
                      className={source.status === 'active' ? 'bg-green-600' : ''}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Est. Daily Traffic</div>
                      <div className="font-semibold text-purple-600">
                        {source.estimated_daily_traffic.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Posts Today</div>
                      <div className="font-semibold text-blue-600">
                        {source.posts_today}
                      </div>
                    </div>
                  </div>
                  
                  {source.last_post && (
                    <div className="text-xs text-gray-500">
                      Last post: {new Date(source.last_post).toLocaleDateString()}
                    </div>
                  )}

                  {!source.connected && (
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Setup API Key
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>✅ <strong>ON (Green)</strong> - Source is actively posting and generating traffic</p>
            <p>⏸️ <strong>OFF (Gray)</strong> - Source is available but not posting</p>
            <p>🔌 <strong>Connected</strong> - API configured and ready to use</p>
            <p>⚠️ <strong>Not Setup</strong> - Needs API key configuration (click "Setup API Key")</p>
            <p className="pt-2 text-blue-700">
              💡 <strong>Tip:</strong> Click the toggle switch to turn any source ON/OFF instantly. Use "Auto-Activate All" to enable all 12 sources at once!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}