import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  time: number;
  isActive: boolean;
  isPaused: boolean;
}

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

export function TimerDisplay({ time, isActive, isPaused }: TimerDisplayProps) {
  const radius = 95;

  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth="8"
          className="stroke-secondary"
          fill="transparent"
        />
         <motion.circle
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="8"
            className={cn({
              "stroke-primary": isActive && !isPaused,
              "stroke-accent": isPaused,
              "stroke-secondary": !isActive && !isPaused,
            })}
            fill="transparent"
            initial={false}
            animate={isActive ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={
              isActive && !isPaused
                ? {
                    duration: 2,
                    ease: "easeInOut",
                    repeat: Infinity,
                  }
                : { duration: 0.5, ease: "easeOut" }
            }
          />
      </svg>
      <div
        className="text-5xl sm:text-6xl font-bold font-mono text-center tabular-nums"
      >
        {formatTime(time)}
      </div>
    </div>
  );
}
