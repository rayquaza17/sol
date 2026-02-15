export type ConversationMode = 'vent' | 'reflect' | 'ground' | 'problemSolve';
export type MoodLevel = 1 | 2 | 3 | 4 | 5 | null;

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

export type ActionType = 'ADVICE' | 'VENT' | 'GREET' | 'CASUAL' | 'INFO' | 'QUESTION';

export type EmotionalIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export type FactType = 'emotion' | 'event' | 'concern';

export type ResponseType = 'reflection' | 'short_ack' | 'gentle_suggestion' | 'quiet_presence' | 'light_curiosity';

export type UserEnergyLevel = 'casual' | 'intense' | 'neutral';

export type ResponseDepth = 'SHORT_PRESENCE' | 'REFLECTIVE_ENGAGEMENT' | 'SUPPORTIVE_EXPANSION';

export type PresentationPattern = 'REFLECTIVE_PRESENCE' | 'GENTLE_ADVICE' | 'CASUAL_ACKNOWLEDGMENT';

export type ConversationStage = 'opening' | 'exploring' | 'grounding';

export interface HumanizationState {
    lastSentenceOpeners: string[];      // Last 5 sentence openers
    lastResponseTypes: ResponseType[];  // Last 3 response types
    lastResponseDepths: ResponseDepth[]; // Last 3 response depths
    userEnergyLevel: UserEnergyLevel;   // Detected user energy
    shortFormCount: number;             // Track short-form responses
    totalResponses: number;             // Total responses for ratio calculation
    consecutiveShortCount: number;      // Track consecutive short responses
}

export interface PresentationState {
    lastResponses: string[];            // Last 3 full responses for loop detection
    lastPatterns: PresentationPattern[]; // Last 3 patterns used
    questionCount: number;              // Track question frequency
    enabled: boolean;                   // Presentation mode toggle
    conversationStage: ConversationStage; // Current flow anchor stage
    stageRepetitionCount: number;       // Track same-stage responses
    lastUserTopic: string;              // For continuity tracking
}

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
    recentOpeners: string[];           // Tracking Step A / start of sentences
    recentPhrases: string[];           // Tracking Step B / insights / components
    recentQuestions: string[];         // Tracking Step C / Questions (deduplicated strings)
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
    lastKeywords: string[];            // Keywords from previous user turn
    memory: ConversationMemory;
    humanizationState: HumanizationState;
    presentationState: PresentationState; // NEW: Presentation mode state
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
    actionType: ActionType;
    confidence: number;
    matchedKeywords: string[];
    subject?: string;                 // Extracted "anchor" word
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
