
"use client";

import Link from "next/link";
import { Settings, BarChartHorizontal, User, Shield } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-provider";
import { useSettings } from "@/lib/settings-provider";
import { useTranslation } from "@/lib/i18n";

export function Header() {
  const { openProfileDialog, user } = useAuth();
  const { settings } = useSettings();
  const { t } = useTranslation();
  
  if (!user) {
    // Render a skeleton or minimal header when logged out
    return (
       <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex-1 flex justify-center md:justify-start">
            <Link href="/" className="flex items-center justify-center md:justify-start space-x-2">
              <Logo />
            </Link>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex-1 flex justify-center md:justify-start">
          <Link href="/" className="flex items-center justify-center md:justify-start space-x-2">
            <Logo />
          </Link>
        </div>
        <div className="hidden md:flex flex-1 items-center justify-end">
          {/* Desktop Navigation */}
          <nav className="flex items-center space-x-1">
            <Link href="/analytics">
              <Button variant="ghost" className="gap-2" aria-label={t('analytics')}>
                <BarChartHorizontal className="h-5 w-5" />
                <span className="hidden lg:inline">{t('analytics')}</span>
              </Button>
            </Link>
            {settings.isAdmin && (
              <Link href="/admin">
                <Button variant="ghost" className="gap-2" aria-label="Admin Panel">
                  <Shield className="h-5 w-5" />
                  <span className="hidden lg:inline">Admin</span>
                </Button>
              </Link>
            )}
            <Link href="/settings">
              <Button variant="ghost" className="gap-2" aria-label={t('settings')}>
                <Settings className="h-5 w-5" />
                <span className="hidden lg:inline">{t('settings')}</span>
              </Button>
            </Link>
            <Button variant="ghost" className="gap-2" aria-label={t('profile')} onClick={openProfileDialog}>
              <User className="h-5 w-5" />
              <span className="hidden lg:inline">{t('profile')}</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
