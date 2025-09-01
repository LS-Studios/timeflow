
"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

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
    analytics: "Analytics",
    analyticsDescription: "Review your work patterns, productivity, and history.",
    workLifeBalance: "Work / Life Balance",
    breakdown: "Breakdown",
    overtime: "Overtime",
    overtimeDescription: "Total overtime accumulated.",
    last30days: "in the last 30 days",
    history: "History",
    historyDescription: "A log of all your past work days.",
    searchHistory: "Search by date...",
    date: "Date",
    workDuration: "Work Duration",
    breakDuration: "Break Duration",
    appMode: "App Mode",
    appModeDescription: "Choose whether you want to track work or learning time.",
    modeWork: "Track Work",
    modeLearning: "Track Learning",
    startLearningSession: "Start Learning Session",
    learningGoal: "Learning Goal",
    topics: "Topics",
    addTopics: "Add topics...",
    searchOrAddTopic: "Search or add a new topic...",
    noTopicsFound: "No topics found. Press Enter to add.",
    learningGoalPlaceholder: "e.g., understand React server components",
    startLearning: "Start Learning",
    whatDidYouLearn: "What's your learning goal for this session?",
    endLearningSession: "End Learning Session",
    endLearningSessionDescription: "Rate how much of your goal you accomplished.",
    completionRate: "Completion Rate",
    saveAndEnd: "Save & End",
    learningAnalyticsDescription: "Review your learning patterns and progress.",
    learningHistory: "Learning History",
    learningHistoryDescription: "A log of all your learning sessions.",
    goal: "Goal",
    completion: "Completion",
    learningFocus: "Learning Focus",
    completionOverTime: "Completion over Time",
    notEnoughData: "Not enough data yet",
    noHistoryDescriptionWork: "Start tracking your work time to see your analytics here.",
    noHistoryDescriptionLearning: "Start a learning session to see your progress here.",
    workDayEnded: "Work day ended",
    workDayEndedDescription: "Your time has been saved. Well done!",
    startNewDay: "Start new day",
    continueWorking: "Continue working",
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
    analytics: "Analyse",
    analyticsDescription: "Analysieren Sie Ihre Arbeitsmuster, Produktivität und Ihren Verlauf.",
    workLifeBalance: "Work-Life-Balance",
    breakdown: "Pausen-Aufschlüsselung",
    overtime: "Überstunden",
    overtimeDescription: "Summe der angesammelten Überstunden.",
    last30days: "in den letzten 30 Tagen",
    history: "Verlauf",
    historyDescription: "Ein Protokoll all Ihrer vergangenen Arbeitstage.",
    searchHistory: "Nach Datum suchen...",
    date: "Datum",
    workDuration: "Arbeitsdauer",
    breakDuration: "Pausendauer",
    appMode: "App-Modus",
    appModeDescription: "Wähle, ob du Arbeits- oder Lernzeit erfassen möchtest.",
    modeWork: "Arbeitszeit erfassen",
    modeLearning: "Lernzeit erfassen",
    startLearningSession: "Lernsitzung starten",
    learningGoal: "Lernziel",
    topics: "Themen",
    addTopics: "Themen hinzufügen...",
    searchOrAddTopic: "Suchen oder neues Thema hinzufügen...",
    noTopicsFound: "Keine Themen gefunden. Drücke Enter zum Hinzufügen.",
    learningGoalPlaceholder: "z.B. React Server Components verstehen",
    startLearning: "Lernen starten",
    whatDidYouLearn: "Was ist dein Lernziel für diese Sitzung?",
    endLearningSession: "Lernsitzung beenden",
    endLearningSessionDescription: "Bewerte, wie viel von deinem Ziel du erreicht hast.",
    completionRate: "Zielerreichung",
    saveAndEnd: "Speichern & Beenden",
    learningAnalyticsDescription: "Analysieren Sie Ihre Lernmuster und Fortschritte.",
    learningHistory: "Lernverlauf",
    learningHistoryDescription: "Ein Protokoll all Ihrer Lernsitzungen.",
    goal: "Ziel",
    completion: "Erreicht",
    learningFocus: "Lernfokus",
    completionOverTime: "Zielerreichung im Zeitverlauf",
    notEnoughData: "Noch nicht genügend Daten",
    noHistoryDescriptionWork: "Starte eine Arbeitssitzung, um deine Analysen hier zu sehen.",
    noHistoryDescriptionLearning: "Starte eine Lernsitzung, um deine Fortschritte hier zu sehen.",
    workDayEnded: "Arbeitstag beendet",
    workDayEndedDescription: "Deine Zeit wurde gespeichert. Gut gemacht!",
    startNewDay: "Neuen Tag starten",
    continueWorking: "Weiterarbeiten",
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de');

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string) => {
    return translations[language][key] || translations['en'][key] || key;
  }, [language]);

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
