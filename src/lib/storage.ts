
"use client";
import { ref, get, set } from "firebase/database";
import { db } from "./firebase";
import type { AppSettings, Session, AppMode } from "./types";

const LOCAL_SETTINGS_KEY = 'timeflow_guest_settings';
const LOCAL_SESSIONS_PREFIX = 'timeflow_guest_sessions_';
const GUEST_USER_KEY = 'timeflow_guest_user';

export interface UserAccount {
    name: string;
    email: string;
}

/**
 * An interface for a service that handles data persistence,
 * now connected to Firebase Realtime Database.
 */
interface StorageService {
    getUserAccount(userId: string): Promise<UserAccount | null>;
    saveSettings(userId: string, settings: AppSettings): Promise<void>;
    getSettings(userId: string): Promise<AppSettings | null>;
    getSessions(userId: string, mode: AppMode): Promise<Session[]>;
    saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void>;
    getAllTopics(userId: string): Promise<string[]>;
    addPendingRequest(userId: string, date: string): Promise<void>;
    getPendingRequests(userId: string): Promise<string[]>;
    getGuestUser(): { uid: string; name: string; email: string } | null;
    saveGuestUser(user: { uid: string; name: string; email: string }): void;
    clearGuestUser(): void;
}

class RealtimeDBStorageService implements StorageService {
    
    // --- Guest/Local mode functions ---
    getGuestUser() {
        if (typeof window === 'undefined') return null;
        const userJson = localStorage.getItem(GUEST_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }
    
    saveGuestUser(user: { uid: string; name: string; email: string; }) {
        if (typeof window === 'undefined') return;
        localStorage.setItem(GUEST_USER_KEY, JSON.stringify(user));
    }

    clearGuestUser() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(GUEST_USER_KEY);
        // Also clear guest data
        localStorage.removeItem(LOCAL_SETTINGS_KEY);
        localStorage.removeItem(`${LOCAL_SESSIONS_PREFIX}work`);
        localStorage.removeItem(`${LOCAL_SESSIONS_PREFIX}learning`);
    }

    private getLocalSessions(mode: AppMode): Session[] {
        if (typeof window === 'undefined') return [];
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        const sessionsJson = localStorage.getItem(key);
        if (!sessionsJson) return [];
        const parsed = JSON.parse(sessionsJson);
        // Dates are stored as ISO strings, convert them back
        return parsed.map((s: any) => ({ ...s, start: new Date(s.start), end: s.end ? new Date(s.end) : null }));
    }

    private saveLocalSessions(mode: AppMode, sessions: Session[]): void {
        if (typeof window === 'undefined') return;
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        // Store dates as ISO strings for proper JSON serialization
        const sessionsToStore = sessions.map(s => ({
          ...s,
          start: s.start.toISOString(),
          end: s.end ? s.end.toISOString() : null
        }));
        localStorage.setItem(key, JSON.stringify(sessionsToStore));
    }
    
    async getUserAccount(userId: string): Promise<UserAccount | null> {
      if (userId === 'guest') return { name: 'Guest User', email: 'guest@local.storage' };
      const snapshot = await get(ref(db, `users/${userId}/account`));
      return snapshot.exists() ? snapshot.val() : null;
    }

    async saveSettings(userId: string, settings: AppSettings): Promise<void> {
        if (userId === 'guest') {
             if (typeof window === 'undefined') return;
             localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
             return;
        }
        await set(ref(db, `users/${userId}/settings`), settings);
    }

    async getSettings(userId: string): Promise<AppSettings | null> {
         if (userId === 'guest') {
            if (typeof window === 'undefined') return null;
            const settingsJson = localStorage.getItem(LOCAL_SETTINGS_KEY);
            return settingsJson ? JSON.parse(settingsJson) : null;
        }
        const snapshot = await get(ref(db, `users/${userId}/settings`));
        return snapshot.exists() ? snapshot.val() : null;
    }
    
    async getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        if (userId === 'guest') {
            return this.getLocalSessions(mode);
        }
        const snapshot = await get(ref(db, `users/${userId}/${mode}Sessions`));
        if (snapshot.exists()) {
            const sessions = snapshot.val();
            // Dates are stored as ISO strings, convert them back
            return sessions.map((s: any) => ({
                ...s,
                start: new Date(s.start),
                end: s.end ? new Date(s.end) : null,
            }));
        }
        return [];
    }

    async saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void> {
        if (userId === 'guest') {
            this.saveLocalSessions(mode, sessions);
            return;
        }
        // Store dates as ISO strings for proper JSON serialization
        const sessionsToStore = sessions.map(s => ({
          ...s,
          start: s.start.toISOString(),
          end: s.end ? s.end.toISOString() : null
        }));
        await set(ref(db, `users/${userId}/${mode}Sessions`), sessionsToStore);
    }

    async getAllTopics(userId: string): Promise<string[]> {
        const workSessions = await this.getSessions(userId, 'work');
        const learningSessions = await this.getSessions(userId, 'learning');
        const allSessions = [...workSessions, ...learningSessions];
        const topics = new Set<string>();
        allSessions.forEach(session => {
            if (session.topics) {
                session.topics.forEach(topic => topics.add(topic));
            }
        });
        return Array.from(topics);
    }
    
    async addPendingRequest(userId: string, date: string): Promise<void> {
         if (userId === 'guest') return; // Not applicable for guest
         const dataRef = ref(db, `users/${userId}/pendingRequests`);
         const snapshot = await get(dataRef);
         const currentRequests = snapshot.exists() ? snapshot.val() : [];
         if (!currentRequests.includes(date)) {
             await set(dataRef, [...currentRequests, date]);
         }
    }

    async getPendingRequests(userId: string): Promise<string[]> {
        if (userId === 'guest') return []; // Not applicable for guest
        const snapshot = await get(ref(db, `users/${userId}/pendingRequests`));
        return snapshot.exists() ? snapshot.val() : [];
    }
}

// Export a singleton instance of the service
export const storageService = new RealtimeDBStorageService();
