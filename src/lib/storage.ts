
"use client";
import type { AppSettings, Session, AppMode } from "./types";

const SETTINGS_KEY = 'timeflow_settings';
const WORK_SESSIONS_KEY = 'timeflow_work_sessions';
const LEARNING_SESSIONS_KEY = 'timeflow_learning_sessions';

/**
 * An interface for a service that handles data persistence.
 */
interface StorageService {
    saveSettings(settings: AppSettings): void;
    getSettings(): AppSettings | null;
    
    // Mode-dependent session storage
    getSessions(mode: AppMode): Session[];
    saveSessions(mode: AppMode, sessions: Session[]): void;
    
    // Derived data getters
    getAllTopics(): string[];
    
    // Utility
    clearAllHistory(): void;
}

/**
 * A service that uses the browser's localStorage for persistence.
 */
class LocalStorageService implements StorageService {
    
    private isLocalStorageAvailable(): boolean {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    saveSettings(settings: AppSettings): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    getSettings(): AppSettings | null {
        if (!this.isLocalStorageAvailable()) return null;
        const settingsJson = localStorage.getItem(SETTINGS_KEY);
        return settingsJson ? JSON.parse(settingsJson) : null;
    }
    
    getSessions(mode: AppMode): Session[] {
        if (!this.isLocalStorageAvailable()) return [];
        const key = mode === 'work' ? WORK_SESSIONS_KEY : LEARNING_SESSIONS_KEY;
        const sessionsJson = localStorage.getItem(key);
        if (!sessionsJson) return [];
        
        const parsed = JSON.parse(sessionsJson);
        // Ensure dates are parsed correctly from ISO strings
        return parsed.map((s: any) => ({
            ...s,
            start: new Date(s.start),
            end: s.end ? new Date(s.end) : null
        }));
    }

    saveSessions(mode: AppMode, sessions: Session[]): void {
        if (!this.isLocalStorageAvailable()) return;
        const key = mode === 'work' ? WORK_SESSIONS_KEY : LEARNING_SESSIONS_KEY;
        localStorage.setItem(key, JSON.stringify(sessions));
    }

    getAllTopics(): string[] {
        const workSessions = this.getSessions('work');
        const learningSessions = this.getSessions('learning');
        const allSessions = [...workSessions, ...learningSessions];

        const topics = new Set<string>();
        allSessions.forEach(session => {
            if (session.topics) {
                session.topics.forEach(topic => topics.add(topic));
            }
        });
        return Array.from(topics);
    }

    clearAllHistory(): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.removeItem(WORK_SESSIONS_KEY);
        localStorage.removeItem(LEARNING_SESSIONS_KEY);
    }
}

// Export a singleton instance of the service
export const storageService: StorageService = new LocalStorageService();
