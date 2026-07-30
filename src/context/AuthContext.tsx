import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export const checkIsUsernameAvailable = async (username: string, currentUid?: string): Promise<boolean> => {
  const clean = username.trim().toLowerCase();
  if (!clean) return false;
  try {
    const snap = await getDoc(doc(db, 'usernames', clean));
    if (snap.exists()) {
      const data = snap.data();
      if (currentUid && data?.uid === currentUid) {
        return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Gagal memeriksa ketersediaan username:', err);
    return true;
  }
};

interface AuthContextType {
  user: User | null;
  userBanner: string | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string, rememberMe?: boolean) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string; bannerURL?: string }) => Promise<void>;
  updateUserEmail: (newEmail: string, currentPassword?: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  checkUsernameAvailable: (name: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userBanner: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
  checkUsernameAvailable: async () => true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userBanner, setUserBanner] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure persistence is set to LOCAL by default so user stays logged in across sessions
    setPersistence(auth, browserLocalPersistence).catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let photo = currentUser.photoURL;
        let banner = localStorage.getItem(`user_banner_${currentUser.uid}`);

        const cachedPhoto = localStorage.getItem(`user_photo_${currentUser.uid}`);
        if (cachedPhoto) photo = cachedPhoto;

        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data?.photoURL) {
              photo = data.photoURL;
              localStorage.setItem(`user_photo_${currentUser.uid}`, data.photoURL);
            }
            if (data?.bannerURL) {
              banner = data.bannerURL;
              localStorage.setItem(`user_banner_${currentUser.uid}`, data.bannerURL);
            }
          }
        } catch (e) {
          console.warn('Gagal memuat profil dari Firestore:', e);
        }

        const patchedUser = Object.assign(
          Object.create(Object.getPrototypeOf(currentUser)),
          currentUser,
          { photoURL: photo || currentUser.photoURL }
        );
        setUser(patchedUser);
        setUserBanner(banner || null);
      } else {
        setUser(null);
        setUserBanner(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string, rememberMe = true) => {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const trimmedName = name.trim();
    if (trimmedName) {
      const available = await checkIsUsernameAvailable(trimmedName);
      if (!available) {
        throw new Error(`Username "${trimmedName}" sudah digunakan. Harap gunakan username lain.`);
      }
    }

    await setPersistence(auth, browserLocalPersistence);
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCred.user.uid;

    if (trimmedName) {
      await updateProfile(userCred.user, { displayName: trimmedName });
      const clean = trimmedName.toLowerCase();
      try {
        await setDoc(doc(db, 'usernames', clean), {
          uid,
          displayName: trimmedName,
          createdAt: new Date().toISOString()
        });
        await setDoc(doc(db, 'users', uid), { 
          displayName: trimmedName,
          email: email.trim(),
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Gagal menyimpan username ke Firestore:', err);
      }

      // Immediately patch local user state with the newly created displayName
      const patchedUser = Object.assign(
        Object.create(Object.getPrototypeOf(userCred.user)),
        userCred.user,
        { displayName: trimmedName }
      );
      setUser(patchedUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string; bannerURL?: string }) => {
    if (!auth.currentUser) throw new Error('User belum login');
    const uid = auth.currentUser.uid;
    const currentName = auth.currentUser.displayName || '';

    if (data.displayName !== undefined && data.displayName.trim() !== currentName) {
      const newName = data.displayName.trim();
      const available = await checkIsUsernameAvailable(newName, uid);
      if (!available) {
        throw new Error(`Username "${newName}" sudah digunakan oleh pengguna lain.`);
      }

      const newClean = newName.toLowerCase();
      const oldClean = currentName.toLowerCase();

      try {
        await setDoc(doc(db, 'usernames', newClean), {
          uid,
          displayName: newName,
          updatedAt: new Date().toISOString()
        });
        if (oldClean && oldClean !== newClean) {
          await deleteDoc(doc(db, 'usernames', oldClean));
        }
      } catch (err) {
        console.warn('Gagal memperbarui username registry:', err);
      }
    }

    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (data.displayName !== undefined) authUpdates.displayName = data.displayName.trim();
    if (data.photoURL !== undefined && (data.photoURL.startsWith('http://') || data.photoURL.startsWith('https://'))) {
      authUpdates.photoURL = data.photoURL;
    }

    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(auth.currentUser, authUpdates);
    }

    const firestoreUpdates: Record<string, string> = {};
    if (data.displayName !== undefined) firestoreUpdates.displayName = data.displayName.trim();
    if (data.photoURL !== undefined) {
      firestoreUpdates.photoURL = data.photoURL;
      localStorage.setItem(`user_photo_${uid}`, data.photoURL);
    }
    if (data.bannerURL !== undefined) {
      firestoreUpdates.bannerURL = data.bannerURL;
      setUserBanner(data.bannerURL);
      localStorage.setItem(`user_banner_${uid}`, data.bannerURL);
    }

    if (Object.keys(firestoreUpdates).length > 0) {
      try {
        await setDoc(doc(db, 'users', uid), firestoreUpdates, { merge: true });
      } catch (err) {
        console.warn('Gagal menyimpan profil ke Firestore:', err);
      }
    }

    const u = auth.currentUser;
    const activePhoto = data.photoURL ?? u.photoURL ?? localStorage.getItem(`user_photo_${uid}`);
    setUser(Object.assign(Object.create(Object.getPrototypeOf(u)), u, {
      displayName: data.displayName ? data.displayName.trim() : u.displayName,
      photoURL: activePhoto
    }));
  };

  const updateUserEmail = async (newEmail: string, currentPassword?: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User belum login');

    if (currentPassword && currentUser.email) {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
    }

    await updateEmail(currentUser, newEmail);
    setUser({ ...currentUser });
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User belum login');

    if (!currentUser.email) throw new Error('Email user tidak ditemukan');
    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  };

  const checkUsernameAvailable = (name: string) => checkIsUsernameAvailable(name, auth.currentUser?.uid);

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        userBanner,
        loading, 
        loginWithEmail, 
        registerWithEmail, 
        logout,
        updateUserProfile,
        updateUserEmail,
        updateUserPassword,
        checkUsernameAvailable
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

