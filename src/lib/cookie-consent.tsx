"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type ConsentState = 'pending' | 'accepted' | 'declined';

interface CookieConsentContextType {
  consentState: ConsentState;
  setAnalyticsConsent: (analyticsConsent: boolean) => void;
  hasAnalyticsConsent: () => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

const CONSENT_KEY = 'timeflow_analytics_consent';

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [consentState, setConsentState] = useState<ConsentState>('pending');

  useEffect(() => {
    // Check for existing consent on mount
    if (typeof window !== 'undefined') {
      const savedConsent = localStorage.getItem(CONSENT_KEY);
      if (savedConsent === 'accepted' || savedConsent === 'declined') {
        setConsentState(savedConsent as ConsentState);
      }
    }
  }, []);

  const setAnalyticsConsent = (analyticsConsent: boolean) => {
    const newState = analyticsConsent ? 'accepted' : 'declined';
    setConsentState(newState);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSENT_KEY, newState);
      
      // Update gtag consent mode if available
      if (typeof window.gtag === 'function') {
        window.gtag('consent', 'update', {
          analytics_storage: analyticsConsent ? 'granted' : 'denied'
        });
      }
    }
  };

  const hasAnalyticsConsent = () => {
    return consentState === 'accepted';
  };

  return (
    <CookieConsentContext.Provider 
      value={{ 
        consentState, 
        setAnalyticsConsent, 
        hasAnalyticsConsent 
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
}

// Global type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}