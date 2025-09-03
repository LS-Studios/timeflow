
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User as FirebaseUser, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from './firebase';
import { LoginDialog } from '@/components/dialogs/login-dialog';
import { ProfileDialog } from '@/components/dialogs/profile-dialog';
import { storageService, type UserAccount } from './storage';
import { ref, set } from "firebase/database";
import { useSettings } from './settings-provider';
import { useToast } from '@/hooks/use-toast';

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
  isDeleting: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  deleteAccount: (password: string) => Promise<AuthResult>;
  loginAsGuest: () => void;
  openProfileDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapFirebaseError = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'errorInvalidEmail';
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
  const [isDeleting, setIsDeleting] = useState(false);

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
                 // This can happen if the DB entry is missing but auth user exists.
                 // Treat as logged out.
                 console.warn(`User ${firebaseUser.uid} found in auth but not in DB. Logging out.`);
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
      // onAuthStateChanged will handle setting the user state
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
        // The user is created, but they will be signed out to force a manual login.
        await signOut(auth);
        return { success: true, message: 'Registration successful, please log in.' };
    } catch (error: any) {
        console.error("AuthProvider: Registration failed.", error);
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
        // onAuthStateChanged will set user to null
      }
      setProfileDialogOpen(false);
    } catch (error) {
      console.error("AuthProvider: Error signing out: ", error);
    }
  }, [user]);

  const deleteAccount = useCallback(async (password: string): Promise<AuthResult> => {
      const currentUser = auth.currentUser;
      const localUser = user;

      if (!currentUser || !currentUser.email || !localUser) {
          return { success: false, message: 'errorGeneric' };
      }

      setIsDeleting(true);
      try {
          // 1. Re-authenticate for security. This is the gatekeeper.
          const credential = EmailAuthProvider.credential(currentUser.email, password);
          await reauthenticateWithCredential(currentUser, credential);
          
          // 2. ONLY if re-authentication succeeds, proceed with data deletion.
          const userSettings = await storageService.getSettings(localUser.uid);
          await storageService.deleteUserAndCleanup(localUser.uid, userSettings?.organizationSerialNumber || null);
          
          // 3. Finally, delete the Firebase auth user. This will trigger onAuthStateChanged.
          await deleteUser(currentUser);

          return { success: true, message: 'Account deleted successfully' };
      } catch(error: any) {
          // This will catch re-authentication errors (like wrong password) and any other issues.
          console.error("AuthProvider: Error deleting account: ", error);
          return { success: false, message: mapFirebaseError(error.code) };
      } finally {
          setIsDeleting(false);
      }
  }, [user]);

  const openProfileDialog = useCallback(() => {
    setProfileDialogOpen(true);
  }, []);
  
  const value = useMemo(() => ({
    user,
    isDeleting,
    login,
    register,
    logout,
    deleteAccount,
    loginAsGuest,
    openProfileDialog,
  }), [user, isDeleting, login, register, logout, deleteAccount, loginAsGuest, openProfileDialog]);
  
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
