import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, TrendingUp, Radio, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function SimpleDashboard() {
  const [executing, setExecuting] = useState(false);
  const [stats, setStats] = useState({
    postsToday: 0,
    totalProducts: 0,
    totalClicks: 0,
    totalRevenue: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
      if (!profiles || profiles.length === 0) return;
      const userId = profiles[0].id;

      const [systemState, products, clicks, conversions] = await Promise.all([
        supabase.from('system_state').select('posts_today').eq('user_id', userId).maybeSingle(),
        supabase.from('product_catalog').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('click_events').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('conversion_events').select('revenue').eq('user_id', userId)
      ]);

      const revenue = conversions.data?.reduce((sum, c) => sum + (Number(c.revenue) || 0), 0) || 0;

      setStats({
        postsToday: systemState.data?.posts_today || 0,
        totalProducts: products.count || 0,
        totalClicks: clicks.count || 0,
        totalRevenue: revenue
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const executeWorkflow = async () => {
    setExecuting(true);
    try {
      const response = await fetch('/api/simple-execute', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success! 🎉",
          description: data.message,
        });
        await loadStats();
      } else {
        toast({
          title: "Failed",
          description: data.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold">Simple Dashboard</h1>
          <p className="text-xl text-gray-600">One button - Creates posts and drives traffic</p>
          
          <Button
            size="lg"
            onClick={executeWorkflow}
            disabled={executing}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-12 py-8 text-xl"
          >
            {executing ? (
              <>
                <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                Creating Posts...
              </>
            ) : (
              <>
                <Zap className="mr-3 h-6 w-6" />
                Create Posts & Drive Traffic
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Posts Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">{stats.postsToday}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Total Clicks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-purple-600">{stats.totalClicks}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-yellow-600">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>✅ Discovers 2026 trending products from real sources</div>
            <div>✅ Creates posts for Pinterest, TikTok, Instagram, Twitter, Facebook</div>
            <div>✅ Generates affiliate links automatically</div>
            <div>✅ Simulates realistic traffic (views, clicks, conversions)</div>
            <div>✅ Updates metrics in real-time</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}