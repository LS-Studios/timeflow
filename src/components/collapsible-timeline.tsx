
"use client";

import { useState } from "react";
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
    // For pauses, delegate to the detailed icon function in Timeline
    return Coffee; // Fallback, timeline will use a more specific one
}

function formatDuration(ms: number) {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

interface CollapsibleTimelineProps {
  session: Session;
}

export function CollapsibleTimeline({ session }: CollapsibleTimelineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useTranslation();
  
  if (!session.steps || session.steps.length === 0) {
    return null;
  }

  const lastStep = session.steps[session.steps.length - 1];
  const Icon = getIconForStep(lastStep, session.mode);
  
  const totalPauseMs = session.steps
    .filter(s => s.type === 'pause' && s.end)
    .reduce((acc, s) => acc + (new Date(s.end!).getTime() - new Date(s.start).getTime()), 0);

  const renderSummary = () => {
    if (session.isCompleted) {
        return (
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Flag className="w-4 h-4 text-primary" />
                <span className="font-semibold text-primary">{t('workDayEnded')}</span>
             </div>
        )
    }
    return (
        <div className="flex items-center justify-between w-full text-sm">
            <div className="flex items-center gap-2">
                <Icon className="w-4 h-4"/>
                <span className="font-medium capitalize">{lastStep.type}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
                <Hourglass className="w-4 h-4"/>
                <span>Breaks ({formatDuration(totalPauseMs)})</span>
            </div>
        </div>
    )
  }

  return (
    <div className="border rounded-lg p-3">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            {renderSummary()}
             <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
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
                    <div className="relative left-3 pt-6">
                        <Timeline sessions={session.steps} isWorkDayEnded={session.isCompleted} />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
}
