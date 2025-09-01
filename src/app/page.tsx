
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
import type { Session, DayHistory } from "@/lib/types";
import { storageService } from "@/lib/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const {
    time,
    setTime,
    isActive,
    isPaused,
    start,
    pause,
    reset,
  } = useTimer(TIMER_TYPES.stopwatch);
  
  const { settings } = useSettings();
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isEndWorkDialogOpen, setEndWorkDialogOpen] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);

  const [sessions, setSessions] = useState<Session[]>([]);
  
  const { t } = useTranslation();

  // Load sessions from storage on mount
  useEffect(() => {
    setIsTimelineLoading(true);
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const loadedHistory = storageService.getDayHistory(todayKey);
    if (loadedHistory) {
      // Convert string dates back to Date objects
      const parsedSessions = loadedHistory.sessions.map(s => ({
        ...s,
        start: new Date(s.start),
        end: s.end ? new Date(s.end) : null,
      }));
      setSessions(parsedSessions);
      
      // Recalculate current time
      const { newCurrentTime } = calculateDurations(parsedSessions);
      setTime(Math.floor(newCurrentTime / 1000));
    }
    setIsTimelineLoading(false);
  }, [setTime]);

  // Persist sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      const todayKey = format(new Date(), 'yyyy-MM-dd');
      storageService.saveDayHistory({
        id: todayKey,
        date: todayKey,
        sessions: sessions,
      });
    }
  }, [sessions]);


  const handleGenericStart = () => {
    if (settings.mode === 'learning' && !isPaused && sessions.length === 0) {
      setStartLearningDialogOpen(true);
      return;
    }
    
    const now = new Date();
    let newSessions = [...sessions];

    if (isPaused) { // Resuming from a pause
      const lastSession = newSessions[newSessions.length - 1];
      if (lastSession.type === 'pause') {
        lastSession.end = now;
      }
      newSessions = [...newSessions, { type: 'work', start: now, end: null }];
    } else { // First start of the day or new work session
      newSessions = [...newSessions, { type: 'work', start: now, end: null }];
    }
    
    setSessions(newSessions);
    start();
  };
  
  const handleStartLearning = (goal: string, topics: string[]) => {
    const now = new Date();
    let newSessions = [...sessions];
     if (isPaused) { 
        const lastSession = newSessions[newSessions.length - 1];
        if (lastSession.type === 'pause') {
          lastSession.end = now;
        }
    }
    newSessions = [...newSessions, { type: 'work', start: now, end: null, learningGoal: goal, topics }];
    setSessions(newSessions);
    start();
  }

  const handlePause = () => {
    pause();
    const now = new Date();
    let newSessions = [...sessions];
    const lastSession = newSessions[newSessions.length - 1];
    if (lastSession && lastSession.type === 'work') {
      lastSession.end = now;
    }
    newSessions = [...newSessions, { type: 'pause', start: now, end: null, note: '' }];
    setSessions(newSessions);
    setPauseNoteDialogOpen(true);
  };
  
  const handleReset = () => {
    setResetDialogOpen(true);
  };

  const confirmReset = () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    storageService.clearDayHistory(todayKey);
    reset(TIMER_TYPES.stopwatch);
    setSessions([]);
    setResetDialogOpen(false);
  }
  
  const handleGenericEnd = () => {
    if (settings.mode === 'learning' && sessions.some(s => s.type === 'work')) {
       setEndLearningDialogOpen(true);
    } else {
      setEndWorkDialogOpen(true);
    }
  }

  const endDay = (completionPercentage?: number) => {
    const now = new Date();
    let finalSessions = [...sessions];
    const lastSession = finalSessions[finalSessions.length - 1];
    
    if (lastSession && !lastSession.end) {
      lastSession.end = now;
    }
    
    // If learning mode, find last work session and add completion
    if (settings.mode === 'learning' && completionPercentage !== undefined) {
       const lastWorkSession = [...finalSessions].reverse().find(s => s.type === 'work');
       if (lastWorkSession) {
         lastWorkSession.completionPercentage = completionPercentage;
       }
    }
    
    // Save the finalized day
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    storageService.saveDayHistory({
      id: todayKey,
      date: todayKey,
      sessions: finalSessions
    });

    console.log("Final sessions:", finalSessions);

    // Reset everything for the next day
    setSessions([]);
    reset(TIMER_TYPES.stopwatch);
    setEndWorkDialogOpen(false);
    setEndLearningDialogOpen(false);
  }

  const handleSaveNote = (note: string) => {
    let newSessions = [...sessions];
    const lastSession = newSessions[newSessions.length-1];
    if (lastSession && lastSession.type === 'pause') {
      lastSession.note = note;
      setSessions(newSessions);
    }
  };
  
  // Reset sessions if mode changes
  useEffect(() => {
    reset(TIMER_TYPES.stopwatch);
    setSessions([]);
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    storageService.clearDayHistory(todayKey);
  }, [settings.mode, reset]);

  // Helper function to calculate durations from sessions
  const calculateDurations = (sessionList: Session[]) => {
      let newWorkTime = 0;
      let newPauseTime = 0;

      sessionList.forEach(session => {
        const endTime = session.end || new Date();
        const duration = endTime.getTime() - session.start.getTime();
        if (session.type === 'work') {
          newWorkTime += duration;
        } else {
          newPauseTime += duration;
        }
      });
      
      const newCurrentTime = settings.mode === 'work' ? newWorkTime : newWorkTime + newPauseTime;

      return { newWorkTime, newPauseTime, newCurrentTime };
  };

  const TimelineSkeleton = () => (
    <div className="w-full max-w-md mx-auto mt-8 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );


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
        
        {isTimelineLoading ? (
          <TimelineSkeleton />
        ) : sessions.length > 0 ? (
          <div className="w-full max-w-md mx-auto mt-8">
            <Timeline sessions={sessions} />
          </div>
        ) : null}

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
        onEnd={endDay}
      />
      
      <AlertDialog open={isResetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('resetConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset}>
              {t('confirmReset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={isEndWorkDialogOpen} onOpenChange={setEndWorkDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSureEndDay')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('endDayConfirmation')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => endDay()} className="bg-primary hover:bg-primary/90">
              {t('confirmEndDay')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  );
}

    