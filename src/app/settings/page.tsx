
"use client";

import { SettingsForm } from "@/components/settings-form";
import { useSettings } from "@/lib/settings-provider";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isLoaded } = useSettings();

  const SettingsSkeleton = () => (
     <div className="grid gap-6">
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
          <CardContent className="grid grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
          <CardContent><Skeleton className="h-10 w-[180px]" /></CardContent>
        </Card>
         <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardHeader>
          <CardContent><Skeleton className="h-10 w-48" /></CardContent>
        </Card>
     </div>
  )

  return (
    <div className="container max-w-2xl py-8 mx-auto px-4 sm:px-0">
      <h1 className="text-2xl font-bold mb-2">{t('settings')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('settingsDescription')}
      </p>
      
      {!isLoaded ? <SettingsSkeleton /> : <SettingsForm />}
    </div>
  );
}
