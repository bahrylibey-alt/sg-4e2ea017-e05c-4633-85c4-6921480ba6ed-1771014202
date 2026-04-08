import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: any;
  created_at?: string;
}

export interface AuthError {
  message: string;
  code?: string;
}

// Enhanced session cache with retry logic
let cachedSession: Session | null = null;
let sessionPromise: Promise<Session | null> | null = null;
let lastSessionCheck = 0;
const SESSION_CACHE_TTL = 30000; // 30 seconds cache (increased from 5s)

// Request queue to prevent concurrent auth calls
const authRequestQueue: Array<() => void> = [];
const isProcessingQueue = false;

// Dynamic URL Helper
const getURL = () => {
  let url = process?.env?.NEXT_PUBLIC_VERCEL_URL ?? 
           process?.env?.NEXT_PUBLIC_SITE_URL ?? 
           'http://localhost:3000'
  
  if (!url) {
    url = 'http://localhost:3000';
  }
  
  url = url.startsWith('http') ? url : `https://${url}`
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

// Retry helper for network requests
async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on network errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        if (i < maxRetries - 1) {
          console.log(`Retry ${i + 1}/${maxRetries - 1} after network error...`);
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
          continue;
        }
      }
      throw error;
    }
  }
  
  throw lastError;
}

export const authService = {
  // Get current user with retry logic
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const result = await retryRequest(async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.log("Auth error in getCurrentUser:", error.message);
          return null;
        }
        
        return user ? {
          id: user.id,
          email: user.email || "",
          user_metadata: user.user_metadata,
          created_at: user.created_at
        } : null;
      });
      
      return result;
    } catch (error) {
      console.log("Exception in getCurrentUser:", error);
      return null;
    }
  },

  // Enhanced session management with longer cache and retry
  async getCurrentSession(): Promise<Session | null> {
    try {
      const now = Date.now();
      
      // Return cached session if still valid (30s TTL)
      if (cachedSession && (now - lastSessionCheck) < SESSION_CACHE_TTL) {
        return cachedSession;
      }
      
      // If there's already a pending request, wait for it
      if (sessionPromise) {
        return await sessionPromise;
      }
      
      // Create new session request with retry
      sessionPromise = retryRequest(async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.log("Auth error in getCurrentSession:", error.message);
            cachedSession = null;
            return null;
          }
          
          cachedSession = session;
          lastSessionCheck = Date.now();
          return session;
        } catch (error) {
          console.error("Session check failed:", error);
          cachedSession = null;
          return null;
        } finally {
          sessionPromise = null;
        }
      }, 3, 1000);
      
      return await sessionPromise;
    } catch (error) {
      console.error("Session check failed:", error);
      sessionPromise = null;
      return null;
    }
  },

  // Clear session cache (call after sign in/out)
  clearSessionCache() {
    cachedSession = null;
    sessionPromise = null;
    lastSessionCheck = 0;
  },

  // Sign up with email and password
  async signUp(email: string, password: string, metaData?: { full_name?: string }): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${getURL()}auth/confirm-email`,
          data: metaData
        }
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      this.clearSessionCache();
      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign up" } 
      };
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      this.clearSessionCache();
      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during sign in" } 
      };
    }
  },

  // Sign out
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return { error: { message: error.message } };
      }

      this.clearSessionCache();
      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during sign out" } 
      };
    }
  },

  // Reset password
  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getURL()}auth/reset-password`,
      });

      if (error) {
        return { error: { message: error.message } };
      }

      return { error: null };
    } catch (error) {
      return { 
        error: { message: "An unexpected error occurred during password reset" } 
      };
    }
  },

  // Confirm email (REQUIRED)
  async confirmEmail(token: string, type: 'signup' | 'recovery' | 'email_change' = 'signup'): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.status?.toString() } };
      }

      const authUser = data.user ? {
        id: data.user.id,
        email: data.user.email || "",
        user_metadata: data.user.user_metadata,
        created_at: data.user.created_at
      } : null;

      this.clearSessionCache();
      return { user: authUser, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: { message: "An unexpected error occurred during email confirmation" } 
      };
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Clear cache on auth state change
      this.clearSessionCache();
      callback(event, session);
    });
    return subscription;
  }
};