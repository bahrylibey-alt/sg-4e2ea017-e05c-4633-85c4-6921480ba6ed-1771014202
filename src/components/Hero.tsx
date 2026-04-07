import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, TrendingUp, Shield } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20 lg:py-32">
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <Zap className="mr-1 h-3 w-3" />
            Real Traffic & Real Results
          </Badge>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Turn Affiliate Links Into{" "}
            <span className="text-primary">Passive Income</span>
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
            Track your affiliate links, get traffic from proven sources, and watch your commissions grow. Built for 2026 trending products.
          </p>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2" onClick={() => window.location.href = '/dashboard'}>
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = '/traffic-sources'}>
              See Traffic Sources
            </Button>
          </div>
          
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
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
      </div>
      
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
    </section>
  );
}