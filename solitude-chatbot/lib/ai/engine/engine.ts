import { ConversationState, ConversationMode, EngineResponse, ResponseContext } from './types';
import { MemoryManager } from './memory';
import { IntentClassifier } from './intent';
import { DomainGuard } from './domain';
import { ResponseGenerator } from './responses';
import { SafetyMonitor } from './safety-monitor';
import { detectIntensity } from './state';

// ─── ConversationEngine ───────────────────────────────────────────────────────
//
// Orchestrates the full pipeline per request:
//
//   1. SafetyMonitor      — crisis phrase detection (always first)
//   2. IntentClassifier   — mental-health intent + out_of_scope detection
//   3. DomainGuard        — confirms scope (redundant check, safety net)
//   4. ResponseGenerator  — adaptive response from intent + memory + tone
//   5. MemoryManager      — update short-term + topic + tone + anti-rep
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

        // ── 1. SafetyMonitor ─────────────────────────────────────────────────
        const safety = SafetyMonitor.assess(message);
        if (safety.triggered) {
            const content = SafetyMonitor.buildResponse();
            const intent = IntentClassifier.classify(message, state.memory);
            const intensity = detectIntensity(message);
            const newMemory = MemoryManager.update(state.memory, message, content, intent, intensity);
            return {
                content,
                intent: { ...intent, type: 'crisis_signal', actionType: 'CRISIS' },
                isCrisis: true,
                safetyLevel: 'CRISIS',
                state: { memory: newMemory, intensity, lastIntent: 'crisis_signal' }
            };
        }

        // ── 2. IntentClassifier (context-aware) ──────────────────────────────
        // Pass memory so the classifier can boost likely follow-up intents
        const intent = IntentClassifier.classify(message, state.memory);

        // ── 3. DomainGuard ───────────────────────────────────────────────────
        // Must run BEFORE ResponseGenerator.
        if (DomainGuard.shouldRedirect(intent)) {
            const content = DomainGuard.buildRedirectResponse();
            const intensity = detectIntensity(message);
            const newMemory = MemoryManager.update(state.memory, message, content, intent, intensity);
            return {
                content,
                intent,
                isCrisis: false,
                safetyLevel: safety.level,
                state: { memory: newMemory, intensity, lastIntent: intent.type }
            };
        }

        // ── 4. ResponseGenerator ─────────────────────────────────────────────
        const intensity = detectIntensity(message);
        const { content, repetition } = ResponseGenerator.generate(intent, state.memory, message);

        // ── 5. MemoryManager: update ─────────────────────────────────────────
        const newMemory = MemoryManager.update(
            state.memory, message, content, intent, intensity,
            undefined, repetition
        );

        return {
            content,
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
