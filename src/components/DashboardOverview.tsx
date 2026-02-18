import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Link2, 
  Wallet,
  ArrowUpRight,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { affiliateLinkService } from "@/services/affiliateLinkService";
import { commissionService } from "@/services/commissionService";
import { supabase } from "@/integrations/supabase/client";

interface QuickStat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ElementType;
  color: string;
}

export function DashboardOverview() {
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingPayout, setPendingPayout] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuthAndLoadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAuthenticated(false);
          setLoading(false);
          // Show demo data for unauthenticated users
          setStats([
            {
              label: "Total Earnings",
              value: "$0",
              change: "Sign in to start",
              trend: "up",
              icon: DollarSign,
              color: "text-green-500"
            },
            {
              label: "Active Links",
              value: "0",
              change: "Create your first link",
              trend: "up",
              icon: Link2,
              color: "text-blue-500"
            },
            {
              label: "Conversions",
              value: "0",
              change: "Track your sales",
              trend: "up",
              icon: Target,
              color: "text-purple-500"
            },
            {
              label: "Pending Payout",
              value: "$0",
              change: "Build your balance",
              trend: "up",
              icon: Wallet,
              color: "text-orange-500"
            }
          ]);
          return;
        }

        setIsAuthenticated(true);

        // Fetch real data from database
        const [linksResult, commissionsResult, statsResult] = await Promise.all([
          affiliateLinkService.getUserLinks(),
          commissionService.getUserCommissions(),
          commissionService.getCommissionStats()
        ]);

        if (linksResult.error || commissionsResult.error || statsResult.error) {
          console.error("Error loading data:", {
            links: linksResult.error,
            commissions: commissionsResult.error,
            stats: statsResult.error
          });
        }

        const links = linksResult.links || [];
        const commissions = commissionsResult.commissions || [];
        const commissionStats = statsResult;

        // Calculate real metrics
        const activeLinks = links.filter(l => l.status === "active").length;
        const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
        const totalConversions = links.reduce((sum, link) => sum + (link.conversions || 0), 0);
        const totalRevenue = commissionStats.total_earnings;
        const pendingAmount = commissionStats.total_approved + commissionStats.total_pending;

        setTotalEarnings(totalRevenue);
        setPendingPayout(pendingAmount);

        setStats([
          {
            label: "Total Earnings",
            value: `$${totalRevenue.toFixed(2)}`,
            change: `$${commissionStats.this_month.toFixed(2)} this month`,
            trend: "up",
            icon: DollarSign,
            color: "text-green-500"
          },
          {
            label: "Active Links",
            value: activeLinks.toString(),
            change: `${totalClicks} total clicks`,
            trend: "up",
            icon: Link2,
            color: "text-blue-500"
          },
          {
            label: "Conversions",
            value: totalConversions.toString(),
            change: `${commissions.length} total commissions`,
            trend: "up",
            icon: Target,
            color: "text-purple-500"
          },
          {
            label: "Pending Payout",
            value: `$${pendingAmount.toFixed(2)}`,
            change: "Ready for withdrawal",
            trend: "up",
            icon: Wallet,
            color: "text-orange-500"
          }
        ]);

      } catch (err) {
        console.error("Unexpected error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();

    // Refresh data every 30 seconds
    const interval = setInterval(checkAuthAndLoadData, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted) return null;

  if (loading) {
    return (
      <section className="py-16 px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          <div className="text-center py-12">
            <Activity className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        {/* Authentication Warning */}
        {!isAuthenticated && (
          <Card className="mb-8 border-orange-500/50 bg-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">Sign In to Start Earning</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Create an account to track your affiliate links, monitor commissions, and get paid for your referrals.
                  </p>
                  <Button size="sm" className="gap-2">
                    Get Started Free
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Earnings Breakdown */}
        {isAuthenticated && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* How You Get Paid */}
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-primary" />
                    How You Get Paid
                  </CardTitle>
                  <Badge className="bg-green-500 hover:bg-green-600">
                    Active
                  </Badge>
                </div>
                <CardDescription>Your earnings are tracked in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Total Earned (All Time)</span>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-2xl font-bold text-green-500">${totalEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Lifetime commission earnings</p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Ready to Withdraw</span>
                      <Wallet className="w-5 h-5 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-500">${pendingPayout.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: $50</p>
                  </div>

                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <h4 className="font-semibold text-foreground mb-2">Payout Methods</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• PayPal (instant)</li>
                      <li>• Bank Transfer (2-3 days)</li>
                      <li>• Stripe (instant)</li>
                    </ul>
                  </div>
                </div>

                {pendingPayout >= 50 && (
                  <Button className="w-full mt-4 gap-2">
                    <Wallet className="w-4 h-4" />
                    Request Payout
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  System Status
                </CardTitle>
                <CardDescription>All tracking systems operational</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold text-foreground">Link Tracking</div>
                        <div className="text-sm text-muted-foreground">Real-time click monitoring</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">Live</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold text-foreground">Commission Tracking</div>
                        <div className="text-sm text-muted-foreground">Automatic conversion detection</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">Live</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-semibold text-foreground">Analytics Engine</div>
                        <div className="text-sm text-muted-foreground">Performance insights</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500">Live</Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mt-4">
                    <h4 className="font-semibold text-foreground mb-2">How It Works</h4>
                    <ol className="text-sm text-muted-foreground space-y-2">
                      <li>1. Create short affiliate links</li>
                      <li>2. Share them on social media</li>
                      <li>3. Track clicks & conversions</li>
                      <li>4. Earn commissions automatically</li>
                      <li>5. Withdraw when you reach $50</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Action CTA */}
        {isAuthenticated && (
          <Card className="mt-6 border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    Ready to Create Your First Link?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start earning commissions by creating and sharing affiliate links
                  </p>
                </div>
                <Button className="gap-2">
                  <Link2 className="w-4 h-4" />
                  Create Link
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}