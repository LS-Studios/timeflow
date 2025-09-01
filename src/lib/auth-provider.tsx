
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { LoginDialog } from '@/components/login-dialog';
import { ProfileDialog } from '@/components/profile-dialog';
import { storageService, type UserAccount } from './storage';

type User = {
  uid: string;
  name: string;
  email: string;
};

type AuthResult = {
  success: boolean;
  message: string;
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  loginAsGuest: () => void;
  openProfileDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use onAuthStateChanged to manage user session
  useEffect(() => {
    // Check if auth object is valid before subscribing
    if (!auth || Object.keys(auth).length === 0) {
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        if (firebaseUser.isAnonymous) {
             setUser({
                uid: 'guest', // Keep local guest UID
                name: 'Guest User',
                email: 'guest@local.storage'
             });
        } else {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    name: userDoc.data().name,
                });
            } else {
                 // This case can happen if a user is created in Auth but not in Firestore.
                 // We'll log them out to be safe.
                 await signOut(auth);
                 setUser(null);
            }
        }
      } else {
        const guestUser = storageService.getGuestUser();
        if (guestUser) {
          setUser(guestUser);
        } else {
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      return { success: false, message: error.message || 'Invalid email or password.' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Store user's name in Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
            name: name,
            email: email,
        });

        return { success: true, message: 'Registration successful' };
    } catch (error: any) {
        return { success: false, message: error.message || 'Registration failed.' };
    }
  }, []);
  
  const loginAsGuest = useCallback(() => {
    const guestUser: User = { uid: 'guest', name: 'Guest User', email: 'guest@local.storage' };
    storageService.saveGuestUser(guestUser);
    setUser(guestUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (user?.uid === 'guest') {
        storageService.clearGuestUser();
        setUser(null);
      } else {
        await signOut(auth);
      }
      setProfileDialogOpen(false);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  }, [user]);

  const openProfileDialog = useCallback(() => {
    setProfileDialogOpen(true);
  }, []);
  
  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    loginAsGuest,
    openProfileDialog,
  }), [user, login, register, logout, loginAsGuest, openProfileDialog]);
  
  const isLoginRequired = !user && !isLoading;

  return (
    <AuthContext.Provider value={value}>
      <div className={isLoginRequired ? "blur-sm pointer-events-none" : ""}>
        {children}
      </div>
      
      {isLoginRequired && <LoginDialog />}
      
      {user && (
        <ProfileDialog 
          isOpen={isProfileDialogOpen} 
          onOpenChange={setProfileDialogOpen}
          user={user}
          onLogout={logout}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
