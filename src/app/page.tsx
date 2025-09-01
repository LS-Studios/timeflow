

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
import type { Session, LearningObjective } from "@/lib/types";
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
import { isToday, isBefore, startOfDay } from "date-fns";
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
  
  const { settings, isLoaded: settingsLoaded, setTimerResetCallback, setTimerIsActiveCallback, setEndCurrentSessionCallback } = useSettings();
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);
  const [isResetDialogOpen, setResetDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<Session | null>(null);
  
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [allTopics, setAllTopics] = useState<string[]>(storageService.getAllTopics());

  const [isLoading, setIsLoading] = useState(true);
  const [isWorkDayEnded, setIsWorkDayEnded] = useState(false);
  
  const { t } = useTranslation();
  
  const isTimerIdle = !isActive && !isPaused;

  const isSessionRunning = todaySessions.length > 0 && todaySessions.some(s => s.end === null);

  useEffect(() => {
    setTimerIsActiveCallback(isSessionRunning);
  }, [isSessionRunning, setTimerIsActiveCallback]);


  const clearTimerState = useCallback(() => {
    setTodaySessions([]);
    reset(TIMER_TYPES.stopwatch);
    setIsWorkDayEnded(false);
  }, [reset]);

  useEffect(() => {
    setTimerResetCallback(clearTimerState);
  }, [clearTimerState, setTimerResetCallback]);


  // Load sessions from storage on mode change or initial load
  useEffect(() => {
    if (!settingsLoaded) return;
    setIsLoading(true);
    
    const loadedSessions = storageService.getSessions(settings.mode);
    setAllSessions(loadedSessions);
    setAllTopics(storageService.getAllTopics());

    // Auto-reset if the last session was on a previous day and is finished.
    if (settings.mode === 'work' && loadedSessions.length > 0) {
      const lastSession = loadedSessions[loadedSessions.length - 1];
      if (lastSession.end && isBefore(new Date(lastSession.start), startOfDay(new Date()))) {
        setTodaySessions([]);
        reset(TIMER_TYPES.stopwatch);
        setIsWorkDayEnded(false);
        setIsLoading(false);
        return;
      }
    }
    
    const sessionsForToday = loadedSessions.filter(s => isToday(new Date(s.start)));
    setTodaySessions(sessionsForToday);
    
    const allTodaySessionsAreFinished = sessionsForToday.length > 0 && sessionsForToday.every(s => s.end !== null);

    if (allTodaySessionsAreFinished) {
        // Day is over, show the appropriate end screen or a clean slate.
        reset(TIMER_TYPES.stopwatch);
        const lastSession = sessionsForToday[sessionsForToday.length - 1];
        if (settings.mode === 'work' && lastSession.note === 'Day ended') {
            setIsWorkDayEnded(true);
        } else {
            setTodaySessions([]);
            setIsWorkDayEnded(false);
        }
    } else if (sessionsForToday.length > 0) {
        // Day is ongoing, restore state.
        setIsWorkDayEnded(false);
        const lastTodaySession = sessionsForToday[sessionsForToday.length - 1];

        let totalTimeTodayMs = 0;
        sessionsForToday.forEach(session => {
            if (!session.start || session.type !== 'work') return;
            const endTime = session.end ? new Date(session.end).getTime() : Date.now();
            totalTimeTodayMs += (endTime - new Date(session.start).getTime());
        });
        setTime(Math.floor(totalTimeTodayMs / 1000));

        if (lastTodaySession && !lastTodaySession.end) {
            if (lastTodaySession.type === 'work') {
                start();
            } else { // It's a pause
                pause();
            }
        } else { // Should not happen if not all sessions are finished, but as a fallback
            pause();
        }
    } else {
        // No sessions for today, start fresh.
        clearTimerState();
    }
    
    setIsLoading(false);
  }, [settingsLoaded, settings.mode, setTime, start, pause, reset, clearTimerState]);


  // Persist all sessions whenever they change for the current mode
  useEffect(() => {
    if (isLoading) return; 
    storageService.saveSessions(settings.mode, allSessions);
  }, [allSessions, isLoading, settings.mode]);

  const addSession = (session: Omit<Session, 'id'>) => {
    const newSession: Session = { ...session, id: new Date().toISOString() + Math.random() };
    setAllSessions(prev => [...prev, newSession]);
    setTodaySessions(prev => [...prev, newSession]);
  };

  const updateLastSession = useCallback((updates: Partial<Session>) => {
    setAllSessions(prevAll => {
        if (prevAll.length === 0) return prevAll;
        const newAllSessions = [...prevAll];
        const lastSessionIndex = newAllSessions.length - 1;
        newAllSessions[lastSessionIndex] = { ...newAllSessions[lastSessionIndex], ...updates };
        
        setTodaySessions(prevToday => {
            if (prevToday.length === 0) return prevToday;
            const newTodaySessions = [...prevToday];
            const lastSessionTodayIndex = newTodaySessions.map(s => s.id).lastIndexOf(newAllSessions[lastSessionIndex].id);

            if(lastSessionTodayIndex !== -1) {
               newTodaySessions[lastSessionTodayIndex] = newAllSessions[lastSessionIndex];
               return newTodaySessions;
            }
            return prevToday;
        });

        return newAllSessions;
    });
  }, []);
  
  const handleGenericStart = () => {
    if (settings.mode === 'learning' && isTimerIdle && todaySessions.every(s => s.end !== null)) {
      setStartLearningDialogOpen(true);
      return;
    }
    
    const now = new Date();
    // If resuming from a pause, end the pause session
    if (isPaused) { 
      const lastSession = allSessions[allSessions.length-1];
      if (lastSession && lastSession.type === 'pause') {
         updateLastSession({ end: now });
      }
    }

    // For learning mode, carry over the goal from the previous session if resuming
    const newSessionData: Omit<Session, 'id'> = { type: 'work', start: now, end: null };
    if (settings.mode === 'learning') {
       const lastLearningSession = [...allSessions].reverse().find(s => s.type === 'work' && s.learningGoal);
       if (lastLearningSession) {
          newSessionData.learningGoal = lastLearningSession.learningGoal;
          newSessionData.learningObjectives = lastLearningSession.learningObjectives;
          newSessionData.topics = lastLearningSession.topics;
       }
    }

    addSession(newSessionData);
    start();
  };
  
  const handleStartLearning = (goal: string, objectives: string[], topics: string[]) => {
    const now = new Date();
    if (isPaused) { 
        updateLastSession({ end: now });
    }
    const learningObjectives: LearningObjective[] = objectives.map(obj => ({ text: obj, completed: 0 }));
    addSession({ type: 'work', start: now, end: null, learningGoal: goal, learningObjectives, topics });
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
    // Keep past history, only clear today's sessions for the current mode
    const pastSessions = allSessions.filter(s => !isToday(new Date(s.start)));
    setAllSessions(pastSessions);
    clearTimerState();
    setResetDialogOpen(false);
  }

  const endCurrentSessionAndPause = useCallback(() => {
    const now = new Date();
    if (isActive || isPaused) {
      const lastSession = allSessions[allSessions.length-1];
      if (lastSession && !lastSession.end) {
        updateLastSession({ end: now });
      }
    }
    pause();
  }, [allSessions, isActive, isPaused, pause, updateLastSession]);

  useEffect(() => {
    setEndCurrentSessionCallback(endCurrentSessionAndPause);
  }, [endCurrentSessionAndPause, setEndCurrentSessionCallback]);


  const handleEnd = () => {
    const now = new Date();
    
    const initialLearningSession = todaySessions.find(s => s.type === 'work' && s.learningGoal);
    
    if (settings.mode === 'learning' && initialLearningSession) {
      setSessionToEnd(initialLearningSession);
      setEndLearningDialogOpen(true);
      const currentLastSession = allSessions[allSessions.length-1];
      if (currentLastSession && !currentLastSession.end) {
          updateLastSession({ end: now });
      }
      addSession({ type: 'pause', start: now, end: null, note: 'Ending session...' });
      pause(); 
    } else { // Work mode
      if (isActive || isPaused) {
        const currentLastSession = allSessions[allSessions.length-1];
        if (currentLastSession && !currentLastSession.end) {
            updateLastSession({ end: now, note: 'Day ended' });
        }
      }
      pause();
      setIsWorkDayEnded(true);
    }
  }
  
  const handleContinueWork = () => {
    const now = new Date();
    // Start a new work session immediately
    addSession({ type: 'work', start: now, end: null });
    start();
    setIsWorkDayEnded(false);
  }

  const endLearningSession = (updatedObjectives: LearningObjective[], totalCompletion: number) => {
    const now = new Date();
    if (!sessionToEnd) return;

    // Create a new, fully updated array for all sessions
    const finalAllSessions = allSessions.map(session => {
        let updatedSession = { ...session };
        
        // Find all work sessions related to this goal for today
        if (isToday(new Date(session.start)) && session.learningGoal === sessionToEnd.learningGoal) {
            updatedSession.learningObjectives = updatedObjectives;
            updatedSession.completionPercentage = totalCompletion;
        }
        
        // Ensure every session for today has a definitive end time
        if (isToday(new Date(session.start)) && !session.end) {
            updatedSession.end = now;
        }
        
        return updatedSession;
    });

    setAllSessions(finalAllSessions);
    setTodaySessions([]); // Clear timeline for the next start
    setAllTopics(storageService.getAllTopics());

    // Reset UI for the next session
    reset(TIMER_TYPES.stopwatch);
    pause(); 
    setEndLearningDialogOpen(false);
    setSessionToEnd(null);
  };

  const handleSaveNote = (note: string) => {
    updateLastSession({ note });
  };
  
  const totalTimeOnEndedScreen = todaySessions.reduce((acc, session) => {
    if (!session.start || !session.end || session.type !== 'work') return acc;
    return acc + (new Date(session.end).getTime() - new Date(session.start).getTime());
  }, 0);
  
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
                <div className="text-2xl font-bold mb-4">
                  {new Date(totalTimeOnEndedScreen).toISOString().slice(11, 19)}
                </div>
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
          ) : !isWorkDayEnded || settings.mode === 'learning' ? (
             <TimerControls
                isActive={isActive}
                isPaused={isPaused}
                onStart={handleGenericStart}
                onPause={handlePause}
                onReset={handleReset}
                onEnd={handleEnd}
                endLabel={settings.mode === 'learning' ? t('endLearningSession') : t('endDay')}
                isTimerIdle={isTimerIdle}
             />
          ) : null}

        </div>
        
        <div className="w-full max-w-md mx-auto mt-8">
           {isLoading ? (
              <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-10 w-full" />
              </div>
           ) : todaySessions.length > 0 && (
              <Timeline sessions={todaySessions} isWorkDayEnded={isWorkDayEnded} />
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
        allTopics={allTopics}
      />
      <EndLearningDialog
        isOpen={isEndLearningDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
             setSessionToEnd(null);
             // If dialog is closed without saving, and there's an active timer, it should continue.
             // We check for the temporary 'Ending session...' note.
             const lastSession = allSessions[allSessions.length - 1];
             if (lastSession?.note === 'Ending session...') {
                // Remove the temporary pause and resume the previous work session
                const previousWorkSession = allSessions[allSessions.length - 2];
                setAllSessions(prev => prev.slice(0, -1)); // remove pause
                updateLastSession({ end: null }); // reopen work session
                start();
             }
          }
          setEndLearningDialogOpen(isOpen);
        }}
        onEnd={endLearningSession}
        session={sessionToEnd}
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
