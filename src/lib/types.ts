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

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: 'en' | 'de';
    mode: AppMode;
    // Potentially add work goals here in the future
}

export interface DayHistory {
    id: string; // e.g., '2024-07-28'
    date: string;
    sessions: Session[];
}
