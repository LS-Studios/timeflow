
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { LoginDialog } from '@/components/login-dialog';
import { ProfileDialog } from '@/components/profile-dialog';
import { storageService, type UserAccount } from './storage';

type User = {
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

  // Check for a logged-in user in localStorage on initial load
  useEffect(() => {
    const loggedInUser = storageService.getLoggedInUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const authenticatedUser = storageService.authenticateUser(email, password);
    if (authenticatedUser) {
      setUser(authenticatedUser);
      storageService.setLoggedInUser(authenticatedUser);
      return { success: true, message: 'Login successful' };
    } else {
      return { success: false, message: 'Invalid email or password.' };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const newUser: UserAccount = { name, email, password };
    const success = storageService.saveUser(newUser);
    if (success) {
      setUser(newUser);
      storageService.setLoggedInUser(newUser);
      return { success: true, message: 'Registration successful' };
    } else {
      return { success: false, message: 'A user with this email already exists.' };
    }
  }, []);
  
  const loginAsGuest = useCallback(() => {
    const guestUser = { name: 'Guest User', email: `guest-${Date.now()}@local.com` };
    setUser(guestUser);
    // Don't save guest user to permanent logged-in state
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    storageService.clearLoggedInUser();
    setProfileDialogOpen(false);
  }, []);

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
