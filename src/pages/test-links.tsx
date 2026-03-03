import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, RefreshCw, ExternalLink, Loader2, AlertTriangle } from "lucide-react";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { smartLinkRouter } from "@/services/smartLinkRouter";
import Link from "next/link";

interface LinkStatus {
  id: string;
  slug: string;
  productName: string;
  originalUrl: string;
  cloakedUrl: string;
  status: "valid" | "invalid" | "repaired" | "testing";
  repairedUrl?: string;
  error?: string;
}

export default function TestLinksPage() {
  const [links, setLinks] = useState<LinkStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [filter, setFilter] = useState<"all" | "valid" | "invalid" | "repaired">("all");

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    setLoading(true);
    try {
      const { links: userLinks } = await affiliateLinkService.getUserLinks();
      
      const linkStatuses: LinkStatus[] = userLinks.map(link => ({
        id: link.id,
        slug: link.slug,
        productName: link.product_name,
        originalUrl: link.original_url,
        cloakedUrl: link.cloaked_url,
        status: "testing" as const
      }));

      setLinks(linkStatuses);
    } catch (error) {
      console.error("Failed to load links:", error);
    } finally {
      setLoading(false);
    }
  };

  const testAllLinks = async () => {
    setTesting(true);
    
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      
      // Update status to testing
      setLinks(prev => prev.map((l, idx) => 
        idx === i ? { ...l, status: "testing" as const } : l
      ));

      // Test the URL
      const validation = await smartLinkRouter.validateUrl(link.originalUrl);
      
      // Update status based on validation
      setLinks(prev => prev.map((l, idx) => 
        idx === i ? {
          ...l,
          status: validation.valid ? "valid" as const : "invalid" as const,
          error: validation.error
        } : l
      ));

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  const repairAllLinks = async () => {
    setRepairing(true);
    
    // Only repair invalid links
    const invalidLinks = links.filter(l => l.status === "invalid");
    
    for (const link of invalidLinks) {
      try {
        // Get the full link data
        const { links: userLinks } = await affiliateLinkService.getUserLinks();
        const fullLink = userLinks.find(l => l.id === link.id);
        
        if (fullLink) {
          const repairedUrl = await smartLinkRouter.attemptUrlRepair(fullLink);
          
          if (repairedUrl) {
            setLinks(prev => prev.map(l => 
              l.id === link.id ? {
                ...l,
                status: "repaired" as const,
                repairedUrl
              } : l
            ));
          }
        }
      } catch (error) {
        console.error(`Failed to repair link ${link.id}:`, error);
      }
    }

    setRepairing(false);
  };

  const filteredLinks = links.filter(link => {
    if (filter === "all") return true;
    return link.status === filter;
  });

  const stats = {
    total: links.length,
    valid: links.filter(l => l.status === "valid").length,
    invalid: links.filter(l => l.status === "invalid").length,
    repaired: links.filter(l => l.status === "repaired").length
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Affiliate Link Tester</h1>
          <p className="text-muted-foreground mt-2">
            Test and repair your affiliate links to ensure they redirect properly
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
              <p className="text-sm text-muted-foreground">Valid Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats.invalid}</div>
              <p className="text-sm text-muted-foreground">Invalid Links</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.repaired}</div>
              <p className="text-sm text-muted-foreground">Repaired Links</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Test and repair your affiliate links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={testAllLinks} 
                disabled={testing || loading}
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Test All Links
                  </>
                )}
              </Button>
              
              <Button 
                onClick={repairAllLinks} 
                disabled={repairing || stats.invalid === 0}
                variant="secondary"
              >
                {repairing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Repairing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Repair Invalid Links ({stats.invalid})
                  </>
                )}
              </Button>

              <Button onClick={loadLinks} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Links
              </Button>

              <div className="flex gap-2 ml-auto">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={filter === "valid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("valid")}
                >
                  Valid
                </Button>
                <Button
                  variant={filter === "invalid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("invalid")}
                >
                  Invalid
                </Button>
                <Button
                  variant={filter === "repaired" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("repaired")}
                >
                  Repaired
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links List */}
        <Card>
          <CardHeader>
            <CardTitle>Affiliate Links ({filteredLinks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading links...</p>
                </div>
              ) : filteredLinks.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {filter === "all" 
                      ? "No affiliate links found. Create some links first!"
                      : `No ${filter} links found.`}
                  </p>
                  <Link href="/dashboard">
                    <Button className="mt-4">Go to Dashboard</Button>
                  </Link>
                </div>
              ) : (
                filteredLinks.map((link) => (
                  <div
                    key={link.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{link.productName}</h3>
                          {link.status === "valid" && (
                            <Badge className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Valid
                            </Badge>
                          )}
                          {link.status === "invalid" && (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              Invalid
                            </Badge>
                          )}
                          {link.status === "repaired" && (
                            <Badge className="bg-blue-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Repaired
                            </Badge>
                          )}
                          {link.status === "testing" && (
                            <Badge variant="secondary">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Testing
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Slug: {link.slug}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Cloaked URL:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-muted px-2 py-1 rounded text-xs flex-1">
                            {link.cloakedUrl}
                          </code>
                          <a
                            href={link.cloakedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      <div>
                        <span className="font-medium">Destination URL:</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                            {link.originalUrl}
                          </code>
                          <a
                            href={link.originalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      </div>

                      {link.repairedUrl && (
                        <div>
                          <span className="font-medium text-blue-600">Repaired URL:</span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="bg-blue-50 border-blue-200 px-2 py-1 rounded text-xs flex-1 break-all">
                              {link.repairedUrl}
                            </code>
                            <a
                              href={link.repairedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      )}

                      {link.error && (
                        <div className="text-red-600 text-xs">
                          <span className="font-medium">Error:</span> {link.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}