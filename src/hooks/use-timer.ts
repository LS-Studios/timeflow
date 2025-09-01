"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TimerConfig } from "@/lib/constants";

export const useTimer = (initialConfig: TimerConfig) => {
  const [config, setConfig] = useState(initialConfig);
  const [time, setTime] = useState(config.initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
    setIsPaused(true);
  }, []);

  const reset = useCallback((newConfig: TimerConfig) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConfig(newConfig);
    setIsActive(false);
    setIsPaused(false);
    setTime(newConfig.initialTime);
    setProgress(100);
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (config.mode === "countdown") {
            if (prevTime <= 1) {
              clearInterval(intervalRef.current!);
              setIsActive(false);
              // Optional: Play a sound or show a notification
              return 0;
            }
            return prevTime - 1;
          } else {
            return prevTime + 1;
          }
        });
      }, 1000);
    } else if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, config.mode]);
  
  useEffect(() => {
    if (config.mode === 'countdown' && config.duration > 0) {
      setProgress((time / config.duration) * 100);
    } else {
      setProgress(100);
    }
  }, [time, config]);


  return {
    time,
    isActive,
    isPaused,
    start,
    pause,
    reset,
    mode: config.mode,
    progress,
  };
};
