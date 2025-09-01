
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n.tsx";
import type { Session } from "@/lib/types";
import { Save, Briefcase, Coffee, Send } from "lucide-react";
import { format, parse } from 'date-fns';
import { useSettings } from "@/lib/settings-provider";

interface EditWorkDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updatedSession: Session) => void;
  session: Session | null;
}

export function EditWorkDialog({
  isOpen,
  onOpenChange,
  onSave,
  session,
}: EditWorkDialogProps) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [note, setNote] = useState("");

  const sessionDate = session ? format(new Date(session.start), 'yyyy-MM-dd') : '';
  const isInOrganization = !!settings.organizationName;

  useEffect(() => {
    if (isOpen && session) {
      setStartTime(format(new Date(session.start), 'HH:mm:ss'));
      setEndTime(session.end ? format(new Date(session.end), 'HH:mm:ss') : '');
      setNote(session.note || "");
    } else {
      setStartTime("");
      setEndTime("");
      setNote("");
    }
  }, [isOpen, session]);


  const handleSave = () => {
    if (!session) return;
    
    const startDate = parse(`${sessionDate} ${startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    const endDate = parse(`${sessionDate} ${endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        // Handle invalid date format
        console.error("Invalid time format");
        return;
    }
    
    if (isInOrganization) {
        // Here you would send the request to the admin.
        // For now, we'll just log it and close the dialog without saving.
        console.log("Requesting change for session:", session.id, { startDate, endDate, note });
        onOpenChange(false); // Close dialog
        return;
    }

    const updatedSession: Session = {
        ...session,
        start: startDate,
        end: endDate,
        note: note,
    };
    onSave(updatedSession);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           <div className="flex items-center gap-2 mb-2">
            {session?.type === 'work' ? <Briefcase className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}
            <DialogTitle>{t('editSession')}</DialogTitle>
          </div>
          <DialogDescription>
             {isInOrganization ? t('editSessionDescriptionOrg') : t('editSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">{t('startTime')}</Label>
                <Input
                id="start-time"
                type="time"
                step="1"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-time">{t('endTime')}</Label>
                <Input
                id="end-time"
                type="time"
                step="1"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
           </div>
            
            {session?.type === 'pause' && (
                <div className="space-y-2">
                    <Label htmlFor="note">{t('note')}</Label>
                    <Input
                    id="note"
                    placeholder={t('notePlaceholder')}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    />
                </div>
            )}
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={handleSave} className="w-full">
            {isInOrganization ? <Send className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            {isInOrganization ? t('requestChange') : t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
