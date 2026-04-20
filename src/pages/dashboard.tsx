import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { AutopilotDashboard } from "@/components/AutopilotDashboard";
import { DashboardOverview } from "@/components/DashboardOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/AuthModal";

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setIsAuthenticated(true);
        setShowAuthModal(false);
      } else {
        setIsAuthenticated(false);
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);
      setShowAuthModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowAuthModal(false);
    checkAuth();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Dashboard - AffiliatePro"
        description="Manage your affiliate marketing campaigns with AI-powered automation"
      />
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          open={showAuthModal} 
          onOpenChange={(open) => setShowAuthModal(open)}
          onSuccess={handleAuthSuccess}
        />
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Tabs defaultValue="autopilot" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="autopilot">AI Autopilot</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="autopilot" className="space-y-6">
              <AutopilotDashboard />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  );
}