'use client';

import { account, clearKylrixPulse, getCurrentUserSnapshot, getKylrixPulse, getCurrentUser, invalidateCurrentUserCache, onCurrentUserChanged, setCurrentUserSnapshot, setKylrixPulse } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/lib/appwrite/config';

export interface User {
  $id: string;
  email: string | null;
  name: string | null;
  isPulse?: boolean;
  [key: string]: any;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  idmWindowOpen: boolean;
}

type Listener = () => void;

const initialSnapshot = getCurrentUserSnapshot();
const initialPulse = initialSnapshot ? null : getKylrixPulse();

let state: AuthState = {
  user: (initialSnapshot as User | null) ?? (initialPulse ? { $id: initialPulse.$id, name: initialPulse.name, isPulse: true, email: null, profilePicId: initialPulse.profilePicId } : null),
  isLoading: !(initialSnapshot || initialPulse),
  isAuthenticated: !!(initialSnapshot || initialPulse),
  isAuthenticating: false,
  idmWindowOpen: false,
};

const listeners = new Set<Listener>();
let initialized = false;
let idmWindowRef: Window | null = null;
let silentCheckInFlight: Promise<void> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<AuthState>) {
  state = { ...state, ...patch, isAuthenticated: !!(patch.user ?? state.user) };
  emit();
}

function canUseWindow() {
  return typeof window !== 'undefined';
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSnapshot() {
  return state;
}

export function getServerSnapshot() {
  return {
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isAuthenticating: false,
    idmWindowOpen: false,
  };
}

export async function refreshUser(force = false): Promise<User | null> {
  try {
    if (force) {
      invalidateCurrentUserCache();
    }
    const session = await account.get();
    if (session) {
      setCurrentUserSnapshot(session as any);
      setKylrixPulse(session as any);
      setState({
        user: session as any,
        isLoading: false,
      });
      return session as any;
    }

    invalidateCurrentUserCache();
    clearKylrixPulse();
    setState({
      user: null,
      isLoading: false,
    });
    return null;
  } catch {
    invalidateCurrentUserCache();
    clearKylrixPulse();
    setState({
      user: null,
      isLoading: false,
    });
    return null;
  }
}

async function attemptSilentAuth(): Promise<void> {
  if (!canUseWindow()) return;
  if (getCurrentUserSnapshot()) return;
  if (silentCheckInFlight) return silentCheckInFlight;

  const authSubdomain = APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN;
  const domain = APPWRITE_CONFIG.SYSTEM.DOMAIN;
  if (!authSubdomain || !domain) return;

  silentCheckInFlight = new Promise<void>((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.src = `https://${authSubdomain}.${domain}/silent-check`;
    iframe.style.display = 'none';

    const timeout = window.setTimeout(() => {
      cleanup();
      resolve();
    }, 5000);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== `https://${authSubdomain}.${domain}`) return;
      if (event.data?.type !== 'idm:auth-status') return;

      if (event.data.status === 'authenticated') {
        void refreshUser(true);
      }

      cleanup();
      resolve();
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
  }).finally(() => {
    silentCheckInFlight = null;
  });

  return silentCheckInFlight;
}

export async function initAuth() {
  if (!canUseWindow() || initialized) return;
  initialized = true;

  const snapshot = getCurrentUserSnapshot();
  if (snapshot) {
    setState({
      user: snapshot as any,
      isLoading: false,
    });
  }

  const session = snapshot ?? await refreshUser();
  if (!session) {
    await attemptSilentAuth();
  }
}

export function login(user: User) {
  setCurrentUserSnapshot(user as any);
  setKylrixPulse(user as any);
  setState({
    user,
    isLoading: false,
  });
}

export async function logout() {
  try {
    await account.deleteSession('current');
  } finally {
    invalidateCurrentUserCache();
    clearKylrixPulse();
    idmWindowRef?.close?.();
    idmWindowRef = null;
    setState({
      user: null,
      isLoading: false,
      isAuthenticating: false,
      idmWindowOpen: false,
    });
  }
}

export function openIDMWindow(pathname: string) {
  if (!canUseWindow()) return;
  if (state.isAuthenticating) return;

  const localSession = getCurrentUserSnapshot();
  if (localSession) {
    setState({
      user: localSession as any,
      isLoading: false,
    });
    return;
  }

  setState({ isAuthenticating: true });

  const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN;
  const domain = process.env.NEXT_PUBLIC_DOMAIN || APPWRITE_CONFIG.SYSTEM.DOMAIN;
  const targetUrl = `https://${authSubdomain}.${domain}/login?source=${encodeURIComponent(window.location.origin + pathname)}`;

  void attemptSilentAuth().then(() => {
    const session = getCurrentUserSnapshot();
    if (session) {
      setState({
        user: session as any,
        isLoading: false,
        isAuthenticating: false,
      });
      return;
    }

    if (/Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.assign(targetUrl);
      return;
    }

    if (idmWindowRef && !idmWindowRef.closed) {
      idmWindowRef.focus();
      setState({ isAuthenticating: false, idmWindowOpen: true });
      return;
    }

    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    idmWindowRef = window.open(targetUrl, 'KylrixID', `width=${width},height=${height},left=${left},top=${top}`);
    setState({ isAuthenticating: false, idmWindowOpen: true });
  }).catch(() => {
    setState({ isAuthenticating: false });
  });
}

export function closeIDMWindow() {
  if (idmWindowRef && !idmWindowRef.closed) {
    idmWindowRef.close();
  }
  idmWindowRef = null;
  setState({
    isAuthenticating: false,
    idmWindowOpen: false,
  });
}

export function shouldShowEmailVerificationReminder() {
  return !!state.user && !state.user.emailVerification && typeof window !== 'undefined' && localStorage.getItem('emailVerificationReminderDismissed') !== 'true';
}

export function dismissEmailVerificationReminder() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('emailVerificationReminderDismissed', 'true');
  }
}

export function onAuthSuccessFromAccounts(user: User) {
  setCurrentUserSnapshot(user as any);
  setKylrixPulse(user as any);
  setState({
    user,
    isLoading: false,
    isAuthenticating: false,
    idmWindowOpen: false,
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('message', async (event: MessageEvent) => {
    const expectedOrigin = `https://${APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN}.${APPWRITE_CONFIG.SYSTEM.DOMAIN}`;
    if (event.origin !== expectedOrigin) return;
    if (event.data?.type !== 'idm:auth-success') return;

    if (idmWindowRef && !idmWindowRef.closed) {
      idmWindowRef.close();
    }
    idmWindowRef = null;
    await refreshUser(true);
  });

  window.addEventListener('kylrix:note-current-user-changed', () => {
    const snapshot = getCurrentUserSnapshot();
    setState({
      user: snapshot as any,
      isLoading: false,
    });
  });
}
