import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedContent } from "@/components/FeaturedContent";
import { DashboardOverview } from "@/components/DashboardOverview";
import { AutopilotDashboard } from "@/components/AutopilotDashboard";
import { CampaignMonitor } from "@/components/CampaignMonitor";
import { SmartTools } from "@/components/SmartTools";
import { QuickCampaignSetup } from "@/components/QuickCampaignSetup";
import { ProductShowcase } from "@/components/ProductShowcase";
import { AIContentGenerator } from "@/components/AIContentGenerator";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { Analytics } from "@/components/Analytics";
import { Integrations } from "@/components/Integrations";
import { Pricing } from "@/components/Pricing";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { AIChatbot } from "@/components/AIChatbot";
import { OneClickCampaign } from "@/components/OneClickCampaign";
import { AuthModal } from "@/components/AuthModal";

export default function Home() {
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main>
          <div className="relative isolate">
            <Hero />
            <ProductShowcase />
            <SmartTools 
              onOpenContentGenerator={() => setShowContentGenerator(true)}
              onOpenCampaignBuilder={() => setShowCampaignBuilder(true)}
            />
            <FeaturedContent />
            <Analytics />
            <Integrations />
            <Pricing />
            <Newsletter />
          </div>
        </main>
        <Footer />
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