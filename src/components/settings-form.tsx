"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun, Trash2 } from "lucide-react";
import { useTranslation, type Language } from "@/lib/i18n";

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

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('appearance')}</CardTitle>
          <CardDescription>{t('appearanceDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="flex flex-col h-24"
            >
              <Sun className="h-6 w-6 mb-2" />
              {t('light')}
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="flex flex-col h-24"
            >
              <Moon className="h-6 w-6 mb-2" />
              {t('dark')}
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
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
            <Select onValueChange={(value: Language) => setLanguage(value)} defaultValue={language}>
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
