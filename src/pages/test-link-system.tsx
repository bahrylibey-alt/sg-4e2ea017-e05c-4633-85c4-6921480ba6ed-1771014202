import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TestLinkSystem() {
  const { toast } = useToast();
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error loading links:', error);
      toast({
        title: "Error",
        description: "Failed to load links",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const testLink = (link: any) => {
    const url = link.cloaked_url || `/go/${link.slug}`;
    window.open(url, '_blank');
    toast({
      title: "Testing Link",
      description: `Opening ${link.product_name}`
    });
  };

  const copyLink = (link: any) => {
    const url = `${window.location.origin}${link.cloaked_url || `/go/${link.slug}`}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Test Link System</h1>
          <p className="text-muted-foreground">
            Test all your affiliate links and verify redirects work
          </p>
        </div>

        <div className="grid gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/10">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {links.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Links</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/10">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {links.filter(l => l.network === 'Temu').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Temu Links</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/10">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {links.filter(l => l.network === 'Amazon').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Amazon Links</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{link.product_name}</h3>
                      <Badge variant={link.network === 'Temu' ? 'default' : 'secondary'}>
                        {link.network}
                      </Badge>
                      {link.is_working && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Working
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Slug:</span>
                        <code className="bg-muted px-2 py-1 rounded">/go/{link.slug}</code>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Commission:</span>
                        <span>{link.commission_rate}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Clicks:</span>
                        <span>{link.clicks || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyLink(link)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => testLink(link)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Test Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {links.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
              <h3 className="text-xl font-semibold mb-2">No Links Found</h3>
              <p className="text-muted-foreground mb-4">
                No affiliate links in the database. Create some first!
              </p>
              <Button onClick={() => window.location.href = '/dashboard'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}