
"use client";

import { useState, useEffect } from "react";
import type { Session, SessionStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Timeline } from "./timeline";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Briefcase, Coffee, Flag, Brain, Hourglass } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

function getIconForStep(step: SessionStep, mode: "work" | "learning") {
    if (step.type === "work") {
        return mode === "learning" ? Brain : Briefcase;
    }
    return Coffee; 
}

function formatDuration(ms: number) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(seconds).padStart(2, "0")}`;
};

interface CollapsibleTimelineProps {
  session: Session;
}

export function CollapsibleTimeline({ session }: CollapsibleTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();
  
  const [currentPauseTime, setCurrentPauseTime] = useState(0);

  const lastStep = session.steps?.[session.steps.length - 1];
  const isPauseActive = lastStep?.type === 'pause' && !lastStep.end;
  
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPauseActive) {
      const startMs = new Date(lastStep.start).getTime();
      
      const updatePauseTime = () => {
        const now = Date.now();
        setCurrentPauseTime(Math.floor((now - startMs) / 1000));
      };

      updatePauseTime(); // Initial call
      interval = setInterval(updatePauseTime, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPauseActive, lastStep]);

  if (!session.steps || session.steps.length === 0 || !lastStep) {
    return null;
  }

  const Icon = getIconForStep(lastStep, session.mode);
  
  const totalPauseMs = session.steps
    .filter(s => s.type === 'pause' && s.end)
    .reduce((acc, s) => acc + (new Date(s.end!).getTime() - new Date(s.start).getTime()), 0);

  const renderSummary = () => {
    if (session.isCompleted) {
        return (
             <div className="flex items-center gap-2 text-sm text-primary">
                <Flag className="w-4 h-4" />
                <span className="font-semibold">{t('workDayEnded')}</span>
             </div>
        )
    }
    return (
        <div className="flex items-center justify-between w-full text-sm">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4"/>
                <span className="font-medium">{lastStep.type === 'work' && session.mode === 'learning' ? t('learning') : t(lastStep.type)}</span>
            </div>
            
            {isPauseActive && (
              <div className="absolute left-1/2 -translate-x-1/2 font-mono text-base text-muted-foreground">
                {currentPauseTime > 0 ? formatTime(currentPauseTime) : "00:00:00"}
              </div>
            )}

            <div className="flex items-center gap-2 text-muted-foreground mr-2">
                <Hourglass className="w-4 h-4"/>
                <span>{formatDuration(totalPauseMs)} {t('break')}</span>
            </div>
        </div>
    )
  }

  return (
    <div className="border rounded-lg p-3">
        <div className="flex items-center justify-between cursor-pointer relative" onClick={() => setIsExpanded(!isExpanded)}>
            <div className="flex-1">
                 {renderSummary()}
            </div>
             <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform shrink-0", isExpanded && "rotate-180")} />
        </div>
        
        <AnimatePresence initial={false}>
            {isExpanded && (
                <motion.div
                    initial="collapsed"
                    animate="open"
                    exit="collapsed"
                    variants={{
                        open: { opacity: 1, height: "auto" },
                        collapsed: { opacity: 0, height: 0 }
                    }}
                    transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    className="overflow-hidden"
                >
                    <div className="relative pt-6">
                        <div className="relative left-[-12px]">
                            <Timeline sessions={session.steps} isWorkDayEnded={session.isCompleted} />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
