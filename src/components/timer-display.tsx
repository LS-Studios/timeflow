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

const circlePath = "M 100, 5 a 95,95 0 1,1 0,190 a 95,95 0 1,1 0,-190";

const morphPaths = [
  "M100,5 C152.47,5,195,47.53,195,100 C195,152.47,152.47,195,100,195 C47.53,195,5,152.47,5,100 C5,71.5,23.5,47.5,50,30",
  "M100,5 C128.5,23.5,152.5,47.5,170,75 C190,110,195,152.47,195,100 C195,47.53,152.47,5,100,5 C47.53,5,5,47.53,5,100",
  "M100,5 C47.53,5,5,47.53,5,100 C5,152.47,47.53,195,100,195 C128.5,176.5,152.5,152.5,170,125",
  "M100,5 C47.53,5,5,47.53,5,100 C5,128.5,23.5,152.5,50,170 C90,210,152.47,195,100,195 C47.53,195,5,152.47,5,100",
  "M100,5 C152.47,5,195,47.53,195,100 C195,128.5,176.5,152.5,150,170 C110,210,47.53,195,100,195",
];


export function TimerDisplay({ time, isActive, isPaused }: TimerDisplayProps) {
  const isRunning = isActive && !isPaused;

  const pathVariants = {
    running: {
      d: [...morphPaths, morphPaths[0]],
      transition: {
        duration: 8,
        ease: "easeInOut",
        repeat: Infinity,
      },
    },
    stopped: {
      d: circlePath,
      transition: { duration: 0.8, ease: "easeOut" },
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
