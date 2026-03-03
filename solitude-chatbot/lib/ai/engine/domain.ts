import { IntentMatch } from './types';

// ─── DomainGuard ──────────────────────────────────────────────────────────────
//
// Flags out_of_scope intents so the engine can condition the prompt accordingly.
// Crisis signals are never blocked.
//

export class DomainGuard {
    /** Returns true when the intent is out of mental-health scope. */
    static shouldRedirect(intent: IntentMatch): boolean {
        return intent.type === 'out_of_scope';
    }
}
