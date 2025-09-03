"use client";

import Link from "next/link";
import { Settings, BarChartHorizontal, User, Clock } from "lucide-react";
import { Logo } from "@/components/logo";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { usePathname } from "next/navigation";

export function MobileFooter() {
  const { t } = useTranslation();
  const { openProfileDialog, user } = useAuth();
  const pathname = usePathname();
  
  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t">
      <nav className="flex items-center justify-around h-16 px-4">
        <Link href="/" className="flex flex-col items-center gap-1">
          <Clock className={`h-5 w-5 ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>Timer</span>
        </Link>
        <Link href="/analytics" className="flex flex-col items-center gap-1">
          <BarChartHorizontal className={`h-5 w-5 ${pathname === '/analytics' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${pathname === '/analytics' ? 'text-primary' : 'text-muted-foreground'}`}>{t('analytics')}</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center gap-1">
          <Settings className={`h-5 w-5 ${pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`text-xs ${pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'}`}>{t('settings')}</span>
        </Link>
        <button onClick={openProfileDialog} className="flex flex-col items-center gap-1">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('profile')}</span>
        </button>
      </nav>
    </div>
  );
}