
"use client";

import { useState, useEffect } from "react";
import type { Session, SessionStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Briefcase, Coffee, Flag, Flame, PersonStanding, Wind, Pencil, Brain, Target, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-provider";
import { Button } from "./ui/button";


interface TimelineProps {
  sessions: SessionStep[];
  isWorkDayEnded?: boolean;
  showEditButtons?: boolean;
  onEditSession?: (session: SessionStep) => void;
  onDeleteSession?: (session: SessionStep, index: number) => void;
}

function formatTime(date: Date | null) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start: Date, end: Date) {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000; // in seconds
  if (diff < 0) return '0 sec';
  
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = Math.round(diff % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours} hr`);
  if (minutes > 0) parts.push(`${minutes} min`);
  // Always show seconds if duration is less than a minute, or if there are seconds to show.
  if (diff < 60 || seconds > 0) parts.push(`${seconds} sec`);
  
  return parts.length > 0 ? parts.join(' ') : '0 sec';
}

function formatOngoingDuration(start: Date, now: number) {
    const diff = Math.max(0, (now - new Date(start).getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = Math.floor(diff % 60);

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getIconForNote(note: string | undefined, t: (key: string) => string) {
    if (!note) return Coffee;
    if (note === 'Day ended') return Flag;
    if (note === t('breakCoffee')) return Coffee;
    if (note === t('breakToilet')) return PersonStanding;
    if (note === t('breakFreshAir')) return Wind;
    if (note === t('breakSmoking')) return Flame;
    return Pencil;
}


export function Timeline({ sessions, isWorkDayEnded = false, showEditButtons = false, onEditSession, onDeleteSession }: TimelineProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [now, setNow] = useState(Date.now());
  
  const hasOngoingSession = sessions.some(s => !s.end);

  useEffect(() => {
    if (hasOngoingSession) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [hasOngoingSession]);

  
  const dailyGoalHours = settings.dailyGoal || 8;
  const isWorkModeWithGoal = settings.mode === 'work' && dailyGoalHours > 0;
  
  const workDurationSoFar = sessions
    .filter(s => s.type === 'work')
    .reduce((acc, s) => {
        const startMs = new Date(s.start).getTime();
        // If session is ongoing, calculate duration until now.
        const endMs = s.end ? new Date(s.end).getTime() : (s.type === 'work' ? now : startMs);
        return acc + (endMs - startMs);
    }, 0);

  const remainingWorkMs = (dailyGoalHours * 60 * 60 * 1000) - workDurationSoFar;
  
  // Only show projected end time if a work session is currently active and the day isn't marked as ended.
  const isWorkSessionActive = sessions.some(s => s.type === 'work' && !s.end);
  const showProjectedEndTime = isWorkModeWithGoal && isWorkSessionActive && !isWorkDayEnded && remainingWorkMs > 0;
  const projectedEndTime = showProjectedEndTime ? new Date(now + remainingWorkMs) : null;
  
  const sessionsToDisplay = sessions;

  return (
    <div className="relative pl-6">
       <div className="absolute top-0 left-0 h-full w-px bg-border"></div>
      <AnimatePresence initial={false}>
        <div className="space-y-8">
            {sessionsToDisplay.map((session, index) => {
              const PauseIcon = getIconForNote(session.note, t);
              const isFirstWorkSession = sessions.filter(s => s.type === 'work').findIndex(s => s.id === session.id) === 0;

              // Deletable if it's not the very first work session
              const isDeletable = session.type === 'pause' || (session.type === 'work' && !isFirstWorkSession);


              return (
                <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start relative"
                >
                    <div className="absolute left-0 top-1 -translate-x-1/2">
                    <div
                        className={cn(
                        "w-4 h-4 rounded-full z-10 bg-background border-2",
                        session.type === 'work' ? 'border-primary' : 'border-accent'
                        )}
                    ></div>
                    </div>
                    <div className="flex-1 pl-6">
                      <div className="flex items-center gap-2">
                          {session.type === 'work' ? (settings.mode === 'learning' ? <Brain className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />) : <PauseIcon className="w-4 h-4" />}
                          <span className="font-semibold">{formatTime(session.start)} - {session.end ? formatTime(session.end) : 'Ongoing'}</span>
                          <span className="text-muted-foreground text-sm tabular-nums">
                            {session.end ? formatDuration(session.start, session.end) : formatOngoingDuration(session.start, now)}
                          </span>
                           {showEditButtons && onEditSession && (
                             <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditSession(session)}>
                                <Edit className="h-3 w-3" />
                             </Button>
                           )}
                           {showEditButtons && onDeleteSession && isDeletable && (
                             <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={() => onDeleteSession(session, index)}>
                                <Trash2 className="h-3 w-3" />
                             </Button>
                           )}
                      </div>
                      
                      {session.type === 'work' && session.learningGoal && (
                          <p className="text-sm text-muted-foreground ml-6 italic">
                          Goal: "{session.learningGoal}"
                           {session.completionPercentage !== undefined && <span className="font-semibold not-italic"> - Completed: {session.completionPercentage}%</span>}
                          </p>
                      )}

                      {session.type === 'pause' && session.note && session.note !== 'Day ended' && (
                          <p className="text-sm text-muted-foreground ml-6 italic">
                          "{session.note}"
                          </p>
                      )}
                    </div>
                </motion.div>
              );
            })}
        </div>
      </AnimatePresence>
      
      {isWorkDayEnded && settings.mode === 'work' && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start relative mt-8"
        >
          <div className="absolute left-0 top-1 -translate-x-1/2">
            <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary z-10"></div>
          </div>
         <div className="flex-1 pl-6">
           <div className="flex items-center gap-2">
             <Flag className="w-4 h-4 text-primary" />
             <span className="font-semibold text-primary">{t('endDay')}</span>
           </div>
         </div>
       </motion.div>
      )}

      {projectedEndTime && (
         <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-start relative mt-8"
         >
           <div className="absolute left-0 top-1 -translate-x-1/2">
             <div className="w-4 h-4 rounded-full bg-border z-10 opacity-50"></div>
           </div>
          <div className="flex-1 pl-6 opacity-50">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span className="font-semibold">{formatTime(projectedEndTime)}</span>
               <span className="text-muted-foreground text-sm">({t('endDay')})</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
