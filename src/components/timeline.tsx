
"use client";

import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Briefcase, Coffee, Flag, Flame, PersonStanding, Wind, Pencil, Brain, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/lib/i18n";
import { useSettings } from "@/lib/settings-provider";


interface TimelineProps {
  sessions: Session[];
}

function formatTime(date: Date | null) {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(start: Date, end: Date | null) {
  if (!end) return "Ongoing";
  const diff = (end.getTime() - start.getTime()) / 1000; // in seconds
  const minutes = Math.floor(diff / 60);
  const seconds = Math.round(diff % 60);
  if (minutes > 0) {
    return `${minutes} min ${seconds} sec`;
  }
  return `${seconds} sec`;
}

function getIconForNote(note: string | undefined, t: (key: string) => string) {
    if (!note) return Coffee;
    if (note === t('breakCoffee')) return Coffee;
    if (note === t('breakToilet')) return PersonStanding;
    if (note === t('breakFreshAir')) return Wind;
    if (note === t('breakSmoking')) return Flame;
    return Pencil;
}


export function Timeline({ sessions }: TimelineProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  
  const dailyGoalHours = settings.dailyGoal || 8;
  const isWorkModeWithGoal = settings.mode === 'work' && dailyGoalHours > 0;
  
  const hasOngoingSession = sessions.some(s => !s.end);

  const workDurationSoFar = sessions
    .filter(s => s.type === 'work')
    .reduce((acc, s) => {
        const startMs = s.start.getTime();
        // If session is ongoing, calculate duration until now.
        const endMs = s.end ? s.end.getTime() : Date.now();
        return acc + (endMs - startMs);
    }, 0);

  const remainingWorkMs = (dailyGoalHours * 60 * 60 * 1000) - workDurationSoFar;
  const projectedEndTime = isWorkModeWithGoal && hasOngoingSession && remainingWorkMs > 0 ? new Date(Date.now() + remainingWorkMs) : null;


  return (
    <div className="relative pl-6">
       <div className="absolute top-0 left-0 h-full w-px bg-border"></div>
      <AnimatePresence initial={false}>
        <div className="space-y-8">
            {sessions.map((session, index) => {
              const PauseIcon = getIconForNote(session.note, t);
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
                          <span className="font-semibold">{formatTime(session.start)}</span>
                          <span className="text-muted-foreground text-sm">
                          ({formatDuration(session.start, session.end)})
                          </span>
                      </div>
                      
                      {session.type === 'work' && session.learningGoal && (
                          <p className="text-sm text-muted-foreground ml-6 italic">
                          Goal: "{session.learningGoal}"
                           {session.completionPercentage !== undefined && <span className="font-semibold not-italic"> - Completed: {session.completionPercentage}%</span>}
                          </p>
                      )}

                      {session.type === 'pause' && session.note && (
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
