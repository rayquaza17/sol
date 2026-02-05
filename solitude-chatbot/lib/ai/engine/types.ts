import { ConversationMode, MoodLevel } from '../service';

export type IntentType =
    | 'VENT'
    | 'ANXIETY'
    | 'SADNESS'
    | 'ANGER'
    | 'LONELINESS'
    | 'CONFUSION'
    | 'REFLECTION'
    | 'GROUNDING'
    | 'CRISIS'
    | 'GREETING'
    | 'GENERAL';

export type EmotionalIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConversationMemory {
    shortTerm: {
        user: string[];
        assistant: string[];
    };
    facts: {
        emotions: string[];
        events: string[];
        concerns: string[];
    };
    askedQuestions: string[];
    answers: Record<string, string>;
    usedPhrases: string[];
    turnsSinceLastQuestion: number;
}

export interface ConversationState {
    mode: ConversationMode;
    lastQuestion: string | null;
    intensity: EmotionalIntensity;
    startTime: number;
    messageCount: number;
    activeFlowId: string | null;
    currentStepIndex: number;
    flowAnswers: string[];
    lastResponseIndices: Record<string, number>;
    keyEmotions: string[];
    lastIntensity: EmotionalIntensity | null;
    memory: ConversationMemory;
}

export interface FlowStep {
    question: string;
    description?: string;
}

export interface GuidedFlow {
    id: string;
    name: string;
    steps: FlowStep[];
}

export interface IntentMatch {
    type: IntentType;
    confidence: number;
    matchedKeywords: string[];
}

export interface ResponseContext {
    message: string;
    mode: ConversationMode;
    mood: MoodLevel;
    history: { role: 'user' | 'assistant'; content: string }[];
    state?: ConversationState;
}

export interface EngineResponse {
    content: string;
    intent: IntentMatch;
    isCrisis: boolean;
    state: ConversationState;
    metadata?: Record<string, any>;
}

export type ResponseGenerator = (context: ResponseContext) => string;
export type IntentDetector = (message: string, context: ResponseContext) => IntentMatch;
