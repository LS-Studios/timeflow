
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Flag } from "lucide-react";
import { useTranslation } from "@/lib/i18n.tsx";
import { useSettings } from "@/lib/settings-provider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface TimerControlsProps {
  isActive: boolean;
  isPaused: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onEnd: () => void;
}

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
};

export function TimerControls({
  isActive,
  isPaused,
  onStart,
  onPause,
  onReset,
  onEnd,
}: TimerControlsProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  return (
    <div className="flex items-center justify-center gap-4 h-16">
      <Button
        variant="ghost"
        size="icon"
        className="h-14 w-14"
        aria-label={t('reset')}
        onClick={onReset}
      >
        <RotateCcw className="h-7 w-7 text-muted-foreground" />
      </Button>

      <AnimatePresence mode="wait">
        {!isActive && (
          <motion.div
            key="start"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Button
              size="lg"
              className="min-w-[9rem] h-16 rounded-full text-2xl font-bold bg-primary hover:bg-primary/90"
              onClick={onStart}
              aria-label={isPaused ? t('resume') : t('start')}
            >
              <Play className="h-8 w-8 mr-2" />
              {isPaused ? t('resume') : t('start')}
            </Button>
          </motion.div>
        )}
        {isActive && (
          <motion.div
            key="pause"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <Button
              size="lg"
              className="min-w-[9rem] h-16 rounded-full text-2xl font-bold bg-primary hover:bg-primary/90"
              onClick={onPause}
              aria-label={t('pause')}
            >
              <Pause className="h-8 w-8 mr-2" />
              {t('pause')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          className="h-14 w-14"
          aria-label={t('endDay')}
          onClick={onEnd}
        >
          <Flag className="h-7 w-7 text-muted-foreground" />
        </Button>
    </div>
  );
}

    