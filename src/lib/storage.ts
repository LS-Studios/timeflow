

"use client";
import { ref, get, set, onValue, off, query, orderByChild, equalTo, limitToLast } from "firebase/database";
import { db } from "./firebase";
import type { AppSettings, Session, SessionStep, AppMode, OrganizationData } from "./types";

const LOCAL_SETTINGS_KEY = 'timeflow_guest_settings';
const LOCAL_SESSIONS_PREFIX = 'timeflow_guest_sessions_';
const GUEST_USER_KEY = 'timeflow_guest_user';

export interface UserAccount {
    name: string;
    email: string;
}

type EmployeeData = { userId: string; account: UserAccount | null; workSessions: Session[]; learningSessions: Session[]; };

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
    deleteOrganizationAndCleanup(serialNumber: string): Promise<void>;
    updateOrganizationName(serialNumber: string, name: string): Promise<void>;
    onOrganizationChange(serialNumber: string, callback: (data: OrganizationData | null) => void): () => void; // Real-time listener for org data
    onOrganizationEmployeesChange(serialNumber: string, callback: (employees: EmployeeData[]) => void): () => void; // Real-time listener for employees and their data
    joinOrganization(userId: string, serialNumber: string): Promise<boolean>;
    getOrganizationEmployees(serialNumber: string): Promise<string[]>;
    getOrganizationEmployeeData(serialNumber: string, employeeIds?: string[]): Promise<EmployeeData[]>;
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
                sessions = this.parseSessions(rawSessions);
            }
            callback(sessions);
        });
        return () => off(sessionsRef, 'value', listener);
    }

    private parseSessions(rawSessions: any[]): Session[] {
        if (!Array.isArray(rawSessions)) return [];
        return rawSessions.map((s: any) => ({
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

    async getSessions(userId: string, mode: AppMode): Promise<Session[]> {
        const snapshot = await get(ref(db, `users/${userId}/${mode}Sessions`));
        if (snapshot.exists()) {
            return this.parseSessions(snapshot.val() || []);
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
        const employees: Record<string, boolean> = {};
        employees[adminUserId] = true;

        const orgData: OrganizationData = {
            serialNumber,
            name,
            adminUserId,
            createdAt: new Date().toISOString(),
            employees
        };
        await set(ref(db, `organizations/${serialNumber}`), orgData);
    }

    async getOrganization(serialNumber: string): Promise<OrganizationData | null> {
        const snapshot = await get(ref(db, `organizations/${serialNumber}`));
        return snapshot.exists() ? snapshot.val() : null;
    }
    
    async deleteOrganizationAndCleanup(serialNumber: string): Promise<void> {
        const orgRef = ref(db, `organizations/${serialNumber}`);
        const orgSnapshot = await get(orgRef);
        if (!orgSnapshot.exists()) return;

        const orgData: OrganizationData = orgSnapshot.val();
        const employeeIds = Object.keys(orgData.employees || {});

        // Clean up settings for each employee by setting org properties to null
        const cleanupPromises = employeeIds.map(async (userId) => {
            const userSettingsRef = ref(db, `users/${userId}/settings`);
            const snapshot = await get(userSettingsRef);
            if (snapshot.exists()) {
                const settings = snapshot.val();
                settings.organizationName = null;
                settings.organizationSerialNumber = null;
                return set(userSettingsRef, settings);
            }
        });


        await Promise.all(cleanupPromises);
        
        // Finally, delete the organization itself
        await set(orgRef, null);
    }

    async updateOrganizationName(serialNumber: string, name: string): Promise<void> {
        await set(ref(db, `organizations/${serialNumber}/name`), name);
    }

    onOrganizationChange(serialNumber: string, callback: (data: OrganizationData | null) => void): () => void {
        const orgRef = ref(db, `organizations/${serialNumber}`);
        const listener = onValue(orgRef, (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
        });
        return () => off(orgRef, 'value', listener);
    }
    
    onOrganizationEmployeesChange(serialNumber: string, callback: (employees: EmployeeData[]) => void): () => void {
        const employeesRef = ref(db, `organizations/${serialNumber}/employees`);

        const listener = onValue(employeesRef, async (snapshot) => {
            if (snapshot.exists()) {
                const employeeIdMap: Record<string, boolean> = snapshot.val();
                const employeeIds = Object.keys(employeeIdMap);
                const allEmployeeData = await this.getOrganizationEmployeeData(serialNumber, employeeIds);
                callback(allEmployeeData);
            } else {
                callback([]);
            }
        });
    
        return () => off(employeesRef, 'value', listener);
    }

    async joinOrganization(userId: string, serialNumber: string): Promise<boolean> {
        const orgRef = ref(db, `organizations/${serialNumber}`);
        const orgSnapshot = await get(orgRef);
        if (!orgSnapshot.exists()) return false;
        
        await set(ref(db, `organizations/${serialNumber}/employees/${userId}`), true);
        return true;
    }

    async getOrganizationEmployees(serialNumber: string): Promise<string[]> {
        const snapshot = await get(ref(db, `organizations/${serialNumber}/employees`));
        return snapshot.exists() ? Object.keys(snapshot.val()) : [];
    }

    async getOrganizationEmployeeData(serialNumber: string, employeeIds?: string[]): Promise<EmployeeData[]> {
        if (!employeeIds) {
            employeeIds = await this.getOrganizationEmployees(serialNumber);
        }
        if (!employeeIds || employeeIds.length === 0) return [];

        const employeeDataPromises = employeeIds.map(async (userId) => {
            const userSnapshot = await get(ref(db, `users/${userId}`));
            const userData = userSnapshot.val();
            return {
                userId,
                account: userData?.account || null,
                workSessions: this.parseSessions(userData?.workSessions || []),
                learningSessions: this.parseSessions(userData?.learningSessions || []),
            };
        });
        return Promise.all(employeeDataPromises);
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
        console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve();
    }

    async getOrganization(serialNumber: string): Promise<OrganizationData | null> {
         console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve(null);
    }
    
    async deleteOrganizationAndCleanup(serialNumber: string): Promise<void> {
        console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve();
    }

    async updateOrganizationName(serialNumber: string, name: string): Promise<void> {
        console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve();
    }
    
    onOrganizationChange(serialNumber: string, callback: (data: OrganizationData | null) => void): () => void {
       // Not implemented for local storage as it's not a shared environment
       return () => {};
    }

    onOrganizationEmployeesChange(serialNumber: string, callback: (employees: EmployeeData[]) => void): () => void {
        // Not implemented for local storage
        return () => {};
    }

    async joinOrganization(userId: string, serialNumber: string): Promise<boolean> {
        console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve(false);
    }

    async getOrganizationEmployees(serialNumber: string): Promise<string[]> {
        console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve([]);
    }

    async getOrganizationEmployeeData(serialNumber: string): Promise<EmployeeData[]> {
       console.warn("Organization features are not fully supported in guest mode.");
        return Promise.resolve([]);
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
    
    deleteOrganizationAndCleanup(serialNumber: string): Promise<void> {
        return this.firebaseProvider.deleteOrganizationAndCleanup(serialNumber);
    }

    updateOrganizationName(serialNumber: string, name: string): Promise<void> {
        return this.firebaseProvider.updateOrganizationName(serialNumber, name);
    }
    
    onOrganizationChange(serialNumber: string, callback: (data: OrganizationData | null) => void): () => void {
        return this.firebaseProvider.onOrganizationChange(serialNumber, callback);
    }
    
    onOrganizationEmployeesChange(serialNumber: string, callback: (employees: EmployeeData[]) => void): () => void {
        return this.firebaseProvider.onOrganizationEmployeesChange(serialNumber, callback);
    }

    joinOrganization(userId: string, serialNumber: string): Promise<boolean> {
        return this.firebaseProvider.joinOrganization(userId, serialNumber);
    }

    getOrganizationEmployees(serialNumber: string): Promise<string[]> {
        return this.firebaseProvider.getOrganizationEmployees(serialNumber);
    }

    getOrganizationEmployeeData(serialNumber: string, employeeIds?: string[]): Promise<EmployeeData[]> {
        return this.firebaseProvider.getOrganizationEmployeeData(serialNumber, employeeIds);
    }
}

export const storageService = new StorageServiceFacade();
