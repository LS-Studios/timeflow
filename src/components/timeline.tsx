"use client";

import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Briefcase, Coffee, Flag } from "lucide-react";

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

export function Timeline({ sessions }: TimelineProps) {
  // We'll add the calculated end time later
  const dailyGoalHours = 8;
  const workDurationSoFar = sessions
    .filter(s => s.type === 'work' && s.end)
    .reduce((acc, s) => acc + (s.end!.getTime() - s.start.getTime()), 0);

  const remainingWorkMs = (dailyGoalHours * 60 * 60 * 1000) - workDurationSoFar;
  const projectedEndTime = sessions.length > 0 ? new Date(Date.now() + remainingWorkMs) : null;


  return (
    <div className="space-y-8 relative pl-6">
      {sessions.map((session, index) => (
        <div key={index} className="flex items-start">
          <div className="flex flex-col items-center mr-4">
            <div
              className={cn(
                "w-4 h-4 rounded-full z-10",
                session.type === 'work' ? 'bg-primary' : 'bg-accent'
              )}
            ></div>
            <div className="w-px h-full bg-border -mt-1"></div>
          </div>
          <div className="flex-1 -mt-1.5">
            <div className="flex items-center gap-2">
              {session.type === 'work' ? <Briefcase className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              <span className="font-semibold">{formatTime(session.start)}</span>
              <span className="text-muted-foreground text-sm">
                ({formatDuration(session.start, session.end)})
              </span>
            </div>
            {session.type === 'pause' && session.note && (
              <p className="text-sm text-muted-foreground ml-6 italic">
                "{session.note}"
              </p>
            )}
          </div>
        </div>
      ))}
      
      {projectedEndTime && (
         <div className="flex items-start">
          <div className="flex flex-col items-center mr-4">
            <div className="w-4 h-4 rounded-full bg-border z-10 opacity-50"></div>
          </div>
          <div className="flex-1 -mt-1.5 opacity-50">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4" />
              <span className="font-semibold">{formatTime(projectedEndTime)}</span>
               <span className="text-muted-foreground text-sm">(Arbeitstagende)</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-2 left-[11px] h-full w-px bg-border -z-10"></div>
    </div>
  );
}
