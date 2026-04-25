import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { mockAuthService } from "@/services/mockAuthService";
import { SEO } from "@/components/SEO";

/**
 * BYPASS SUPABASE EMAIL CONFIRMATION
 * This page now instantly confirms any user without email verification
 */
export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Instantly "confirm" the user - no email verification needed
    const confirmUser = async () => {
      try {
        // Check if user is already logged in via mock auth
        const isAuth = await mockAuthService.isAuthenticated();
        
        if (isAuth) {
          setStatus('success');
          setMessage('You are already logged in!');
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push('/working-autopilot-demo');
          }, 2000);
          return;
        }

        // Auto-login with demo account
        const result = await mockAuthService.autoLogin();
        
        if (result) {
          setStatus('success');
          setMessage('Email confirmed! Logging you in...');
          // Redirect to dashboard
          setTimeout(() => {
            router.push('/working-autopilot-demo');
          }, 2000);
        } else {
          throw new Error('Auto-login failed');
        }
      } catch (error: any) {
        console.error('Confirmation error:', error);
        setStatus('error');
        setMessage(error.message || 'Confirmation failed. Please try signing in manually.');
      }
    };

    confirmUser();
  }, [router]);

  return (
    <>
      <SEO 
        title="Email Confirmation - AffiliatePro"
        description="Confirming your email address"
      />
      
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8">
            {status === 'loading' && (
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                <h2 className="text-2xl font-bold">Confirming your email...</h2>
                <p className="text-muted-foreground">Please wait a moment</p>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">
                  ✅ Email Confirmed!
                </h2>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900 p-4 w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="text-3xl">❌</span>
                </div>
                <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">
                  Confirmation Failed
                </h2>
                <p className="text-muted-foreground">{message}</p>
                
                <div className="space-y-3 pt-4">
                  <Button 
                    onClick={() => router.push('/working-autopilot-demo')}
                    className="w-full"
                  >
                    Go to Dashboard
                  </Button>
                  
                  <Link href="/">
                    <Button variant="outline" className="w-full">
                      Return Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        </main>
        
        <Footer />
      </div>
    </>
  );
}