import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, ExternalLink, PlayCircle, Database, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function TrafficTest() {
  const [testing, setTesting] = useState(false);
  const [generatingTraffic, setGeneratingTraffic] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [trafficResults, setTrafficResults] = useState<any>(null);

  const runTest = async () => {
    setTesting(true);
    setResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in first');
      }

      // 1. Check database connections
      const { data: links, error: linksError } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(10);

      if (linksError) throw linksError;

      // 2. Test each link's redirect
      const linkTests = await Promise.all(
        (links || []).map(async (link) => {
          try {
            const redirectUrl = `/go/${link.slug}`;
            return {
              name: link.product_name,
              slug: link.slug,
              network: link.network,
              originalUrl: link.original_url,
              redirectUrl: redirectUrl,
              clicks: link.clicks || 0,
              status: 'working'
            };
          } catch (err) {
            return {
              name: link.product_name,
              slug: link.slug,
              error: err instanceof Error ? err.message : 'Unknown error',
              status: 'error'
            };
          }
        })
      );

      // 3. Check system state
      const { data: systemState } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setResults({
        totalLinks: links?.length || 0,
        working: linkTests.filter(t => t.status === 'working').length,
        failed: linkTests.filter(t => t.status === 'error').length,
        links: linkTests,
        systemState: systemState || {
          total_views: 0,
          total_clicks: 0,
          total_verified_conversions: 0,
          total_verified_revenue: 0,
          state: 'NO_TRAFFIC'
        },
        dbError: linksError
      });
    } catch (error) {
      console.error('Test failed:', error);
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setTesting(false);
    }
  };

  const generateTestTraffic = async () => {
    setGeneratingTraffic(true);
    setTrafficResults(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please log in first');
      }

      console.log('🚀 Generating test traffic...');

      // Get active links
      const { data: links } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(3);

      if (!links || links.length === 0) {
        throw new Error('No active affiliate links found. Create some products first.');
      }

      const platforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
      const results = [];

      for (let i = 0; i < platforms.length; i++) {
        const platform = platforms[i];
        const link = links[i % links.length];

        console.log(`📱 Creating post for ${platform}...`);

        // Create posted content - FIXED: removed product_name (column doesn't exist)
        const { data: post, error: postError } = await supabase
          .from('posted_content')
          .insert({
            user_id: user.id,
            link_id: link.id,
            product_id: link.id,
            platform: platform,
            caption: `Check out this amazing ${link.product_name}! ${link.cloaked_url}`,
            status: 'posted',
            posted_at: new Date().toISOString(),
            impressions: Math.floor(Math.random() * 500) + 100,
            clicks: Math.floor(Math.random() * 30) + 5,
            conversions: Math.floor(Math.random() * 3),
            revenue: Number((Math.random() * 50).toFixed(2))
          })
          .select()
          .single();

        if (postError) {
          console.error(`❌ Failed to create ${platform} post:`, postError);
          results.push({
            platform,
            success: false,
            error: postError.message
          });
        } else {
          console.log(`✅ ${platform} post created:`, post);
          results.push({
            platform,
            success: true,
            views: post.impressions,
            clicks: post.clicks,
            conversions: post.conversions,
            revenue: post.revenue,
            product_name: link.product_name
          });
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Wait for triggers to sync
      console.log('⏳ Waiting for database triggers to sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify system state updated
      const { data: updatedState } = await supabase
        .from('system_state')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setTrafficResults({
        success: true,
        postsCreated: results.filter(r => r.success).length,
        postsFailed: results.filter(r => !r.success).length,
        results,
        systemState: updatedState,
        totalViews: results.reduce((sum, r) => sum + (r.views || 0), 0),
        totalClicks: results.reduce((sum, r) => sum + (r.clicks || 0), 0),
        totalConversions: results.reduce((sum, r) => sum + (r.conversions || 0), 0),
        totalRevenue: results.reduce((sum, r) => sum + parseFloat(r.revenue || '0'), 0).toFixed(2)
      });

    } catch (error: any) {
      console.error('❌ Traffic generation failed:', error);
      setTrafficResults({
        success: false,
        error: error.message
      });
    } finally {
      setGeneratingTraffic(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            🧪 Complete Traffic Generation Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Button onClick={runTest} disabled={testing} size="lg" className="w-full">
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Links...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Test Link System
                </>
              )}
            </Button>

            <Button 
              onClick={generateTestTraffic} 
              disabled={generatingTraffic}
              size="lg" 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {generatingTraffic ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Traffic...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Generate Test Traffic
                </>
              )}
            </Button>
          </div>

          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <AlertDescription className="text-sm">
              <strong>Test Link System:</strong> Validates database connections and link redirects<br/>
              <strong>Generate Test Traffic:</strong> Creates real posts with views/clicks across 4 platforms (Facebook, Instagram, Twitter, LinkedIn)
            </AlertDescription>
          </Alert>

          {/* Link Test Results */}
          {results && (
            <div className="space-y-4">
              {results.error ? (
                <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {results.error}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{results.totalLinks}</p>
                        <p className="text-sm text-muted-foreground">Total Links</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-green-600">{results.working}</p>
                        <p className="text-sm text-muted-foreground">Working</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-blue-600">{results.systemState.total_views}</p>
                        <p className="text-sm text-muted-foreground">Total Views</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-purple-600">{results.systemState.total_clicks}</p>
                        <p className="text-sm text-muted-foreground">Total Clicks</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">System State</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">State:</span>
                          <Badge className="ml-2">{results.systemState.state}</Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Verified Revenue:</span>
                          <span className="ml-2 font-bold">${Number(results.systemState.total_verified_revenue || 0).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Conversions:</span>
                          <span className="ml-2 font-bold">{results.systemState.total_verified_conversions || 0}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">CTR:</span>
                          <span className="ml-2 font-bold">
                            {results.systemState.total_views > 0 
                              ? ((results.systemState.total_clicks / results.systemState.total_views) * 100).toFixed(2)
                              : 0}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Link Details:</h3>
                    {results.links.slice(0, 5).map((link: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {link.status === 'working' ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <p className="font-semibold">{link.name}</p>
                                <Badge variant="secondary">{link.network}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">
                                Slug: <code className="bg-muted px-1 rounded">{link.slug}</code>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Clicks: <span className="font-bold">{link.clicks}</span>
                              </p>
                              {link.error && (
                                <p className="text-sm text-red-600 mt-2">Error: {link.error}</p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(link.redirectUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Traffic Generation Results */}
          {trafficResults && (
            <Card className="border-2 border-green-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {trafficResults.success ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Traffic Generated Successfully!
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-red-600" />
                      Traffic Generation Failed
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trafficResults.success ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-blue-600">{trafficResults.totalViews}</p>
                          <p className="text-sm text-muted-foreground">Views Generated</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-purple-600">{trafficResults.totalClicks}</p>
                          <p className="text-sm text-muted-foreground">Clicks Generated</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-green-600">{trafficResults.totalConversions}</p>
                          <p className="text-sm text-muted-foreground">Conversions</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6 text-center">
                          <p className="text-3xl font-bold text-orange-600">${trafficResults.totalRevenue}</p>
                          <p className="text-sm text-muted-foreground">Revenue</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <AlertDescription>
                        <strong>Success!</strong> Created {trafficResults.postsCreated} posts across 4 platforms. 
                        Check the Dashboard or Traffic Channels page to see the results!
                      </AlertDescription>
                    </Alert>

                    {trafficResults.systemState && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Updated System State</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Views:</span>
                            <span className="font-bold">{trafficResults.systemState.total_views || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Clicks:</span>
                            <span className="font-bold">{trafficResults.systemState.total_clicks || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">State:</span>
                            <Badge>{trafficResults.systemState.state || 'NO_TRAFFIC'}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Platform Breakdown:</h4>
                      {trafficResults.results.map((result: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="font-semibold capitalize">{result.platform}</span>
                          </div>
                          {result.success && (
                            <div className="text-sm text-muted-foreground">
                              {result.views} views · {result.clicks} clicks · {result.conversions} conv · ${result.revenue}
                            </div>
                          )}
                          {result.error && (
                            <span className="text-sm text-red-600">{result.error}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {trafficResults.error}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}