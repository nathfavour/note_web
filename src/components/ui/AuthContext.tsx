'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { account, getCurrentUser, getKylrixPulse, setKylrixPulse, clearKylrixPulse, invalidateCurrentUserCache } from '@/lib/appwrite';
import { GhostNoteClaimer } from '@/components/landing/GhostNoteClaimer';

// Lazy load email verification reminder
const EmailVerificationReminder = lazy(() => import('./EmailVerificationReminder').then(m => ({ default: m.EmailVerificationReminder })));

interface User {
  $id: string;
  email: string | null;
  name: string | null;
  isPulse?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User | null>;
  openIDMWindow: () => void;
  closeIDMWindow: () => void;
  idmWindowOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Instant Synchronous Load from Pulse Cache
  const [user, setUser] = useState<User | null>(() => {
    const pulse = getKylrixPulse();
    if (pulse) {
        return { $id: pulse.$id, name: pulse.name, isPulse: true, email: null, profilePicId: pulse.profilePicId };
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(!getKylrixPulse());
  const [idmWindowOpen, setIDMWindowOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const idmWindowRef = useRef<Window | null>(null);
  const initAuthStarted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // 2. Background Revalidation (Non-blocking)
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const session = await getCurrentUser(true);
      if (session) {
        setUser(session as any);
        setKylrixPulse(session);
      } else {
        setUser(null);
        clearKylrixPulse();
      }
      return session as any;
    } catch (error) {
      setUser(null);
      clearKylrixPulse();
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initAuthStarted.current) return;
    initAuthStarted.current = true;
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((userData: User) => {
    invalidateCurrentUserCache();
    setKylrixPulse(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } finally {
      invalidateCurrentUserCache();
      setUser(null);
      clearKylrixPulse();
      setIDMWindowOpen(false);
    }
  }, []);

  const openIDMWindow = useCallback(() => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);

    const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
    const targetUrl = `https://${authSubdomain}.${domain}/login?source=${encodeURIComponent(window.location.origin + pathname)}`;

    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.assign(targetUrl);
    } else {
      const width = 500, height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      idmWindowRef.current = window.open(targetUrl, 'KylrixID', `width=${width},height=${height},left=${left},top=${top}`);
      setIDMWindowOpen(true);
    }
  }, [pathname, isAuthenticating]);

  const closeIDMWindow = useCallback(() => {
    if (idmWindowRef.current) idmWindowRef.current.close();
    setIDMWindowOpen(false);
    setIsAuthenticating(false);
    if (!user) router.replace('/');
  }, [user, router]);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    openIDMWindow,
    closeIDMWindow,
    idmWindowOpen,
  }), [user, isLoading, login, logout, refreshUser, openIDMWindow, closeIDMWindow, idmWindowOpen]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <GhostNoteClaimer />
      <Suspense fallback={null}>
        <EmailVerificationReminder />
      </Suspense>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
