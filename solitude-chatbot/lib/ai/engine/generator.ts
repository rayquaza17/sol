import { ResponseContext, IntentType, ConversationState, IntentMatch } from './types';
import { ACKNOWLEDGEMENTS, REFLECTIONS, INSIGHTS, GENTLE_QUESTIONS } from './registry';
import { MemoryManager } from './memory';

// Helper to select a random item that hasn't been used recently
function selectFreshPhrase(pool: string[], usedPhrases: string[]): string {
    const available = pool.filter(p => !usedPhrases.includes(p));
    if (available.length === 0) {
        // Reset if all used, or just pick random from full pool
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
}

export function generateEmpatheticResponse(
    context: ResponseContext,
    state: ConversationState,
    intentMatch: IntentMatch
): { content: string, newState: ConversationState } {
    const intent = intentMatch.type;
    const newState = { ...state };

    // Copy memory to avoid mutation issues
    const memory = { ...newState.memory };
    const newUsedPhrases = [...memory.usedPhrases];

    // 1. Crisis Override
    if (intent === 'CRISIS') {
        const pool = INSIGHTS.CRISIS;
        // Crisis messages should always be available, even if used
        const msg = pool[Math.floor(Math.random() * pool.length)];
        return { content: msg, newState };
    }

    // 2. Build Response Components
    const components: string[] = [];

    // --- Component A: Acknowledgement ---
    // Higher intensity -> Use High Intensity Acknowledgements
    let ackPool = ACKNOWLEDGEMENTS.DEFAULT;
    if (state.intensity === 'HIGH' || state.keyEmotions.length > 2) {
        ackPool = [...ACKNOWLEDGEMENTS.DEFAULT, ...ACKNOWLEDGEMENTS.HIGH_INTENSITY];
    }

    const acknowledgement = selectFreshPhrase(ackPool, newUsedPhrases);
    components.push(acknowledgement);
    newUsedPhrases.push(acknowledgement);

    // --- Component B: Reflection (or Callback) ---
    // Check for continuity callback first
    const continuityCallback = MemoryManager.getContinuityCallback(memory);
    let reflection = "";

    if (continuityCallback && Math.random() < 0.3) {
        // Use callback instead of standard reflection
        reflection = continuityCallback;
    } else {
        // Standard Reflection based on intent
        const reflectPool = REFLECTIONS[intent] || REFLECTIONS.GENERAL;
        reflection = selectFreshPhrase(reflectPool, newUsedPhrases);
    }
    components.push(reflection);
    newUsedPhrases.push(reflection);

    // --- Component C: Insight ---
    const insightPool = INSIGHTS[intent] || INSIGHTS.GENERAL;
    const insight = selectFreshPhrase(insightPool, newUsedPhrases);
    components.push(insight);
    newUsedPhrases.push(insight);

    // --- Component D: Optional Question (Cadence Check) ---
    // Only ask if we haven't asked in a while (e.g., > 2 turns)
    // Greeting always gets a question if it feels natural, or skip.
    // For general flow, respect cadence.
    let question = "";
    const shouldAskQuestion = memory.turnsSinceLastQuestion > 2 || intent === 'GREETING';

    if (shouldAskQuestion && Math.random() < 0.7) {
        // 70% chance even if cadence allows, to be natural
        question = selectFreshPhrase(GENTLE_QUESTIONS, newUsedPhrases);
        components.push(question);
        newUsedPhrases.push(question);
        // Note: turnsSinceLastQuestion will be reset in next State Update via MemoryManager if assistant msg has '?'
    }

    // 3. Assemble and cleanup
    // Limit usedPhrases history to last 20 items to prevent memory bloat
    if (newUsedPhrases.length > 20) {
        newUsedPhrases.splice(0, newUsedPhrases.length - 20);
    }

    newState.memory = {
        ...memory,
        usedPhrases: newUsedPhrases
    };

    const content = components.join(" ");
    return { content, newState };
}
