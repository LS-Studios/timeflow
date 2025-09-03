
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser, deleteUser } from 'firebase/auth';
import { auth, db } from './firebase';
import { LoginDialog } from '@/components/login-dialog';
import { ProfileDialog } from '@/components/profile-dialog';
import { storageService, type UserAccount } from './storage';
import { ref, set } from "firebase/database";
import { useSettings } from './settings-provider';

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
  deleteAccount: () => Promise<AuthResult>;
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
    case 'auth/requires-recent-login':
        return 'errorRequiresRecentLogin';
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
            const userData = await storageService.getUserAccount(firebaseUser.uid);
            if (userData) {
                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email!,
                    name: userData.name,
                });
            } else {
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
    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      console.error("AuthProvider: Login failed.", error);
      return { success: false, message: mapFirebaseError(error.code) };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        const newUserAccount: UserAccount = { name: name, email: email };
        await set(ref(db, `users/${firebaseUser.uid}/account`), newUserAccount);

        return { success: true, message: 'Registration successful' };
    } catch (error: any) {
        return { success: false, message: mapFirebaseError(error.code) };
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
      console.error("AuthProvider: Error signing out: ", error);
    }
  }, [user]);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
      const currentUser = auth.currentUser;
      if (!currentUser) return { success: false, message: 'errorGeneric' };
      
      const userSettings = await storageService.getSettings(currentUser.uid);

      try {
          // 1. Clean up database entries (including organization membership)
          await storageService.deleteUserAndCleanup(currentUser.uid, userSettings?.organizationSerialNumber || null);
          
          // 2. Delete the Firebase auth user
          await deleteUser(currentUser);

          return { success: true, message: 'Account deleted successfully' };
      } catch(error: any) {
          console.error("AuthProvider: Error deleting account: ", error);
          return { success: false, message: mapFirebaseError(error.code) };
      }
  }, []);

  const openProfileDialog = useCallback(() => {
    setProfileDialogOpen(true);
  }, []);
  
  const value = useMemo(() => ({
    user,
    login,
    register,
    logout,
    deleteAccount,
    loginAsGuest,
    openProfileDialog,
  }), [user, login, register, logout, deleteAccount, loginAsGuest, openProfileDialog]);
  
  const isLoginRequesting = !user && !isLoading;

  return (
    <AuthContext.Provider value={value}>
      <div className={isLoginRequesting ? "blur-sm pointer-events-none" : ""}>
        {children}
      </div>
      
      {isLoginRequesting ? <LoginDialog /> : null}
      
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
