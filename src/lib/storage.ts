
"use client";
import type { AppSettings, Session } from "./types";
import { format } from "date-fns";

const SETTINGS_KEY = 'timeflow_settings';
const SESSIONS_KEY = 'timeflow_sessions';

/**
 * An interface for a service that handles data persistence.
 */
interface StorageService {
    saveSettings(settings: AppSettings): void;
    getSettings(): AppSettings | null;
    
    // Session-based storage
    getAllSessions(): Session[];
    saveAllSessions(sessions: Session[]): void;
    
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
    
    getAllSessions(): Session[] {
        if (!this.isLocalStorageAvailable()) return [];
        const sessionsJson = localStorage.getItem(SESSIONS_KEY);
        if (!sessionsJson) return [];
        
        const parsed = JSON.parse(sessionsJson);
        // Ensure dates are parsed correctly from ISO strings
        return parsed.map((s: any) => ({
            ...s,
            start: new Date(s.start),
            end: s.end ? new Date(s.end) : null
        }));
    }

    saveAllSessions(sessions: Session[]): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }

    getAllTopics(): string[] {
        const allSessions = this.getAllSessions();
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
        localStorage.removeItem(SESSIONS_KEY);
    }
}

// Export a singleton instance of the service
export const storageService: StorageService = new LocalStorageService();
