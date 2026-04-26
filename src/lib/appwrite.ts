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

// --- DIRECT ACCOUNT FETCH ---
export async function getCurrentUser(): Promise<Users | null> {
  try {
    const user = await account.get();
    return user as unknown as Users;
  } catch {
    return null;
  }
}

export function invalidateCurrentUserCache() {
    // No-op
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
