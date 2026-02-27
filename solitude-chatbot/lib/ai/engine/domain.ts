import { IntentMatch } from './types';

// ─── DomainGuard ──────────────────────────────────────────────────────────────
//
// Simplified: out_of_scope detection is now handled by IntentClassifier.
// DomainGuard's only remaining job is to provide the redirect response
// when the engine sees an out_of_scope intent — and to ensure CRISIS
// is never blocked at any layer.
//

export class DomainGuard {
    /**
     * Returns true if the intent is within mental-health scope.
     * crisis_signal can NEVER be out of scope.
     */
    static isInScope(intent: IntentMatch): boolean {
        if (intent.type === 'crisis_signal') return true;
        return intent.type !== 'out_of_scope';
    }

    /** True when we should short-circuit with a redirect response. */
    static shouldRedirect(intent: IntentMatch): boolean {
        return intent.type === 'out_of_scope';
    }

    /**
     * Returns a warm, non-dismissive redirect for out_of_scope intents.
     */
    static buildRedirectResponse(): string {
        // Keep it simple: a soft boundary + a gentle pivot to emotional context.
        const responses = [
            "I’m not built for general questions, but I’m here if something’s been weighing on you.",
            "I’m not built for general questions, but I’m here with you—what’s been weighing on you lately?",
            "I’m not built for general questions, but if there’s something on your mind emotionally, I’m here."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
