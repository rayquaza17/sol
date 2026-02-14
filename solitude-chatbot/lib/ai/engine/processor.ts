import { IntentMatch, IntentType, ResponseContext, EngineResponse, ConversationState } from './types';
import { updateState, createInitialState } from './state-manager';
import { getFlow } from './flows';
import { generateEmpatheticResponse } from './generator';
import { MemoryManager } from './memory';

const KEYWORD_GROUPS: Record<IntentType, string[]> = {
    VENT: ['exhausted', 'tired', 'always', 'never', 'cant stand', 'fed up', 'sick of', 'unfair', 'everything', 'stressed', 'stress', 'overwhelmed', 'pressure', 'burnt out', 'too much', 'piling up'],
    ANXIETY: ['anxious', 'panic', 'heart racing', 'shake', 'worry', 'scared', 'breathless', 'fear', 'nervous', 'exam', 'test', 'deadline', 'dread'],
    SADNESS: ['sad', 'crying', 'depressed', 'empty', 'heavy', 'hopeless', 'grey', 'numb', 'tearful'],
    ANGER: ['angry', 'hate', 'furious', 'mad', 'shout', 'stupid', 'screaming', 'rage', 'frustrated'],
    LONELINESS: ['lonely', 'isolated', 'no one', 'alone', 'ignored', 'forgotten', 'nobody', 'invisible'],
    CONFUSION: ['dont know', 'confused', 'lost', 'uncertain', 'tangled', 'not sure', 'what if'],
    REFLECTION: ['realized', 'learning', 'understand', 'thoughts', 'think', 'journaling', 'reflect', 'situation'],
    GROUNDING: ['ground', 'breathing', 'relax', 'calm down', 'centering', 'help me breathe'],
    CRISIS: ['suicide', 'kill', 'die', 'harm', 'end it', 'want to be gone', 'jump', 'cut ', 'blood', 'pill', 'goodbye', 'wont be here', 'done with life', 'over it', 'better off dead'],
    GREETING: ['hi', 'hello', 'hey', 'greetings', 'morning', 'evening'],
    SMALL_TALK: ['weather', 'robot', 'bot', 'human', 'doing well', 'how are you', 'whats up', 'sup'],
    FACTUAL: [], // Regex derived
    JOKE: ['joke', 'funny', 'haha', 'lol', 'meme', 'laugh', 'kidding'],
    UNCLEAR: [], // Heuristics
    GENERAL: []
};

const PHRASE_WEIGHTS: Record<string, { type: IntentType; weight: number }> = {
    "i want to die": { type: 'CRISIS', weight: 20 },
    "i want to kill myself": { type: 'CRISIS', weight: 20 },
    "i want to hurt myself": { type: 'CRISIS', weight: 15 },
    "don't want to be here": { type: 'CRISIS', weight: 10 },
    "life is not worth living": { type: 'CRISIS', weight: 15 },
    "it's always like this": { type: 'VENT', weight: 5 },
    "i'm so tired of everything": { type: 'VENT', weight: 4 },
    "what should i do": { type: 'CONFUSION', weight: 4 },
    "help me calm down": { type: 'GROUNDING', weight: 6 },
    "i'm feeling so alone": { type: 'LONELINESS', weight: 5 },
    "help me reflect": { type: 'REFLECTION', weight: 6 },
    "can we reflect": { type: 'REFLECTION', weight: 6 }
};

export function detectIntentAdvanced(message: string): IntentMatch {
    const msg = message.toLowerCase();
    const scores: Record<IntentType, number> = {
        VENT: 0, ANXIETY: 0, SADNESS: 0, ANGER: 0, LONELINESS: 0,
        CONFUSION: 0, REFLECTION: 0, GROUNDING: 0, CRISIS: 0,
        GREETING: 0, SMALL_TALK: 0, FACTUAL: 0, JOKE: 0, UNCLEAR: 0,
        GENERAL: 0
    };
    const matchedKeywords: string[] = [];

    // 1. Keyword Matching (Weighted)
    for (const [type, keywords] of Object.entries(KEYWORD_GROUPS)) {
        for (const word of keywords) {
            if (msg.includes(word)) {
                scores[type as IntentType] += 10;
                matchedKeywords.push(word);
            }
        }
    }

    // 2. Phrase Matching (High Weight)
    for (const [phrase, config] of Object.entries(PHRASE_WEIGHTS)) {
        if (msg.includes(phrase)) {
            scores[config.type] += config.weight * 5;
            matchedKeywords.push(phrase);
        }
    }

    // 3. Heuristics
    // Length -> Venting
    if (msg.length > 200) scores.VENT += 15;

    // Punctuation -> Emotion/Confusion
    if (msg.includes('?') && msg.length < 50) scores.CONFUSION += 10;
    if ((msg.match(/!/g) || []).length > 2) scores.ANGER += 10;

    // Factual Pattern (Questions starting with Wh- words)
    // Only applies if no strong emotional keywords found
    const hasEmotionalKeywords = matchedKeywords.some(kw =>
        ['sad', 'angry', 'lonely', 'anxious', 'stress', 'kill', 'die'].some(e => kw.includes(e))
    );

    if (!hasEmotionalKeywords && /^(what|who|where|when|how|why) (is|are|was|were|do|does|can)/i.test(msg)) {
        scores.FACTUAL += 20;
    }

    // Unclear / Nonsense
    if (msg.length < 4 && !scores.GREETING && !scores.SMALL_TALK) {
        // Very short inputs that aren't greetings (e.g. "k", "??")
        scores.UNCLEAR += 20;
    }

    // 4. Calculate Top Intent
    let topIntent: IntentType = 'GENERAL';
    let maxScore = 0;

    for (const [type, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            topIntent = type as IntentType;
        }
    }

    // Default to GENERAL if nothing matched
    if (maxScore === 0) {
        // Fallback checks
        if (msg.includes('?')) topIntent = 'FACTUAL'; // Assume unknown question is factual/general
        else topIntent = 'GENERAL';
    }

    // Normalized Confidence (Simplified)
    const confidence = Math.min(Math.round((maxScore / (maxScore + 20)) * 100), 100);

    return {
        type: topIntent,
        confidence,
        matchedKeywords: Array.from(new Set(matchedKeywords))
    };
}

export async function processMessage(context: ResponseContext): Promise<EngineResponse> {
    const intent = detectIntentAdvanced(context.message);

    // Update State (handles exit command intrinsically)
    const prevState = context.state || createInitialState(context.mode);
    let newState = updateState(prevState, context.message, intent, context.history[context.history.length - 1]?.content || null);

    // 1. Handle Active Flow Progression
    if (newState.activeFlowId) {
        const flow = getFlow(newState.activeFlowId);
        if (flow) {
            let nextStepIndex = newState.currentStepIndex + 1;

            // Skip already asked questions (using memory deduplication)
            while (
                nextStepIndex < flow.steps.length &&
                MemoryManager.isQuestionAlreadyAsked(flow.steps[nextStepIndex].question, newState.memory)
            ) {
                nextStepIndex++;
            }

            if (nextStepIndex < flow.steps.length) {
                const nextStep = flow.steps[nextStepIndex];
                newState.currentStepIndex = nextStepIndex;

                return {
                    content: nextStep.question,
                    intent,
                    isCrisis: intent.type === 'CRISIS',
                    state: newState
                };
            } else {
                // Flow Complete
                newState.activeFlowId = null;
                newState.currentStepIndex = -1;
                newState.flowAnswers = [];
                // Fall through to general response after completion
            }
        }
    }

    // 2. Initiate New Flow if appropriate
    if (!newState.activeFlowId && intent.type === 'REFLECTION' && intent.confidence > 50) {
        const flowId = 'SITUATION_REFLECT';
        const flow = getFlow(flowId);
        if (flow) {
            // Check if the first question has already been asked
            const firstStepIdx = flow.steps.findIndex(
                step => !MemoryManager.isQuestionAlreadyAsked(step.question, newState.memory)
            );

            if (firstStepIdx >= 0) {
                newState.activeFlowId = flowId;
                newState.currentStepIndex = firstStepIdx;
                return {
                    content: flow.steps[firstStepIdx].question,
                    intent,
                    isCrisis: false,
                    state: newState
                };
            }
            // If all flow questions have been asked, fall through to general response
        }
    }

    // 3. Advanced Response Generation (Assembled Fragments)
    const { content, newState: finalState } = generateEmpatheticResponse(context, newState, intent);

    return {
        content,
        intent,
        isCrisis: intent.type === 'CRISIS',
        state: finalState
    };
}
