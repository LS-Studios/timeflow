
"use client";
import { ref, get, set, onValue, off } from "firebase/database";
import { db } from "./firebase";
import type { AppSettings, Session, SessionStep, AppMode, OrganizationData } from "./types";

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
    onSettingsChange(userId: string, callback: (settings: AppSettings | null) => void): () => void; // Real-time listener
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void; // Real-time listener
    saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void>;
    getAllTopics(userId: string): Promise<string[]>;
    addPendingRequest(userId: string, date: string): Promise<void>;
    getPendingRequests(userId: string): Promise<string[]>;
    onPendingRequestsChange(userId: string, callback: (requests: string[]) => void): () => void; // Real-time listener
    getGuestUser(): { uid: string; name: string; email: string } | null;
    saveGuestUser(user: { uid: string; name: string; email: string }): void;
    clearGuestUser(): void;
    // Organization management
    createOrganization(adminUserId: string, serialNumber: string, name: string): Promise<void>;
    getOrganization(serialNumber: string): Promise<OrganizationData | null>;
    updateOrganizationName(serialNumber: string, name: string): Promise<void>;
    joinOrganization(userId: string, serialNumber: string): Promise<boolean>;
    getOrganizationEmployees(serialNumber: string): Promise<string[]>;
    getOrganizationEmployeeData(serialNumber: string): Promise<{ userId: string; account: UserAccount | null; workSessions: Session[]; learningSessions: Session[]; }[]>;
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
    
    onSettingsChange(userId: string, callback: (settings: AppSettings | null) => void): () => void {
        const settingsRef = ref(db, `users/${userId}/settings`);
        const listener = onValue(settingsRef, (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
        });
        return () => off(settingsRef, 'value', listener);
    }
    
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void {
        const sessionsRef = ref(db, `users/${userId}/${mode}Sessions`);
        const listener = onValue(sessionsRef, (snapshot) => {
            let sessions: Session[] = [];
            if (snapshot.exists()) {
                const rawSessions = snapshot.val() || [];
                sessions = rawSessions.map((s: any) => ({
                    ...s,
                    start: s.start ? new Date(s.start) : new Date(),
                    end: s.end ? new Date(s.end) : null,
                    steps: (s.steps || []).map((step: any) => ({
                        ...step,
                        start: step.start ? new Date(step.start) : new Date(),
                        end: step.end ? new Date(step.end) : null,
                    })),
                }));
            }
            callback(sessions);
        });
        return () => off(sessionsRef, 'value', listener);
    }

    async saveSessions(userId: string, mode: AppMode, sessions: Session[]): Promise<void> {
        const sessionsToStore = sessions.map(s => ({
          ...s,
          start: s.start ? s.start.toISOString() : new Date().toISOString(),
          end: s.end ? s.end.toISOString() : null,
          steps: s.steps.map(step => ({
            ...step,
            start: step.start ? step.start.toISOString() : new Date().toISOString(),
            end: step.end ? step.end.toISOString() : null,
            note: step.note || null, // Convert undefined to null for Firebase
          })),
        }));
        await set(ref(db, `users/${userId}/${mode}Sessions`), sessionsToStore);
    }

    async getAllTopics(userId: string): Promise<string[]> {
        const [workSessions, learningSessions] = await Promise.all([
          this.getSessions(userId, 'work'),
          this.getSessions(userId, 'learning')
        ]);
        const allSessions = [...workSessions, ...learningSessions];
        const topics = new Set<string>();
        allSessions.forEach(session => {
            if (session.topics) {
                session.topics.forEach(topic => topics.add(topic));
            }
        });
        return Array.from(topics);
    }

    private async getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        const snapshot = await get(ref(db, `users/${userId}/${mode}Sessions`));
        if (snapshot.exists()) {
            const sessions = snapshot.val() || [];
            return sessions.map((s: any) => ({
                ...s,
                start: s.start ? new Date(s.start) : new Date(),
                end: s.end ? new Date(s.end) : null,
                steps: (s.steps || []).map((step: any) => ({
                    ...step,
                    start: step.start ? new Date(step.start) : new Date(),
                    end: step.end ? new Date(step.end) : null,
                })),
            }));
        }
        return [];
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

    getGuestUser(): null { return null; }
    saveGuestUser(): void {}
    clearGuestUser(): void {}

    // Organization management for Firebase
    async createOrganization(adminUserId: string, serialNumber: string, name: string): Promise<void> {
        const orgData: OrganizationData = {
            serialNumber,
            name,
            adminUserId,
            createdAt: new Date().toISOString(),
            employees: [adminUserId]
        };
        console.log('Creating organization in Firebase:', orgData);
        await set(ref(db, `organizations/${serialNumber}`), orgData);
        console.log('Organization created successfully');
    }

    async getOrganization(serialNumber: string): Promise<OrganizationData | null> {
        console.log('Getting organization from Firebase:', serialNumber);
        const snapshot = await get(ref(db, `organizations/${serialNumber}`));
        const result = snapshot.exists() ? snapshot.val() : null;
        console.log('Organization data retrieved:', result);
        return result;
    }

    async updateOrganizationName(serialNumber: string, name: string): Promise<void> {
        console.log('Updating organization name in Firebase:', serialNumber, name);
        await set(ref(db, `organizations/${serialNumber}/name`), name);
        console.log('Organization name updated successfully');
    }

    async joinOrganization(userId: string, serialNumber: string): Promise<boolean> {
        const orgSnapshot = await get(ref(db, `organizations/${serialNumber}`));
        if (!orgSnapshot.exists()) return false;
        
        const org: OrganizationData = orgSnapshot.val();
        if (!org.employees.includes(userId)) {
            const updatedEmployees = [...org.employees, userId];
            await set(ref(db, `organizations/${serialNumber}/employees`), updatedEmployees);
        }
        return true;
    }

    async getOrganizationEmployees(serialNumber: string): Promise<string[]> {
        const snapshot = await get(ref(db, `organizations/${serialNumber}/employees`));
        return snapshot.exists() ? snapshot.val() : [];
    }

    async getOrganizationEmployeeData(serialNumber: string): Promise<{ userId: string; account: UserAccount | null; workSessions: Session[]; learningSessions: Session[]; }[]> {
        const employeeIds = await this.getOrganizationEmployees(serialNumber);
        const employeeData = await Promise.all(
            employeeIds.map(async (userId) => {
                const [account, workSessions, learningSessions] = await Promise.all([
                    this.getUserAccount(userId),
                    this.getSessions(userId, 'work'),
                    this.getSessions(userId, 'learning')
                ]);
                return { userId, account, workSessions, learningSessions };
            })
        );
        return employeeData;
    }
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

    onSettingsChange(_: string, callback: (settings: AppSettings | null) => void): () => void {
        if (typeof window === 'undefined') return () => {};

        let lastKnownState = localStorage.getItem(LOCAL_SETTINGS_KEY);
        
        const getSettings = () => {
            const settingsJson = localStorage.getItem(LOCAL_SETTINGS_KEY);
            return settingsJson ? JSON.parse(settingsJson) : null;
        }
        
        callback(getSettings());
        
        const intervalId = setInterval(() => {
            const currentState = localStorage.getItem(LOCAL_SETTINGS_KEY);
            if (currentState !== lastKnownState) {
                lastKnownState = currentState;
                callback(currentState ? JSON.parse(currentState) : null);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }
    
    onSessionsChange(userId: string, mode: AppMode, callback: (sessions: Session[]) => void): () => void {
        if (typeof window === 'undefined') return () => {};

        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        let lastKnownState = localStorage.getItem(key);

        const getSessions = () => {
            const sessionsJson = localStorage.getItem(key);
            if (!sessionsJson) return [];
            const parsed = JSON.parse(sessionsJson);
            return parsed.map((s: any) => ({ 
                ...s, 
                start: new Date(s.start), 
                end: s.end ? new Date(s.end) : null,
                steps: (s.steps || []).map((step: any) => ({
                    ...step,
                    start: new Date(step.start),
                    end: step.end ? new Date(step.end) : null,
                })),
            }));
        };

        callback(getSessions());

        const intervalId = setInterval(() => {
            const currentState = localStorage.getItem(key);
            if (currentState !== lastKnownState) {
                lastKnownState = currentState;
                callback(getSessions());
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }

    async saveSessions(_: string, mode: AppMode, sessions: Session[]): Promise<void> {
        if (typeof window === 'undefined') return Promise.resolve();
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        const sessionsToStore = sessions.map(s => ({
          ...s,
          start: s.start.toISOString(),
          end: s.end ? s.end.toISOString() : null,
          steps: s.steps.map(step => ({
            ...step,
            start: step.start.toISOString(),
            end: step.end ? step.end.toISOString() : null,
            note: step.note || null, // Convert undefined to null for consistency
          })),
        }));
        localStorage.setItem(key, JSON.stringify(sessionsToStore));
        return Promise.resolve();
    }

    async getAllTopics(userId: string): Promise<string[]> {
        const [workSessions, learningSessions] = await Promise.all([
          this.getSessions(userId, 'work'),
          this.getSessions(userId, 'learning')
        ]);

        const allSessions = [...workSessions, ...learningSessions];
        const topics = new Set<string>();
        allSessions.forEach(session => {
            if (session.topics) {
                session.topics.forEach(topic => topics.add(topic));
            }
        });
        return Promise.resolve(Array.from(topics));
    }
    
    private async getSessions(userId: string, mode: AppMode): Promise<Session[]> {
       if (typeof window === 'undefined') return Promise.resolve([]);
        const key = `${LOCAL_SESSIONS_PREFIX}${mode}`;
        const sessionsJson = localStorage.getItem(key);
        if (!sessionsJson) return Promise.resolve([]);
        const parsed = JSON.parse(sessionsJson);
        const sessions = parsed.map((s: any) => ({ 
            ...s, 
            start: new Date(s.start), 
            end: s.end ? new Date(s.end) : null,
            steps: (s.steps || []).map((step: any) => ({
                ...step,
                start: new Date(step.start),
                end: step.end ? new Date(step.end) : null,
            })),
        }));
        return Promise.resolve(sessions);
    }

    async addPendingRequest(): Promise<void> { return Promise.resolve(); }
    async getPendingRequests(): Promise<string[]> { return Promise.resolve([]); }
    onPendingRequestsChange(_: string, callback: (requests: string[]) => void): () => void {
        callback([]);
        return () => {};
    }

    async createOrganization(adminUserId: string, serialNumber: string, name: string): Promise<void> {
        if (typeof window === 'undefined') return Promise.resolve();
        
        const orgData: OrganizationData = {
            serialNumber,
            name,
            adminUserId,
            createdAt: new Date().toISOString(),
            employees: [adminUserId]
        };
        
        localStorage.setItem(`timeflow_organization_${serialNumber}`, JSON.stringify(orgData));
        return Promise.resolve();
    }

    async getOrganization(serialNumber: string): Promise<OrganizationData | null> {
        if (typeof window === 'undefined') return Promise.resolve(null);
        
        const orgJson = localStorage.getItem(`timeflow_organization_${serialNumber}`);
        return Promise.resolve(orgJson ? JSON.parse(orgJson) : null);
    }

    async updateOrganizationName(serialNumber: string, name: string): Promise<void> {
        if (typeof window === 'undefined') return Promise.resolve();
        
        const orgJson = localStorage.getItem(`timeflow_organization_${serialNumber}`);
        if (orgJson) {
            const orgData = JSON.parse(orgJson);
            orgData.name = name;
            localStorage.setItem(`timeflow_organization_${serialNumber}`, JSON.stringify(orgData));
        }
        return Promise.resolve();
    }

    async joinOrganization(userId: string, serialNumber: string): Promise<boolean> {
        if (typeof window === 'undefined') return Promise.resolve(false);
        
        const orgJson = localStorage.getItem(`timeflow_organization_${serialNumber}`);
        if (!orgJson) return Promise.resolve(false);
        
        const orgData: OrganizationData = JSON.parse(orgJson);
        if (!orgData.employees.includes(userId)) {
            orgData.employees.push(userId);
            localStorage.setItem(`timeflow_organization_${serialNumber}`, JSON.stringify(orgData));
        }
        return Promise.resolve(true);
    }

    async getOrganizationEmployees(serialNumber: string): Promise<string[]> {
        if (typeof window === 'undefined') return Promise.resolve([]);
        
        const orgJson = localStorage.getItem(`timeflow_organization_${serialNumber}`);
        if (!orgJson) return Promise.resolve([]);
        
        const orgData: OrganizationData = JSON.parse(orgJson);
        return Promise.resolve(orgData.employees);
    }

    async getOrganizationEmployeeData(serialNumber: string): Promise<{ userId: string; account: UserAccount | null; workSessions: Session[]; learningSessions: Session[]; }[]> {
        if (typeof window === 'undefined') return Promise.resolve([]);
        
        const employeeIds = await this.getOrganizationEmployees(serialNumber);
        const employeeData = await Promise.all(
            employeeIds.map(async (userId) => {
                const [account, workSessions, learningSessions] = await Promise.all([
                    this.getUserAccount(userId),
                    this.getSessions(userId, 'work'),
                    this.getSessions(userId, 'learning')
                ]);
                return { userId, account, workSessions, learningSessions };
            })
        );
        return employeeData;
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
    
    onSettingsChange(userId: string, callback: (settings: AppSettings | null) => void): () => void {
        return this.getProvider(userId).onSettingsChange(userId, callback);
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

    async getPendingRequests(userId: string): Promise<string[]> {
        return this.getProvider(userId).getPendingRequests(userId);
    }
    
    onPendingRequestsChange(userId: string, callback: (requests: string[]) => void): () => void {
        return this.getProvider(userId).onPendingRequestsChange(userId, callback);
    }

    getGuestUser() {
        return this.localProvider.getGuestUser();
    }
    
    saveGuestUser(user: { uid: string; name: string; email: string; }) {
        this.localProvider.saveGuestUser(user);
    }

    clearGuestUser() {
        this.localProvider.clearGuestUser();
    }

    // Organization management - always use Firebase for shared organization data
    createOrganization(adminUserId: string, serialNumber: string, name: string): Promise<void> {
        return this.firebaseProvider.createOrganization(adminUserId, serialNumber, name);
    }

    getOrganization(serialNumber: string): Promise<OrganizationData | null> {
        return this.firebaseProvider.getOrganization(serialNumber);
    }

    updateOrganizationName(serialNumber: string, name: string): Promise<void> {
        return this.firebaseProvider.updateOrganizationName(serialNumber, name);
    }

    joinOrganization(userId: string, serialNumber: string): Promise<boolean> {
        return this.firebaseProvider.joinOrganization(userId, serialNumber);
    }

    getOrganizationEmployees(serialNumber: string): Promise<string[]> {
        return this.firebaseProvider.getOrganizationEmployees(serialNumber);
    }

    getOrganizationEmployeeData(serialNumber: string): Promise<{ userId: string; account: UserAccount | null; workSessions: Session[]; learningSessions: Session[]; }[]> {
        // Always use Firebase for organization data since organizations are shared
        return this.firebaseProvider.getOrganizationEmployeeData(serialNumber);
    }
}

export const storageService = new StorageServiceFacade();

    