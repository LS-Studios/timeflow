
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Timeline } from "@/components/timeline";
import { EditWorkDialog } from "@/components/edit-work-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/lib/i18n";
import type { Session, DayHistory } from "@/lib/types";
import { Save, Send, Clock } from "lucide-react";
import { format } from "date-fns";

interface WorkDayDetailDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  day: DayHistory | null;
  onSave: (pendingSessions: Session[]) => void;
  onRequestChange: (pendingSessions: Session[], reason: string) => void;
  isInOrganization: boolean;
  isPending: boolean;
}

export function WorkDayDetailDialog({ isOpen, onOpenChange, day, onSave, onRequestChange, isInOrganization, isPending }: WorkDayDetailDialogProps) {
  const { t } = useTranslation();
  
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [changeRequestReason, setChangeRequestReason] = useState("");
  const [workSessionToEdit, setWorkSessionToEdit] = useState<Session | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<{ session: Session; index: number } | null>(null);

  useEffect(() => {
    if (isOpen && day) {
      // Create a deep copy to avoid mutating the original state
      setPendingSessions(JSON.parse(JSON.stringify(day.sessions)));
      setHasPendingChanges(false);
      setChangeRequestReason("");
    }
  }, [isOpen, day]);

  const handleUpdateWorkSession = (updatedSession: Session) => {
    const sessionIndex = pendingSessions.findIndex(s => s.id === updatedSession.id);
    if(sessionIndex !== -1) {
        const newPendingSessions = [...pendingSessions];
        newPendingSessions[sessionIndex] = updatedSession;
        setPendingSessions(newPendingSessions);
        setHasPendingChanges(true);
    }
    setWorkSessionToEdit(null);
  };

  const handleDeleteSession = () => {
    if (!sessionToDelete) return;

    const { session, index } = sessionToDelete;
    let newPendingSessions = [...pendingSessions];

    // Check if it's the very first work session of the day
    const isFirstWorkSession = newPendingSessions.filter(s => s.type === 'work')[0]?.id === session.id;

    if (session.type === 'work' && isFirstWorkSession) {
        console.warn("Cannot delete the first work session of the day.");
        setSessionToDelete(null);
        return;
    }
    
    if (session.type === 'pause' && index > 0 && index < newPendingSessions.length - 1) {
        const precedingSession = newPendingSessions[index - 1];
        const followingSession = newPendingSessions[index + 1];

        // If a pause is between two work sessions, merge them
        if (precedingSession.type === 'work' && followingSession.type === 'work') {
            precedingSession.end = followingSession.end; // Extend the end time
            newPendingSessions.splice(index, 2); // Remove pause and the second work session
        } else {
            // If it's a pause at the end or not between two work sessions, just remove it
            newPendingSessions.splice(index, 1);
        }
    } else {
        // Standard deletion for other cases (e.g., a work session that is not the first one)
        newPendingSessions.splice(index, 1);
    }
    
    setPendingSessions(newPendingSessions);
    setHasPendingChanges(true);
    setSessionToDelete(null);
  };

  const handleSubmit = () => {
    if (isInOrganization) {
      onRequestChange(pendingSessions, changeRequestReason);
    } else {
      onSave(pendingSessions);
    }
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return format(date, "PPP");
    } catch (e) {
      return dateString;
    }
  };

  if (!day) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('detailsFor')} {formatDate(day.date)}</DialogTitle>
            <DialogDescription>{isPending ? t('requestPendingDescription') : t('editWorkDayDescription')}</DialogDescription>
          </DialogHeader>
          
          {isPending && (
            <Alert>
                <Clock className="h-4 w-4" />
                <AlertTitle>{t('requestPending')}</AlertTitle>
                <AlertDescription>{t('requestPendingDescriptionLong')}</AlertDescription>
            </Alert>
          )}

          <div className="py-4 max-h-[60vh] overflow-y-auto">
             <Timeline 
                sessions={pendingSessions} 
                isWorkDayEnded={true} 
                showEditButtons={!isPending} 
                onEditSession={(session) => setWorkSessionToEdit(session)}
                onDeleteSession={(session, index) => setSessionToDelete({session, index})}
            />
          </div>
           {hasPendingChanges && !isPending && (
            <>
              <Separator />
               {isInOrganization && (
                <div className="grid gap-2 mt-4">
                  <Label htmlFor="change-reason">{t('reasonForChange')}</Label>
                  <Textarea 
                    id="change-reason"
                    placeholder={t('reasonForChangePlaceholder')}
                    value={changeRequestReason}
                    onChange={(e) => setChangeRequestReason(e.target.value)}
                    disabled={isPending}
                  />
                </div>
              )}
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={handleCancel}>{t('cancel')}</Button>
                <Button onClick={handleSubmit} disabled={isPending || (isInOrganization && !changeRequestReason.trim())}>
                  {isInOrganization ? <Send className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {isInOrganization ? t('requestChange') : t('saveChanges')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      <EditWorkDialog
        isOpen={!!workSessionToEdit}
        onOpenChange={(isOpen) => !isOpen && setWorkSessionToEdit(null)}
        onSave={handleUpdateWorkSession}
        session={workSessionToEdit}
      />
      
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteSessionConfirmation')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession}>{t('confirmDeleteSession')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
