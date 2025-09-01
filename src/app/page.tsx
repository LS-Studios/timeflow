
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
  
  const { settings, isLoaded: settingsLoaded } = useSettings();
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [isEndWorkDialogOpen, setEndWorkDialogOpen] = useState(false);
  const [isTimelineLoading, setIsTimelineLoading] = useState(true);

  const [sessions, setSessions] = useState<Session[]>([]);
  
  const { t } = useTranslation();

  const calculateDurations = useCallback((sessionList: Session[]) => {
      let newWorkTime = 0;
      let newPauseTime = 0;

      sessionList.forEach(session => {
        if (!session.start) return;
        const startTime = new Date(session.start);
        const endTime = session.end ? new Date(session.end) : new Date();
        const duration = endTime.getTime() - startTime.getTime();
        
        if (session.type === 'work') {
          newWorkTime += duration;
        } else {
          newPauseTime += duration;
        }
      });
      
      const newCurrentTime = settings.mode === 'work' ? newWorkTime : newWorkTime + newPauseTime;
      return { newCurrentTime };
  },[settings.mode]);

  // Load sessions from storage on mount and restore timer state
  useEffect(() => {
    if (!settingsLoaded) return;
    setIsTimelineLoading(true);
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const loadedHistory = storageService.getDayHistory(todayKey);
    
    if (loadedHistory && loadedHistory.sessions.length > 0) {
      const parsedSessions = loadedHistory.sessions.map(s => ({
        ...s,
        start: new Date(s.start),
        end: s.end ? new Date(s.end) : null,
      }));
      setSessions(parsedSessions);
      
      const lastSession = parsedSessions[parsedSessions.length - 1];
      if (lastSession && !lastSession.end) {
         const { newCurrentTime } = calculateDurations(parsedSessions);
         setTime(Math.floor(newCurrentTime / 1000));
        if (lastSession.type === 'work') {
          start();
        } else if (lastSession.type === 'pause') {
          pause();
        }
      }
    }
    setIsTimelineLoading(false);
  }, [settingsLoaded, start, pause, setTime, calculateDurations]);

  // Persist sessions whenever they change
  useEffect(() => {
    if (isTimelineLoading) return; 
    
    if (sessions.length > 0) {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        storageService.saveDayHistory({
            id: todayKey,
            date: todayKey,
            sessions: sessions,
        });
    }
  }, [sessions, isTimelineLoading]);


  const handleGenericStart = () => {
     if (settings.mode === 'learning' && !isPaused && sessions.length === 0) {
      setStartLearningDialogOpen(true);
      return;
    }
    
    const now = new Date();
    let newSessions = [...sessions];

    if (isPaused) { 
      const lastSession = newSessions[newSessions.length - 1];
      if (lastSession.type === 'pause') {
        lastSession.end = now;
      }
      newSessions = [...newSessions, { type: 'work', start: now, end: null }];
    } else { 
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
    const now = new Date();
    setSessions(prevSessions => {
        let newSessions = [...prevSessions];
        const lastSession = newSessions[newSessions.length - 1];
        if (lastSession && lastSession.type === 'work') {
            lastSession.end = now;
        }
        return [...newSessions, { type: 'pause', start: now, end: null, note: '' }];
    });
    pause();
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
  
  const handleEnd = () => {
    if (isActive) {
        pause(); 
        const now = new Date();
        setSessions(prevSessions => {
            let newSessions = [...prevSessions];
            const lastSession = newSessions[newSessions.length - 1];
            if (lastSession && !lastSession.end) {
                lastSession.end = now;
            }
            return newSessions;
        });
    }

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
    
    if (settings.mode === 'learning' && completionPercentage !== undefined) {
       const lastWorkSession = [...finalSessions].reverse().find(s => s.type === 'work');
       if (lastWorkSession) {
         lastWorkSession.completionPercentage = completionPercentage;
       }
    }
    
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    storageService.saveDayHistory({
      id: todayKey,
      date: todayKey,
      sessions: finalSessions
    });

    // Clear state for a fresh start
    storageService.clearDayHistory(todayKey); // This was missing
    setSessions([]);
    reset(TIMER_TYPES.stopwatch);

    setEndWorkDialogOpen(false);
    setEndLearningDialogOpen(false);
  }

  const handleSaveNote = (note: string) => {
    setSessions(prevSessions => {
        let newSessions = [...prevSessions];
        const lastSession = newSessions[newSessions.length-1];
        if (lastSession && lastSession.type === 'pause') {
        lastSession.note = note;
        }
        return newSessions;
    });
  };
  
  const isLoading = !settingsLoaded || isTimelineLoading;


  return (
    <>
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div
          className="w-full max-w-md mx-auto flex flex-col items-center gap-8"
        >
          {isLoading ? (
             <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
                <Skeleton className="absolute w-full h-full rounded-full" />
                <Skeleton className="h-14 w-52" />
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
          ) : (
             <TimerControls
                isActive={isActive}
                isPaused={isPaused}
                onStart={handleGenericStart}
                onPause={handlePause}
                onReset={handleReset}
                onEnd={handleEnd}
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
           ) : sessions.length > 0 && (
              <Timeline sessions={sessions} />
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

    