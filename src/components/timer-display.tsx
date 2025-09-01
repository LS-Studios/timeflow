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

const circlePath = "M 5,100 a 95,95 0 1,0 190,0 a 95,95 0 1,0 -190,0";
const wavePath1 = "M 5,100 C 50,50 150,50 195,100 C 150,150 50,150 5,100 Z";
const wavePath2 = "M 5,100 C 50,150 150,150 195,100 C 150,50 50,50 5,100 Z";

export function TimerDisplay({ time, isActive, isPaused }: TimerDisplayProps) {
  const isRunning = isActive && !isPaused;

  const pathVariants = {
    running: {
      d: [wavePath1, wavePath2, wavePath1],
      transition: {
        duration: 4,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
    stopped: {
      d: circlePath,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={95}
          strokeWidth="8"
          className="stroke-secondary"
          fill="transparent"
        />
        <motion.path
          d={circlePath}
          strokeWidth="8"
          className={cn({
            "stroke-primary": isRunning,
            "stroke-accent": isPaused,
            "stroke-secondary": !isActive && !isPaused,
          })}
          fill="transparent"
          variants={pathVariants}
          animate={isRunning ? "running" : "stopped"}
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
