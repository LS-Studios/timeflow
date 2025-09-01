"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'en' | 'de';

type Translations = {
  [key: string]: string;
};

const translations: Record<Language, Translations> = {
  en: {
    pomodoro: 'Pomodoro',
    stopwatch: 'Stopwatch',
    custom: 'Custom',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    addPauseNote: 'Add Pause Note',
    addPauseNoteDescription: "Jot down what you did during your break. This can help you stay on track.",
    notePlaceholder: "e.g., took a coffee break...",
    saveNote: "Save Note",
    settings: 'Settings',
    settingsDescription: 'Manage your app and account settings.',
    appearance: 'Appearance',
    appearanceDescription: 'Customize the look and feel of the app.',
    light: 'Light',
    dark: 'Dark',
    system: 'System',
    language: 'Language',
    languageDescription: 'Choose your preferred language.',
    selectLanguage: 'Select a language',
    dangerZone: 'Danger Zone',
    dangerZoneDescription: 'These actions are permanent and cannot be undone.',
    deleteAccount: 'Delete Account & Data',
    areYouSure: 'Are you absolutely sure?',
    deleteAccountConfirmation: 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
    cancel: 'Cancel',
    confirmDelete: 'Yes, delete my account'
  },
  de: {
    pomodoro: 'Pomodoro',
    stopwatch: 'Stoppuhr',
    custom: 'Benutzerdef.',
    start: 'Start',
    pause: 'Pause',
    resume: 'Fortsetzen',
    reset: 'Zurücksetzen',
    addPauseNote: 'Notiz zur Pause hinzufügen',
    addPauseNoteDescription: "Notieren Sie, was Sie während Ihrer Pause gemacht haben. Das kann Ihnen helfen, den Überblick zu behalten.",
    notePlaceholder: "z.B. eine Kaffeepause gemacht...",
    saveNote: "Notiz speichern",
    settings: 'Einstellungen',
    settingsDescription: 'Verwalten Sie Ihre App- und Kontoeinstellungen.',
    appearance: 'Erscheinungsbild',
    appearanceDescription: 'Passen Sie das Aussehen der App an.',
    light: 'Hell',
    dark: 'Dunkel',
    system: 'System',
    language: 'Sprache',
    languageDescription: 'Wählen Sie Ihre bevorzugte Sprache.',
    selectLanguage: 'Sprache auswählen',
    dangerZone: 'Gefahrenzone',
    dangerZoneDescription: 'Diese Aktionen sind endgültig und können nicht rückgängig gemacht werden.',
    deleteAccount: 'Konto & Daten löschen',
    areYouSure: 'Sind Sie absolut sicher?',
    deleteAccountConfirmation: 'Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird Ihr Konto dauerhaft gelöscht und Ihre Daten von unseren Servern entfernt.',
    cancel: 'Abbrechen',
    confirmDelete: 'Ja, mein Konto löschen'
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
