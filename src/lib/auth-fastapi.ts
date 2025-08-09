// New Authentication System for FastAPI Integration
import { apiClient } from './api-client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'tenant' | 'owner' | 'admin';
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'tenant' | 'owner';
  phone?: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('jwt_token');
      const userStr = localStorage.getItem('user_data');
      if (userStr) {
        try {
          this.user = JSON.parse(userStr);
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login method
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        this.setAuth(response.data.access_token, response.data.user);
        return { success: true, user: response.data.user };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  // Register method
  async register(data: RegisterData): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      const response = await apiClient.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.error) {
        return { success: false, error: response.error };
      }

      if (response.data) {
        this.setAuth(response.data.access_token, response.data.user);
        return { success: true, user: response.data.user };
      }

      return { success: false, error: 'Invalid response format' };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  // Logout method
  logout(): void {
    this.clearAuth();
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.user;
  }

  // Get current token
  getToken(): string | null {
    return this.token;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.token !== null && this.user !== null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  // Check if user is owner
  isOwner(): boolean {
    return this.hasRole('owner');
  }

  // Check if user is tenant
  isTenant(): boolean {
    return this.hasRole('tenant');
  }

  // Check if user is admin
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  // Refresh user data
  async refreshUser(): Promise<void> {
    if (!this.token) return;

    try {
      apiClient.setToken(this.token);
      const response = await apiClient.request<User>('/auth/me', {
        method: 'GET',
      });

      if (response.data) {
        this.user = response.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('user_data', JSON.stringify(this.user));
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      this.clearAuth();
    }
  }

  // Private method to set authentication data
  private setAuth(token: string, user: User): void {
    this.token = token;
    this.user = user;
    
    // Set token in API client
    apiClient.setToken(token);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  }

  // Private method to clear authentication data
  private clearAuth(): void {
    this.token = null;
    this.user = null;
    
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
    }
  }

  // Initialize auth on app start
  async initialize(): Promise<void> {
    if (this.token) {
      apiClient.setToken(this.token);
      await this.refreshUser();
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// React hook for authentication
export const useAuth = () => {
  return {
    user: authService.getCurrentUser(),
    isAuthenticated: authService.isAuthenticated(),
    isOwner: authService.isOwner(),
    isTenant: authService.isTenant(),
    isAdmin: authService.isAdmin(),
    login: authService.login.bind(authService),
    register: authService.register.bind(authService),
    logout: authService.logout.bind(authService),
    refreshUser: authService.refreshUser.bind(authService),
  };
};

export default authService;
