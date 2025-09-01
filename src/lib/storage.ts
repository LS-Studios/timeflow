
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
 * Defines the contract for any data persistence service.
 * Both Firebase and LocalStorage providers will implement this.
 */
interface StorageProvider {
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

/**
 * Implementation of the StorageProvider that uses Firebase Realtime Database.
 */
class FirebaseStorageProvider implements StorageProvider {
    async getUserAccount(userId: string): Promise<UserAccount | null> {
      const snapshot = await get(ref(db, `users/${userId}/account`));
      return snapshot.exists() ? snapshot.val() : null;
    }

    async saveSettings(userId: string, settings: AppSettings): Promise<void> {
        await set(ref(db, `users/${userId}/settings`), settings);
    }

    async getSettings(userId: string): Promise<AppSettings | null> {
        const snapshot = await get(ref(db, `users/${userId}/settings`));
        return snapshot.exists() ? snapshot.val() : null;
    }
    
    async getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        const snapshot = await get(ref(db, `users/${userId}/${mode}Sessions`));
        if (snapshot.exists()) {
            const sessions = snapshot.val();
            return sessions.map((s: any) => ({
                ...s,
                start: new Date(s.start),
                end: s.end ? new Date(s.end) : null,
            }));
        }
        return [];
    }

    async saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void> {
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
         const dataRef = ref(db, `users/${userId}/pendingRequests`);
         const snapshot = await get(dataRef);
         const currentRequests = snapshot.exists() ? snapshot.val() : [];
         if (!currentRequests.includes(date)) {
             await set(dataRef, [...currentRequests, date]);
         }
    }

    async getPendingRequests(userId: string): Promise<string[]> {
        const snapshot = await get(ref(db, `users/${userId}/pendingRequests`));
        return snapshot.exists() ? snapshot.val() : [];
    }

    // Guest functions are not applicable for the Firebase provider
    getGuestUser(): null { return null; }
    saveGuestUser(): void {}
    clearGuestUser(): void {}
}


/**
 * Implementation of the StorageProvider that uses the browser's localStorage.
 */
class LocalStorageProvider implements StorageProvider {
    async getUserAccount(): Promise<UserAccount | null> {
        return Promise.resolve(this.getGuestUser());
    }

    async saveSettings(_: string, settings: AppSettings): Promise<void> {
        if (typeof window === 'undefined') return Promise.resolve();
        localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
        return Promise.resolve();
    }

    async getSettings(): Promise<AppSettings | null> {
        if (typeof window === 'undefined') return Promise.resolve(null);
        const settingsJson = localStorage.getItem(LOCAL_SETTINGS_KEY);
        return Promise.resolve(settingsJson ? JSON.parse(settingsJson) : null);
    }
    
    async getSessions(_: string, mode: AppMode): Promise<Session[]> {
        if (typeof window === 'undefined') return Promise.resolve([]);
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        const sessionsJson = localStorage.getItem(key);
        if (!sessionsJson) return Promise.resolve([]);
        const parsed = JSON.parse(sessionsJson);
        const sessions = parsed.map((s: any) => ({ ...s, start: new Date(s.start), end: s.end ? new Date(s.end) : null }));
        return Promise.resolve(sessions);
    }

    async saveSessions(_: string, mode: AppMode, sessions: Session[]): Promise<void> {
        if (typeof window === 'undefined') return Promise.resolve();
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        const sessionsToStore = sessions.map(s => ({
          ...s,
          start: s.start.toISOString(),
          end: s.end ? s.end.toISOString() : null
        }));
        localStorage.setItem(key, JSON.stringify(sessionsToStore));
        return Promise.resolve();
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
        return Promise.resolve(Array.from(topics));
    }

    // Request-related functions are not applicable for local storage
    async addPendingRequest(): Promise<void> { return Promise.resolve(); }
    async getPendingRequests(): Promise<string[]> { return Promise.resolve([]); }

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
        localStorage.removeItem(LOCAL_SETTINGS_KEY);
        localStorage.removeItem(`${LOCAL_SESSIONS_PREFIX}work`);
        localStorage.removeItem(`${LOCAL_SESSIONS_PREFIX}learning`);
    }
}


/**
 * A facade service that intelligently delegates to the correct
 * storage provider based on the userId.
 */
class StorageServiceFacade implements StorageProvider {
    private firebaseProvider: StorageProvider;
    private localProvider: StorageProvider;

    constructor() {
        this.firebaseProvider = new FirebaseStorageProvider();
        this.localProvider = new LocalStorageProvider();
    }

    private getProvider(userId: string): StorageProvider {
        return userId === 'guest' ? this.localProvider : this.firebaseProvider;
    }
    
    getUserAccount(userId: string): Promise<UserAccount | null> {
        return this.getProvider(userId).getUserAccount(userId);
    }
    
    saveSettings(userId: string, settings: AppSettings): Promise<void> {
        return this.getProvider(userId).saveSettings(userId, settings);
    }

    getSettings(userId: string): Promise<AppSettings | null> {
        return this.getProvider(userId).getSettings(userId);
    }
    
    getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        return this.getProvider(userId).getSessions(userId, mode);
    }

    saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void> {
        return this.getProvider(userId).saveSessions(userId, mode, sessions);
    }
    
    getAllTopics(userId: string): Promise<string[]> {
        return this.getProvider(userId).getAllTopics(userId);
    }
    
    addPendingRequest(userId: string, date: string): Promise<void> {
        return this.getProvider(userId).addPendingRequest(userId, date);
    }

    getPendingRequests(userId: string): Promise<string[]> {
        return this.getProvider(userId).getPendingRequests(userId);
    }

    // Guest user management is always local
    getGuestUser() {
        return this.localProvider.getGuestUser();
    }
    
    saveGuestUser(user: { uid: string; name: string; email: string; }) {
        this.localProvider.saveGuestUser(user);
    }

    clearGuestUser() {
        this.localProvider.clearGuestUser();
    }
}

// Export a singleton instance of the facade
export const storageService = new StorageServiceFacade();
