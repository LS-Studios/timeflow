
import { useState, KeyboardEvent, useRef } from "react";
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
import { Brain, X as XIcon, Plus, Hash, ListOrdered } from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface StartLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStart: (goal: string, objectives: string[], topics: string[]) => void;
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
  const [topics, setTopics] = useState<string[]>([]);
  const [currentTopic, setCurrentTopic] = useState("");

  const topicInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    if (mainGoal.trim()) {
      const finalObjectives = currentObjective.trim() ? [...objectives, currentObjective.trim()] : objectives;
      const finalTopics = currentTopic.trim() ? [...topics, currentTopic.trim()] : topics;
      onStart(mainGoal.trim(), finalObjectives, finalTopics);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMainGoal("");
      setObjectives([]);
      setCurrentObjective("");
      setTopics([]);
      setCurrentTopic("");
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

  const handleTopicKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTopic.trim()) {
      e.preventDefault();
      setTopics([...topics, currentTopic.trim()]);
      setCurrentTopic("");
    }
  };

  const handleRemoveObjective = (indexToRemove: number) => {
    setObjectives(objectives.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveTopic = (indexToRemove: number) => {
    setTopics(topics.filter((_, index) => index !== indexToRemove));
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
          
          <div className="space-y-2">
            <Label htmlFor="topics">{t('topics')}</Label>
            <div 
              className="flex flex-wrap items-center gap-2 rounded-md border border-input p-2 bg-background cursor-text"
              onClick={() => topicInputRef.current?.focus()}
            >
                {topics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 text-sm shrink-0">
                    <Hash className="h-3 w-3 mr-1" />
                    {topic}
                    <button className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => handleRemoveTopic(index)}>
                      <XIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      <span className="sr-only">Remove {topic}</span>
                    </button>
                  </Badge>
                ))}
              <Input
                ref={topicInputRef}
                id="topics"
                placeholder={t('addTopicPlaceholder')}
                value={currentTopic}
                onChange={(e) => setCurrentTopic(e.target.value)}
                onKeyDown={handleTopicKeyDown}
                className="flex-1 bg-transparent border-0 shadow-none h-8 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">{t('learningObjectives')}</Label>
             {objectives.length > 0 && (
                <div className="space-y-2 rounded-md border p-3 bg-muted/50">
                  {objectives.map((obj, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <ListOrdered className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm">{obj}</span>
                      <button className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveObjective(index)}>
                        <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        <span className="sr-only">Remove {obj}</span>
                      </button>
                    </div>
                  ))}
                </div>
            )}
            <Input
              id="objectives"
              placeholder={t('addObjectivePlaceholder')}
              value={currentObjective}
              onChange={(e) => setCurrentObjective(e.target.value)}
              onKeyDown={handleObjectiveKeyDown}
            />
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

