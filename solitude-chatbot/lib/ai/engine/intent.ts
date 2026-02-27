import { IntentType, ActionType, IntentMatch, ConversationMemory } from './types';

// ─── IntentClassifier ─────────────────────────────────────────────────────────
//
// Deterministic, weighted classifier for mental-health conversations.
//
// Intents:
//   greeting | venting | emotional_reflection | advice_request |
//   reassurance_seeking | grounding_request | progress_update |
//   crisis_signal | out_of_scope
//
// Classification strategy:
//   1. Hard-block pass  — explicit out_of_scope patterns → immediate return
//   2. Crisis phrase pass — ultra-high-weight phrases → CRISIS or MONITOR
//   3. Keyword scoring  — weighted per-intent keyword matching
//   4. Phrase scoring   — multi-word phrase detection (higher weight)
//   5. Heuristics       — length, punctuation, structure
//   6. Context boost    — memory-aware score adjustment from recent turns
//   7. Winner selection + confidence calculation
//

// ── Out-of-Scope Hard Block ──────────────────────────────────────────────────
// Evaluated FIRST. If any pattern fires and no mental-health keyword offsets
// it, the message is immediately classified as out_of_scope.

const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
    // Factual / general knowledge
    /^(what|who|where|when|why|how) (is|are|was|were|do|does|can|did|has|have)\b/i,
    /\b(capital (city )?of|population of|currency of|president of|prime minister of)\b/i,
    /\b(define|definition of|meaning of|history of|origin of|year of)\b/i,
    /\b(who (invented|founded|created|wrote|discovered))\b/i,
    // Technical / coding
    /\b(javascript|python|typescript|html|css|sql|react|node|api|algorithm|function|variable|array|loop|debug|compile|syntax|code|programming|git|github)\b/i,
    // Math
    /\b(\d+\s*[\+\-\*\/\^]\s*\d+|solve|calculate|equation|integral|derivative|formula|algebra|geometry|trigonometry)\b/i,
    // Jokes / entertainment
    /\b(tell me a joke|make me laugh|funny meme|punchline|comedy|entertainment|movie (review|rating|plot)|tv show)\b/i,
    // General trivia / facts
    /\b(recipe for|how to cook|sports score|stock price|weather forecast|translate (this|to)|convert (this|\d))\b/i
];

// Mental-health signals that override an out_of_scope detection
const MH_OVERRIDE_SIGNALS: RegExp[] = [
    /\b(feel(ing)?|emotion(al)?|anxious|depress(ed)?|stress(ed)?|anxiet(y|ies)|mental health|cope|crisis|hurt(ing)?|therapy|therapist|grief|trauma|panic|numb|alone|lonely|suicid)\b/i
];

// ── Crisis Phrases ───────────────────────────────────────────────────────────
const CRISIS_PHRASES: { phrase: string; weight: number }[] = [
    { phrase: 'i want to die', weight: 100 },
    { phrase: 'i want to kill myself', weight: 100 },
    { phrase: 'kill myself', weight: 100 },
    { phrase: 'end my life', weight: 100 },
    { phrase: 'take my own life', weight: 100 },
    { phrase: 'thinking of suicide', weight: 90 },
    { phrase: 'suicidal thoughts', weight: 85 },
    { phrase: 'want to be dead', weight: 85 },
    { phrase: 'better off dead', weight: 85 },
    { phrase: 'hurt myself', weight: 75 },
    { phrase: 'self harm', weight: 75 },
    { phrase: 'cut myself', weight: 75 },
    { phrase: 'done with life', weight: 80 },
    { phrase: "won't be here anymore", weight: 80 },
    { phrase: 'end it all', weight: 75 },
    { phrase: 'no reason to live', weight: 75 }
];

// ── Per-Intent Keyword Groups (weighted) ──────────────────────────────────────
// Format: [keyword, weight]
// Higher weight = stronger signal for that intent.

const INTENT_KEYWORDS: Record<IntentType, [string, number][]> = {
    greeting: [
        ['hi', 8], ['hello', 8], ['hey', 8], ['good morning', 10],
        ['good evening', 10], ['good afternoon', 10], ['yo', 5], ['sup', 5],
        ['greetings', 8], ["how's it going", 7], ["what's up", 7]
    ],
    venting: [
        ['exhausted', 12], ['overwhelmed', 12], ['stressed', 10], ['stress', 9],
        ['cant cope', 14], ["can't cope", 14], ['falling apart', 14],
        ['too much', 10], ['fed up', 12], ['sick of', 12], ['burnt out', 14],
        ['piling up', 10], ['everything', 6], ['always', 7], ['never', 7],
        ['hate my life', 16], ['everything is wrong', 16], ['nothing works', 12],
        ['i give up', 14], ['i quit', 10], ['i cant do this', 14],
        ["i can't do this", 14], ['so tired of', 12], ['exhausting', 10],
        ['unbearable', 12], ['impossible', 9], ['frustrated', 10],
        ['angry', 9], ['furious', 10], ['mad', 7], ['rage', 10]
    ],
    emotional_reflection: [
        ['realized', 12], ['realize', 10], ['noticing', 11], ['noticed', 10],
        ['reflecting', 12], ['reflection', 12], ['looking back', 13],
        ['thinking about', 9], ['starting to understand', 14],
        ['i think i', 9], ['pattern', 11], ['i see now', 12],
        ['i understand', 10], ['makes sense now', 13], ['i learned', 11],
        ['insight', 11], ['processing', 10], ['journaling', 12],
        ['working through', 11], ['sitting with', 10], ['coming to terms', 13],
        ['accepting', 9], ['growing', 8]
    ],
    advice_request: [
        ['what should i do', 16], ['how do i', 12], ['how can i', 12],
        ['can you help me', 12], ['advice', 14], ['tips', 11],
        ['suggestions', 11], ['what would you recommend', 15],
        ['guide me', 13], ['help me figure out', 15], ['how to handle', 14],
        ['how to deal', 14], ['what can i do', 14], ['ways to', 11],
        ['strategy', 11], ['approach', 9], ['what do i do', 14],
        ['help me with', 12], ['teach me', 10]
    ],
    reassurance_seeking: [
        ['am i okay', 16], ['is this normal', 16], ['will it get better', 16],
        ['am i overreacting', 15], ['do you think', 10], ['is it okay to', 14],
        ['is it okay if', 14], ['am i wrong', 13], ['am i bad', 13],
        ['does it get easier', 15], ['will i be okay', 16],
        ['is this too much', 13], ['am i being dramatic', 15],
        ['validate', 12], ['tell me it will be okay', 16],
        ["i don't know if", 9], ['scared', 10], ['worried', 9],
        ['anxious', 9], ['anxiety', 9], ['fear', 8], ['panic', 10],
        ['nervous', 8], ['dread', 10], ['uncertain', 9], ['hopeless', 10],
        ['empty', 9], ['numb', 10], ['sad', 8], ['depressed', 10],
        ['lonely', 9], ['alone', 8], ['no one', 10], ['nobody', 9],
        ['invisible', 11]
    ],
    grounding_request: [
        ['help me calm down', 18], ['calm me down', 18], ['i need to calm', 15],
        ['help me breathe', 16], ['breathing exercise', 16], ['grounding', 16],
        ['ground me', 16], ["can't breathe", 15], ['i cant breathe', 15],
        ['panic attack', 16], ['panicking', 15], ['shaking', 12],
        ['heart racing', 14], ['chest tight', 14], ['overwhelmed right now', 15],
        ['too anxious', 13], ['help me relax', 15], ['need to relax', 14],
        ['bring me back', 14], ['anchor me', 14], ['i feel out of control', 15]
    ],
    progress_update: [
        ['feeling better', 16], ['i feel better', 16], ['doing better', 15],
        ['things are improving', 16], ['getting better', 15], ['update', 10],
        ['wanted to share', 13], ['good news', 12], ['progress', 12],
        ['i managed to', 14], ['i was able to', 13], ['i did it', 13],
        ['accomplishment', 12], ['proud of myself', 15], ['milestone', 12],
        ['breakthrough', 13], ['things are looking up', 14],
        ['i had a good day', 15], ['positive', 9], ['grateful', 11],
        ['thankful', 10], ['happy', 8], ['hopeful', 11]
    ],
    crisis_signal: [],   // handled by CRISIS_PHRASES above
    out_of_scope: []     // handled by OUT_OF_SCOPE_PATTERNS above
};

// ── Multi-Word Phrase Scores ──────────────────────────────────────────────────
// Additional phrases that map directly to an intent with high specificity.

const INTENT_PHRASES: { phrase: string; type: IntentType; weight: number }[] = [
    // emotional_reflection
    { phrase: "i've been thinking a lot about", type: 'emotional_reflection', weight: 18 },
    { phrase: 'i think i understand why', type: 'emotional_reflection', weight: 18 },
    { phrase: "i'm starting to see", type: 'emotional_reflection', weight: 16 },
    { phrase: 'this made me realize', type: 'emotional_reflection', weight: 18 },
    // reassurance_seeking
    { phrase: 'is it normal to feel', type: 'reassurance_seeking', weight: 18 },
    { phrase: "i don't know if this is okay", type: 'reassurance_seeking', weight: 18 },
    { phrase: 'is it okay that i', type: 'reassurance_seeking', weight: 16 },
    // progress_update
    { phrase: 'i wanted to let you know', type: 'progress_update', weight: 16 },
    { phrase: "things have been better", type: 'progress_update', weight: 16 },
    { phrase: "i've been doing better", type: 'progress_update', weight: 18 },
    // advice_request
    { phrase: 'what should i do about', type: 'advice_request', weight: 18 },
    { phrase: 'do you have any advice', type: 'advice_request', weight: 18 },
    { phrase: 'how do i deal with', type: 'advice_request', weight: 18 },
    // venting
    { phrase: "i'm so tired of everything", type: 'venting', weight: 18 },
    { phrase: "i can't take it anymore", type: 'venting', weight: 20 },
    { phrase: "i've had enough", type: 'venting', weight: 16 },
    // grounding
    { phrase: 'help me get through this moment', type: 'grounding_request', weight: 18 },
    { phrase: "i'm having a panic attack", type: 'grounding_request', weight: 20 },
];

// ── Subject Extraction ────────────────────────────────────────────────────────

const SUBJECT_FILLERS = new Set([
    'hi', 'hey', 'hello', 'feel', 'bad', 'good', 'okay', 'ok',
    'just', 'maybe', 'really', 'very', 'much', 'lot', 'bit', 'little'
]);

function extractSubject(message: string, keywords: string[]): string | undefined {
    const candidates = [...keywords]
        .filter(k => k.length > 3 && !SUBJECT_FILLERS.has(k.toLowerCase()))
        .sort((a, b) => b.length - a.length);

    if (candidates.length > 0) return candidates[0];

    const topicMatch = message.match(
        /(?:about|with|on|regarding|handle|dealing with|struggling with) ([\w\s]{3,25})(?:[.!?]|$)/i
    );
    if (topicMatch?.[1]) {
        return topicMatch[1].trim().replace(/^(my|the|some|any) /i, '');
    }
    return undefined;
}

// ── Action Type from Intent ───────────────────────────────────────────────────

function intentToAction(intent: IntentType): ActionType {
    switch (intent) {
        case 'greeting': return 'GREET';
        case 'venting': return 'VENT';
        case 'emotional_reflection': return 'REFLECT';
        case 'advice_request': return 'ADVICE';
        case 'reassurance_seeking': return 'VENT';
        case 'grounding_request': return 'GROUND';
        case 'progress_update': return 'REFLECT';
        case 'crisis_signal': return 'CRISIS';
        case 'out_of_scope': return 'REDIRECT';
    }
}

// ── Context-Aware Boost ───────────────────────────────────────────────────────

/**
 * Adjusts raw scores based on recent memory context.
 * Uses the last few facts to reinforce likely continuations.
 */
function applyContextBoost(
    scores: Record<IntentType, number>,
    memory: ConversationMemory
): void {
    const recentFacts = memory.facts.slice(-3);
    const lastIntent = memory.facts.at(-1)?.emotion ?? null;
    const turnCount = memory.turnCount;

    for (const fact of recentFacts) {
        switch (fact.emotion) {
            // If user was venting, they may be seeking reassurance or reflecting next
            case 'venting':
                scores['reassurance_seeking'] += 8;
                if (turnCount > 2) scores['emotional_reflection'] += 5;
                break;
            // If previously reflecting, boost continued reflection
            case 'emotional_reflection':
                scores['emotional_reflection'] += 10;
                scores['progress_update'] += 5;
                break;
            // Reassurance after anxiety pattern: crisis_signal boost if intensifying
            case 'reassurance_seeking':
                if (fact.intensity === 'HIGH') scores['crisis_signal'] += 10;
                scores['reassurance_seeking'] += 6;
                break;
            // If previous turn was crisis, still monitor
            case 'crisis_signal':
                scores['crisis_signal'] += 20;
                break;
            // Previous grounding → may still need ground or now reassurance
            case 'grounding_request':
                scores['grounding_request'] += 8;
                scores['reassurance_seeking'] += 6;
                break;
            // Progress update continuation
            case 'progress_update':
                scores['progress_update'] += 8;
                scores['emotional_reflection'] += 6;
                break;
        }
    }

    // If this is the very first turn, boost greeting
    if (turnCount === 0) scores['greeting'] += 15;
}

// ── Main Classifier ───────────────────────────────────────────────────────────

export class IntentClassifier {
    /**
     * Classifies a user message into a mental-health intent.
     *
     * @param message   Raw user message
     * @param memory    Optional: recent conversation memory for context boost
     * @returns         IntentMatch with type, actionType, confidence (0–100), keywords, subject
     */
    static classify(message: string, memory?: ConversationMemory): IntentMatch {
        const msg = message.toLowerCase().trim();

        // ── 1. Hard-block: Out-of-scope patterns ────────────────────────────
        const hasMhOverride = MH_OVERRIDE_SIGNALS.some(p => p.test(msg));
        if (!hasMhOverride) {
            for (const pattern of OUT_OF_SCOPE_PATTERNS) {
                if (pattern.test(msg)) {
                    return {
                        type: 'out_of_scope',
                        actionType: 'REDIRECT',
                        confidence: 95,
                        matchedKeywords: [],
                        subject: undefined
                    };
                }
            }
        }

        // ── 2. Crisis phrase pass ────────────────────────────────────────────
        let crisisScore = 0;
        const crisisMatches: string[] = [];
        for (const { phrase, weight } of CRISIS_PHRASES) {
            if (msg.includes(phrase)) {
                crisisScore += weight;
                crisisMatches.push(phrase);
            }
        }
        if (crisisScore >= 75) {
            return {
                type: 'crisis_signal',
                actionType: 'CRISIS',
                confidence: Math.min(crisisScore, 100),
                matchedKeywords: crisisMatches,
                subject: undefined
            };
        }

        // ── 3. Keyword scoring ───────────────────────────────────────────────
        const scores: Record<IntentType, number> = {
            greeting: 0, venting: 0, emotional_reflection: 0,
            advice_request: 0, reassurance_seeking: 0, grounding_request: 0,
            progress_update: 0, crisis_signal: crisisScore, out_of_scope: 0
        };

        const matchedKeywords: string[] = [];

        for (const [intent, pairs] of Object.entries(INTENT_KEYWORDS) as [IntentType, [string, number][]][]) {
            for (const [keyword, weight] of pairs) {
                if (msg.includes(keyword)) {
                    scores[intent] += weight;
                    if (!matchedKeywords.includes(keyword)) matchedKeywords.push(keyword);
                }
            }
        }

        // ── 4. Phrase scoring ────────────────────────────────────────────────
        for (const { phrase, type, weight } of INTENT_PHRASES) {
            if (msg.includes(phrase)) {
                scores[type] += weight;
                if (!matchedKeywords.includes(phrase)) matchedKeywords.push(phrase);
            }
        }

        // ── 5. Heuristics ────────────────────────────────────────────────────
        if (msg.length > 200) scores['venting'] += 12;
        if ((msg.match(/!/g) || []).length > 2) scores['venting'] += 8;
        if (msg.includes('?') && msg.length < 60) scores['reassurance_seeking'] += 8;
        if (msg.length < 6 && scores['greeting'] > 0) scores['greeting'] += 10;

        // ── 6. Context-aware boost from memory ──────────────────────────────
        if (memory) applyContextBoost(scores, memory);

        // ── 7. Pick winner ───────────────────────────────────────────────────
        let topIntent: IntentType = 'venting'; // meaningful fallback
        let maxScore = 0;

        for (const [intent, score] of Object.entries(scores) as [IntentType, number][]) {
            if (score > maxScore) { maxScore = score; topIntent = intent; }
        }

        // If nothing scored, default to venting (assume user is expressing something)
        if (maxScore === 0) topIntent = 'venting';

        // Confidence: normalized 0-100, dampened to avoid false overconfidence
        const confidence = Math.min(Math.round((maxScore / (maxScore + 25)) * 100), 100);

        return {
            type: topIntent,
            actionType: intentToAction(topIntent),
            confidence,
            matchedKeywords: Array.from(new Set(matchedKeywords)),
            subject: extractSubject(message, matchedKeywords)
        };
    }
}
