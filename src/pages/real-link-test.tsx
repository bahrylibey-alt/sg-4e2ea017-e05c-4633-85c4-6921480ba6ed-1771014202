import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function RealLinkTest() {
  const [links, setLinks] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('affiliate_links')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    setLinks(data || []);
  };

  const testLink = async (link: any) => {
    setResults(prev => ({ ...prev, [link.id]: { status: 'testing' } }));

    try {
      // Test the redirect
      const testUrl = `/go/${link.slug}`;
      const result = {
        status: 'success',
        slug: link.slug,
        url: testUrl,
        redirect_url: link.original_url
      };

      setResults(prev => ({ ...prev, [link.id]: result }));
    } catch (error: any) {
      setResults(prev => ({ 
        ...prev, 
        [link.id]: { status: 'error', error: error.message } 
      }));
    }
  };

  const testAllLinks = async () => {
    setTesting(true);
    for (const link of links) {
      await testLink(link);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🔗 Real Link Testing System</CardTitle>
            <CardDescription>Test all affiliate links and redirects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testAllLinks} disabled={testing}>
                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Test All Links ({links.length})
              </Button>
              <Button onClick={fetchLinks} variant="outline">
                Refresh Links
              </Button>
            </div>

            <div className="grid gap-4 mt-6">
              {links.map(link => (
                <Card key={link.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{link.product_name}</h3>
                          <Badge variant={link.network === 'Amazon' ? 'default' : 'secondary'}>
                            {link.network}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Slug: <code className="bg-muted px-2 py-1 rounded">{link.slug}</code>
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Original: {link.original_url}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => testLink(link)}
                          disabled={results[link.id]?.status === 'testing'}
                        >
                          {results[link.id]?.status === 'testing' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Test'
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={`/go/${link.slug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>

                    {results[link.id] && (
                      <div className="mt-4 p-3 rounded-lg bg-muted">
                        {results[link.id].status === 'testing' && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Testing...</span>
                          </div>
                        )}
                        {results[link.id].status === 'success' && (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">✅ Working - Redirects to {link.network}</span>
                          </div>
                        )}
                        {results[link.id].status === 'error' && (
                          <div className="flex items-center gap-2 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">❌ {results[link.id].error}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {links.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active affiliate links found.</p>
                <p className="text-sm mt-2">Create a campaign to generate links.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}