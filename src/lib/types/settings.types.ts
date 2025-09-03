export type AppMode = 'work' | 'learning';
export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
    theme: AppTheme;
    language: 'en' | 'de';
    mode: AppMode;
    dailyGoal?: number;
    weeklyGoal?: number;
    organizationName?: string | null;
    organizationSerialNumber?: string | null;
    isAdmin?: boolean;
}

export interface SettingsContextType {
    settings: AppSettings;
    isLoaded: boolean;
    timerIsActive: boolean;
    setMode: (mode: AppMode) => void;
    setTheme: (theme: AppTheme) => void;
    setLanguage: (language: 'en' | 'de') => void;
    setWorkGoals: (goals: { dailyGoal?: number; weeklyGoal?: number }) => void;
    setOrganization: (name: string | null, serial: string | null) => void;
    setIsAdmin: (isAdmin: boolean) => void;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    setTimerResetCallback: (callback: () => void) => void;
    setTimerIsActiveCallback: (isActive: boolean) => void;
    setEndCurrentSessionCallback: (callback: () => void) => void;
}
