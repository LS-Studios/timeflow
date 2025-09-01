
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { LoginDialog } from '@/components/login-dialog';
import { ProfileDialog } from '@/components/profile-dialog';
import { storageService, type UserAccount } from './storage';
import { ref, set } from "firebase/database";
import { useTranslation } from './i18n';

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

const mapFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'errorInvalidEmail';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'errorInvalidCredential';
    case 'auth/email-already-in-use':
      return 'errorEmailInUse';
    case 'auth/weak-password':
      return 'errorWeakPassword';
    default:
      return 'errorGeneric';
  }
};


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use onAuthStateChanged to manage user session
  useEffect(() => {
    console.log("AuthProvider: Setting up onAuthStateChanged listener.");
    // Check if auth object is valid before subscribing
    if (!auth || Object.keys(auth).length === 0) {
      console.log("AuthProvider: Firebase Auth not initialized, skipping listener.");
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log("AuthProvider: onAuthStateChanged triggered.");
      if (firebaseUser) {
        console.log("AuthProvider: Firebase user found with UID:", firebaseUser.uid);
        if (firebaseUser.isAnonymous) {
             console.log("AuthProvider: User is anonymous.");
             setUser({
                uid: 'guest', // Keep local guest UID
                name: 'Guest User',
                email: 'guest@local.storage'
             });
        } else {
            console.log("AuthProvider: Fetching user account data for UID:", firebaseUser.uid);
            const userData = await storageService.getUserAccount(firebaseUser.uid);
            if (userData) {
                console.log("AuthProvider: User data found:", userData);
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    name: userData.name,
                });
            } else {
                 console.warn("AuthProvider: Firebase user exists, but no data in DB. Logging out.");
                 await signOut(auth);
                 setUser(null);
            }
        }
      } else {
        console.log("AuthProvider: No Firebase user found. Checking for local guest.");
        const guestUser = storageService.getGuestUser();
        if (guestUser) {
          console.log("AuthProvider: Found local guest user.");
          setUser(guestUser);
        } else {
          console.log("AuthProvider: No user session found.");
          setUser(null);
        }
      }
      setIsLoading(false);
      console.log("AuthProvider: Loading complete.");
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("AuthProvider: Cleaning up onAuthStateChanged listener.");
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    console.log("AuthProvider: Attempting login for email:", email);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("AuthProvider: Login successful.");
      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      console.error("AuthProvider: Login failed.", error);
      return { success: false, message: mapFirebaseError(error.code) };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    console.log("AuthProvider: Attempting to register user:", email);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        console.log("AuthProvider: Firebase user created successfully with UID:", firebaseUser.uid);

        console.log("AuthProvider: Storing user account data in Realtime Database.");
        await set(ref(db, `users/${firebaseUser.uid}/account`), {
            name: name,
            email: email,
        });
        console.log("AuthProvider: User data stored successfully.");

        return { success: true, message: 'Registration successful' };
    } catch (error: any) {
        console.error("AuthProvider: Registration failed.", error);
        return { success: false, message: mapFirebaseError(error.code) };
    }
  }, []);
  
  const loginAsGuest = useCallback(() => {
    console.log("AuthProvider: Logging in as guest.");
    const guestUser: User = { uid: 'guest', name: 'Guest User', email: 'guest@local.storage' };
    storageService.saveGuestUser(guestUser);
    setUser(guestUser);
  }, []);

  const logout = useCallback(async () => {
    console.log("AuthProvider: Attempting logout for user:", user?.uid);
    try {
      if (user?.uid === 'guest') {
        console.log("AuthProvider: Clearing guest user data.");
        storageService.clearGuestUser();
        setUser(null);
      } else {
        console.log("AuthProvider: Signing out from Firebase.");
        await signOut(auth);
      }
      setProfileDialogOpen(false);
      console.log("AuthProvider: Logout successful.");
    } catch (error) {
      console.error("AuthProvider: Error signing out: ", error);
    }
  }, [user]);

  const openProfileDialog = useCallback(() => {
    console.log("AuthProvider: Opening profile dialog.");
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
      
      {user && user.uid !== 'guest' && (
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
