import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Database,
  Zap,
  TrendingUp,
  Trash2,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SystemAudit() {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const purgeMockData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system/purge-mock-data', {
        method: 'POST'
      });
      const data = await response.json();
      
      toast({
        title: "Mock Data Purged",
        description: `Deleted ${data.message}`,
      });

      // Re-run audit
      runAudit();
    } catch (error) {
      toast({
        title: "Purge Failed",
        description: "Could not purge mock data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runRealSystemTest = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/system-test', {
        method: 'POST'
      });
      const data = await response.json();
      
      toast({
        title: data.success ? "System Test Complete" : "Test Failed",
        description: data.message,
      });

      // Re-run audit
      runAudit();
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Could not run system test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAudit = async () => {
    setScanning(true);
    const auditResults: any = {
      timestamp: new Date().toISOString(),
      checks: [],
      mockDataFound: [],
      bottlenecks: [],
      recommendations: [],
      score: 0
    };

    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      let userId = user?.id;
      
      if (!userId) {
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        userId = profiles?.[0]?.id;
      }

      if (!userId) {
        throw new Error('No user found');
      }

      // CHECK 1: Product Data Validation
      auditResults.checks.push({ name: 'Product Data Validation', status: 'checking' });
      const { data: products } = await supabase
        .from('product_catalog')
        .select('*')
        .eq('user_id', userId);

      let realProducts = 0;
      let mockProducts = 0;

      products?.forEach(p => {
        const hasRealNetwork = ['amazon', 'aliexpress', 'clickbank', 'ebay', 'shareasale', 'temu'].includes(p.network?.toLowerCase());
        const hasRealUrl = p.affiliate_url?.startsWith('http');
        const hasRealPrice = p.price > 0;

        if (hasRealNetwork && hasRealUrl && hasRealPrice) {
          realProducts++;
        } else {
          mockProducts++;
          auditResults.mockDataFound.push({
            type: 'product',
            id: p.id,
            name: p.name,
            reason: !hasRealNetwork ? 'Invalid network' : !hasRealUrl ? 'Invalid URL' : 'Invalid price'
          });
        }
      });

      auditResults.checks.push({
        name: 'Product Data Validation',
        status: mockProducts === 0 ? 'pass' : 'warning',
        real: realProducts,
        mock: mockProducts,
        total: products?.length || 0
      });

      // CHECK 2: Click Tracking Validation
      auditResults.checks.push({ name: 'Click Tracking Validation', status: 'checking' });
      const { data: clicksRes } = await (supabase as any)
        .from('click_events')
        .select('*')
        .eq('user_id', userId);
      const clicks = clicksRes as any[];

      const validPlatforms = ['pinterest', 'tiktok', 'twitter', 'facebook', 'instagram', 'reddit', 'linkedin', 'youtube'];
      let realClicks = 0;
      let mockClicks = 0;

      clicks?.forEach(c => {
        const hasValidPlatform = validPlatforms.includes(c.platform?.toLowerCase() || c.source?.toLowerCase() || '');
        const hasLinkId = !!c.link_id;
        const hasTimestamp = !!(c.created_at || c.clicked_at);

        if (hasValidPlatform && hasLinkId && hasTimestamp) {
          realClicks++;
        } else {
          mockClicks++;
          auditResults.mockDataFound.push({
            type: 'click',
            id: c.id,
            reason: !hasValidPlatform ? 'Invalid platform' : !hasLinkId ? 'Missing link_id' : 'Missing timestamp'
          });
        }
      });

      auditResults.checks.push({
        name: 'Click Tracking Validation',
        status: mockClicks === 0 ? 'pass' : 'warning',
        real: realClicks,
        mock: mockClicks,
        total: clicks?.length || 0
      });

      // CHECK 3: Conversion Validation
      auditResults.checks.push({ name: 'Conversion Validation', status: 'checking' });
      const { data: conversionsRes } = await (supabase as any)
        .from('conversion_events')
        .select('*')
        .eq('user_id', userId);
      const conversions = conversionsRes as any[];

      let realConversions = 0;
      let mockConversions = 0;

      conversions?.forEach(c => {
        const hasClickId = !!c.click_id;
        const hasRevenue = c.revenue > 0;
        const hasSource = !!(c.source || c.traffic_source);

        if (hasClickId && hasRevenue && hasSource) {
          realConversions++;
        } else {
          mockConversions++;
          auditResults.mockDataFound.push({
            type: 'conversion',
            id: c.id,
            reason: !hasClickId ? 'Missing click_id' : !hasRevenue ? 'Invalid revenue' : 'Missing source'
          });
        }
      });

      auditResults.checks.push({
        name: 'Conversion Validation',
        status: mockConversions === 0 ? 'pass' : 'warning',
        real: realConversions,
        mock: mockConversions,
        total: conversions?.length || 0
      });

      // CHECK 4: Traffic Sources Configuration
      auditResults.checks.push({ name: 'Traffic Sources Check', status: 'checking' });
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id')
        .eq('user_id', userId);

      const campaignIds = campaigns?.map(c => c.id) || [];
      let activeTraffic = 0;

      if (campaignIds.length > 0) {
        const { data: trafficSources } = await supabase
          .from('traffic_sources')
          .select('*')
          .in('campaign_id', campaignIds)
          .eq('status', 'active');

        activeTraffic = trafficSources?.length || 0;
      }

      auditResults.checks.push({
        name: 'Traffic Sources Check',
        status: activeTraffic > 0 ? 'pass' : 'warning',
        active: activeTraffic,
        message: activeTraffic === 0 ? 'No active traffic sources found' : `${activeTraffic} active sources`
      });

      // CHECK 5: Autopilot Status
      auditResults.checks.push({ name: 'Autopilot Status', status: 'checking' });
      const { data: settings } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      auditResults.checks.push({
        name: 'Autopilot Status',
        status: settings?.autopilot_enabled ? 'pass' : 'warning',
        enabled: settings?.autopilot_enabled || false,
        lastRun: settings?.last_autopilot_run,
        message: !settings?.autopilot_enabled ? 'Autopilot is disabled' : 'Autopilot is running'
      });

      // CHECK 6: Content Generation
      auditResults.checks.push({ name: 'Content Generation', status: 'checking' });
      const { data: content } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', userId);

      const recentContent = content?.filter(c => {
        const created = new Date(c.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return created > weekAgo;
      }).length || 0;

      auditResults.checks.push({
        name: 'Content Generation',
        status: recentContent > 0 ? 'pass' : 'warning',
        total: content?.length || 0,
        recent: recentContent,
        message: recentContent === 0 ? 'No content generated in last 7 days' : `${recentContent} recent posts`
      });

      // BOTTLENECK DETECTION
      if (mockProducts > 0) {
        auditResults.bottlenecks.push({
          type: 'Product Quality',
          severity: 'high',
          message: `${mockProducts} products have invalid data (network, URL, or price)`,
          fix: 'Run product discovery from real affiliate networks'
        });
      }

      if (activeTraffic === 0) {
        auditResults.bottlenecks.push({
          type: 'Traffic Distribution',
          severity: 'critical',
          message: 'No active traffic sources - campaigns won\'t generate clicks',
          fix: 'Activate traffic sources in /traffic-channels'
        });
      }

      if (!settings?.autopilot_enabled) {
        auditResults.bottlenecks.push({
          type: 'Automation',
          severity: 'high',
          message: 'Autopilot is disabled - system won\'t run autonomously',
          fix: 'Enable autopilot on homepage dashboard'
        });
      }

      if (recentContent === 0) {
        auditResults.bottlenecks.push({
          type: 'Content Pipeline',
          severity: 'medium',
          message: 'No content generated recently - traffic has nothing to promote',
          fix: 'Generate content using AI Content Generator'
        });
      }

      // RECOMMENDATIONS
      if (realProducts > 0 && activeTraffic > 0 && settings?.autopilot_enabled) {
        auditResults.recommendations.push('✅ Core system is operational - monitor performance');
      }

      if (realProducts < 10) {
        auditResults.recommendations.push('🔍 Discover more products to increase revenue opportunities');
      }

      if (activeTraffic < 5) {
        auditResults.recommendations.push('🚀 Activate more traffic sources to increase reach');
      }

      if (recentContent < 10) {
        auditResults.recommendations.push('✍️ Generate more content to maintain posting frequency');
      }

      // Calculate score
      const passCount = auditResults.checks.filter((c: any) => c.status === 'pass').length;
      auditResults.score = Math.round((passCount / auditResults.checks.length) * 100);

      setResults(auditResults);

    } catch (error: any) {
      console.error('Audit failed:', error);
      auditResults.checks.push({
        name: 'System Audit',
        status: 'fail',
        error: error.message
      });
      setResults(auditResults);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">System Audit & Data Validation</h1>
          <p className="text-lg text-gray-600">
            Scan for mock data, identify bottlenecks, ensure real data only
          </p>
        </div>

        {/* Scan Button */}
        <Card className="border-2 border-blue-500">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                onClick={runAudit}
                disabled={scanning}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Scanning System...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-5 w-5" />
                    Run Complete System Audit
                  </>
                )}
              </Button>

              <Button
                onClick={purgeMockData}
                disabled={scanning}
                variant="destructive"
                size="lg"
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Purging...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-5 w-5" />
                    Purge All Mock Data
                  </>
                )}
              </Button>

              <Button
                onClick={runRealSystemTest}
                disabled={scanning}
                variant="outline"
                size="lg"
              >
                {scanning ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    Test Real System
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Score */}
            <Card className={`border-2 ${
              results.score >= 80 ? 'border-green-500 bg-green-50' :
              results.score >= 60 ? 'border-yellow-500 bg-yellow-50' :
              'border-red-500 bg-red-50'
            }`}>
              <CardHeader>
                <CardTitle className="text-center">
                  <div className="text-6xl font-bold mb-2">
                    {results.score}%
                  </div>
                  <div className="text-lg text-gray-700">System Health Score</div>
                </CardTitle>
              </CardHeader>
            </Card>

            {/* Checks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-6 w-6" />
                  Data Validation Checks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.checks.map((check: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {check.status === 'pass' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {check.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        {check.status === 'fail' && <XCircle className="h-5 w-5 text-red-600" />}
                        <div>
                          <div className="font-semibold">{check.name}</div>
                          {check.message && <div className="text-sm text-gray-600">{check.message}</div>}
                        </div>
                      </div>
                      <div className="text-right">
                        {check.real !== undefined && (
                          <div className="text-sm">
                            <span className="text-green-600 font-semibold">{check.real} real</span>
                            {check.mock > 0 && (
                              <span className="text-red-600 font-semibold ml-2">/ {check.mock} mock</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bottlenecks */}
            {results.bottlenecks.length > 0 && (
              <Card className="border-2 border-orange-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                    Bottlenecks Found ({results.bottlenecks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.bottlenecks.map((bottleneck: any, i: number) => (
                      <div key={i} className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-start gap-3">
                          <Badge variant={
                            bottleneck.severity === 'critical' ? 'destructive' :
                            bottleneck.severity === 'high' ? 'default' : 'secondary'
                          }>
                            {bottleneck.severity}
                          </Badge>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{bottleneck.type}</div>
                            <div className="text-sm text-gray-700 mt-1">{bottleneck.message}</div>
                            <div className="text-sm text-blue-600 mt-2">💡 Fix: {bottleneck.fix}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mock Data Found */}
            {results.mockDataFound.length > 0 && (
              <Card className="border-2 border-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-6 w-6 text-red-600" />
                    Mock/Invalid Data Found ({results.mockDataFound.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {results.mockDataFound.slice(0, 20).map((item: any, i: number) => (
                      <div key={i} className="text-sm p-3 bg-red-50 rounded border border-red-200">
                        <span className="font-semibold">{item.type}</span>: {item.name || item.id} - {item.reason}
                      </div>
                    ))}
                    {results.mockDataFound.length > 20 && (
                      <div className="text-sm text-gray-600 text-center">
                        ... and {results.mockDataFound.length - 20} more
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {results.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="p-3 bg-blue-50 rounded-lg text-sm">
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audit Metadata */}
            <Card className="bg-gray-50">
              <CardContent className="pt-6">
                <div className="text-xs text-gray-600 text-center">
                  Audit completed at: {new Date(results.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}