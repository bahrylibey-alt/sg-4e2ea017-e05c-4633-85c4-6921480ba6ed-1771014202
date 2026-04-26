import { useEffect } from "react";
import { useRouter } from "next/router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEO } from "@/components/SEO";

/**
 * DASHBOARD PAGE - REDIRECTS TO UNIFIED COMMAND CENTER
 * 
 * The main dashboard is now at the homepage (/)
 * This page just redirects there to avoid confusion
 */
export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the unified command center on homepage
    router.replace('/');
  }, [router]);

  return (
    <>
      <SEO title="Dashboard - Redirecting..." />
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Redirecting to Command Center...</p>
        </div>
      </div>
    </>
  );
}