const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // GCM recommended IV length
const TAG_LENGTH = 16;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromBase64Url(value: string): Uint8Array {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getWebCrypto(): Crypto {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi?.subtle) {
        throw new Error('Web Crypto is not available in this environment.');
    }
    return cryptoApi;
}

/**
 * Encrypts a string using a provided or randomly generated key.
 * Returns the encrypted data (URL-safe base64) and the key (URL-safe base64).
 */
export async function encryptGhostData(text: string, providedKey?: string): Promise<{ encrypted: string; key: string }> {
    const cryptoApi = getWebCrypto();
    const keyBytes = providedKey ? fromBase64Url(providedKey) : cryptoApi.getRandomValues(new Uint8Array(32));
    const iv = cryptoApi.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await cryptoApi.subtle.importKey('raw', keyBytes, ALGORITHM, false, ['encrypt']);
    const encryptedBuffer = await cryptoApi.subtle.encrypt({ name: ALGORITHM, iv, tagLength: 128 }, key, textEncoder.encode(text));
    const encryptedBytes = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - TAG_LENGTH);
    const authTag = encryptedBytes.slice(encryptedBytes.length - TAG_LENGTH);

    return {
        encrypted: `${toBase64Url(iv)}.${toBase64Url(ciphertext)}.${toBase64Url(authTag)}`,
        key: toBase64Url(keyBytes)
    };
}

/**
 * Decrypts a string using the provided URL-safe base64 key.
 */
export async function decryptGhostData(encryptedData: string, keyBase64: string): Promise<string> {
    try {
        const [ivBase64, encrypted, authTagBase64] = encryptedData.split('.');
        if (!ivBase64 || !encrypted || !authTagBase64) {
            throw new Error('Invalid encrypted data format');
        }

        const cryptoApi = getWebCrypto();
        const keyBytes = fromBase64Url(keyBase64);
        const iv = fromBase64Url(ivBase64);
        const ciphertext = fromBase64Url(encrypted);
        const authTag = fromBase64Url(authTagBase64);
        const payload = new Uint8Array(ciphertext.length + authTag.length);
        payload.set(ciphertext, 0);
        payload.set(authTag, ciphertext.length);
        const key = await cryptoApi.subtle.importKey('raw', keyBytes, ALGORITHM, false, ['decrypt']);
        const decryptedBuffer = await cryptoApi.subtle.decrypt({ name: ALGORITHM, iv, tagLength: 128 }, key, payload);
        return textDecoder.decode(decryptedBuffer);
    } catch (e) {
        console.error('[GhostCrypto] Decryption failed:', e);
        throw new Error('Failed to decrypt spark. The key may be invalid.');
    }
}
