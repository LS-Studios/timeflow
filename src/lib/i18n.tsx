

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
    resetConfirmation: "This will clear all recorded sessions for today. This cannot be undone.",
    confirmReset: "Yes, reset",
    areYouSureEndDay: "End your work day?",
    endDayConfirmation: "This will finalize your last session. You will be able to continue working afterwards if you wish.",
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
    searchHistoryLearning: "Search by goal, objective, or topic...",
    date: "Date",
    workDuration: "Work Duration",
    breakDuration: "Break Duration",
    appMode: "App Mode",
    appModeDescription: "Choose whether you want to track work or learning time.",
    modeWork: "Track Work",
    modeLearning: "Track Learning",
    startLearningSession: "Start Learning Session",
    learningGoal: "Main Learning Goal",
    learningObjectives: "Specific Objectives",
    addObjectivePlaceholder: "Add an objective and press Enter...",
    learningGoalPlaceholder: "e.g., master Next.js App Router",
    startLearning: "Start Learning",
    whatDidYouLearn: "Define your main goal and specific objectives for this session.",
    endLearningSession: "End Learning Session",
    endLearningSessionDescription: "Check off your objectives and rate your progress.",
    totalCompletion: "Total Completion",
    saveAndEnd: "Save & End Session",
    learningAnalyticsDescription: "Review your learning patterns and progress.",
    learningHistory: "Learning History",
    learningHistoryDescription: "A log of all your learning sessions. Click on an entry for details.",
    goal: "Goal",
    completion: "Completion",
    learningFocus: "Learning Focus",
    completionOverTime: "Completion over Time",
    learningSessionDetails: "Learning Session Details",
    notEnoughData: "Not enough data yet",
    noHistoryDescriptionWork: "Start tracking your work time to see your analytics here.",
    noHistoryDescriptionLearning: "Start a learning session to see your progress here.",
    workDayEnded: "Work day ended",
    workDayEndedDescription: "Your time has been saved. Well done!",
    continueWorking: "Continue working",
    modeChangeWarning: "A session is currently running. Switching modes will end the current session and save it. Do you want to proceed?",
    confirmModeChange: "Yes, switch mode",
    topics: "Topics / Labels",
    addTopicPlaceholder: "Add or find a topic...",
    averageSessionSuccess: "Average Session Success",
    averageSessionSuccessDescription: "Average completion rate across all sessions.",
    noTopicsYet: "No topics recorded yet. Add some in your next session!",
    edit: "Edit",
    editLearningSession: "Edit Learning Session",
    editLearningSessionDescription: "Adjust the details of your completed session.",
    saveChanges: "Save Changes",
    add: "Add",
    noResults: "No results found."
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
    resetConfirmation: "Dadurch werden alle für heute erfassten Sitzungen gelöscht. Dies kann nicht rückgängig gemacht werden.",
    confirmReset: "Ja, zurücksetzen",
    areYouSureEndDay: "Arbeitstag beenden?",
    endDayConfirmation: "Dadurch wird Ihre letzte Sitzung abgeschlossen. Sie können danach bei Bedarf weiterarbeiten.",
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
    searchHistoryLearning: "Nach Ziel, Lernziel oder Thema suchen...",
    date: "Datum",
    workDuration: "Arbeitsdauer",
    breakDuration: "Pausendauer",
    appMode: "App-Modus",
    appModeDescription: "Wähle, ob du Arbeits- oder Lernzeit erfassen möchtest.",
    modeWork: "Arbeitszeit erfassen",
    modeLearning: "Lernzeit erfassen",
    startLearningSession: "Lernsitzung starten",
    learningGoal: "Haupt-Lernziel",
    learningObjectives: "Spezifische Lernziele",
    addObjectivePlaceholder: "Lernziel eingeben und Enter drücken...",
    learningGoalPlaceholder: "z.B. Next.js App Router meistern",
    startLearning: "Lernen starten",
    whatDidYouLearn: "Definiere dein Hauptziel und die spezifischen Lernziele für diese Sitzung.",
    endLearningSession: "Lernsitzung beenden",
    endLearningSessionDescription: "Hake deine Ziele ab und bewerte deinen Fortschritt.",
    totalCompletion: "Gesamterfolg",
    saveAndEnd: "Speichern & Sitzung beenden",
    learningAnalyticsDescription: "Analysieren Sie Ihre Lernmuster und Fortschritte.",
    learningHistory: "Lernverlauf",
    learningHistoryDescription: "Ein Protokoll all Ihrer Lernsitzungen. Klicken Sie auf einen Eintrag für Details.",
    goal: "Ziel",
    completion: "Erreicht",
    learningFocus: "Lernfokus",
    completionOverTime: "Zielerreichung im Zeitverlauf",
    learningSessionDetails: "Details zur Lernsitzung",
    notEnoughData: "Noch nicht genügend Daten",
    noHistoryDescriptionWork: "Starte eine Arbeitssitzung, um deine Analysen hier zu sehen.",
    noHistoryDescriptionLearning: "Starte eine Lernsitzung, um deine Fortschritte hier zu sehen.",
    workDayEnded: "Arbeitstag beendet",
    workDayEndedDescription: "Deine Zeit wurde gespeichert. Gut gemacht!",
    continueWorking: "Weiterarbeiten",
    modeChangeWarning: "Eine Sitzung läuft gerade. Wenn Sie den Modus wechseln, wird die aktuelle Sitzung beendet und gespeichert. Möchten Sie fortfahren?",
    confirmModeChange: "Ja, Modus wechseln",
    topics: "Themen / Labels",
    addTopicPlaceholder: "Thema hinzufügen oder suchen...",
    averageSessionSuccess: "Ø Sitzungserfolg",
    averageSessionSuccessDescription: "Durchschnittlicher Abschlussgrad aller Sitzungen.",
    noTopicsYet: "Noch keine Themen erfasst. Füge welche in deiner nächsten Sitzung hinzu!",
    edit: "Bearbeiten",
    editLearningSession: "Lernsitzung bearbeiten",
    editLearningSessionDescription: "Passen Sie die Details Ihrer abgeschlossenen Sitzung an.",
    saveChanges: "Änderungen speichern",
    add: "Hinzufügen",
    noResults: "Keine Ergebnisse gefunden."
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

    