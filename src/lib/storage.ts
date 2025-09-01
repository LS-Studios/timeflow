
"use client";
import { ref, get, set, onValue, off } from "firebase/database";
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
    getSettings(userId: string): Promise<AppSettings | null>; // For initial load
    onSettingsChange(userId: string, callback: (settings: AppSettings) => void): () => void; // Real-time listener
    getSessions(userId: string, mode: AppMode): Promise<Session[]>; // For initial load
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void; // Real-time listener
    saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void>;
    getAllTopics(userId: string): Promise<string[]>;
    addPendingRequest(userId: string, date: string): Promise<void>;
    getPendingRequests(userId: string): Promise<string[]>;
    onPendingRequestsChange(userId: string, callback: (requests: string[]) => void): () => void; // Real-time listener
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

    onSettingsChange(userId: string, callback: (settings: AppSettings) => void): () => void {
        const settingsRef = ref(db, `users/${userId}/settings`);
        const listener = onValue(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.val());
            }
        });

        // Return the unsubscribe function
        return () => off(settingsRef, 'value', listener);
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
    
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void {
        const sessionsRef = ref(db, `users/${userId}/${mode}Sessions`);
        const listener = onValue(sessionsRef, (snapshot) => {
            let sessions: Session[] = [];
            if (snapshot.exists()) {
                sessions = snapshot.val().map((s: any) => ({
                    ...s,
                    start: new Date(s.start),
                    end: s.end ? new Date(s.end) : null,
                }));
            }
            callback(sessions);
        });
        return () => off(sessionsRef, 'value', listener);
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
    
    onPendingRequestsChange(userId: string, callback: (requests: string[]) => void): () => void {
        const requestsRef = ref(db, `users/${userId}/pendingRequests`);
        const listener = onValue(requestsRef, (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : []);
        });
        return () => off(requestsRef, 'value', listener);
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
    
    onSettingsChange(_: string, callback: (settings: AppSettings) => void): () => void {
        // Local storage doesn't have a native push-based change listener.
        // We can simulate it, but for this app's purpose, a one-time get is sufficient.
        // The settings provider re-reads on user change anyway.
        this.getSettings().then(settings => {
            if (settings) callback(settings);
        });
        return () => {}; // Return a no-op unsubscribe function
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
    
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void {
        // Similar to settings, just get the data once. UI updates are handled internally for local storage.
        this.getSessions(userId, mode).then(callback);
        return () => {};
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
    onPendingRequestsChange(_: string, callback: (requests: string[]) => void): () => void {
        callback([]);
        return () => {};
    }

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
    
    onSettingsChange(userId: string, callback: (settings: AppSettings) => void): () => void {
        return this.getProvider(userId).onSettingsChange(userId, callback);
    }
    
    getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        return this.getProvider(userId).getSessions(userId, mode);
    }
    
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void {
        return this.getProvider(userId).onSessionsChange(userId, mode, callback);
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
    
    onPendingRequestsChange(userId: string, callback: (requests: string[]) => void): () => void {
        return this.getProvider(userId).onPendingRequestsChange(userId, callback);
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
