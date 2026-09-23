/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Authentication Context
 * Supports Firebase Authentication with fallback for instant local execution
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types/frontend.ts';
import { api } from '../services/api.ts';
import { getFirebaseAuth, signInWithEmailAndPassword, fbSignOut } from '../services/firebaseClient.ts';
import { INITIAL_USER } from '../services/devAdapter.ts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (data: { email: string; fullName: string; phone: string; businessName: string; password?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  useDemoAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const saved = localStorage.getItem('woodapp_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('woodapp_user', JSON.stringify(user));
      api.setBusinessId(user.businessId);
    } else {
      localStorage.removeItem('woodapp_user');
    }
  }, [user]);

  const login = async (email: string, password: string = 'password123'): Promise<boolean> => {
    setLoading(true);
    try {
      const fbAuth = getFirebaseAuth();
      if (fbAuth) {
        try {
          const credential = await signInWithEmailAndPassword(fbAuth, email, password);
          const firebaseToken = await credential.user.getIdToken();
          api.setToken(firebaseToken);
        } catch (firebaseError) {
          console.warn('Firebase authentication failed:', firebaseError);
          throw new Error('Firebase login failed. Please verify your credentials.');
        }
      }

      try {
        const res = await api.login({ email, password });
        if (res.token && res.user) {
          api.setToken(res.token);
          setUser(res.user);
          return true;
        }
      } catch (backendErr) {
        console.warn('Backend API login failed:', backendErr);
        throw backendErr;
      }

      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    fullName: string;
    phone: string;
    businessName: string;
    password?: string;
  }): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await api.register(data);
      if (res.token && res.user) {
        api.setToken(res.token);
        setUser(res.user);
        return true;
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const fbAuth = getFirebaseAuth();
    if (fbAuth) {
      try {
        await fbSignOut(fbAuth);
      } catch (e) {
        console.warn('Firebase signout error:', e);
      }
    }
    api.setToken(null);
    setUser(null);
  };

  const useDemoAccount = () => {
    console.warn('Demo bypass is disabled in production GANZA mode. Use the real Firebase authentication flow.');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, useDemoAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
