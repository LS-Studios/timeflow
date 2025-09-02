
import type { Session } from "@/lib/types";
import { timerManager } from "./timer-manager";

type UpdateStateCallback = (newAllSessions: Session[], newCurrentSession: Session | null) => void;

interface StartHandlerArgs {
    allSessions: Session[];
    currentSession: Session | null;
    isPaused: boolean;
    callbacks: {
        updateState: UpdateStateCallback;
    };
}

interface EndHandlerArgs {
    allSessions: Session[];
    currentSession: Session | null;
    callbacks: {
        updateState: UpdateStateCallback;
    };
}

export const workTimerHandler = {
    /**
     * Handles the start/resume logic for the work mode.
     */
    handleStart: async ({ allSessions, currentSession, isPaused, callbacks }: StartHandlerArgs) => {
        let sessionToUpdate = currentSession;
        let updatedSessions = [...allSessions];
        
        // If no session exists for today, create one.
        if (!sessionToUpdate) {
            sessionToUpdate = timerManager._utils.createNewSession({ mode: 'work' });
            updatedSessions.push(sessionToUpdate);
        }

        let steps = sessionToUpdate.steps;
        // If resuming, end the last pause step.
        if (isPaused) {
            steps = timerManager._utils.endLastStep(steps);
        }
        
        // Add a new 'work' step.
        steps = timerManager._utils.addStep(steps, 'work');

        const updatedCurrentSession = { ...sessionToUpdate, steps };
        updatedSessions = updatedSessions.map(s => s.id === updatedCurrentSession.id ? updatedCurrentSession : s);

        callbacks.updateState(updatedSessions, updatedCurrentSession);
    },

    /**
     * Handles the logic for ending the work day.
     */
    handleEnd: ({ allSessions, currentSession, callbacks }: EndHandlerArgs) => {
        if (!currentSession) return;
        
        // End the last step.
        let steps = timerManager._utils.endLastStep(currentSession.steps);

        // Calculate total work time
        const totalWorkTime = steps
          .filter(step => step.type === 'work')
          .reduce((total, step) => {
            const startTime = new Date(step.start).getTime();
            // End time must exist at this point because we just ended the last step
            const endTime = new Date(step.end!).getTime();
            return total + (endTime - startTime);
          }, 0);
          
        const updatedCurrentSession = { 
            ...currentSession, 
            steps,
            end: new Date(), 
            isCompleted: true,
            totalWorkTime,
        };

        const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);
        
        callbacks.updateState(updatedSessions, updatedCurrentSession);
    },
    
    /**
     * Continues a work day that was previously ended.
     */
    continueWork(allSessions: Session[], currentSession: Session | null) {
        if (!currentSession) return null;

        // Mark session as not completed and remove end time.
        let updatedCurrentSession = { 
            ...currentSession, 
            end: null, 
            isCompleted: false 
        };
        
        // Add a new work step to continue.
        const steps = timerManager._utils.addStep(updatedCurrentSession.steps, 'work');
        updatedCurrentSession = { ...updatedCurrentSession, steps };
        
        const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);
        
        return { updatedSessions, updatedCurrentSession };
    }
};
