import {
    PresentationPattern,
    PresentationState,
    ConversationState,
    ConversationStage,
    ActionType,
    IntentMatch
} from './types';

// ─── Constants ──────────────────────────────────────────────────────

const MAX_RESPONSE_HISTORY = 3;
const MAX_PATTERN_HISTORY = 3;
const MAX_SENTENCES = 2;
// ─── Flow Anchor Stage Transitions ──────────────────────────────────

export function determineStageTransition(
    currentStage: ConversationStage,
    intentMatch: IntentMatch,
    messageCount: number
): ConversationStage {
    const { actionType, type: intentType } = intentMatch;

    // Reset to opening on greeting
    if (actionType === 'GREET' || intentType === 'GREETING') {
        return 'opening';
    }

    // opening → exploring: User shares emotion/concern
    if (currentStage === 'opening' &&
        (intentType === 'VENT' || intentType === 'ANXIETY' || intentType === 'SADNESS' ||
            intentType === 'ANGER' || intentType === 'LONELINESS' || intentType === 'CONFUSION')) {
        return 'exploring';
    }

    // exploring → grounding: User asks for advice or deeper reflection
    if (currentStage === 'exploring' && actionType === 'ADVICE') {
        return 'grounding';
    }

    // Stay in current stage
    return currentStage;
}

// ─── Topic Extraction ───────────────────────────────────────────────

export function extractTopicWord(message: string): string {
    const priorityWords = [
        'exam', 'test', 'stress', 'work', 'job', 'family', 'friend', 'relationship',
        'anxiety', 'pressure', 'tired', 'overwhelmed', 'depressed', 'sad', 'angry',
        'lonely', 'scared', 'worried', 'nervous', 'exhausted', 'college', 'school',
        'parent', 'sibling', 'deadline', 'project', 'assignment', 'boss', 'teacher'
    ];

    const words = message.toLowerCase().split(/\s+/);

    // Find priority word
    for (const word of words) {
        for (const priority of priorityWords) {
            if (word.includes(priority)) {
                return priority;
            }
        }
    }

    // Fallback: longest non-stopword (>4 chars)
    const stopWords = new Set(['that', 'this', 'with', 'have', 'from', 'they', 'been', 'were', 'what', 'when', 'where', 'which', 'about', 'their', 'there', 'would', 'could', 'should']);
    const longWords = words.filter(w => w.length > 4 && !stopWords.has(w));

    return longWords[0] || '';
}

// ─── Natural Response Builder ───────────────────────────────────────

export function constructNaturalResponse(
    stage: ConversationStage,
    intentMatch: IntentMatch,
    topic: string,
    rawResponse: string,
    lastResponse: string
): string {
    const { actionType, type: intentType } = intentMatch;

    // 1. SELECT ACKNOWLEDGMENT (Warm, casual particles)
    const acknowledgments = {
        opening: ["Hey.", "Hi.", "I'm here.", "Yeah..."],
        exploring: ["I get that.", "Makes sense.", "I see what you mean.", "Yeah..."],
        grounding: ["I hear you.", "That makes sense.", "I get it.", "Right..."]
    };

    const particlePool = acknowledgments[stage] || acknowledgments.exploring;
    let particle = particlePool[Math.floor(Math.random() * particlePool.length)];

    // Block structural repetition: If last response started with any of these, pick another
    const blockedOpenings = ["I hear", "It sounds", "I can tell"];
    const lastOpener = lastResponse.toLowerCase().slice(0, 15);

    if (blockedOpenings.some(b => lastOpener.startsWith(b.toLowerCase()))) {
        // Force casual particle instead of repeating "I hear..." style
        if (particle.toLowerCase().includes("hear")) {
            particle = "Yeah...";
        }
    }

    // 2. CONSTRUCT ADAPTIVE SENTENCE
    const sentences = rawResponse.split(/[.!?]+/).filter(s => s.trim());
    let adaptiveSentence = sentences[0] || "I'm with you.";

    // If we have a topic, ensure it's anchored but naturally
    if (topic && !adaptiveSentence.toLowerCase().includes(topic.toLowerCase())) {
        const connectors = [
            `${topic} can be a lot to carry.`,
            `handling ${topic} is tough.`,
            `${topic} can definitely feel heavy.`
        ];
        adaptiveSentence = connectors[Math.floor(Math.random() * connectors.length)];
    }

    // 3. INTENT SPECIFIC ADDITION (Only for Grounding/Advice)
    if (stage === 'grounding' || actionType === 'ADVICE') {
        const suggestions = [
            "Maybe focus on just one thing for now.",
            "Try taking it one small step at a time.",
            "Starting with what's right in front of you helps.",
            "Focusing on today is usually enough."
        ];
        adaptiveSentence += " " + suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    // 4. COMBINE (Strict 2 sentence limit)
    const finalResponse = `${particle} ${adaptiveSentence}`.trim();
    const finalSentences = finalResponse.split(/[.!?]+/).filter(s => s.trim());

    return finalSentences.slice(0, 2).join('. ') + '.';
}

// ─── State Update ───────────────────────────────────────────────────

export function updatePresentationState(
    state: PresentationState,
    response: string,
    pattern: PresentationPattern,
    hasQuestion: boolean,
    newStage: ConversationStage,
    currentTopic: string
): PresentationState {
    // Track stage repetition
    const stageRepetitionCount = newStage === state.conversationStage
        ? state.stageRepetitionCount + 1
        : 0;

    return {
        lastResponses: [
            ...state.lastResponses.slice(-MAX_RESPONSE_HISTORY + 1),
            response
        ],
        lastPatterns: [
            ...state.lastPatterns.slice(-MAX_PATTERN_HISTORY + 1),
            pattern
        ],
        questionCount: state.questionCount + (hasQuestion ? 1 : 0),
        enabled: state.enabled,
        conversationStage: newStage,
        stageRepetitionCount,
        lastUserTopic: currentTopic
    };
}

// ─── Main Presentation Mode Function ────────────────────────────────

export function applyPresentationMode(
    rawResponse: string,
    userMessage: string,
    state: ConversationState,
    intentMatch: IntentMatch
): { presentationResponse: string; newPresentationState: PresentationState } {

    // Skip if presentation mode is disabled
    if (!state.presentationState.enabled) {
        return {
            presentationResponse: rawResponse,
            newPresentationState: state.presentationState
        };
    }

    // 1. INPUT EXTRACTION (Topic + Intent)
    const topic = extractTopicWord(userMessage);
    const lastResponse = state.presentationState.lastResponses[state.presentationState.lastResponses.length - 1] || "";

    // 2. STAGE DETERMINATION
    const newStage = determineStageTransition(
        state.presentationState.conversationStage,
        intentMatch,
        state.messageCount
    );

    // 3. SINGLE PASS NATURAL CONSTRUCTION
    let response = constructNaturalResponse(
        newStage,
        intentMatch,
        topic,
        rawResponse,
        lastResponse
    );

    // 4. PACING & VALIDATION (Strict 2 sentence limit)
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());
    const finalSentences = sentences.slice(0, MAX_SENTENCES); // MAX_SENTENCES is now 2

    // Ensure it has at least one sentence
    const pacedResponse = finalSentences.length > 0
        ? finalSentences.join('. ').trim() + '.'
        : "Yeah... I'm with you.";

    // 5. UPDATE STATE
    const newPresentationState = updatePresentationState(
        state.presentationState,
        pacedResponse,
        'REFLECTIVE_PRESENCE', // Default pattern as we moved to stage-based
        pacedResponse.includes('?'),
        newStage,
        topic
    );

    return {
        presentationResponse: pacedResponse,
        newPresentationState
    };
}
