import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  Copy, 
  Download,
  RefreshCw,
  Wand2,
  FileText,
  Mail,
  MessageSquare,
  Target,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AIContentGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [contentType, setContentType] = useState<"ad-copy" | "email" | "social" | "product">("ad-copy");
  const [input, setInput] = useState({
    productName: "",
    targetAudience: "",
    keyFeatures: "",
    tone: "professional"
  });
  const [generatedContent, setGeneratedContent] = useState<{
    headline: string;
    body: string;
    cta: string;
    variations: string[];
  } | null>(null);

  const generateContent = async () => {
    if (!input.productName) {
      toast({
        title: "Missing Information",
        description: "Please enter a product name",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Simulate AI content generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const content = {
        headline: generateHeadline(),
        body: generateBody(),
        cta: generateCTA(),
        variations: [
          generateHeadline(),
          generateHeadline(),
          generateHeadline()
        ]
      };

      setGeneratedContent(content);
      toast({
        title: "Content Generated!",
        description: "AI has created optimized content for your campaign"
      });
    } catch (err) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateHeadline = () => {
    const headlines = [
      `Transform Your Life with ${input.productName}`,
      `Discover the Power of ${input.productName} Today`,
      `${input.productName}: The Solution You've Been Waiting For`,
      `Unlock Your Potential with ${input.productName}`,
      `Experience the Difference: ${input.productName}`
    ];
    return headlines[Math.floor(Math.random() * headlines.length)];
  };

  const generateBody = () => {
    return `Introducing ${input.productName} - the revolutionary solution designed specifically for ${input.targetAudience}. ${input.keyFeatures || "With cutting-edge features and proven results"}, you'll experience immediate impact and long-term success. Join thousands of satisfied customers who have already transformed their lives.`;
  };

  const generateCTA = () => {
    const ctas = [
      "Get Started Now",
      "Claim Your Offer Today",
      "Start Your Free Trial",
      "Join Thousands of Happy Customers",
      "Unlock Your Success"
    ];
    return ctas[Math.floor(Math.random() * ctas.length)];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard"
    });
  };

  return (
    <div className="container py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">AI Content Generator</h2>
        <p className="text-muted-foreground">Create high-converting copy in seconds with AI</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Content Settings
            </CardTitle>
            <CardDescription>Tell AI about your product and audience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="ad-copy">Ad Copy</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="social">Social</TabsTrigger>
                <TabsTrigger value="product">Product</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="productName">Product/Offer Name *</Label>
              <Input
                id="productName"
                placeholder="e.g., Premium Fitness Program"
                value={input.productName}
                onChange={(e) => setInput({ ...input, productName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <Input
                id="targetAudience"
                placeholder="e.g., busy professionals aged 25-45"
                value={input.targetAudience}
                onChange={(e) => setInput({ ...input, targetAudience: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyFeatures">Key Features/Benefits</Label>
              <Textarea
                id="keyFeatures"
                placeholder="e.g., 30-minute workouts, no equipment needed, proven results"
                value={input.keyFeatures}
                onChange={(e) => setInput({ ...input, keyFeatures: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone of Voice</Label>
              <select
                id="tone"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={input.tone}
                onChange={(e) => setInput({ ...input, tone: e.target.value })}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual & Friendly</option>
                <option value="urgent">Urgent & Compelling</option>
                <option value="luxury">Luxury & Premium</option>
                <option value="playful">Playful & Fun</option>
              </select>
            </div>

            <Button 
              onClick={generateContent} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Content
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generated Content
            </CardTitle>
            <CardDescription>
              {generatedContent ? "AI-optimized copy ready to use" : "Your content will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg border bg-accent/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>Headline</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.headline)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-semibold text-lg">{generatedContent.headline}</p>
                </div>

                <div className="p-4 rounded-lg border bg-accent/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>Body Copy</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.body)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm">{generatedContent.body}</p>
                </div>

                <div className="p-4 rounded-lg border bg-accent/50">
                  <div className="flex items-center justify-between mb-2">
                    <Badge>Call-to-Action</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(generatedContent.cta)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-medium">{generatedContent.cta}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Alternative Headlines
                  </h4>
                  {generatedContent.variations.map((variation, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                      <span className="text-sm">{variation}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(variation)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={generateContent} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                  <Button className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export All
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Generate content to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            AI Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-semibold mb-2">Headlines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use power words</li>
                <li>• Include numbers</li>
                <li>• Create urgency</li>
                <li>• Promise benefits</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-semibold mb-2">Body Copy</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Focus on benefits</li>
                <li>• Use social proof</li>
                <li>• Address pain points</li>
                <li>• Keep it scannable</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-background border">
              <h4 className="font-semibold mb-2">CTAs</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Action-oriented</li>
                <li>• Create FOMO</li>
                <li>• Clear value</li>
                <li>• Low friction</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}