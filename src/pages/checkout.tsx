import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, CreditCard, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import Script from "next/script";

const planDetails: Record<string, { name: string; price: string; priceValue: number; features: string[] }> = {
  starter: {
    name: "Starter",
    price: "$29",
    priceValue: 29,
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
  professional: {
    name: "Professional",
    price: "$79",
    priceValue: 79,
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
  enterprise: {
    name: "Enterprise",
    price: "$199",
    priceValue: 199,
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
};

export default function Checkout() {
  const router = useRouter();
  const { plan } = router.query;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [stripeKey, setStripeKey] = useState<string>("");
  const [cardholderName, setCardholderName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    checkAuth();
    loadStripeKey();
  }, []);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    setIsAuthenticated(!!session);
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
    setLoading(false);

    if (!session) {
      router.push("/?auth=signup");
    }
  };

  const loadStripeKey = async () => {
    // Get Stripe publishable key from integrations
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return;

    const { data: integration } = await supabase
      .from("integrations")
      .select("config")
      .eq("user_id", session.session.user.id)
      .eq("provider", "stripe")
      .eq("status", "connected")
      .single();

    if ((integration?.config as any)?.publishable_key) {
      setStripeKey((integration.config as any).publishable_key);
    }
  };

  const selectedPlan = plan ? planDetails[plan as string] : null;

  const handleCheckout = async () => {
    if (!selectedPlan || !stripeKey) {
      alert("Stripe integration not configured. Please contact support.");
      return;
    }

    setProcessing(true);

    try {
      // In production, you would:
      // 1. Create Stripe Checkout Session via API
      // 2. Redirect to Stripe hosted checkout page
      // 3. Handle webhook for successful payment
      // 4. Activate subscription

      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create subscription record in database
      const { data: session } = await supabase.auth.getSession();
      if (session?.session?.user?.id) {
        await supabase.from("subscriptions" as any).insert({
          user_id: session.session.user.id,
          plan: plan as string,
          status: "active",
          amount: selectedPlan.priceValue,
          currency: "usd",
          billing_cycle: "monthly"
        } as any);

        // Send webhook to Zapier
        const { data: zapierIntegration } = await supabase
          .from("integrations")
          .select("config")
          .eq("provider", "zapier")
          .eq("status", "connected")
          .single();

        if ((zapierIntegration?.config as any)?.webhook_url) {
          await fetch((zapierIntegration.config as any).webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event: "subscription.created",
              user_email: email,
              plan: selectedPlan.name,
              amount: selectedPlan.priceValue
            })
          });
        }
      }

      alert(`✅ Payment successful! Welcome to ${selectedPlan.name} plan!\n\nYou can now access all premium features.`);
      router.push("/dashboard");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again or contact support.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-24 text-center">
          <h1 className="text-3xl font-bold mb-4">Plan not found</h1>
          <Button onClick={() => router.push("/#pricing")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Pricing
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <SEO title={`Checkout - ${selectedPlan.name} Plan`} />
      
      {/* Load Stripe.js */}
      {stripeKey && (
        <Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-12 max-w-5xl">
          <Button variant="ghost" onClick={() => router.back()} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div>
              <h1 className="text-3xl font-bold mb-6">Complete Your Order</h1>
              
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedPlan.name} Plan</CardTitle>
                    <Badge className="bg-primary">Selected</Badge>
                  </div>
                  <CardDescription>Monthly subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between text-3xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{selectedPlan.price}/mo</span>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <p className="text-sm font-semibold text-muted-foreground">Included features:</p>
                    <ul className="space-y-2">
                      {selectedPlan.features.slice(0, 5).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                      {selectedPlan.features.length > 5 && (
                        <li className="text-sm text-muted-foreground pl-6">
                          +{selectedPlan.features.length - 5} more features
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>14-day money-back guarantee</strong>
                      <br />
                      Not satisfied? Get a full refund, no questions asked.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    Secure Payment
                  </CardTitle>
                  <CardDescription>Powered by Stripe - Your payment information is encrypted and secure</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!stripeKey ? (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-900 dark:text-yellow-100">
                        <strong>Stripe Integration Required</strong>
                        <br />
                        Please connect Stripe in Settings → Integrations to enable payments.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => router.push("/settings?tab=integrations")}
                      >
                        Go to Integrations
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input 
                            id="cardName" 
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            placeholder="John Doe"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Card Information</Label>
                          <div id="card-element" className="p-3 border rounded-lg bg-background">
                            {/* Stripe Card Element will be mounted here in production */}
                            <div className="text-sm text-muted-foreground">
                              Card details powered by Stripe
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <CreditCard className="w-6 h-6 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">Payment Methods</p>
                            <p className="text-sm text-muted-foreground">Credit Card, Debit Card</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-sm font-medium">Accepted Cards:</p>
                          <div className="flex gap-2">
                            <Badge variant="outline">Visa</Badge>
                            <Badge variant="outline">Mastercard</Badge>
                            <Badge variant="outline">Amex</Badge>
                            <Badge variant="outline">Discover</Badge>
                          </div>
                        </div>
                      </div>

                      <Button 
                        size="lg" 
                        className="w-full bg-primary hover:bg-primary/90"
                        onClick={handleCheckout}
                        disabled={processing || !cardholderName || !email}
                      >
                        {processing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Pay {selectedPlan.price} - Complete Checkout
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                        You will be charged {selectedPlan.price} per month starting today.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}