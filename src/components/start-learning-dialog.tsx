
import { useState, useRef, useCallback, useEffect } from "react";
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
import { Brain, X as XIcon, Plus, GripVertical, Check } from "lucide-react";
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
  
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
        inputRef.current?.focus();
    }
  }, [isOpen, selectedTopics]);

  const handleStart = () => {
    if (mainGoal.trim()) {
      const finalObjectives = currentObjective.trim() ? [...objectives, currentObjective.trim()] : objectives;
      onStart(mainGoal.trim(), finalObjectives, selectedTopics);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setMainGoal("");
      setObjectives([]);
      setCurrentObjective("");
      setSelectedTopics([]);
      setInputValue("");
      setPopoverOpen(false);
    }
    onOpenChange(open);
  };
  
  const handleObjectiveKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentObjective.trim()) {
      e.preventDefault();
      setObjectives([...objectives, currentObjective.trim()]);
      setCurrentObjective("");
    }
  };

  const handleRemoveObjective = (indexToRemove: number) => {
    setObjectives(objectives.filter((_, index) => index !== indexToRemove));
  };

  const handleRemoveTopic = useCallback((topicToRemove: string) => {
    setSelectedTopics(current => current.filter((topic) => topic !== topicToRemove));
    inputRef.current?.focus();
  }, []);
  
  const handleTopicSelect = useCallback((topic: string) => {
    setInputValue("");
    const trimmedTopic = topic.trim();
    if (trimmedTopic && !selectedTopics.includes(trimmedTopic)) {
      setSelectedTopics(prev => [...prev, trimmedTopic]);
    }
    setPopoverOpen(false);
    // Focus gets handled by the useEffect
  }, [selectedTopics]);

  const handleTopicInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && inputValue === '' && selectedTopics.length > 0) {
      event.preventDefault();
      handleRemoveTopic(selectedTopics[selectedTopics.length - 1]);
    }
  };
  
  const filteredTopics = allTopics.filter(topic => 
    !selectedTopics.includes(topic) && topic.toLowerCase().includes(inputValue.toLowerCase())
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
                    className="flex flex-wrap items-center gap-2 rounded-md border border-input p-2 bg-transparent cursor-text min-h-11"
                    onClick={() => inputRef.current?.focus()}
                  >
                    {selectedTopics.map((topic) => (
                      <Badge key={topic} variant="secondary" className="pl-2 pr-1 py-1 text-sm shrink-0">
                        {topic}
                        <button
                          className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            handleRemoveTopic(topic)
                          }}
                        >
                          <XIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          <span className="sr-only">Remove {topic}</span>
                        </button>
                      </Badge>
                    ))}
                    <Command asChild>
                       <div cmdk-input-wrapper="" className="flex-1 min-w-[120px]">
                         <CommandInput
                            ref={inputRef}
                            placeholder={selectedTopics.length > 0 ? '' : t('addTopicPlaceholder')}
                            value={inputValue}
                            onValueChange={setInputValue}
                            onKeyDown={handleTopicInputKeyDown}
                            onFocus={() => setPopoverOpen(true)}
                            className="bg-transparent border-0 shadow-none h-6 p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                          />
                        </div>
                     </Command>
                  </div>
              </PopoverTrigger>
              <PopoverContent asChild className="w-[--radix-popover-trigger-width] p-0">
                 <Command>
                   <CommandList>
                    {(filteredTopics.length === 0 && !inputValue.trim()) && <CommandEmpty>{t('addTopicPlaceholder')}</CommandEmpty>}
                    
                    <CommandGroup>
                        {filteredTopics.map((topic) => (
                        <CommandItem
                            key={topic}
                            onSelect={() => handleTopicSelect(topic)}
                            className="cursor-pointer"
                        >
                             <Check className={cn("mr-2 h-4 w-4", selectedTopics.includes(topic) ? "opacity-100" : "opacity-0")} />
                            {topic}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                    
                    {inputValue.trim() && !allTopics.some(t => t.toLowerCase() === inputValue.trim().toLowerCase()) && !selectedTopics.includes(inputValue.trim()) && (
                      <CommandGroup>
                          <CommandItem
                            onSelect={() => handleTopicSelect(inputValue.trim())}
                            className="cursor-pointer"
                          >
                           <Plus className="mr-2 h-4 w-4" /> {t('add')} "{inputValue.trim()}"
                          </CommandItem>
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectives">{t('learningObjectives')}</Label>
             {objectives.length > 0 && (
                <Reorder.Group axis="y" values={objectives} onReorder={setObjectives} className="space-y-2">
                  {objectives.map((obj) => (
                    <Reorder.Item key={obj} value={obj} className="bg-background rounded-md border shadow-sm">
                      <div className="flex items-center gap-2 group p-2.5">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:opacity-100 opacity-50 transition-opacity" />
                        <span className="flex-1 text-sm">{obj}</span>
                        <button className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveObjective(objectives.indexOf(obj))}>
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

    