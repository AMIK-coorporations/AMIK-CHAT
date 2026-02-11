"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { insforge } from '@/lib/insforge';
import { getDocFromInsforge, updateDocInInsforge, setDocInInsforge } from '@/lib/insforgeUtils';
import type { User } from '@/lib/types';
import type { UserSchema } from '@insforge/sdk';

interface AuthContextType {
  user: UserSchema | null;
  userData: User | null;
  loading: boolean;
  updateProfile: (data: Partial<Omit<User, 'id'>>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  updateProfile: async () => { },
  changePassword: async () => { },
  signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSchema | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfile = async (data: Partial<Omit<User, 'id'>>) => {
    if (!user) throw new Error("No user logged in");

    // Update InsForge Database
    try {
      await updateDocInInsforge('users', user.id, data);

      // Update local state if the update was successful
      setUserData((prev: User | null) => prev ? { ...prev, ...data } : null);

      // Update setProfile in Auth (for identity/JWT metadata if applicable)
      await insforge.auth.setProfile(data);
    } catch (error) {
      console.error("InsForge updateProfile failed:", error);
      throw error;
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) throw new Error("No user logged in");
    // InsForge password reset usually requires an OTP or old password
    // For now, we use the resetPassword method if applicable, 
    // but the SDK doesn't expose a direct 'updatePassword' without verification for security.
    console.warn("Change password requested - using reset flow is recommended");
    throw new Error("براہ کرم اپنا پاس ورڈ تبدیل کرنے کے لیے ری سیٹ ای میل کا استعمال کریں۔");
  };

  const signOut = async () => {
    try {
      await insforge.auth.signOut();
      setUser(null);
      setUserData(null);
      window.location.href = '/login';
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  const checkAuth = async () => {
    try {
      const { data, error } = await insforge.auth.getCurrentUser();
      if (error) throw error;

      if (data?.user) {
        const u = data.user;
        setUser(u);

        // Fetch detailed user profile from database
        const dbUser = await getDocFromInsforge<User>('users', u.id);
        if (dbUser) {
          setUserData(dbUser);
        } else {
          // If no profile in DB yet, create one from Auth metadata
          const meta = (u as any).user_metadata || u.metadata || {};
          // Try to get name from various sources
          const displayName = meta.full_name || meta.name || meta.displayName || u.email?.split('@')[0] || 'User';
          // Try to get avatar
          const avatarUrl = meta.avatar_url || meta.picture || meta.avatar || '';

          const newUser: User = {
            // ... (rest of object creation)
            id: u.id,
            email: u.email || '',
            displayName: displayName,
            name: displayName,
            avatarUrl: avatarUrl,
            photoURL: avatarUrl, // for compatibility
            createdAt: new Date(),
            lastSeen: new Date(),
            isOnline: true
          };

          // Save to InsForge Database
          try {
            await setDocInInsforge('users', u.id, newUser);
            setUserData(newUser);
          } catch (err) {
            console.error("Failed to create user profile in DB:", err);
            // Fallback to local state
            setUserData(newUser);
          }
        }
      } else {
        setUser(null);
        setUserData(null);
      }
    } catch (error) {
      console.error("InsForge auth check failed:", error);
      setUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Safety timeout
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 8000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, updateProfile, changePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
