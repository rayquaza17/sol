// ─── Intent Types ─────────────────────────────────────────────────────────────
//
// 8 mental-health-specific intents + out_of_scope.
// The classifier MUST assign out_of_scope for anything outside
// mental health: technical questions, general knowledge, jokes, math, coding.
//

export type IntentType =
    | 'greeting'
    | 'venting'
    | 'emotional_reflection'
    | 'advice_request'
    | 'reassurance_seeking'
    | 'grounding_request'
    | 'progress_update'
    | 'crisis_signal'
    | 'out_of_scope';

export type ActionType = 'VENT' | 'ADVICE' | 'GREET' | 'REFLECT' | 'GROUND' | 'CRISIS' | 'REDIRECT';

export type EmotionalIntensity = 'LOW' | 'MEDIUM' | 'HIGH';

export type ConversationMode = 'vent' | 'reflect' | 'ground' | 'problemSolve';

export type MoodLevel = 1 | 2 | 3 | 4 | 5 | null;

export type ToneTrend = 'STABLE' | 'ESCALATING' | 'DE_ESCALATING';

/**
 * Ring-buffer state consumed by RepetitionGuard.
 * Kept in ConversationMemory so it survives across turns.
 */
export interface RepetitionState {
    /** Last 5 sentence openers (first ≤6 words, normalised lowercase) */
    recentOpenings: string[];
    /** Last 5 reflective clause extracts */
    recentPhrases: string[];
    /** Last 3 question sentences */
    recentQuestions: string[];
}

/** Coarse emotional valence: negative / neutral / positive */
export type EmotionalPolarity = 'negative' | 'neutral' | 'positive';

/** Compound emotional trend stored per session */
export interface EmotionalTrend {
    /** Overall directional polarity of the conversation so far */
    polarity: EmotionalPolarity;
    /** Numeric intensity score (0 = calm, 10 = most intense) */
    intensityScore: number;
}

/** One of the top-3 most active topics in the session */
export interface ActiveTopic {
    topic: string;
    /** Normalised weight: occurrences / total topic occurrences */
    weight: number;
    occurrences: number;
}

// ─── Memory ──────────────────────────────────────────────────────────────────
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface EmotionFact {
    emotion: IntentType;
    subject?: string;
    turn: number;
    intensity: EmotionalIntensity;
}

export interface TopicMemory {
    topic: string;
    firstTurn: number;
    lastTurn: number;
    occurrences: number;
}

export interface ConversationMemory {
    /** Rolling buffer: last 10 turns (user + assistant messages) */
    messages: ConversationMessage[];
    /** Emotional facts extracted per turn */
    facts: EmotionFact[];
    /** Recurring themes detected across turns */
    topics: TopicMemory[];
    /** Last 5 intensity readings for trend computation */
    intensityHistory: EmotionalIntensity[];
    /** Computed direction of emotional tone */
    toneTrend: ToneTrend;
    /** Last 5 assistant responses for anti-repetition */
    recentResponses: string[];
    /** Total user turns */
    turnCount: number;
    /** IDs of questions already asked in this session (prevents repetition) */
    askedQuestions: Set<string>;
    /** Aggregated emotional polarity + intensity score for the session */
    emotionalTrend: EmotionalTrend;
    /** Ring-buffer state for RepetitionGuard */
    repetition: RepetitionState;
}

// ─── State ───────────────────────────────────────────────────────────────────
export interface ConversationState {
    memory: ConversationMemory;
    intensity: EmotionalIntensity;
    lastIntent: IntentType | null;
}

// ─── Safety ──────────────────────────────────────────────────────────────────
export type SafetyLevel = 'SAFE' | 'MONITOR' | 'CRISIS';

export interface SafetyAssessment {
    level: SafetyLevel;
    triggered: boolean;
    matchedPhrases: string[];
    score: number;
}

// ─── Engine I/O ──────────────────────────────────────────────────────────────
export interface IntentMatch {
    type: IntentType;
    actionType: ActionType;
    /** 0–100 */
    confidence: number;
    matchedKeywords: string[];
    subject?: string;
}

export interface ResponseContext {
    message: string;
    mode?: ConversationMode;
    mood?: MoodLevel;
    history: { role: 'user' | 'assistant'; content: string }[];
    state: ConversationState;
}

export interface EngineResponse {
    content: string;
    intent: IntentMatch;
    isCrisis: boolean;
    safetyLevel: SafetyLevel;
    state: ConversationState;
}
