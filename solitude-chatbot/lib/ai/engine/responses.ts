import {
    IntentType,
    IntentMatch,
    ConversationMemory,
    ResponsePlan,
    ConversationStage,
} from './types';

// ─── ResponseGenerator ────────────────────────────────────────────────────────
//
// Converts a ResponsePlan into a concrete response string.
//
// Pipeline (per call):
//   Step 1 — Build Context Anchor    (grounds reply; optionally weaves active topic)
//   Step 2 — Build Emotional Reflection (tone + emotional context aware)
//   Step 3 — Build Adaptive Continuation (plan-type + stage + forceGrounding)
//   Step 4 — Assemble & cap at 3 sentences
//
// Phrase selection is deterministic: seed = f(message.length, turnCount).
// Same message + same turn → same phrase; different inputs → variation.
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Utilities ─────────────────────────────────────────────────────────────────

function pick<T>(bank: T[], seed: number): T {
    return bank[seed % bank.length];
}

function join(...parts: (string | undefined | null)[]): string {
    return parts.filter(Boolean).join(' ');
}

function capSentences(text: string): string {
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
    return sentences.slice(0, 3).join(' ');
}

// ── Phrase banks ──────────────────────────────────────────────────────────────
// Step 1 — Context Anchor (opening, grounded in the user's message)

const ANCHORS_VENTING: string[] = [
    "That's a lot to carry all at once.",
    "Yeah — that weight you're describing is real.",
    "What you're going through sounds genuinely exhausting.",
    "I hear how heavy this has been for you.",
    "Something about what you're sharing feels particularly difficult right now.",
    "That sounds like a lot to hold.",
    "There's a heaviness in what you're describing that I don't want to gloss over.",
];

const ANCHORS_REFLECTION: string[] = [
    "What you're noticing about yourself takes real honesty.",
    "That kind of looking inward isn't easy.",
    "The fact that you're seeing this says something.",
    "There's real awareness in what you're describing.",
    "Sitting with something like this takes courage.",
    "There's something meaningful in that kind of self-awareness.",
];

const ANCHORS_ADVICE: string[] = [
    "I hear that you're looking for a way through this.",
    "You're trying to figure out the right move — that matters.",
    "It makes sense to want something concrete here.",
    "You're asking the right kind of question.",
    "I hear that you want to actually do something about this.",
    "There's something grounded in wanting a path forward.",
];

const ANCHORS_REASSURANCE: string[] = [
    "What you're feeling makes complete sense.",
    "That kind of uncertainty is genuinely hard to sit with.",
    "I hear the worry underneath what you're sharing.",
    "I notice you're looking for some solid ground here.",
    "The fact that you're asking this tells me you're paying attention to yourself.",
    "That concern is real — and it makes sense that it's weighing on you.",
];

const ANCHORS_GROUNDING: string[] = [
    "Right now, let's just be here together.",
    "You don't need to go anywhere else in your head right now.",
    "Let's slow this moment down — just for a beat.",
    "I'm here with you in this moment.",
    "For right now, nothing else needs solving.",
    "You're safe right here. Let's just breathe for a moment.",
];

const ANCHORS_PROGRESS: string[] = [
    "I'm really glad you're sharing this.",
    "Something shifted — and you noticed it.",
    "That sounds like a genuine step forward.",
    "What you're describing matters more than it might feel like.",
    "It's good to hear something different in what you're sharing.",
    "That kind of shift doesn't come out of nowhere — it comes from you.",
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

// ── Topic Bridge Variants (indexed by plan.topicPhraseIndex % 6) ──────────────
// Six phrasings to rotate through so the same topic isn't always anchored
// with the same structure. Index is driven by memory.topicPhraseIndex.

const TOPIC_BRIDGE_VARIANTS: string[] = [
    "Especially with what's been coming up around %TOPIC% —",
    "Given the pressure around %TOPIC% —",
    "With what's been happening around %TOPIC% —",
    "The weight around %TOPIC% —",
    "That %TOPIC% layer you've been carrying —",
    "The ongoing %TOPIC% piece —",
];

// ── Step 2 — Emotional Reflections ───────────────────────────────────────────
// Three sets: for escalating/stable/de-escalating tone (existing)
// Plus two new context-specific sets: persistent negative and improving.

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

// Persistent negative: containment-focused
const REFLECTIONS_PERSISTENT_NEGATIVE: string[] = [
    "It sounds like you've been carrying this for a while now.",
    "This seems like it's been weighing on you consistently — not just today.",
    "The heaviness in what you're sharing isn't new, and that matters.",
    "I can tell this hasn't just been a rough day — it's been a rough stretch.",
    "What you're describing sounds ongoing, and that kind of sustained weight is real.",
];

// Improving context: encouragement-focused
const REFLECTIONS_IMPROVING: string[] = [
    "There's something different in how you're approaching this.",
    "I notice the weight in your words has shifted a little.",
    "Something in how you're talking about this feels more steady.",
    "There's a quiet steadiness starting to come through.",
    "What you're describing sounds like it's starting to settle, even slightly.",
];

// ── Step 3 — Adaptive Continuations ──────────────────────────────────────────
// For key intents, three stage variants: early / middle / later.

// VENTING — statements
const CONTINUATIONS_VENTING_STATEMENT_EARLY: string[] = [
    "You don't have to figure it out right now — just let it sit here.",
    "There's no need to fix anything in this moment.",
    "You're allowed to just feel this without having to explain it.",
    "I'm not going anywhere — take all the time you need.",
    "It doesn't all have to make sense at once.",
];
const CONTINUATIONS_VENTING_STATEMENT_MIDDLE: string[] = [
    "Even as you've been sitting with all of this, there's no rush to resolve it.",
    "You've shared a lot — and sometimes the most honest thing is to just keep feeling it.",
    "Given everything you've been carrying, there's no need to wrap it up neatly.",
    "You've been with this for a while. It's okay to still not have it sorted.",
];
const CONTINUATIONS_VENTING_STATEMENT_LATER: string[] = [
    "After everything you've walked through in these conversations, you're still here — and that counts.",
    "You've stayed with this honestly, and that kind of endurance is real.",
    "There's something to be said for still showing up with it, even when it hasn't resolved.",
    "You've been doing the hard work of just being with this — that matters.",
];

// VENTING — questions
const CONTINUATIONS_VENTING_QUESTION_EARLY: string[] = [
    "Is there one part of this that's feeling heaviest right now?",
    "What part of this has been the hardest to carry?",
    "When did this start feeling like too much?",
    "What does this kind of exhaustion feel like for you, specifically?",
];
const CONTINUATIONS_VENTING_QUESTION_MIDDLE: string[] = [
    "Given everything you've been describing — what feels most stuck right now?",
    "Of everything you've shared, what's the part that keeps coming back to you?",
    "What's been the hardest thing to sit with through all of this?",
];
const CONTINUATIONS_VENTING_QUESTION_LATER: string[] = [
    "After sitting with this across so many conversations — what still doesn't have a name?",
    "What's the piece of this you haven't quite been able to put into words yet?",
    "Of everything that's stayed with you — what feels most unfinished?",
];

// ADVICE — statements
const CONTINUATIONS_ADVICE_EARLY: string[] = [
    "One place to start: name the single most urgent piece — just one.",
    "Sometimes the clearest next step is the smallest one still within reach.",
    "Breaking this down into one thing at a time is not giving up — it's strategy.",
    "Before a full plan, what does a first, imperfect step look like?",
];
const CONTINUATIONS_ADVICE_MIDDLE: string[] = [
    "Given what you've already shared, there may already be something you know but haven't tried yet.",
    "Sometimes the thing that's hardest to name is also the thing most worth starting with.",
    "You've been thinking through this for a while — what feels like the real blocker?",
];
const CONTINUATIONS_ADVICE_LATER: string[] = [
    "After everything you've worked through on this, the next step might be smaller than it seems.",
    "You've been looking at this from a lot of angles — what does the simplest version of forward look like?",
    "This has been a long thread. Sometimes 'good enough' is the best move.",
];

// ADVICE — questions
const CONTINUATIONS_ADVICE_QUESTION_EARLY: string[] = [
    "What feels most urgent to you right now?",
    "What have you already tried, even if it didn't fully work?",
    "Where does this feel most stuck for you?",
];
const CONTINUATIONS_ADVICE_QUESTION_MIDDLE: string[] = [
    "Of everything you've described, what feels like it has the most traction?",
    "What's the one thing, if it shifted, that would make the rest more manageable?",
];
const CONTINUATIONS_ADVICE_QUESTION_LATER: string[] = [
    "After all the angles you've looked at — what's the thing you keep coming back to?",
    "What would 'good enough' actually look like from where you are now?",
];

// REASSURANCE (stage-independent — normalization doesn't need stage variety)
const CONTINUATIONS_REASSURANCE: string[] = [
    "You're not overreacting — this is a real thing to navigate.",
    "There's nothing wrong with you for feeling this way.",
    "What you're describing makes sense given everything you're holding.",
    "You're doing your best in something that's genuinely hard.",
    "Feeling uncertain like this doesn't mean you're broken — it means you're human.",
    "You don't need to earn the right to feel this way.",
];

// GROUNDING exercises (stage-independent)
const CONTINUATIONS_GROUNDING: string[] = [
    "Take one slow breath all the way down — then let it go, and notice what's still there.",
    "Feel the weight of your feet on the floor. That's solid. That's here. That's real.",
    "Name three things you can see right now — just three, out loud or in your head.",
    "Put one hand on your chest. Feel it rise. Slow it down, just slightly — that's enough.",
    "Focus on just your next breath. One breath. Nothing else needs to happen yet.",
    "Let your shoulders drop. Notice the chair or surface beneath you. You're held.",
];

// PROGRESS — statements
const CONTINUATIONS_PROGRESS_EARLY: string[] = [
    "That kind of shift doesn't happen without real effort — and that counts.",
    "Progress isn't always loud or obvious, but what you're describing is real.",
    "You showed up for yourself, and that's what this was always about.",
    "It's worth pausing to actually feel that — not rushing past it.",
];
const CONTINUATIONS_PROGRESS_MIDDLE: string[] = [
    "You've been sitting with this for a while, and this shift is part of that work.",
    "That's not something that just happened — you've been moving toward it.",
    "The things you've been working through have been adding up to this.",
];
const CONTINUATIONS_PROGRESS_LATER: string[] = [
    "After everything you've carried in these conversations, this kind of shift is earned.",
    "You've stayed with this honestly across a lot of ground — and it's showing.",
    "This is what the long work looks like — something that changes slowly, then noticeable.",
];

// PROGRESS — questions
const CONTINUATIONS_PROGRESS_QUESTION: string[] = [
    "What do you think made the difference?",
    "How does it feel from the inside, being here today?",
    "What helped get you to this point?",
    "Is there something you want to hold onto from this?",
];

// GREETING
const CONTINUATIONS_GREETING: string[] = [
    "What's been on your mind?",
    "What would you like to talk about?",
    "What's been sitting with you lately?",
    "Where would you like to start?",
    "What's going on for you right now?",
];

// CRISIS
const CONTINUATIONS_CRISIS: string[] = [
    "You deserve real, human support — please reach out to AASRA at +91-9820466726, available 24/7.",
    "Please call AASRA now at +91-9820466726 — real support is there for you.",
    "Please don't face this alone — reach out to AASRA at +91-9820466726. You matter.",
];

// OUT OF SCOPE
const CONTINUATIONS_OOT: string[] = [
    "but I'm here if there's something you're feeling or going through that you'd like to talk about.",
    "but what I can do is listen if something's weighing on you emotionally.",
    "but if there's something on your mind emotionally, I'm here for that.",
    "but my space is about how you're doing — is there something there?",
];

// Force-grounding override (used when plan.forceGrounding = true regardless of intent)
const CONTINUATIONS_FORCE_GROUNDING: string[] = [
    "Right now — just one breath. Let everything else pause for just a moment.",
    "Let's slow this down together. Feel where you're sitting. You're here.",
    "Before anything else — one slow breath in, and let it go. That's the only thing right now.",
    "Put one hand on your chest. Feel it rise. Let that be enough for this moment.",
];

// ── Step builders ─────────────────────────────────────────────────────────────

function buildAnchor(
    intent: IntentMatch,
    memory: ConversationMemory,
    plan: ResponsePlan,
    seed: number
): string {
    let bank: string[];
    switch (intent.type as IntentType) {
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

    // Weave in recurring topic using rotating phrase variants
    if (plan.topicBridge) {
        const activeTopic = memory.topics
            .filter(t => t.occurrences >= 2)
            .sort((a, b) => b.occurrences - a.occurrences)[0];
        if (activeTopic) {
            // Rotate through 6 variants using topicPhraseIndex
            const bridgePhrase = TOPIC_BRIDGE_VARIANTS[plan.topicPhraseIndex % TOPIC_BRIDGE_VARIANTS.length]
                .replace('%TOPIC%', activeTopic.topic);
            anchor = `${anchor} ${bridgePhrase}`;
        }
    }

    return anchor;
}

function buildReflection(plan: ResponsePlan, seed: number): string {
    // Persistent negative overrides tone-trend bank
    if (plan.forceGrounding || plan.emotionalContext === 'negative') {
        // Use the persistent-negative bank when polarity is negative
        return pick(REFLECTIONS_PERSISTENT_NEGATIVE, seed);
    }
    if (plan.emotionalContext === 'positive') {
        return pick(REFLECTIONS_IMPROVING, seed);
    }
    // Neutral — fall back to tone-trend
    switch (plan.toneHint) {
        case 'ESCALATING': return pick(REFLECTIONS_ESCALATING, seed);
        case 'DE_ESCALATING': return pick(REFLECTIONS_DE_ESCALATING, seed);
        default: return pick(REFLECTIONS_STABLE, seed);
    }
}

function buildContinuation(
    intent: IntentMatch,
    plan: ResponsePlan,
    seed: number
): string {
    const { stage, useQuestion, forceGrounding } = plan;

    // Force-grounding override: regardless of intent, use a calming micro-exercise
    if (forceGrounding) {
        return pick(CONTINUATIONS_FORCE_GROUNDING, seed);
    }

    switch (intent.type as IntentType) {
        case 'venting':
        case 'emotional_reflection': {
            if (useQuestion) {
                const bank = stage === 'later'
                    ? CONTINUATIONS_VENTING_QUESTION_LATER
                    : stage === 'middle'
                        ? CONTINUATIONS_VENTING_QUESTION_MIDDLE
                        : CONTINUATIONS_VENTING_QUESTION_EARLY;
                return pick(bank, seed);
            }
            const bank = stage === 'later'
                ? CONTINUATIONS_VENTING_STATEMENT_LATER
                : stage === 'middle'
                    ? CONTINUATIONS_VENTING_STATEMENT_MIDDLE
                    : CONTINUATIONS_VENTING_STATEMENT_EARLY;
            return pick(bank, seed);
        }

        case 'advice_request': {
            if (useQuestion) {
                const bank = stage === 'later'
                    ? CONTINUATIONS_ADVICE_QUESTION_LATER
                    : stage === 'middle'
                        ? CONTINUATIONS_ADVICE_QUESTION_MIDDLE
                        : CONTINUATIONS_ADVICE_QUESTION_EARLY;
                return pick(bank, seed);
            }
            const bank = stage === 'later'
                ? CONTINUATIONS_ADVICE_LATER
                : stage === 'middle'
                    ? CONTINUATIONS_ADVICE_MIDDLE
                    : CONTINUATIONS_ADVICE_EARLY;
            return pick(bank, seed);
        }

        case 'reassurance_seeking':
            return pick(CONTINUATIONS_REASSURANCE, seed);

        case 'grounding_request':
            return pick(CONTINUATIONS_GROUNDING, seed);

        case 'progress_update': {
            if (useQuestion) return pick(CONTINUATIONS_PROGRESS_QUESTION, seed);
            const bank = stage === 'later'
                ? CONTINUATIONS_PROGRESS_LATER
                : stage === 'middle'
                    ? CONTINUATIONS_PROGRESS_MIDDLE
                    : CONTINUATIONS_PROGRESS_EARLY;
            return pick(bank, seed);
        }

        case 'greeting':
            return pick(CONTINUATIONS_GREETING, seed);

        case 'crisis_signal':
            return pick(CONTINUATIONS_CRISIS, seed);

        case 'out_of_scope':
            return pick(CONTINUATIONS_OOT, seed);

        default:
            return pick(CONTINUATIONS_VENTING_STATEMENT_EARLY, seed);
    }
}

// ── ResponseGenerator ─────────────────────────────────────────────────────────

export class ResponseGenerator {
    /**
     * Generates a response string from a ResponsePlan.
     *
     * @param intent      Classified intent for this turn
     * @param memory      Current conversation memory (pre-turn state)
     * @param userMessage Raw user message (used for deterministic seed)
     * @param plan        ResponsePlan from ResponsePlanner
     * @returns           Draft response string (before RepetitionGuard)
     */
    static generate(
        intent: IntentMatch,
        memory: ConversationMemory,
        userMessage: string,
        plan: ResponsePlan
    ): string {
        // Deterministic seed: same message + same turn → same phrase
        const seed = (userMessage.length + memory.turnCount * 7) | 0;

        // ── Step 1: Context Anchor ────────────────────────────────────────────
        const anchor = buildAnchor(intent, memory, plan, seed);

        // ── Step 2: Emotional Reflection ─────────────────────────────────────
        // Skipped for crisis / greeting / grounding / redirect
        const skipReflection = ['crisis_signal', 'greeting', 'grounding_request', 'out_of_scope']
            .includes(intent.type);
        const reflection = skipReflection ? null : buildReflection(plan, seed + 3);

        // ── Step 3: Adaptive Continuation ────────────────────────────────────
        const continuation = buildContinuation(intent, plan, seed + 5);

        // ── Assemble ──────────────────────────────────────────────────────────
        // Crisis / greeting / grounding / redirect: anchor + continuation only
        // All others: anchor + reflection + continuation
        let assembled: string;
        if (['greeting', 'crisis_signal', 'grounding_request', 'out_of_scope'].includes(intent.type)) {
            assembled = join(anchor, continuation);
        } else {
            assembled = join(anchor, reflection, continuation);
        }

        return capSentences(assembled);
    }
}
