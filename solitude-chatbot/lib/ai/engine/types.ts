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
    | 'SMALL_TALK'
    | 'FACTUAL'
    | 'JOKE'
    | 'UNCLEAR'
    | 'GENERAL';

export type EmotionalIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export type FactType = 'emotion' | 'event' | 'concern';

export interface ConversationFact {
    type: FactType;
    value: string;
    label: string;       // Human-readable description, e.g. "exam stress"
    turnRecorded: number;
    intensity: EmotionalIntensity;
}

export interface TrackedQuestion {
    original: string;     // The original question text
    normalized: string;   // Lowercased, stripped version for deduplication
    turnAsked: number;
    answered: boolean;
    answer?: string;
}

export interface ConversationMemory {
    shortTerm: {
        user: string[];
        assistant: string[];
    };
    facts: ConversationFact[];
    askedQuestions: TrackedQuestion[];
    exploredTopics: string[];          // Topics discussed for >= 2 turns
    topicTurnCount: Record<string, number>;
    usedPhrases: string[];
    usedCallbacks: string[];           // Track used callback phrases
    turnsSinceLastCallback: number;
    turnsSinceLastQuestion: number;
    totalTurns: number;
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
