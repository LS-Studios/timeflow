import { SettingsForm } from "@/components/settings-form";
import { useTranslation } from "@/lib/i18n";

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-2">{t('settings')}</h1>
      <p className="text-muted-foreground mb-8">
        {t('settingsDescription')}
      </p>
      <SettingsForm />
    </div>
  );
}
