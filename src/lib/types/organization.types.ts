import type { Session } from './session.types';

export interface OrganizationData {
    serialNumber: string;
    name: string;
    adminUserId: string;
    createdAt: string;
    employees: Record<string, boolean>; // Object of user IDs for faster lookups/writes
}

export interface UserAccount {
    name: string;
    email: string;
}

export interface EmployeeData {
    userId: string;
    account: UserAccount | null;
    workSessions: Session[];
    learningSessions: Session[];
};
