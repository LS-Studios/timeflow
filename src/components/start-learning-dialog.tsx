
"use client";

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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-provider";
import { storageService } from "@/lib/storage";

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
  const { user } = useAuth();
  const [mainGoal, setMainGoal] = useState("");
  const [objectives, setObjectives] = useState<string[]>([]);
  const [currentObjective, setCurrentObjective] = useState("");
  
  const [inputValue, setInputValue] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);


  const handleStart = () => {
    if (mainGoal.trim()) {
      const finalObjectives = currentObjective.trim() ? [...objectives, currentObjective.trim()] : objectives;
      onStart(mainGoal.trim(), finalObjectives, selectedTopics);
      onOpenChange(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setMainGoal("");
      setObjectives([]);
      setCurrentObjective("");
      setSelectedTopics([]);
      setInputValue("");
      setPopoverOpen(false);
      setActiveIndex(0);
    }
  }, [isOpen]);

  const filteredTopics = allTopics.filter(
    (topic) =>
      !selectedTopics.includes(topic) &&
      topic.toLowerCase().includes(inputValue.toLowerCase())
  );
  
  const canAddNewTopic = inputValue && !allTopics.includes(inputValue) && !selectedTopics.includes(inputValue);
  const suggestions = canAddNewTopic ? [`add_new_${inputValue}`, ...filteredTopics] : filteredTopics;

  useEffect(() => {
    setActiveIndex(0);
  }, [inputValue]);
  
  useEffect(() => {
    if (isOpen && selectedTopics.length > 0) {
        inputRef.current?.focus();
    }
  }, [selectedTopics, isOpen]);

  const handleTopicSelect = useCallback((topic: string) => {
    const newTopic = topic.startsWith("add_new_") ? topic.replace("add_new_", "") : topic;
    if (newTopic && !selectedTopics.includes(newTopic)) {
        setSelectedTopics((prev) => [...prev, newTopic]);
    }
    setInputValue("");
    setActiveIndex(0);
    setPopoverOpen(false);
  }, [selectedTopics]);
  
  useEffect(() => {
    if(!isPopoverOpen) {
      // Timeout to allow state update before refocusing
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isPopoverOpen]);

  const handleRemoveTopic = (topic: string) => {
    setSelectedTopics(selectedTopics.filter((t) => t !== topic));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && inputValue === "" && selectedTopics.length > 0) {
      handleRemoveTopic(selectedTopics[selectedTopics.length - 1]);
      return;
    } 
    
    if (!isPopoverOpen) {
        if(inputValue) setPopoverOpen(true);
        return;
    }
    
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (suggestions[activeIndex]) {
          handleTopicSelect(suggestions[activeIndex]);
        }
      } else if (e.key === "Escape") {
        setPopoverOpen(false);
      }
    }
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


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
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
            <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                 <div
                  ref={containerRef}
                  onClick={() => {
                    setPopoverOpen(true)
                    inputRef.current?.focus()
                  }}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-input p-2 bg-transparent cursor-text min-h-11"
                >
                  {selectedTopics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="pl-2 pr-1 py-1 text-sm shrink-0">
                      {topic}
                      <button
                        className="ml-1.5 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); handleRemoveTopic(topic); }}
                      >
                        <XIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        <span className="sr-only">Remove {topic}</span>
                      </button>
                    </Badge>
                  ))}
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (!isPopoverOpen && e.target.value) setPopoverOpen(true);
                       if (isPopoverOpen && !e.target.value) setPopoverOpen(false);
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {if(inputValue) setPopoverOpen(true)}}
                    placeholder={t('addTopicPlaceholder')}
                    className="bg-transparent border-0 shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm flex-1 h-auto min-w-[120px]"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent 
                  className="w-[--radix-popover-trigger-width] p-0"
                  onOpenAutoFocus={(e) => e.preventDefault()}
              >
                  {isPopoverOpen && suggestions.length > 0 && (
                      <ul className="p-1">
                          {suggestions.map((topic, index) => {
                              const isNew = topic.startsWith("add_new_");
                              const displayText = isNew ? topic.replace("add_new_", "") : topic;
                              const isSelected = selectedTopics.includes(displayText);

                              return (
                              <li
                                  key={topic}
                                  onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleTopicSelect(topic);
                                  }}
                                  className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded-sm",
                                      index === activeIndex && "bg-accent"
                                  )}
                              >
                                  {isNew ? <Plus className="h-4 w-4" /> : <Check className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")} />}
                                  <span>{isNew ? `${t('add')} "${displayText}"` : displayText}</span>
                              </li>
                              );
                           })}
                      </ul>
                  )}
                  {isPopoverOpen && suggestions.length === 0 && inputValue && (
                       <div className="px-3 py-1.5 text-sm text-muted-foreground">{t('noResults')}</div>
                  )}
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
