

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTimer } from "@/hooks/use-timer";
import { useSettings } from "@/lib/settings-provider";
import { useAuth } from "@/lib/auth-provider";
import { TimerDisplay } from "@/components/timer-display";
import { TimerControls } from "@/components/timer-controls";
import { PauseNoteDialog } from "@/components/pause-note-dialog";
import { StartLearningDialog } from "@/components/start-learning-dialog";
import { EndLearningDialog } from "@/components/end-learning-dialog";
import { TIMER_TYPES } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n.tsx";
import { Timeline } from "@/components/timeline";
import type { Session, SessionStep, LearningObjective } from "@/lib/types";
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
  const { user } = useAuth();
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<Session | null>(null);
  
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [allTopics, setAllTopics] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isWorkDayEnded, setIsWorkDayEnded] = useState(false);
  
  const { t } = useTranslation();
  
  const isTimerIdle = !isActive && !isPaused;

  const isSessionRunning = currentSession !== null && !currentSession.isCompleted;

  useEffect(() => {
    setTimerIsActiveCallback(isSessionRunning);
  }, [isSessionRunning, setTimerIsActiveCallback]);


  const clearTimerState = useCallback(() => {
    setCurrentSession(null);
    reset(TIMER_TYPES.stopwatch);
    setIsWorkDayEnded(false);
  }, [reset]);

  useEffect(() => {
    setTimerResetCallback(clearTimerState);
  }, [clearTimerState, setTimerResetCallback]);


  // Load sessions from storage and listen for real-time updates
  useEffect(() => {
    if (!settingsLoaded || !user) return;

    setIsLoading(true);

    const unsubscribe = storageService.onSessionsChange(user.uid, settings.mode, (loadedSessions) => {
        setAllSessions(loadedSessions);
        
        // Find today's current session
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        let todaySession: Session | null = null;
        
        if (settings.mode === 'work') {
            // Work mode: only one session per day
            todaySession = loadedSessions.find(s => s.date === today && !s.isCompleted) || null;
        } else {
            // Learning mode: find the last unfinished session today
            const todaySessions = loadedSessions.filter(s => s.date === today && !s.isCompleted);
            todaySession = todaySessions[todaySessions.length - 1] || null;
        }
        
        console.log("Today's session:", todaySession);
        setCurrentSession(todaySession);
        
        if (todaySession) {
            // Calculate accumulated time from all work steps
            let accumulatedTime = 0;
            const now = new Date();
            
            for (const step of todaySession.steps) {
                if (step.type === 'work') {
                    const startTime = new Date(step.start).getTime();
                    const endTime = step.end ? new Date(step.end).getTime() : now.getTime();
                    accumulatedTime += endTime - startTime;
                }
            }
            
            // Set the timer to the accumulated time
            setTime(Math.floor(accumulatedTime / 1000));
            
            // Check if we're currently in a work or pause step
            const lastStep = todaySession.steps[todaySession.steps.length - 1];
            if (lastStep && !lastStep.end) {
                if (lastStep.type === 'work') {
                    start();
                } else {
                    pause();
                }
            } else {
                pause();
            }
            
            // Check for work day ended state
            if (settings.mode === 'work' && todaySession.isCompleted) {
                setIsWorkDayEnded(true);
            }
        } else {
            clearTimerState();
        }
        
        setIsLoading(false);
    });
    
    // Fetch topics once
    storageService.getAllTopics(user.uid).then(setAllTopics);

    // Cleanup listener
    return () => unsubscribe();
  }, [settingsLoaded, settings.mode, user, setTime, start, pause, reset, clearTimerState]);

  // Persist all sessions whenever they change for the current mode
  useEffect(() => {
    // Only save if not loading and user is present.
    // The listener will handle local state, this handles remote state.
    if (isLoading || !user) return; 
    storageService.saveSessions(user.uid, settings.mode, allSessions);
  }, [allSessions, isLoading, settings.mode, user]);

  // Create a new session (work: one per day, learning: multiple per day)
  const createNewSession = useCallback((sessionData: Omit<Session, 'id' | 'date' | 'steps' | 'isCompleted'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newSession: Session = {
      id: new Date().toISOString() + Math.random(),
      date: today,
      start: new Date(),
      end: null,
      steps: [],
      isCompleted: false,
      ...sessionData,
    };
    
    setAllSessions(prev => [...prev, newSession]);
    setCurrentSession(newSession);
    return newSession;
  }, []);

  // Add a new step to current session
  const addStepToCurrentSession = useCallback((stepType: 'work' | 'pause', note?: string) => {
    if (!currentSession) return;
    
    const newStep: SessionStep = {
      id: new Date().toISOString() + Math.random(),
      type: stepType,
      start: new Date(),
      end: null,
      note,
    };
    
    const updatedSession = {
      ...currentSession,
      steps: [...currentSession.steps, newStep],
    };

    console.log("Updated Session with new step:", updatedSession);
    
    setCurrentSession(updatedSession);
    setAllSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
  }, [currentSession]);

  // End the last step in current session
  const endLastStepInCurrentSession = useCallback(() => {
    if (!currentSession || currentSession.steps.length === 0) return;
    
    const updatedSteps = [...currentSession.steps];
    const lastStepIndex = updatedSteps.length - 1;
    updatedSteps[lastStepIndex] = { ...updatedSteps[lastStepIndex], end: new Date() };
    
    const updatedSession = {
      ...currentSession,
      steps: updatedSteps,
    };
    
    setCurrentSession(updatedSession);
    setAllSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
  }, [currentSession]);

  // Update current session with new data
  const updateCurrentSession = useCallback((updates: Partial<Session>) => {
    if (!currentSession) return;
    
    const updatedSession = { ...currentSession, ...updates };
    setCurrentSession(updatedSession);
    setAllSessions(prev => prev.map(s => s.id === currentSession.id ? updatedSession : s));
  }, [currentSession]);
  
  const handleGenericStart = () => {
    // Learning mode: always open dialog for new sessions when no current session
    if (settings.mode === 'learning' && !currentSession) {
      setStartLearningDialogOpen(true);
      return;
    }
    
    // If no current session exists, create one
    if (!currentSession) {
      createNewSession({ mode: settings.mode });
    }
    
    // If resuming from pause, end the current pause step
    if (isPaused) {
      endLastStepInCurrentSession();
    }
    
    // Add new work step
    addStepToCurrentSession('work');
    start();
  };
  
  const handleStartLearning = (goal: string, objectives: string[], topics: string[]) => {
    if (isPaused) {
      endLastStepInCurrentSession();
    }
    
    const learningObjectives: LearningObjective[] = objectives.map(obj => ({ text: obj, completed: 0 }));
    
    // Create new learning session
    createNewSession({
      mode: 'learning',
      learningGoal: goal,
      learningObjectives,
      topics,
    });
    
    // Add first work step
    addStepToCurrentSession('work');
    start();
  }

  const handlePause = () => {
    // End current work step
    endLastStepInCurrentSession();
    
    // Add new pause step
    addStepToCurrentSession('pause');
    pause();
    setPauseNoteDialogOpen(true);
  };
  
  const handleReset = () => {
    if (isTimerIdle || !currentSession) return;

    // Remove the last step if it's still running
    if (currentSession.steps.length > 0) {
      const lastStep = currentSession.steps[currentSession.steps.length - 1];
      if (!lastStep.end) {
        const updatedSteps = currentSession.steps.slice(0, -1);
        
        if (updatedSteps.length === 0) {
          // If no steps left, remove the entire session
          setAllSessions(prev => prev.filter(s => s.id !== currentSession.id));
          setCurrentSession(null);
        } else {
          // Update session with remaining steps
          updateCurrentSession({ steps: updatedSteps });
        }
      }
    }
    
    // Reset the timer UI
    clearTimerState();
  };

  const endCurrentSessionAndPause = useCallback(() => {
    if ((isActive || isPaused) && currentSession) {
      endLastStepInCurrentSession();
    }
    pause();
  }, [currentSession, isActive, isPaused, pause, endLastStepInCurrentSession]);

  useEffect(() => {
    setEndCurrentSessionCallback(endCurrentSessionAndPause);
  }, [endCurrentSessionAndPause, setEndCurrentSessionCallback]);


  const handleEnd = () => {
    if (!currentSession) return;
    
    if (settings.mode === 'learning' && currentSession.learningGoal) {
      // Learning mode: open dialog to complete objectives
      setSessionToEnd(currentSession);
      setEndLearningDialogOpen(true);
      
      // End current step and add a temporary "ending" pause
      if (isActive || isPaused) {
        endLastStepInCurrentSession();
      }
      addStepToCurrentSession('pause', 'Ending session...');
      pause();
    } else {
      // Work mode: end the entire work day
      if (isActive || isPaused) {
        endLastStepInCurrentSession();
      }
      
      // Mark work session as completed with "Day ended" note
      updateCurrentSession({ 
        end: new Date(), 
        isCompleted: true,
        totalWorkTime: currentSession.steps
          .filter(step => step.type === 'work')
          .reduce((total, step) => {
            const endTime = step.end ? step.end.getTime() : Date.now();
            return total + (endTime - step.start.getTime());
          }, 0)
      });
      
      pause();
      setIsWorkDayEnded(true);
    }
  }
  
  const handleContinueWork = () => {
    if (!currentSession) return;
    
    // Mark session as not completed and remove the end time
    updateCurrentSession({ 
      end: null, 
      isCompleted: false 
    });
    
    // Add new work step
    addStepToCurrentSession('work');
    start();
    setIsWorkDayEnded(false);
  }

  const endLearningSession = async (updatedObjectives: LearningObjective[], totalCompletion: number) => {
    if (!sessionToEnd || !user) return;

    // Calculate total work time for this session
    const totalWorkTime = sessionToEnd.steps
      .filter(step => step.type === 'work')
      .reduce((total, step) => {
        const endTime = step.end ? step.end.getTime() : Date.now();
        return total + (endTime - step.start.getTime());
      }, 0);

    // Update the session with completion data
    const completedSession = {
      ...sessionToEnd,
      end: new Date(),
      isCompleted: true,
      learningObjectives: updatedObjectives,
      completionPercentage: totalCompletion,
      totalWorkTime,
      // Remove the temporary "ending" step
      steps: sessionToEnd.steps.filter(step => step.note !== 'Ending session...')
    };

    // Update sessions list
    setAllSessions(prev => prev.map(s => s.id === sessionToEnd.id ? completedSession : s));
    
    // Clear current session to allow starting a new one
    setCurrentSession(null);
    
    // Refresh topics
    const topics = await storageService.getAllTopics(user.uid);
    setAllTopics(topics);

    // Reset UI for the next session
    reset(TIMER_TYPES.stopwatch);
    pause();
    setEndLearningDialogOpen(false);
    setSessionToEnd(null);
  };

  const handleSaveNote = (note: string) => {
    if (!currentSession || currentSession.steps.length === 0) return;
    
    const updatedSteps = [...currentSession.steps];
    const lastStepIndex = updatedSteps.length - 1;
    updatedSteps[lastStepIndex] = { ...updatedSteps[lastStepIndex], note };
    
    updateCurrentSession({ steps: updatedSteps });
  };
  
  const totalTimeOnEndedScreen = currentSession && currentSession.isCompleted && currentSession.mode === 'work' 
    ? currentSession.totalWorkTime || 0
    : 0;
  
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
           ) : currentSession && currentSession.steps.length > 0 && (
              <Timeline sessions={currentSession.steps} isWorkDayEnded={isWorkDayEnded} />
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
             // If dialog is closed without saving, remove the temporary "ending" step
             if (currentSession) {
               const lastStep = currentSession.steps[currentSession.steps.length - 1];
               if (lastStep && lastStep.note === 'Ending session...') {
                  // Remove the temporary pause step
                  const updatedSteps = currentSession.steps.slice(0, -1);
                  updateCurrentSession({ steps: updatedSteps });
                  
                  // Resume if there was a work step before the pause
                  const previousStep = updatedSteps[updatedSteps.length - 1];
                  if (previousStep && previousStep.type === 'work' && !previousStep.end) {
                     start();
                  }
               }
             }
          }
          setEndLearningDialogOpen(isOpen);
        }}
        onEnd={endLearningSession}
        session={sessionToEnd}
      />
    </>
  );
}
