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


// DayHistory is no longer the primary storage unit, but a derived type for analytics.
export interface DayHistory {
    id: string; // e.g., '2024-07-28'
    date: string;
    sessions: Session[];
}
