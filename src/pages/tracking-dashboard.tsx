import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { realAutopilotEngine } from "@/services/realAutopilotEngine";
import { 
  Eye,
  MousePointerClick,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Calendar,
  BarChart3,
  AlertCircle
} from "lucide-react";

export default function TrackingDashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    links: 0,
    content: 0,
    posts: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('24h');

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load stats and activity
  useEffect(() => {
    if (!mounted) return;
    
    const loadData = () => {
      const currentStats = realAutopilotEngine.getStats();
      setStats(currentStats);
      
      const allData = realAutopilotEngine.getAllData();
      setRecentActivity(allData.logs || []);
    };
    
    loadData();
    
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [mounted]);

  // Calculate CTR (Click-Through Rate)
  const calculateCTR = () => {
    if (stats.links === 0) return '0.00';
    return ((stats.clicks / stats.links) * 100).toFixed(2);
  };

  // Calculate conversion rate
  const calculateConversionRate = () => {
    if (stats.clicks === 0) return '0.00';
    return ((stats.conversions / stats.clicks) * 100).toFixed(2);
  };

  // Don't render dynamic content during SSR
  if (!mounted) {
    return (
      <>
        <SEO 
          title="Real-Time Tracking Dashboard"
          description="Live tracking events from your affiliate campaigns"
        />
        
        <div className="min-h-screen bg-background">
          <Header />
          
          <main className="max-w-7xl mx-auto px-4 py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Loading tracking data...</p>
            </div>
          </main>
          
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Real-Time Tracking Dashboard"
        description="Live tracking events from your affiliate campaigns"
      />
      
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                Real-Time Tracking Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Live tracking events from your affiliate campaigns
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Last 24 Hours
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="font-semibold text-blue-800 dark:text-blue-200">
                  How Tracking Works
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Views:</strong> Users visit your content pages with affiliate links</li>
                  <li>• <strong>Clicks:</strong> Users click your affiliate links (tracked via /go/... redirects)</li>
                  <li>• <strong>Conversions:</strong> Users complete purchases (tracked via affiliate network postbacks)</li>
                  <li>• <strong>Revenue:</strong> Commission earned from successful conversions</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Main Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Views */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.links}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.links} affiliate links created
                </p>
              </div>
            </Card>

            {/* Total Clicks */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <MousePointerClick className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.clicks}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculateCTR()}% CTR
                </p>
              </div>
            </Card>

            {/* Conversions */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Conversions</p>
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-4xl font-bold">{stats.conversions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {calculateConversionRate()}% conversion rate
                </p>
              </div>
            </Card>

            {/* Revenue */}
            <Card className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-4xl font-bold">${stats.revenue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Commission earned
                </p>
              </div>
            </Card>
          </div>

          {/* Content Performance */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Content Performance</h2>
              <p className="text-sm text-muted-foreground">
                Your AI-generated content and affiliate link statistics
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Products</p>
                  <Badge>{stats.products}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.products}</p>
                <p className="text-xs text-muted-foreground">AI-discovered products</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Articles</p>
                  <Badge>{stats.content}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.content}</p>
                <p className="text-xs text-muted-foreground">AI-written articles</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Social Posts</p>
                  <Badge>{stats.posts}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-xs text-muted-foreground">Social media posts</p>
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">
                Latest autopilot actions and system events
              </p>
            </div>

            {recentActivity.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No activity yet. Run autopilot to start generating content!
                </p>
                <Button
                  onClick={() => window.location.href = '/'}
                  className="mt-4"
                >
                  Go to Command Center
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((log: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      log.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{log.action}</p>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => window.location.href = '/'}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Command Center
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          </Card>

          {/* Help Section */}
          <Card className="p-6 bg-muted/50">
            <h3 className="font-semibold mb-3">How to Increase Your Tracking Numbers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Run autopilot daily to generate new products and content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Share your AI-generated articles on Reddit, Pinterest, and social media</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Include affiliate links in your content naturally (AI does this automatically)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">4.</span>
                <span>Track clicks by sharing /go/... cloaked links instead of direct URLs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">5.</span>
                <span>Conversions track automatically when users purchase via your affiliate links</span>
              </li>
            </ul>
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
}