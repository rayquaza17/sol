import {
    IntentMatch,
    IntentType,
    EmotionalIntensity,
    EmotionalPolarity,
    ConversationMemory,
    ResponsePlan,
    ResponsePlanType,
    ConversationStage,
} from './types';

// ─── ResponsePlanner ──────────────────────────────────────────────────────────
//
// Decides the structural shape of the response for a single turn.
// Pure, stateless — takes (intent, intensity, memory), returns a plan.
//
// Decisions made here:
//   planType         — which phrase-bank strategy ResponseGenerator uses
//   useQuestion      — whether to append a question this turn
//   topicBridge      — whether to weave the active memory topic into the anchor
//   toneHint         — passes memory.toneTrend to ResponseGenerator
//   stage            — early/middle/later phrase variant selection
//   emotionalContext — negative/neutral/positive bank selection for reflections
//   forceGrounding   — overrides continuation to grounding on persistent negatives
//   topicPhraseIndex — monotonic counter that rotates bridge phrase variants
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Intent → Plan Type mapping ────────────────────────────────────────────────

const PLAN_MAP: Record<IntentType, ResponsePlanType> = {
    venting: 'anchor_reflection_curiosity',
    emotional_reflection: 'anchor_reflection_curiosity',
    advice_request: 'anchor_structured_suggestion',
    reassurance_seeking: 'normalization_grounding',
    grounding_request: 'grounding_exercise',
    progress_update: 'encouragement_continuity',
    greeting: 'warm_greeting',
    crisis_signal: 'crisis_override',
    out_of_scope: 'domain_redirect',
};

// ── Plans that never include a question ───────────────────────────────────────
const NO_QUESTION_PLANS = new Set<ResponsePlanType>([
    'normalization_grounding',
    'grounding_exercise',
    'crisis_override',
    'domain_redirect',
]);

// ── Plans that can carry a topic bridge ───────────────────────────────────────
const TOPIC_BRIDGE_ELIGIBLE = new Set<ResponsePlanType>([
    'anchor_reflection_curiosity',
    'anchor_structured_suggestion',
]);

// ── Pure helpers ──────────────────────────────────────────────────────────────

/** Derive conversation stage from turn count. */
function detectStage(turnCount: number): ConversationStage {
    if (turnCount < 5) return 'early';
    if (turnCount < 13) return 'middle';
    return 'later';
}

/** True if the last assistant message ended with a question. */
function lastTurnWasQuestion(memory: ConversationMemory): boolean {
    const msgs = memory.messages;
    for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
            return msgs[i].content.trim().endsWith('?');
        }
    }
    return false;
}

/** True when there is at least one topic that has recurred ≥ 2 times. */
function hasActiveTopic(memory: ConversationMemory): boolean {
    return memory.topics.some(t => t.occurrences >= 2);
}

/**
 * Derived emotional context:
 * - Uses emotionalTrend.polarity as the base.
 * - Overrides to 'positive' if tone is DE_ESCALATING (even if polarity is neutral).
 */
function detectEmotionalContext(memory: ConversationMemory): EmotionalPolarity {
    if (memory.toneTrend === 'DE_ESCALATING' && memory.emotionalTrend.polarity !== 'negative') {
        return 'positive';
    }
    return memory.emotionalTrend.polarity;
}

/**
 * True when the conversation has been persistently negative AND intensifying:
 *   - Last 3 intensity readings are all HIGH
 *   - Overall polarity is 'negative'
 * This triggers a grounding override regardless of intent.
 */
function shouldForceGrounding(memory: ConversationMemory): boolean {
    if (memory.emotionalTrend.polarity !== 'negative') return false;
    const recent = memory.intensityHistory.slice(-3);
    return recent.length >= 3 && recent.every(i => i === 'HIGH');
}

/**
 * Returns the effective plan type, applying advice regulation if needed.
 * When the user has asked for advice 2+ consecutive turns, we shift to
 * reflective exploration instead of repeating structured suggestions.
 */
function effectivePlanType(
    intent: IntentMatch,
    memory: ConversationMemory,
    basePlan: ResponsePlanType
): ResponsePlanType {
    if (
        intent.type === 'advice_request' &&
        (memory.consecutiveAdviceCount ?? 0) >= 2
    ) {
        // Shift: suggestion fatigue — explore instead of advise
        return 'anchor_reflection_curiosity';
    }
    return basePlan;
}

/**
 * Determines whether to include a question this turn.
 *
 * Blocked when:
 *   1. Plan type never includes questions (grounding, crisis, redirect, normalization)
 *   2. Intensity is HIGH (not the moment to probe)
 *   3. Last assistant turn already asked a question
 *   4. In 'later' stage: suppress every 3rd eligible turn (consolidation space)
 *   5. The dominant question type of the last 2 questions matches what would be asked
 *      (prevents "What... What... What..." loops — tracked via recentQuestionTypes)
 *
 * Uses even/odd alternation for eligible plans to pace question frequency.
 */
function resolveUseQuestion(
    planType: ResponsePlanType,
    intensity: EmotionalIntensity,
    memory: ConversationMemory,
    stage: ConversationStage
): boolean {
    // Hard blocks
    if (NO_QUESTION_PLANS.has(planType)) return false;
    if (intensity === 'HIGH') return false;
    if (lastTurnWasQuestion(memory)) return false;

    // Later-stage consolidation pause: suppress every 3rd question window
    const turn = memory.turnCount;
    if (stage === 'later' && turn % 3 === 0) return false;

    // "What" question-type overuse guard: if the last 2 question types are both "What",
    // suppress the next question regardless of parity (recentQuestionTypes are first words)
    const qt = memory.repetition.recentQuestionTypes ?? [];
    const lastTwo = qt.slice(-2);
    if (lastTwo.length === 2 && lastTwo[0] === lastTwo[1] && lastTwo[0] === 'What') return false;

    // Parity-based alternation (different by plan type to avoid all-sync)
    switch (planType) {
        case 'anchor_reflection_curiosity':
            return turn % 2 === 1;  // odd turns
        case 'anchor_structured_suggestion':
        case 'encouragement_continuity':
            return turn % 2 === 0;  // even turns
        case 'warm_greeting':
            return true;            // always end greeting with an invitation
        default:
            return false;
    }
}

// ── ResponsePlanner ────────────────────────────────────────────────────────────

export class ResponsePlanner {
    /**
     * Produces a `ResponsePlan` for the current turn.
     *
     * @param intent    Classified intent for the latest user message
     * @param intensity Emotional intensity detected in the message
     * @param memory    Current conversation memory (pre-turn state)
     * @returns         A plan that ResponseGenerator will execute
     */
    static plan(
        intent: IntentMatch,
        intensity: EmotionalIntensity,
        memory: ConversationMemory
    ): ResponsePlan {
        const stage = detectStage(memory.turnCount);
        const emotionalContext = detectEmotionalContext(memory);
        const forceGrounding = shouldForceGrounding(memory);

        // Resolve plan type (with advice regulation applied)
        const basePlanType = PLAN_MAP[intent.type] ?? 'anchor_reflection_curiosity';
        const planType = effectivePlanType(intent, memory, basePlanType);

        // Resolve question inclusion
        const useQuestion = resolveUseQuestion(planType, intensity, memory, stage);

        // Topic bridge: only on eligible plans, with a recurring topic, past turn 1
        const topicBridge =
            TOPIC_BRIDGE_ELIGIBLE.has(planType) &&
            hasActiveTopic(memory) &&
            memory.turnCount > 1;

        return {
            planType,
            useQuestion,
            topicBridge,
            toneHint: memory.toneTrend,
            stage,
            emotionalContext,
            forceGrounding,
            topicPhraseIndex: memory.topicPhraseIndex ?? 0,
        };
    }
}
