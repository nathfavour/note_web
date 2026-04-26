'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, account, getKylrixPulse, setKylrixPulse, clearKylrixPulse, globalSessionPromise } from '@/lib/appwrite';
import { getEffectiveUsername } from '@/lib/utils';
import { GhostNoteClaimer } from '@/components/landing/GhostNoteClaimer';

// Lazy load email verification reminder
const EmailVerificationReminder = lazy(() => import('./EmailVerificationReminder').then(m => ({ default: m.EmailVerificationReminder })));

interface User {
  $id: string;
  email: string | null;
  name: string | null;
  isPulse?: boolean;
  emailVerification?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: (force?: boolean) => Promise<User | null>;
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
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [idmWindowOpen, setIDMWindowOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const idmWindowRef = useRef<Window | null>(null);
  const initAuthStarted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // 2. Background Revalidation (Mandatory account.get)
  const refreshUser = useCallback(async (force = false): Promise<User | null> => {
    setIsLoading(true);
    try {
      // Use direct account.get for the revalidation to be safe
      const currentUser = await account.get().catch(() => null);
      
      if (currentUser) {
        setKylrixPulse(currentUser);
        
        // Attempt to get DB profile for full user state
        const { getUser, createUser } = await import('@/lib/appwrite');
        let dbUser;
        try {
          dbUser = await getUser(currentUser.$id);
        } catch {
          const autoUsername = getEffectiveUsername(currentUser);
          dbUser = await createUser({
            id: currentUser.$id,
            email: currentUser.email,
            name: currentUser.name,
            username: autoUsername
          });
        }
        const fullUser = { ...currentUser, ...dbUser };
        setUser(fullUser);
        setKylrixPulse(fullUser);
        return fullUser;
      } else {
        clearKylrixPulse();
        setUser(null);
        return null;
      }
    } catch (error) {
      clearKylrixPulse();
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
      setIsAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (initAuthStarted.current) return;
    initAuthStarted.current = true;
    refreshUser();
  }, [refreshUser]);

  const login = useCallback((userData: User) => {
    setKylrixPulse(userData);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await account.deleteSession('current');
    } finally {
      clearKylrixPulse();
      setUser(null);
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
    isAuthReady,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    openIDMWindow,
    closeIDMWindow,
    idmWindowOpen,
  }), [user, isLoading, isAuthReady, login, logout, refreshUser, openIDMWindow, closeIDMWindow, idmWindowOpen]);

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
