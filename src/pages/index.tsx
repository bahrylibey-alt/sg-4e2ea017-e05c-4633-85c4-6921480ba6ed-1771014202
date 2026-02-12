import React from "react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { FeaturedContent } from "@/components/FeaturedContent";
import { Newsletter } from "@/components/Newsletter";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

export default function Home() {
  return (
    <>
      <SEO 
        title="Mekseb Daily - Ethiopian Culture & Stories"
        description="Discover rich Ethiopian heritage, traditions, and daily stories. Connect with your roots and celebrate the beauty of Ethiopian culture."
        image="/og-image.png"
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          <Hero />
          <FeaturedContent />
          <Newsletter />
        </main>
        <Footer />
      </div>
    </>
  );
}