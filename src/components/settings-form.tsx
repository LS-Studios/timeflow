
"use client";

import React, { useState } from 'react';
import { Monitor, Moon, Sun, Trash2, Brain, Briefcase, Building, KeyRound, AlertTriangle } from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n.tsx";
import { useSettings } from "@/lib/settings-provider";
import { useAuth } from "@/lib/auth-provider";
import type { AppMode } from "@/lib/types";
import { useToast } from '@/hooks/use-toast';

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { OrganizationDialog } from "./organization-dialog";
import { storageService } from '@/lib/storage';
import { set } from 'date-fns';

export function SettingsForm() {
  const { t } = useTranslation();
  const { settings, setMode, setTheme, setLanguage, setWorkGoals, setOrganization, setIsAdmin, timerIsActive, updateSettings } = useSettings();
  const { user, deleteAccount } = useAuth();
  const { toast } = useToast();
  const [isModeChangeDialogOpen, setModeChangeDialogOpen] = useState(false);
  const [targetMode, setTargetMode] = useState<AppMode | null>(null);
  const [isOrganizationDialogOpen, setOrganizationDialogOpen] = useState(false);
  
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const appModeOptions = [
    { id: "work", label: t('modeWork'), icon: Briefcase },
    { id: "learning", label: t('modeLearning'), icon: Brain },
  ]

  const handleModeChangeRequest = (newMode: AppMode) => {
    if (newMode === settings.mode) return;

    if (timerIsActive) {
      setTargetMode(newMode);
      setModeChangeDialogOpen(true);
    } else {
      setMode(newMode);
    }
  }

  const confirmModeChange = () => {
    if(targetMode) {
      setMode(targetMode);
    }
    setModeChangeDialogOpen(false);
    setTargetMode(null);
  }

  const handleDailyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    setWorkGoals({ dailyGoal: isNaN(numericValue) ? settings.dailyGoal : numericValue });
  };
  
  const handleWeeklyGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value === '' ? 0 : parseInt(value, 10);
    setWorkGoals({ weeklyGoal: isNaN(numericValue) ? settings.weeklyGoal : numericValue });
  };

  const isGuest = user?.uid === 'guest';
  
  const handleLeaveOrganization = async () => {
    if (!user || !settings.organizationSerialNumber) return;
    await storageService.leaveOrganization(user.uid, settings.organizationSerialNumber);
    updateSettings({ organizationName: null, organizationSerialNumber: null });
  };
  
  const handleDeleteAccount = async () => {
      if (!deletePassword) {
        setDeleteError("Please enter your password.");
        return;
      }
      setIsDeleting(true);
      setDeleteError(null);
      const result = await deleteAccount(deletePassword);
      if (!result.success) {
          setDeleteError(t(result.message));
          setIsDeleting(false);
      }
      // On success, auth provider will handle logout and page reload, no need to setIsDeleting(false).
  }
  
  const onOpenDeleteDialog = (open: boolean) => {
    if(!open) {
      setDeletePassword("");
      setDeleteError(null);
      setIsDeleting(false);
    }
  }


  return (
    <>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('appMode')}</CardTitle>
            <CardDescription>{t('appModeDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={settings.mode} onValueChange={(value: AppMode) => handleModeChangeRequest(value)} className="grid grid-cols-2 gap-4">
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
                    value={settings.dailyGoal ?? ''}
                    onChange={handleDailyGoalChange}
                    className="w-24"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-goal">{t('weeklyGoal')}</Label>
                  <Input 
                    id="weekly-goal" 
                    type="number" 
                    value={settings.weeklyGoal ?? ''}
                    onChange={handleWeeklyGoalChange}
                    className="w-24"
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>
        )}

        {!settings.isAdmin && (
          <Card>
              <CardHeader>
                <CardTitle>{t('organization')}</CardTitle>
                <CardDescription>{t('organizationDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <Building className="h-5 w-5 text-muted-foreground" />
                   <span className="text-sm font-medium">
                     {isGuest ? t('noOrganization') : settings.organizationName || t('noOrganization')}
                   </span>
                </div>
                <Button variant="outline" onClick={() => setOrganizationDialogOpen(true)} disabled={isGuest}>
                  {settings.organizationName ? t('manage') : t('join')}
                </Button>
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

        <Card>
          <CardHeader>
            <CardTitle>{t('adminSettings')}</CardTitle>
            <CardDescription>{t('adminSettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="admin-toggle"
                checked={settings.isAdmin || false}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="rounded border-gray-300"
                disabled={isGuest}
              />
              <Label htmlFor="admin-toggle">{t('enableAdminMode')}</Label>
            </div>
          </CardContent>
        </Card>

        <Card className="md:hidden">
          <CardHeader>
            <CardTitle>Legal</CardTitle>
            <CardDescription>Legal information and policies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-2">
              <a 
                href="https://leshift.de/impressum" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Impressum
              </a>
              <a 
                href="https://leshift.de/datenschutz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Datenschutz
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">{t('dangerZone')}</CardTitle>
            <CardDescription>{t('dangerZoneDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog onOpenChange={onOpenDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isGuest}>
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
                <div className="p-2 space-y-4">
                   <div className="space-y-2">
                     <Label htmlFor="password">{t('password')}</Label>
                     <div className="relative">
                       <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="pl-9"
                        />
                     </div>
                   </div>
                   {deleteError && (
                      <Alert variant="destructive">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <AlertDescription>{deleteError}</AlertDescription>
                        </div>
                      </Alert>
                    )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword || isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? t('deleting') : t('confirmDelete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={isModeChangeDialogOpen} onOpenChange={setModeChangeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('modeChangeWarning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTargetMode(null)}>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmModeChange}>
              {t('confirmModeChange')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {!isGuest && user && (
        <OrganizationDialog
          isOpen={isOrganizationDialogOpen}
          onOpenChange={setOrganizationDialogOpen}
          currentOrganization={settings.organizationName}
          onJoin={async (serialNumber) => {
            const org = await storageService.getOrganization(serialNumber);
            if (org) {
              const success = await storageService.joinOrganization(user.uid, serialNumber);
              if (success) {
                updateSettings({ 
                    organizationName: org.name, 
                    organizationSerialNumber: serialNumber 
                });
                return true;
              }
            }
            return false;
          }}
          onLeave={handleLeaveOrganization}
        />
      )}
    </>
  );
}

    