
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import type { AppMode, AppSettings, AppTheme, SettingsContextType } from '@/lib/types';
import { storageService } from './storage';
import { Language, useTranslation } from './i18n';
import { useAuth } from './auth-provider';
import { useToast } from '@/hooks/use-toast';
import { analyticsService } from './analytics';

type TimerResetCallback = () => void;
type EndCurrentSessionCallback = () => void;

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Generates initial default settings based on the user's browser/OS preferences.
 * This should only be called once when a user record is first created.
 */
const getInitialDefaultSettings = (): AppSettings => {
  let language: Language = 'en';
  if (typeof window !== "undefined" && navigator.language.startsWith('de')) {
    language = 'de';
  }

  return {
    theme: 'system', // 'system' automatically detects light/dark mode from the OS.
    language,
    mode: 'work',
    dailyGoal: 8,
    weeklyGoal: 40,
  };
};

function SettingsProviderInternal({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getInitialDefaultSettings());
  const [isLoaded, setIsLoaded] = useState(false);
  const { setTheme: applyTheme } = useTheme();
  const { setLanguage: applyLanguage } = useTranslation();
  const { user, isDeleting } = useAuth();
  const { toast } = useToast();

  const [timerIsActive, setTimerIsActive] = useState(false);
  const timerResetCallbackRef = React.useRef<TimerResetCallback | null>(null);
  const endCurrentSessionCallbackRef = React.useRef<EndCurrentSessionCallback | null>(null);
  const isDeletingRef = React.useRef(isDeleting);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep the ref updated
  React.useEffect(() => {
    isDeletingRef.current = isDeleting;
  }, [isDeleting]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
      console.log("[DEBUG] updateSettings called:", { user: user?.uid, isDeleting, newSettings });
      if (user && !isDeleting) {
          setSettings(prev => {
              const updated = {...prev, ...newSettings};
              if (JSON.stringify(prev) !== JSON.stringify(updated)) {
                console.log("[DEBUG] Save settings on update for user:", user.uid, updated);
                 storageService.saveSettings(user.uid, updated);
              }
              return updated;
          });
      } else {
          console.log("[DEBUG] updateSettings blocked - user:", user?.uid, "isDeleting:", isDeleting);
      }
  }, [user, isDeleting]);

  useEffect(() => {
    if (user && !isDeleting) {
      setIsLoaded(false);
      console.log("[DEBUG] Setting up settings listener for user:", user.uid, "isDeleting:", isDeleting);
      const unsubscribe = storageService.onSettingsChange(user.uid, async (newSettings) => {
        console.log("[DEBUG] onSettingsChange triggered for user:", user?.uid, "isDeleting:", isDeleting, "newSettings:", newSettings);
        
        // Early return if user is being deleted - ignore all settings changes
        if (isDeletingRef.current) {
          console.log("[DEBUG] Ignoring settings change because user is being deleted");
          return;
        }
        
        let finalSettings = newSettings;
        if (newSettings && newSettings.organizationSerialNumber) {
            const oldOrgName = settings.organizationName;
            const orgExists = await storageService.getOrganization(newSettings.organizationSerialNumber);
            if (!orgExists) {
                console.log("SettingsProvider: Stale organization found, cleaning up.");
                finalSettings = {
                    ...newSettings,
                    organizationName: null,
                    organizationSerialNumber: null,
                };
                if (!isDeleting) {
                    console.log("[DEBUG] Save setting in cleanup for user:", user.uid, finalSettings);
                    storageService.saveSettings(user.uid, finalSettings);
                } else {
                    console.log("[DEBUG] Organization cleanup blocked - user:", user.uid, "isDeleting:", isDeleting);
                }
                if (oldOrgName) {
                    toast({
                        title: "Organization Update",
                        description: `You have been removed from the organization: "${oldOrgName}".`
                    });
                }
            }
        }
        
        if (finalSettings) {
           setSettings(prev => ({...prev, ...finalSettings}));
           applyTheme(finalSettings.theme);
           applyLanguage(finalSettings.language);
        } else if (!isDeleting) {
           const initialDefaults = getInitialDefaultSettings();
           console.log("[DEBUG] Save initial default settings for user:", user.uid, initialDefaults);
           setSettings(initialDefaults);
           storageService.saveSettings(user.uid, initialDefaults);
        } else {
           console.log("[DEBUG] Initial defaults blocked - user:", user.uid, "isDeleting:", isDeleting);
        }
        setIsLoaded(true);
      });

      return () => {
        console.log("[DEBUG] Cleaning up settings listener for user:", user?.uid, "isDeleting:", isDeleting);
        unsubscribe();
      };
    } else {
      console.log("[DEBUG] Not setting up settings listener - user:", user?.uid, "isDeleting:", isDeleting);
    }
  }, [user, applyTheme, applyLanguage, toast, settings.organizationName, isDeleting]);
  
  useEffect(() => {
    const orgSerial = searchParams.get('organisation');
    if (orgSerial && user && user.uid !== 'guest' && isLoaded && !isDeleting) {
      if (settings.organizationSerialNumber === orgSerial) {
          router.replace('/settings', { scroll: false });
          return;
      }

      const joinOrg = async () => {
        const orgData = await storageService.getOrganization(orgSerial);
        if (orgData) {
          const success = await storageService.joinOrganization(user.uid, orgSerial);
          if (success) {
            updateSettings({
              organizationName: orgData.name,
              organizationSerialNumber: orgSerial,
            });
            analyticsService.trackOrganizationJoined();
            toast({
                title: "Organization Joined",
                description: `You have successfully joined "${orgData.name}".`
            });
          }
        }
        router.replace('/settings', { scroll: false });
      };

      joinOrg();
    }
  }, [searchParams, user, isLoaded, settings.organizationSerialNumber, updateSettings, router, toast, isDeleting]);

  useEffect(() => {
    if (user && user.uid !== 'guest' && settings.organizationSerialNumber && !isDeleting) {
        const unsubscribe = storageService.onOrganizationChange(settings.organizationSerialNumber, (orgData) => {
            if (orgData && orgData.name !== settings.organizationName) {
                updateSettings({ organizationName: orgData.name });
            }
        });

        return () => unsubscribe();
    }
  }, [user, settings.organizationSerialNumber, settings.organizationName, updateSettings, isDeleting]);

  const setMode = useCallback((mode: AppMode) => {
    if (settings.mode === mode) return;

    if(endCurrentSessionCallbackRef.current) {
        endCurrentSessionCallbackRef.current();
    }
    if (timerResetCallbackRef.current) {
        timerResetCallbackRef.current();
    }
    analyticsService.trackModeChanged(mode);
    updateSettings({ mode });
  }, [settings.mode, updateSettings]);

  const setTheme = useCallback((theme: AppTheme) => {
    analyticsService.trackThemeChanged(theme);
    updateSettings({ theme });
  }, [updateSettings]);

  const setLanguage = useCallback((language: Language) => {
    updateSettings({ language });
  }, [updateSettings]);
  
  const setWorkGoals = useCallback((goals: { dailyGoal?: number, weeklyGoal?: number }) => {
    updateSettings({
        dailyGoal: goals.dailyGoal ?? settings.dailyGoal,
        weeklyGoal: goals.weeklyGoal ?? settings.weeklyGoal
    });
  }, [settings.dailyGoal, settings.weeklyGoal, updateSettings]);

  const setOrganization = useCallback((name: string | null, serial: string | null) => {
    updateSettings({ organizationName: name, organizationSerialNumber: serial });
  }, [updateSettings]);

  const setIsAdmin = useCallback((isAdmin: boolean) => {
    analyticsService.trackAdminModeToggled(isAdmin);
    updateSettings({ isAdmin });
  }, [updateSettings]);

  const setTimerResetCallback = useCallback((callback: TimerResetCallback) => {
    timerResetCallbackRef.current = callback;
  }, []);

  const setTimerIsActiveCallback = useCallback((isActive: boolean) => {
    setTimerIsActive(isActive);
  }, []);

  const setEndCurrentSessionCallback = useCallback((callback: EndCurrentSessionCallback) => {
      endCurrentSessionCallbackRef.current = callback;
  }, []);

  const value = useMemo(() => ({
    settings,
    isLoaded,
    timerIsActive,
    setMode,
    setTheme,
    setLanguage,
    setWorkGoals,
    setOrganization,
    setIsAdmin,
    updateSettings,
    setTimerResetCallback,
    setTimerIsActiveCallback,
    setEndCurrentSessionCallback
  }), [settings, isLoaded, timerIsActive, setMode, setTheme, setLanguage, setWorkGoals, setOrganization, setIsAdmin, updateSettings, setTimerResetCallback, setTimerIsActiveCallback, setEndCurrentSessionCallback]);
  

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <SettingsProviderInternal>{children}</SettingsProviderInternal>
    </React.Suspense>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
