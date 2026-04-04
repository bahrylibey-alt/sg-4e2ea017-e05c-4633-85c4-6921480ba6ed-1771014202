import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

interface LinkTest {
  id: string;
  product_name: string;
  slug: string;
  original_url: string;
  cloaked_url: string;
  status: "testing" | "working" | "broken" | "unknown";
  error?: string;
}

export default function TestLinks() {
  const [links, setLinks] = useState<LinkTest[]>([]);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    const { data } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("status", "active")
      .order("product_name");

    if (data) {
      setLinks(data.map(link => ({
        id: link.id,
        product_name: link.product_name,
        slug: link.slug,
        original_url: link.original_url,
        cloaked_url: link.cloaked_url,
        status: "unknown"
      })));
    }
  };

  const testLink = async (link: LinkTest): Promise<LinkTest> => {
    try {
      // Test if the cloaked URL exists
      const response = await fetch(`/go/${link.slug}`, { method: "HEAD" });
      
      if (response.ok || response.status === 302) {
        return { ...link, status: "working" };
      } else {
        return { ...link, status: "broken", error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { ...link, status: "broken", error: String(error) };
    }
  };

  const testAllLinks = async () => {
    setTesting(true);
    setProgress(0);

    const total = links.length;
    const tested: LinkTest[] = [];

    for (let i = 0; i < links.length; i++) {
      const result = await testLink(links[i]);
      tested.push(result);
      setProgress(((i + 1) / total) * 100);
      setLinks([...tested, ...links.slice(i + 1)]);
    }

    setTesting(false);
  };

  const autoFixBroken = async () => {
    const brokenLinks = links.filter(l => l.status === "broken");
    
    for (const link of brokenLinks) {
      // Mark as paused in database
      await supabase
        .from("affiliate_links")
        .update({ status: "paused" })
        .eq("id", link.id);
    }

    await loadLinks();
  };

  const workingCount = links.filter(l => l.status === "working").length;
  const brokenCount = links.filter(l => l.status === "broken").length;
  const unknownCount = links.filter(l => l.status === "unknown").length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🔗 Link Testing Suite</h1>
          <p className="text-muted-foreground">
            Test all affiliate links to ensure they work correctly
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{links.length}</div>
              <div className="text-sm text-muted-foreground">Total Links</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{workingCount}</div>
              <div className="text-sm text-muted-foreground">Working</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{brokenCount}</div>
              <div className="text-sm text-muted-foreground">Broken</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-600">{unknownCount}</div>
              <div className="text-sm text-muted-foreground">Untested</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={testAllLinks} 
                disabled={testing}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Testing... {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Test All Links
                  </>
                )}
              </Button>
              
              {brokenCount > 0 && (
                <Button 
                  onClick={autoFixBroken}
                  variant="destructive"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Auto-Fix Broken ({brokenCount})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Links List */}
        <Card>
          <CardHeader>
            <CardTitle>All Affiliate Links</CardTitle>
            <CardDescription>
              Click "Test All Links" to verify each link works correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {links.map((link) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{link.product_name}</h3>
                      {link.status === "working" && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Working
                        </Badge>
                      )}
                      {link.status === "broken" && (
                        <Badge variant="outline" className="text-red-600 border-red-600">
                          <XCircle className="mr-1 h-3 w-3" />
                          Broken
                        </Badge>
                      )}
                      {link.status === "testing" && (
                        <Badge variant="outline" className="text-blue-600 border-blue-600">
                          <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                          Testing...
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">/go/{link.slug}</span>
                        <span>→</span>
                        <span className="truncate max-w-md">{link.original_url}</span>
                      </div>
                      {link.error && (
                        <div className="text-red-600 mt-1">Error: {link.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/go/${link.slug}`, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {links.length === 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No affiliate links found. Create some links in the dashboard first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}