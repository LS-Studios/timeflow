
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { isToday } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";


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
  
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isWorkDayEnded, setIsWorkDayEnded] = useState(false);
  
  const { t } = useTranslation();

  // Load all sessions from storage on mount and restore timer state
  useEffect(() => {
    if (!settingsLoaded) return;
    setIsLoading(true);
    
    const loadedSessions = storageService.getAllSessions();
    setAllSessions(loadedSessions);

    const lastSession = loadedSessions.length > 0 ? loadedSessions[loadedSessions.length - 1] : null;

    // Case 1: A session is still running from a previous day. Do not reset.
    if (lastSession && !lastSession.end) {
        // The session continues, so we just restore state regardless of the day.
    }
    // Case 2: The last session is finished and was on a previous day. Reset for a new day.
    else if (lastSession && lastSession.end && !isToday(new Date(lastSession.start))) {
      setTodaySessions([]);
      reset(TIMER_TYPES.stopwatch);
      setIsLoading(false);
      return;
    }

    // If we are here, we are on the same day or continuing a session.
    const sessionsForToday = loadedSessions.filter(s => isToday(new Date(s.start)));
    setTodaySessions(sessionsForToday);
    
    if (sessionsForToday.length > 0) {
      const lastTodaySession = sessionsForToday[sessionsForToday.length - 1];

      // Check if work day was ended (all sessions have an end time)
      const allSessionsEnded = sessionsForToday.every(s => s.end !== null);
      if (settings.mode === 'work' && allSessionsEnded) {
         setIsWorkDayEnded(true);
         // Display total time from that ended day
         const totalTimeTodayMs = sessionsForToday.reduce((acc, session) => {
            if (!session.start || !session.end) return acc;
             const duration = new Date(session.end).getTime() - new Date(session.start).getTime();
             return acc + (session.type === 'work' ? duration : 0);
         }, 0);
         setTime(Math.floor(totalTimeTodayMs / 1000));
         pause();

      } else if (lastTodaySession && !lastTodaySession.end) {
        // A session is running, restore timer state
        let totalTimeTodayMs = 0;
        sessionsForToday.forEach(session => {
            if (!session.start) return;
            const startTime = new Date(session.start).getTime();
            // Use current time for the running session
            const endTime = session.end ? new Date(session.end).getTime() : Date.now();
            const duration = endTime - startTime;
            
            if (session.type === 'work' || (settings.mode === 'learning' && session.learningGoal)) {
              totalTimeTodayMs += duration;
            }
        });
        setTime(Math.floor(totalTimeTodayMs / 1000));
        
        if (lastTodaySession.type === 'work') {
          start();
        } else {
          pause();
        }
      }
    }
    
    setIsLoading(false);
  }, [settingsLoaded, settings.mode, setTime, start, pause, reset]);

  // Persist all sessions whenever they change
  useEffect(() => {
    if (isLoading) return; 
    storageService.saveAllSessions(allSessions);
  }, [allSessions, isLoading]);

  const addSession = (session: Omit<Session, 'id'>) => {
    const newSession: Session = { ...session, id: new Date().toISOString() + Math.random() };
    setAllSessions(prev => [...prev, newSession]);
    setTodaySessions(prev => [...prev, newSession]);
  };

  const updateLastSession = (updates: Partial<Session>) => {
    setAllSessions(prevAll => {
        if (prevAll.length === 0) return prevAll;
        const newAllSessions = [...prevAll];
        const lastSessionIndex = newAllSessions.length - 1;
        newAllSessions[lastSessionIndex] = { ...newAllSessions[lastSessionIndex], ...updates };
        
        // Also update today's sessions if the last session is from today
        setTodaySessions(prevToday => {
            const todayIndex = prevToday.findIndex(s => s.id === newAllSessions[lastSessionIndex].id);
            if (todayIndex !== -1) {
                const newTodaySessions = [...prevToday];
                newTodaySessions[todayIndex] = newAllSessions[lastSessionIndex];
                return newTodaySessions;
            }
            return prevToday;
        });

        return newAllSessions;
    });
  };
  
  const handleGenericStart = () => {
    if (isWorkDayEnded) {
       setIsWorkDayEnded(false);
    }
    if (settings.mode === 'learning' && !isPaused && todaySessions.every(s => s.end !== null)) {
      setStartLearningDialogOpen(true);
      return;
    }
    
    const now = new Date();
    // If the timer is paused, it means we are resuming from a break.
    // The break session needs to be ended first.
    if (isPaused) { 
      updateLastSession({ end: now });
    }
    addSession({ type: 'work', start: now, end: null });
    start();
  };
  
  const handleStartLearning = (goal: string, topics: string[]) => {
    const now = new Date();
    if (isPaused) { 
        updateLastSession({ end: now });
    }
    addSession({ type: 'work', start: now, end: null, learningGoal: goal, topics });
    start();
  }

  const handlePause = () => {
    const now = new Date();
    updateLastSession({ end: now });
    addSession({ type: 'pause', start: now, end: null, note: '' });
    pause();
    setPauseNoteDialogOpen(true);
  };
  
  const handleReset = () => {
     setResetDialogOpen(true);
  };

  const confirmReset = () => {
    // Only remove today's sessions from the master list
    const yesterdayAndBefore = allSessions.filter(s => !isToday(new Date(s.start)));
    setAllSessions(yesterdayAndBefore);
    setTodaySessions([]);
    reset(TIMER_TYPES.stopwatch);
    setIsWorkDayEnded(false);
    setResetDialogOpen(false);
  }

  const handleEnd = () => {
    const now = new Date();
    if (isActive || isPaused) {
      updateLastSession({ end: now });
    }
    
    if (settings.mode === 'learning' && todaySessions.some(s => s.learningGoal)) {
      setEndLearningDialogOpen(true);
    } else {
      setIsWorkDayEnded(true);
      pause();
    }
  }
  
  const handleContinueWork = () => {
    setIsWorkDayEnded(false);
    handleGenericStart();
  }

  const endLearningSession = (completionPercentage: number) => {
     // Find last *learning* session of the day to update
     setAllSessions(prevAll => {
        const newAll = [...prevAll];
        const lastLearningIndex = newAll.map(s => s.learningGoal ? true : false).lastIndexOf(true);
        if (lastLearningIndex !== -1) {
            newAll[lastLearningIndex] = { ...newAll[lastLearningIndex], completionPercentage };
        }
        return newAll;
     });
    pause();
    // Don't reset time, just allow starting a new session
    setEndLearningDialogOpen(false);
  }

  const handleSaveNote = (note: string) => {
    updateLastSession({ note });
  };
  
  return (
    <>
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-8">
          {isLoading ? (
             <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
                <Skeleton className="absolute w-full h-full rounded-full" />
                <Skeleton className="h-14 w-52" />
             </div>
          ) : isWorkDayEnded && settings.mode === 'work' ? (
             <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex flex-col items-center justify-center text-center p-8 bg-card rounded-full border">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-xl font-bold">{t('workDayEnded')}</h2>
                <p className="text-muted-foreground text-sm mb-4">{t('workDayEndedDescription')}</p>
                <Button onClick={handleContinueWork}>{t('continueWorking')}</Button>
             </div>
          ) : (
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
             >
                <TimerDisplay time={time} isActive={isActive} isPaused={isPaused} />
             </motion.div>
          )}

          {isLoading ? (
             <div className="flex items-center justify-center gap-4 h-16 w-full">
                <Skeleton className="h-14 w-14 rounded-full" />
                <Skeleton className="min-w-[9rem] h-16 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
             </div>
          ) : !isWorkDayEnded && (
             <TimerControls
                isActive={isActive}
                isPaused={isPaused}
                onStart={handleGenericStart}
                onPause={handlePause}
                onReset={handleReset}
                onEnd={handleEnd}
                endLabel={settings.mode === 'learning' ? t('endLearningSession') : t('endDay')}
             />
          )}

        </div>
        
        <div className="w-full max-w-md mx-auto mt-8">
           {isLoading ? (
              <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-10 w-full" />
              </div>
           ) : todaySessions.length > 0 && (
              <Timeline sessions={todaySessions} />
           )}
        </div>

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
        onEnd={endLearningSession}
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
    </>
  );
}
