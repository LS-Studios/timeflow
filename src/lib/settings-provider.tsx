
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
    organizationName: undefined,
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

  // Load settings from storage on user change
  useEffect(() => {
    const loadSettings = async () => {
      if (user) {
        setIsLoaded(false);
        const loadedSettings = await storageService.getSettings(user.uid);
        if (loadedSettings) {
          setSettings(prev => ({...prev, ...loadedSettings}));
        } else {
          // If no settings in DB, use defaults and save them
          setSettings(defaultSettings);
          await storageService.saveSettings(user.uid, defaultSettings);
        }
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, [user]);

  // When settings change, apply them and save to storage
  useEffect(() => {
    if (isLoaded && user) {
      applyTheme(settings.theme);
      applyLanguage(settings.language);
      storageService.saveSettings(user.uid, settings);
    }
  }, [settings, isLoaded, user, applyTheme, applyLanguage]);

  const setMode = useCallback((mode: AppMode) => {
    if (settings.mode === mode) return;

    if(endCurrentSessionCallbackRef.current) {
        endCurrentSessionCallbackRef.current();
    }
    if (timerResetCallbackRef.current) {
        timerResetCallbackRef.current();
    }
    setSettings(prev => ({ ...prev, mode }));
  }, [settings.mode]);


  const setTheme = useCallback((theme: AppTheme) => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setSettings(prev => ({...prev, language}));
  }, []);
  
  const setWorkGoals = useCallback((goals: { dailyGoal?: number, weeklyGoal?: number }) => {
    setSettings(prev => ({
        ...prev,
        dailyGoal: goals.dailyGoal ?? prev.dailyGoal,
        weeklyGoal: goals.weeklyGoal ?? prev.weeklyGoal
    }));
  }, []);

  const setOrganization = useCallback((name: string | null) => {
    setSettings(prev => ({ ...prev, organizationName: name || undefined }));
  }, []);

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
