import { ConversationState, ConversationMode, EngineResponse, ResponseContext, IntentMatch } from './types';
import { MemoryManager } from './memory';
import { IntentClassifier } from './intent';
import { DomainGuard } from './domain';
import { ResponseGenerator } from './responses';
import { SafetyMonitor } from './safety-monitor';
import { RepetitionGuard } from './repetition-guard';
import { detectIntensity } from './state';

// ─── ConversationEngine ───────────────────────────────────────────────────────
//
// Orchestrates the full pipeline per request:
//
//   1. IntentClassifier   — mental-health intent + out_of_scope detection
//   2. DomainGuard        — out_of_scope redirect (soft boundary)
//   3. SafetyMonitor      — crisis phrase detection (override on high confidence)
//   4. ResponseGenerator  — adaptive response from intent + memory + tone
//   5. RepetitionGuard    — structural anti-repetition on final text
//   6. MemoryManager      — update short-term + topic + tone + anti-rep
//

export class ConversationEngine {
    static createInitialState(mode: ConversationMode = 'vent'): ConversationState {
        return {
            memory: MemoryManager.createInitial(),
            intensity: 'LOW',
            lastIntent: null
        };
    }

    static process(context: ResponseContext): EngineResponse {
        const { message, state } = context;

        // ── 1. IntentClassifier (context-aware) ──────────────────────────────
        // Pass memory so the classifier can boost likely follow-up intents
        const intent = IntentClassifier.classify(message, state.memory);

        // ── 2. DomainGuard ───────────────────────────────────────────────────
        // Must run BEFORE SafetyMonitor / ResponseGenerator.
        if (DomainGuard.shouldRedirect(intent)) {
            const intensity = detectIntensity(message);
            const rawContent = DomainGuard.buildRedirectResponse();
            const { output, state: newRepetition } = RepetitionGuard.apply(
                rawContent,
                state.memory.repetition
            );
            const newMemory = MemoryManager.update(
                state.memory,
                message,
                output,
                intent,
                intensity,
                undefined,
                newRepetition
            );
            return {
                content: output,
                intent,
                isCrisis: false,
                safetyLevel: 'SAFE',
                state: { memory: newMemory, intensity, lastIntent: intent.type }
            };
        }

        // ── 3. SafetyMonitor ─────────────────────────────────────────────────
        const safety = SafetyMonitor.assess(message);
        const intensity = detectIntensity(message);
        if (safety.triggered) {
            const crisisDraft = SafetyMonitor.buildResponse();
            const { output, state: newRepetition } = RepetitionGuard.apply(
                crisisDraft,
                state.memory.repetition
            );
            const crisisIntent: IntentMatch = { ...intent, type: 'crisis_signal', actionType: 'CRISIS' };
            const newMemory = MemoryManager.update(
                state.memory,
                message,
                output,
                crisisIntent,
                intensity,
                undefined,
                newRepetition
            );
            return {
                content: output,
                intent: crisisIntent,
                isCrisis: true,
                safetyLevel: safety.level,
                state: { memory: newMemory, intensity, lastIntent: 'crisis_signal' }
            };
        }

        // ── 4. ResponseGenerator ─────────────────────────────────────────────
        const draft = ResponseGenerator.generate(intent, state.memory, message);

        // ── 5. RepetitionGuard ───────────────────────────────────────────────
        const { output, state: newRepetition } = RepetitionGuard.apply(
            draft,
            state.memory.repetition
        );

        // ── 6. MemoryManager: update ─────────────────────────────────────────
        const newMemory = MemoryManager.update(
            state.memory,
            message,
            output,
            intent,
            intensity,
            undefined,
            newRepetition
        );

        return {
            content: output,
            intent,
            isCrisis: false,
            safetyLevel: safety.level,
            state: { memory: newMemory, intensity, lastIntent: intent.type }
        };
    }
}

// ── Convenience re-exports for the API route ──────────────────────────────────
export const createInitialState = ConversationEngine.createInitialState.bind(ConversationEngine);
export const processMessage = (ctx: ResponseContext): EngineResponse => ConversationEngine.process(ctx);
