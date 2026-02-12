import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Sparkles } from "lucide-react";

export function Newsletter() {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10">
      <div className="container">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-border rounded-3xl p-8 md:p-12 lg:p-16 shadow-2xl relative overflow-hidden">
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl -z-10" />

            <div className="relative z-10 text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>

              {/* Heading */}
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  Get Affiliate Marketing Tips & Updates
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Join 50,000+ affiliates getting weekly insights on automation strategies, 
                  profitable products, and conversion optimization tactics.
                </p>
              </div>

              {/* Form */}
              <form className="max-w-md mx-auto space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-1 h-12 px-6 text-base"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="lg" 
                    className="bg-primary hover:bg-primary/90 h-12 px-8 font-semibold whitespace-nowrap"
                  >
                    Get Started Free
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Free tools & resources. No credit card required. Unsubscribe anytime.
                </p>
              </form>

              {/* Social proof */}
              <div className="flex items-center justify-center gap-2 pt-6">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent border-2 border-background"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground ml-2">
                  <span className="font-semibold text-foreground">3,247</span> affiliates joined this week
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}