import { processMessage } from './engine/processor';
import { ConversationMode, MoodLevel } from './engine/types';

export type { ConversationMode, MoodLevel };

export const CRISIS_WORDS = ['suicide', 'kill', 'die', 'harm', 'end it'];

/**
 * @deprecated Use engine/processor.ts for full stateful conversation.
 * This remains for simple legacy lookups or quick crisis detection.
 */
export function detectCrisis(message: string): string | null {
    const msg = message.toLowerCase();
    if (CRISIS_WORDS.some(word => msg.includes(word))) {
        return "I'm really holding space for you right now. Please know you're not alone. If you're in India, please call AASRA at 91-9820466726 (24/7) or iCall at 9152987821. Your life matters deeply.";
    }
    return null;
}

/**
 * @deprecated Use processMessage from engine/processor.ts instead.
 */
export async function getCustomResponse(message: string, mode: ConversationMode, mood: MoodLevel): Promise<string> {
    const crisis = detectCrisis(message);
    if (crisis) return crisis;

    // Fallback to engine processor with no state
    // Note: Stateful use via /api/chat is preferred.
    const result = await processMessage({
        message,
        mode,
        mood,
        history: []
    });
    return result.content;
}
