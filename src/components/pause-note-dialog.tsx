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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Coffee, PersonStanding, Wind, Flame, Pencil } from "lucide-react";

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
  const [selectedValue, setSelectedValue] = useState("coffee");

  const pauseOptions = [
    { id: "coffee", label: t('breakCoffee'), icon: Coffee },
    { id: "toilet", label: t('breakToilet'), icon: PersonStanding },
    { id: "freshAir", label: t('breakFreshAir'), icon: Wind },
    { id: "smoking", label: t('breakSmoking'), icon: Flame },
    { id: "other", label: t('breakOther'), icon: Pencil },
  ];

  const handleSave = () => {
    const selectedOption = pauseOptions.find(opt => opt.id === selectedValue);
    if (selectedValue === 'other') {
      onSave(note || t('breakOther'));
    } else if (selectedOption) {
      onSave(selectedOption.label);
    }
    onOpenChange(false);
    setNote("");
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedValue("coffee");
      setNote("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addPauseNote')}</DialogTitle>
          <DialogDescription>
            {t('addPauseNoteDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
            <div className="space-y-2">
              {pauseOptions.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex items-center gap-2 font-normal">
                    <option.icon className="w-4 h-4 text-muted-foreground" />
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>

          {selectedValue === 'other' && (
             <Textarea
                id="note"
                placeholder={t('notePlaceholder')}
                className="col-span-3 mt-4"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>{t('saveNote')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
