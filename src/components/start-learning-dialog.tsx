
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
import { Brain } from "lucide-react";

interface StartLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStart: (goal: string) => void;
}

export function StartLearningDialog({
  isOpen,
  onOpenChange,
  onStart,
}: StartLearningDialogProps) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState("");

  const handleStart = () => {
    if (goal.trim()) {
      onStart(goal.trim());
      onOpenChange(false);
      setGoal("");
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setGoal("");
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-6 w-6" />
            <DialogTitle>{t('startLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('whatDidYouLearn')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <Textarea
              id="goal"
              placeholder={t('learningGoalPlaceholder')}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              autoFocus
            />
        </div>
        <DialogFooter>
          <Button onClick={handleStart} disabled={!goal.trim()}>{t('startLearning')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

