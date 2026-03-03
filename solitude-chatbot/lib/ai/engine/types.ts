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
 * 5-stage conversation model.
 *   initial     — turns 0–2   (open-ended reflection)
 *   exploring   — turns 3–6   (clarifying questions)
 *   deepening   — turns 7–12  (synthesis + fewer questions)
 *   stabilizing — turns 13–18 (grounding + containment)
 *   closing     — turns 19+   (encouragement + summarizing)
 */
export type ConversationStage = 'initial' | 'exploring' | 'deepening' | 'stabilizing' | 'closing';

export type MoodLevel = 1 | 2 | 3 | 4 | 5 | null;

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
    /** Last 5 assistant responses (for future use) */
    recentResponses: string[];
    /** Total user turns */
    turnCount: number;
    /** Aggregated emotional polarity + intensity score for the session */
    emotionalTrend: EmotionalTrend;
    /** Current conversation stage */
    conversationStage: ConversationStage;
}

// ─── State ────────────────────────────────────────────────────────────────────
export interface ConversationState {
    memory: ConversationMemory;
    intensity: EmotionalIntensity;
    lastIntent: IntentType | null;
    /** How many consecutive out-of-scope responses have been sent this session */
    outOfScopeCount: number;
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

/** Result from engine.process() — provides prompt + context for the API route */
export interface EngineResult {
    /** Structured prompt ready for Ollama (empty string if crisisLevel === 3) */
    prompt: string;
    /** Classified intent */
    intent: IntentMatch;
    /** Whether crisis was detected (Level 2 or 3) */
    isCrisis: boolean;
    /** 1 = safe, 2 = concerning ideation (soft), 3 = explicit intent (bypass LLM) */
    crisisLevel: 1 | 2 | 3;
    /** Pre-built human-authored response — only set when crisisLevel === 3 */
    crisisResponse?: string;
    /** Safety level assessment */
    safetyLevel: SafetyLevel;
    /** Set when intent is out_of_scope — bypasses Ollama */
    isOutOfScope?: boolean;
    /** Pre-built boundary response — only set when isOutOfScope === true */
    outOfScopeResponse?: string;
    /** Updated conversation state (minus the response content, which comes from LLM) */
    state: ConversationState;
}
