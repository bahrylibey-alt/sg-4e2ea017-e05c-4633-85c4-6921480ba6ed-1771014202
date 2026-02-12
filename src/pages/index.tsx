import React from "react";
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

export default function Home() {
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
          <SmartTools />
          <ProductShowcase />
          <Analytics />
          <Integrations />
          <Pricing />
          <Newsletter />
        </main>
        <Footer />
      </div>
    </>
  );
}