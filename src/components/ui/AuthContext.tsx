'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  closeIDMWindow,
  dismissEmailVerificationReminder,
  openIDMWindow,
  shouldShowEmailVerificationReminder,
} from '@/lib/auth-store';
import { account } from '@/lib/appwrite';
import { GhostNoteClaimer } from '@/components/landing/GhostNoteClaimer';
import { EmailVerificationReminder } from './EmailVerificationReminder';
import { getCurrentUser } from '@/lib/appwrite';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [idmWindowOpen, setIdmWindowOpen] = useState(false);
  const ACCOUNT_GET_TIMEOUT_MS = 8000;

  useEffect(() => {
    let mounted = true;
    let timeoutId: number | undefined;

    const loadUser = async () => {
      timeoutId = window.setTimeout(() => {
        if (!mounted) return;
        setIsLoading(false);
      }, ACCOUNT_GET_TIMEOUT_MS);

      try {
        const currentUser = await getCurrentUser();
        if (!mounted) return;

        setUser(currentUser as User);
        setIsAuthenticated(!!currentUser);
        setIdmWindowOpen(false);
      } catch {
        if (!mounted) return;

        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
        }
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadUser();

    return () => {
      mounted = false;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
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
        const currentUser = await getCurrentUser();
        setUser(currentUser as User);
        setIsAuthenticated(!!currentUser);
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
