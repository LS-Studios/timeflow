

export interface LearningObjective {
  text: string;
  completed: number; // Percentage from 0 to 100
}

export interface SessionStep {
  id: string;
  type: 'work' | 'pause';
  start: Date;
  end: Date | null;
  note?: string | null;
}

export interface Session {
  id: string; // Unique ID for each session
  date: string; // YYYY-MM-DD format
  start: Date; // When the session was first started
  end: Date | null; // When the session was completed/ended
  mode: 'work' | 'learning';
  
  // Learning mode specific (only for learning sessions)
  learningGoal?: string; // Main goal title
  learningObjectives?: LearningObjective[];
  topics?: string[]; // High-level categories like "Math", "German", "Uni"
  completionPercentage?: number; // Overall completion
  
  // The actual work/pause steps within this session
  steps: SessionStep[];
  
  // Session metadata
  totalWorkTime?: number; // Total work time in milliseconds
  isCompleted: boolean; // Whether the session was formally ended
  
  // For work mode: there should be only one work session per day
  // For learning mode: there can be multiple learning sessions per day
}

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

export interface OrganizationData {
    serialNumber: string;
    name: string;
    adminUserId: string;
    createdAt: string;
    employees: Record<string, boolean>; // Object of user IDs for faster lookups/writes
}

// DayHistory is no longer the primary storage unit, but a derived type for analytics.
export interface DayHistory {
    id: string; // e.g., '2024-07-28'
    date: string;
    sessions: Session[];
}
