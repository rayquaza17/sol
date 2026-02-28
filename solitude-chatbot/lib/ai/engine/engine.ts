import { ConversationState, EngineResponse, ResponseContext, IntentMatch } from './types';
import { MemoryManager } from './memory';
import { IntentClassifier } from './intent';
import { DomainGuard } from './domain';
import { SafetyMonitor } from './safety-monitor';
import { ResponsePlanner } from './response-planner';
import { ResponseGenerator } from './responses';
import { RepetitionGuard } from './repetition-guard';
import { detectIntensity } from './state';

// ─── ConversationEngine ───────────────────────────────────────────────────────
//
// Orchestrates the 7-step pipeline per request.
//
// Pipeline:
//
//   1. IntentClassifier  — classify mental-health intent
//   2. DomainGuard       — redirect if out_of_scope
//   3. SafetyMonitor     — crisis override on high-confidence detection
//   4. ResponsePlanner   — derive plan from intent + intensity + state.memory
//   5. ResponseGenerator — convert plan → draft response
//   6. RepetitionGuard   — semantic + structural anti-repetition pass
//   7. MemoryManager     — single update with real output, repetition state,
//                          and topicBridgeUsed flag for topic phrase rotation
//
// IMPORTANT: state.memory is used directly for planning AND generation.
// There is only ONE call to MemoryManager.update() per turn (at the end).
// This prevents double-counting of consecutiveAdviceCount and topicPhraseIndex.
//

export class ConversationEngine {
    static createInitialState(): ConversationState {
        return {
            memory: MemoryManager.createInitial(),
            intensity: 'LOW',
            lastIntent: null
        };
    }

    static process(context: ResponseContext): EngineResponse {
        const { message, state } = context;

        // ── 1. IntentClassifier ───────────────────────────────────────────────
        const intent = IntentClassifier.classify(message, state.memory);

        // ── 2. DomainGuard ────────────────────────────────────────────────────
        if (DomainGuard.shouldRedirect(intent)) {
            const intensity = detectIntensity(message);
            const plan = ResponsePlanner.plan(intent, intensity, state.memory);
            const rawContent = ResponseGenerator.generate(intent, state.memory, message, plan);
            const { output, state: newRepetition } = RepetitionGuard.apply(
                rawContent,
                state.memory.repetition,
                state.memory.recentResponses
            );
            const newMemory = MemoryManager.update(
                state.memory, message, output, intent, intensity,
                undefined, newRepetition, false
            );
            return {
                content: output,
                intent,
                isCrisis: false,
                safetyLevel: 'SAFE',
                state: { memory: newMemory, intensity, lastIntent: intent.type }
            };
        }

        // ── 3. SafetyMonitor ──────────────────────────────────────────────────
        const safety = SafetyMonitor.assess(message);
        const intensity = detectIntensity(message);

        if (safety.triggered) {
            const crisisIntent: IntentMatch = { ...intent, type: 'crisis_signal', actionType: 'CRISIS' };
            const crisisPlan = ResponsePlanner.plan(crisisIntent, intensity, state.memory);
            const crisisDraft = ResponseGenerator.generate(crisisIntent, state.memory, message, crisisPlan);
            const { output, state: newRepetition } = RepetitionGuard.apply(
                crisisDraft,
                state.memory.repetition,
                state.memory.recentResponses
            );
            const newMemory = MemoryManager.update(
                state.memory, message, output, crisisIntent, intensity,
                undefined, newRepetition, false
            );
            return {
                content: output,
                intent: crisisIntent,
                isCrisis: true,
                safetyLevel: safety.level,
                state: { memory: newMemory, intensity, lastIntent: 'crisis_signal' }
            };
        }

        // ── 4. ResponsePlanner ────────────────────────────────────────────────
        // Reads state.memory directly — no intermediate memory update needed.
        const plan = ResponsePlanner.plan(intent, intensity, state.memory);

        // ── 5. ResponseGenerator ──────────────────────────────────────────────
        const draft = ResponseGenerator.generate(intent, state.memory, message, plan);

        // ── 6. RepetitionGuard ────────────────────────────────────────────────
        // Pass full recentResponses for semantic body-level similarity checks.
        const { output, state: newRepetition } = RepetitionGuard.apply(
            draft,
            state.memory.repetition,
            state.memory.recentResponses
        );

        // ── 7. MemoryManager: single update with real output ──────────────────
        // topicBridgeUsed tells MemoryManager to increment topicPhraseIndex,
        // rotating which bridge phrasing is used on the next topic reference.
        const finalMemory = MemoryManager.update(
            state.memory,
            message,
            output,
            intent,
            intensity,
            undefined,
            newRepetition,
            plan.topicBridge   // ← topicBridgeUsed
        );

        return {
            content: output,
            intent,
            isCrisis: false,
            safetyLevel: safety.level,
            state: { memory: finalMemory, intensity, lastIntent: intent.type }
        };
    }
}

// ── Convenience re-exports ────────────────────────────────────────────────────
export const createInitialState = ConversationEngine.createInitialState.bind(ConversationEngine);
export const processMessage = (ctx: ResponseContext): EngineResponse => ConversationEngine.process(ctx);
