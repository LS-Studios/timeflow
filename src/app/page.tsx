"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTimer } from "@/hooks/use-timer";
import { TimerDisplay } from "@/components/timer-display";
import { TimerControls } from "@/components/timer-controls";
import { PauseNoteDialog } from "@/components/pause-note-dialog";
import { TIMER_TYPES } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n.tsx";
import { Timeline } from "@/components/timeline";
import type { Session } from "@/lib/types";

export default function Home() {
  const {
    time,
    isActive,
    isPaused,
    start,
    pause,
    reset,
    progress,
  } = useTimer(TIMER_TYPES.stopwatch);
  
  const [isNoteDialogOpen, setNoteDialogOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null);

  const { t } = useTranslation();

  const handleStart = () => {
    const now = new Date();
    if (sessions.length === 0) { // First start of the day
      setSessions([{ type: 'work', start: now, end: null }]);
    } else if (isPaused) { // Resuming from a pause
      const lastSession = sessions[sessions.length - 1];
      if (lastSession.type === 'pause') {
        lastSession.end = now;
      }
      setSessions([...sessions, { type: 'work', start: now, end: null }]);
    }
    setCurrentSessionStart(now);
    start();
  };

  const handlePause = () => {
    pause();
    const now = new Date();
    const lastSession = sessions[sessions.length - 1];
    if (lastSession && lastSession.type === 'work') {
      lastSession.end = now;
    }
    setSessions([...sessions, { type: 'pause', start: now, end: null, note: '' }]);
    setNoteDialogOpen(true);
  };
  
  const handleReset = () => {
    reset(TIMER_TYPES.stopwatch);
    setSessions([]);
    setCurrentSessionStart(null);
  };
  
  const handleEnd = () => {
    console.log("Work day ended");
    const now = new Date();
    const lastSession = sessions[sessions.length - 1];
    
    // Finalize last session if it exists and is ongoing
    if (lastSession) {
      if (lastSession.type === 'work' && !lastSession.end) {
        lastSession.end = now;
      } else if (lastSession.type === 'pause' && !lastSession.end) {
        // If ending during a pause, end the pause.
        lastSession.end = now;
      }
    }
    
    // In a real app, you'd save the finalized sessions here.
    // For now, we just log them.
    console.log("Final sessions:", sessions);

    // Reset everything for the next day
    setSessions([]);
    reset(TIMER_TYPES.stopwatch);
    setCurrentSessionStart(null);
  }

  const handleSaveNote = (note: string) => {
    const lastSession = sessions[sessions.length-1];
    if (lastSession && lastSession.type === 'pause') {
      lastSession.note = note;
      setSessions([...sessions]);
    }
  };

  return (
    <>
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md mx-auto flex flex-col items-center gap-8"
        >
          <TimerDisplay time={time} isActive={isActive} isPaused={isPaused} />

          <TimerControls
            isActive={isActive}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
            onEnd={handleEnd}
          />
        </motion.div>
        
        {sessions.length > 0 && (
          <div className="w-full max-w-md mx-auto mt-8">
            <Timeline sessions={sessions} />
          </div>
        )}

      </div>
      <PauseNoteDialog
        isOpen={isNoteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        onSave={handleSaveNote}
      />
    </>
  );
}
