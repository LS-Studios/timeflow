
import { useState, KeyboardEvent, useRef, useCallback } from "react";
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
import { Brain, X as XIcon, Plus, GripVertical } from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Reorder } from "framer-motion";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";


interface StartLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStart: (goal: string, objectives: string[], topics: string[]) => void;
  allTopics: string[];
}

export function StartLearningDialog({
  isOpen,
  onOpenChange,
  onStart,
  allTopics,
}: StartLearningDialogProps) {
  const { t } = useTranslation();
  const [mainGoal, setMainGoal] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const topicInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    if (mainGoal.trim()) {
      const finalObjectives = currentObjective.trim() ? [...objectives, currentObjective.trim()] : objectives;
      const finalTopics = topics;
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

  const handleRemoveObjective = (indexToRemove: number) => {
    setObjectives(objectives.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter((topic) => topic !== topicToRemove));
  };
  
  const handleTopicSelect = useCallback((topic: string) => {
    if (topic && !topics.includes(topic)) {
      setTopics(prev => [...prev, topic]);
    }
    setCurrentTopic("");
    setPopoverOpen(false);
    // Keep focus on the input field for seamless entry of next topic
    topicInputRef.current?.focus();
  }, [topics]);

  const handleTopicInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && event.currentTarget.value === '' && topics.length > 0) {
      event.preventDefault();
      handleRemoveTopic(topics[topics.length - 1]);
    }
  };

  const filteredTopics = allTopics.filter(topic => 
    !topics.includes(topic) && topic.toLowerCase().includes(currentTopic.toLowerCase())
  );
  

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
            <Label>{t('topics')}</Label>
             <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                 <div
                    className="flex flex-wrap items-center gap-2 rounded-md border border-input p-1 pl-2 bg-transparent cursor-text min-h-11"
                    onClick={() => topicInputRef.current?.focus()}
                >
                    {topics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="pl-2 pr-1 py-1 text-sm shrink-0">
                        {topic}
                        <button className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2" onClick={() => handleRemoveTopic(topic)}>
                          <XIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          <span className="sr-only">Remove {topic}</span>
                        </button>
                      </Badge>
                    ))}
                    <Command>
                       <CommandInput
                        ref={topicInputRef}
                        id="topics"
                        placeholder={t('addTopicPlaceholder')}
                        onFocus={() => setPopoverOpen(true)}
                        onKeyDown={handleTopicInputKeyDown}
                        value={currentTopic}
                        onValueChange={setCurrentTopic}
                        className="bg-transparent border-0 shadow-none h-8 p-1 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
                    />
                    </Command>
                </div>
              </PopoverTrigger>
              <PopoverContent asChild className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandList>
                    <CommandEmpty>
                       <CommandItem
                          onSelect={() => handleTopicSelect(currentTopic.trim())}
                          className="cursor-pointer"
                          disabled={!currentTopic.trim()}
                        >
                          {t('add')} "{currentTopic.trim()}"
                        </CommandItem>
                    </CommandEmpty>
                    {(filteredTopics.length > 0) && (
                      <CommandGroup>
                        {filteredTopics.map((topic) => (
                          <CommandItem
                            key={topic}
                            onSelect={() => handleTopicSelect(topic)}
                            className="cursor-pointer"
                          >
                            {topic}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                     <CommandGroup>
                         {currentTopic.trim() && !filteredTopics.includes(currentTopic.trim()) && !topics.includes(currentTopic.trim()) && (
                          <CommandItem
                            onSelect={() => handleTopicSelect(currentTopic.trim())}
                            className="cursor-pointer"
                          >
                           {t('add')} "{currentTopic.trim()}"
                          </CommandItem>
                        )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
             </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">{t('learningObjectives')}</Label>
             {objectives.length > 0 && (
                <Reorder.Group axis="y" values={objectives} onReorder={setObjectives} className="space-y-2">
                  {objectives.map((obj, index) => (
                    <Reorder.Item key={obj} value={obj} className="bg-background rounded-md border shadow-sm">
                      <div className="flex items-center gap-2 group p-2.5">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:opacity-100 opacity-50 transition-opacity" />
                        <span className="flex-1 text-sm">{obj}</span>
                        <button className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveObjective(index)}>
                          <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          <span className="sr-only">Remove {obj}</span>
                        </button>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
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
