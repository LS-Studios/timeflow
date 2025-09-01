export type TimerMode = "countdown" | "countup";

export interface TimerConfig {
  initialTime: number;
  duration: number;
  mode: TimerMode;
}

export type TimerType = "pomodoro" | "stopwatch" | "custom";

export const TIMER_TYPES: Record<TimerType, TimerConfig> = {
  pomodoro: {
    initialTime: 25 * 60, // 25 minutes
    duration: 25 * 60,
    mode: "countdown",
  },
  stopwatch: {
    initialTime: 0,
    duration: 0,
    mode: "countup",
  },
  custom: {
    initialTime: 10 * 60, // 10 minutes default
    duration: 10 * 60,
    mode: "countdown",
  },
};
