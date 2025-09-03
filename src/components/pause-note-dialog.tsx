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
import { cn } from "@/lib/utils";

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
        <RadioGroup value={selectedValue} onValueChange={setSelectedValue} className="grid gap-2 p-4">
            {pauseOptions.map((option) => (
              <Label
                key={option.id}
                htmlFor={option.id}
                className={cn(
                  "flex items-center gap-4 rounded-md border-2 px-6 py-3 cursor-pointer transition-colors hover:border-primary",
                  selectedValue === option.id && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                <option.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{option.label}</span>
              </Label>
            ))}
            
            {selectedValue === 'other' && (
              <Textarea
                  id="note"
                  placeholder={t('notePlaceholder')}
                  className="mt-2"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  autoFocus
                />
            )}
        </RadioGroup>
        <DialogFooter>
          <Button onClick={handleSave}>{t('saveNote')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
