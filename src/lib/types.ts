

export interface LearningObjective {
  text: string;
  completed: number; // Percentage from 0 to 100
}

export interface Session {
  id: string; // Unique ID for each session
  type: 'work' | 'pause';
  start: Date;
  end: Date | null;
  note?: string;
  // Learning mode specific
  learningGoal?: string; // Main goal title
  learningObjectives?: LearningObjective[];
  topics?: string[]; // High-level categories like "Math", "German", "Uni"
  completionPercentage?: number; // Overall completion
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

// DayHistory is no longer the primary storage unit, but a derived type for analytics.
export interface DayHistory {
    id: string; // e.g., '2024-07-28'
    date: string;
    sessions: Session[];
}
