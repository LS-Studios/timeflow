

"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { AppMode, AppSettings, AppTheme } from '@/lib/types';
import { storageService } from './storage';
import { Language, useTranslation } from './i18n';
import { useAuth } from './auth-provider';

type TimerResetCallback = () => void;
type EndCurrentSessionCallback = () => void;

interface SettingsContextType {
  settings: AppSettings;
  isLoaded: boolean;
  timerIsActive: boolean;
  setMode: (mode: AppMode) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: Language) => void;
  setWorkGoals: (goals: { dailyGoal?: number; weeklyGoal?: number }) => void;
  setOrganization: (name: string | null) => void;
  setTimerResetCallback: (callback: TimerResetCallback) => void;
  setTimerIsActiveCallback: (isActive: boolean) => void;
  setEndCurrentSessionCallback: (callback: EndCurrentSessionCallback) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    theme: 'system',
    language: 'de',
    mode: 'work',
    dailyGoal: 8,
    weeklyGoal: 40,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setTheme: applyTheme } = useTheme();
  const { setLanguage: applyLanguage } = useTranslation();
  const { user } = useAuth();

  const [timerIsActive, setTimerIsActive] = useState(false);
  const timerResetCallbackRef = React.useRef<TimerResetCallback | null>(null);
  const endCurrentSessionCallbackRef = React.useRef<EndCurrentSessionCallback | null>(null);

  // Load settings from storage on user change and listen for real-time updates
  useEffect(() => {
    if (user) {
      setIsLoaded(false);
      // Set up a real-time listener for settings
      const unsubscribe = storageService.onSettingsChange(user.uid, (newSettings) => {
        if (newSettings) {
           setSettings(prev => ({...prev, ...newSettings}));
           applyTheme(newSettings.theme);
           applyLanguage(newSettings.language);
        } else {
           // No settings in DB, use defaults and save them
           setSettings(defaultSettings);
           storageService.saveSettings(user.uid, defaultSettings);
        }
        setIsLoaded(true);
      });

      // Clean up the listener when the user changes or component unmounts
      return () => unsubscribe();
    }
  }, [user, applyTheme, applyLanguage]);


  // When settings are changed by the user, save them to storage
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
      if (user) {
          setSettings(prev => {
              const updated = {...prev, ...newSettings};
              storageService.saveSettings(user.uid, updated);
              return updated;
          });
      }
  }, [user]);

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

  const setOrganization = useCallback((name: string | null) => {
    updateSettings({ organizationName: name || undefined });
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
    setTimerResetCallback,
    setTimerIsActiveCallback,
    setEndCurrentSessionCallback
  }), [settings, isLoaded, timerIsActive, setMode, setTheme, setLanguage, setWorkGoals, setOrganization, setTimerResetCallback, setTimerIsActiveCallback, setEndCurrentSessionCallback]);
  

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
