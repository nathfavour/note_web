/* eslint-disable @typescript-eslint/no-unused-vars */
import { Client, Account, Databases, Storage, Functions, ID, Query, Permission, Role, OAuthProvider, Realtime } from 'appwrite';
import type {
  Users,
  Notes,
  Tags,
  ApiKeys,
  Comments,
  Extensions,
  Reactions,
  Collaborators,
  ActivityLog,
  Settings,
} from '../types/appwrite';
import { TargetType } from '../types/appwrite';

import { APPWRITE_CONFIG } from './appwrite/config';
import { KYLRIX_AUTH_URI, getEcosystemUrl } from '@/constants/ecosystem';
import { ecosystemSecurity } from './ecosystem/security';
import { sendKylrixEmailNotification } from './email-notifications';

export const APPWRITE_ENDPOINT = APPWRITE_CONFIG.ENDPOINT;
export const APPWRITE_PROJECT_ID = APPWRITE_CONFIG.PROJECT_ID;
const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const functions = new Functions(client);
const realtime = new Realtime(client);

// export app public uri
 export const APP_URI = process.env.NEXT_PUBLIC_APP_URI ?? `https://app.${APPWRITE_CONFIG.SYSTEM.DOMAIN}`;

// Appwrite config IDs from constants
export const APPWRITE_DATABASE_ID = APPWRITE_CONFIG.DATABASES.NOTE;
export const APPWRITE_TABLE_ID_PROFILES = APPWRITE_CONFIG.TABLES.CHAT.PROFILES;
export const APPWRITE_TABLE_ID_USERS = APPWRITE_TABLE_ID_PROFILES; // legacy alias
export const APPWRITE_TABLE_ID_NOTES = APPWRITE_CONFIG.TABLES.NOTE.NOTES;
export const APPWRITE_TABLE_ID_TAGS = APPWRITE_CONFIG.TABLES.NOTE.TAGS;
export const APPWRITE_TABLE_ID_APIKEYS = APPWRITE_CONFIG.TABLES.NOTE.APIKEYS;
export const APPWRITE_TABLE_ID_COMMENTS = APPWRITE_CONFIG.TABLES.NOTE.COMMENTS;
export const APPWRITE_TABLE_ID_EXTENSIONS = APPWRITE_CONFIG.TABLES.NOTE.EXTENSIONS;
export const APPWRITE_TABLE_ID_REACTIONS = APPWRITE_CONFIG.TABLES.NOTE.REACTIONS;
export const APPWRITE_TABLE_ID_COLLABORATORS = APPWRITE_CONFIG.TABLES.NOTE.COLLABORATORS;
export const APPWRITE_TABLE_ID_ACTIVITYLOG = APPWRITE_CONFIG.TABLES.NOTE.ACTIVITY_LOG;
export const APPWRITE_TABLE_ID_SETTINGS = APPWRITE_CONFIG.TABLES.NOTE.SETTINGS;
export const APPWRITE_TABLE_ID_SUBSCRIPTIONS = APPWRITE_CONFIG.TABLES.NOTE.SUBSCRIPTIONS;
export const APPWRITE_TABLE_ID_NOTETAGS = APPWRITE_CONFIG.TABLES.NOTE.NOTE_TAGS;

// Ecosystem: Kylrix Flow
export const FLOW_DATABASE_ID = APPWRITE_CONFIG.DATABASES.FLOW;
export const FLOW_COLLECTION_ID_TASKS = APPWRITE_CONFIG.TABLES.FLOW.TASKS;
export const FLOW_COLLECTION_ID_EVENTS = APPWRITE_CONFIG.TABLES.FLOW.EVENTS;

// Ecosystem: Kylrix Vault
export const KEEP_DATABASE_ID = APPWRITE_CONFIG.DATABASES.VAULT;
export const KEEP_COLLECTION_ID_CREDENTIALS = APPWRITE_CONFIG.TABLES.VAULT.CREDENTIALS;
export const KEEP_COLLECTION_ID_KEYCHAIN = APPWRITE_CONFIG.TABLES.VAULT.KEYCHAIN;

// Ecosystem: Kylrix Connect
export const CONNECT_DATABASE_ID = APPWRITE_CONFIG.DATABASES.CHAT;
export const CONNECT_COLLECTION_ID_USERS = APPWRITE_CONFIG.TABLES.CHAT.PROFILES;

export const APPWRITE_BUCKET_PROFILE_PICTURES = APPWRITE_CONFIG.BUCKETS.PROFILE_PICTURES;
export const APPWRITE_BUCKET_NOTES_ATTACHMENTS = APPWRITE_CONFIG.BUCKETS.NOTES_ATTACHMENTS;
export const APPWRITE_BUCKET_EXTENSION_ASSETS = APPWRITE_CONFIG.BUCKETS.EXTENSION_ASSETS;
export const APPWRITE_BUCKET_BACKUPS = APPWRITE_CONFIG.BUCKETS.BACKUPS;
export const APPWRITE_BUCKET_TEMP_UPLOADS = APPWRITE_CONFIG.BUCKETS.TEMP_UPLOADS;

export { client, account, databases, storage, functions, ID, Query, Permission, Role, OAuthProvider, realtime };

// --- KYLRIX PULSE (NEW ISOLATED CACHE) ---

const PULSE_KEY = 'kylrix_pulse_v1';

export interface KylrixPulse {
    $id: string;
    name: string;
    avatarBase64?: string | null;
    profilePicId?: string | null;
}

export function getKylrixPulse(): KylrixPulse | null {
    if (typeof window === 'undefined') return null;
    if ((window as any).__KYLRIX_PULSE__) return (window as any).__KYLRIX_PULSE__;
    
    try {
        const raw = localStorage.getItem(PULSE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
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
    } catch (e) {
        console.warn('[Pulse] Quota exceeded or storage failure');
    }
}

export function clearKylrixPulse() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(PULSE_KEY);
    delete (window as any).__KYLRIX_PULSE__;
    document.documentElement.removeAttribute('data-kylrix-pulse');
}

// --- INSTANT UNDERGROUND FETCH ---
export const globalSessionPromise = typeof window !== 'undefined' 
    ? account.get().catch(() => null) 
    : Promise.resolve(null);

export async function getCurrentUser(force = false): Promise<Users | null> {
  if (force) {
    return account.get().then(u => u as unknown as Users).catch(() => null);
  }
  return (await globalSessionPromise) as unknown as Users | null;
}

export function getCurrentUserSnapshot() {
  return getKylrixPulse();
}

export function invalidateCurrentUserCache() {
  clearKylrixPulse();
}

export async function resolveCurrentUser(req?: { headers: { get(k: string): string | null } } | null): Promise<Users | null> {
  const direct = await getCurrentUser();
  if (direct && direct.$id) return direct;
  if (req) {
    const fallback = await getCurrentUserFromRequest(req as any);
    if (fallback && (fallback as any).$id) return fallback;
  }
  return null;
}

export async function getCurrentUserFromRequest(req: { headers: { get(k: string): string | null } } | null | undefined): Promise<Users | null> {
  try {
    if (!req) return null;
    const cookieHeader = req.headers.get('cookie') || req.headers.get('Cookie');
    if (!cookieHeader) return null;
    const res = await fetch(`${APPWRITE_ENDPOINT}/account`, {
      method: 'GET',
      headers: {
        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
        'Cookie': cookieHeader,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || typeof data !== 'object' || !data.$id) return null;
    return data as Users;
  } catch (e: any) {
    return null;
  }
}

type PermissionUpdateAction = 'grant' | 'revoke';
type NoteCollaboratorPermission = 'read' | 'write' | 'admin';

async function updateNoteAccessForUser(
  noteId: string,
  targetUserId: string,
  permission: NoteCollaboratorPermission,
  action: PermissionUpdateAction = 'grant'
) {
  const jwt = await account.createJWT();
  const response = await fetch(`${KYLRIX_AUTH_URI}/api/permissions`, {
    method: action === 'grant' ? 'POST' : 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt.jwt}`,
    },
    body: JSON.stringify({
      databaseId: APPWRITE_DATABASE_ID,
      tableId: APPWRITE_TABLE_ID_NOTES,
      rowId: noteId,
      targetUserIds: [targetUserId],
      permission,
      action,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update note permissions');
  }

  return response.json().catch(() => ({}));
}

async function notifyNoteShare(params: {
  noteId: string;
  noteTitle: string;
  actorName: string;
  recipientId: string;
  permission: NoteCollaboratorPermission;
}) {
  await sendKylrixEmailNotification({
    eventType: 'note_collaborator_added',
    sourceApp: 'note',
    verificationMode: 'error',
    actorName: params.actorName,
    recipientIds: [params.recipientId],
    resourceId: params.noteId,
    resourceTitle: params.noteTitle,
    resourceType: 'note',
    rightsLabel: params.permission,
    templateKey: 'note:collaborator-added',
    ctaUrl: `${APP_URI}/notes/${params.noteId}`,
    ctaText: 'Open note',
  });
}

export class AppwriteService {
  static async getGlobalProfileStatus(userId: string) {
    try {
      const res = await databases.listDocuments(CONNECT_DATABASE_ID, CONNECT_COLLECTION_ID_USERS, [
        Query.equal('userId', userId),
        Query.limit(1)
      ]);
      if (res.total > 0) {
        return { exists: true, profile: res.documents[0] };
      }
      return { exists: false, error: 'Not Found' };
    } catch (e: unknown) {
      return { exists: false, error: (e as any).message };
    }
  }

  static async hasMasterpass(userId: string): Promise<boolean> {
    try {
      const res = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TABLE_ID_USERS,
        [Query.equal('userId', userId), Query.limit(1)]
      );
      if (res.total > 0 && res.documents[0].hasMasterpass) {
        return true;
      }
      const entries = await this.listKeychainEntries(userId);
      return entries.some(e => e.type === 'password');
    } catch (e: any) {
      console.error('hasMasterpass error', e);
      return false;
    }
  }

  static async listKeychainEntries(userId: string): Promise<any[]> {
    try {
      const response = await databases.listDocuments(
        KEEP_DATABASE_ID,
        KEEP_COLLECTION_ID_KEYCHAIN,
        [Query.equal("userId", userId)],
      );
      return response.documents;
    } catch (e: any) {
      console.error('listKeychainEntries error', e);
      return [];
    }
  }

  static async createKeychainEntry(data: any): Promise<any> {
    return await databases.createDocument(
      KEEP_DATABASE_ID,
      KEEP_COLLECTION_ID_KEYCHAIN,
      ID.unique(),
      data
    );
  }

  /**
   * Create a Ghost Note (Anonymous)
   */
  static async createGhostNote(data: { title: string; content: string; format?: string; ghostSecret: string; expiresAt?: string; isEncrypted?: boolean }): Promise<any> {
    const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const metadata = JSON.stringify({
      isGhost: true,
      ghostSecret: data.ghostSecret,
      expiresAt: expiresAt,
      version: 'v2',
      isEncrypted: data.isEncrypted || false
    });

    const noteData = {
      title: data.title,
      content: data.content,
      format: data.format || 'markdown',
      isPublic: true,
      userId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'published',
      metadata: metadata,
      tags: [],
      comments: [],
      extensions: [],
      collaborators: [],
      attachments: null
    };

    return await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_TABLE_ID_NOTES,
      ID.unique(),
      noteData,
      [
        Permission.read(Role.any()),
      ]
    );
  }
}

// Minimal reconstruction of other note exports to prevent breakage
export function hydrateVirtualAttributes(doc: any) { return doc; }
export async function getNote(id: string) { return databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID_NOTES, id); }
export async function createNote(data: any) { return databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID_NOTES, ID.unique(), data); }
export async function updateNote(id: string, data: any) { return databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID_NOTES, id, data); }
export async function deleteNote(id: string) { return databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_TABLE_ID_NOTES, id); }

export function filterNoteData(data: any) {
    const clean = { ...data };
    delete clean.$id;
    delete clean.$createdAt;
    delete clean.$updatedAt;
    delete clean.$permissions;
    delete clean.$databaseId;
    delete clean.$collectionId;
    return clean;
}

// Ecosystem: Flow
export async function listFlowTasks(queries: any[] = []) {
  return databases.listDocuments(FLOW_DATABASE_ID, FLOW_COLLECTION_ID_TASKS, queries);
}

export async function listFlowEvents(queries: any[] = []) {
  return databases.listDocuments(FLOW_DATABASE_ID, FLOW_COLLECTION_ID_EVENTS, queries);
}

// Ecosystem: Keep
export async function listKeepCredentials(queries: any[] = []) {
  return databases.listDocuments(KEEP_DATABASE_ID, KEEP_COLLECTION_ID_CREDENTIALS, queries);
}

const appwrite = {
    client,
    account,
    databases,
    storage,
    getCurrentUser,
    AppwriteService,
    createNote,
    getNote,
    updateNote,
    deleteNote,
    // Add other missing ones as needed
};

export default appwrite;
