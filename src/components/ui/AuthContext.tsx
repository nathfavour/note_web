'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  closeIDMWindow,
  dismissEmailVerificationReminder,
  openIDMWindow,
  shouldShowEmailVerificationReminder,
} from '@/lib/auth-store';
import { account, getCurrentUserSnapshot } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
import { GhostNoteClaimer } from '@/components/landing/GhostNoteClaimer';
import { EmailVerificationReminder } from './EmailVerificationReminder';

type User = {
  $id: string;
  email: string | null;
  name: string | null;
  isPulse?: boolean;
  [key: string]: any;
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  shouldShowEmailVerificationReminder: () => boolean;
  dismissEmailVerificationReminder: () => void;
  openIDMWindow: () => void;
  closeIDMWindow: () => void;
  idmWindowOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialSnapshot = getCurrentUserSnapshot() as User | null;
  const [user, setUser] = useState<User | null>(initialSnapshot);
  const [isLoading, setIsLoading] = useState(!initialSnapshot);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialSnapshot);
  const [idmWindowOpen, setIdmWindowOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await account.get();
        if (!mounted) return;

        setUser(currentUser as User);
        setIsAuthenticated(true);
        setIdmWindowOpen(false);
      } catch {
        if (!mounted) return;

        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    const handleAuthSuccess = (event: MessageEvent) => {
      const expectedOrigin = `https://${APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN}.${APPWRITE_CONFIG.SYSTEM.DOMAIN}`;
      if (event.origin !== expectedOrigin) return;
      if (event.data?.type !== 'idm:auth-success') return;

      setIdmWindowOpen(false);
      void loadUser();
    };

    window.addEventListener('message', handleAuthSuccess);

    return () => {
      mounted = false;
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    isLoading,
    isAuthenticated,
    login: (nextUser: User) => {
      setUser(nextUser);
      setIsAuthenticated(true);
      setIsLoading(false);
    },
    logout: async () => {
      try {
        await account.deleteSession('current');
      } finally {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        setIdmWindowOpen(false);
      }
    },
    refreshUser: async () => {
      try {
        const currentUser = await account.get();
        setUser(currentUser as User);
        setIsAuthenticated(true);
        setIsLoading(false);
        setIdmWindowOpen(false);
        return currentUser as User;
      } catch {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return null;
      }
    },
    shouldShowEmailVerificationReminder,
    dismissEmailVerificationReminder,
    openIDMWindow: () => {
      setIdmWindowOpen(true);
      openIDMWindow(window.location.pathname);
    },
    closeIDMWindow: () => {
      setIdmWindowOpen(false);
      closeIDMWindow();
    },
    idmWindowOpen,
  }), [user, isLoading, isAuthenticated, idmWindowOpen]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GhostNoteClaimer />
      <EmailVerificationReminder />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
