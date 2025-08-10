"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser, updatePassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userData: User | null;
  loading: boolean;
  updateProfile: (data: Partial<Omit<User, 'id'>>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  userData: null, 
  loading: true,
  updateProfile: async () => {},
  changePassword: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = async (data: Partial<Omit<User, 'id'>>) => {
    if (!user) throw new Error("No user logged in");
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, data);
  };

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error("No user logged in");
    await updatePassword(user, newPassword);
  };

  useEffect(() => {
    let unsubscribeDoc: () => void = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribeDoc();

      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          const nameFromEmail = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'New User';
          try {
            await setDoc(userDocRef, {
              name: nameFromEmail,
              avatarUrl: `https://placehold.co/100x100.png?text=${nameFromEmail.charAt(0).toUpperCase()}`
            });
          } catch (error) {
            console.error("Failed to create user document for existing auth user:", error);
          }
        }
        
        unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            setUserData({ id: doc.id, ...doc.data() } as User);
          } else {
            setUserData(null);
          }
          setLoading(false);
        });

        setUser(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
        unsubscribeAuth();
        unsubscribeDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
