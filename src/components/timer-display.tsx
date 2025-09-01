import { motion } from "framer-motion";

interface TimerDisplayProps {
  time: number;
  progress: number;
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

export function TimerDisplay({ time, progress }: TimerDisplayProps) {
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

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
        {progress < 100 && (
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            strokeWidth="8"
            strokeLinecap="round"
            className="stroke-primary"
            fill="transparent"
            style={{ rotate: -90, originX: '100px', originY: '100px' }}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "linear" }}
          />
        )}
      </svg>
      <motion.div
        key={time}
        initial={{ opacity: 0.8, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="text-5xl sm:text-6xl font-bold font-mono text-center tabular-nums"
      >
        {formatTime(time)}
      </motion.div>
    </div>
  );
}
