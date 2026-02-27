import {
    IntentType,
    IntentMatch,
    ConversationMemory,
    ToneTrend,
} from './types';

// ─── ResponseGenerator ────────────────────────────────────────────────────────
//
// Rule-based mini conversational model for mental health.
//
// Every response is composed in three deterministic steps:
//
//   Step 1 — Context Anchor
//     Grounds the reply in the user's latest message and/or an active memory topic.
//
//   Step 2 — Emotional Reflection
//     Reflects the detected emotional state in plain, non-clinical language.
//
//   Step 3 — Adaptive Continuation
//     Intent-specific: reflection + curiosity (venting), structured suggestion
//     (advice), normalization + grounding (reassurance), short exercise (grounding),
//     or encouragement + continuity (progress).
//
// Hard rules enforced before returning:
//   - Max 3 sentences total
//   - Max 1 question per response
//   - No consecutive questions (enforced by RepetitionGuard + build logic)
//   - RepetitionGuard is applied by ConversationEngine (separation of concerns)
//
// No static template pools. Every sentence is assembled from phrase banks that
// are selected deterministically from the live context (message length, subject,
// active topic, tone trend, turn count).
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Phrase banks ─────────────────────────────────────────────────────────────
// Each bank is an array of strings. A single item is selected deterministically
// using a seed derived from the input message (msg.length % bank.length).
// This means the same message always gives the same phrase — but different
// messages produce different ones, creating natural variation.

// Step 1 — Context Anchor phrases (opening, acknowledging the message)
const ANCHORS_VENTING: string[] = [
    "That's a lot to carry all at once.",
    "Yeah — that weight you're describing is real.",
    "What you're going through sounds genuinely exhausting.",
    "I hear how heavy this has been for you.",
    "Something about what you're sharing feels particularly difficult right now.",
];

const ANCHORS_REFLECTION: string[] = [
    "What you're noticing about yourself takes real honesty.",
    "That kind of looking inward isn't easy.",
    "The fact that you're seeing this says something.",
    "There's real awareness in what you're describing.",
    "Sitting with something like this takes courage.",
];

const ANCHORS_ADVICE: string[] = [
    "I hear that you're looking for a way through this.",
    "You're trying to figure out the right move — that matters.",
    "It makes sense to want something concrete here.",
    "You're asking the right kind of question.",
    "I hear that you want to actually do something about this.",
];

const ANCHORS_REASSURANCE: string[] = [
    "What you're feeling makes complete sense.",
    "That kind of uncertainty is genuinely hard to sit with.",
    "I hear the worry underneath what you're sharing.",
    "I notice you're looking for some solid ground here.",
    "The fact that you're asking this tells me you're paying attention to yourself.",
];

const ANCHORS_GROUNDING: string[] = [
    "Right now, let's just be here together.",
    "You don't need to go anywhere else in your head right now.",
    "Let's slow this moment down — just for a beat.",
    "I'm here with you in this moment.",
    "For right now, nothing else needs solving.",
];

const ANCHORS_PROGRESS: string[] = [
    "I'm really glad you're sharing this.",
    "Something shifted — and you noticed it.",
    "That sounds like a genuine step forward.",
    "What you're describing matters more than it might feel like.",
    "It's good to hear something different in what you're sharing.",
];

const ANCHORS_GREETING: string[] = [
    "Hey — I'm here.",
    "Hi, I'm glad you came.",
    "Hello. Take all the time you need.",
    "Hey there — this space is yours.",
    "Hi. No rush at all.",
];

const ANCHORS_CRISIS: string[] = [
    "I'm really glad you said something.",
    "Thank you for trusting me with this.",
    "I hear how much pain you're in right now.",
    "What you're feeling is real, and you deserve support.",
];

const ANCHORS_OOT: string[] = [
    "That's a bit outside what I'm here to help with —",
    "I'm focused on the emotional side of things, so I can't really help with that —",
    "That's not quite in my space —",
    "I'm not really built for general questions —",
];

// Step 2 — Emotional Reflection (middle sentence, grounded in tone trend)
const REFLECTIONS_ESCALATING: string[] = [
    "It sounds like the weight of this is building.",
    "I can feel things intensifying in what you're sharing.",
    "It seems like everything is pressing in at once.",
    "There's a lot piling on right now.",
    "I sense this is feeling heavier than before.",
];

const REFLECTIONS_DE_ESCALATING: string[] = [
    "I notice something shifting slightly in how you're talking about this.",
    "There seems to be a turning point happening, even if it's small.",
    "Something sounds a little steadier underneath all this.",
    "It feels like you're finding slightly more footing.",
    "I can sense a small pause in the weight — even briefly.",
];

const REFLECTIONS_STABLE: string[] = [
    "This is something you've been sitting with.",
    "It seems like this has had real weight for you.",
    "I can hear that this matters to you.",
    "There's something underneath all this worth paying attention to.",
    "This isn't just surface stuff — I can tell.",
];

// Step 3 — Adaptive Continuation: one phrase per intent, intent-specific purpose

// venting: gentle curiosity (one inviting, non-interrogative or one soft question)
const CONTINUATIONS_VENTING_STATEMENT: string[] = [
    "You don't have to figure it out right now — just let it sit here.",
    "There's no need to fix anything in this moment.",
    "You're allowed to just feel this without having to explain it.",
    "I'm not going anywhere — you can take all the time you need with this.",
    "It doesn't all have to make sense at once.",
];
const CONTINUATIONS_VENTING_QUESTION: string[] = [
    "Is there one part of this that's feeling heaviest right now?",
    "What part of this has been the hardest to carry?",
    "When did this start feeling like too much?",
    "What does this kind of exhaustion feel like for you, specifically?",
    "Is there something underneath all of this that hasn't had space yet?",
];

// advice_request: structured, one small step
const CONTINUATIONS_ADVICE: string[] = [
    "One place to start: name the single most urgent piece — just one.",
    "Sometimes the clearest next step is the smallest one that's still within reach.",
    "It can help to ask: what's the one thing, if I did it, that would make the rest lighter?",
    "Breaking this down into one thing at a time is not giving up — it's strategy.",
    "Before a full plan, what does a first, imperfect step look like?",
];
const CONTINUATIONS_ADVICE_QUESTION: string[] = [
    "What feels most urgent to you right now?",
    "What have you already tried, even if it didn't fully work?",
    "What would 'making progress' look like to you, even just a little?",
    "Where does this feel most stuck for you?",
];

// reassurance_seeking: normalization + light grounding
const CONTINUATIONS_REASSURANCE: string[] = [
    "You're not overreacting — this is a real thing to navigate.",
    "There's nothing wrong with you for feeling this way.",
    "What you're describing makes sense given everything you're holding.",
    "You're doing your best in something that's genuinely hard.",
    "Feeling uncertain like this doesn't mean you're broken — it means you're human.",
];

// grounding_request: short structured exercise
const CONTINUATIONS_GROUNDING: string[] = [
    "Take one slow breath all the way down — then let it go, and notice what's still there.",
    "Feel the weight of your feet on the floor. That's solid. That's here. That's real.",
    "Name three things you can see right now — just three, out loud or in your head.",
    "Put one hand on your chest. Feel it rise. Slow it down, just slightly — that's enough.",
    "Focus on just your next breath. One breath. Nothing else needs to happen yet.",
];

// progress_update: acknowledgment + continuity
const CONTINUATIONS_PROGRESS: string[] = [
    "That kind of shift doesn't happen without real effort — I want you to know that counts.",
    "Progress isn't always loud or obvious, but what you're describing is real.",
    "You showed up for yourself, and that's what this was always about.",
    "It's worth pausing to actually feel that — not rushing past it.",
    "What you're sharing today is different, and that's meaningful.",
];
const CONTINUATIONS_PROGRESS_QUESTION: string[] = [
    "What do you think made the difference?",
    "How does it feel from the inside, being here today?",
    "What helped get you to this point?",
    "Is there something you want to hold onto from this?",
];

// greeting
const CONTINUATIONS_GREETING: string[] = [
    "What's been on your mind?",
    "What would you like to talk about?",
    "What's been sitting with you lately?",
    "Where would you like to start?",
    "What's going on for you right now?",
];

// crisis
const CONTINUATIONS_CRISIS: string[] = [
    "You deserve real, human support — please reach out to AASRA at +91-9820466726, available 24/7.",
    "Please call AASRA now at +91-9820466726 — real support is there for you.",
    "Please don't face this alone — reach out to AASRA at +91-9820466726. You matter.",
];

// out of scope
const CONTINUATIONS_OOT: string[] = [
    "but I'm here if there's something you're feeling or going through that you'd like to talk about.",
    "but what I can do is listen if something's weighing on you emotionally.",
    "but if there's something on your mind emotionally, I'm here for that.",
    "but my space is about how you're doing — is there something there?",
];

// Topic anchor phrases (used in Step 1 when active topic is available)
const TOPIC_BRIDGES: string[] = [
    "Especially with what's been coming up around %TOPIC% —",
    "Given what you've been dealing with around %TOPIC% —",
    "This adds up with what's been going on with %TOPIC% —",
    "Layered in with %TOPIC%, that makes a lot of sense —",
];

// Tone-trend bridges (injected at the start of Step 2)
const ESCALATION_BRIDGES: string[] = [
    "And it sounds like things are intensifying —",
    "There's a building feeling to all this —",
    "It's like the pressure keeps adding up —",
];

// ── Utilities ─────────────────────────────────────────────────────────────────

/** Deterministic index: consistent per message, varies across messages. */
function pick<T>(bank: T[], seed: number): T {
    return bank[seed % bank.length];
}

/**
 * Extracts the most salient noun/subject from the user message for anchoring.
 * Uses a simple noun-phrase heuristic on matched keywords.
 */
function extractAnchorSubject(
    message: string,
    intent: IntentMatch
): string | undefined {
    if (intent.subject) return intent.subject;

    // Try to pull a short meaningful phrase from the message
    const match = message.match(
        /(?:about|with|and|from|over|my|this|the)\s+([a-z][a-z ]{2,20})(?:\s|[.,!?]|$)/i
    );
    return match?.[1]?.trim().replace(/^(my|the|this|that)\s+/i, '');
}

/**
 * Checks whether the last assistant message in memory ended with a question.
 * Used to enforce the no-consecutive-questions rule.
 */
function lastTurnWasQuestion(memory: ConversationMemory): boolean {
    const msgs = memory.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
            return msgs[i].content.trim().endsWith('?');
        }
    }
    return false;
}

/** Joins non-empty parts into a single string with a space. */
function join(...parts: (string | undefined | null)[]): string {
    return parts.filter(Boolean).join(' ');
}

/** Trims output to at most 3 sentences. */
function capSentences(text: string): string {
    // Split on sentence-ending punctuation followed by whitespace or end-of-string
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
    return sentences.slice(0, 3).join(' ');
}

// ── Step builders ────────────────────────────────────────────────────────────

function buildAnchor(
    intent: IntentMatch,
    memory: ConversationMemory,
    message: string,
    seed: number
): string {
    const activeTopic = memory.topics
        .filter(t => t.occurrences >= 2)
        .sort((a, b) => b.occurrences - a.occurrences)[0];

    let bank: string[];
    switch (intent.type) {
        case 'venting': bank = ANCHORS_VENTING; break;
        case 'emotional_reflection': bank = ANCHORS_REFLECTION; break;
        case 'advice_request': bank = ANCHORS_ADVICE; break;
        case 'reassurance_seeking': bank = ANCHORS_REASSURANCE; break;
        case 'grounding_request': bank = ANCHORS_GROUNDING; break;
        case 'progress_update': bank = ANCHORS_PROGRESS; break;
        case 'greeting': bank = ANCHORS_GREETING; break;
        case 'crisis_signal': bank = ANCHORS_CRISIS; break;
        case 'out_of_scope': bank = ANCHORS_OOT; break;
        default: bank = ANCHORS_VENTING;
    }

    let anchor = pick(bank, seed);

    // Optionally weave in the active topic for non-greeting/crisis/oot intents
    const topicWorthy = !['greeting', 'crisis_signal', 'out_of_scope', 'grounding_request'].includes(intent.type);
    if (activeTopic && topicWorthy && memory.turnCount > 1) {
        const topicPhrase = pick(TOPIC_BRIDGES, seed + 1)
            .replace('%TOPIC%', activeTopic.topic);
        anchor = `${anchor} ${topicPhrase}`;
    }

    return anchor;
}

function buildReflection(
    trend: ToneTrend,
    seed: number
): string {
    switch (trend) {
        case 'ESCALATING': return pick(REFLECTIONS_ESCALATING, seed);
        case 'DE_ESCALATING': return pick(REFLECTIONS_DE_ESCALATING, seed);
        default: return pick(REFLECTIONS_STABLE, seed);
    }
}

function buildContinuation(
    intent: IntentMatch,
    memory: ConversationMemory,
    noQuestion: boolean,
    seed: number
): string {
    switch (intent.type) {
        case 'venting': {
            // Alternate between statement and question based on turn parity
            // (never consecutive questions)
            const useQuestion = !noQuestion && memory.turnCount % 2 === 1;
            return useQuestion
                ? pick(CONTINUATIONS_VENTING_QUESTION, seed)
                : pick(CONTINUATIONS_VENTING_STATEMENT, seed);
        }

        case 'emotional_reflection':
            // Reflection: always a grounded statement — no extra question pressure
            return pick(CONTINUATIONS_PROGRESS, seed); // reuses progress-style sentences

        case 'advice_request': {
            const useQuestion = !noQuestion && memory.turnCount % 2 === 0;
            return useQuestion
                ? pick(CONTINUATIONS_ADVICE_QUESTION, seed)
                : pick(CONTINUATIONS_ADVICE, seed);
        }

        case 'reassurance_seeking':
            // Always statement — normalization does not need a question
            return pick(CONTINUATIONS_REASSURANCE, seed);

        case 'grounding_request':
            // Always an exercise — never a question mid-grounding
            return pick(CONTINUATIONS_GROUNDING, seed);

        case 'progress_update': {
            const useQuestion = !noQuestion && memory.turnCount % 2 === 0;
            return useQuestion
                ? pick(CONTINUATIONS_PROGRESS_QUESTION, seed)
                : pick(CONTINUATIONS_PROGRESS, seed);
        }

        case 'greeting':
            // Single statement + a warm question is fine for greetings
            return pick(CONTINUATIONS_GREETING, seed);

        case 'crisis_signal':
            return pick(CONTINUATIONS_CRISIS, seed);

        case 'out_of_scope':
            return pick(CONTINUATIONS_OOT, seed);

        default:
            return pick(CONTINUATIONS_VENTING_STATEMENT, seed);
    }
}

// ── ResponseGenerator ─────────────────────────────────────────────────────────

export class ResponseGenerator {
    /**
     * Generates a contextually grounded response draft.
     *
     * Pipeline:
     *   1. Build Context Anchor   (grounds in user's message + active topic)
     *   2. Build Emotional Reflection (tone-trend aware, non-clinical)
     *   3. Build Adaptive Continuation (intent-specific rule)
     *   4. Assemble & cap at 3 sentences
     */
    static generate(
        intent: IntentMatch,
        memory: ConversationMemory,
        userMessage: string = ''
    ): string {

        // Deterministic seed from message length + turn count
        const seed = (userMessage.length + memory.turnCount * 7) | 0;

        // No-question guard: skip question if last assistant turn already asked one
        const noQuestion = lastTurnWasQuestion(memory);

        // ── Step 1: Context Anchor ────────────────────────────────────────────
        const anchor = buildAnchor(intent, memory, userMessage, seed);

        // ── Step 2: Emotional Reflection ─────────────────────────────────────
        // Skip for crisis (no time for reflection) and greeting (not applicable)
        const skipReflection = ['crisis_signal', 'greeting', 'grounding_request', 'out_of_scope']
            .includes(intent.type);
        const reflection = skipReflection
            ? null
            : buildReflection(memory.toneTrend, seed + 3);

        // ── Step 3: Adaptive Continuation ────────────────────────────────────
        const continuation = buildContinuation(intent, memory, noQuestion, seed + 5);

        // ── Assemble ──────────────────────────────────────────────────────────
        // Greeting: anchor is self-contained, continuation is the question
        // Crisis: anchor + crisis continuation (no reflection)
        // Grounding: anchor + grounding exercise (no reflection)
        // Others: anchor + reflection + continuation

        let assembled: string;
        if (['greeting', 'crisis_signal', 'grounding_request', 'out_of_scope'].includes(intent.type)) {
            assembled = join(anchor, continuation);
        } else {
            assembled = join(anchor, reflection, continuation);
        }

        // Cap at 3 sentences
        const capped = capSentences(assembled);
        return capped;
    }
}
