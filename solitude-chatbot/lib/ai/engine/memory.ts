import {
    ConversationMemory,
    ConversationMessage,
    EmotionFact,
    TopicMemory,
    ToneTrend,
    IntentMatch,
    EmotionalIntensity,
    EmotionalPolarity,
    EmotionalTrend,
    ActiveTopic,
    RepetitionState,
} from './types';
import { RepetitionGuard } from './repetition-guard';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 20;  // 10 turns × 2 roles
const MAX_RECENT_RESPONSES = 5;
const MAX_FACTS = 30;
const MAX_INTENSITY_HISTORY = 5;
const TOPIC_RECURRENCE_THRESHOLD = 2;
const MAX_TOPICS_STORED = 20;
const ACTIVE_TOPICS_LIMIT = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Maps an `EmotionalIntensity` enum to a 0–10 numeric score.
 */
function intensityToScore(i: EmotionalIntensity): number {
    return { LOW: 2, MEDIUM: 5, HIGH: 9 }[i];
}

/**
 * Derives a rough emotional polarity from the array of emotion facts.
 * Negative intents outvoting neutral/positive → 'negative', etc.
 */
const NEGATIVE_INTENTS = new Set([
    'VENT', 'ANXIETY', 'SADNESS', 'ANGER', 'LONELINESS', 'CRISIS'
]);
const POSITIVE_INTENTS = new Set(['GROUNDING', 'REFLECTION', 'PROGRESS']);

function derivePolarity(facts: EmotionFact[]): EmotionalPolarity {
    let neg = 0, pos = 0;
    for (const f of facts) {
        if (NEGATIVE_INTENTS.has(f.emotion as string)) neg++;
        if (POSITIVE_INTENTS.has(f.emotion as string)) pos++;
    }
    if (neg > pos * 1.5) return 'negative';
    if (pos > neg) return 'positive';
    return 'neutral';
}

/**
 * Computes a rolling average intensity score (0–10) from the last N readings.
 */
function computeIntensityScore(history: EmotionalIntensity[]): number {
    if (history.length === 0) return 0;
    const total = history.reduce((acc, i) => acc + intensityToScore(i), 0);
    return Math.round((total / history.length) * 10) / 10;
}

function computeTrend(
    facts: EmotionFact[],
    history: EmotionalIntensity[]
): EmotionalTrend {
    return {
        polarity: derivePolarity(facts),
        intensityScore: computeIntensityScore(history),
    };
}

function computeToneTrend(history: EmotionalIntensity[]): ToneTrend {
    if (history.length < 2) return 'STABLE';
    const toNum = (i: EmotionalIntensity) => ({ LOW: 0, MEDIUM: 1, HIGH: 2 }[i]);
    const recent = history.slice(-3).map(toNum);
    const delta = recent[recent.length - 1] - recent[0];
    if (delta > 0) return 'ESCALATING';
    if (delta < 0) return 'DE_ESCALATING';
    return 'STABLE';
}

// ─── MemoryManager ────────────────────────────────────────────────────────────
//
// Responsibilities:
//  - Session-scoped in-process persistence (no external storage)
//  - Short-term memory  : rolling buffer of last 10 turns per session
//  - Topic memory       : recurring themes, top-3 active topics by weight
//  - Emotional trend    : polarity (neg/neutral/pos) + numeric intensity score
//  - Question tracking  : prevents repeating the same question in a session
//
// Instance API (session-aware):
//   addMessage()         — append a user or assistant message
//   getActiveTopics()    — top-3 topics by normalised frequency weight
//   getEmotionalTrend()  — { polarity, intensityScore }
//   hasAskedQuestion()   — check whether a questionId was already used
//   markQuestionAsked()  — record a questionId as used
//
// Static helpers (backward-compat with engine pipeline):
//   createInitial()      — blank ConversationMemory
//   update()             — full pipeline update (messages + facts + topics + trend)
//   getRecentContext()   — last N messages
//   getDominantEmotion() — most frequent emotion across facts
//   getRecurringTopics() — topics that recurred ≥ TOPIC_RECURRENCE_THRESHOLD
//   isResponseFresh()    — anti-repetition check

export class MemoryManager {

    // ── Session store ─────────────────────────────────────────────────────────

    /** In-process session map: sessionId → ConversationMemory */
    private static _sessions = new Map<string, ConversationMemory>();

    private static _getOrCreate(sessionId: string): ConversationMemory {
        if (!MemoryManager._sessions.has(sessionId)) {
            MemoryManager._sessions.set(sessionId, MemoryManager.createInitial());
        }
        return MemoryManager._sessions.get(sessionId)!;
    }

    private static _save(sessionId: string, memory: ConversationMemory): void {
        MemoryManager._sessions.set(sessionId, memory);
    }

    // ── Instance API ──────────────────────────────────────────────────────────

    /**
     * Appends a message to the session's short-term buffer.
     * If `intent` and `intensity` are provided the method also updates topic
     * memory, emotion facts, and the emotional trend — mirroring what the
     * static `update()` does for the engine pipeline.
     *
     * @param sessionId  Unique identifier for the conversation session
     * @param role       'user' | 'assistant'
     * @param content    Raw message text
     * @param intent     Optional: classified intent (enriches topic/emotion memory)
     * @param intensity  Optional: detected intensity level
     */
    static addMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        intent?: IntentMatch,
        intensity?: EmotionalIntensity
    ): void {
        const memory = MemoryManager._getOrCreate(sessionId);
        const now = Date.now();
        const turn = memory.turnCount;

        // 1. Short-term buffer
        const newMessages: ConversationMessage[] = [
            ...memory.messages,
            { role, content, timestamp: now }
        ].slice(-MAX_MESSAGES);

        // 2. Emotion facts (only when intent + intensity provided)
        const newFacts: EmotionFact[] = [...memory.facts];
        if (intent && intensity && NEGATIVE_INTENTS.has(intent.type as string)) {
            newFacts.push({
                emotion: intent.type,
                subject: intent.subject,
                turn,
                intensity
            });
            if (newFacts.length > MAX_FACTS) newFacts.splice(0, newFacts.length - MAX_FACTS);
        }

        // 3. Topic memory
        const newTopics = intent
            ? MemoryManager._updateTopics(memory.topics, intent, turn)
            : memory.topics;

        // 4. Intensity history + trends
        const newIntensityHistory: EmotionalIntensity[] = intensity
            ? [...memory.intensityHistory, intensity].slice(-MAX_INTENSITY_HISTORY)
            : memory.intensityHistory;

        const newToneTrend = computeToneTrend(newIntensityHistory);
        const newEmotionalTrend = computeTrend(newFacts, newIntensityHistory);

        // 5. Anti-repetition (assistant messages only)
        const newRecentResponses = role === 'assistant'
            ? [...memory.recentResponses, content].slice(-MAX_RECENT_RESPONSES)
            : memory.recentResponses;

        MemoryManager._save(sessionId, {
            ...memory,
            messages: newMessages,
            facts: newFacts,
            topics: newTopics,
            intensityHistory: newIntensityHistory,
            toneTrend: newToneTrend,
            emotionalTrend: newEmotionalTrend,
            recentResponses: newRecentResponses,
            turnCount: role === 'user' ? memory.turnCount + 1 : memory.turnCount,
        });
    }

    /**
     * Returns the top 3 active topics for a session, sorted by normalised
     * frequency weight (most prominent first).
     *
     * Weight = topic.occurrences / Σ(all occurrences)
     */
    static getActiveTopics(sessionId: string): ActiveTopic[] {
        const memory = MemoryManager._getOrCreate(sessionId);
        const totalOccurrences = memory.topics.reduce((s, t) => s + t.occurrences, 0);
        if (totalOccurrences === 0) return [];

        return memory.topics
            .slice(0, ACTIVE_TOPICS_LIMIT)
            .map(t => ({
                topic: t.topic,
                occurrences: t.occurrences,
                weight: Math.round((t.occurrences / totalOccurrences) * 1000) / 1000,
            }));
    }

    /**
     * Returns the current emotional trend for a session:
     * - `polarity`       — 'negative' | 'neutral' | 'positive'
     * - `intensityScore` — rolling average 0–10
     */
    static getEmotionalTrend(sessionId: string): EmotionalTrend {
        const memory = MemoryManager._getOrCreate(sessionId);
        return memory.emotionalTrend;
    }

    /**
     * Returns `true` if the question identified by `questionId` has already
     * been asked during this session.
     */
    static hasAskedQuestion(sessionId: string, questionId: string): boolean {
        const memory = MemoryManager._getOrCreate(sessionId);
        return memory.askedQuestions.has(questionId);
    }

    /**
     * Records `questionId` so that `hasAskedQuestion` returns `true` for the
     * remainder of the session.
     */
    static markQuestionAsked(sessionId: string, questionId: string): void {
        const memory = MemoryManager._getOrCreate(sessionId);
        memory.askedQuestions.add(questionId);
        // No need to re-save; Set is mutated in-place via reference
    }

    // ── Factory ───────────────────────────────────────────────────────────────

    static createInitial(): ConversationMemory {
        return {
            messages: [],
            facts: [],
            topics: [],
            intensityHistory: [],
            toneTrend: 'STABLE',
            recentResponses: [],
            turnCount: 0,
            askedQuestions: new Set<string>(),
            emotionalTrend: { polarity: 'neutral', intensityScore: 0 },
            repetition: RepetitionGuard.emptyState(),
        };
    }

    // ── Static pipeline update (backward compat with ConversationEngine) ──────

    /**
     * Full pipeline update used by `ConversationEngine`.
     * Returns a *new* `ConversationMemory` object (immutable pipeline pattern).
     * Also syncs the result into the session map when sessionId is provided.
     */
    static update(
        memory: ConversationMemory,
        userMessage: string,
        assistantMessage: string,
        intent: IntentMatch,
        intensity: EmotionalIntensity,
        sessionId?: string,
        repetition?: RepetitionState
    ): ConversationMemory {
        const now = Date.now();
        const turn = memory.turnCount;

        // 1. Short-term message buffer (last 10 turns)
        const newMessages: ConversationMessage[] = [
            ...memory.messages,
            { role: 'user' as const, content: userMessage, timestamp: now },
            { role: 'assistant' as const, content: assistantMessage, timestamp: now }
        ].slice(-MAX_MESSAGES);

        // 2. Emotion facts
        const emotionalIntents = new Set([
            'VENT', 'ANXIETY', 'SADNESS', 'ANGER',
            'LONELINESS', 'CONFUSION', 'REFLECTION', 'GROUNDING', 'CRISIS'
        ]);
        const newFacts: EmotionFact[] = [...memory.facts];
        if (emotionalIntents.has(intent.type as string)) {
            newFacts.push({ emotion: intent.type, subject: intent.subject, turn, intensity });
            if (newFacts.length > MAX_FACTS) newFacts.splice(0, newFacts.length - MAX_FACTS);
        }

        // 3. Topic memory
        const newTopics = MemoryManager._updateTopics(memory.topics, intent, turn);

        // 4. Intensity history + trends
        const newIntensityHistory: EmotionalIntensity[] = [
            ...memory.intensityHistory, intensity
        ].slice(-MAX_INTENSITY_HISTORY);

        const newToneTrend = computeToneTrend(newIntensityHistory);
        const newEmotionalTrend = computeTrend(newFacts, newIntensityHistory);

        // 5. Anti-repetition
        const newRecentResponses = [
            ...memory.recentResponses, assistantMessage
        ].slice(-MAX_RECENT_RESPONSES);

        const updated: ConversationMemory = {
            messages: newMessages,
            facts: newFacts,
            topics: newTopics,
            intensityHistory: newIntensityHistory,
            toneTrend: newToneTrend,
            emotionalTrend: newEmotionalTrend,
            recentResponses: newRecentResponses,
            askedQuestions: memory.askedQuestions,
            turnCount: memory.turnCount + 1,
            repetition: repetition ?? memory.repetition,
        };

        if (sessionId) MemoryManager._save(sessionId, updated);

        return updated;
    }

    // ── Queries (backward compat) ─────────────────────────────────────────────

    /** Returns the last N messages as context for response generation. */
    static getRecentContext(memory: ConversationMemory, n = 6): ConversationMessage[] {
        return memory.messages.slice(-n);
    }

    /** Returns the most frequently occurring emotional intent across the session. */
    static getDominantEmotion(memory: ConversationMemory): string | null {
        if (memory.facts.length === 0) return null;
        const counts: Record<string, number> = {};
        for (const fact of memory.facts) {
            counts[fact.emotion as string] = (counts[fact.emotion as string] || 0) + 1;
        }
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }

    /** Returns topics that have recurred at least twice. */
    static getRecurringTopics(memory: ConversationMemory): TopicMemory[] {
        return memory.topics.filter(t => t.occurrences >= TOPIC_RECURRENCE_THRESHOLD);
    }

    /** Returns true if the candidate response hasn't been used recently. */
    static isResponseFresh(memory: ConversationMemory, candidate: string): boolean {
        return !memory.recentResponses.includes(candidate);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private static _updateTopics(
        existing: TopicMemory[],
        intent: IntentMatch,
        turn: number
    ): TopicMemory[] {
        const topics = [...existing];
        const candidates = [intent.subject, ...intent.matchedKeywords]
            .filter((k): k is string => !!k && k.length > 3);

        for (const candidate of candidates) {
            const idx = topics.findIndex(t => t.topic === candidate);
            if (idx >= 0) {
                topics[idx] = {
                    ...topics[idx],
                    lastTurn: turn,
                    occurrences: topics[idx].occurrences + 1,
                };
            } else {
                topics.push({ topic: candidate, firstTurn: turn, lastTurn: turn, occurrences: 1 });
            }
        }

        // Keep top MAX_TOPICS_STORED topics by occurrence; top 3 are the "active" ones
        return topics
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, MAX_TOPICS_STORED);
    }
}
