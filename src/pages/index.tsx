import React, { useState } from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
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

export default function Home() {
  const [showContentGenerator, setShowContentGenerator] = useState(false);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);

  return (
    <>
      <SEO />
      <div className="min-h-screen bg-background font-sans antialiased">
        <Header />
        <main>
          <Hero />
          <DashboardOverview />
          <AutopilotDashboard />
          <CampaignMonitor />
          
          <div className="container py-12">
            <h2 className="text-3xl font-bold mb-8">Smart Automation Tools</h2>
            <div className="grid gap-8 lg:grid-cols-2">
              <QuickCampaignSetup />
              <SmartTools 
                onOpenContentGenerator={() => setShowContentGenerator(true)}
                onOpenCampaignBuilder={() => setShowCampaignBuilder(true)}
              />
            </div>
          </div>

          <ProductShowcase />
          <Analytics />
          <Integrations />
          <Pricing />
          <Newsletter />
        </main>
        <Footer />
        
        {/* Modals/Drawers would go here */}
        {showContentGenerator && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-4xl bg-background rounded-lg shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowContentGenerator(false)}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-muted rounded-full"
              >
                ✕
              </button>
              <AIContentGenerator />
            </div>
          </div>
        )}

        {showCampaignBuilder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="relative w-full max-w-4xl bg-background rounded-lg shadow-lg overflow-hidden max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setShowCampaignBuilder(false)}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-muted rounded-full"
              >
                ✕
              </button>
              <CampaignBuilder />
            </div>
          </div>
        )}
      </div>
    </>
  );
}