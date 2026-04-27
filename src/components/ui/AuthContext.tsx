'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { account, getKylrixPulse, setKylrixPulse, clearKylrixPulse, getCurrentUserSnapshot, getCurrentUser, onCurrentUserChanged, invalidateCurrentUserCache, setCurrentUserSnapshot } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';
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
  shouldShowEmailVerificationReminder: () => boolean;
  dismissEmailVerificationReminder: () => void;
  openIDMWindow: () => void;
  closeIDMWindow: () => void;
  idmWindowOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Instant Synchronous Load from current-user snapshot, then pulse fallback
  const [user, setUser] = useState<User | null>(() => {
    const snapshot = getCurrentUserSnapshot();
    if (snapshot) {
      return snapshot as any;
    }
    const pulse = getKylrixPulse();
    if (pulse) {
        return { $id: pulse.$id, name: pulse.name, isPulse: true, email: null, profilePicId: pulse.profilePicId };
    }
    return null;
  });
  
  const [isLoading, setIsLoading] = useState(!getCurrentUserSnapshot() && !getKylrixPulse());
  const [idmWindowOpen, setIDMWindowOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [emailVerificationReminderDismissed, setEmailVerificationReminderDismissed] = useState(false);
  const idmWindowRef = useRef<Window | null>(null);
  const initAuthStarted = useRef(false);
  const isAuthenticatingRef = useRef(false);
  const pathname = usePathname();

  const resolveUser = useCallback(async (): Promise<User | null> => {
    try {
      const session = getCurrentUserSnapshot() ?? await getCurrentUser();
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

  const attemptSilentAuth = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (getCurrentUserSnapshot()) return;

    const authSubdomain = APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN;
    const domain = APPWRITE_CONFIG.SYSTEM.DOMAIN;
    if (!authSubdomain || !domain) return;

    return new Promise<void>((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://${authSubdomain}.${domain}/silent-check`;
      iframe.style.display = 'none';

      const timeout = window.setTimeout(() => {
        cleanup();
        resolve();
      }, 5000);

      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== `https://${authSubdomain}.${domain}`) return;

        if (event.data?.type === 'idm:auth-status' && event.data.status === 'authenticated') {
          void resolveUser();
          cleanup();
          resolve();
        } else if (event.data?.type === 'idm:auth-status') {
          cleanup();
          resolve();
        }
      };

      const cleanup = () => {
        window.clearTimeout(timeout);
        window.removeEventListener('message', handleMessage);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      window.addEventListener('message', handleMessage);
      document.body.appendChild(iframe);
    });
  }, [resolveUser]);

  useEffect(() => {
    if (initAuthStarted.current) return;
    initAuthStarted.current = true;
    resolveUser().then((session) => {
      if (!session) {
        void attemptSilentAuth();
      }
    });
  }, [resolveUser, attemptSilentAuth]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setEmailVerificationReminderDismissed(localStorage.getItem('emailVerificationReminderDismissed') === 'true');
  }, []);

  useEffect(() => {
    const unsubscribe = onCurrentUserChanged((nextUser) => {
      if (nextUser) {
        setUser(nextUser as any);
        setIsLoading(false);
      } else if (!getCurrentUserSnapshot()) {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const login = useCallback((userData: User) => {
    setCurrentUserSnapshot(userData as any);
    setKylrixPulse(userData);
    setUser(userData);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } finally {
      invalidateCurrentUserCache();
      setUser(null);
      clearKylrixPulse();
      setIDMWindowOpen(false);
      isAuthenticatingRef.current = false;
    }
  }, []);

  const openIDMWindow = useCallback(() => {
    if (isAuthenticatingRef.current) return;
    isAuthenticatingRef.current = true;
    setIsAuthenticating(true);

    const localSession = getCurrentUserSnapshot();
    if (localSession) {
      setUser(localSession as any);
      setIsAuthenticating(false);
      isAuthenticatingRef.current = false;
      return;
    }

    const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
    const targetUrl = `https://${authSubdomain}.${domain}/login?source=${encodeURIComponent(window.location.origin + pathname)}`;

    void attemptSilentAuth().then(async () => {
      const session = getCurrentUserSnapshot() ?? await getCurrentUser();
      if (session) {
        setUser(session as any);
        setIsAuthenticating(false);
        isAuthenticatingRef.current = false;
        return;
      }

      if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
        window.location.assign(targetUrl);
        return;
      }

      if (idmWindowRef.current && !idmWindowRef.current.closed) {
        idmWindowRef.current.focus();
        return;
      }

      const width = 500, height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      idmWindowRef.current = window.open(targetUrl, 'KylrixID', `width=${width},height=${height},left=${left},top=${top}`);
      setIDMWindowOpen(true);
    }).catch(() => {
      isAuthenticatingRef.current = false;
      setIsAuthenticating(false);
    });
  }, [pathname, attemptSilentAuth]);

  const closeIDMWindow = useCallback(() => {
    if (idmWindowRef.current) idmWindowRef.current.close();
    setIDMWindowOpen(false);
    setIsAuthenticating(false);
    isAuthenticatingRef.current = false;
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const expectedOrigin = `https://${APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN}.${APPWRITE_CONFIG.SYSTEM.DOMAIN}`;
      if (event.origin !== expectedOrigin) return;
      if (event.data?.type !== 'idm:auth-success') return;

      closeIDMWindow();
      const session = await resolveUser();
      if (session) {
        setUser(session as any);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [closeIDMWindow, resolveUser]);

  const shouldShowEmailVerificationReminder = useCallback(() => {
    return !!user && !user.emailVerification && !emailVerificationReminderDismissed;
  }, [user, emailVerificationReminderDismissed]);

  const dismissEmailVerificationReminder = useCallback(() => {
    setEmailVerificationReminderDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('emailVerificationReminderDismissed', 'true');
    }
  }, []);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser: resolveUser,
    shouldShowEmailVerificationReminder,
    dismissEmailVerificationReminder,
    openIDMWindow,
    closeIDMWindow,
    idmWindowOpen,
  }), [
    user,
    isLoading,
    login,
    logout,
    resolveUser,
    shouldShowEmailVerificationReminder,
    dismissEmailVerificationReminder,
    openIDMWindow,
    closeIDMWindow,
    idmWindowOpen,
  ]);

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
