import React, {createContext, useContext, useState, useCallback, useEffect} from 'react';
import {firebaseService} from '../services/FirebaseService';
import {getFirebaseAuthInstance, onAuthStateChanged} from '../config/firebase';
import {User} from '../types';
import {offlineService} from '../services/OfflineService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      const auth = getFirebaseAuthInstance();
      unsub = onAuthStateChanged(auth, fbUser => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || '',
            businessId: fbUser.uid,
            createdAt: fbUser.metadata.creationTime ? Date.parse(fbUser.metadata.creationTime) : Date.now(),
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });
    } catch {
      setLoading(false);
    }
    offlineService.initialize().catch(() => {});
    return () => {
      if (unsub) unsub();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await firebaseService.signUp(email, password, displayName);
      setUser(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Habaye ikibazo. Ongera ugerageze.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await firebaseService.signIn(email, password);
      setUser(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Habaye ikibazo. Ongera ugerageze.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await firebaseService.signOut();
      setUser(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Habaye ikibazo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await firebaseService.resetPassword(email);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Habaye ikibazo';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return React.createElement(AuthContext.Provider, {value: {user, loading, error, signUp, signIn, signOut, resetPassword}}, children);
};
