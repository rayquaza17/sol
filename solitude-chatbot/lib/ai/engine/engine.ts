import { ConversationState, EngineResult, IntentMatch } from './types';
import { MemoryManager } from './memory';
import { IntentClassifier } from './intent';
import { SafetyMonitor } from './safety-monitor';
import { CrisisMonitor } from './crisisMonitor';
import { DomainGuard } from './domain';
import { StageTracker } from './stage-tracker';
import { detectIntensity } from './state';
import { constructPrompt, PromptInput } from '../../promptConstructor';

// ─── ConversationEngine ───────────────────────────────────────────────────────
//
// Hybrid LLM pipeline. The engine classifies, detects crisis, builds context.
// Response generation is handled by Ollama via the API route.
//
// Pipeline:
//   1. IntentClassifier   — classify mental-health intent
//   2. CrisisMonitor      — 3-level crisis assessment
//      Level 3 → return structured crisis response, bypass Ollama
//      Level 2 → inject heightened-empathy instruction into prompt
//      Level 1 → normal flow
//   3. SafetyMonitor      — additional safety check (SAFE/MONITOR/CRISIS)
//   4. Intensity          — detect emotional intensity
//   5. StageTracker       — determine conversation stage
//   6. PromptConstructor  — build structured prompt for LLM
//
// ─────────────────────────────────────────────────────────────────────────────

export class ConversationEngine {
    static createInitialState(): ConversationState {
        return {
            memory: MemoryManager.createInitial(),
            intensity: 'LOW',
            lastIntent: null,
            outOfScopeCount: 0,
        };
    }

    static process(message: string, state: ConversationState): EngineResult {
        // ── 1. IntentClassifier ───────────────────────────────────────────────
        const intent = IntentClassifier.classify(message, state.memory);

        // ── 1b. Out-of-scope: deterministic bypass ────────────────────────────
        // Do NOT send off-topic queries to LLaMA. Respond with a calm boundary.
        if (DomainGuard.blocked(message, intent)) {
            // Detect repeat offense — user already got a boundary response last turn
            const isRepeat = state.lastIntent === 'out_of_scope';

            const outOfScopeResponse = isRepeat
                ? "That's still a bit outside my focus — I'm here for emotional wellbeing and support. If something's been on your mind, I'm happy to talk."
                : "That's outside what I'm built for. I focus on emotional wellbeing and support — but if something's been weighing on you lately, I'm here to listen.";

            return {
                prompt: '',
                intent: { ...intent, type: 'out_of_scope' },
                isCrisis: false,
                crisisLevel: 1,
                safetyLevel: 'SAFE',
                isOutOfScope: true,
                outOfScopeResponse,
                state: {
                    memory: state.memory,
                    intensity: 'LOW',
                    lastIntent: 'out_of_scope',
                    outOfScopeCount: (state.outOfScopeCount ?? 0) + 1,
                },
            };
        }

        // ── 2. CrisisMonitor ──────────────────────────────────────────────────
        const crisis = CrisisMonitor.assess(message);

        // Level 3 — bypass Ollama entirely
        if (crisis.level === 3) {
            const crisisIntent: IntentMatch = { ...intent, type: 'crisis_signal', actionType: 'CRISIS' };
            return {
                prompt: '',
                intent: crisisIntent,
                isCrisis: true,
                crisisLevel: 3,
                crisisResponse: crisis.structuredResponse,
                safetyLevel: 'CRISIS',
                state: {
                    memory: state.memory,
                    intensity: 'HIGH',
                    lastIntent: 'crisis_signal',
                    outOfScopeCount: 0,
                },
            };
        }

        // ── 3. SafetyMonitor (additional safety pass) ─────────────────────────
        const safety = SafetyMonitor.assess(message);

        // Override to crisis_signal intent if either monitor triggered
        const isCrisis = crisis.level === 2 || safety.triggered;
        const effectiveIntent: IntentMatch = isCrisis
            ? { ...intent, type: 'crisis_signal', actionType: 'CRISIS' }
            : intent;

        // ── 4. Intensity Detection ────────────────────────────────────────────
        const intensity = detectIntensity(message);

        // ── 5. StageTracker ───────────────────────────────────────────────────
        const stage = StageTracker.determineStage(state.memory);

        // ── 6. PromptConstructor ──────────────────────────────────────────────
        const promptCtx: PromptInput = {
            userMessage: message,
            intent: effectiveIntent,
            memoryState: state.memory,
            stage,
            intensity,
            isCrisis,
            // Level 2 soft injection — heightened empathy instruction
            level2Injection: crisis.level === 2 ? crisis.promptInjection : undefined,
        };

        const prompt = constructPrompt(promptCtx);

        return {
            prompt,
            intent: effectiveIntent,
            isCrisis,
            crisisLevel: crisis.level,
            safetyLevel: safety.level,
            state: {
                memory: state.memory,
                intensity,
                lastIntent: effectiveIntent.type,
                outOfScopeCount: 0,
            },
        };
    }

    /**
     * Updates memory after getting the LLM response.
     * Called by the API route after Ollama returns (or after crisis bypass).
     */
    static updateMemory(
        state: ConversationState,
        userMessage: string,
        assistantMessage: string,
        intent: IntentMatch,
        intensity: import('./types').EmotionalIntensity,
        stage: import('./types').ConversationStage,
    ): ConversationState {
        const newMemory = MemoryManager.update(
            state.memory,
            userMessage,
            assistantMessage,
            intent,
            intensity,
            stage,
        );
        return {
            memory: newMemory,
            intensity,
            lastIntent: intent.type,
            outOfScopeCount: 0,
        };
    }
}

// ── Convenience re-exports ────────────────────────────────────────────────────
export const createInitialState = ConversationEngine.createInitialState.bind(ConversationEngine);
