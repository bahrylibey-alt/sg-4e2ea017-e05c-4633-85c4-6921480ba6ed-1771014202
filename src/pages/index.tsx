import { SEO } from "@/components/SEO";
import { Hero } from "@/components/Hero";
import { ProductShowcase } from "@/components/ProductShowcase";
import { SmartTools } from "@/components/SmartTools";
import { Pricing } from "@/components/Pricing";
import { Newsletter } from "@/components/Newsletter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <SEO 
        title="AffiliatePro - AI-Powered Affiliate Marketing Automation"
        description="Automate your affiliate marketing with AI. Smart campaign management, traffic generation, and revenue optimization."
      />
      <Header />
      <Hero />
      <ProductShowcase />
      <SmartTools />
      <Pricing />
      <Newsletter />
      <Footer />
    </main>
  );
}