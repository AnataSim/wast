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
        items.push({ id: docSnap.id, ...docSnap.data() } as WatchlistItem);
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

export const saveWatchlistItemToFirestore = async (userId: string, item: WatchlistItem) => {
  const docRef = doc(db, 'users', userId, 'watchlist', item.id);
  await setDoc(docRef, item, { merge: true });
};

export const deleteWatchlistItemFromFirestore = async (userId: string, itemId: string) => {
  const docRef = doc(db, 'users', userId, 'watchlist', itemId);
  await deleteDoc(docRef);
};
