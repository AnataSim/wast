import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { User } from 'firebase/auth';
import type { WatchlistItem } from '../types/watchlist';

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromUsername: string;
  fromPhotoURL?: string | null;
  toUid: string;
  toUsername: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendUser {
  uid: string;
  username: string;
  photoURL?: string | null;
  bannerURL?: string | null;
  addedAt: string;
}

export interface FriendProfileData {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  bannerURL?: string | null;
  stats?: {
    totalItems: number;
    animeCount: number;
    mangaCount: number;
    watchingCount: number;
    completedCount: number;
  };
}

/**
 * Sends a friend invitation to a target username.
 */
export const sendFriendInvitation = async (
  fromUser: User, 
  targetUsername: string
): Promise<void> => {
  const cleanTarget = targetUsername.trim().toLowerCase();
  if (!cleanTarget) throw new Error('Masukkan username yang valid.');

  let targetUid = '';
  let targetDisplayName = targetUsername.trim();

  // 1. Check if target username exists in 'usernames' collection
  const usernameDocRef = doc(db, 'usernames', cleanTarget);
  const usernameSnap = await getDoc(usernameDocRef);

  if (usernameSnap.exists()) {
    const targetData = usernameSnap.data();
    targetUid = targetData.uid || cleanTarget;
    targetDisplayName = targetData.displayName || targetDisplayName;
  } else {
    // 2. Fallback search in 'users' collection
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      let found: any = null;
      usersSnap.forEach((d) => {
        const data = d.data();
        const name = (data.displayName || data.email?.split('@')[0] || '').toLowerCase();
        if (name === cleanTarget || d.id === cleanTarget) {
          found = { uid: d.id, displayName: data.displayName || targetDisplayName };
        }
      });

      if (found) {
        targetUid = found.uid;
        targetDisplayName = found.displayName;
      } else {
        // Dynamic target UID fallback
        targetUid = `uid_${cleanTarget}`;
      }
    } catch (e) {
      targetUid = `uid_${cleanTarget}`;
    }

    // Auto-heal/seed missing document in 'usernames' collection
    setDoc(doc(db, 'usernames', cleanTarget), {
      uid: targetUid,
      displayName: targetDisplayName,
      updatedAt: new Date().toISOString()
    }, { merge: true }).catch(console.warn);
  }

  if (targetUid === fromUser.uid) {
    throw new Error('Kamu tidak dapat mengirim undangan ke diri sendiri.');
  }

  // 3. Check if already friends
  const friendDocRef = doc(db, 'users', fromUser.uid, 'friends', targetUid);
  const friendSnap = await getDoc(friendDocRef);
  if (friendSnap.exists()) {
    throw new Error(`Kamu sudah berteman dengan "${targetDisplayName}".`);
  }

  // 4. Check for existing pending request
  const requestsCol = collection(db, 'friend_requests');
  const existingReqQuery = query(
    requestsCol, 
    where('fromUid', '==', fromUser.uid),
    where('toUid', '==', targetUid),
    where('status', '==', 'pending')
  );
  const existingSnap = await getDocs(existingReqQuery);
  if (!existingSnap.empty) {
    throw new Error(`Undangan pertemanan ke "${targetDisplayName}" sudah dikirim sebelumnya.`);
  }

  // 5. Create new friend request
  const requestId = `${fromUser.uid}_${targetUid}`;
  const myPhoto = fromUser.photoURL || localStorage.getItem(`user_photo_${fromUser.uid}`);
  const myName = fromUser.displayName || fromUser.email?.split('@')[0] || 'User';

  const newRequest: Omit<FriendRequest, 'id'> = {
    fromUid: fromUser.uid,
    fromUsername: myName,
    fromPhotoURL: myPhoto || null,
    toUid: targetUid,
    toUsername: targetDisplayName,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'friend_requests', requestId), newRequest);
};

/**
 * Real-time subscription to incoming pending friend invitations.
 */
export const subscribeToIncomingRequests = (
  userOrUid: User | string, 
  onData: (requests: FriendRequest[]) => void
) => {
  const uid = typeof userOrUid === 'string' ? userOrUid : userOrUid.uid;
  const usernameClean = (typeof userOrUid === 'string' ? '' : userOrUid.displayName || '').trim().toLowerCase();
  const requestsCol = collection(db, 'friend_requests');

  return onSnapshot(requestsCol, (snapshot) => {
    const list: FriendRequest[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.status === 'pending') {
        const toUidMatch = data.toUid === uid;
        const toNameMatch = usernameClean && data.toUsername && data.toUsername.trim().toLowerCase() === usernameClean;
        const toUidCleanMatch = usernameClean && (data.toUid === `uid_${usernameClean}` || data.toUid === usernameClean);

        if (toUidMatch || toNameMatch || toUidCleanMatch) {
          list.push({ id: d.id, ...data } as FriendRequest);
        }
      }
    });
    onData(list);
  }, (err) => console.warn('Gagal memuat undangan pertemanan:', err));
};

/**
 * Real-time subscription to user's accepted friends list.
 */
export const subscribeToFriendsList = (
  uid: string,
  onData: (friends: FriendUser[]) => void
) => {
  const friendsCol = collection(db, 'users', uid, 'friends');

  return onSnapshot(friendsCol, (snapshot) => {
    const list: FriendUser[] = [];
    snapshot.forEach((d) => {
      list.push({ uid: d.id, ...d.data() } as FriendUser);
    });
    onData(list);
  }, (err) => console.warn('Gagal memuat daftar teman:', err));
};

/**
 * Accepts a friend invitation.
 */
export const acceptFriendInvitation = async (
  currentUser: User,
  request: FriendRequest
): Promise<void> => {
  const now = new Date().toISOString();
  const myPhoto = currentUser.photoURL || localStorage.getItem(`user_photo_${currentUser.uid}`);
  const myName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';

  // 1. Add sender to recipient's friends subcollection
  await setDoc(doc(db, 'users', currentUser.uid, 'friends', request.fromUid), {
    uid: request.fromUid,
    username: request.fromUsername,
    photoURL: request.fromPhotoURL || null,
    addedAt: now,
  });

  // 2. Add recipient to sender's friends subcollection
  await setDoc(doc(db, 'users', request.fromUid, 'friends', currentUser.uid), {
    uid: currentUser.uid,
    username: myName,
    photoURL: myPhoto || null,
    addedAt: now,
  });

  // 3. Update request status to accepted
  await setDoc(doc(db, 'friend_requests', request.id), { status: 'accepted' }, { merge: true });
};

/**
 * Rejects/cancels a friend invitation.
 */
export const rejectFriendInvitation = async (requestId: string): Promise<void> => {
  await deleteDoc(doc(db, 'friend_requests', requestId));
};

/**
 * Helper to resolve synthetic UIDs (like 'uid_sim' or username) to the actual Firestore user UID
 */
export async function resolveRealUserUid(friendUid: string, username?: string): Promise<string> {
  if (friendUid && !friendUid.startsWith('uid_')) {
    const userSnap = await getDoc(doc(db, 'users', friendUid));
    if (userSnap.exists()) return friendUid;
  }

  const targetName = (username || friendUid.replace(/^uid_/, '')).trim().toLowerCase();
  if (!targetName) return friendUid;

  try {
    const uSnap = await getDoc(doc(db, 'usernames', targetName));
    if (uSnap.exists() && uSnap.data()?.uid) {
      return uSnap.data().uid;
    }
  } catch (e) {}

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let foundUid = '';
    usersSnap.forEach((d) => {
      const data = d.data();
      const name = (data.displayName || data.email?.split('@')[0] || '').toLowerCase();
      if (name === targetName || d.id === targetName) {
        foundUid = d.id;
      }
    });
    if (foundUid) return foundUid;
  } catch (e) {}

  return friendUid;
}

/**
 * Fetches full profile data and stats of a friend.
 */
export const fetchFriendProfile = async (friendUid: string, username?: string): Promise<FriendProfileData> => {
  const realUid = await resolveRealUserUid(friendUid, username);
  const userSnap = await getDoc(doc(db, 'users', realUid));
  const userData = userSnap.exists() ? userSnap.data() : {};

  // Fetch friend's watchlist items to compute profile summary stats
  const watchlistCol = collection(db, 'users', realUid, 'watchlist');
  const itemsSnap = await getDocs(watchlistCol);

  let animeCount = 0;
  let mangaCount = 0;
  let watchingCount = 0;
  let completedCount = 0;

  itemsSnap.forEach((d) => {
    const item = d.data();
    if (item.type === 'anime') animeCount++;
    else if (item.type === 'manga') mangaCount++;

    if (item.status === 'watching') watchingCount++;
    if (item.status === 'completed') completedCount++;
  });

  return {
    uid: realUid,
    displayName: userData.displayName || username || 'User',
    photoURL: userData.photoURL || localStorage.getItem(`user_photo_${realUid}`),
    bannerURL: userData.bannerURL || localStorage.getItem(`user_banner_${realUid}`),
    stats: {
      totalItems: itemsSnap.size,
      animeCount,
      mangaCount,
      watchingCount,
      completedCount,
    },
  };
};

/**
 * Fetches the watchlist items of a friend for the Inspect mode.
 */
export const fetchFriendWatchlist = async (friendUid: string, username?: string): Promise<WatchlistItem[]> => {
  const realUid = await resolveRealUserUid(friendUid, username);
  const watchlistCol = collection(db, 'users', realUid, 'watchlist');
  const itemsSnap = await getDocs(watchlistCol);

  const items: WatchlistItem[] = [];
  itemsSnap.forEach((d) => {
    const data = d.data();
    const { _securityHeaders, _encryptedBackup, ...cleanItem } = data;
    items.push({ id: d.id, ...cleanItem } as WatchlistItem);
  });

  return items;
};

export interface UserSearchResult {
  uid: string;
  displayName: string;
  photoURL?: string | null;
  isSelf?: boolean;
}

/**
 * Searches for users by username prefix or substring in Firestore across both usernames and users collections.
 */
export const searchUsernames = async (
  searchQuery: string,
  currentUid?: string
): Promise<UserSearchResult[]> => {
  const clean = searchQuery.trim().toLowerCase();
  if (!clean) return [];

  try {
    const resultsMap = new Map<string, UserSearchResult>();

    // 1. Direct document lookup in 'usernames' collection (e.g. doc ID = 's' or 'sim')
    try {
      const directDocSnap = await getDoc(doc(db, 'usernames', clean));
      if (directDocSnap.exists()) {
        const data = directDocSnap.data();
        const uid = data.uid || directDocSnap.id;
        const displayName = data.displayName || directDocSnap.id;
        const isSelf = uid === currentUid || displayName.trim().toLowerCase() === (auth.currentUser?.displayName || '').trim().toLowerCase();
        resultsMap.set(uid, {
          uid,
          displayName,
          photoURL: data.photoURL || localStorage.getItem(`user_photo_${uid}`) || null,
          isSelf,
        });
      }
    } catch (e) {
      console.warn('Direct username lookup error:', e);
    }

    // 2. Search 'usernames' collection
    try {
      const usernamesSnap = await getDocs(collection(db, 'usernames'));
      usernamesSnap.forEach((d) => {
        const data = d.data();
        const displayName = data.displayName || d.id;
        const uid = data.uid || d.id;

        if (
          d.id.toLowerCase().includes(clean) ||
          displayName.toLowerCase().includes(clean)
        ) {
          const isSelf = uid === currentUid || displayName.trim().toLowerCase() === (auth.currentUser?.displayName || '').trim().toLowerCase();
          resultsMap.set(uid, {
            uid,
            displayName,
            photoURL: data.photoURL || localStorage.getItem(`user_photo_${uid}`) || null,
            isSelf,
          });
        }
      });
    } catch (e) {
      console.warn('Gagal membaca collection usernames:', e);
    }

    // 3. Search 'users' collection (covers all accounts registered in database)
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((d) => {
        const uid = d.id;
        const data = d.data();
        const displayName = data.displayName || data.email?.split('@')[0] || 'User';

        if (
          displayName.toLowerCase().includes(clean) ||
          (data.email && data.email.toLowerCase().includes(clean))
        ) {
          if (!resultsMap.has(uid)) {
            const isSelf = uid === currentUid || displayName.trim().toLowerCase() === (auth.currentUser?.displayName || '').trim().toLowerCase();
            resultsMap.set(uid, {
              uid,
              displayName,
              photoURL: data.photoURL || localStorage.getItem(`user_photo_${uid}`) || null,
              isSelf,
            });
          }
        }
      });
    } catch (e) {
      console.warn('Gagal membaca collection users:', e);
    }

    // 4. Dynamic Candidate Fallback: Always provide input candidate so user can invite any typed username
    if (resultsMap.size === 0 && clean.length > 0) {
      const candidateName = searchQuery.trim();
      resultsMap.set(clean, {
        uid: `uid_${clean}`,
        displayName: candidateName,
        photoURL: null,
        isSelf: candidateName.toLowerCase() === (auth.currentUser?.displayName || '').trim().toLowerCase(),
      });
    }

    // 5. Hard Fix: Resolve missing photoURL for all results from users collection & auth
    for (const item of resultsMap.values()) {
      if (!item.photoURL) {
        if (item.isSelf && auth.currentUser?.photoURL) {
          item.photoURL = auth.currentUser.photoURL;
        } else if (item.uid && !item.uid.startsWith('uid_')) {
          try {
            const uSnap = await getDoc(doc(db, 'users', item.uid));
            if (uSnap.exists() && uSnap.data().photoURL) {
              item.photoURL = uSnap.data().photoURL;
            }
          } catch (e) {}
        }
      }
    }

    return Array.from(resultsMap.values()).slice(0, 8);
  } catch (err) {
    console.warn('Gagal mencari username:', err);
    // Even if catch occurs, return input candidate so user can send invitation
    return [{
      uid: `uid_${clean}`,
      displayName: searchQuery.trim(),
      photoURL: null,
      isSelf: false,
    }];
  }
};
