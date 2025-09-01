"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimer } from "@/hooks/use-timer";
import { TimerDisplay } from "@/components/timer-display";
import { TimerControls } from "@/components/timer-controls";
import { PauseNoteDialog } from "@/components/pause-note-dialog";
import { TIMER_TYPES, type TimerType } from "@/lib/constants";
import { useTranslation } from "@/lib/i18n.tsx";

export default function Home() {
  const [timerType, setTimerType] = useState<TimerType>("pomodoro");
  const {
    time,
    isActive,
    isPaused,
    start,
    pause,
    reset,
    mode,
    progress,
  } = useTimer(TIMER_TYPES[timerType]);
  const [isNoteDialogOpen, setNoteDialogOpen] = useState(false);
  const { t } = useTranslation();

  const handleTimerTypeChange = (value: string) => {
    const newType = value as TimerType;
    setTimerType(newType);
    reset(TIMER_TYPES[newType]);
  };

  const handlePause = () => {
    pause();
    setNoteDialogOpen(true);
  };
  
  const handleStart = () => {
    start();
  }
  
  const handleReset = () => {
    reset(TIMER_TYPES[timerType]);
  }

  return (
    <>
      <div className="flex-1 w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md mx-auto flex flex-col items-center gap-8"
        >
          <Tabs
            defaultValue={timerType}
            onValueChange={handleTimerTypeChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pomodoro">{t('pomodoro')}</TabsTrigger>
              <TabsTrigger value="stopwatch">{t('stopwatch')}</TabsTrigger>
              <TabsTrigger value="custom">{t('custom')}</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <TimerDisplay time={time} progress={progress} />

          <TimerControls
            isActive={isActive}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={handlePause}
            onReset={handleReset}
          />
        </motion.div>
      </div>
      <PauseNoteDialog
        isOpen={isNoteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      />
    </>
  );
}
