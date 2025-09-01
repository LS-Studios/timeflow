"use client";
import type { AppSettings, DayHistory } from "./types";

const SETTINGS_KEY = 'timeflow_settings';
const HISTORY_KEY_PREFIX = 'timeflow_history_';

/**
 * An interface for a service that handles data persistence.
 * This allows for swapping between localStorage, Firebase, etc.
 */
interface StorageService {
    saveSettings(settings: AppSettings): void;
    getSettings(): AppSettings | null;
    saveDayHistory(history: DayHistory): void;
    getDayHistory(dateKey: string): DayHistory | null;
    getAllHistory(): DayHistory[];
    getAllTopics(): string[];
    clearDayHistory(dateKey: string): void;
}

/**
 * A service that uses the browser's localStorage for persistence.
 */
class LocalStorageService implements StorageService {
    
    // Check if localStorage is available
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

    saveDayHistory(history: DayHistory): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.setItem(`${HISTORY_KEY_PREFIX}${history.id}`, JSON.stringify(history));
    }

    getDayHistory(dateKey: string): DayHistory | null {
        if (!this.isLocalStorageAvailable()) return null;
        const historyJson = localStorage.getItem(`${HISTORY_KEY_PREFIX}${dateKey}`);
        if (!historyJson) return null;
        
        const parsed = JSON.parse(historyJson);
        // Ensure dates are parsed correctly
        parsed.sessions = parsed.sessions.map((s: any) => ({
            ...s,
            start: new Date(s.start),
            end: s.end ? new Date(s.end) : null
        }));

        return parsed;
    }

    getAllHistory(): DayHistory[] {
        if (!this.isLocalStorageAvailable()) return [];
        const history: DayHistory[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(HISTORY_KEY_PREFIX)) {
                const dayHistory = this.getDayHistory(key.replace(HISTORY_KEY_PREFIX, ''));
                if (dayHistory) {
                    history.push(dayHistory);
                }
            }
        }
        // Sort by date descending
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    
    getAllTopics(): string[] {
        const allHistory = this.getAllHistory();
        const topics = new Set<string>();
        allHistory.forEach(day => {
            day.sessions.forEach(session => {
                if (session.topics) {
                    session.topics.forEach(topic => topics.add(topic));
                }
            })
        })
        return Array.from(topics);
    }

    clearDayHistory(dateKey: string): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.removeItem(`${HISTORY_KEY_PREFIX}${dateKey}`);
    }
}


// Export a singleton instance of the service
export const storageService: StorageService = new LocalStorageService();

    