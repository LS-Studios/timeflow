
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import type { AppMode, AppSettings, AppTheme } from '@/lib/types';
import { storageService } from './storage';
import { Language, useTranslation } from './i18n';

interface SettingsContextType {
  settings: AppSettings;
  setMode: (mode: AppMode) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: Language) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const defaultSettings: AppSettings = {
    theme: 'system',
    language: 'de',
    mode: 'work'
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const { setTheme: applyTheme } = useTheme();
  const { setLanguage: applyLanguage } = useTranslation();

  // Load settings from storage on initial mount
  useEffect(() => {
    const loadedSettings = storageService.getSettings();
    if (loadedSettings) {
      setSettings(loadedSettings);
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
    setSettings(prev => ({ ...prev, mode }));
  }, []);

  const setTheme = useCallback((theme: AppTheme) => {
    setSettings(prev => ({ ...prev, theme }));
  }, []);

  const setLanguage = useCallback((language: Language) => {
    setSettings(prev => ({...prev, language}));
  }, []);


  const value = useMemo(() => ({
    settings,
    setMode,
    setTheme,
    setLanguage
  }), [settings, setMode, setTheme, setLanguage]);

  if (!isLoaded) {
      return null;
  }

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
