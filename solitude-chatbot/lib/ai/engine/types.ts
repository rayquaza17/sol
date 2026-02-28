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

export type ToneTrend = 'STABLE' | 'ESCALATING' | 'DE_ESCALATING';

/** Coarse emotional valence: negative / neutral / positive */
export type EmotionalPolarity = 'negative' | 'neutral' | 'positive';

/**
 * Conversation stage derived from turn count.
 * Drives phrase bank selection in ResponseGenerator.
 *   early  — turns 0–4   (exploratory, open)
 *   middle — turns 5–12  (structured, contextual)
 *   later  — turns 13+   (consolidating, reinforcing)
 */
export type ConversationStage = 'early' | 'middle' | 'later';

// ─── Response Planning ────────────────────────────────────────────────────────

/**
 * Structural strategy the ResponsePlanner selects for a given turn.
 * Drives phrase-bank selection and assembly order inside ResponseGenerator.
 */
export type ResponsePlanType =
    | 'anchor_reflection_curiosity'  // venting, emotional_reflection
    | 'anchor_structured_suggestion' // advice_request
    | 'normalization_grounding'      // reassurance_seeking
    | 'grounding_exercise'           // grounding_request
    | 'encouragement_continuity'     // progress_update
    | 'warm_greeting'                // greeting
    | 'crisis_override'              // crisis_signal
    | 'domain_redirect';             // out_of_scope

/**
 * Plan produced by ResponsePlanner and consumed by ResponseGenerator.
 * Encapsulates ALL structural decisions for a single turn.
 */
export interface ResponsePlan {
    /** Which structural strategy to use when assembling the response. */
    planType: ResponsePlanType;
    /** Whether to include a question in this response. */
    useQuestion: boolean;
    /** Whether to weave the top active memory topic into the anchor sentence. */
    topicBridge: boolean;
    /** Tone trend propagated from memory — drives reflection phrase selection. */
    toneHint: ToneTrend;
    /** Conversation stage — drives early/middle/later phrase variant selection. */
    stage: ConversationStage;
    /** Emotional polarity — selects between negative/neutral/positive reflection banks. */
    emotionalContext: EmotionalPolarity;
    /**
     * True when the trend is persistently negative (last 3 HIGH intensity turns)
     * AND emotional polarity is negative. Triggers a grounding override in the continuation.
     */
    forceGrounding: boolean;
    /**
     * Monotonically incrementing index from memory.topicPhraseIndex.
     * Used to rotate which topic bridge phrasing is selected — avoids repeating
     * "especially with what's been coming up around X" every turn.
     */
    topicPhraseIndex: number;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5 | null;

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
    /**
     * First word of each of the last 3 questions asked ('What', 'How', 'Is', etc.).
     * Used by ResponsePlanner to prevent asking the same question type 3 turns in a row.
     */
    recentQuestionTypes: string[];
}

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

// ─── Memory ───────────────────────────────────────────────────────────────────
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
    /** Last 5 assistant responses for semantic anti-repetition checks */
    recentResponses: string[];
    /** Total user turns */
    turnCount: number;
    /** IDs of questions already asked in this session (prevents repetition) */
    askedQuestions: Set<string>;
    /** Aggregated emotional polarity + intensity score for the session */
    emotionalTrend: EmotionalTrend;
    /** Ring-buffer state for RepetitionGuard */
    repetition: RepetitionState;
    /**
     * How many consecutive turns the user has requested advice.
     * Resets to 0 on any non-advice intent.
     * Used by ResponsePlanner to shift from suggestion → reflective exploration.
     */
    consecutiveAdviceCount: number;
    /**
     * Monotonically incrementing counter; incremented each time a topic bridge
     * is actually woven into a response. Used to rotate bridge phrasing variants.
     */
    topicPhraseIndex: number;
}

// ─── State ────────────────────────────────────────────────────────────────────
export interface ConversationState {
    memory: ConversationMemory;
    intensity: EmotionalIntensity;
    lastIntent: IntentType | null;
}

// ─── Safety ───────────────────────────────────────────────────────────────────
export type SafetyLevel = 'SAFE' | 'MONITOR' | 'CRISIS';

export interface SafetyAssessment {
    level: SafetyLevel;
    triggered: boolean;
    matchedPhrases: string[];
    score: number;
}

// ─── Engine I/O ───────────────────────────────────────────────────────────────
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
