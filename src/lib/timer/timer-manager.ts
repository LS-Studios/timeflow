
import type { Session, LearningObjective, AppMode } from "@/lib/types";
import { workTimerHandler } from './work-timer-handler';
import { learningTimerHandler } from './learning-timer-handler';

// --- Type Definitions for Handler Arguments ---

type UpdateStateCallback = (newAllSessions: Session[], newCurrentSession: Session | null) => void;

interface StartHandlerArgs {
    mode: AppMode;
    allSessions: Session[];
    currentSession: Session | null;
    isPaused: boolean;
    callbacks: {
        openStartLearningDialog: () => void;
        updateState: UpdateStateCallback;
    };
}

interface EndHandlerArgs {
    mode: AppMode;
    allSessions: Session[];
    currentSession: Session | null;
    callbacks: {
        openEndLearningDialog: (session: Session) => void;
        updateState: UpdateStateCallback;
    };
}

interface StartLearningArgs {
    allSessions: Session[];
    currentSession: Session | null;
    isPaused: boolean;
    goal: string;
    objectives: string[];
    topics: string[];
    updateState: UpdateStateCallback;
}

interface EndLearningArgs {
    allSessions: Session[];
    sessionToEnd: Session;
    updatedObjectives: LearningObjective[];
    totalCompletion: number;
}

// --- Utility Functions ---

/**
 * Creates a new session object.
 */
const createNewSession = (sessionData: Omit<Session, 'id' | 'date' | 'start' | 'steps' | 'isCompleted'>): Session => {
    const today = new Date().toISOString().split('T')[0];
    return {
        id: new Date().toISOString() + Math.random(),
        date: today,
        start: new Date(),
        end: null,
        steps: [],
        isCompleted: false,
        ...sessionData,
    };
};

/**
 * Adds a new step (work or pause) to a session's steps array.
 */
const addStep = (steps: Session['steps'], type: 'work' | 'pause', note?: string): Session['steps'] => {
    return [
        ...steps,
        { id: new Date().toISOString() + Math.random(), type, start: new Date(), end: null, note }
    ];
};

/**
 * Ends the last step in a session's steps array.
 */
const endLastStep = (steps: Session['steps']): Session['steps'] => {
    if (steps.length === 0) return [];
    const newSteps = [...steps];
    const lastStep = newSteps[newSteps.length - 1];
    if (!lastStep.end) {
        newSteps[newSteps.length - 1] = { ...lastStep, end: new Date() };
    }
    return newSteps;
};

// --- TimerManager ---

/**
 * A centralized manager for all timer-related business logic.
 * It delegates mode-specific logic to dedicated handlers.
 */
export const timerManager = {
    /**
     * Finds the currently active (unfinished) session for today.
     */
    findActiveSession(sessions: Session[], mode: AppMode): Session | null {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = sessions.filter(s => s.date === today && !s.isCompleted);
        if (mode === 'work') {
            return todaySessions[0] || null;
        }
        return todaySessions[todaySessions.length - 1] || null;
    },

    /**
     * Handles the main start/resume button click.
     */
    handleStart: async (args: StartHandlerArgs) => {
        const { mode, allSessions, currentSession, isPaused, callbacks } = args;

        if (mode === 'learning') {
            await learningTimerHandler.handleStart({ allSessions, currentSession, isPaused, callbacks });
        } else {
            await workTimerHandler.handleStart({ allSessions, currentSession, isPaused, callbacks });
        }
    },

    /**
     * Handles pausing the timer.
     */
    handlePause(allSessions: Session[], currentSession: Session | null) {
        if (!currentSession) return null;

        let steps = endLastStep(currentSession.steps);
        steps = addStep(steps, 'pause');
        const updatedCurrentSession: Session = { ...currentSession, steps };
        const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);
        
        return { updatedSessions, updatedCurrentSession };
    },

    /**
     * Handles resetting the timer.
     */
    handleReset(allSessions: Session[], currentSession: Session | null) {
        if (!currentSession) return null;

        const updatedSessions = allSessions.filter(s => s.id !== currentSession.id);
        const updatedCurrentSession = null;
        
        return { updatedSessions, updatedCurrentSession };
    },

    /**
     * Handles ending a session (work day or learning session).
     */
    handleEnd: (args: EndHandlerArgs) => {
        if (!args.currentSession) return;
        
        if (args.mode === 'learning') {
            learningTimerHandler.handleEnd(args);
        } else {
            workTimerHandler.handleEnd(args);
        }
    },

    /**
     * Saves a note to the current pause step.
     */
    savePauseNote(allSessions: Session[], currentSession: Session | null, note: string) {
        if (!currentSession || currentSession.steps.length === 0) return null;

        const updatedSteps = [...currentSession.steps];
        const lastStep = updatedSteps[updatedSteps.length - 1];

        if (lastStep.type === 'pause') {
            updatedSteps[updatedSteps.length - 1] = { ...lastStep, note };
            const updatedCurrentSession = { ...currentSession, steps: updatedSteps };
            const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);
            return { updatedSessions, updatedCurrentSession };
        }
        return null;
    },
    
    /**
     * Starts a new learning session.
     */
    startLearningSession: (args: StartLearningArgs) => {
        return learningTimerHandler.startLearningSession(args);
    },

    /**
     * Ends a learning session and calculates completion.
     */
    endLearningSession: (args: EndLearningArgs) => {
        return learningTimerHandler.endLearningSession(args);
    },
    
    /**
     * Reverts the "ending" state if the end learning dialog is cancelled.
     */
    cancelEndLearning(allSessions: Session[], currentSession: Session | null) {
        return learningTimerHandler.cancelEndLearning(allSessions, currentSession);
    },

    /**
     * Continues a work day that was previously marked as ended.
     */
    continueWork(allSessions: Session[], currentSession: Session | null) {
        return workTimerHandler.continueWork(allSessions, currentSession);
    },
    
    /**
     * Ends the last step of a session. Used by settings provider.
     */
    endLastStep(allSessions: Session[], currentSession: Session | null) {
        if (!currentSession) return { updatedSessions: allSessions, updatedCurrentSession: currentSession };
        
        const updatedCurrentSession = { ...currentSession, steps: endLastStep(currentSession.steps) };
        const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);

        return { updatedSessions, updatedCurrentSession };
    },

    // --- Exposed utility functions for handlers ---
    _utils: {
        createNewSession,
        addStep,
        endLastStep,
    },
};
