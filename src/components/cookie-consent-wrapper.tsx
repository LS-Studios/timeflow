"use client";

import React from 'react';
import { CookieConsentProvider, useCookieConsent } from '@/lib/cookie-consent';
import { CookieModal } from './cookie-banner';

function CookieModalContainer() {
  const { consentState, setAnalyticsConsent } = useCookieConsent();

  const handleSave = (analyticsConsent: boolean) => {
    setAnalyticsConsent(analyticsConsent);
  };

  return (
    <CookieModal
      onSave={handleSave}
      isVisible={consentState === 'pending'}
    />
  );
}

export function CookieConsentWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      {children}
      <CookieModalContainer />
    </CookieConsentProvider>
  );
}