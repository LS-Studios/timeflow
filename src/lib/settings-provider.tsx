
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { AppMode, AppSettings, AppTheme } from '@/lib/types';
import { storageService } from './storage';
import { Language, useTranslation } from './i18n';

type TimerResetCallback = () => void;

interface SettingsContextType {
  settings: AppSettings;
  isLoaded: boolean;
  setMode: (mode: AppMode) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: Language) => void;
  setWorkGoals: (goals: { dailyGoal?: number; weeklyGoal?: number }) => void;
  setTimerResetCallback: (callback: TimerResetCallback) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    theme: 'system',
    language: 'de',
    mode: 'work',
    dailyGoal: 8,
    weeklyGoal: 40
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setTheme: applyTheme } = useTheme();
  const { setLanguage: applyLanguage } = useTranslation();
  const [timerResetCallback, setTimerResetCallback] = useState<TimerResetCallback | null>(null);

  // Load settings from storage on initial mount
  useEffect(() => {
    const loadedSettings = storageService.getSettings();
    if (loadedSettings) {
      setSettings(prev => ({...prev, ...loadedSettings}));
    }
    setIsLoaded(true);
  }, []);

  // When settings change, apply them and save to storage
  useEffect(() => {
    if (isLoaded) {
      applyTheme(settings.theme);
      applyLanguage(settings.language);
      storageService.saveSettings(settings);
    }
  }, [settings, isLoaded, applyTheme, applyLanguage]);

  const setMode = useCallback((mode: AppMode) => {
    setSettings(prev => {
        if(prev.mode !== mode && timerResetCallback) {
            timerResetCallback();
        }
        return { ...prev, mode };
    });
  }, [timerResetCallback]);

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

  const setResetCallback = useCallback((callback: TimerResetCallback) => {
    setTimerResetCallback(() => callback);
  }, []);


  const value = useMemo(() => ({
    settings,
    isLoaded,
    setMode,
    setTheme,
    setLanguage,
    setWorkGoals,
    setTimerResetCallback: setResetCallback,
  }), [settings, isLoaded, setMode, setTheme, setLanguage, setWorkGoals, setResetCallback]);
  

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
