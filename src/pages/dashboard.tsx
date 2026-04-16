import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DashboardOverview } from "@/components/DashboardOverview";
import { AutopilotDashboard } from "@/components/AutopilotDashboard";
import { ProfitDashboard } from "@/components/ProfitDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, TrendingUp, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access the dashboard",
          variant: "destructive"
        });
        router.push('/');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Dashboard - AffiliatePro"
        description="Manage your affiliate campaigns and track performance"
      />
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Tabs defaultValue="autopilot" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="autopilot" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                AI Autopilot
              </TabsTrigger>
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="profit" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Profit Intelligence
              </TabsTrigger>
            </TabsList>

            <TabsContent value="autopilot" className="space-y-6">
              <AutopilotDashboard />
            </TabsContent>

            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>

            <TabsContent value="profit" className="space-y-6">
              <ProfitDashboard />
            </TabsContent>
          </Tabs>
        </main>
        <Footer />
      </div>
    </>
  );
}