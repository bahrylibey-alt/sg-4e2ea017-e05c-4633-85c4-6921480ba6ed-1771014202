import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, MousePointerClick, Users, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

const initialMetrics = [
  {
    title: "Total Revenue",
    value: "$45,231",
    change: "+20.1%",
    trend: "up",
    icon: DollarSign,
    color: "text-green-500"
  },
  {
    title: "Total Clicks",
    value: "12,482",
    change: "+15.3%",
    trend: "up",
    icon: MousePointerClick,
    color: "text-blue-500"
  },
  {
    title: "Conversions",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: TrendingUp,
    color: "text-purple-500"
  },
  {
    title: "Active Campaigns",
    value: "24",
    change: "-2.4%",
    trend: "down",
    icon: Users,
    color: "text-orange-500"
  }
];

const initialPerformance = [
  { product: "Premium WordPress Theme", clicks: 1247, conversions: 89, revenue: "$2,847", conversion_rate: "7.1%" },
  { product: "SEO Tools Suite", clicks: 892, conversions: 67, revenue: "$4,489", conversion_rate: "7.5%" },
  { product: "Digital Marketing Course", clicks: 2341, conversions: 156, revenue: "$12,324", conversion_rate: "6.7%" },
  { product: "E-commerce Starter Pack", clicks: 654, conversions: 42, revenue: "$2,778", conversion_rate: "6.4%" }
];

export function Analytics() {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [performance, setPerformance] = useState(initialPerformance);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const randomChange = (Math.random() - 0.5) * 2;
        const currentValue = parseInt(metric.value.replace(/[$,]/g, ""));
        const newValue = Math.max(0, currentValue + Math.floor(randomChange * 10));
        
        return {
          ...metric,
          value: metric.title.includes("Revenue") ? `$${newValue.toLocaleString()}` : newValue.toLocaleString()
        };
      }));
      setLastUpdated(new Date());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate API call
    setTimeout(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        change: `${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 20).toFixed(1)}%`
      })));
      
      setPerformance(prev => prev.map(item => ({
        ...item,
        clicks: item.clicks + Math.floor(Math.random() * 50),
        conversions: item.conversions + Math.floor(Math.random() * 5)
      })));
      
      setLastUpdated(new Date());
      setIsRefreshing(false);
      
      alert("✅ Analytics refreshed!\n\nLatest data loaded from all your campaigns and affiliate networks.");
    }, 1500);
  };

  const handleExportData = () => {
    const csvContent = "Product,Clicks,Conversions,Revenue,Conversion Rate\n" +
      performance.map(item => 
        `"${item.product}",${item.clicks},${item.conversions},${item.revenue},${item.conversion_rate}`
      ).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert("📊 Analytics exported!\n\nYour performance data has been downloaded as a CSV file.");
  };

  return (
    <section className="py-24 px-6 bg-background" data-section="analytics">
      <div className="container">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="text-primary border-primary/30">
            Performance Analytics
          </Badge>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
            Track Every <span className="text-primary">Metric</span> That Matters
          </h2>
          <p className="text-lg text-muted-foreground">
            Real-time insights into your affiliate performance with actionable data and advanced reporting
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" className="gap-2">
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
            <Button onClick={handleExportData} variant="outline">
              Export CSV
            </Button>
            <span className="text-sm text-muted-foreground">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Metrics grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <metric.icon className={`w-5 h-5 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{metric.value}</div>
                <div className="flex items-center gap-1 mt-2">
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-green-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-medium ${metric.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                    {metric.change}
                  </span>
                  <span className="text-sm text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Top Performing Products</CardTitle>
            <CardDescription>Your best converting affiliate products this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Product</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Clicks</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Conversions</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Revenue</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((item, index) => (
                    <tr key={index} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">{item.product}</td>
                      <td className="py-4 px-4 text-right text-muted-foreground">{item.clicks}</td>
                      <td className="py-4 px-4 text-right text-muted-foreground">{item.conversions}</td>
                      <td className="py-4 px-4 text-right font-semibold text-green-500">{item.revenue}</td>
                      <td className="py-4 px-4 text-right">
                        <Badge variant="secondary">{item.conversion_rate}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}