import { ConversationState, IntentType, EmotionalIntensity, IntentMatch } from './types';
import { ConversationMode } from '../service';
import { MemoryManager, createInitialMemory } from './memory';

const INTENSE_WORDS = ['always', 'never', 'hate', 'horrible', 'impossible', 'cant stand', 'destroying', 'ruining', 'suffocating'];

export function createInitialState(mode: ConversationMode): ConversationState {
    return {
        mode,
        lastQuestion: null,
        intensity: 'LOW',
        startTime: Date.now(),
        messageCount: 0,
        activeFlowId: null,
        currentStepIndex: -1,
        flowAnswers: [],
        lastResponseIndices: {},
        keyEmotions: [],
        lastIntensity: null,
        memory: createInitialMemory()
    };
}

export function detectIntensity(message: string): EmotionalIntensity {
    const msg = message.toLowerCase();
    let score = 0;

    // Check for intense words
    for (const word of INTENSE_WORDS) {
        if (msg.includes(word)) score += 2;
    }

    // Check for punctuation
    const exclamationCount = (msg.match(/!/g) || []).length;
    score += exclamationCount * 1.5;

    // Check for caps (simplified)
    const upperCount = (message.match(/[A-Z]/g) || []).length;
    const lowerCount = (message.match(/[a-z]/g) || []).length;
    if (upperCount > 5 && upperCount > lowerCount) score += 3;

    if (score > 6) return 'HIGH';
    if (score > 2) return 'MEDIUM';
    return 'LOW';
}

export function updateState(
    prevState: ConversationState,
    message: string,
    intent: IntentMatch,
    lastAssistantMessage: string | null
): ConversationState {
    const newIntensity = detectIntensity(message);
    const msg = message.toLowerCase();

    // Key Emotion Extraction
    const newKeyEmotions = [...prevState.keyEmotions];
    intent.matchedKeywords.forEach(kw => {
        if (!newKeyEmotions.includes(kw) && kw.length > 3) {
            newKeyEmotions.unshift(kw);
        }
    });

    // Update Memory — now with intent for richer topic tracking
    const newMemory = MemoryManager.update(prevState, message, lastAssistantMessage, intent);

    // Check for flow exit
    if (prevState.activeFlowId && (msg === 'exit' || msg === 'stop' || msg === 'end')) {
        return {
            ...prevState,
            activeFlowId: null,
            currentStepIndex: -1,
            flowAnswers: [],
            lastQuestion: lastAssistantMessage,
            lastIntensity: prevState.intensity,
            intensity: newIntensity,
            keyEmotions: newKeyEmotions.slice(0, 5),
            memory: newMemory
        };
    }

    // Accumulate answers if in flow
    const newFlowAnswers = [...prevState.flowAnswers];
    if (prevState.activeFlowId && prevState.currentStepIndex >= 0) {
        newFlowAnswers.push(message);
    }

    return {
        ...prevState,
        intensity: newIntensity,
        messageCount: prevState.messageCount + 1,
        lastQuestion: lastAssistantMessage,
        flowAnswers: newFlowAnswers,
        lastIntensity: prevState.intensity,
        keyEmotions: newKeyEmotions.slice(0, 5),
        memory: newMemory
    };
}
