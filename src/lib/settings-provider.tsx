
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useSearchParams, useRouter } from 'next/navigation';
import type { AppMode, AppSettings, AppTheme, SettingsContextType } from '@/lib/types';
import { storageService } from './storage';
import { Language, useTranslation } from './i18n';
import { useAuth } from './auth-provider';
import { useToast } from '@/hooks/use-toast';

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
  
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
      if (user && !isDeleting) {
          setSettings(prev => {
              const updated = {...prev, ...newSettings};
              if (JSON.stringify(prev) !== JSON.stringify(updated)) {
                 storageService.saveSettings(user.uid, updated);
              }
              return updated;
          });
      }
  }, [user, isDeleting]);

  useEffect(() => {
    if (user && !isDeleting) {
      setIsLoaded(false);
      const unsubscribe = storageService.onSettingsChange(user.uid, async (newSettings) => {
        
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
                storageService.saveSettings(user.uid, finalSettings);
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
        } else {
           const initialDefaults = getInitialDefaultSettings();
           setSettings(initialDefaults);
           storageService.saveSettings(user.uid, initialDefaults);
        }
        setIsLoaded(true);
      });

      return () => unsubscribe();
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
    updateSettings({ mode });
  }, [settings.mode, updateSettings]);

  const setTheme = useCallback((theme: AppTheme) => {
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
