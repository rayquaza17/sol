import { ConversationMemory, ConversationState } from './types';

const MAX_HISTORY = 10;

const EMOTION_KEYWORDS = {
    'stress': ['stress', 'stressed', 'overwhelmed', 'pressure'],
    'loneliness': ['lonely', 'alone', 'isolated', 'no one'],
    'anxiety': ['anxious', 'worried', 'panic', 'scared'],
    'sadness': ['sad', 'depressed', 'heavy', 'crying'],
    'anger': ['angry', 'mad', 'furious', 'annoyed']
};

const EVENT_KEYWORDS = {
    'exam': ['exam', 'test', 'study', 'grades'],
    'argument': ['argument', 'fight', 'disagreement', 'conflict'],
    'work': ['work', 'job', 'office', 'boss'],
    'family': ['family', 'parents', 'mom', 'dad', 'sibling'],
    'friend': ['friend', 'bestie', 'buddy']
};

const CONCERN_KEYWORDS = {
    'health': ['health', 'sick', 'illness', 'doctor'],
    'future': ['future', 'uncertainty', 'career', 'life'],
    'sleep': ['sleep', 'insomnia', 'night', 'tired']
};

export function createInitialMemory(): ConversationMemory {
    return {
        shortTerm: {
            user: [],
            assistant: []
        },
        facts: {
            emotions: [],
            events: [],
            concerns: []
        },
        askedQuestions: [],
        answers: {},
        usedPhrases: [],
        turnsSinceLastQuestion: 0
    };
}

export class MemoryManager {
    static update(state: ConversationState, userMessage: string, assistantMessage: string | null): ConversationMemory {
        const memory = { ...state.memory };

        // 1. Update Short-Term Memory
        memory.shortTerm.user = [userMessage, ...memory.shortTerm.user].slice(0, MAX_HISTORY);
        if (assistantMessage) {
            memory.shortTerm.assistant = [assistantMessage, ...memory.shortTerm.assistant].slice(0, MAX_HISTORY);

            // Track questions asked by assistant
            if (assistantMessage.includes('?')) {
                const question = this.extractQuestion(assistantMessage);
                if (question && !memory.askedQuestions.includes(question)) {
                    memory.askedQuestions.push(question);
                    // Link user answer to this question if it was the last one asked
                    if (state.lastQuestion) {
                        const lastQ = this.extractQuestion(state.lastQuestion);
                        if (lastQ) {
                            memory.answers[lastQ] = userMessage;
                        }
                    }
                }
                memory.turnsSinceLastQuestion = 0;
            } else {
                memory.turnsSinceLastQuestion++;
            }
        }

        // 2. Extract Facts
        this.extractFacts(userMessage, memory.facts);

        return memory;
    }

    private static extractQuestion(text: string): string | null {
        // Simple question extraction: find the sentence ending with ?
        const sentences = text.split(/[.!?]/);
        const questionSentence = sentences.find(s => text.includes(s.trim() + '?'));
        return questionSentence ? questionSentence.trim() : null;
    }

    private static extractFacts(message: string, facts: ConversationMemory['facts']) {
        const msg = message.toLowerCase();

        // Extract Emotions
        for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
            if (keywords.some(kw => msg.includes(kw)) && !facts.emotions.includes(emotion)) {
                facts.emotions.push(emotion);
            }
        }

        // Extract Events
        for (const [event, keywords] of Object.entries(EVENT_KEYWORDS)) {
            if (keywords.some(kw => msg.includes(kw)) && !facts.events.includes(event)) {
                facts.events.push(event);
            }
        }

        // Extract Concerns
        for (const [concern, keywords] of Object.entries(CONCERN_KEYWORDS)) {
            if (keywords.some(kw => msg.includes(kw)) && !facts.concerns.includes(concern)) {
                facts.concerns.push(concern);
            }
        }
    }

    static getContinuityCallback(memory: ConversationMemory): string | null {
        const { emotions, events, concerns } = memory.facts;

        // Pick a random fact to reference
        const allFacts = [
            ...emotions.map(e => ({ type: 'emotion', value: e })),
            ...events.map(e => ({ type: 'event', value: e })),
            ...concerns.map(c => ({ type: 'concern', value: c }))
        ];

        if (allFacts.length === 0) return null;

        const fact = allFacts[Math.floor(Math.random() * allFacts.length)];

        const templates = [
            `Earlier you mentioned {{value}}, and I'm still reflecting on that.`,
            `From what you shared before about {{value}}, it sounds like a lot to navigate.`,
            `I'm remembering what you said regarding {{value}}...`
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        return template.replace('{{value}}', fact.value);
    }
}
