
export interface Session {
  type: 'work' | 'pause';
  start: Date;
  end: Date | null;
  note?: string;
  learningGoal?: string;
  topics?: string[];
  completionPercentage?: number;
}

export type AppMode = 'work' | 'learning';
export type AppTheme = 'light' | 'dark' | 'system';

export interface AppSettings {
    theme: AppTheme;
    language: 'en' | 'de';
    mode: AppMode;
    dailyGoal?: number;
    weeklyGoal?: number;
}

export interface DayHistory {
    id: string; // e.g., '2024-07-28'
    date: string;
    sessions: Session[];
}
