
"use client";

import { useState, useEffect, useRef } from "react";
import type { Session } from "@/lib/types";

/**
 * A robust timer hook that calculates elapsed time based on session steps
 * rather than a simple interval counter. This makes it resilient to page refreshes.
 */
export const useTimer = (session: Session | null) => {
  const [time, setTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isActive = !!session && session.steps.some(step => step.type === 'work' && !step.end);
  const isPaused = !!session && session.steps.some(step => step.type === 'pause' && !step.end);

  const calculateElapsedTime = () => {
    if (!session) return 0;

    let totalMs = 0;
    const now = Date.now();

    for (const step of session.steps) {
      if (step.type === 'work') {
        const startMs = new Date(step.start).getTime();
        const endMs = step.end ? new Date(step.end).getTime() : now;
        totalMs += endMs - startMs;
      }
    }
    return Math.floor(totalMs / 1000);
  };
  
  useEffect(() => {
    // Stop any existing interval when the session changes
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Set initial time and start interval if a session is active
    if (session) {
      setTime(calculateElapsedTime());

      if (isActive) {
        intervalRef.current = setInterval(() => {
          setTime(calculateElapsedTime());
        }, 1000);
      }
    } else {
        // No session, reset time
        setTime(0);
    }
    
    // Cleanup interval on unmount or when session/isActive changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  // The dependency array is crucial. We only want to restart the interval logic
  // when the session object itself changes or its active status changes.
  // We don't include `time` here to avoid an infinite loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isActive]);

  return { time, isActive, isPaused };
};
