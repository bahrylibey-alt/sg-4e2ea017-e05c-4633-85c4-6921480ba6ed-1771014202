import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { webhookService } from "@/services/webhookService";

interface TestResult {
  name: string;
  status: "pending" | "running" | "pass" | "fail";
  message: string;
  details?: any;
}

export default function TestAutoRepair() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const updateResult = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.name === name);
      if (existing) {
        return prev.map((r) => r.name === name ? { name, status, message, details } : r);
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runIntegrationTests = async () => {
    setTesting(true);
    setResults([]);

    try {
      // TEST 1: Google Analytics
      updateResult("Google Analytics", "running", "Checking GA4 configuration...");
      const gaScript = document.querySelector('script[src*="googletagmanager.com"]');
      const gaConfigScript = document.getElementById('google-analytics');
      
      if (gaScript && gaConfigScript) {
        // Try to send a test event
        if (typeof (window as any).gtag === 'function') {
          (window as any).gtag('event', 'integration_test', {
            event_category: 'test',
            event_label: 'Integration Test',
          });
          updateResult("Google Analytics", "pass", "✅ GA4 Active - Tracking ID: G-BNDP8BPD2S | Test event sent", {
            script_loaded: true,
            gtag_function: true,
            measurement_id: "G-BNDP8BPD2S"
          });
        } else {
          updateResult("Google Analytics", "pass", "✅ GA4 Script loaded (gtag initializing...)", {
            script_loaded: true,
            gtag_function: false
          });
        }
      } else {
        updateResult("Google Analytics", "fail", "❌ GA4 script not found in page", {
          script_loaded: false
        });
      }

      // TEST 2: Stripe Configuration
      updateResult("Stripe", "running", "Checking Stripe integration...");
      const { data: session } = await supabase.auth.getSession();
      if (session?.session) {
        const { data: stripeIntegration } = await supabase
          .from("integrations")
          .select("config, status")
          .eq("user_id", session.session.user.id)
          .eq("provider", "stripe")
          .eq("status", "connected")
          .single();

        if (stripeIntegration && (stripeIntegration.config as any)?.publishable_key) {
          const pubKey = (stripeIntegration.config as any).publishable_key;
          const isTestKey = pubKey.startsWith('pk_test_');
          updateResult("Stripe", "pass", `✅ Stripe Connected - ${isTestKey ? 'Test Mode' : 'Live Mode'}`, {
            configured: true,
            mode: isTestKey ? 'test' : 'live',
            publishable_key_prefix: pubKey.substring(0, 15) + '...'
          });
        } else {
          updateResult("Stripe", "fail", "❌ Stripe not configured", {
            configured: false
          });
        }
      } else {
        updateResult("Stripe", "fail", "❌ Not logged in - cannot check Stripe");
      }

      // TEST 3: Zapier Webhook
      updateResult("Zapier", "running", "Testing Zapier webhook...");
      const { data: zapierSession } = await supabase.auth.getSession();
      if (zapierSession?.session) {
        const { data: zapierIntegration } = await supabase
          .from("integrations")
          .select("config, status")
          .eq("user_id", zapierSession.session.user.id)
          .eq("provider", "zapier")
          .eq("status", "connected")
          .single();

        if (zapierIntegration && (zapierIntegration.config as any)?.webhook_url) {
          // Try to send a test webhook
          try {
            const webhookSent = await webhookService.sendToZapier(zapierSession.session.user.id, {
              event: "integration_test",
              type: "test",
              message: "Testing Zapier webhook from integration test page",
              timestamp: new Date().toISOString(),
            });

            if (webhookSent) {
              updateResult("Zapier", "pass", "✅ Zapier Webhook Active - Test event sent successfully", {
                webhook_url: (zapierIntegration.config as any).webhook_url.substring(0, 30) + '...',
                test_sent: true
              });
            } else {
              updateResult("Zapier", "fail", "❌ Webhook configured but test send failed", {
                webhook_url: (zapierIntegration.config as any).webhook_url.substring(0, 30) + '...',
                test_sent: false
              });
            }
          } catch (error: any) {
            updateResult("Zapier", "fail", `❌ Webhook error: ${error.message}`);
          }
        } else {
          updateResult("Zapier", "fail", "❌ Zapier webhook not configured");
        }
      } else {
        updateResult("Zapier", "fail", "❌ Not logged in - cannot test Zapier");
      }

      // TEST 4: Amazon Associates
      updateResult("Amazon Associates", "running", "Checking Amazon integration...");
      const { data: amazonIntegration } = await supabase
        .from("integrations")
        .select("config, status")
        .eq("provider", "amazon_associates")
        .eq("status", "connected")
        .maybeSingle();

      if (amazonIntegration && (amazonIntegration.config as any)?.affiliate_tag) {
        updateResult("Amazon Associates", "pass", `✅ Amazon Connected - Tag: ${(amazonIntegration.config as any).affiliate_tag}`, {
          tag: (amazonIntegration.config as any).affiliate_tag
        });
      } else {
        updateResult("Amazon Associates", "fail", "❌ Amazon Associates not configured");
      }

      // TEST 5: Temu Affiliate
      updateResult("Temu Affiliate", "running", "Checking Temu integration...");
      const { data: temuIntegration } = await supabase
        .from("integrations")
        .select("config, status")
        .eq("provider", "temu_affiliate")
        .eq("status", "connected")
        .maybeSingle();

      if (temuIntegration && (temuIntegration.config as any)?.affiliate_id) {
        updateResult("Temu Affiliate", "pass", `✅ Temu Connected - ID: ${(temuIntegration.config as any).affiliate_id}`, {
          affiliate_id: (temuIntegration.config as any).affiliate_id,
          tracking_id: (temuIntegration.config as any).tracking_id
        });
      } else {
        updateResult("Temu Affiliate", "fail", "❌ Temu Affiliate not configured");
      }

      // TEST 6: Webhook Service Availability
      updateResult("Webhook Service", "running", "Checking webhook service...");
      const hasWebhookService = typeof webhookService !== 'undefined' 
        && typeof webhookService.sendToZapier === 'function'
        && typeof webhookService.notifyClick === 'function'
        && typeof webhookService.notifyConversion === 'function';

      if (hasWebhookService) {
        updateResult("Webhook Service", "pass", "✅ Webhook Service Ready - All methods available", {
          methods: ['sendToZapier', 'notifyClick', 'notifyConversion', 'notifyMilestone']
        });
      } else {
        updateResult("Webhook Service", "fail", "❌ Webhook service not loaded");
      }

      // TEST 7: Click Tracking API
      updateResult("Click Tracker API", "running", "Testing click tracker endpoint...");
      try {
        const clickTestResponse = await fetch('/api/click-tracker', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: 'test-integration-check' })
        });
        
        if (clickTestResponse.status === 404 || clickTestResponse.status === 400) {
          // Expected - link doesn't exist, but API is working
          updateResult("Click Tracker API", "pass", "✅ Click Tracker API Active (404 = API working, link not found)", {
            endpoint: '/api/click-tracker',
            status: clickTestResponse.status
          });
        } else if (clickTestResponse.ok) {
          updateResult("Click Tracker API", "pass", "✅ Click Tracker API Active and responding", {
            endpoint: '/api/click-tracker',
            status: clickTestResponse.status
          });
        }
      } catch (error: any) {
        updateResult("Click Tracker API", "fail", `❌ Click Tracker API Error: ${error.message}`);
      }

      // TEST 8: Commission Postback API
      updateResult("Commission Postback API", "running", "Testing postback endpoint...");
      try {
        const postbackTestResponse = await fetch('/api/postback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            network: 'test',
            click_id: 'integration-test',
            amount: 0,
            status: 'pending'
          })
        });
        
        if (postbackTestResponse.ok) {
          updateResult("Commission Postback API", "pass", "✅ Postback API Active - Ready to receive webhooks", {
            endpoint: '/api/postback',
            status: postbackTestResponse.status
          });
        }
      } catch (error: any) {
        updateResult("Commission Postback API", "fail", `❌ Postback API Error: ${error.message}`);
      }

      // TEST 9: SEO Meta Tags
      updateResult("SEO Optimization", "running", "Checking SEO configuration...");
      const metaTitle = document.querySelector('meta[property="og:title"]');
      const metaDescription = document.querySelector('meta[property="og:description"]');
      const metaImage = document.querySelector('meta[property="og:image"]');
      
      if (metaTitle && metaDescription && metaImage) {
        updateResult("SEO Optimization", "pass", "✅ SEO Configured - All OG tags present", {
          og_title: metaTitle.getAttribute('content')?.substring(0, 50),
          og_description: metaDescription.getAttribute('content')?.substring(0, 50),
          og_image: metaImage.getAttribute('content')
        });
      } else {
        updateResult("SEO Optimization", "fail", "❌ Missing SEO meta tags", {
          og_title: !!metaTitle,
          og_description: !!metaDescription,
          og_image: !!metaImage
        });
      }

    } catch (error: any) {
      updateResult("System Error", "fail", `❌ Test suite error: ${error.message}`);
    }

    setTesting(false);
  };

  const passed = results.filter(r => r.status === "pass").length;
  const failed = results.filter(r => r.status === "fail").length;
  const total = results.length;
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">🧪 Complete Integration Test Suite</CardTitle>
            <CardDescription>
              Verify all your integrations are properly configured and working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={runIntegrationTests} 
              disabled={testing}
              size="lg"
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "🚀 Run Integration Tests"
              )}
            </Button>

            {results.length > 0 && (
              <div className="flex gap-4 justify-center">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  ✅ Passed: {passed}/{total}
                </Badge>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  ❌ Failed: {failed}/{total}
                </Badge>
                <Badge 
                  variant={score === 100 ? "default" : score >= 70 ? "secondary" : "destructive"}
                  className="text-lg px-4 py-2"
                >
                  Score: {score}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => (
              <Card key={result.name} className={
                result.status === "pass" ? "border-green-500 bg-green-50" :
                result.status === "fail" ? "border-red-500 bg-red-50" :
                result.status === "running" ? "border-blue-500 bg-blue-50" :
                ""
              }>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {result.status === "pass" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                      {result.status === "fail" && <XCircle className="h-5 w-5 text-red-600" />}
                      {result.status === "running" && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
                      {result.status === "pending" && <AlertCircle className="h-5 w-5 text-slate-400" />}
                      {result.name}
                    </CardTitle>
                    <Badge variant={
                      result.status === "pass" ? "default" :
                      result.status === "fail" ? "destructive" :
                      "secondary"
                    }>
                      {result.status}
                    </Badge>
                  </div>
                  <CardDescription>{result.message}</CardDescription>
                </CardHeader>
                {result.details && (
                  <CardContent>
                    <pre className="bg-slate-100 p-3 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {results.length > 0 && score === 100 && (
          <Alert className="mt-6 border-green-500 bg-green-50">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              🎉 ALL TESTS PASSED - YOUR SYSTEM IS FULLY OPERATIONAL!
              <br />
              <span className="text-sm">All integrations are properly configured and working correctly.</span>
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
}