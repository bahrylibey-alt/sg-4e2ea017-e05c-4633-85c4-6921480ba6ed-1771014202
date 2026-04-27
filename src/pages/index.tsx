import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { ProductShowcase } from "@/components/ProductShowcase";
import { FeaturedContent } from "@/components/FeaturedContent";
import { Pricing } from "@/components/Pricing";
import { Newsletter } from "@/components/Newsletter";
import { SEO } from "@/components/SEO";
import { SimplifiedAuthModal } from "@/components/SimplifiedAuthModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedStatsService } from "@/services/unifiedStatsService";
import { 
  Zap, 
  TrendingUp, 
  Target, 
  BarChart3, 
  Clock, 
  Shield,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  Eye,
  MousePointerClick,
  DollarSign
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    articles: 0,
    posts: 0,
    clicks: 0,
    views: 0,
    conversions: 0,
    revenue: 0
  });

  useEffect(() => {
    checkUser();
    loadStats();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const loadStats = async () => {
    try {
      const realStats = await UnifiedStatsService.getStats();
      setStats(realStats);
    } catch (error) {
      console.error("Error loading stats:", error);
      // Page still loads even if stats fail
    }
  };

  const handleGetStarted = () => {
    if (user) {
      router.push('/autopilot-center');
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6 mb-12">
              <Badge className="text-lg px-4 py-2">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Affiliate Automation
              </Badge>
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Automate Your Affiliate Empire
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Let AI discover products, generate content, and drive traffic 24/7. 
                Your autonomous affiliate marketing system is ready.
              </p>
              <div className="flex gap-4 justify-center pt-4">
                <Button size="lg" onClick={handleGetStarted} className="gap-2">
                  <Play className="h-5 w-5" />
                  Get Started Free
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push('/autopilot-center')}>
                  <Zap className="h-5 w-5 mr-2" />
                  View Demo
                </Button>
              </div>
            </div>

            {/* Live Stats */}
            {stats.products > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <Card className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">{stats.products}</div>
                  <div className="text-sm text-muted-foreground">Products Tracked</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-500">{stats.articles}</div>
                  <div className="text-sm text-muted-foreground">Articles Generated</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-500">{stats.clicks}</div>
                  <div className="text-sm text-muted-foreground">Clicks Tracked</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-500">${stats.revenue.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Revenue Generated</div>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* Rest of homepage content */}
        <Hero />
        <ProductShowcase />
        <FeaturedContent />
        <Pricing />
        <Newsletter />
        <Footer />
      </div>

      {/* Auth Modal */}
      <SimplifiedAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}