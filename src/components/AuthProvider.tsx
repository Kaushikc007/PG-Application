'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '@/lib/auth-fastapi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: 'tenant' | 'owner';
    phone?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        setUser(authService.getCurrentUser());
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.login({ email, password });
      if (result.success) {
        setUser(authService.getCurrentUser());
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    name: string;
    role: 'tenant' | 'owner';
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await authService.register(data);
      if (result.success) {
        setUser(authService.getCurrentUser());
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await authService.refreshUser();
    setUser(authService.getCurrentUser());
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: authService.isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthProvider;
