
import type { Session, LearningObjective } from "@/lib/types";
import { timerManager } from "./timer-manager";

type UpdateStateCallback = (newAllSessions: Session[], newCurrentSession: Session | null) => void;

interface StartHandlerArgs {
    allSessions: Session[];
    currentSession: Session | null;
    isPaused: boolean;
    callbacks: {
        openStartLearningDialog: () => void;
        updateState: UpdateStateCallback;
    };
}

interface EndHandlerArgs {
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


export const learningTimerHandler = {
    /**
     * Handles the start/resume logic for learning mode.
     */
    handleStart: async ({ allSessions, currentSession, isPaused, callbacks }: StartHandlerArgs) => {
        if (currentSession) {
            // If a session exists, just resume it.
            let steps = currentSession.steps;
            if (isPaused) {
                steps = timerManager._utils.endLastStep(steps);
            }
            steps = timerManager._utils.addStep(steps, 'work');
            const updatedCurrentSession = { ...currentSession, steps };
            const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);
            callbacks.updateState(updatedSessions, updatedCurrentSession);
        } else {
            // No active session, so we need to create a new one. Open the dialog.
            callbacks.openStartLearningDialog();
        }
    },

    /**
     * Creates a new learning session and starts it. Called from the StartLearningDialog.
     */
    startLearningSession: ({ allSessions, currentSession, isPaused, goal, objectives, topics, updateState }: StartLearningArgs) => {
        const learningObjectives: LearningObjective[] = objectives.map(obj => ({ text: obj, completed: 0 }));
        
        const newSession = timerManager._utils.createNewSession({
            mode: 'learning',
            learningGoal: goal,
            learningObjectives,
            topics,
        });

        const steps = timerManager._utils.addStep(newSession.steps, 'work');
        const updatedCurrentSession = { ...newSession, steps };
        const updatedSessions = [...allSessions, updatedCurrentSession];
        
        updateState(updatedSessions, updatedCurrentSession);
    },

    /**
     * Handles the logic for ending a learning session.
     */
    handleEnd: ({ allSessions, currentSession, callbacks }: EndHandlerArgs) => {
        if (!currentSession) return;

        // End the current step (if any) and add a temporary "ending" pause.
        // This keeps the timer UI paused while the end dialog is open.
        let steps = timerManager._utils.endLastStep(currentSession.steps);
        steps = timerManager._utils.addStep(steps, 'pause', 'Ending session...');
        
        const updatedCurrentSession = { ...currentSession, steps };
        const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);

        callbacks.updateState(updatedSessions, updatedCurrentSession);
        callbacks.openEndLearningDialog(updatedCurrentSession);
    },

    /**
     * Finalizes the end of a learning session with completion data.
     */
    endLearningSession: ({ allSessions, sessionToEnd, updatedObjectives, totalCompletion }: EndLearningArgs) => {
        const totalWorkTime = sessionToEnd.steps
            .filter(step => step.type === 'work')
            .reduce((total, step) => {
                const startTime = new Date(step.start).getTime();
                const endTime = step.end ? new Date(step.end).getTime() : Date.now();
                return total + (endTime - startTime);
            }, 0);
            
        const completedSession = {
            ...sessionToEnd,
            end: new Date(),
            isCompleted: true,
            learningObjectives: updatedObjectives,
            completionPercentage: totalCompletion,
            totalWorkTime,
            // Remove the temporary "ending" step
            steps: sessionToEnd.steps.filter(step => step.note !== 'Ending session...')
        };

        const updatedSessions = allSessions.map(s => s.id === sessionToEnd.id ? completedSession : s);
        
        return { updatedSessions, updatedCurrentSession: null };
    },

    /**
     * Reverts the "ending" state if the dialog is cancelled.
     */
    cancelEndLearning: (allSessions: Session[], currentSession: Session | null) => {
        if (!currentSession) return { updatedSessions: allSessions, updatedCurrentSession: null };

        // Remove the temporary "ending" pause step.
        let steps = currentSession.steps.slice(0, -1);
        
        // If the previous step was a work step, it needs to be un-ended.
        const lastStep = steps[steps.length - 1];
        if (lastStep && lastStep.type === 'work' && lastStep.end) {
            steps[steps.length - 1] = { ...lastStep, end: null };
        }
        
        const updatedCurrentSession = { ...currentSession, steps };
        const updatedSessions = allSessions.map(s => s.id === currentSession.id ? updatedCurrentSession : s);

        return { updatedSessions, updatedCurrentSession };
    },
};
