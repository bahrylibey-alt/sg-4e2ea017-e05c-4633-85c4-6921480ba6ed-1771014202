import { supabase } from "@/integrations/supabase/client";
import type { AuthError, User, Session } from "@supabase/supabase-js";

// Get the current URL for redirects (works in both dev and production)
const getRedirectURL = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/confirm-email`;
};

class AuthService {
  async signUp(
    email: string,
    password: string,
    metadata?: { full_name?: string }
  ): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: getRedirectURL()
        }
      });

      if (error) {
        console.error("Signup error:", error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error("Signup exception:", err);
      return {
        user: null,
        error: {
          message: err instanceof Error ? err.message : "Signup failed",
          name: "SignupError",
          status: 500
        } as AuthError
      };
    }
  }

  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Sign in error:", error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (err) {
      console.error("Sign in exception:", err);
      return {
        user: null,
        error: {
          message: err instanceof Error ? err.message : "Sign in failed",
          name: "SignInError",
          status: 500
        } as AuthError
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        return { error };
      }
      return { error: null };
    } catch (err) {
      console.error("Sign out exception:", err);
      return {
        error: {
          message: err instanceof Error ? err.message : "Sign out failed",
          name: "SignOutError",
          status: 500
        } as AuthError
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // First check if there's a session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.log("No active session");
        return null;
      }

      // If session exists, get the user
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Get user error:", error);
        return null;
      }
      
      return user;
    } catch (err) {
      console.error("Get user exception:", err);
      return null;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Get session error:", error);
        return null;
      }
      return session;
    } catch (err) {
      console.error("Get session exception:", err);
      return null;
    }
  }

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectURL()
      });

      if (error) {
        console.error("Reset password error:", error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Reset password exception:", err);
      return {
        error: {
          message: err instanceof Error ? err.message : "Password reset failed",
          name: "ResetPasswordError",
          status: 500
        } as AuthError
      };
    }
  }

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("Update password error:", error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Update password exception:", err);
      return {
        error: {
          message: err instanceof Error ? err.message : "Password update failed",
          name: "UpdatePasswordError",
          status: 500
        } as AuthError
      };
    }
  }
}

export const authService = new AuthService();