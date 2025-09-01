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
