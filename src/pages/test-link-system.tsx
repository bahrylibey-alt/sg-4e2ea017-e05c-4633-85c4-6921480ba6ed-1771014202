import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { linkHealthMonitor } from "@/services/linkHealthMonitor";
import { smartLinkRouter } from "@/services/smartLinkRouter";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Link2, Wrench, Search } from "lucide-react";

/**
 * COMPREHENSIVE LINK SYSTEM TEST PAGE
 * Tests all link monitoring, validation, repair, and routing systems end-to-end
 */

export default function TestLinkSystem() {
  const [testUrls] = useState({
    amazon: [
      "https://www.amazon.com/dp/B0CKWWS8N5",
      "https://amzn.to/3XYZ123",
      "https://www.amazon.com/invalid-url"
    ],
    temu: [
      "https://www.temu.com/goods.html?goods_id=601099524298856",
      "https://temu.to/k/abc123",
      "https://www.temu.com/invalid-product"
    ],
    aliexpress: [
      "https://www.aliexpress.com/item/1005006789123456.html",
      "https://s.click.aliexpress.com/e/_ABC123",
      "https://www.aliexpress.com/invalid"
    ]
  });

  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState("");
  const [repairResults, setRepairResults] = useState<any>(null);
  const [healthDashboard, setHealthDashboard] = useState<any>(null);

  // Test 1: URL Format Validation
  const testUrlValidation = async () => {
    setLoading(true);
    setResults([]);
    
    const testResults = [];
    
    for (const network of Object.keys(testUrls)) {
      for (const url of testUrls[network as keyof typeof testUrls]) {
        const result = await linkHealthMonitor.validateProduct(url, network);
        const productId = linkHealthMonitor.extractProductId(url, network);
        
        testResults.push({
          url,
          network,
          ...result,
          productId
        });
      }
    }
    
    setResults(testResults);
    setLoading(false);
  };

  // Test 2: Auto-Repair System
  const testAutoRepair = async () => {
    setLoading(true);
    const result = await linkHealthMonitor.oneClickAutoRepair(campaignId || undefined);
    setRepairResults(result);
    setLoading(false);
  };

  // Test 3: Health Dashboard
  const testHealthDashboard = async () => {
    setLoading(true);
    
    if (!campaignId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        
        if (campaign) {
          const dashboard = await linkHealthMonitor.getHealthDashboard(campaign.id);
          setHealthDashboard(dashboard);
        }
      }
    } else {
      const dashboard = await linkHealthMonitor.getHealthDashboard(campaignId);
      setHealthDashboard(dashboard);
    }
    
    setLoading(false);
  };

  // Test 4: Smart Router
  const testSmartRouter = async () => {
    setLoading(true);
    const testResults = [];
    
    // Create test links
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      for (const network of Object.keys(testUrls)) {
        const url = testUrls[network as keyof typeof testUrls][0];
        
        const createResult = await affiliateLinkService.createLink({
          originalUrl: url,
          productName: `Test ${network} Product`,
          network
        });
        
        if (createResult.success && createResult.link) {
          const routeResult = await smartLinkRouter.getRedirectUrl(createResult.link.slug);
          
          testResults.push({
            network,
            slug: createResult.link.slug,
            ...routeResult
          });
        }
      }
    }
    
    setResults(testResults);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-blue-900">
              🔬 Link System Test Suite
            </CardTitle>
            <CardDescription className="text-lg">
              Comprehensive end-to-end testing of link validation, repair, and routing
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Test Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Test 1: URL Validation
              </CardTitle>
              <CardDescription>
                Validate format of Amazon, Temu, and AliExpress URLs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testUrlValidation} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Run Format Validation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Test 2: Auto-Repair
              </CardTitle>
              <CardDescription>
                Test automatic link repair and replacement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input 
                placeholder="Campaign ID (optional)"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
              />
              <Button onClick={testAutoRepair} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Run Auto-Repair
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Test 3: Health Dashboard
              </CardTitle>
              <CardDescription>
                Get comprehensive health metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testHealthDashboard} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Get Health Status
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="w-5 h-5" />
                Test 4: Smart Router
              </CardTitle>
              <CardDescription>
                Test redirect and fallback logic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testSmartRouter} disabled={loading} className="w-full">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Test Smart Routing
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Display */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.map((result, idx) => (
                <div key={idx} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.valid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-mono text-sm truncate max-w-md">
                        {result.url || result.slug}
                      </span>
                    </div>
                    <Badge variant={result.valid ? "default" : "destructive"}>
                      {result.network}
                    </Badge>
                  </div>
                  
                  {result.productId && (
                    <p className="text-sm text-muted-foreground">
                      Product ID: <code className="bg-muted px-1 rounded">{result.productId}</code>
                    </p>
                  )}
                  
                  {result.confidence && (
                    <Badge variant={result.confidence === "high" ? "default" : "secondary"}>
                      Confidence: {result.confidence}
                    </Badge>
                  )}
                  
                  {result.reason && (
                    <p className="text-sm text-red-600">Reason: {result.reason}</p>
                  )}
                  
                  {result.redirect_url && (
                    <p className="text-sm text-green-600">
                      Redirect: {result.redirect_url}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Repair Results */}
        {repairResults && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-900">Auto-Repair Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{repairResults.totalChecked}</p>
                  <p className="text-sm text-muted-foreground">Total Checked</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{repairResults.duplicatesRemoved}</p>
                  <p className="text-sm text-muted-foreground">Duplicates</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{repairResults.invalidRemoved}</p>
                  <p className="text-sm text-muted-foreground">Invalid</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{repairResults.repaired}</p>
                  <p className="text-sm text-muted-foreground">Repaired</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{repairResults.replaced}</p>
                  <p className="text-sm text-muted-foreground">Replaced</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <Badge variant={repairResults.success ? "default" : "destructive"} className="text-lg px-4 py-2">
                    {repairResults.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Dashboard */}
        {healthDashboard && (
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-900">Health Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{healthDashboard.healthScore}%</p>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold">{healthDashboard.totalLinks}</p>
                  <p className="text-sm text-muted-foreground">Total Links</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{healthDashboard.validLinks}</p>
                  <p className="text-sm text-muted-foreground">Valid</p>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{healthDashboard.invalidLinks}</p>
                  <p className="text-sm text-muted-foreground">Invalid</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-blue-900">By Network:</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(healthDashboard.byNetwork || {}).map(([network, stats]: [string, any]) => (
                    <div key={network} className="bg-white rounded-lg p-4">
                      <p className="font-semibold capitalize">{network}</p>
                      <p className="text-sm text-muted-foreground">
                        {stats.valid} / {stats.total} valid
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${stats.total > 0 ? (stats.valid / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test URLs Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Test URLs Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(testUrls).map(([network, urls]) => (
                <div key={network} className="space-y-2">
                  <h3 className="font-semibold capitalize flex items-center gap-2">
                    <Badge>{network}</Badge>
                  </h3>
                  <ul className="space-y-1">
                    {urls.map((url, idx) => (
                      <li key={idx} className="text-sm font-mono text-muted-foreground truncate">
                        {url}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}