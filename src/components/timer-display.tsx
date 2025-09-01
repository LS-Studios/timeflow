import { motion } from "framer-motion";

interface TimerDisplayProps {
  time: number;
  isActive: boolean;
}

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

export function TimerDisplay({ time, isActive }: TimerDisplayProps) {
  const radius = 90;

  return (
    <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
      <svg className="absolute w-full h-full" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          strokeWidth="8"
          className="stroke-secondary"
          fill="transparent"
        />
        {isActive && (
           <motion.circle
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="8"
            className="stroke-primary"
            fill="transparent"
            initial={{ pathLength: 1, opacity: 0.7 }}
            animate={{
                pathLength: [1, 1],
                opacity: [0.7, 0.3, 0.7],
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            style={{ rotate: -90, originX: '100px', originY: '100px' }}
          />
        )}
      </svg>
      <div
        className="text-5xl sm:text-6xl font-bold font-mono text-center tabular-nums"
      >
        {formatTime(time)}
      </div>
    </div>
  );
}
