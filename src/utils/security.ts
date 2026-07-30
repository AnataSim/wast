/**
 * WAST Security Module — Enterprise-Grade Payload Encryption & Request Authentication
 * 
 * Includes:
 * 1. AES-256-GCM Payload Encryption & Decryption (Galois/Counter Mode with 128-bit auth tag)
 * 2. HMAC-SHA256 Request Authentication (HMAC signatures for request integrity & non-repudiation)
 */

const DEFAULT_SECRET = import.meta.env.VITE_SECURITY_SECRET || 'WAST_SECURE_PAYLOAD_KEY_2026_AES256GCM_HMAC256';

/**
 * Derives a 256-bit AES-GCM CryptoKey from a secret string using SHA-256 hashing.
 */
async function getAESKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secretBuffer = enc.encode(secret);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', secretBuffer);

  return await window.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives an HMAC-SHA256 CryptoKey from a secret string.
 */
async function getHMACKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secretBuffer = enc.encode(secret);

  return await window.crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign', 'verify']
  );
}

/**
 * Helper: ArrayBuffer to Base64
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper: Base64 to ArrayBuffer
 */
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Helper: ArrayBuffer to Hex String
 */
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export interface EncryptedPayload {
  algorithm: 'AES-256-GCM';
  iv: string; // Base64 96-bit IV
  ciphertext: string; // Base64 Ciphertext with embedded GCM auth tag
  timestamp: number;
}

/**
 * Encrypts arbitrary data using AES-256-GCM (Authenticated Encryption).
 * 
 * @param data Data object, array, or string to encrypt
 * @param secret Optional custom secret passphrase
 */
export async function encryptPayloadAES256GCM(
  data: any,
  secret?: string
): Promise<EncryptedPayload> {
  const key = await getAESKey(secret);
  const enc = new TextEncoder();
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  const plaintext = enc.encode(jsonStr);

  // 12-byte (96-bit) IV as recommended by NIST for AES-GCM
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128, // 128-bit authentication tag
    },
    key,
    plaintext
  );

  return {
    algorithm: 'AES-256-GCM',
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
    timestamp: Date.now(),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted payload and verifies its authentication tag.
 * 
 * @param payload Encrypted payload container
 * @param secret Optional custom secret passphrase
 */
export async function decryptPayloadAES256GCM<T = any>(
  payload: EncryptedPayload,
  secret?: string
): Promise<T> {
  if (payload.algorithm !== 'AES-256-GCM') {
    throw new Error(`Unsupported encryption algorithm: ${payload.algorithm}`);
  }

  const key = await getAESKey(secret);
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128,
    },
    key,
    ciphertext
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    return jsonStr as unknown as T;
  }
}

export interface AuthenticatedHeaders {
  'X-HMAC-Signature': string;
  'X-Timestamp': string;
  'X-Nonce': string;
  'X-Algorithm': 'HMAC-SHA256';
}

/**
 * Generates an HMAC-SHA256 signature for data verification.
 * 
 * @param message Message or serialized payload to sign
 * @param secret Optional custom secret passphrase
 */
export async function generateHMACSignature(
  message: string,
  secret?: string
): Promise<string> {
  const key = await getHMACKey(secret);
  const enc = new TextEncoder();
  const data = enc.encode(message);

  const signatureBuffer = await window.crypto.subtle.sign('HMAC', key, data);
  return bufferToHex(signatureBuffer);
}

/**
 * Verifies an HMAC-SHA256 signature against payload data.
 * 
 * @param message Message or serialized payload
 * @param signature Hex signature string to verify
 * @param secret Optional custom secret passphrase
 */
export async function verifyHMACSignature(
  message: string,
  signature: string,
  secret?: string
): Promise<boolean> {
  const expectedSignature = await generateHMACSignature(message, secret);
  return expectedSignature.toLowerCase() === signature.toLowerCase();
}

/**
 * Generates authenticated request headers containing HMAC-SHA256 signature,
 * timestamp, and random nonce to prevent replay attacks.
 * 
 * @param payload Object or string payload being sent
 * @param secret Optional custom secret passphrase
 */
export async function createAuthenticatedHeaders(
  payload: any,
  secret?: string
): Promise<AuthenticatedHeaders> {
  const timestamp = Date.now().toString();
  const nonce = window.crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
  const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);

  // Combine timestamp + nonce + payload into signed message string
  const signatureInput = `${timestamp}.${nonce}.${jsonStr}`;
  const signature = await generateHMACSignature(signatureInput, secret);

  return {
    'X-HMAC-Signature': signature,
    'X-Timestamp': timestamp,
    'X-Nonce': nonce,
    'X-Algorithm': 'HMAC-SHA256',
  };
}
