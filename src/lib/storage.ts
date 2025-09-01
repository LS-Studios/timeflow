
"use client";
import { doc, getDoc, setDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { AppSettings, Session, AppMode } from "./types";

const SETTINGS_KEY = 'timeflow_settings';
const LOCAL_SESSIONS_PREFIX = 'timeflow_local_sessions_';

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
}

class FirestoreStorageService implements StorageService {
    
    private getSettingsDocRef(userId: string) {
        return doc(db, "users", userId, "data", "settings");
    }

    private getSessionsCollectionRef(userId: string, mode: AppMode) {
        return collection(db, "users", userId, "data", `${mode}Sessions`);
    }
    
    private getPendingRequestsDocRef(userId: string) {
        return doc(db, "users", userId, "data", "pendingRequests");
    }

    // --- Guest/Local mode functions ---
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
             localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
             return;
        }
        const docRef = this.getSettingsDocRef(userId);
        await setDoc(docRef, settings);
    }

    async getSettings(userId: string): Promise<AppSettings | null> {
         if (userId === 'guest') {
            if (typeof window === 'undefined') return null;
            const settingsJson = localStorage.getItem(SETTINGS_KEY);
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

        // For real users, we are not implementing the full session fetch from Firestore
        // in this step to keep the changes manageable. This would be the next step.
        // Returning an empty array for now for authenticated users.
        console.warn(`Firestore getSessions for user ${userId} is not fully implemented. Returning empty array.`);
        return [];
    }

    async saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void> {
        if (userId === 'guest') {
            this.saveLocalSessions(mode, sessions);
            return;
        }

        // For real users, we are not implementing the full session save to Firestore
        // in this step. This is a complex operation (batch write).
        console.warn(`Firestore saveSessions for user ${userId} is not fully implemented.`);
    }

    async getAllTopics(userId: string): Promise<string[]> {
        if (userId === 'guest') {
             const workSessions = this.getLocalSessions('work');
             const learningSessions = this.getLocalSessions('learning');
             const allSessions = [...workSessions, ...learningSessions];
             const topics = new Set<string>();
             allSessions.forEach(session => {
                 if (session.topics) {
                     session.topics.forEach(topic => topics.add(topic));
                 }
             });
             return Array.from(topics);
        }
        // Firestore implementation would require querying sessions.
        return [];
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
