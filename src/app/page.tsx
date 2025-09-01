"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTimer } from "@/hooks/use-timer";
import { useSettings } from "@/lib/settings-provider";
import { TimerDisplay } from "@/components/timer-display";
import { TimerControls } from "@/components/timer-controls";
import { PauseNoteDialog } from "@/components/pause-note-dialog";
import { StartLearningDialog } from "@/components/start-learning-dialog";
import { EndLearningDialog } from "@/components/end-learning-dialog";
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
  } = useTimer(TIMER_TYPES.stopwatch);
  
  const { mode } = useSettings();
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);

  const [sessions, setSessions] = useState<Session[]>([]);
  
  const { t } = useTranslation();

  const handleGenericStart = () => {
    // If we're in learning mode and NOT resuming from a pause, show the goal dialog.
    if (mode === 'learning' && !isPaused) {
      setStartLearningDialogOpen(true);
      return;
    }
    
    // Logic for 'work' mode or for resuming a pause in 'learning' mode.
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
    start();
  };
  
  const handleStartLearning = (goal: string) => {
    const now = new Date();
     if (isPaused) { // Resuming from a pause
        const lastSession = sessions[sessions.length - 1];
        if (lastSession.type === 'pause') {
          lastSession.end = now;
        }
    }
    setSessions([...sessions, { type: 'work', start: now, end: null, learningGoal: goal }]);
    start();
  }

  const handlePause = () => {
    pause();
    const now = new Date();
    const lastSession = sessions[sessions.length - 1];
    if (lastSession && lastSession.type === 'work') {
      lastSession.end = now;
    }
    setSessions([...sessions, { type: 'pause', start: now, end: null, note: '' }]);
    setPauseNoteDialogOpen(true);
  };
  
  const handleReset = () => {
    reset(TIMER_TYPES.stopwatch);
    setSessions([]);
  };
  
  const handleGenericEnd = () => {
    if (mode === 'learning' && sessions.some(s => s.type === 'work')) {
       setEndLearningDialogOpen(true);
    } else {
      endWorkDay();
    }
  }

  const endWorkDay = () => {
    const now = new Date();
    const lastSession = sessions[sessions.length - 1];
    
    // Finalize last session if it exists and is ongoing
    if (lastSession && !lastSession.end) {
      lastSession.end = now;
    }
    
    // In a real app, you'd save the finalized sessions here.
    console.log("Final sessions:", sessions);

    // Reset everything for the next day
    setSessions([]);
    reset(TIMER_TYPES.stopwatch);
  }

  const handleEndLearning = (completionPercentage: number) => {
    const now = new Date();
    const lastWorkSession = [...sessions].reverse().find(s => s.type === 'work');

    if (lastWorkSession) {
      if (!lastWorkSession.end) {
        lastWorkSession.end = now;
      }
      lastWorkSession.completionPercentage = completionPercentage;
    }
    
     // Also end a potential ongoing pause
    const lastSession = sessions[sessions.length-1];
    if(lastSession.type === 'pause' && !lastSession.end) {
        lastSession.end = now;
    }

    // In a real app, you'd save the finalized sessions here.
    console.log("Final learning sessions:", sessions);

    // Reset everything for the next day
    setSessions([]);
    reset(TIMER_TYPES.stopwatch);
  }


  const handleSaveNote = (note: string) => {
    const lastSession = sessions[sessions.length-1];
    if (lastSession && lastSession.type === 'pause') {
      lastSession.note = note;
      setSessions([...sessions]);
    }
  };
  
  // Reset sessions if mode changes - using useEffect to avoid violating rules of hooks
  useEffect(() => {
    reset(TIMER_TYPES.stopwatch);
    setSessions([]);
  }, [mode, reset]);


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
            onStart={handleGenericStart}
            onPause={handlePause}
            onReset={handleReset}
            onEnd={handleGenericEnd}
          />
        </motion.div>
        
        {sessions.length > 0 && (
          <div className="w-full max-w-md mx-auto mt-8">
            <Timeline sessions={sessions} />
          </div>
        )}

      </div>
      
      {/* Dialogs */}
      <PauseNoteDialog
        isOpen={isPauseNoteDialogOpen}
        onOpenChange={setPauseNoteDialogOpen}
        onSave={handleSaveNote}
      />
      <StartLearningDialog
        isOpen={isStartLearningDialogOpen}
        onOpenChange={setStartLearningDialogOpen}
        onStart={handleStartLearning}
      />
      <EndLearningDialog
        isOpen={isEndLearningDialogOpen}
        onOpenChange={setEndLearningDialogOpen}
        onEnd={handleEndLearning}
      />
    </>
  );
}
