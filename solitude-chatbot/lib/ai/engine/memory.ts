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
    ConversationStage,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 20;  // 10 turns × 2 roles
const MAX_RECENT_RESPONSES = 5;
const MAX_FACTS = 30;
const MAX_INTENSITY_HISTORY = 5;
const TOPIC_RECURRENCE_THRESHOLD = 2;
const MAX_TOPICS_STORED = 20;
const ACTIVE_TOPICS_LIMIT = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function intensityToScore(i: EmotionalIntensity): number {
    return { LOW: 2, MEDIUM: 5, HIGH: 9 }[i];
}

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
// Simplified for the hybrid LLM architecture.
// Tracks: messages, facts, topics, intensity, tone, stage.
// No longer tracks: repetition state, depth state, rhythm, question categories,
//                   structure types, synthesis counters, etc.
//
// ─────────────────────────────────────────────────────────────────────────────

export class MemoryManager {

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
            emotionalTrend: { polarity: 'neutral', intensityScore: 0 },
            conversationStage: 'initial',
        };
    }

    // ── Core Update ───────────────────────────────────────────────────────────

    static update(
        memory: ConversationMemory,
        userMessage: string,
        assistantMessage: string,
        intent: IntentMatch,
        intensity: EmotionalIntensity,
        stage: ConversationStage,
    ): ConversationMemory {
        const now = Date.now();
        const turn = memory.turnCount;

        // 1. Message buffer
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
        const newTopics = MemoryManager._updateTopics(memory.topics, intent, userMessage, turn);

        // 4. Intensity + trends
        const newIntensityHistory: EmotionalIntensity[] = [
            ...memory.intensityHistory, intensity
        ].slice(-MAX_INTENSITY_HISTORY);

        const newToneTrend = computeToneTrend(newIntensityHistory);
        const newEmotionalTrend = computeTrend(newFacts, newIntensityHistory);

        // 5. Recent responses
        const newRecentResponses = [
            ...memory.recentResponses, assistantMessage
        ].slice(-MAX_RECENT_RESPONSES);

        return {
            messages: newMessages,
            facts: newFacts,
            topics: newTopics,
            intensityHistory: newIntensityHistory,
            toneTrend: newToneTrend,
            emotionalTrend: newEmotionalTrend,
            recentResponses: newRecentResponses,
            turnCount: memory.turnCount + 1,
            conversationStage: stage,
        };
    }

    // ── Queries ───────────────────────────────────────────────────────────────

    static getActiveTopics(memory: ConversationMemory): ActiveTopic[] {
        const totalOccurrences = memory.topics.reduce((s, t) => s + t.occurrences, 0);
        if (totalOccurrences === 0) return [];

        return memory.topics
            .filter(t => t.occurrences >= TOPIC_RECURRENCE_THRESHOLD)
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, ACTIVE_TOPICS_LIMIT)
            .map(t => ({
                topic: t.topic,
                occurrences: t.occurrences,
                weight: Math.round((t.occurrences / totalOccurrences) * 1000) / 1000,
            }));
    }

    static getRecentContext(memory: ConversationMemory, n = 6): ConversationMessage[] {
        return memory.messages.slice(-n);
    }

    static getRecurringTopics(memory: ConversationMemory): TopicMemory[] {
        return memory.topics.filter(t => t.occurrences >= TOPIC_RECURRENCE_THRESHOLD);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    // Common stopwords to exclude from raw-text extraction
    private static readonly STOPWORDS = new Set([
        'that', 'this', 'with', 'have', 'from', 'they', 'will', 'your',
        'been', 'what', 'when', 'where', 'just', 'dont', 'feel', 'like',
        'know', 'think', 'also', 'very', 'really', 'about', 'some', 'more',
        'been', 'much', 'even', 'them', 'then', 'than', 'into', 'over',
        'only', 'here', 'there'
    ]);

    private static _extractTextKeywords(message: string): string[] {
        return message
            .toLowerCase()
            .replace(/[^a-z\s]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length >= 4 && !MemoryManager.STOPWORDS.has(w));
    }

    private static _updateTopics(
        existing: TopicMemory[],
        intent: IntentMatch,
        userMessage: string,
        turn: number
    ): TopicMemory[] {
        const topics = [...existing];

        // Combine intent-derived keywords with raw text keywords
        const rawKeywords = MemoryManager._extractTextKeywords(userMessage);
        const candidates = [
            intent.subject,
            ...intent.matchedKeywords,
            ...rawKeywords,
        ].filter((k): k is string => !!k && k.length >= 4);

        // Deduplicate candidates
        const seen = new Set<string>();
        const unique = candidates.filter(k => {
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
        });

        for (const candidate of unique) {
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

        return topics
            .sort((a, b) => b.occurrences - a.occurrences)
            .slice(0, MAX_TOPICS_STORED);
    }
}
