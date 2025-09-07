"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogScrollableContent,
} from '@/components/ui/dialog';
import { Cookie, Shield, BarChart3 } from 'lucide-react';

interface CookieModalProps {
  onSave: (analyticsConsent: boolean) => void;
  isVisible: boolean;
}

export function CookieModal({ onSave, isVisible }: CookieModalProps) {
  const [analyticsConsent, setAnalyticsConsent] = useState(true);

  const handleSave = () => {
    onSave(analyticsConsent);
  };

  return (
    <Dialog open={isVisible}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie-Einstellungen
          </DialogTitle>
          <DialogDescription>
            Wir verwenden Cookies, um Ihnen die beste Erfahrung zu bieten. 
            Bitte wählen Sie Ihre Präferenzen aus.
          </DialogDescription>
        </DialogHeader>
        
        <DialogScrollableContent>
          <div className="space-y-6">
            {/* Notwendige Cookies */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Notwendige Cookies</h3>
                    <Checkbox checked disabled className="opacity-60" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Diese Cookies sind für die Kontoerstellung und Authentifizierung mit Firebase erforderlich. 
                    Sie können nicht deaktiviert werden, da sie für das ordnungsgemäße Funktionieren der 
                    Website unerlässlich sind.
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Analytics Cookies (optional)</h3>
                    <Checkbox 
                      checked={analyticsConsent}
                      onCheckedChange={(checked) => setAnalyticsConsent(checked as boolean)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Diese Cookies helfen uns dabei, die Nutzung unserer Website zu verstehen und zu verbessern. 
                    Wir verwenden Google Analytics, um anonymisierte Statistiken zu sammeln.
                  </p>
                </div>
              </div>
            </div>

            {/* Datenschutz Link */}
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Weitere Informationen finden Sie in unserer{' '}
                <a 
                  href="https://inter-leshift.de/timeflow/datenschutz" 
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Datenschutzerklärung
                </a>.
              </p>
            </div>
          </div>
        </DialogScrollableContent>
        
        <DialogFooter>
          <Button onClick={handleSave} className="w-full">
            Einstellungen speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}