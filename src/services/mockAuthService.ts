// Mock Authentication Service - Works 100% without network calls
// Use this to bypass Supabase auth issues and get the app working

interface MockUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
}

class MockAuthService {
  private readonly STORAGE_KEY = "mock_auth_user";
  private readonly USERS_KEY = "mock_auth_users";

  // Get all registered users from localStorage
  private getUsers(): Record<string, { password: string; user: MockUser }> {
    const usersJson = localStorage.getItem(this.USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : {};
  }

  // Save users to localStorage
  private saveUsers(users: Record<string, { password: string; user: MockUser }>) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  // Sign up a new user
  async signUp(email: string, password: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const users = this.getUsers();

      // Check if user already exists
      if (users[email]) {
        return { success: false, error: "User already exists" };
      }

      // Create new user
      const newUser: MockUser = {
        id: `mock-${Date.now()}`,
        email,
        full_name: fullName,
        created_at: new Date().toISOString()
      };

      // Save user with password
      users[email] = {
        password, // In production, this would be hashed
        user: newUser
      };

      this.saveUsers(users);

      // Auto-login the user
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newUser));

      return { success: true };
    } catch (error) {
      return { success: false, error: "Signup failed" };
    }
  }

  // Sign in an existing user
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const users = this.getUsers();
      const userRecord = users[email];

      if (!userRecord) {
        return { success: false, error: "User not found" };
      }

      if (userRecord.password !== password) {
        return { success: false, error: "Invalid password" };
      }

      // Save user to session
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userRecord.user));

      return { success: true };
    } catch (error) {
      return { success: false, error: "Login failed" };
    }
  }

  // Get current user
  getCurrentUser(): MockUser | null {
    const userJson = localStorage.getItem(this.STORAGE_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Sign out
  signOut() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Update user profile
  updateProfile(updates: Partial<MockUser>): boolean {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;

      const updatedUser = { ...user, ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedUser));

      // Also update in users storage
      const users = this.getUsers();
      if (users[user.email]) {
        users[user.email].user = updatedUser;
        this.saveUsers(users);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Update password
  updatePassword(email: string, newPassword: string): boolean {
    try {
      const users = this.getUsers();
      if (!users[email]) return false;

      users[email].password = newPassword;
      this.saveUsers(users);

      return true;
    } catch (error) {
      return false;
    }
  }
}

export const mockAuthService = new MockAuthService();