
import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n.tsx";
import { Brain, Check, ChevronsUpDown, X as XIcon } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";


const PREDEFINED_TOPICS = [
  { value: "react", label: "React" },
  { value: "typescript", label: "TypeScript" },
  { value: "figma", label: "Figma" },
  { value: "go", label: "Go" },
  { value: "next.js", label: "Next.js" },
  { value: "deutsch", label: "Deutsch" },
];


interface StartLearningDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onStart: (goal: string, topics: string[]) => void;
}

export function StartLearningDialog({
  isOpen,
  onOpenChange,
  onStart,
}: StartLearningDialogProps) {
  const { t } = useTranslation();
  const [goal, setGoal] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  
  // State for the combobox
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")

  const handleStart = () => {
    if (goal.trim()) {
      onStart(goal.trim(), topics);
      onOpenChange(false);
    }
  };
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setGoal("");
      setTopics([]);
      setInputValue("");
    }
    onOpenChange(open);
  }
  
  const handleTopicSelect = (currentValue: string) => {
    if(currentValue && !topics.includes(currentValue)) {
       setTopics([...topics, currentValue]);
    }
    setInputValue("")
    setOpen(false)
  }
  
  const handleTopicRemove = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-6 w-6" />
            <DialogTitle>{t('startLearningSession')}</DialogTitle>
          </div>
          <DialogDescription>
            {t('whatDidYouLearn')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="goal">{t('learningGoal')}</Label>
                <Textarea
                  id="goal"
                  placeholder={t('learningGoalPlaceholder')}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  autoFocus
                />
            </div>
            <div className="space-y-2">
                 <Label htmlFor="topics">{t('topics')}</Label>
                 <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {t('addTopics')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0">
                    <Command>
                      <CommandInput 
                        placeholder={t('searchOrAddTopic')}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && inputValue) {
                                handleTopicSelect(inputValue);
                            }
                        }}
                       />
                      <CommandList>
                        <CommandEmpty>{t('noTopicsFound')}</CommandEmpty>
                        <CommandGroup>
                          {PREDEFINED_TOPICS.map((topic) => (
                            <CommandItem
                              key={topic.value}
                              value={topic.value}
                              onSelect={handleTopicSelect}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  topics.includes(topic.value) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {topic.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {topics.map(topic => (
                             <Badge key={topic} variant="secondary" className="pl-3 pr-1 py-1 text-sm">
                                {PREDEFINED_TOPICS.find(t => t.value === topic)?.label || topic}
                                <button onClick={() => handleTopicRemove(topic)} className="ml-1.5 p-0.5 rounded-full hover:bg-background/50">
                                    <XIcon className="h-3 w-3" />
                                    <span className="sr-only">Remove {topic}</span>
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleStart} disabled={!goal.trim()}>{t('startLearning')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


