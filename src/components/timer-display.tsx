import { motion } from "framer-motion";

interface TimerDisplayProps {
  time: number;
  isActive: boolean;
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


const circularPath = "M 100, 20 a 80,80 0 1,1 0,160 a 80,80 0 1,1 0,-160";
const wavyPath = "M 100, 20 Q 150, 40 180, 100 T 100, 180 Q 50, 160 20, 100 T 100, 20";


export function TimerDisplay({ time, isActive }: TimerDisplayProps) {
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
         <motion.path
            d={circularPath}
            strokeWidth="8"
            className="stroke-primary"
            fill="transparent"
            animate={isActive ? { d: [circularPath, wavyPath, circularPath] } : { d: circularPath }}
            transition={
              isActive
                ? {
                    duration: 4,
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
