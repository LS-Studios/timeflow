import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";
import { CheckCircle, Circle, Edit } from "lucide-react";
import type { Session } from "@/lib/types";

interface LearningSessionDetailDialogProps {
  session: Session | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: (session: Session) => void;
}

export function LearningSessionDetailDialog({
  session,
  isOpen,
  onOpenChange,
  onEditClick,
}: LearningSessionDetailDialogProps) {
  const { t } = useTranslation();

  if (!session) return null;

  const { learningGoal, learningObjectives = [], completionPercentage } = session;

  const handleEditClick = () => {
    onEditClick(session);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{learningGoal}</DialogTitle>
          <DialogDescription>{t('learningSessionDetails')}</DialogDescription>
        </DialogHeader>
        <div className="p-4 space-y-3">
          {learningObjectives.map((obj, index) => (
            <div key={index} className="flex items-center gap-3">
              {obj.completed === 100 ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <Circle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="flex-1">{obj.text}</span>
              <Badge variant="outline">{obj.completed}%</Badge>
            </div>
          ))}
        </div>
        <hr className="border-t border-border my-4" />
        <div className="flex justify-between items-center px-4 pb-2 rounded-lg">
          <span className="font-semibold">{t('totalCompletion')}</span>
          <span className="text-xl font-bold text-primary">{completionPercentage}%</span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleEditClick}>
            <Edit className="mr-2 h-4 w-4" />
            {t('edit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}