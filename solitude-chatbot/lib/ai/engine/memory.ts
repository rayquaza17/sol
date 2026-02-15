import {
    ConversationMemory,
    ConversationState,
    ConversationFact,
    TrackedQuestion,
    FactType,
    IntentMatch,
    EmotionalIntensity
} from './types';
import { CALLBACK_TEMPLATES, TOPIC_ACKNOWLEDGEMENTS } from './registry';

const MAX_HISTORY = 10;
const TOPIC_EXPLORED_THRESHOLD = 2;  // Turns before a topic is considered "explored"
const CALLBACK_COOLDOWN = 3;         // Minimum turns between callbacks

/**
 * Word-boundary-aware keyword matching.
 * Prevents false positives like "parents" matching "rent".
 */
function messageContainsKeyword(msg: string, keyword: string): boolean {
    // For multi-word phrases, use simple includes
    if (keyword.includes(' ')) {
        return msg.includes(keyword);
    }
    // For single words, use word boundary regex
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    return regex.test(msg);
}

// ─── Keyword Dictionaries for Fact Extraction ───────────────────────

const EMOTION_KEYWORDS: Record<string, string[]> = {
    'stress': ['stress', 'stressed', 'overwhelmed', 'pressure', 'burnout'],
    'loneliness': ['lonely', 'alone', 'isolated', 'no one', 'nobody'],
    'anxiety': ['anxious', 'worried', 'panic', 'scared', 'nervous'],
    'sadness': ['sad', 'depressed', 'heavy', 'crying', 'tearful', 'hopeless'],
    'anger': ['angry', 'mad', 'furious', 'annoyed', 'frustrated', 'rage'],
    'fear': ['afraid', 'terrified', 'frightened', 'dread'],
    'guilt': ['guilty', 'blame', 'fault', 'ashamed', 'shame'],
    'exhaustion': ['exhausted', 'drained', 'burnt out', 'tired', 'fatigued']
};

const EVENT_KEYWORDS: Record<string, string[]> = {
    'exam': ['exam', 'exams', 'test', 'study', 'grades', 'midterm', 'final'],
    'argument': ['argument', 'fight', 'disagreement', 'conflict', 'quarrel'],
    'work': ['work', 'job', 'office', 'boss', 'deadline', 'project'],
    'family': ['family', 'parents', 'mom', 'dad', 'sibling', 'brother', 'sister'],
    'friend': ['friend', 'bestie', 'buddy', 'friendship'],
    'relationship': ['partner', 'boyfriend', 'girlfriend', 'breakup', 'dating', 'marriage'],
    'loss': ['lost', 'death', 'passed away', 'grief', 'mourning'],
    'change': ['moving', 'new place', 'transition', 'starting over']
};

const CONCERN_KEYWORDS: Record<string, string[]> = {
    'health': ['health', 'sick', 'illness', 'doctor', 'hospital', 'medication'],
    'future': ['future', 'uncertainty', 'career', 'life path', 'direction'],
    'sleep': ['sleep', 'insomnia', 'night', 'cant sleep', 'restless'],
    'money': ['money', 'financial', 'debt', 'afford', 'rent', 'expenses'],
    'self-worth': ['worthless', 'useless', 'not good enough', 'failure', 'imposter']
};

// Maps to combine emotion + event into natural labels (e.g., "exam stress")
const COMPOSITE_LABELS: Record<string, Record<string, string>> = {
    'stress': { 'exam': 'exam stress', 'work': 'work pressure', 'family': 'family pressure' },
    'anxiety': { 'exam': 'exam anxiety', 'future': 'uncertainty about the future', 'health': 'health anxiety' },
    'loneliness': { 'friend': 'missing friendship', 'relationship': 'relationship loneliness' },
    'sadness': { 'loss': 'grieving a loss', 'relationship': 'heartbreak', 'family': 'family sadness' },
    'anger': { 'argument': 'frustration from conflict', 'work': 'workplace frustration', 'family': 'family conflict' }
};

// ─── Initial Memory ─────────────────────────────────────────────────

export function createInitialMemory(): ConversationMemory {
    return {
        shortTerm: {
            user: [],
            assistant: []
        },
        facts: [],
        askedQuestions: [],
        exploredTopics: [],
        topicTurnCount: {},
        usedPhrases: [],
        usedCallbacks: [],
        recentOpeners: [],
        recentPhrases: [],
        recentQuestions: [],
        turnsSinceLastCallback: 0,
        turnsSinceLastQuestion: 0,
        totalTurns: 0
    };
}

// ─── Normalization Helpers ──────────────────────────────────────────

function normalizeQuestion(q: string): string {
    return q.toLowerCase()
        .replace(/[^\w\s]/g, '')  // Strip punctuation
        .replace(/\s+/g, ' ')    // Collapse whitespace
        .trim();
}

function getQuestionKeywords(q: string): string[] {
    const stopWords = new Set([
        'what', 'how', 'does', 'is', 'are', 'do', 'you', 'your', 'the',
        'a', 'an', 'in', 'to', 'for', 'of', 'it', 'that', 'this',
        'can', 'would', 'could', 'should', 'feel', 'like', 'one',
        'right', 'now', 'about', 'with', 'from', 'there', 'if', 'me',
        'my', 'i', 'we', 'be', 'has', 'have', 'had', 'was', 'were',
        'been', 'being', 'some', 'any', 'all', 'or', 'and', 'but'
    ]);
    return normalizeQuestion(q)
        .split(' ')
        .filter(w => w.length > 2 && !stopWords.has(w));
}

function questionsAreSimilar(a: string, b: string): boolean {
    const normA = normalizeQuestion(a);
    const normB = normalizeQuestion(b);

    // Exact match after normalization
    if (normA === normB) return true;

    // Substring match
    if (normA.includes(normB) || normB.includes(normA)) return true;

    // Keyword overlap: if 60%+ of keywords overlap, consider similar
    const kwA = getQuestionKeywords(a);
    const kwB = getQuestionKeywords(b);
    if (kwA.length === 0 || kwB.length === 0) return false;

    const overlap = kwA.filter(w => kwB.includes(w)).length;
    const minLen = Math.min(kwA.length, kwB.length);
    return overlap / minLen >= 0.6;
}

// ─── Memory Manager ─────────────────────────────────────────────────

export class MemoryManager {

    /**
     * Core update — called after each exchange.
     */
    static update(
        state: ConversationState,
        userMessage: string,
        assistantMessage: string | null,
        intent?: IntentMatch
    ): ConversationMemory {
        const memory: ConversationMemory = {
            shortTerm: {
                user: [...state.memory.shortTerm.user],
                assistant: [...state.memory.shortTerm.assistant]
            },
            facts: [...state.memory.facts],
            askedQuestions: [...state.memory.askedQuestions],
            exploredTopics: [...state.memory.exploredTopics],
            topicTurnCount: { ...state.memory.topicTurnCount },
            usedPhrases: [...state.memory.usedPhrases],
            usedCallbacks: [...state.memory.usedCallbacks],
            recentOpeners: [...state.memory.recentOpeners],
            recentPhrases: [...state.memory.recentPhrases],
            recentQuestions: [...state.memory.recentQuestions],
            turnsSinceLastQuestion: state.memory.turnsSinceLastQuestion,
            turnsSinceLastCallback: state.memory.turnsSinceLastCallback + 1,
            totalTurns: state.memory.totalTurns + 1
        };

        // 1. Update Short-Term Memory
        memory.shortTerm.user = [userMessage, ...memory.shortTerm.user].slice(0, MAX_HISTORY);

        if (assistantMessage) {
            memory.shortTerm.assistant = [assistantMessage, ...memory.shortTerm.assistant].slice(0, MAX_HISTORY);

            // 1a. Track openers, phrases, and questions for anti-repetition
            const sentences = assistantMessage.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
            if (sentences.length > 0) {
                const opener = sentences[0].split(/[,\s]/)[0]; // First word of first sentence
                memory.recentOpeners = [opener, ...memory.recentOpeners].slice(0, 5);

                // Track full phrases (sentences)
                for (const s of sentences) {
                    memory.recentPhrases = [s, ...memory.recentPhrases].slice(0, 10);
                }
            }

            // Track questions asked by assistant
            if (assistantMessage.includes('?')) {
                const question = this.extractQuestion(assistantMessage);
                if (question) {
                    memory.recentQuestions = [question, ...memory.recentQuestions].slice(0, 3);

                    if (!this.isQuestionAlreadyAsked(question, memory)) {
                        const tracked: TrackedQuestion = {
                            original: question,
                            normalized: normalizeQuestion(question),
                            turnAsked: memory.totalTurns,
                            answered: false
                        };
                        memory.askedQuestions.push(tracked);
                    }
                }
                memory.turnsSinceLastQuestion = 0;
            } else {
                memory.turnsSinceLastQuestion++;
            }

            // Link user answer to the last asked question
            if (state.lastQuestion) {
                const lastQ = this.extractQuestion(state.lastQuestion);
                if (lastQ) {
                    const matchingQ = memory.askedQuestions.find(
                        q => questionsAreSimilar(q.original, lastQ) && !q.answered
                    );
                    if (matchingQ) {
                        matchingQ.answered = true;
                        matchingQ.answer = userMessage;
                    }
                }
            }
        }

        // 2. Extract Facts
        this.extractFacts(userMessage, memory, intent);

        // 3. Update Topic Tracking
        this.updateTopicTracking(userMessage, memory, intent);

        return memory;
    }

    // ─── Question Deduplication ─────────────────────────────────────

    /**
     * Check if a question (or something very similar) has already been asked.
     */
    static isQuestionAlreadyAsked(question: string, memory: ConversationMemory): boolean {
        return memory.askedQuestions.some(q => questionsAreSimilar(q.original, question));
    }

    /**
     * Get a question from a pool that hasn't been asked yet.
     * Returns null if all questions in the pool are exhausted.
     */
    static getAvailableQuestion(pool: string[], memory: ConversationMemory): string | null {
        const available = pool.filter(q => !this.isQuestionAlreadyAsked(q, memory));
        if (available.length === 0) return null;
        return available[Math.floor(Math.random() * available.length)];
    }

    // ─── Topic Tracking ────────────────────────────────────────────

    /**
     * Check if a topic has been sufficiently explored (discussed for >= threshold turns).
     */
    static isTopicExplored(topic: string, memory: ConversationMemory): boolean {
        return memory.exploredTopics.includes(topic);
    }

    /**
     * Get the dominant topic from the current message based on keywords.
     */
    static getCurrentTopics(message: string, intent?: IntentMatch): string[] {
        const msg = message.toLowerCase();
        const topics: string[] = [];

        // Pull topics from all keyword dictionaries
        for (const [topic, keywords] of Object.entries(EMOTION_KEYWORDS)) {
            if (keywords.some(kw => messageContainsKeyword(msg, kw))) topics.push(topic);
        }
        for (const [topic, keywords] of Object.entries(EVENT_KEYWORDS)) {
            if (keywords.some(kw => messageContainsKeyword(msg, kw))) topics.push(topic);
        }
        for (const [topic, keywords] of Object.entries(CONCERN_KEYWORDS)) {
            if (keywords.some(kw => messageContainsKeyword(msg, kw))) topics.push(topic);
        }

        // Also consider the intent type as a topic
        if (intent && intent.type !== 'GENERAL' && intent.type !== 'GREETING') {
            topics.push(intent.type.toLowerCase());
        }

        return [...new Set(topics)];
    }

    private static updateTopicTracking(
        message: string,
        memory: ConversationMemory,
        intent?: IntentMatch
    ): void {
        const currentTopics = this.getCurrentTopics(message, intent);

        for (const topic of currentTopics) {
            memory.topicTurnCount[topic] = (memory.topicTurnCount[topic] || 0) + 1;

            // Mark as explored if threshold reached
            if (
                memory.topicTurnCount[topic] >= TOPIC_EXPLORED_THRESHOLD &&
                !memory.exploredTopics.includes(topic)
            ) {
                memory.exploredTopics.push(topic);
            }
        }
    }

    // ─── Fact Extraction ────────────────────────────────────────────

    private static extractQuestion(text: string): string | null {
        const sentences = text.split(/(?<=[.!?])\s+/);
        const questionSentence = sentences.find(s => s.trim().endsWith('?'));
        return questionSentence ? questionSentence.trim() : null;
    }

    private static extractFacts(
        message: string,
        memory: ConversationMemory,
        intent?: IntentMatch
    ): void {
        const msg = message.toLowerCase();
        const detectedEmotions: string[] = [];
        const detectedEvents: string[] = [];

        // Determine intensity from intent or default
        const intensity: EmotionalIntensity = intent
            ? (intent.confidence > 70 ? 'HIGH' : intent.confidence > 40 ? 'MEDIUM' : 'LOW')
            : 'LOW';

        // Extract Emotions
        for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
            if (keywords.some(kw => messageContainsKeyword(msg, kw))) {
                detectedEmotions.push(emotion);
                this.addFactIfNew(memory, 'emotion', emotion, emotion, intensity);
            }
        }

        // Extract Events
        for (const [event, keywords] of Object.entries(EVENT_KEYWORDS)) {
            if (keywords.some(kw => messageContainsKeyword(msg, kw))) {
                detectedEvents.push(event);
                this.addFactIfNew(memory, 'event', event, event, intensity);
            }
        }

        // Extract Concerns
        for (const [concern, keywords] of Object.entries(CONCERN_KEYWORDS)) {
            if (keywords.some(kw => messageContainsKeyword(msg, kw))) {
                this.addFactIfNew(memory, 'concern', concern, concern, intensity);
            }
        }

        // Composite Labels (e.g., "exam stress")
        for (const emotion of detectedEmotions) {
            if (COMPOSITE_LABELS[emotion]) {
                for (const event of detectedEvents) {
                    const compositeLabel = COMPOSITE_LABELS[emotion]?.[event];
                    if (compositeLabel) {
                        this.addFactIfNew(memory, 'emotion', `${emotion}_${event}`, compositeLabel, intensity);
                    }
                }
            }
        }
    }

    private static addFactIfNew(
        memory: ConversationMemory,
        type: FactType,
        value: string,
        label: string,
        intensity: EmotionalIntensity
    ): void {
        const exists = memory.facts.some(f => f.value === value && f.type === type);
        if (!exists) {
            memory.facts.push({
                type,
                value,
                label,
                turnRecorded: memory.totalTurns,
                intensity
            });
        }
    }

    // ─── Continuity Callbacks ───────────────────────────────────────

    /**
     * Get a contextual callback referencing a previous fact.
     * Returns null if: no facts exist, callback cooldown hasn't passed,
     * or all callback templates have been used.
     */
    static getContinuityCallback(
        memory: ConversationMemory,
        currentMessage?: string,
        intent?: IntentMatch
    ): string | null {
        // Respect cooldown
        if (memory.turnsSinceLastCallback < CALLBACK_COOLDOWN) return null;
        if (memory.facts.length === 0) return null;

        // Try to find a fact relevant to the current message
        const currentTopics = currentMessage
            ? this.getCurrentTopics(currentMessage, intent)
            : [];

        // Prefer facts related to current topics, else pick any fact
        let selectedFact: ConversationFact | null = null;

        if (currentTopics.length > 0) {
            // Find a fact whose value overlaps with current topics but wasn't just recorded
            const relatedFacts = memory.facts.filter(
                f => currentTopics.some(t => f.value.includes(t) || t.includes(f.value)) &&
                    f.turnRecorded < memory.totalTurns - 1  // Not from the last turn
            );
            if (relatedFacts.length > 0) {
                selectedFact = relatedFacts[Math.floor(Math.random() * relatedFacts.length)];
            }
        }

        // Fallback: pick any fact that's at least 2 turns old
        if (!selectedFact) {
            const olderFacts = memory.facts.filter(f => f.turnRecorded < memory.totalTurns - 1);
            if (olderFacts.length === 0) return null;
            selectedFact = olderFacts[Math.floor(Math.random() * olderFacts.length)];
        }

        // Select a template for this fact type that hasn't been used
        const templates = CALLBACK_TEMPLATES[selectedFact.type] || CALLBACK_TEMPLATES.emotion;
        const availableTemplates = templates.filter(t => !memory.usedCallbacks.includes(t));

        if (availableTemplates.length === 0) {
            // All templates used — reset the used list (cycle)
            memory.usedCallbacks = [];
            return null; // Skip this turn after reset
        }

        const template = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
        const callback = template.replace('{{value}}', selectedFact.label);

        memory.usedCallbacks.push(template);
        memory.turnsSinceLastCallback = 0;

        return callback;
    }

    // ─── Topic Acknowledgements ─────────────────────────────────────

    /**
     * When a previously explored topic resurfaces, return an acknowledgement
     * instead of asking fresh questions about it.
     */
    static getTopicAcknowledgement(
        message: string,
        memory: ConversationMemory,
        intent?: IntentMatch
    ): string | null {
        const currentTopics = this.getCurrentTopics(message, intent);
        const resurfacedTopics = currentTopics.filter(t => this.isTopicExplored(t, memory));

        if (resurfacedTopics.length === 0) return null;

        const topic = resurfacedTopics[0];

        // Find if there's a richer composite label for this topic
        const relatedFact = memory.facts.find(f =>
            f.value.includes(topic) && f.label !== f.value
        );
        const topicLabel = relatedFact ? relatedFact.label : topic;

        // Select a fresh acknowledgement template
        // Check if the rendered version has been used
        const available = TOPIC_ACKNOWLEDGEMENTS.filter(t => {
            const rendered = t.replace('{{topic}}', topicLabel);
            return !memory.usedPhrases.includes(rendered);
        });
        const templates = available.length > 0 ? available : TOPIC_ACKNOWLEDGEMENTS;

        const template = templates[Math.floor(Math.random() * templates.length)];
        return template.replace('{{topic}}', topicLabel);
    }
}
