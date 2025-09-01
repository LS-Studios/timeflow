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
import { useTranslation } from "@/lib/i18n";

interface PauseNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function PauseNoteDialog({
  isOpen,
  onOpenChange,
}: PauseNoteDialogProps) {
  const { t } = useTranslation();

  const handleSave = () => {
    // Here you would typically save the note to a state or a service
    console.log("Note saved!");
    onOpenChange(false);
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
          />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t('saveNote')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
