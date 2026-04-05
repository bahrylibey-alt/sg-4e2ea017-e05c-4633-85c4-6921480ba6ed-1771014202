import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Globe,
  TrendingUp,
  Users,
  MousePointerClick,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trafficAutomationService } from "@/services/trafficAutomationService";

/**
 * REAL TRAFFIC TESTING PAGE
 * 
 * This page tests if your website is receiving REAL traffic
 * Tests all traffic sources and verifies they're working
 */

interface TrafficTest {
  name: string;
  status: "pending" | "running" | "pass" | "fail";
  message: string;
  data?: any;
}

export default function TrafficTest() {
  const [tests, setTests] = useState<TrafficTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [realTraffic, setRealTraffic] = useState<any[]>([]);

  const updateTest = (name: string, status: TrafficTest["status"], message: string, data?: any) => {
    setTests(prev => {
      const existing = prev.find(t => t.name === name);
      if (existing) {
        return prev.map(t => t.name === name ? { name, status, message, data } : t);
      }
      return [...prev, { name, status, message, data }];
    });
  };

  const runTrafficTests = async () => {
    setIsRunning(true);
    setTests([]);

    // TEST 1: Check if traffic tracking is installed
    updateTest("Traffic Tracking Setup", "running", "Checking installation...");
    try {
      const testVisit = await fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: "test",
          page: "/traffic-test"
        })
      });

      if (testVisit.ok) {
        const data = await testVisit.json();
        updateTest(
          "Traffic Tracking Setup",
          "pass",
          `✅ Traffic tracking API working! Detected source: ${data.source}`,
          data
        );
      } else {
        updateTest("Traffic Tracking Setup", "fail", "❌ Traffic tracking API not responding");
      }
    } catch (error: any) {
      updateTest("Traffic Tracking Setup", "fail", `❌ Error: ${error.message}`);
    }

    // TEST 2: Get user session
    updateTest("User Authentication", "running", "Checking session...");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      updateTest("User Authentication", "fail", "❌ No active session");
      setIsRunning(false);
      return;
    }
    updateTest("User Authentication", "pass", `✅ Logged in as ${session.user.email}`);

    // TEST 3: Get campaign for testing
    updateTest("Campaign Access", "running", "Finding active campaign...");
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .limit(1);

    if (!campaigns || campaigns.length === 0) {
      updateTest("Campaign Access", "fail", "❌ No active campaigns found");
      setIsRunning(false);
      return;
    }

    const campaign = campaigns[0];
    updateTest("Campaign Access", "pass", `✅ Using campaign: ${campaign.name}`);

    // TEST 4: Check existing traffic sources
    updateTest("Traffic Sources", "running", "Checking configured sources...");
    const { data: sources } = await supabase
      .from("traffic_sources")
      .select("*")
      .eq("campaign_id", campaign.id);

    if (sources && sources.length > 0) {
      updateTest(
        "Traffic Sources",
        "pass",
        `✅ Found ${sources.length} traffic source(s): ${sources.map(s => s.source_name).join(", ")}`,
        sources
      );
    } else {
      updateTest("Traffic Sources", "fail", "❌ No traffic sources configured");
    }

    // TEST 5: Simulate real traffic from different sources
    updateTest("Traffic Simulation", "running", "Simulating visits from multiple sources...");
    
    const simulatedSources = [
      { referrer: "https://www.google.com/search?q=affiliate+marketing", expected: "Google Search" },
      { referrer: "https://www.facebook.com/", expected: "Facebook" },
      { referrer: "https://twitter.com/", expected: "Twitter/X" },
      { referrer: "", expected: "Direct Traffic" }
    ];

    let successCount = 0;
    for (const source of simulatedSources) {
      try {
        const response = await fetch("/api/track-visit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Referer": source.referrer
          },
          body: JSON.stringify({
            campaignId: campaign.id,
            page: "/test"
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.source === source.expected) {
            successCount++;
          }
        }
      } catch (error) {
        console.error(`Failed to simulate ${source.expected}:`, error);
      }
    }

    if (successCount === simulatedSources.length) {
      updateTest(
        "Traffic Simulation",
        "pass",
        `✅ Successfully tracked ${successCount} different traffic sources`,
        { sources: simulatedSources.map(s => s.expected) }
      );
    } else {
      updateTest(
        "Traffic Simulation",
        "fail",
        `❌ Only tracked ${successCount}/${simulatedSources.length} sources correctly`
      );
    }

    // TEST 6: Get real traffic metrics
    updateTest("Real Traffic Metrics", "running", "Fetching real visitor data...");
    const metrics = await trafficAutomationService.getRealTrafficMetrics(campaign.id);
    
    if (metrics.length > 0) {
      const totalVisitors = metrics.reduce((sum, m) => sum + m.visitors, 0);
      updateTest(
        "Real Traffic Metrics",
        "pass",
        `✅ Receiving real traffic! Total visitors: ${totalVisitors} from ${metrics.length} source(s)`,
        metrics
      );
      setRealTraffic(metrics);
    } else {
      updateTest(
        "Real Traffic Metrics",
        "fail",
        "❌ No real traffic data yet. Start sharing your links to get visitors!"
      );
    }

    // TEST 7: Traffic status check
    updateTest("Traffic Status", "running", "Checking live traffic status...");
    const status = await trafficAutomationService.getTrafficStatus(campaign.id);
    
    updateTest(
      "Traffic Status",
      status.totalTraffic > 0 ? "pass" : "fail",
      status.totalTraffic > 0 
        ? `✅ Live traffic detected! ${status.totalTraffic} total visits. Top source: ${status.topSource}`
        : "❌ No live traffic yet. Share your affiliate links to start getting visitors!",
      status
    );

    setIsRunning(false);
  };

  const passed = tests.filter(t => t.status === "pass").length;
  const failed = tests.filter(t => t.status === "fail").length;
  const total = tests.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Globe className="h-10 w-10 text-blue-600" />
            Real Traffic Testing
          </h1>
          <p className="text-muted-foreground">
            Verify your website is receiving REAL visitors and track traffic sources
          </p>
        </div>

        {/* Control Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Traffic Test Control</CardTitle>
            <CardDescription>
              Run comprehensive tests to verify real traffic tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTrafficTests} 
              disabled={isRunning}
              size="lg"
              className="w-full"
            >
              {isRunning ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Running Tests...</>
              ) : (
                <><RefreshCw className="mr-2 h-5 w-5" /> Test Traffic Tracking</>
              )}
            </Button>

            {total > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{passed}</div>
                  <div className="text-sm text-green-700 dark:text-green-400">Passed</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{failed}</div>
                  <div className="text-sm text-red-700 dark:text-red-400">Failed</div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{total}</div>
                  <div className="text-sm text-blue-700 dark:text-blue-400">Total</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {tests.length > 0 && (
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold">Test Results</h2>
            {tests.map((test, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {test.status === "pass" && <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />}
                      {test.status === "fail" && <XCircle className="h-5 w-5 text-red-500 mt-0.5" />}
                      {test.status === "running" && <Loader2 className="h-5 w-5 text-blue-500 animate-spin mt-0.5" />}
                      
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{test.name}</h3>
                        <p className="text-sm text-muted-foreground">{test.message}</p>
                        
                        {test.data && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View details
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-auto max-h-48">
                              {JSON.stringify(test.data, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <Badge variant={test.status === "pass" ? "default" : test.status === "fail" ? "destructive" : "secondary"}>
                      {test.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Real Traffic Dashboard */}
        {realTraffic.length > 0 && (
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Real Traffic Sources (Live Data)
              </CardTitle>
              <CardDescription>
                Actual visitors coming to your site right now
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {realTraffic.map((traffic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-semibold">{traffic.source}</div>
                      <div className="text-sm text-muted-foreground">
                        {traffic.visitors} visitor{traffic.visitors !== 1 ? "s" : ""} · 
                        {traffic.conversions} conversion{traffic.conversions !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-600">
                        ${traffic.revenue.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last: {new Date(traffic.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Message */}
        {total > 0 && failed === 0 && !isRunning && (
          <Alert className="mt-8 border-green-500 bg-green-50 dark:bg-green-900/10">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-400">
              <strong>🎉 ALL TRAFFIC TESTS PASSED!</strong> Your website is receiving real traffic:
              <ul className="mt-2 space-y-1 text-sm">
                <li>✅ Traffic tracking API operational</li>
                <li>✅ All traffic sources detected correctly</li>
                <li>✅ Real visitor data being recorded</li>
                <li>✅ Traffic metrics available in real-time</li>
              </ul>
              <p className="mt-3 font-semibold">
                Your affiliate system is LIVE and tracking real visitors! 🚀
              </p>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}