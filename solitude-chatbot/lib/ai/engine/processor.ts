import { IntentMatch, IntentType, ResponseContext, EngineResponse, ConversationState } from './types';
import { updateState, createInitialState } from './state-manager';
import { getFlow } from './flows';
import { generateEmpatheticResponse } from './generator';

const KEYWORD_GROUPS: Record<IntentType, string[]> = {
    VENT: ['exhausted', 'tired', 'always', 'never', 'cant stand', 'fed up', 'sick of', 'unfair', 'everything'],
    ANXIETY: ['anxious', 'panic', 'heart racing', 'shake', 'worry', 'scared', 'breathless', 'fear'],
    SADNESS: ['sad', 'crying', 'depressed', 'empty', 'heavy', 'hopeless', 'lonely', 'grey'],
    ANGER: ['angry', 'hate', 'furious', 'mad', 'shout', 'stupid', 'screaming', 'rage'],
    LONELINESS: ['lonely', 'isolated', 'no one', 'alone', 'ignored', 'forgotten'],
    CONFUSION: ['dont know', 'confused', 'lost', 'uncertain', 'tangled', 'not sure', 'what if'],
    REFLECTION: ['realized', 'learning', 'understand', 'thoughts', 'think', 'journaling', 'reflect', 'situation'],
    GROUNDING: ['ground', 'breathing', 'relax', 'calm down', 'centering', 'help me breathe'],
    CRISIS: ['suicide', 'kill', 'die', 'harm', 'end it', 'want to be gone', 'jump', 'cut ', 'blood', 'pill', 'goodbye', 'wont be here', 'done with life', 'over it', 'better off dead'],
    GREETING: ['hi', 'hello', 'hey', 'greetings', 'morning', 'evening'],
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
        GREETING: 0, GENERAL: 0
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

    // 4. Calculate Top Intent
    let topIntent: IntentType = 'GENERAL';
    let maxScore = 0;

    for (const [type, score] of Object.entries(scores)) {
        if (score > maxScore) {
            maxScore = score;
            topIntent = type as IntentType;
        }
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
    const msg = context.message.toLowerCase();

    // Update State (handles exit command intrinsically)
    const prevState = context.state || createInitialState(context.mode);
    let newState = updateState(prevState, context.message, intent, context.history[context.history.length - 1]?.content || null);

    // 1. Handle Active Flow Progression
    if (newState.activeFlowId) {
        const flow = getFlow(newState.activeFlowId);
        if (flow) {
            let nextStepIndex = newState.currentStepIndex + 1;

            // Skip already asked questions
            while (
                nextStepIndex < flow.steps.length &&
                newState.memory.askedQuestions.includes(flow.steps[nextStepIndex].question)
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
            newState.activeFlowId = flowId;
            newState.currentStepIndex = 0;
            return {
                content: flow.steps[0].question,
                intent,
                isCrisis: false,
                state: newState
            };
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
