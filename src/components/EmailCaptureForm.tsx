import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function EmailCaptureForm({ 
  title = "Get Exclusive Deals",
  description = "Join our email list for special offers and discounts",
  buttonText = "Subscribe",
  source = "homepage"
}: {
  title?: string;
  description?: string;
  buttonText?: string;
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const { error } = await supabase
        .from("email_subscribers")
        .insert({
          email,
          name: name || null,
          source,
          subscribed_at: new Date().toISOString(),
          status: "active"
        });

      if (error) {
        if (error.code === "23505") {
          setStatus("error");
          setMessage("This email is already subscribed!");
        } else {
          throw error;
        }
      } else {
        setStatus("success");
        setMessage("✅ Success! Check your email for your first deal.");
        setEmail("");
        setName("");
      }
    } catch (err) {
      console.error("Email capture error:", err);
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <Card className="border-2 border-green-500">
        <CardContent className="pt-6 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-bold mb-2">You're Subscribed!</h3>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={status === "loading"}
            />
          </div>
          <div>
            <Input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
            />
          </div>
          
          {status === "error" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{message}</p>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={status === "loading"}
          >
            {status === "loading" ? "Subscribing..." : buttonText}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Unsubscribe anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}