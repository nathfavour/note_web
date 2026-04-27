'use client';

import { account, clearKylrixPulse, getCurrentUserSnapshot, getCurrentUser, invalidateCurrentUserCache, setCurrentUserSnapshot, setKylrixPulse } from '@/lib/appwrite';
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

let state: AuthState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAuthenticating: false,
  idmWindowOpen: false,
};

const listeners = new Set<Listener>();
let initialized = false;
let idmWindowRef: Window | null = null;
let silentCheckInFlight: Promise<void> | null = null;
let currentUserEventHandlersRegistered = false;
let isApplyingCurrentUserSnapshot = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<AuthState>) {
  const nextUser = patch.user !== undefined ? patch.user : state.user;
  state = {
    ...state,
    ...patch,
    isAuthenticated: patch.isAuthenticated ?? !!nextUser,
  };
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
  return state;
}

function registerCurrentUserEventListeners() {
  if (!canUseWindow() || currentUserEventHandlersRegistered) return;
  currentUserEventHandlersRegistered = true;

  const handleCurrentUserChange = (event: Event) => {
    if (isApplyingCurrentUserSnapshot) return;
    const customEvent = event as CustomEvent<User | null>;
    const nextUser = customEvent.detail === undefined ? getCurrentUserSnapshot() : customEvent.detail;
    applyCurrentUserState(nextUser ?? null, false);
  };

  window.addEventListener('kylrix:note-current-user-changed', handleCurrentUserChange as EventListener);
  window.addEventListener('kylrix:vault-current-user-changed', handleCurrentUserChange as EventListener);
}

export async function refreshUser(force = false): Promise<User | null> {
  try {
    if (force) {
      invalidateCurrentUserCache(false);
    }
    const session = await account.get();
    if (session) {
      applyCurrentUserState(session as any, true);
      return session as any;
    }

    applyCurrentUserState(null, true);
    return null;
  } catch {
    applyCurrentUserState(null, true);
    return null;
  }
}

function applyCurrentUserState(user: User | null, emitEvents: boolean) {
  if (emitEvents) {
    isApplyingCurrentUserSnapshot = true;
  }

  try {
    if (user) {
      setCurrentUserSnapshot(user as any, emitEvents);
      setKylrixPulse(user as any);
    } else {
      invalidateCurrentUserCache(emitEvents);
      clearKylrixPulse();
    }
  } finally {
    if (emitEvents) {
      isApplyingCurrentUserSnapshot = false;
    }
  }

  setState({
    user,
    isLoading: false,
    isAuthenticating: false,
    idmWindowOpen: false,
    isAuthenticated: !!user,
  });
}

async function attemptSilentAuth(): Promise<void> {
  if (!canUseWindow()) return;
  if (!document.body) return;
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
  registerCurrentUserEventListeners();

  const snapshot = getCurrentUserSnapshot();
  if (snapshot) {
    applyCurrentUserState(snapshot as any, false);
    return;
  }

  setState({ isLoading: true });
  const session = await refreshUser();
  if (!session) await attemptSilentAuth();
}

export function login(user: User) {
  applyCurrentUserState(user, true);
}

export async function logout() {
  try {
    await account.deleteSession('current');
  } finally {
    idmWindowRef?.close?.();
    idmWindowRef = null;
    applyCurrentUserState(null, true);
  }
}

export function openIDMWindow(pathname: string) {
  if (!canUseWindow()) return;
  if (state.isAuthenticating) return;

  const localSession = getCurrentUserSnapshot();
  if (localSession) {
    applyCurrentUserState(localSession as any, false);
    return;
  }

  setState({ isAuthenticating: true });

  const authSubdomain = process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN || APPWRITE_CONFIG.SYSTEM.AUTH_SUBDOMAIN;
  const domain = process.env.NEXT_PUBLIC_DOMAIN || APPWRITE_CONFIG.SYSTEM.DOMAIN;
  const targetUrl = `https://${authSubdomain}.${domain}/login?source=${encodeURIComponent(window.location.origin + pathname)}`;

  void attemptSilentAuth().then(() => {
    const session = getCurrentUserSnapshot();
    if (session) {
      applyCurrentUserState(session as any, false);
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
  setState({ isAuthenticating: false, idmWindowOpen: false });
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
  applyCurrentUserState(user, true);
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
}
