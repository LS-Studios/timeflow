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
    endDay: 'End Day',
    addPauseNote: 'Add Pause Note',
    addPauseNoteDescription: "Quickly log your break or add a custom note.",
    notePlaceholder: "e.g., quick chat with a colleague...",
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
    confirmDelete: 'Yes, delete my account',
    workGoals: "Work Goals",
    workGoalsDescription: "Set your daily and weekly work hour goals.",
    dailyGoal: "Daily Goal (hours)",
    weeklyGoal: "Weekly Goal (hours)",
    breakCoffee: "Coffee break",
    breakToilet: "Restroom break",
    breakFreshAir: "Fresh air",
    breakSmoking: "Smoking break",
    breakOther: "Other...",
    resetConfirmation: "This will reset the timer and clear all recorded sessions for the day. Are you sure?",
    confirmReset: "Yes, reset",
    areYouSureEndDay: "End your work day?",
    endDayConfirmation: "This will finalize your last session and reset the timer. You can't undo this.",
    confirmEndDay: "Yes, end day",
  },
  de: {
    pomodoro: 'Pomodoro',
    stopwatch: 'Stoppuhr',
    custom: 'Benutzerdef.',
    start: 'Start',
    pause: 'Pause',
    resume: 'Fortsetzen',
    reset: 'Zurücksetzen',
    endDay: 'Arbeitstag beenden',
    addPauseNote: 'Notiz zur Pause hinzufügen',
    addPauseNoteDescription: "Wählen Sie eine schnelle Option oder fügen Sie eine eigene Notiz hinzu.",
    notePlaceholder: "z.B. kurze Besprechung...",
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
    confirmDelete: 'Ja, mein Konto löschen',
    workGoals: "Arbeitsziele",
    workGoalsDescription: "Legen Sie Ihre täglichen und wöchentlichen Arbeitszeitziele fest.",
    dailyGoal: "Tagesziel (Stunden)",
    weeklyGoal: "Wochenziel (Stunden)",
    breakCoffee: "Kaffeepause",
    breakToilet: "Toilettenpause",
    breakFreshAir: "Frische Luft schnappen",
    breakSmoking: "Raucherpause",
    breakOther: "Anderes...",
    resetConfirmation: "Dadurch wird der Timer zurückgesetzt und alle aufgezeichneten Sitzungen für den Tag werden gelöscht. Sind Sie sicher?",
    confirmReset: "Ja, zurücksetzen",
    areYouSureEndDay: "Arbeitstag beenden?",
    endDayConfirmation: "Dadurch wird Ihre letzte Sitzung abgeschlossen und der Timer zurückgesetzt. Dies kann nicht rückgängig gemacht werden.",
    confirmEndDay: "Ja, Arbeitstag beenden",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('de');

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
