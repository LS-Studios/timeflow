
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import type { LearningObjective } from "@/lib/types";
import { Target, CheckCircle2 } from "lucide-react";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";

interface EndLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEnd: (updatedObjectives: LearningObjective[], totalCompletion: number) => void;
  objectives: LearningObjective[];
}

export function EndLearningDialog({
  isOpen,
  onOpenChange,
  onEnd,
  objectives,
}: EndLearningDialogProps) {
  const { t } = useTranslation();
  const [internalObjectives, setInternalObjectives] = useState<LearningObjective[]>([]);

  useEffect(() => {
    // When the dialog opens, initialize its internal state with the objectives from the session
    if (isOpen) {
      setInternalObjectives(objectives.map(obj => ({ ...obj })));
    }
  }, [isOpen, objectives]);

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
    if (internalObjectives.length === 0) return 0;
    const sum = internalObjectives.reduce((acc, obj) => acc + obj.completed, 0);
    return Math.round(sum / internalObjectives.length);
  }, [internalObjectives]);

  const handleEnd = () => {
    onEnd(internalObjectives, totalCompletion);
    onOpenChange(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
       // Reset state when closing without saving if needed
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           <div className="flex items-center gap-2 mb-2">
            <Target className="h-6 w-6" />
            <DialogTitle>{t('endLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('endLearningSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {internalObjectives.map((obj, index) => (
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
            ))}
        </div>
        
        <Separator />

        <div className="flex justify-between items-center p-3 rounded-lg bg-muted mt-2">
            <span className="font-semibold">{t('totalCompletion')}</span>
            <span className="text-2xl font-bold text-primary">{totalCompletion}%</span>
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={handleEnd} className="w-full">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {t('saveAndEnd')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
