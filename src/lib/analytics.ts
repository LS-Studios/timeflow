
"use client";

import { getAnalytics, logEvent, isSupported, type Analytics } from "firebase/analytics";
import { app } from "./firebase";
import type { AppMode, AppTheme } from "./types";

let analytics: Analytics | null = null;

if (typeof window !== 'undefined') {
    isSupported().then((supported) => {
        if (supported && app) {
            analytics = getAnalytics(app);
        }
    });
}

const hasConsent = (): boolean => {
  if (typeof window === 'undefined') return false;
  const consent = localStorage.getItem('timeflow_analytics_consent');
  return consent === 'accepted';
};

const track = (eventName: string, params?: { [key: string]: any }) => {
  // Check if user has given consent
  if (!hasConsent()) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics CONSENT DENIED] Event: ${eventName}`, params || '');
    }
    return;
  }

  if (!analytics) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics DISABLED] Event: ${eventName}`, params || '');
    }
    return;
  }
  logEvent(analytics, eventName, params);
};

export const analyticsService = {
  // Timer Events
  trackTimerStart: (mode: AppMode) => {
    track('timer_start', { mode });
  },
  trackTimerEnd: (mode: AppMode, durationSeconds: number) => {
    track('timer_end', {
      mode,
      duration_seconds: Math.round(durationSeconds),
    });
  },

  // Organization Events
  trackOrganizationCreated: () => {
    track('organization_created');
  },
  trackOrganizationJoined: () => {
    track('organization_join');
  },
  trackOrganizationLeft: () => {
    track('organization_leave');
  },

  // Account Events
  trackLogin: (method: 'password' | 'guest') => {
    track('login', { method });
  },
  trackSignUp: () => {
    track('sign_up');
  },
  trackAccountDeleted: () => {
    track('account_deleted');
  },

  // Feature Usage
  trackModeChanged: (newMode: AppMode) => {
    track('mode_changed', { new_mode: newMode });
  },
  trackThemeChanged: (newTheme: AppTheme) => {
    track('theme_changed', { new_theme: newTheme });
  },
  
  trackAdminModeToggled: (enabled: boolean) => {
    track('admin_mode_toggled', { enabled });
  }
};
