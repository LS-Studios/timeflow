
"use client";
import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { AppSettings, Session, AppMode } from "./types";
import { isToday, startOfDay } from 'date-fns';

const LOCAL_SETTINGS_KEY = 'timeflow_guest_settings';
const LOCAL_SESSIONS_PREFIX = 'timeflow_guest_sessions_';
const GUEST_USER_KEY = 'timeflow_guest_user';


export interface UserAccount {
    name: string;
    email: string;
    password?: string;
}

/**
 * An interface for a service that handles data persistence,
 * now connected to Firebase Firestore.
 */
interface StorageService {
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

class FirestoreStorageService implements StorageService {
    
    private getSettingsDocRef(userId: string) {
        return doc(db, "users", userId, "data", "settings");
    }

    private getSessionsDocRef(userId: string, mode: AppMode) {
        return doc(db, "users", userId, "data", `${mode}Sessions`);
    }
    
    private getPendingRequestsDocRef(userId: string) {
        return doc(db, "users", userId, "data", "pendingRequests");
    }

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
    }

    private getLocalSessions(mode: AppMode): Session[] {
        if (typeof window === 'undefined') return [];
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        const sessionsJson = localStorage.getItem(key);
        if (!sessionsJson) return [];
        const parsed = JSON.parse(sessionsJson);
        return parsed.map((s: any) => ({ ...s, start: new Date(s.start), end: s.end ? new Date(s.end) : null }));
    }

    private saveLocalSessions(mode: AppMode, sessions: Session[]): void {
        if (typeof window === 'undefined') return;
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        localStorage.setItem(key, JSON.stringify(sessions));
    }


    async saveSettings(userId: string, settings: AppSettings): Promise<void> {
        if (userId === 'guest') {
             if (typeof window === 'undefined') return;
             localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
             return;
        }
        const docRef = this.getSettingsDocRef(userId);
        await setDoc(docRef, settings);
    }

    async getSettings(userId: string): Promise<AppSettings | null> {
         if (userId === 'guest') {
            if (typeof window === 'undefined') return null;
            const settingsJson = localStorage.getItem(LOCAL_SETTINGS_KEY);
            return settingsJson ? JSON.parse(settingsJson) : null;
        }
        const docRef = this.getSettingsDocRef(userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as AppSettings) : null;
    }
    
    async getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        if (userId === 'guest') {
            return this.getLocalSessions(mode);
        }
        const docRef = this.getSessionsDocRef(userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const sessions = data.sessions || [];
            // Timestamps are stored in Firestore, convert them back to Date objects
            return sessions.map((s: any) => ({
                ...s,
                start: s.start.toDate(),
                end: s.end ? s.end.toDate() : null,
            }));
        }
        return [];
    }

    async saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void> {
        if (userId === 'guest') {
            this.saveLocalSessions(mode, sessions);
            return;
        }
        // Save all sessions for the mode in a single document
        const docRef = this.getSessionsDocRef(userId, mode);
        await setDoc(docRef, { sessions });
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
         const docRef = this.getPendingRequestsDocRef(userId);
         const docSnap = await getDoc(docRef);
         const currentRequests = docSnap.exists() ? docSnap.data().dates : [];
         if (!currentRequests.includes(date)) {
             await setDoc(docRef, { dates: [...currentRequests, date] });
         }
    }

    async getPendingRequests(userId: string): Promise<string[]> {
        if (userId === 'guest') return []; // Not applicable for guest
        const docRef = this.getPendingRequestsDocRef(userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().dates : [];
    }
}

// Export a singleton instance of the service
export const storageService = new FirestoreStorageService();
