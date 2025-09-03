
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogScrollableContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n.tsx";
import type { LearningObjective, Session } from "@/lib/types";
import { Target, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface EndLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEnd: (updatedObjectives: LearningObjective[], totalCompletion: number) => void;
  session: Session | null;
}

export function EndLearningDialog({
  isOpen,
  onOpenChange,
  onEnd,
  session,
}: EndLearningDialogProps) {
  const { t } = useTranslation();
  const [internalObjectives, setInternalObjectives] = useState<LearningObjective[]>([]);
  const [generalProgress, setGeneralProgress] = useState<number>(0);

  useEffect(() => {
    // When the dialog opens with a valid session, initialize its internal state
    if (isOpen && session?.learningObjectives) {
      setInternalObjectives(session.learningObjectives.map(obj => ({ ...obj })));
    }
    if (isOpen) {
      setGeneralProgress(0);
    }
  }, [isOpen, session]);

  const handleObjectiveChange = (index: number, completion: number) => {
    const newObjectives = [...internalObjectives];
    newObjectives[index].completed = completion;
    setInternalObjectives(newObjectives);
  };
  
  const handleCheckboxChange = (index: number, checked: boolean) => {
    const newObjectives = [...internalObjectives];
    newObjectives[index].completed = checked ? 100 : 0;
    setInternalObjectives(newObjectives);
  }

  const totalCompletion = useMemo(() => {
    if (internalObjectives.length === 0) return generalProgress;
    const sum = internalObjectives.reduce((acc, obj) => acc + obj.completed, 0);
    return Math.round(sum / internalObjectives.length);
  }, [internalObjectives, generalProgress]);

  const handleEnd = () => {
    onEnd(internalObjectives, totalCompletion);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
       // Reset internal state when closing
       setInternalObjectives([]);
       setGeneralProgress(0);
    }
    onOpenChange(open);
  };
  
  const hasMadeProgress = useMemo(() => {
    if (internalObjectives.length === 0) return generalProgress > 0;
    return internalObjectives.some(obj => obj.completed > 0);
  }, [internalObjectives, generalProgress]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           <div className="flex items-center gap-2 mb-2">
            <Target className="h-6 w-6" />
            <DialogTitle>{session?.learningGoal || t('endLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('endLearningSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <DialogScrollableContent>
          <div className="space-y-3">
            {internalObjectives.length === 0 ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="general-progress">{t('generalProgress')}</Label>
                  <div className="space-y-2">
                    <Slider
                      id="general-progress"
                      value={[generalProgress]}
                      onValueChange={(value) => setGeneralProgress(value[0])}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium text-primary">{generalProgress}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              internalObjectives.map((obj, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-center justify-between gap-4 p-3 rounded-lg border transition-colors",
                  obj.completed === 100 ? "bg-green-500/10 border-green-500/30" : "bg-background"
                )}
              >
                <div className="flex items-center gap-3 flex-1">
                   <Checkbox
                    id={`obj-${index}`}
                    checked={obj.completed === 100}
                    onCheckedChange={(checked) => handleCheckboxChange(index, !!checked)}
                  />
                  <Label htmlFor={`obj-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                      {obj.text}
                  </Label>
                </div>
                
                <Select
                    value={String(obj.completed)}
                    onValueChange={(value) => handleObjectiveChange(index, Number(value))}
                    disabled={obj.completed === 100}
                >
                    <SelectTrigger className="w-[90px]">
                      <SelectValue placeholder="%" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              ))
            )}
          </div>
          
          <Separator className="my-4" />

          <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
              <span className="font-semibold">{t('totalCompletion')}</span>
              <span className="text-2xl font-bold text-primary">{totalCompletion}%</span>
          </div>
        </DialogScrollableContent>

        <DialogFooter>
          <Button onClick={handleEnd} className="w-full" disabled={!hasMadeProgress}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('saveAndEnd')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
