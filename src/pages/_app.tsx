import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        console.log("🔄 User signed in, syncing settings from Supabase...");
        
        // Load user settings from Supabase
        const { data: settings, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (!error && settings) {
          console.log("✅ Settings synced from Supabase");
          
          // Sync API key to localStorage
          if (settings.openai_api_key) {
            localStorage.setItem('openai_api_key', settings.openai_api_key);
            console.log("✅ API key synced to this device");
          }
          
          // Sync other settings
          if (settings.autopilot_settings) {
            localStorage.setItem('autopilot_settings', JSON.stringify(settings.autopilot_settings));
          }
        }
      }
      
      if (event === 'SIGNED_OUT') {
        console.log("🔄 User signed out, clearing localStorage");
        // Optionally clear localStorage on sign out
        // localStorage.removeItem('openai_api_key');
        // localStorage.removeItem('autopilot_settings');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ThemeProvider>
      <Component {...pageProps} />
      <Toaster />
    </ThemeProvider>
  );
}