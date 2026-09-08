"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { insforge } from '@/lib/insforge';
import { getDocFromInsforge, updateDocInInsforge, setDocInInsforge } from '@/lib/insforgeUtils';
import type { User } from '@/lib/types';
import type { UserSchema } from '@insforge/sdk';
import { initializeOneSignal, getPlayerId, setExternalUserId } from '@/lib/onesignal';

interface AuthContextType {
  user: UserSchema | null;
  userData: User | null;
  loading: boolean;
  updateProfile: (data: Partial<Omit<User, 'id'>>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  updateProfile: async () => { },
  changePassword: async () => { },
  signOut: async () => { },
  refreshUserData: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSchema | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async () => {
    if (!user) return;
    try {
      const dbUser = await getDocFromInsforge<User>('users', user.id);
      if (dbUser) {
        setUserData(dbUser);
      }
    } catch (e) {
      console.error("Failed to refresh user data:", e);
    }
  };

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

  // OneSignal Initialization
  useEffect(() => {
    initializeOneSignal();
  }, []);

  const syncPlayerId = async (userId: string) => {
    try {
      const playerId = await getPlayerId();
      if (playerId) {
        await updateDocInInsforge('users', userId, { onesignal_player_id: playerId });
      }
      await setExternalUserId(userId);
    } catch (e) {
      console.error("Error syncing player ID:", e);
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
          // If no profile in DB yet, create one from Auth metadata (New Signup via OAuth)
          const meta = (u as any).user_metadata || u.metadata || {};
          const displayName = meta.full_name || meta.name || meta.displayName || u.email?.split('@')[0] || 'User';
          const avatarUrl = meta.avatar_url || meta.picture || meta.avatar || `https://placehold.co/100x100.png?text=${displayName.charAt(0)}`;
          const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

          const newUser: User = {
            id: u.id,
            email: u.email || '',
            displayName: displayName,
            name: displayName,
            avatarUrl: avatarUrl,
            photoURL: avatarUrl, // for compatibility
            createdAt: new Date(),
            lastSeen: new Date(),
            isOnline: true,
            isOtpVerified: false,
            otpCode: generatedOtp
          };

          // Save to InsForge Database
          try {
            await setDocInInsforge('users', u.id, newUser);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(`otp_${u.id}`, generatedOtp);
            }
            setUserData(newUser);
          } catch (err) {
            console.error("Failed to create user profile in DB:", err);
            setUserData(newUser);
          }
        }

        // Sync OneSignal Player ID
        syncPlayerId(u.id);
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
    <AuthContext.Provider value={{ user, userData, loading, updateProfile, changePassword, signOut, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
