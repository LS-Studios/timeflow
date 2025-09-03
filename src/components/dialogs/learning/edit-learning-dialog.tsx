
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { Target, CheckCircle2, Brain, X as XIcon, Plus, GripVertical, Check, Save } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Reorder } from "framer-motion";
import { useAuth } from "@/lib/auth-provider";
import { storageService } from "@/lib/storage";

interface EditLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (updatedSession: Session) => void;
  session: Session | null;
  allTopics: string[];
}

export function EditLearningDialog({
  isOpen,
  onOpenChange,
  onSave,
  session,
  allTopics,
}: EditLearningDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [mainGoal, setMainGoal] = useState("");
  const [objectives, setObjectives] = useState<LearningObjective[]>([]);
  const [currentObjective, setCurrentObjective] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  
  const [topicInputValue, setTopicInputValue] = useState("");
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const topicInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && session) {
      setMainGoal(session.learningGoal || "");
      setObjectives(session.learningObjectives?.map(obj => ({ ...obj })) || []);
      setTopics(session.topics || []);
    } else {
        // Reset state when closed
        setMainGoal("");
        setObjectives([]);
        setCurrentObjective("");
        setTopics([]);
        setTopicInputValue("");
    }
  }, [isOpen, session]);

  const totalCompletion = useMemo(() => {
    if (objectives.length === 0) return 0;
    const sum = objectives.reduce((acc, obj) => acc + obj.completed, 0);
    return Math.round(sum / objectives.length);
  }, [objectives]);

  const handleSave = () => {
    if (!session) return;
    
    let finalObjectives = [...objectives];
    if (currentObjective.trim()) {
        finalObjectives.push({ text: currentObjective.trim(), completed: 0 });
    }

    const updatedSession: Session = {
        ...session,
        learningGoal: mainGoal,
        learningObjectives: finalObjectives,
        topics: topics,
        completionPercentage: totalCompletion,
    };
    onSave(updatedSession);
  };
  
  const handleObjectiveCompletionChange = (index: number, completion: number) => {
    const newObjectives = [...objectives];
    newObjectives[index].completed = completion;
    setObjectives(newObjectives);
  };

  const handleObjectiveTextChange = (index: number, text: string) => {
    const newObjectives = [...objectives];
    newObjectives[index].text = text;
    setObjectives(newObjectives);
  };
  
  const handleAddObjective = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentObjective.trim()) {
      e.preventDefault();
      setObjectives([...objectives, { text: currentObjective.trim(), completed: 0 }]);
      setCurrentObjective("");
    }
  };

  const handleRemoveObjective = (indexToRemove: number) => {
    setObjectives(objectives.filter((_, index) => index !== indexToRemove));
  };
  
  // Topic Management Logic (from StartLearningDialog)
  const filteredTopics = allTopics.filter(
    (topic) => !topics.includes(topic) && topic.toLowerCase().includes(topicInputValue.toLowerCase())
  );
  const canAddNewTopic = topicInputValue && !allTopics.includes(topicInputValue) && !topics.includes(topicInputValue);
  const suggestions = canAddNewTopic ? [`add_new_${topicInputValue}`, ...filteredTopics] : filteredTopics;

  const handleTopicSelect = useCallback((topic: string) => {
    const newTopic = topic.startsWith("add_new_") ? topic.replace("add_new_", "") : topic;
    if (newTopic && !topics.includes(newTopic)) {
        setTopics((prev) => [...prev, newTopic]);
    }
    setTopicInputValue("");
    setPopoverOpen(false);
  }, [topics]);

  const handleRemoveTopic = (topic: string) => {
    setTopics(topics.filter((t) => t !== topic));
  };
   
  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && topicInputValue === "" && topics.length > 0) {
      handleRemoveTopic(topics[topics.length - 1]);
      return;
    }
    if (!isPopoverOpen) { if(topicInputValue) setPopoverOpen(true); return; }
    if (suggestions.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((prev) => (prev + 1) % suggestions.length); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length); }
      else if (e.key === "Enter") { e.preventDefault(); if (suggestions[activeIndex]) { handleTopicSelect(suggestions[activeIndex]); } }
      else if (e.key === "Escape") { setPopoverOpen(false); }
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
           <div className="flex items-center gap-2 mb-2">
            <Brain className="h-6 w-6" />
            <DialogTitle>{t('editLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('editLearningSessionDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 p-4 max-h-[60vh] overflow-y-auto">
           <div className="space-y-2">
                <Label htmlFor="goal">{t('learningGoal')}</Label>
                <Input
                id="goal"
                placeholder={t('learningGoalPlaceholder')}
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                />
            </div>
            
            <div className="space-y-2">
                <Label>{t('topics')}</Label>
                <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <div onClick={() => { setPopoverOpen(true); topicInputRef.current?.focus(); }} className="flex flex-wrap items-center gap-2 rounded-md border border-input p-2 bg-transparent cursor-text min-h-11">
                    {topics.map((topic) => (
                        <Badge key={topic} variant="secondary" className="pl-2 pr-1 py-1 text-sm shrink-0">
                        {topic}
                        <button className="ml-1.5 rounded-full outline-none" onMouseDown={(e) => e.preventDefault()} onClick={(e) => { e.stopPropagation(); handleRemoveTopic(topic); }}>
                            <XIcon className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                        </Badge>
                    ))}
                    <Input
                        ref={topicInputRef}
                        value={topicInputValue}
                        onChange={(e) => { setTopicInputValue(e.target.value); if (!isPopoverOpen && e.target.value) setPopoverOpen(true); if (isPopoverOpen && !e.target.value) setPopoverOpen(false); }}
                        onKeyDown={handleTopicKeyDown}
                        onFocus={() => {if(topicInputValue) setPopoverOpen(true)}}
                        placeholder={t('addTopicPlaceholder')}
                        className="bg-transparent border-0 shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm flex-1 h-auto min-w-[120px]"
                    />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
                    {isPopoverOpen && suggestions.length > 0 && (
                        <ul className="p-1">
                            {suggestions.map((topic, index) => (
                            <li key={topic} onMouseDown={(e) => { e.preventDefault(); handleTopicSelect(topic); }} className={cn("flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer rounded-sm", index === activeIndex && "bg-accent")}>
                                {topic.startsWith("add_new_") ? <Plus className="h-4 w-4" /> : <Check className={cn("h-4 w-4", topics.includes(topic) ? "opacity-100" : "opacity-0")} />}
                                <span>{topic.startsWith("add_new_") ? `${t('add')} "${topic.replace("add_new_", "")}"` : topic}</span>
                            </li>
                            ))}
                        </ul>
                    )}
                </PopoverContent>
                </Popover>
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="objectives">{t('learningObjectives')}</Label>
                <Reorder.Group axis="y" values={objectives} onReorder={setObjectives} className="space-y-2">
                {objectives.map((obj, index) => (
                    <Reorder.Item key={obj.text + index} value={obj} className={cn("flex items-center justify-between gap-4 p-2 rounded-lg border group", obj.completed === 100 ? "bg-green-500/10 border-green-500/30" : "bg-background")}>
                        <div className="flex items-center gap-3 flex-1">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab group-hover:opacity-100 opacity-50 transition-opacity" />
                            <Input value={obj.text} onChange={e => handleObjectiveTextChange(index, e.target.value)} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"/>
                        </div>
                        <Select value={String(obj.completed)} onValueChange={(value) => handleObjectiveCompletionChange(index, Number(value))}>
                            <SelectTrigger className="w-[90px]"><SelectValue placeholder="%" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">0%</SelectItem><SelectItem value="25">25%</SelectItem><SelectItem value="50">50%</SelectItem><SelectItem value="75">75%</SelectItem><SelectItem value="100">100%</SelectItem>
                            </SelectContent>
                        </Select>
                        <button className="rounded-full outline-none opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveObjective(index)}>
                            <XIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    </Reorder.Item>
                ))}
                </Reorder.Group>
                <Input id="objectives" placeholder={t('addObjectivePlaceholder')} value={currentObjective} onChange={(e) => setCurrentObjective(e.target.value)} onKeyDown={handleAddObjective} />
            </div>
        </div>
        
        <Separator />

        <div className="flex justify-between items-center pt-4 px-4 rounded-lg">
            <span className="font-semibold">{t('totalCompletion')}</span>
            <span className="text-2xl font-bold text-primary">{totalCompletion}%</span>
        </div>

        <DialogFooter className="mt-2">
          <Button onClick={handleSave} className="w-full" disabled={!mainGoal.trim()}>
            <Save className="mr-2 h-4 w-4" />
            {t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
