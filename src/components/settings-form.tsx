
"use client";

import { Monitor, Moon, Sun, Trash2, Brain, Briefcase } from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n.tsx";
import { useSettings } from "@/lib/settings-provider";
import type { AppMode } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export function SettingsForm() {
  const { t } = useTranslation();
  const { settings, setMode, setLanguage, setTheme, setWorkGoals } = useSettings();
  
  const appModeOptions = [
    { id: "work", label: t('modeWork'), icon: Briefcase },
    { id: "learning", label: t('modeLearning'), icon: Brain },
  ]

  const handleDailyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    setWorkGoals({ dailyGoal: isNaN(value) ? undefined : value });
  };
  
  const handleWeeklyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.valueAsNumber;
    setWorkGoals({ weeklyGoal: isNaN(value) ? undefined : value });
  };


  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>{t('appMode')}</CardTitle>
          <CardDescription>{t('appModeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
           <RadioGroup value={settings.mode} onValueChange={(value: AppMode) => setMode(value)} className="grid grid-cols-2 gap-4">
              {appModeOptions.map((option) => (
                <Label
                  key={option.id}
                  htmlFor={option.id}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-md border-2 p-4 cursor-pointer transition-colors hover:border-primary h-28",
                    settings.mode === option.id && "border-primary bg-primary/5"
                  )}
                >
                  <RadioGroupItem value={option.id} id={option.id} className="sr-only" />
                  <option.icon className="h-8 w-8 text-muted-foreground" />
                  <span className="font-semibold text-center">{option.label}</span>
                </Label>
              ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      {settings.mode === 'work' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('workGoals')}</CardTitle>
            <CardDescription>{t('workGoalsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="daily-goal">{t('dailyGoal')}</Label>
              <Input 
                id="daily-goal" 
                type="number" 
                value={settings.dailyGoal || ''}
                onChange={handleDailyGoalChange}
                className="w-24" 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="weekly-goal">{t('weeklyGoal')}</Label>
              <Input 
                id="weekly-goal" 
                type="number" 
                value={settings.weeklyGoal || ''}
                onChange={handleWeeklyGoalChange}
                className="w-24" 
              />
            </div>
          </CardContent>
        </Card>
      )}


      <Card>
        <CardHeader>
          <CardTitle>{t('appearance')}</CardTitle>
          <CardDescription>{t('appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={settings.theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="flex flex-col h-24"
            >
              <Sun className="h-6 w-6 mb-2" />
              {t('light')}
            </Button>
            <Button
              variant={settings.theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="flex flex-col h-24"
            >
              <Moon className="h-6 w-6 mb-2" />
              {t('dark')}
            </Button>
            <Button
              variant={settings.theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
              className="flex flex-col h-24"
            >
              <Monitor className="h-6 w-6 mb-2" />
              {t('system')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('language')}</CardTitle>
          <CardDescription>{t('languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
            <Select onValueChange={(value: Language) => setLanguage(value)} defaultValue={settings.language}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('selectLanguage')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
          <CardDescription>{t('dangerZoneDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deleteAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('deleteAccountConfirmation')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => console.log("Account deleted!")}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {t('confirmDelete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
