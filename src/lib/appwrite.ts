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

// --- DIRECT ACCOUNT FETCH ---
export const globalSessionPromise = typeof window !== 'undefined' 
    ? account.get().catch(() => null) 
    : Promise.resolve(null);

export async function getCurrentUser(): Promise<Users | null> {
  return (await globalSessionPromise) as unknown as Users | null;
}

export function invalidateCurrentUserCache() {
    clearKylrixPulse();
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
