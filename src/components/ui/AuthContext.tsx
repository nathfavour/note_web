'use client';

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import {
  closeIDMWindow,
  dismissEmailVerificationReminder,
  getServerSnapshot,
  getSnapshot,
  initAuth,
  login,
  logout,
  openIDMWindow,
  refreshUser,
  shouldShowEmailVerificationReminder,
  subscribe,
} from '@/lib/auth-store';
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
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void initAuth();
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user: snapshot.user,
    isLoading: snapshot.isLoading,
    isAuthenticated: snapshot.isAuthenticated,
    login,
    logout,
    refreshUser: async () => refreshUser(true),
    shouldShowEmailVerificationReminder,
    dismissEmailVerificationReminder,
    openIDMWindow: () => openIDMWindow(window.location.pathname),
    closeIDMWindow,
    idmWindowOpen: snapshot.idmWindowOpen,
  }), [snapshot]);

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
