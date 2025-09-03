
"use client";

import Link from "next/link";
import { Settings, BarChartHorizontal, User, Clock, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-provider";
import { useSettings } from "@/lib/settings-provider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileFooter() {
  const { t } = useTranslation();
  const { openProfileDialog, user } = useAuth();
  const { settings } = useSettings();
  const pathname = usePathname();
  
  if (!user) {
    return null;
  }
  
  const NavItem = ({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) => {
    const isActive = pathname === href;
    return (
       <Link href={href} className="flex flex-col items-center gap-1">
          <Icon className={cn("h-5 w-5", isActive ? 'text-primary' : 'text-muted-foreground')} />
          <span className={cn("text-xs", isActive ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
        </Link>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t">
      <nav className={cn("flex items-center h-16 px-4", settings.isAdmin ? 'justify-between' : 'justify-around')}>
        <NavItem href="/" icon={Clock} label="Timer" />
        <NavItem href="/analytics" icon={BarChartHorizontal} label={t('analytics')} />
        {settings.isAdmin && (
           <NavItem href="/admin" icon={Shield} label="Admin" />
        )}
        <NavItem href="/settings" icon={Settings} label={t('settings')} />
        <button onClick={openProfileDialog} className="flex flex-col items-center gap-1">
          <User className="h-5 w-5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('profile')}</span>
        </button>
      </nav>
    </div>
  );
}
