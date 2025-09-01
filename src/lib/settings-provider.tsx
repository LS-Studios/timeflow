
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { AppMode, AppSettings } from '@/lib/types';
import { storageService } from './storage';
import { useTranslation } from './i18n';

interface SettingsContextType {
  settings: AppSettings;
  setMode: (mode: AppMode) => void;
  // This context will now manage all settings, including theme and language
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
  const { setTheme } = useTheme();
  const { setLanguage } = useTranslation();

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
      setTheme(settings.theme);
      setLanguage(settings.language);
      storageService.saveSettings(settings);
    }
  }, [settings, isLoaded, setTheme, setLanguage]);

  const setMode = (mode: AppMode) => {
    setSettings(prev => ({ ...prev, mode }));
  };

  const value = useMemo(() => ({
    // We pass the whole settings object, but also individual setters for convenience
    settings,
    setMode,
  }), [settings]);

  // The provider now needs to know about settings before rendering children
  // to avoid flicker
  if (!isLoaded) {
      return null; // or a loading spinner
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
