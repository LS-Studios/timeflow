

"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

export type Language = 'en' | 'de';

type Translations = {
  [key: string]: string;
};

const translations: Record<Language, Translations> = {
  en: {
    // General UI
    pomodoro: 'Pomodoro',
    stopwatch: 'Stopwatch',
    custom: 'Custom',
    start: 'Start',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    cancel: 'Cancel',
    edit: "Edit",
    saveChanges: "Save Changes",
    add: "Add",
    noResults: "No results found.",
    work: "Work",
    learning: "Learning",
    break: "Break",
    ongoing: "Ongoing",
    
    // Login & Profile
    welcomeBack: 'Welcome back',
    createAccount: 'Create your account',
    loginDescription: 'Enter your credentials to access your account.',
    registerDescription: 'Fill in the details below to get started.',
    name: 'Name',
    namePlaceholder: 'e.g. Max Mustermann',
    email: 'Email',
    password: 'Password',
    login: 'Login',
    useWithoutSync: 'Use without synchronization',
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    signUp: "Sign up",
    logout: "Logout",
    profile: "Profile",
    
    // Password Strength
    passwordRequirementLength: "At least 8 characters",
    passwordRequirementUppercase: "One uppercase letter",
    passwordRequirementLowercase: "One lowercase letter",
    passwordRequirementNumber: "One number",
    passwordRequirementSpecial: "One special character",
    
    // Auth Errors
    errorInvalidEmail: "The email address is not valid.",
    errorInvalidCredential: "The email or password you entered is incorrect.",
    errorEmailInUse: "This email address is already in use by another account.",
    errorWeakPassword: "The password is too weak. Please choose a stronger one.",
    errorGeneric: "An unexpected error occurred. Please try again.",
    errorFillAllFields: "Please fill in all fields.",

    // Timer Page
    endDay: 'End Day',
    workDayEnded: "Work day ended",
    workDayEndedDescription: "Your time has been saved. Well done!",
    continueWorking: "Continue working",

    // Pause Dialog
    addPauseNote: 'Add Pause Note',
    addPauseNoteDescription: "Quickly log your break or add a custom note.",
    notePlaceholder: "e.g., quick chat with a colleague...",
    saveNote: "Save Note",
    breakCoffee: "Coffee break",
    breakToilet: "Restroom break",
    breakFreshAir: "Fresh air",
    breakSmoking: "Smoking break",
    breakOther: "Other...",
    
    // Reset Dialog
    areYouSure: 'Are you absolutely sure?',
    resetConfirmation: "This will clear all recorded sessions for today. This cannot be undone.",
    confirmReset: "Yes, reset",

    // Settings Page
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
    deleteAccountConfirmation: 'This action cannot be undone. This will permanently delete your account and remove your data from our servers.',
    confirmDelete: 'Yes, delete my account',
    appMode: "App Mode",
    appModeDescription: "Choose whether you want to track work or learning time.",
    modeWork: "Track Work",
    modeLearning: "Track Learning",
    modeChangeWarning: "A session is currently running. Switching modes will end the current session and save it. Do you want to proceed?",
    confirmModeChange: "Yes, switch mode",

    // Work Mode Settings
    workGoals: "Work Goals",
    workGoalsDescription: "Set your daily and weekly work hour goals.",
    dailyGoal: "Daily Goal (hours)",
    weeklyGoal: "Weekly Goal (hours)",
    organization: "Organization",
    organizationDescription: "Connect your account to your company's organization.",
    noOrganization: "Not connected to any organization",
    manage: "Manage",
    join: "Join",
    joinOrganization: "Join Organization",
    joinOrganizationDescription: "Enter the serial number provided by your administrator to connect to your organization.",
    serialNumber: "Serial Number",
    serialNumberPlaceholder: "Enter serial number...",
    connect: "Connect",
    leaveOrganization: "Leave Organization",
    leaveOrganizationConfirmation: "Are you sure you want to leave your organization? You will need to be re-invited to join again.",
    confirmLeave: "Yes, leave",
    connectedTo: "Connected to",
    
    // Learning Mode
    startLearningSession: "Start Learning Session",
    whatDidYouLearn: "Define your main goal and specific objectives for this session.",
    learningGoal: "Main Learning Goal",
    learningGoalPlaceholder: "e.g., master Next.js App Router",
    learningObjectives: "Specific Objectives",
    addObjectivePlaceholder: "Add an objective and press Enter...",
    topics: "Topics / Labels",
    addTopicPlaceholder: "Add or find a topic...",
    startLearning: "Start Learning",
    endLearningSession: "End Learning Session",
    endLearningSessionDescription: "Rate how much you accomplished of what you originally planned.",
    noLearningObjectives: "No learning objectives were set for this session.",
    generalProgress: "How much did you accomplish?",
    generalProgressDescription: "Rate how much you accomplished of what you originally planned.",
    totalCompletion: "Total Completion",
    saveAndEnd: "Save & End Session",

    // Admin Settings
    adminSettings: "Admin Settings",
    adminSettingsDescription: "Configure admin privileges and access to management features.",
    enableAdminMode: "Enable Admin Mode",

    // Analytics Page
    analytics: "Analytics",
    analyticsDescription: "Review your work patterns, productivity, and history.",
    learningAnalyticsDescription: "Review your learning patterns and progress.",
    notEnoughData: "Not enough data yet",
    noHistoryDescriptionWork: "Start tracking your work time to see your analytics here.",
    noHistoryDescriptionLearning: "Start a learning session to see your progress here.",
    
    // Work Analytics
    workLifeBalance: "Work / Life Balance",
    breakdown: "Breakdown",
    overtime: "Overtime",
    overtimeDescription: "Total overtime accumulated.",
    history: "History",
    historyDescriptionWork: "A log of all your past work days. Click a row for details.",
    searchHistory: "Search by date...",
    date: "Date",
    workDuration: "Work Duration",
    breakDuration: "Break Duration",

    // Learning Analytics
    learningHistory: "Learning History",
    learningHistoryDescription: "A log of all your learning sessions. Click on an entry for details.",
    searchHistoryLearning: "Search by goal, objective, or topic...",
    goal: "Goal",
    completion: "Completion",
    learningFocus: "Learning Focus",
    completionOverTime: "Completion over Time",
    averageSessionSuccess: "Average Session Success",
    averageSessionSuccessDescription: "Average completion rate across all sessions.",
    noTopicsYet: "No topics recorded yet. Add some in your next session!",
    
    // Detail Dialogs
    learningSessionDetails: "Learning Session Details",
    editLearningSession: "Edit Learning Session",
    editLearningSessionDescription: "Adjust the details of your completed session.",
    detailsFor: "Details for",
    editWorkDayDescription: "Here you can see the timeline of your day and edit individual sessions.",
    editSession: "Edit Session",
    editSessionDescription: "Adjust the start and end times or the note for this session.",
    startTime: "Start Time",
    endTime: "End Time",
    note: "Note",
    deleteSessionConfirmation: "This action cannot be undone. This will permanently delete the session. If it is a pause, the adjacent work sessions will be merged.",
    confirmDeleteSession: "Yes, delete session",
    requestChange: "Request Change",
    reasonForChange: "Reason for change",
    reasonForChangePlaceholder: "Please describe why you are requesting this change...",
    requestSent: "Request Sent",
    requestSentDescription: "Your change request has been submitted for review.",
    requestPending: "Request Pending",
    requestPendingDescription: "Changes for this day are pending review.",
    requestPendingDescriptionLong: "A change request for this day has already been sent and is currently under review. Further edits are disabled until the request has been processed.",

  },
  de: {
    // Allgemeine UI
    pomodoro: 'Pomodoro',
    stopwatch: 'Stoppuhr',
    custom: 'Benutzerdefiniert',
    start: 'Start',
    pause: 'Pause',
    resume: 'Fortsetzen',
    reset: 'Zurücksetzen',
    cancel: 'Abbrechen',
    edit: "Bearbeiten",
    saveChanges: "Änderungen speichern",
    add: "Hinzufügen",
    noResults: "Keine Ergebnisse gefunden.",
    work: "Arbeit",
    learning: "Lernen",
    break: "Pause",
    ongoing: "Laufend",
    
    // Login & Profil
    welcomeBack: 'Willkommen zurück',
    createAccount: 'Erstellen Sie Ihr Konto',
    loginDescription: 'Geben Sie Ihre Anmeldedaten ein, um auf Ihr Konto zuzugreifen.',
    registerDescription: 'Füllen Sie die folgenden Details aus, um zu beginnen.',
    name: 'Name',
    namePlaceholder: 'z.B. Max Mustermann',
    email: 'E-Mail',
    password: 'Passwort',
    login: 'Anmelden',
    useWithoutSync: 'Ohne Synchronisation verwenden',
    noAccount: "Haben Sie noch kein Konto?",
    hasAccount: "Haben Sie bereits ein Konto?",
    signUp: "Registrieren",
    logout: "Abmelden",
    profile: "Profil",

    // Passwortstärke
    passwordRequirementLength: "Mindestens 8 Zeichen",
    passwordRequirementUppercase: "Ein Grossbuchstabe",
    passwordRequirementLowercase: "Ein Kleinbuchstabe",
    passwordRequirementNumber: "Eine Zahl",
    passwordRequirementSpecial: "Ein Sonderzeichen",

    // Auth-Fehler
    errorInvalidEmail: "Die E-Mail-Adresse ist ungültig.",
    errorInvalidCredential: "Die eingegebene E-Mail-Adresse oder das Passwort ist falsch.",
    errorEmailInUse: "Diese E-Mail-Adresse wird bereits von einem anderen Konto verwendet.",
    errorWeakPassword: "Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres.",
    errorGeneric: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    errorFillAllFields: "Bitte füllen Sie alle Felder aus.",

    // Timer-Seite
    endDay: 'Arbeitstag beenden',
    workDayEnded: "Arbeitstag beendet",
    workDayEndedDescription: "Deine Zeit wurde gespeichert. Gut gemacht!",
    continueWorking: "Weiterarbeiten",

    // Pausen-Dialog
    addPauseNote: 'Notiz zur Pause hinzufügen',
    addPauseNoteDescription: "Wählen Sie eine schnelle Option oder fügen Sie eine eigene Notiz hinzu.",
    notePlaceholder: "z.B. kurze Besprechung...",
    saveNote: "Notiz speichern",
    breakCoffee: "Kaffeepause",
    breakToilet: "Toilettenpause",
    breakFreshAir: "Frische Luft",
    breakSmoking: "Raucherpause",
    breakOther: "Anderes...",
    
    // Zurücksetzen-Dialog
    areYouSure: 'Sind Sie absolut sicher?',
    resetConfirmation: "Dadurch werden alle für heute erfassten Sitzungen gelöscht. Dies kann nicht rückgängig gemacht werden.",
    confirmReset: "Ja, zurücksetzen",

    // Einstellungsseite
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
    deleteAccountConfirmation: 'Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird Ihr Konto dauerhaft gelöscht und Ihre Daten von unseren Servern entfernt.',
    confirmDelete: 'Ja, mein Konto löschen',
    appMode: "App-Modus",
    appModeDescription: "Wähle, ob du Arbeits- oder Lernzeit erfassen möchtest.",
    modeWork: "Arbeitszeit erfassen",
    modeLearning: "Lernzeit erfassen",
    modeChangeWarning: "Eine Sitzung läuft gerade. Wenn Sie den Modus wechseln, wird die aktuelle Sitzung beendet und gespeichert. Möchten Sie fortfahren?",
    confirmModeChange: "Ja, Modus wechseln",

    // Arbeitsmodus-Einstellungen
    workGoals: "Arbeitsziele",
    workGoalsDescription: "Legen Sie Ihre täglichen und wöchentlichen Arbeitszeitziele fest.",
    dailyGoal: "Tagesziel (Stunden)",
    weeklyGoal: "Wochenziel (Stunden)",
    organization: "Organisation",
    organizationDescription: "Verbinden Sie Ihr Konto mit der Organisation Ihres Unternehmens.",
    noOrganization: "Mit keiner Organisation verbunden",
    manage: "Verwalten",
    join: "Beitreten",
    joinOrganization: "Organisation beitreten",
    joinOrganizationDescription: "Geben Sie die von Ihrem Administrator bereitgestellte Seriennummer ein, um sich mit Ihrer Organisation zu verbinden.",
    serialNumber: "Seriennummer",
    serialNumberPlaceholder: "Seriennummer eingeben...",
    connect: "Verbinden",
    leaveOrganization: "Organisation verlassen",
    leaveOrganizationConfirmation: "Möchten Sie Ihre Organisation wirklich verlassen? Sie müssen erneut eingeladen werden, um wieder beizutreten.",
    confirmLeave: "Ja, verlassen",
    connectedTo: "Verbunden mit",
    
    // Lernmodus
    startLearningSession: "Lernsitzung starten",
    whatDidYouLearn: "Definiere dein Hauptziel und die spezifischen Lernziele für diese Sitzung.",
    learningGoal: "Haupt-Lernziel",
    learningGoalPlaceholder: "z.B. Next.js App Router meistern",
    learningObjectives: "Spezifische Lernziele",
    addObjectivePlaceholder: "Lernziel eingeben und Enter drücken...",
    topics: "Themen / Schlagwörter",
    addTopicPlaceholder: "Thema hinzufügen oder suchen...",
    startLearning: "Lernen starten",
    endLearningSession: "Lernsitzung beenden",
    endLearningSessionDescription: "Bewerte, wie viel du von dem geschafft hast, was du dir ursprünglich vorgenommen hattest.",
    noLearningObjectives: "Für diese Sitzung wurden keine Lernziele festgelegt.",
    generalProgress: "Wie viel hast du geschafft?",
    generalProgressDescription: "Bewerte, wie viel du von dem geschafft hast, was du dir ursprünglich vorgenommen hattest.",
    totalCompletion: "Gesamterfolg",
    saveAndEnd: "Speichern & Sitzung beenden",

    // Admin Einstellungen
    adminSettings: "Admin-Einstellungen",
    adminSettingsDescription: "Admin-Berechtigungen und Zugang zu Verwaltungsfunktionen konfigurieren.",
    enableAdminMode: "Admin-Modus aktivieren",

    // Analyse-Seite
    analytics: "Analyse",
    analyticsDescription: "Analysieren Sie Ihre Arbeitsmuster, Produktivität und Ihren Verlauf.",
    learningAnalyticsDescription: "Analysieren Sie Ihre Lernmuster und Fortschritte.",
    notEnoughData: "Noch nicht genügend Daten",
    noHistoryDescriptionWork: "Starte eine Arbeitssitzung, um deine Analysen hier zu sehen.",
    noHistoryDescriptionLearning: "Starte eine Lernsitzung, um deine Fortschritte hier zu sehen.",
    
    // Arbeits-Analyse
    workLifeBalance: "Work-Life-Balance",
    breakdown: "Pausen-Aufschlüsselung",
    overtime: "Überstunden",
    overtimeDescription: "Summe der angesammelten Überstunden.",
    history: "Verlauf",
    historyDescriptionWork: "Ein Protokoll all Ihrer vergangenen Arbeitstage. Klicken Sie auf eine Zeile für Details.",
    searchHistory: "Nach Datum suchen...",
    date: "Datum",
    workDuration: "Arbeitsdauer",
    breakDuration: "Pausendauer",

    // Lern-Analyse
    learningHistory: "Lernverlauf",
    learningHistoryDescription: "Ein Protokoll all Ihrer Lernsitzungen. Klicken Sie auf einen Eintrag für Details.",
    searchHistoryLearning: "Nach Ziel, Lernziel oder Thema suchen...",
    goal: "Ziel",
    completion: "Zielerreichung",
    learningFocus: "Lernfokus",
    completionOverTime: "Zielerreichung im Zeitverlauf",
    averageSessionSuccess: "Ø Sitzungserfolg",
    averageSessionSuccessDescription: "Durchschnittliche Zielerreichung über alle Sitzungen.",
    noTopicsYet: "Noch keine Themen erfasst. Füge welche in deiner nächsten Sitzung hinzu!",
    
    // Detail-Dialoge
    learningSessionDetails: "Details zur Lernsitzung",
    editLearningSession: "Lernsitzung bearbeiten",
    editLearningSessionDescription: "Passen Sie die Details Ihrer abgeschlossenen Sitzung an.",
    detailsFor: "Details für",
    editWorkDayDescription: "Hier sehen Sie den Zeitverlauf Ihres Tages und können einzelne Sitzungen bearbeiten.",
    editSession: "Sitzung bearbeiten",
    editSessionDescription: "Passen Sie die Start- und Endzeiten oder die Notiz für diese Sitzung an.",
    startTime: "Startzeit",
    endTime: "Endzeit",
    note: "Notiz",
    deleteSessionConfirmation: "Diese Aktion kann nicht rückgängig gemacht werden. Die Sitzung wird endgültig gelöscht. Wenn es sich um eine Pause handelt, werden die angrenzenden Arbeitssitzungen zusammengeführt.",
    confirmDeleteSession: "Ja, Sitzung löschen",
    requestChange: "Änderung anfragen",
    reasonForChange: "Grund für die Änderung",
    reasonForChangePlaceholder: "Bitte beschreiben Sie, warum Sie diese Änderung beantragen...",
    requestSent: "Anfrage gesendet",
    requestSentDescription: "Ihre Änderungsanfrage wurde zur Überprüfung eingereicht.",
    requestPending: "Anfrage ausstehend",
    requestPendingDescription: "Änderungen für diesen Tag warten auf Überprüfung.",
    requestPendingDescriptionLong: "Ein Änderungsantrag für diesen Tag wurde bereits gesendet und wird derzeit geprüft. Weitere Bearbeitungen sind deaktiviert, bis der Antrag bearbeitet wurde.",
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
