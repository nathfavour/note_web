/* eslint-disable @typescript-eslint/no-unused-vars */
import { Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role, OAuthProvider, Realtime } from 'appwrite';
import type { Users, Notes, Tags, ApiKeys, Comments, Extensions, Reactions, Collaborators, ActivityLog, Settings } from '../types/appwrite';
import { APPWRITE_CONFIG } from './appwrite/config';

export const APPWRITE_ENDPOINT = APPWRITE_CONFIG.ENDPOINT;
export const APPWRITE_PROJECT_ID = APPWRITE_CONFIG.PROJECT_ID;
const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);
export const realtime = new Realtime(client);

type CurrentUserSnapshot = {
  user: Users;
  expiresAt: number;
};

let currentUserCache: CurrentUserSnapshot | null = null;
let currentUserInFlight: Promise<Users | null> | null = null;
const CURRENT_USER_CACHE_TTL = 5000;
const CURRENT_USER_CACHE_KEY = 'kylrix_note_current_user_v1';
const CURRENT_USER_EVENT = 'kylrix:note-current-user-changed';

export { client, ID, Query, Permission, Role, OAuthProvider };

// --- KYLRIX PULSE (ISOLATED INSTANT CACHE) ---
const PULSE_KEY = 'kylrix_pulse_v1';

export interface KylrixPulse {
    $id: string;
    name: string;
    profilePicId?: string | null;
    avatarBase64?: string | null;
}

export function getKylrixPulse(): KylrixPulse | null {
    if (typeof window === 'undefined') return null;
    if ((window as any).__KYLRIX_PULSE__) return (window as any).__KYLRIX_PULSE__;
    try {
        const raw = localStorage.getItem(PULSE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export function setKylrixPulse(user: any, avatarBase64?: string | null) {
    if (typeof window === 'undefined') return;
    try {
        const current = getKylrixPulse();
        const pulse: KylrixPulse = {
            $id: user.$id,
            name: user.name || user.username || 'User',
            profilePicId: user.prefs?.profilePicId || user.profilePicId || current?.profilePicId || null,
            avatarBase64: avatarBase64 || (current?.$id === user.$id ? current?.avatarBase64 : null)
        };
        localStorage.setItem(PULSE_KEY, JSON.stringify(pulse));
        (window as any).__KYLRIX_PULSE__ = pulse;
    } catch (e) {}
}

export function clearKylrixPulse() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PULSE_KEY);
    delete (window as any).__KYLRIX_PULSE__;
}

function canUseStorage() {
  return typeof window !== 'undefined';
}

function readCurrentUserSnapshot() {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrentUserSnapshot;
    if (!parsed?.user || parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(CURRENT_USER_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCurrentUserSnapshot(user: Users | null) {
  if (!canUseStorage()) return;
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_CACHE_KEY);
      window.dispatchEvent(new CustomEvent(CURRENT_USER_EVENT, { detail: null }));
      return;
    }
    localStorage.setItem(CURRENT_USER_CACHE_KEY, JSON.stringify({
      user,
      expiresAt: Date.now() + CURRENT_USER_CACHE_TTL,
    }));
    window.dispatchEvent(new CustomEvent(CURRENT_USER_EVENT, { detail: user }));
  } catch {
    // best effort
  }
}

function hydrateCurrentUserCache() {
  if (currentUserCache) return;
  const snapshot = readCurrentUserSnapshot();
  if (snapshot) currentUserCache = snapshot;
}

export function getCurrentUserSnapshot() {
  hydrateCurrentUserCache();
  return currentUserCache && currentUserCache.expiresAt > Date.now() ? currentUserCache.user : null;
}

export function onCurrentUserChanged(listener: (user: Users | null) => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<Users | null>;
    listener(customEvent.detail ?? null);
  };

  window.addEventListener(CURRENT_USER_EVENT, handler as EventListener);
  return () => window.removeEventListener(CURRENT_USER_EVENT, handler as EventListener);
}

export function setCurrentUserSnapshot(user: Users | null) {
  currentUserCache = user
    ? {
        user,
        expiresAt: Date.now() + CURRENT_USER_CACHE_TTL,
      }
    : null;
  writeCurrentUserSnapshot(user);
}

// --- DIRECT ACCOUNT FETCH ---
export async function getCurrentUser(force = false): Promise<Users | null> {
  if (!force) {
    hydrateCurrentUserCache();
    if (currentUserCache && currentUserCache.expiresAt > Date.now()) {
      return currentUserCache.user;
    }
    if (currentUserInFlight) {
      return currentUserInFlight;
    }
  } else {
    currentUserCache = null;
    currentUserInFlight = null;
  }

  currentUserInFlight = account.get()
    .then((user) => {
      currentUserCache = {
        user: user as unknown as Users,
        expiresAt: Date.now() + CURRENT_USER_CACHE_TTL,
      };
      writeCurrentUserSnapshot(user as unknown as Users);
      return user as unknown as Users;
    })
    .catch(() => {
      currentUserCache = null;
      writeCurrentUserSnapshot(null);
      return null;
    })
    .finally(() => {
      currentUserInFlight = null;
    });

  return currentUserInFlight;
}

export function invalidateCurrentUserCache() {
    currentUserCache = null;
    currentUserInFlight = null;
    writeCurrentUserSnapshot(null);
}

export class AppwriteService {
  static async getGlobalProfileStatus(userId: string) {
    try {
      const res = await databases.listDocuments('chat', 'profiles', [Query.equal('userId', userId), Query.limit(1)]);
      return { exists: res.total > 0, profile: res.documents[0] };
    } catch { return { exists: false }; }
  }
  static async createGhostNote(data: any) {
    return databases.createDocument(APPWRITE_CONFIG.DATABASES.NOTE, APPWRITE_CONFIG.TABLES.NOTE.NOTES, ID.unique(), {
      ...data, isPublic: true, status: 'published', createdAt: new Date().toISOString()
    }, [Permission.read(Role.any())]);
  }
}

// Re-add critical note helpers
export async function getNote(id: string) { return databases.getDocument(APPWRITE_CONFIG.DATABASES.NOTE, APPWRITE_CONFIG.TABLES.NOTE.NOTES, id); }
export async function createNote(data: any) { return databases.createDocument(APPWRITE_CONFIG.DATABASES.NOTE, APPWRITE_CONFIG.TABLES.NOTE.NOTES, ID.unique(), data); }
export async function updateNote(id: string, data: any) { return databases.updateDocument(APPWRITE_CONFIG.DATABASES.NOTE, APPWRITE_CONFIG.TABLES.NOTE.NOTES, id, data); }
export async function deleteNote(id: string) { return databases.deleteDocument(APPWRITE_CONFIG.DATABASES.NOTE, APPWRITE_CONFIG.TABLES.NOTE.NOTES, id); }

export default { client, account, databases, storage, getCurrentUser, AppwriteService };
