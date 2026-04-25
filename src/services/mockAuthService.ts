/**
 * MOCK AUTH SERVICE - Bypasses Supabase Auth
 * Works instantly without email confirmation
 */

export interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

export interface MockSession {
  user: MockUser;
  access_token: string;
  expires_at: number;
}

class MockAuthService {
  private readonly STORAGE_KEY = 'mock_auth_session';

  /**
   * Instant login - no Supabase needed
   */
  async signInWithPassword(email: string, password: string): Promise<{ session: MockSession | null; error: any }> {
    try {
      // Create instant session
      const session: MockSession = {
        user: {
          id: 'mock-user-' + Date.now(),
          email: email,
          user_metadata: {
            full_name: email.split('@')[0]
          },
          created_at: new Date().toISOString()
        },
        access_token: 'mock-token-' + Math.random().toString(36),
        expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // Store in localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));

      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  }

  /**
   * Instant signup - no email confirmation
   */
  async signUpWithPassword(email: string, password: string): Promise<{ session: MockSession | null; error: any }> {
    // Same as sign in - instant access
    return this.signInWithPassword(email, password);
  }

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: MockSession | null; error: any }> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) {
        return { session: null, error: null };
      }

      const session: MockSession = JSON.parse(stored);
      
      // Check if expired
      if (session.expires_at < Date.now()) {
        localStorage.removeItem(this.STORAGE_KEY);
        return { session: null, error: null };
      }

      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  }

  /**
   * Get current user
   */
  async getUser(): Promise<{ user: MockUser | null; error: any }> {
    const { session, error } = await this.getSession();
    if (error || !session) {
      return { user: null, error };
    }
    return { user: session.user, error: null };
  }

  /**
   * Alias for getUser to fix TS errors
   */
  async getCurrentUser() {
    return this.getUser();
  }

  /**
   * Alias for signInWithPassword
   */
  async signIn(email: string, password?: string) {
    return this.signInWithPassword(email, password || 'demo123');
  }

  /**
   * Alias for signUpWithPassword
   */
  async signUp(email: string, password?: string) {
    return this.signUpWithPassword(email, password || 'demo123');
  }

  /**
   * Mock update profile
   */
  async updateProfile(data: any) {
    const { session } = await this.getSession();
    if (session) {
      session.user.user_metadata = { ...session.user.user_metadata, ...data };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    }
    return { error: null };
  }

  /**
   * Mock update password
   */
  async updatePassword(password: string) {
    return { error: null };
  }

  /**
   * Sign out
   */
  async signOut(): Promise<{ error: any }> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const { session } = await this.getSession();
    return !!session;
  }

  /**
   * Auto-login for testing (creates instant session)
   */
  async autoLogin(): Promise<MockSession> {
    const email = 'demo@affiliatepro.com';
    const { session } = await this.signInWithPassword(email, 'demo123');
    return session!;
  }
}

export const mockAuthService = new MockAuthService();
export const mockAuth = mockAuthService;