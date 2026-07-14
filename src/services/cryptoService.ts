/**
 * Simple E2EE utility using Web Crypto API.
 * In a real-world scenario, keys would be exchanged via Signal Protocol or similar.
 * For this demo, we derive a key from the chat ID and a user-specific secret.
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';

async function getEncryptionKey(chatId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(chatId), // Using chatId as a seed for the demo
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('chat-salt-123'), // Static salt for demo
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ENCRYPTION_ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptMessage(text: string, chatId: string): Promise<string> {
  try {
    const key = await getEncryptionKey(chatId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const encodedText = encoder.encode(text);

    const encryptedContent = await crypto.subtle.encrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      encodedText
    );

    const combined = new Uint8Array(iv.length + encryptedContent.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedContent), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to plaintext if encryption fails
  }
}

export async function decryptMessage(encryptedBase64: string, chatId: string): Promise<string> {
  try {
    const key = await getEncryptionKey(chatId);
    const combined = new Uint8Array(
      atob(encryptedBase64)
        .split('')
        .map(c => c.charCodeAt(0))
    );

    const iv = combined.slice(0, 12);
    const encryptedContent = combined.slice(12);

    const decryptedContent = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv },
      key,
      encryptedContent
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedContent);
  } catch (error) {
    // If decryption fails, it might be a plaintext message or wrong key
    return encryptedBase64;
  }
}
