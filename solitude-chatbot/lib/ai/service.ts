import { getLocalResponse } from './local-model';

export type ConversationMode = 'vent' | 'reflect' | 'ground' | 'problemSolve';
export type MoodLevel = 1 | 2 | 3 | 4 | 5 | null;

export const CRISIS_WORDS = ['suicide', 'kill', 'die', 'harm', 'end it'];

export function detectCrisis(message: string): string | null {
    const msg = message.toLowerCase();
    if (CRISIS_WORDS.some(word => msg.includes(word))) {
        return "I'm really holding space for you right now. Please know you're not alone. If you're in India, please call AASRA at 91-9820466726 (24/7) or iCall at 9152987821. Your life matters deeply.";
    }
    return null;
}

export function getCustomResponse(message: string, mode: ConversationMode, mood: MoodLevel): string {
    // Immediate Crisis Check
    const crisis = detectCrisis(message);
    if (crisis) return crisis;

    // Get patterned response
    return getLocalResponse(message, mode, mood);
}
