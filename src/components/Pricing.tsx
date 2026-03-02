import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { authService } from "@/services/authService";

const plans = [
  {
    name: "Starter",
    price: "$29",
    description: "Perfect for beginners getting started with affiliate marketing",
    popular: false,
    features: [
      "Up to 5 campaigns",
      "1,000 tracked clicks/month",
      "Basic analytics dashboard",
      "Email support",
      "2 integrations",
      "AI content assistant",
      "Link cloaking"
    ]
  },
  {
    name: "Professional",
    price: "$79",
    description: "For serious affiliates scaling their business",
    popular: true,
    features: [
      "Unlimited campaigns",
      "50,000 tracked clicks/month",
      "Advanced analytics & reports",
      "Priority support",
      "Unlimited integrations",
      "AI content generator",
      "Link cloaking & tracking",
      "A/B testing tools",
      "Custom domain",
      "API access"
    ]
  },
  {
    name: "Enterprise",
    price: "$199",
    description: "For agencies and power users who need everything",
    popular: false,
    features: [
      "Unlimited everything",
      "Unlimited tracked clicks",
      "White-label solution",
      "Dedicated account manager",
      "All integrations",
      "Advanced AI tools",
      "Priority processing",
      "Custom development",
      "Team collaboration",
      "Advanced security",
      "SLA guarantee"
    ]
  }
];

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await authService.getSession();
    setIsAuthenticated(!!session);
  };

  const handleSelectPlan = (planName: string) => {
    setSelectedPlan(planName);
    
    if (!isAuthenticated) {
      // Show auth modal if not logged in
      setAuthModalOpen(true);
    } else {
      // Redirect to checkout page
      setTimeout(() => {
        window.location.href = `/checkout?plan=${planName.toLowerCase()}`;
      }, 500);
    }
  };

  return (
    <>
      <section className="py-24 px-6 bg-background" data-section="pricing">
        <div className="container">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30">
              Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
              Choose Your <span className="text-primary">Perfect Plan</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Start free, scale as you grow. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative ${plan.popular ? "border-primary shadow-2xl shadow-primary/20 scale-105" : "hover:shadow-lg"} transition-all duration-300 ${selectedPlan === plan.name ? "ring-2 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8 pt-6">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-sm mb-4">
                    {plan.description}
                  </CardDescription>
                  <div className="space-y-1">
                    <div className="text-5xl font-bold text-foreground">
                      {plan.price}
                      <span className="text-lg text-muted-foreground font-normal">/month</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button 
                    size="lg" 
                    className={`w-full ${plan.popular ? "bg-primary hover:bg-primary/90" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {selectedPlan === plan.name ? "Selected!" : "Get Started"}
                  </Button>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground">What's included:</p>
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ note */}
          <div className="text-center mt-16">
            <p className="text-muted-foreground">
              All plans include 14-day money-back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </section>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        defaultTab="signup"
        onSuccess={() => {
          setAuthModalOpen(false);
          checkAuth();
          if (selectedPlan) {
            setTimeout(() => {
              window.location.href = `/checkout?plan=${selectedPlan.toLowerCase()}`;
            }, 1000);
          }
        }}
      />
    </>
  );
}