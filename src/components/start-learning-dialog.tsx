
import { useState, KeyboardEvent } from "react";
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
import { useTranslation } from "@/lib/i18n.tsx";
import { Brain, X as XIcon, Plus } from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";

interface StartLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStart: (goal: string, objectives: string[]) => void;
}

export function StartLearningDialog({
  isOpen,
  onOpenChange,
  onStart,
}: StartLearningDialogProps) {
  const { t } = useTranslation();
  const [mainGoal, setMainGoal] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState("");

  const handleStart = () => {
    if (mainGoal.trim()) {
      const finalObjectives = currentObjective.trim() ? [...objectives, currentObjective.trim()] : objectives;
      onStart(mainGoal.trim(), finalObjectives);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMainGoal("");
      setObjectives([]);
      setCurrentObjective("");
    }
    onOpenChange(open);
  };
  
  const handleObjectiveKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentObjective.trim()) {
      e.preventDefault();
      setObjectives([...objectives, currentObjective.trim()]);
      setCurrentObjective("");
    }
  };

  const handleRemoveObjective = (indexToRemove: number) => {
    setObjectives(objectives.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-6 w-6" />
            <DialogTitle>{t('startLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>{t('whatDidYouLearn')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal">{t('learningGoal')}</Label>
            <Input
              id="goal"
              placeholder={t('learningGoalPlaceholder')}
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="objectives">{t('learningObjectives')}</Label>
            {objectives.length > 0 && (
              <div className="flex flex-col gap-2">
                {objectives.map((obj, index) => (
                  <div key={index} className="flex items-center gap-2">
                     <Badge variant="secondary" className="pl-3 pr-1 py-1 text-sm flex-1 justify-start">
                        {obj}
                      </Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveObjective(index)}>
                        <XIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="sr-only">Remove {obj}</span>
                      </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input
                id="objectives"
                placeholder={t('addObjectivePlaceholder')}
                value={currentObjective}
                onChange={(e) => setCurrentObjective(e.target.value)}
                onKeyDown={handleObjectiveKeyDown}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStart} disabled={!mainGoal.trim()}>
             <Plus className="mr-2 h-4 w-4" />
            {t('startLearning')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
