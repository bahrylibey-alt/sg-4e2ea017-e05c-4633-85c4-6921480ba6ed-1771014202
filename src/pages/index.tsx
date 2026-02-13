import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { SmartTools } from "@/components/SmartTools";
import { ProductShowcase } from "@/components/ProductShowcase";
import { Analytics } from "@/components/Analytics";
import { Integrations } from "@/components/Integrations";
import { Pricing } from "@/components/Pricing";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { AIChatbot } from "@/components/AIChatbot";
import { AIContentGenerator } from "@/components/AIContentGenerator";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { Button } from "@/components/ui/button";
import { Wand2, Rocket } from "lucide-react";

export default function Home() {
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);

  return (
    <>
      <SEO 
        title="AffiliatePro - AI-Powered Affiliate Marketing Automation"
        description="Build your affiliate empire on autopilot. Smart automation, AI content generation, and advanced analytics to maximize your commissions."
        image="/og-image.png"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <SmartTools 
            onOpenContentGenerator={() => setShowContentGenerator(true)}
            onOpenCampaignBuilder={() => setShowCampaignBuilder(true)}
          />
          <ProductShowcase />
          <Analytics />
          <Integrations />
          <Pricing />
          <Newsletter />
        </main>
        <Footer />
        
        {/* Floating Action Buttons */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
          <Button
            onClick={() => setShowCampaignBuilder(true)}
            size="lg"
            className="rounded-full shadow-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:scale-110 transition-transform gap-2"
          >
            <Rocket className="w-5 h-5" />
            <span className="hidden sm:inline">Campaign</span>
          </Button>
          
          <Button
            onClick={() => setShowContentGenerator(true)}
            size="lg"
            className="rounded-full shadow-2xl bg-gradient-to-r from-accent to-primary hover:scale-110 transition-transform gap-2"
          >
            <Wand2 className="w-5 h-5" />
            <span className="hidden sm:inline">AI Content</span>
          </Button>
        </div>

        {/* AI Features */}
        <AIChatbot />
        <AIContentGenerator 
          open={showContentGenerator} 
          onOpenChange={setShowContentGenerator}
        />
        <CampaignBuilder
          open={showCampaignBuilder}
          onOpenChange={setShowCampaignBuilder}
        />
      </div>
    </>
  );
}