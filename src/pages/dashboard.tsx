import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { SimplifiedAuthModal } from "@/components/SimplifiedAuthModal";
import { DashboardOverview } from "@/components/DashboardOverview";
import { mockAuthService } from "@/services/mockAuthService";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const isAuth = mockAuthService.isAuthenticated();
    
    if (!isAuth) {
      setShowAuthModal(true);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <>
        <SEO title="Dashboard - AffiliatePro" />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (showAuthModal && !mockAuthService.isAuthenticated()) {
    return (
      <>
        <SEO title="Sign In - AffiliatePro" />
        <div className="min-h-screen bg-background">
          <SimplifiedAuthModal 
            open={showAuthModal} 
            onOpenChange={setShowAuthModal}
            onSuccess={() => {
              setShowAuthModal(false);
              window.location.reload();
            }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO title="Dashboard - AffiliatePro" />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <DashboardOverview />
        </main>
        <Footer />
      </div>
    </>
  );
}