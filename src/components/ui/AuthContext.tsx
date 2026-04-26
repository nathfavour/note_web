'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, lazy, Suspense, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { invalidateCurrentUserCache, getCurrentUser, getUser, createUser, updateUser, account } from '@/lib/appwrite';
import { getEffectiveUsername } from '@/lib/utils';
import { GhostNoteClaimer } from '@/components/landing/GhostNoteClaimer';

// Lazy load email verification reminder (loading screen removed for instant app feel)
const EmailVerificationReminder = lazy(() => import('./EmailVerificationReminder').then(m => ({ default: m.EmailVerificationReminder })));

interface User {
  $id: string;
  email: string | null;
  name: string | null;
  emailVerification?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: (isRetry?: boolean) => Promise<User | null>;
  recoverSession: () => Promise<boolean>;
  shouldShowEmailVerificationReminder: () => boolean;
  dismissEmailVerificationReminder: () => void;
  openIDMWindow: () => void;
  closeIDMWindow: () => void;
  idmWindowOpen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  // Keep loading true until initial check is actually done
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [idmWindowOpen, setIDMWindowOpen] = useState(false);
  const [emailVerificationReminderDismissed, setEmailVerificationReminderDismissed] = useState(false);
  const idmWindowRef = useRef<Window | null>(null);
  const idmOriginRef = useRef<string | null>(null);
  const initAuthStarted = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = useCallback(async (force = false, retryCount = 0, skipLoadingState = false) => {
    if (!skipLoadingState) setIsLoading(true);
    try {
      if (force) {
        invalidateCurrentUserCache();
      }

      const currentUser = await getCurrentUser(force);
      if (currentUser) {
        // Set persistent flag for optimistic auth on next reload
        if (typeof window !== 'undefined') {
          localStorage.setItem('kylrix_auth_active', 'true');
        }
        
        // Clear the auth=success param from URL if it exists
        if (typeof window !== 'undefined' && window.location.search.includes('auth=success')) {
          const url = new URL(window.location.href);
          url.searchParams.delete('auth');
          window.history.replaceState({}, '', url.toString());
        }

        let dbUser;
        try {
          dbUser = await getUser(currentUser.$id);

          if (!dbUser.username) {
            const autoUsername = getEffectiveUsername(dbUser);
            if (autoUsername) {
              try {
                await updateUser(currentUser.$id, { username: autoUsername });

                const currentPrefs = await account.getPrefs();
                if (currentPrefs.username !== autoUsername) {
                  await account.updatePrefs({ ...currentPrefs, username: autoUsername });
                }

                dbUser = await getUser(currentUser.$id);
              } catch (_updateErr: any) {
                // Keep the session visible even if profile sync fails.
              }
            }
          }
        } catch (_fetchErr: any) {
          try {
            const autoUsername = getEffectiveUsername({
              name: currentUser.name,
              email: currentUser.email,
              username: null
            });

            dbUser = await createUser({
              id: currentUser.$id,
              email: currentUser.email,
              name: currentUser.name,
              username: autoUsername
            });

            const currentPrefs = await account.getPrefs();
            if (autoUsername && currentPrefs.username !== autoUsername) {
              await account.updatePrefs({ ...currentPrefs, username: autoUsername });
            }
          } catch (createError) {
            console.error('Failed to create user profile:', createError);
          }
        }

        setUser({ ...currentUser, ...dbUser });
        return { ...currentUser, ...dbUser };
      } else {
        const hasAuthSignal = typeof window !== 'undefined' && window.location.search.includes('auth=success');
        const hasAuthHint = typeof window !== 'undefined' && localStorage.getItem('kylrix_auth_active') === 'true';

        if ((hasAuthSignal || hasAuthHint) && retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 750));
          return refreshUser(true, retryCount + 1, skipLoadingState);
        }

        if (typeof window !== 'undefined') {
          localStorage.removeItem('kylrix_auth_active');
        }
        setUser(null);
        return null;
      }
    } catch (error: any) {
      // Check for auth=success signal in URL
      const hasAuthSignal = typeof window !== 'undefined' && window.location.search.includes('auth=success');
      
      if (hasAuthSignal && retryCount < 3) {
        console.log(`Auth signal detected but session not found in note. Retrying... (${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return refreshUser(true, retryCount + 1, skipLoadingState);
      }

      // If error is network related, don't clear user yet, just set offline flag if we had a user
      const isNetworkError = !error.response && (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch'));

      if (!isNetworkError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kylrix_auth_active');
        }
        setUser(null);
      } else {
        console.warn('Network issue detected during auth refresh. Retaining last known state.');
      }

      console.error('Failed to get current user:', error);
      return null;
    } finally {
      if (!skipLoadingState) setIsLoading(false);
    }
  }, []);

  const attemptSilentAuth = useCallback(async () => {
    if (typeof window === 'undefined') return null;
    if (user) return user;

    const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
    if (!authSubdomain || !domain) return null;

    return new Promise<User | null>((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://${authSubdomain}.${domain}/silent-check`;
      iframe.style.display = 'none';

      const timeout = window.setTimeout(() => {
        cleanup();
        resolve(null);
      }, 5000);

      const handleIframeMessage = async (event: MessageEvent) => {
        if (event.origin !== `https://${authSubdomain}.${domain}`) return;

        if (event.data?.type === 'idm:auth-status' && event.data.status === 'authenticated') {
          const newUser = await refreshUser(false, 0, true);
          cleanup();
          resolve(newUser);
        } else if (event.data?.type === 'idm:auth-status') {
          cleanup();
          resolve(null);
        }
      };

      const cleanup = () => {
        window.clearTimeout(timeout);
        window.removeEventListener('message', handleIframeMessage);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      };

      window.addEventListener('message', handleIframeMessage);
      document.body.appendChild(iframe);
    });
  }, [user, refreshUser]);

  useEffect(() => {
    if (initAuthStarted.current) return;
    initAuthStarted.current = true;

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const localUser = await refreshUser(false, 0, true);
        if (!localUser) {
          await attemptSilentAuth();
        }
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, [refreshUser, attemptSilentAuth]);

  useEffect(() => {
    let lastRefreshTime = Date.now();
    const MIN_REFRESH_INTERVAL = 5 * 60 * 1000; // Increased to 5 mins

    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRefreshTime >= MIN_REFRESH_INTERVAL && user && !isLoading) {
        lastRefreshTime = now;
        refreshUser();
      }
    };

    document.addEventListener('click', handleUserActivity, { once: false, passive: true });
    document.addEventListener('keydown', handleUserActivity, { once: false, passive: true });

    return () => {
      document.removeEventListener('click', handleUserActivity);
      document.removeEventListener('keydown', handleUserActivity);
    };
  }, [user, isLoading, refreshUser]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
      const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';
      if (!authSubdomain || !domain) return;
      const expectedOrigin = `https://${authSubdomain}.${domain}`;

      if (event.origin !== expectedOrigin) {
        return;
      }
      if (event.data?.type !== 'idm:auth-success') {
        return;
      }

      refreshUser();
      setIDMWindowOpen(false);
      setIsAuthenticating(false);
      if (idmWindowRef.current && !idmWindowRef.current.closed) {
        idmWindowRef.current.close();
      }
      idmWindowRef.current = null;
      if (pathname === '/') {
        router.replace('/notes');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [refreshUser, router, pathname]);

  useEffect(() => {
    if (!idmWindowOpen) return;

    const interval = setInterval(() => {
      const child = idmWindowRef.current;
      if (child && child.closed) {
        clearInterval(interval);
        idmWindowRef.current = null;
        setIDMWindowOpen(false);
        setIsAuthenticating(false);
        refreshUser();
      }
    }, 700);

    return () => {
      clearInterval(interval);
    };
  }, [idmWindowOpen, refreshUser]);

  const login = useCallback((userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kylrix_auth_active', 'true');
    }
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      // Delete the current session
      const { account } = await import('@/lib/appwrite');
      await account.deleteSession('current');

      // Clear any local storage related to authentication
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_cache');
        localStorage.removeItem('kylrix_auth_active');
        sessionStorage.removeItem('auth_temp_data');
      }
    } catch (error: any) {
      console.error('Logout failed:', error);
    } finally {
      // Always clear local user state regardless of logout success
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('kylrix_auth_active');
      }
      // Clear any temporary auth state
      setIDMWindowOpen(false);
    }
  }, []);

  // Session recovery function for when authentication state becomes inconsistent
  const recoverSession = useCallback(async () => {
    setIsLoading(true);

    try {
      // Try to refresh the user data
      await refreshUser();

      if (user) {
        return true;
      } else {
        setIDMWindowOpen(true);
        return false;
      }
    } catch (error: any) {
      console.error('Session recovery failed:', error);
      setIDMWindowOpen(true);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser, user]);

  // Email verification reminder logic
  const shouldShowEmailVerificationReminder = useCallback((): boolean => {
    if (!user || user.emailVerification || emailVerificationReminderDismissed) {
      return false;
    }

    // Check if account is older than 24 hours
    const accountAge = Date.now() - new Date(user.$createdAt).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    return accountAge > oneDay;
  }, [user, emailVerificationReminderDismissed]);

  const dismissEmailVerificationReminder = useCallback((): void => {
    setEmailVerificationReminderDismissed(true);
    // Store dismissal in localStorage to persist across sessions
    if (typeof window !== 'undefined') {
      localStorage.setItem('emailVerificationReminderDismissed', 'true');
    }
  }, []);

  // Opens IDM window for authentication
  const openIDMWindow = useCallback(() => {
    if (typeof window === 'undefined' || isAuthenticating) return;

    setIsAuthenticating(true);
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent);

    const launch = async () => {
      try {
        // First, check if we already have a session locally
        const currentUser = await getCurrentUser();

        if (currentUser) {
          console.log('Active session detected, skipping IDM window');
          setUser(currentUser);
          setIDMWindowOpen(false);
          setIsAuthenticating(false);
          if (idmWindowRef.current && !idmWindowRef.current.closed) {
            idmWindowRef.current.close();
            idmWindowRef.current = null;
          }
          return;
        }

        const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || 'accounts';
        const domain = process.env.NEXT_PUBLIC_DOMAIN || 'kylrix.space';

        if (!authSubdomain || !domain) {
          console.error('IDM configuration missing: AUTH_SUBDOMAIN or DOMAIN not set');
          setIsAuthenticating(false);
          router.replace('/');
          return;
        }

        const idmUrl = `https://${authSubdomain}.${domain}/login`;
        const idmUrlObj = new URL(idmUrl);
        const sourceUrl = window.location.origin + pathname;
        const targetUrl = (() => {
          const url = new URL(idmUrl);
          url.searchParams.set('source', sourceUrl);
          return url.toString();
        })();

        idmOriginRef.current = idmUrlObj.origin;

        if (isMobileDevice) {
          window.location.assign(targetUrl);
          return;
        }

        if (idmWindowRef.current && !idmWindowRef.current.closed) {
          idmWindowRef.current.focus();
        } else {
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          const windowRef = window.open(
            targetUrl,
            'Kylrix NoteIDM',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
          );

          if (!windowRef) {
            console.warn('Popup blocked, falling back to redirect in kylrixnote');
            window.location.assign(targetUrl);
            return;
          }

          idmWindowRef.current = windowRef;
        }

        setIDMWindowOpen(true);
      } catch (error: any) {
        console.error('Failed to initiate IDM flow:', error);
        setIsAuthenticating(false);
        router.replace('/');
      }
    };

    launch();
  }, [router, pathname, isAuthenticating]);

  const closeIDMWindow = useCallback(() => {
    if (idmWindowRef.current && !idmWindowRef.current.closed) {
      idmWindowRef.current.close();
    }
    idmWindowRef.current = null;
    setIDMWindowOpen(false);
    setIsAuthenticating(false);
    if (!user) {
      router.replace('/');
    }
  }, [router, user]);

  const value = useMemo(() => ({
    user,
    isLoading,
    isAuthenticating,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    recoverSession,
    shouldShowEmailVerificationReminder,
    dismissEmailVerificationReminder,
    openIDMWindow,
    closeIDMWindow,
    idmWindowOpen,
  }), [
    user,
    isLoading,
    isAuthenticating,
    login,
    logout,
    refreshUser,
    recoverSession,
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
