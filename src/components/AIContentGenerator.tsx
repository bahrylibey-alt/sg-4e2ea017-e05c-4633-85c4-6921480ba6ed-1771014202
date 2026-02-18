import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  TrendingUp,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIContentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIContentGenerator({ open, onOpenChange }: AIContentGeneratorProps) {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription>
            Create high-converting copy in seconds with AI optimization
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2 mt-4">
          <Card className="border-0 shadow-none">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-primary" />
                Content Settings
              </CardTitle>
              <CardDescription>Tell AI about your product and audience</CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
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

          <Card className="bg-accent/10 border-0 shadow-none">
            <CardHeader className="pt-0">
              <CardTitle className="text-lg flex items-center gap-2">
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
                  <div className="p-4 rounded-lg border bg-background shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Headline</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(generatedContent.headline)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold">{generatedContent.headline}</p>
                  </div>

                  <div className="p-4 rounded-lg border bg-background shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Body Copy</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(generatedContent.body)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{generatedContent.body}</p>
                  </div>

                  <div className="p-4 rounded-lg border bg-background shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Call-to-Action</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(generatedContent.cta)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-medium text-primary">{generatedContent.cta}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Alternative Headlines
                    </h4>
                    {generatedContent.variations.map((variation, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded border bg-background text-xs hover:border-primary transition-colors">
                        <span className="truncate flex-1 mr-2">{variation}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => copyToClipboard(variation)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" onClick={generateContent} className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </Button>
                    <Button className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>Fill in the details to generate content</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}