import type { Notes } from '@/types/appwrite';
import { validatePublicNoteAccess } from '@/lib/appwrite';
import { ecosystemSecurity } from '@/lib/ecosystem/security';
import { decryptGhostData } from '@/lib/encryption/ghost-crypto';

export class SharedNoteRouteError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'SharedNoteRouteError';
  }
}

function parseSharedNoteMeta(note: Notes) {
  try {
    return JSON.parse(note.metadata || '{}') as Record<string, any>;
  } catch {
    return {};
  }
}

function decodeUrlSafeBase64ToBuffer(key: string): Uint8Array {
  const normalized = key.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getWebCrypto(): Crypto {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new SharedNoteRouteError('Web crypto is unavailable in this runtime.', 'WebCryptoUnavailable');
  }
  return cryptoApi;
}

async function decryptT4Note(note: Notes, key: string, meta: Record<string, any>): Promise<Notes> {
  const cryptoApi = getWebCrypto();
  const keyBytes = decodeUrlSafeBase64ToBuffer(key);
  const cryptoKey = await cryptoApi.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  return {
    ...note,
    title: await ecosystemSecurity.decryptWithKey(meta.encryptedTitle || note.title || '', cryptoKey),
    content: await ecosystemSecurity.decryptWithKey(note.content || '', cryptoKey),
    metadata: JSON.stringify({ ...meta, clientDecrypted: true }),
  };
}

async function decryptGhostNote(note: Notes, key: string, meta: Record<string, any>): Promise<Notes> {
  return {
    ...note,
    title: await decryptGhostData(note.title || '', key),
    content: await decryptGhostData(note.content || '', key),
    metadata: JSON.stringify({ ...meta, clientDecrypted: true }),
  };
}

export async function loadSharedNote(noteId: string, key?: string): Promise<Notes> {
  const note = await validatePublicNoteAccess(noteId);
  if (!note) {
    throw new SharedNoteRouteError('This shared note could not be found or is no longer public.', 'SharedNoteNotFound');
  }

  const meta = parseSharedNoteMeta(note);
  const isT4Encrypted = Boolean(meta.isEncrypted && meta.encryptionVersion === 'T4');
  const isGhostNote = Boolean(meta.isGhost);
  const requiresKey = isT4Encrypted || isGhostNote;

  if (!requiresKey) {
    return {
      ...note,
      metadata: JSON.stringify({ ...meta, clientDecrypted: true }),
    };
  }

  if (!key) {
    throw new SharedNoteRouteError('This note is encrypted and requires a decryption key. Ask the sender to resend the full shared link.', 'SharedNoteMissingKey');
  }

  try {
    return isT4Encrypted
      ? await decryptT4Note(note, key, meta)
      : await decryptGhostNote(note, key, meta);
  } catch (error) {
    if (error instanceof SharedNoteRouteError) throw error;
    throw new SharedNoteRouteError('Failed to decrypt shared note. The link may be invalid or tampered with.', 'SharedNoteDecryptionFailed');
  }
}
