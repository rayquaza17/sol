// ─── FallbackResponder ────────────────────────────────────────────────────────
//
// Provides pre-authored responses when Ollama is not available.
// Uses the same intent classification, stage, and intensity signals as the
// real pipeline so that responses remain contextually appropriate.
//
// This module is ONLY used when the Ollama connection fails.
// When Ollama is running, this module is never invoked.
//
// ─────────────────────────────────────────────────────────────────────────────

import {
    IntentType,
    ConversationStage,
    EmotionalIntensity,
    ConversationMemory,
    IntentMatch,
} from './ai/engine/types';

// ─── Per-Intent Response Banks ───────────────────────────────────────────────
//
// Each intent has multiple responses so we can rotate and avoid repetition.
// Responses follow the same style guidelines used in promptConstructor:
//   - 2–3 sentences max
//   - No clichés, no therapy jargon
//   - Warm and grounded tone
//   - Reference situation, not emotion labels
//   - Max 1 question, and only when it helps

const INTENT_RESPONSES: Record<IntentType, string[]> = {
    greeting: [
        "Hey — welcome. This is your space, no pressure at all. What's been on your mind lately?",
        "Hi there. I'm glad you're here. Whenever you're ready, feel free to share what's going on.",
        "Hey. Take a moment to settle in — there's no rush. I'm here whenever you'd like to talk.",
    ],

    venting: [
        "That sounds like a lot to carry. Sometimes just getting it out can take some of the weight off — you don't have to solve anything right now.",
        "When things pile up like that, it can feel relentless. One thing that sometimes helps is picking the smallest piece and starting there.",
        "That's a heavy load. You don't have to figure it all out at once — just getting through today is enough sometimes.",
        "It makes sense that you'd feel drained by all of that. Give yourself permission to take it one step at a time.",
        "When everything feels like too much, even small moments of rest matter. You're allowed to pause.",
    ],

    advice_request: [
        "One approach that often helps is breaking the problem into smaller, more manageable pieces — what feels like the most pressing part right now?",
        "A good starting point might be to focus on the one thing you can control today, even if it's small. That tends to build momentum over time.",
        "Sometimes writing things down — even just a quick list — helps make the situation feel less overwhelming and more concrete.",
        "Try setting just one small, specific goal for today. Not a fix for everything, but one thing you can actually do. That builds forward momentum.",
        "A practical first step could be talking to someone you trust about what you're going through — even a short conversation can shift your perspective.",
    ],

    reassurance_seeking: [
        "What you're going through is a real, valid experience. Many people face similar moments — it doesn't make you weak or broken.",
        "It's completely normal to feel this way given what you've described. These feelings don't define you — they're part of a difficult moment.",
        "You're not overreacting. What you're dealing with genuinely matters, and reaching out about it takes strength.",
        "Feeling uncertain about whether your feelings are valid is itself a sign you care deeply. That's not a flaw — it's human.",
        "These kinds of feelings are more common than people talk about. You're not alone in this, even when it feels that way.",
    ],

    grounding_request: [
        "Let's slow things down for a moment. Try focusing on five things you can see around you right now — just notice them, nothing more.",
        "Take a slow breath in for four counts, hold for four, and breathe out for six. Do this three times. I'll be right here.",
        "Place both feet flat on the ground and press them down gently. Notice the weight of your body in the chair. You're here, right now, and you're safe.",
        "Try this: name three things you can hear right now. Just listen for a moment — it can help bring you back to the present.",
        "Put your hand on your chest and feel your heartbeat. You're here. You're breathing. That's all you need to focus on right now.",
    ],

    emotional_reflection: [
        "That kind of self-awareness takes real honesty. Sitting with what you've noticed — even when it's uncomfortable — is part of growth.",
        "Recognizing those patterns in yourself is significant. It doesn't mean you have to change everything at once, but seeing it clearly matters.",
        "Reflecting like this can be uncomfortable, but it's also where the most meaningful shifts happen. What you're noticing is important.",
        "That's a thoughtful observation. Understanding the 'why' behind your reactions often makes them easier to work with over time.",
    ],

    progress_update: [
        "That's real progress — even if it feels small, it matters. Momentum builds from moments exactly like this.",
        "I'm glad to hear that. Taking the time to notice what's going well is just as important as working through the hard parts.",
        "That's something to feel good about. Growth isn't always dramatic — sometimes it's just showing up differently, the way you're doing now.",
        "That takes effort, and you should give yourself credit for it. Progress isn't always linear, but this is a meaningful step forward.",
    ],

    crisis_signal: [
        "What you're feeling right now is real, and you don't have to face it alone. Please reach out to someone you trust — a friend, family member, or anyone nearby. You can also call iCall at 9152987821 (Monday–Saturday, 8am–10pm).",
        "I hear you, and I'm glad you said something. Please talk to someone close to you, or call iCall at 9152987821 or AASRA at 9820466627. Real human support matters most right now.",
        "You matter, and what you're going through deserves real support. Please call iCall at 9152987821 or the Vandrevala Foundation helpline at 1860-2662-345 — they're available to help.",
    ],

    out_of_scope: [
        "That's outside what I'm built for. I focus on emotional wellbeing and support — but if something's been weighing on you lately, I'm here to listen.",
        "I'm designed to help with emotional wellbeing and mental health support. If there's something on your mind in that space, I'd love to help.",
    ],
};

// ─── Stage Modifiers ─────────────────────────────────────────────────────────
//
// Short suffix phrases appended occasionally based on conversation stage.
// Keeps the flow aligned with stage-aware behavior.

const STAGE_SUFFIXES: Partial<Record<ConversationStage, string[]>> = {
    initial: [
        "Take your time — there's no pressure to share more than you're ready for.",
    ],
    exploring: [
        "If you'd like to go deeper into any of that, I'm here.",
    ],
    deepening: [],
    stabilizing: [
        "It sounds like you've been working through a lot. Take a breath when you need one.",
    ],
    closing: [
        "You've shared a lot today — that takes courage.",
    ],
};

// ─── Intensity Modifiers ─────────────────────────────────────────────────────
//
// Brief empathic prefixes for HIGH intensity messages.

const HIGH_INTENSITY_PREFIXES: string[] = [
    "I can tell this is hitting hard right now.",
    "That's clearly weighing on you — and I hear that.",
    "This sounds really intense. You don't have to carry it alone.",
];

// ─── Topic-Aware Micro-Suggestions ───────────────────────────────────────────

const TOPIC_SUGGESTIONS: Record<string, string[]> = {
    exam: [
        "When exam pressure builds up, tackling one small topic at a time often makes the load feel more manageable.",
        "Sometimes setting a timer for 25 minutes of focused study, then a short break, helps make things feel less overwhelming.",
    ],
    exams: [
        "Breaking your revision into smaller chunks with breaks in between can make a big difference in how manageable it feels.",
    ],
    sleep: [
        "If sleep has been tough, try putting screens away 30 minutes before bed and keeping the room cool — small changes can help.",
        "A short wind-down routine before bed — even just 10 minutes of quiet reading — can help signal to your body that it's time to rest.",
    ],
    work: [
        "When work feels relentless, identifying the single most important task for today — just one — can help cut through the noise.",
    ],
    deadline: [
        "Deadlines can feel crushing. Try listing what's due and picking the most urgent one — just getting started often eases the pressure.",
    ],
    burnout: [
        "Burnout often happens when the demands outpace recovery. Even 15 minutes of something non-productive — a walk, music, nothing — can help.",
    ],
    anxiety: [
        "When anxiety spikes, grounding yourself in the present moment — feet on floor, slow breaths — can help take the edge off.",
    ],
    lonely: [
        "Loneliness can feel heavy. Even reaching out to one person today — a short message, a quick call — can start to ease it.",
    ],
    overwhelmed: [
        "When everything feels like too much, pick just one small thing you can do right now. The rest can wait.",
    ],
};

// ─── Selection Helpers ───────────────────────────────────────────────────────

/** Picks a response from the bank, avoiding the last used response if possible. */
function pickResponse(bank: string[], recentResponses: string[]): string {
    // Try to avoid exact repetition with last 3 responses
    const available = bank.filter(r => !recentResponses.includes(r));
    const pool = available.length > 0 ? available : bank;
    return pool[Math.floor(Math.random() * pool.length)];
}

/** Checks if any topic from memory matches our topic suggestions */
function getTopicSuggestion(memory: ConversationMemory): string | null {
    for (const t of memory.topics) {
        const key = t.topic.toLowerCase();
        if (TOPIC_SUGGESTIONS[key]) {
            const suggestions = TOPIC_SUGGESTIONS[key];
            return suggestions[Math.floor(Math.random() * suggestions.length)];
        }
    }
    return null;
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export interface FallbackInput {
    intent: IntentMatch;
    stage: ConversationStage;
    intensity: EmotionalIntensity;
    memory: ConversationMemory;
    isCrisis: boolean;
}

/**
 * Generates a contextually appropriate fallback response when Ollama is unavailable.
 *
 * Uses the same intent, stage, and intensity signals from the engine pipeline.
 * Responses are pre-authored and follow the same style guidelines as the prompt
 * engineering used for the LLM.
 */
export function generateFallbackResponse(input: FallbackInput): string {
    const { intent, stage, intensity, memory, isCrisis } = input;
    const recentResponses = memory.recentResponses || [];

    // Crisis always gets crisis response
    if (isCrisis || intent.type === 'crisis_signal') {
        return pickResponse(INTENT_RESPONSES['crisis_signal'], recentResponses);
    }

    // Pick base response from intent bank
    const intentType: IntentType = intent.type;
    const bank = INTENT_RESPONSES[intentType] || INTENT_RESPONSES['venting'];
    let response = pickResponse(bank, recentResponses);

    // For venting at MEDIUM/HIGH intensity with known topics, try to add topic suggestion
    if (
        intentType === 'venting' &&
        (intensity === 'MEDIUM' || intensity === 'HIGH')
    ) {
        const topicSuggestion = getTopicSuggestion(memory);
        if (topicSuggestion) {
            response = topicSuggestion;
        }
    }

    // Add HIGH intensity prefix occasionally
    if (intensity === 'HIGH' && intentType !== 'greeting') {
        const prefix = HIGH_INTENSITY_PREFIXES[Math.floor(Math.random() * HIGH_INTENSITY_PREFIXES.length)];
        response = `${prefix} ${response}`;
    }

    // Add stage suffix occasionally (30% chance, to keep it natural)
    const stageSuffixes = STAGE_SUFFIXES[stage];
    if (stageSuffixes && stageSuffixes.length > 0 && Math.random() < 0.3) {
        const suffix = stageSuffixes[Math.floor(Math.random() * stageSuffixes.length)];
        response = `${response} ${suffix}`;
    }

    return response;
}
