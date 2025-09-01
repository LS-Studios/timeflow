
"use client";

import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import type { AppMode } from '@/lib/types';


interface SettingsContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  // Future settings can be added here
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('work');

  const value = useMemo(() => ({
    mode,
    setMode,
  }), [mode]);

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
