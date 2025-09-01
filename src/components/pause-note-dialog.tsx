import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n.tsx";

interface PauseNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (note: string) => void;
}

export function PauseNoteDialog({
  isOpen,
  onOpenChange,
  onSave,
}: PauseNoteDialogProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState("");

  const handleSave = () => {
    onSave(note);
    onOpenChange(false);
    setNote("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addPauseNote')}</DialogTitle>
          <DialogDescription>
            {t('addPauseNoteDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="note"
            placeholder={t('notePlaceholder')}
            className="col-span-3"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t('saveNote')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
