
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useTimer } from "@/hooks/use-timer";
import { useSettings } from "@/lib/settings-provider";
import { useAuth } from "@/lib/auth-provider";
import { storageService } from "@/lib/storage";
import { timerManager } from "@/lib/timer/timer-manager";
import type { Session, LearningObjective } from "@/lib/types";

import { TimerDisplay } from "@/components/timer-display";
import { TimerControls } from "@/components/timer-controls";
import { PauseNoteDialog } from "@/components/pause-note-dialog";
import { StartLearningDialog } from "@/components/start-learning-dialog";
import { EndLearningDialog } from "@/components/end-learning-dialog";
import { Timeline } from "@/components/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n.tsx";

export default function Home() {
  const { t } = useTranslation();
  const { settings, isLoaded: settingsLoaded, setTimerResetCallback, setEndCurrentSessionCallback } = useSettings();
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [allTopics, setAllTopics] = useState<string[]>([]);

  // Dialog states
  const [isPauseNoteDialogOpen, setPauseNoteDialogOpen] = useState(false);
  const [isStartLearningDialogOpen, setStartLearningDialogOpen] = useState(false);
  const [isEndLearningDialogOpen, setEndLearningDialogOpen] = useState(false);
  const [sessionToEnd, setSessionToEnd] = useState<Session | null>(null);
  
  const { time, isActive, isPaused } = useTimer(currentSession);

  const isTimerIdle = !isActive && !isPaused;
  const isWorkDayEnded = settings.mode === 'work' && currentSession?.isCompleted;

  const updateState = (newAllSessions: Session[], newCurrentSession: Session | null) => {
    setAllSessions(newAllSessions);
    setCurrentSession(newCurrentSession);
  };
  
  // Load sessions from storage and set up listener
  useEffect(() => {
    if (!settingsLoaded || !user) return;

    setIsLoading(true);
    const unsubscribe = storageService.onSessionsChange(user.uid, settings.mode, (loadedSessions) => {
      setAllSessions(loadedSessions);
      setCurrentSession(timerManager.findActiveSession(loadedSessions, settings.mode));
      setIsLoading(false);
    });
    
    storageService.getAllTopics(user.uid).then(setAllTopics);

    return () => unsubscribe();
  }, [settingsLoaded, settings.mode, user]);

  // Persist sessions to storage whenever they change
  useEffect(() => {
    if (!isLoading && user) {
      storageService.saveSessions(user.uid, settings.mode, allSessions);
    }
  }, [allSessions, isLoading, settings.mode, user]);

  // Callback to clear timer from settings provider
  const clearTimerState = useCallback(() => {
    setCurrentSession(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setTimerResetCallback(clearTimerState);
  }, [clearTimerState, setTimerResetCallback]);

  // Callback to end session from settings provider
  const endCurrentSessionAndPause = useCallback(() => {
    if ((isActive || isPaused) && currentSession) {
      const { updatedSessions, updatedCurrentSession } = timerManager.endLastStep(allSessions, currentSession);
      updateState(updatedSessions, updatedCurrentSession);
    }
  }, [currentSession, isActive, isPaused, allSessions]);
  
  useEffect(() => {
    setEndCurrentSessionCallback(endCurrentSessionAndPause);
  }, [endCurrentSessionAndPause, setEndCurrentSessionCallback]);


  // --- TIMER CONTROL HANDLERS ---
  
  const handleStart = async () => {
    await timerManager.handleStart({
      mode: settings.mode,
      allSessions,
      currentSession,
      isPaused,
      callbacks: {
        openStartLearningDialog: () => setStartLearningDialogOpen(true),
        updateState,
      },
    });
  };

  const handlePause = () => {
    const result = timerManager.handlePause(allSessions, currentSession);
    if (result) {
      updateState(result.updatedSessions, result.updatedCurrentSession);
      setPauseNoteDialogOpen(true);
    }
  };

  const handleReset = () => {
    const result = timerManager.handleReset(allSessions, currentSession);
    if (result) {
      updateState(result.updatedSessions, result.updatedCurrentSession);
    }
  };

  const handleEnd = () => {
    timerManager.handleEnd({
      mode: settings.mode,
      allSessions,
      currentSession,
      callbacks: {
        openEndLearningDialog: (session) => {
          setSessionToEnd(session);
          setEndLearningDialogOpen(true);
        },
        updateState,
      },
    });
  };

  // --- DIALOG HANDLERS ---

  const handleStartLearning = (goal: string, objectives: string[], topics: string[]) => {
    timerManager.startLearningSession({
      allSessions,
      currentSession,
      isPaused,
      goal,
      objectives,
      topics,
      updateState,
    });
  };

  const handleSavePauseNote = (note: string) => {
    const result = timerManager.savePauseNote(allSessions, currentSession, note);
    if (result) {
      updateState(result.updatedSessions, result.updatedCurrentSession);
    }
  };

  const endLearningSession = async (updatedObjectives: LearningObjective[], totalCompletion: number) => {
    if (!sessionToEnd || !user) return;
    const result = timerManager.endLearningSession({
      allSessions,
      sessionToEnd,
      updatedObjectives,
      totalCompletion,
    });

    updateState(result.updatedSessions, result.updatedCurrentSession);

    // Reset UI and refresh topics
    setSessionToEnd(null);
    setEndLearningDialogOpen(false);
    storageService.getAllTopics(user.uid).then(setAllTopics);
  };
  
  const handleContinueWork = () => {
    const result = timerManager.continueWork(allSessions, currentSession);
    if(result) {
      updateState(result.updatedSessions, result.updatedCurrentSession);
    }
  }
  
  const totalTimeOnEndedScreen = currentSession?.totalWorkTime || 0;

  return (
    <>
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-md mx-auto flex flex-col items-center gap-8">
          {isLoading ? (
            <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center">
              <Skeleton className="absolute w-full h-full rounded-full" />
              <Skeleton className="h-14 w-52" />
            </div>
          ) : isWorkDayEnded ? (
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
              onStart={handleStart}
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
            <div className="relative left-3">
                <Timeline sessions={currentSession.steps} isWorkDayEnded={!!isWorkDayEnded} />
            </div>
          )}
        </div>
      </div>
      
      {/* Dialogs */}
      <PauseNoteDialog
        isOpen={isPauseNoteDialogOpen}
        onOpenChange={setPauseNoteDialogOpen}
        onSave={handleSavePauseNote}
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
            // If dialog is closed without saving, revert the "ending" state
            if (currentSession?.steps.at(-1)?.note === 'Ending session...') {
                const { updatedSessions, updatedCurrentSession } = timerManager.cancelEndLearning(allSessions, currentSession);
                updateState(updatedSessions, updatedCurrentSession);
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
