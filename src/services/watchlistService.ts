import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { WatchlistItem } from '../types/watchlist';
import { 
  encryptPayloadAES256GCM, 
  decryptPayloadAES256GCM, 
  createAuthenticatedHeaders, 
  verifyHMACSignature,
  type EncryptedPayload,
  type AuthenticatedHeaders
} from '../utils/security';

// Get reference to user's watchlist subcollection
const getUserWatchlistCollection = (userId: string) => {
  return collection(db, 'users', userId, 'watchlist');
};

export const subscribeToWatchlist = (
  userId: string, 
  onData: (items: WatchlistItem[]) => void,
  onError?: (err: Error) => void
) => {
  try {
    const colRef = getUserWatchlistCollection(userId);
    const q = query(colRef, orderBy('updatedAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const items: WatchlistItem[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        // Remove internal security metadata fields when hydrating WatchlistItem
        const { _securityHeaders, _encryptedBackup, ...cleanItem } = raw;
        items.push({ id: docSnap.id, ...cleanItem } as WatchlistItem);
      });
      onData(items);
    }, (error) => {
      console.warn('Firestore subscription error (fallback to local mode if demo config):', error);
      if (onError) onError(error);
    });
  } catch (err: any) {
    console.warn('Firestore subscription exception:', err);
    if (onError) onError(err);
    return () => {};
  }
};

/**
 * Saves a watchlist item to Firestore, attaching HMAC-SHA256 request authentication
 * headers and an AES-256-GCM encrypted payload backup for high-security environments.
 */
export const saveWatchlistItemToFirestore = async (userId: string, item: WatchlistItem) => {
  const docRef = doc(db, 'users', userId, 'watchlist', item.id);

  // Generate HMAC-SHA256 request authentication headers
  const securityHeaders: AuthenticatedHeaders = await createAuthenticatedHeaders(item);

  // Generate AES-256-GCM encrypted payload backup
  const encryptedBackup: EncryptedPayload = await encryptPayloadAES256GCM(item);

  const rawPayload = {
    ...item,
    _securityHeaders: securityHeaders,
    _encryptedBackup: encryptedBackup,
  };

  // Remove any keys with undefined values to prevent Firestore 'Unsupported field value: undefined' errors
  const payloadToSave = JSON.parse(JSON.stringify(rawPayload));

  await setDoc(docRef, payloadToSave, { merge: true });
};

export const deleteWatchlistItemFromFirestore = async (userId: string, itemId: string) => {
  const docRef = doc(db, 'users', userId, 'watchlist', itemId);
  await deleteDoc(docRef);
};

export { encryptPayloadAES256GCM, decryptPayloadAES256GCM, createAuthenticatedHeaders, verifyHMACSignature };

