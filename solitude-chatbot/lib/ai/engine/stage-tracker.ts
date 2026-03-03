import { ConversationMemory, ConversationStage, EmotionalIntensity } from './types';

// ─── StageTracker ─────────────────────────────────────────────────────────────
//
// Derives conversation stage from memory state.
// Stages progress monotonically forward — never reset mid-conversation.
//
// Transitions consider:
//   - Turn count (primary driver)
//   - Emotional intensity trend
//
// Stage → Response adaptation (injected into prompt context):
//   initial     → open-ended reflection
//   exploring   → clarifying questions
//   deepening   → synthesis + fewer questions
//   stabilizing → grounding + containment
//   closing     → encouragement + summarizing
//
// ─────────────────────────────────────────────────────────────────────────────

/** Ordered stage progression — stages only move forward. */
const STAGE_ORDER: ConversationStage[] = [
    'initial', 'exploring', 'deepening', 'stabilizing', 'closing'
];

function stageIndex(stage: ConversationStage): number {
    return STAGE_ORDER.indexOf(stage);
}

/**
 * Maps coarse intensity to a 0–10 numeric score for averaging.
 */
function intensityToScore(i: EmotionalIntensity): number {
    return { LOW: 2, MEDIUM: 5, HIGH: 9 }[i];
}

/**
 * Average of the last N intensity readings (coarse → numeric).
 */
function averageIntensity(history: EmotionalIntensity[]): number {
    if (history.length === 0) return 1;
    const recent = history.slice(-5);
    return recent.reduce((a, i) => a + intensityToScore(i), 0) / recent.length;
}

/**
 * Checks whether the intensity trend over the last 3 readings is declining.
 */
function isIntensityDeclining(history: EmotionalIntensity[]): boolean {
    if (history.length < 3) return false;
    const recent = history.slice(-3).map(intensityToScore);
    return recent[0] > recent[1] && recent[1] >= recent[2];
}

export class StageTracker {
    /**
     * Determines the current conversation stage from memory.
     * Always returns a stage ≥ the previous stage (monotonic forward).
     */
    static determineStage(memory: ConversationMemory): ConversationStage {
        const currentStageIdx = stageIndex(memory.conversationStage);
        const candidateStage = StageTracker._computeCandidate(memory);
        const candidateIdx = stageIndex(candidateStage);

        // Monotonic: never go backward
        return candidateIdx >= currentStageIdx ? candidateStage : memory.conversationStage;
    }

    private static _computeCandidate(memory: ConversationMemory): ConversationStage {
        const turn = memory.turnCount;
        const avgInt = averageIntensity(memory.intensityHistory);
        const declining = isIntensityDeclining(memory.intensityHistory);

        // ── Closing: turns 19+ ────────────────────────────────────────────────
        if (turn >= 19) return 'closing';

        // ── Stabilizing: turns 13–18, or intensity declining for 3+ turns ────
        if (turn >= 13) return 'stabilizing';
        if (turn >= 8 && declining && avgInt <= 2.5) return 'stabilizing';

        // ── Deepening: turns 7–12, or high engagement signals ────────────────
        if (turn >= 7) return 'deepening';
        if (turn >= 4 && avgInt >= 3.5) return 'deepening';

        // ── Exploring: turns 3–6, or early intensity spike ───────────────────
        if (turn >= 3) return 'exploring';
        if (turn >= 1 && avgInt >= 3) return 'exploring';

        // ── Initial: turns 0–2 ───────────────────────────────────────────────
        return 'initial';
    }
}
