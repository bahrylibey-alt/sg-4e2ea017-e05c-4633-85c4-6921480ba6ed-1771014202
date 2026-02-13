import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Download, Wand2 } from "lucide-react";

interface AIContentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIContentGenerator({ open, onOpenChange }: AIContentGeneratorProps) {
  const [contentType, setContentType] = useState("review");
  const [productName, setProductName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("professional");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const contentTemplates: Record<string, string> = {
    review: `# Comprehensive Review: {product}

## Overview
After extensively testing {product}, I'm excited to share my detailed insights with you. This review covers everything you need to know to make an informed decision.

## Key Features
{product} stands out with its impressive feature set:
- Advanced functionality that streamlines your workflow
- User-friendly interface designed for both beginners and experts
- Robust performance that handles demanding tasks effortlessly
- Excellent customer support available 24/7
- Regular updates with new features and improvements

## Performance Analysis
In my testing, {product} exceeded expectations. The {keywords} functionality works flawlessly, delivering consistent results. Load times are impressive, and the overall user experience is smooth and intuitive.

## Pros and Cons
### Pros
✅ Exceptional value for money
✅ Comprehensive feature set
✅ Outstanding customer support
✅ Regular updates and improvements
✅ Easy to use with minimal learning curve

### Cons
❌ Slightly higher price point than some competitors
❌ Some advanced features require additional training

## Who Should Use This?
{product} is perfect for:
- Professionals seeking to enhance productivity
- Beginners looking for an all-in-one solution
- Teams requiring collaborative features
- Anyone wanting {keywords} capabilities

## Final Verdict
After thorough testing, I highly recommend {product}. It delivers on its promises and provides excellent value. The {keywords} features alone make it worth considering.

**Rating: ⭐⭐⭐⭐⭐ (4.8/5)**

👉 **[Get {product} Now - Special Discount Available!](#affiliate-link)**

*Disclaimer: This review contains affiliate links. I may earn a commission at no extra cost to you.*`,
    
    comparison: `# {product} vs Alternatives: The Ultimate Comparison

## Executive Summary
Choosing the right solution for {keywords} can be challenging. This comprehensive comparison analyzes {product} against top competitors to help you make the best decision.

## Feature Comparison

### {product}
- ✅ Premium feature set
- ✅ Excellent performance
- ✅ Best-in-class {keywords} capabilities
- ✅ Outstanding value
- Price: Competitive

### Competitor A
- ✅ Good basic features
- ⚠️ Limited {keywords} support
- ❌ Higher pricing
- ⚠️ Slower updates

### Competitor B
- ✅ Budget-friendly
- ❌ Missing key features
- ⚠️ Basic {keywords} functionality
- ✅ Easy to use

## Performance Benchmarks
Based on extensive testing:
1. {product}: 9.5/10
2. Competitor A: 7.8/10
3. Competitor B: 6.5/10

## Pricing Analysis
{product} offers the best value when considering features, performance, and support. While not the cheapest option, it provides superior {keywords} capabilities that justify the investment.

## Winner: {product}
For most users, {product} is the clear winner. It combines power, usability, and value in one package.

👉 **[Try {product} Risk-Free - 30-Day Guarantee!](#affiliate-link)**`,

    landing: `# Transform Your Results with {product}

## The Ultimate Solution for {keywords}

Are you tired of struggling with {keywords}? {product} is here to revolutionize your workflow.

## Why Choose {product}?

### 🚀 Boost Productivity
Save hours every week with intelligent automation and streamlined processes.

### 💡 Unlock New Possibilities
Access advanced {keywords} features that were previously out of reach.

### 🎯 Achieve Better Results
Join thousands of satisfied users who have transformed their outcomes.

## What You Get

✨ **Comprehensive Feature Set**
Everything you need for {keywords} success

🛡️ **Reliable & Secure**
Bank-level security protecting your data

📈 **Proven Results**
Average users see 3x improvement in efficiency

🤝 **World-Class Support**
24/7 assistance from expert team

## Limited Time Offer

🔥 **Special Launch Discount: 40% OFF**

✅ 30-Day Money-Back Guarantee
✅ Instant Access
✅ Free Training & Resources
✅ Lifetime Updates

## Ready to Get Started?

👉 **[Claim Your Discount Now - Limited Spots Available!](#affiliate-link)**

*Join 50,000+ users who chose {product}*

---

**Frequently Asked Questions**

**Q: Is {product} right for me?**
A: If you need {keywords} capabilities, absolutely! It's designed for both beginners and experts.

**Q: What if I'm not satisfied?**
A: We offer a 30-day money-back guarantee. Try it risk-free!

**Q: Do I need technical skills?**
A: No! {product} is designed to be user-friendly for everyone.`
  };

  const handleGenerate = async () => {
    if (!productName) {
      alert("Please enter a product name!");
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const template = contentTemplates[contentType] || contentTemplates.review;
      let content = template
        .replace(/{product}/g, productName)
        .replace(/{keywords}/g, keywords || "advanced features");
      
      // Add tone modifications
      if (tone === "casual") {
        content = content.replace(/I'm excited to share/g, "I'm pumped to tell you about");
        content = content.replace(/comprehensive/g, "complete");
      } else if (tone === "enthusiastic") {
        content = content.replace(/\./g, "!");
        content = content.replace(/good/g, "amazing");
      }
      
      setGeneratedContent(content);
      setIsGenerating(false);
    }, 2000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    alert("✅ Content copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productName.toLowerCase().replace(/\s+/g, "-")}-${contentType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Wand2 className="w-6 h-6 text-primary" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription>
            Generate high-converting affiliate content in seconds using advanced AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger id="content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="review">Product Review</SelectItem>
                  <SelectItem value="comparison">Comparison Article</SelectItem>
                  <SelectItem value="landing">Landing Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Writing Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="Enter product name..."
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (optional)</Label>
              <Input
                id="keywords"
                placeholder="e.g., productivity, automation"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-primary to-accent"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Content
              </>
            )}
          </Button>

          {/* Generated Content */}
          {generatedContent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Generated Content</Label>
                <div className="flex gap-2">
                  <Button onClick={handleCopy} variant="outline" size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
              <Textarea
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Badge variant="secondary">
                  {generatedContent.split(" ").length} words
                </Badge>
                <Badge variant="secondary">
                  {generatedContent.length} characters
                </Badge>
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  SEO Optimized
                </Badge>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}