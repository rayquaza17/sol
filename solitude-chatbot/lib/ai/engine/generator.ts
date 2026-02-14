import { ResponseContext, IntentType, ConversationState, IntentMatch } from './types';
import {
    ACKNOWLEDGEMENTS,
    REFLECTIONS,
    INSIGHTS,
    GENTLE_QUESTIONS,
    INTENT_QUESTIONS,
    CONNECTORS
} from './registry';
import { MemoryManager } from './memory';

// Helper to select a random item that hasn't been used recently
function selectFreshPhrase(pool: string[], usedPhrases: string[]): string {
    const available = pool.filter(p => !usedPhrases.includes(p));
    if (available.length === 0) {
        // Reset if all used, pick random from full pool
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
}

// Randomly select a connector, occasionally returning empty string for directness
function addConnector(pool: string[]): string {
    if (Math.random() < 0.4) {
        return pool[Math.floor(Math.random() * pool.length)];
    }
    return "";
}

export function generateEmpatheticResponse(
    context: ResponseContext,
    state: ConversationState,
    intentMatch: IntentMatch
): { content: string, newState: ConversationState } {
    const intent = intentMatch.type;
    const newState = { ...state };

    // Deep copy memory to avoid mutation issues
    const memory = {
        ...newState.memory,
        shortTerm: { ...newState.memory.shortTerm },
        facts: [...newState.memory.facts],
        askedQuestions: [...newState.memory.askedQuestions],
        exploredTopics: [...newState.memory.exploredTopics],
        topicTurnCount: { ...newState.memory.topicTurnCount },
        usedPhrases: [...newState.memory.usedPhrases],
        usedCallbacks: [...newState.memory.usedCallbacks]
    };
    const newUsedPhrases = [...memory.usedPhrases];

    // 1. Crisis Override — always highest priority, singular focused message
    if (intent === 'CRISIS') {
        const pool = INSIGHTS.CRISIS;
        const msg = pool[Math.floor(Math.random() * pool.length)];
        return { content: msg, newState };
    }

    // 1b. Boundary Intents — Skip standard flow
    // These intents get a specific redirection message (stored in INSIGHTS)
    const BOUNDARY_INTENTS: IntentType[] = ['SMALL_TALK', 'FACTUAL', 'JOKE', 'UNCLEAR'];
    if (BOUNDARY_INTENTS.includes(intent)) {
        const pool = INSIGHTS[intent] || INSIGHTS.GENERAL;
        const msg = selectFreshPhrase(pool, newUsedPhrases);
        newUsedPhrases.push(msg);

        newState.memory = { ...memory, usedPhrases: newUsedPhrases };
        return { content: msg, newState };
    }

    // 2. Build Response Components following strict structure:
    // Acknowledge -> Reflect/Callback -> Insight -> Optional Question
    const components: string[] = [];

    // Detect "Quiet Mode" — short, low intensity inputs warrant varied, calmer responses
    const isQuietMode = state.intensity === 'LOW' && context.message.length < 50;

    // --- Component A: Acknowledgement ---
    // Ground the user immediately. 
    let ackPool = ACKNOWLEDGEMENTS.DEFAULT;
    if (state.intensity === 'HIGH' || state.keyEmotions.length > 2) {
        ackPool = [...ACKNOWLEDGEMENTS.DEFAULT, ...ACKNOWLEDGEMENTS.HIGH_INTENSITY];
    }

    const acknowledgement = selectFreshPhrase(ackPool, newUsedPhrases);
    components.push(acknowledgement);
    newUsedPhrases.push(acknowledgement);

    // --- Component B: Reflection, Callback, or Topic Acknowledgement ---
    // Proof of listening. Paraphrase or reference history.
    let reflection = "";

    // Priority 1: If a topic resurfaced and was already explored, acknowledge it
    const topicAck = MemoryManager.getTopicAcknowledgement(context.message, memory, intentMatch);
    if (topicAck) {
        reflection = topicAck;
    }
    // Priority 2: Contextual callback (referencing earlier facts)
    else {
        const continuityCallback = MemoryManager.getContinuityCallback(
            memory,
            context.message,
            intentMatch
        );
        if (continuityCallback) {
            reflection = continuityCallback;
        }
        // Priority 3: Standard reflection based on intent
        // In Quiet Mode, we might skip this to match the user's brevity (50% chance)
        else if (!isQuietMode || Math.random() < 0.5) {
            const reflectPool = REFLECTIONS[intent] || REFLECTIONS.GENERAL;
            reflection = selectFreshPhrase(reflectPool, newUsedPhrases);
        }
    }

    if (reflection) {
        components.push(reflection);
        newUsedPhrases.push(reflection);
    }

    // --- Component C: Insight ---
    // Offer one new perspective or reframe. 
    // Use a connector to make the transition less robotic.
    const insightPool = INSIGHTS[intent] || INSIGHTS.GENERAL;
    let insight = selectFreshPhrase(insightPool, newUsedPhrases);

    // Add connector occasionally for flow variation
    const connector = addConnector(CONNECTORS.TO_INSIGHT);
    if (connector) {
        insight = `${connector} ${insight.charAt(0).toLowerCase() + insight.slice(1)}`;
    }

    components.push(insight);
    newUsedPhrases.push(insight);


    // --- Component D: Optional Question (Cadence Control) ---
    // Only ask if we haven't asked recently, to prevent interrogation vibes.
    // Rule: Ask question only once every 3 turns roughly.
    // In Quiet Mode, prefer stillness (Statement) over Question.
    const turnsSinceLastQ = memory.turnsSinceLastQuestion;
    const baseCadenceMet = turnsSinceLastQ >= 3 || intent === 'GREETING';

    // Adjust probability: 75% normally, 30% in Quiet Mode
    const probability = isQuietMode ? 0.3 : 0.75;

    if (baseCadenceMet && Math.random() < probability) {
        // Try intent-specific questions first (more relevant)
        const intentPool = INTENT_QUESTIONS[intent] || [];
        let question = MemoryManager.getAvailableQuestion(intentPool, memory);

        // Fallback to generic questions if intent pool exhausted
        if (!question) {
            question = MemoryManager.getAvailableQuestion(GENTLE_QUESTIONS, memory);
        }

        // Only add if we found a fresh question (never repeat)
        if (question) {
            // Add connector for natural flow
            const qConnector = addConnector(CONNECTORS.TO_QUESTION);
            if (qConnector) {
                question = `${qConnector} ${question.charAt(0).toLowerCase() + question.slice(1)}`;
            }

            components.push(question);
            newUsedPhrases.push(question);
            memory.turnsSinceLastQuestion = 0;
        } else {
            memory.turnsSinceLastQuestion++;
        }
    } else {
        // Did not ask a question this turn
        memory.turnsSinceLastQuestion++;
    }

    // 3. Assemble and cleanup
    // Limit usedPhrases history to avoid memory bloat
    if (newUsedPhrases.length > 40) {
        newUsedPhrases.splice(0, newUsedPhrases.length - 40);
    }

    newState.memory = {
        ...memory,
        usedPhrases: newUsedPhrases
    };

    const content = components.join(" ");
    return { content, newState };
}
