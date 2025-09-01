
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
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "@/lib/i18n.tsx";
import { Target } from "lucide-react";

interface EndLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onEnd: (completionPercentage: number) => void;
}

export function EndLearningDialog({
  isOpen,
  onOpenChange,
  onEnd,
}: EndLearningDialogProps) {
  const { t } = useTranslation();
  const [completion, setCompletion] = useState(50);

  const handleEnd = () => {
    onEnd(completion);
    onOpenChange(false);
  };
  
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCompletion(50);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
           <div className="flex items-center gap-2 mb-2">
            <Target className="h-6 w-6" />
            <DialogTitle>{t('endLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('endLearningSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{t('completionRate')}</span>
                <span className="font-bold text-lg">{completion}%</span>
            </div>
            <Slider
              value={[completion]}
              onValueChange={(value) => setCompletion(value[0])}
              max={100}
              step={10}
            />
        </div>
        <DialogFooter>
          <Button onClick={handleEnd}>{t('saveAndEnd')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
