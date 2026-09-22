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
    const saved = localStorage.getItem('woodapp_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    // Default to initial authorized user for smooth preview experience
    return INITIAL_USER;
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
      // 1. Try Firebase Auth if configured
      const fbAuth = getFirebaseAuth();
      if (fbAuth) {
        try {
          await signInWithEmailAndPassword(fbAuth, email, password);
        } catch (e) {
          console.warn('Firebase login attempt fallback:', e);
        }
      }

      // 2. Try WoodApp Backend API
      try {
        const res = await api.login({ email, password });
        if (res.token && res.user) {
          api.setToken(res.token);
          setUser(res.user);
          return true;
        }
      } catch (backendErr) {
        console.warn('Backend API login offline/fallback:', backendErr);
      }

      // 3. Fallback Local Session
      const loggedUser: UserProfile = {
        ...INITIAL_USER,
        email: email || INITIAL_USER.email,
      };
      api.setToken('local_token_jwt_' + Date.now());
      setUser(loggedUser);
      return true;
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
      try {
        const res = await api.register(data);
        if (res.token && res.user) {
          api.setToken(res.token);
          setUser(res.user);
          return true;
        }
      } catch (err) {
        console.warn('Backend register fallback:', err);
      }

      const newUser: UserProfile = {
        id: 'user_' + Date.now(),
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        role: 'owner',
        businessId: 'biz_' + Date.now(),
        businessName: data.businessName,
      };
      api.setToken('local_token_jwt_' + Date.now());
      setUser(newUser);
      return true;
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
    setUser(INITIAL_USER);
    api.setToken('demo_token');
    api.setBusinessId(INITIAL_USER.businessId);
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
