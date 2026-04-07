import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, TrendingUp, Shield, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Real Traffic Generation - No Fake Promises
        </Badge>
        
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Turn Affiliate Links Into{" "}
          <span className="text-primary">Passive Income</span>
        </h1>
        
        <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
          Track your affiliate links, get traffic from proven sources, and watch your commissions grow. Built for 2026 trending products.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <a href="/traffic-channels">
              <Zap className="w-4 h-4 mr-2" />
              View 8 Traffic Channels
            </a>
          </Button>
          <Button size="lg" variant="outline" onClick={() => window.location.href = '/traffic-sources'}>
            See Traffic Sources
          </Button>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-16">
          <div className="p-6 rounded-xl bg-card border">
            <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-2xl font-bold mb-1">8 Real Channels</h3>
            <p className="text-sm text-muted-foreground">Zapier-powered traffic automation</p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <TrendingUp className="mx-auto mb-3 h-8 w-8 text-primary" />
            <h3 className="mb-2 font-semibold">2026 Trending Products</h3>
            <p className="text-sm text-muted-foreground">
              Pre-loaded with best-selling Amazon & Temu products
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Zap className="mx-auto mb-3 h-8 w-8 text-accent" />
            <h3 className="mb-2 font-semibold">Real Traffic Methods</h3>
            <p className="text-sm text-muted-foreground">
              9 proven strategies: Pinterest, YouTube, SEO, Email & more
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <Shield className="mx-auto mb-3 h-8 w-8 text-green-600" />
            <h3 className="mb-2 font-semibold">Honest System</h3>
            <p className="text-sm text-muted-foreground">
              No fake promises. Real tracking. Real results.
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
    </section>
  );
}