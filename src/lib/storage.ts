
"use client";
import type { AppSettings, Session, AppMode } from "./types";

const SETTINGS_KEY = 'timeflow_settings';
const WORK_SESSIONS_KEY = 'timeflow_work_sessions';
const LEARNING_SESSIONS_KEY = 'timeflow_learning_sessions';
const PENDING_REQUESTS_KEY = 'timeflow_pending_requests';
const USERS_KEY = 'timeflow_users';
const LOGGED_IN_USER_KEY = 'timeflow_logged_in_user';

export interface UserAccount {
    name: string;
    email: string;
    password?: string; // Keep password optional for guest accounts, though we won't store them here
}

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

    // Pending organization requests
    addPendingRequest(date: string): void;
    getPendingRequests(): string[];

    // User management
    getUsers(): UserAccount[];
    saveUser(user: UserAccount): boolean; // Returns true on success, false if email exists
    authenticateUser(email: string, password?: string): UserAccount | null;
    
    // Logged-in state
    setLoggedInUser(user: UserAccount): void;
    getLoggedInUser(): UserAccount | null;
    clearLoggedInUser(): void;
    
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
    
    addPendingRequest(date: string): void {
        if (!this.isLocalStorageAvailable()) return;
        const requests = this.getPendingRequests();
        if (!requests.includes(date)) {
            requests.push(date);
            localStorage.setItem(PENDING_REQUESTS_KEY, JSON.stringify(requests));
        }
    }

    getPendingRequests(): string[] {
        if (!this.isLocalStorageAvailable()) return [];
        const requestsJson = localStorage.getItem(PENDING_REQUESTS_KEY);
        return requestsJson ? JSON.parse(requestsJson) : [];
    }
    
    getUsers(): UserAccount[] {
        if (!this.isLocalStorageAvailable()) return [];
        const usersJson = localStorage.getItem(USERS_KEY);
        return usersJson ? JSON.parse(usersJson) : [];
    }

    saveUser(user: UserAccount): boolean {
        if (!this.isLocalStorageAvailable()) return false;
        const users = this.getUsers();
        if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
            return false; // User with this email already exists
        }
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    }
    
    authenticateUser(email: string, password?: string): UserAccount | null {
        const users = this.getUsers();
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user && user.password === password) {
            return { name: user.name, email: user.email }; // Return user without password
        }
        return null;
    }
    
    setLoggedInUser(user: UserAccount): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(user));
    }

    getLoggedInUser(): UserAccount | null {
        if (!this.isLocalStorageAvailable()) return null;
        const userJson = localStorage.getItem(LOGGED_IN_USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }

    clearLoggedInUser(): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.removeItem(LOGGED_IN_USER_KEY);
    }

    clearAllHistory(): void {
        if (!this.isLocalStorageAvailable()) return;
        localStorage.removeItem(WORK_SESSIONS_KEY);
        localStorage.removeItem(LEARNING_SESSIONS_KEY);
        localStorage.removeItem(PENDING_REQUESTS_KEY);
    }
}

// Export a singleton instance of the service
export const storageService: StorageService = new LocalStorageService();
