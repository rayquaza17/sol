// ─── DomainGuard ──────────────────────────────────────────────────────────────
//
// Two-layer out-of-scope detection:
//   Layer 1 (primary): Independent keyword/phrase matching on raw message text.
//                      Fires regardless of IntentClassifier output.
//   Layer 2 (fallback): Intent-type check — catches anything the classifier
//                       correctly labels out_of_scope but Layer 1 missed.
//
// Crisis signals bypass DomainGuard entirely (handled upstream).
//
// ─────────────────────────────────────────────────────────────────────────────

import { IntentMatch } from './types';

// ── Blocklist: non-mental-health topic signals ────────────────────────────────
//
// Covers the most common categories of off-topic requests:
// cooking, tech, maths, sports, geography, entertainment, etc.
// Phrased as regex patterns for flexible matching.
//
const OUT_OF_SCOPE_PATTERNS: RegExp[] = [
    // Cooking / food / recipes
    /\b(recipe|cook|bake|boil|fry|grill|roast|steam|simmer|ingredient|dish|cuisine|meal prep|how to make|how do (i|you) make)\b/i,
    /\b(tea|coffee|pasta|rice|soup|bread|cake|cookie|pizza|burger|salad|sauce|spice|seasoning)\b.*\b(make|cook|prepare|recipe)\b/i,

    // Programming / tech
    /\b(code|coding|program|programming|algorithm|function|variable|loop|syntax|debug|compile|deploy|api|database|sql|html|css|javascript|python|java|typescript|react|node|linux|terminal|command line|git|github)\b/i,
    /\b(sort(ing)? algorithm|binary search|data structure|machine learning|neural network|model training)\b/i,

    // Maths / science
    /\b(calculate|equation|formula|integral|derivative|matrix|vector|theorem|proof|physics|chemistry|biology|periodic table|element|molecule)\b/i,

    // Sports / games
    /\b(football|cricket|basketball|tennis|golf|rugby|baseball|hockey|soccer|match|score|player|team|league|tournament|chess|poker|gaming|video game)\b/i,

    // Geography / travel
    /\b(capital city|country|continent|ocean|river|mountain|landmark|tourist|travel|visa|passport|flight|hotel|resort)\b/i,

    // Entertainment / pop culture
    /\b(movie|film|series|episode|actor|actress|director|song|album|artist|band|concert|lyrics|recommend (a|me) (movie|show|song|book))\b/i,

    // Finance / legal
    /\b(stock|invest|crypto|bitcoin|loan|mortgage|tax|insurance|legal advice|law|contract|lawsuit)\b/i,

    // Health / medical (non-mental-health)
    /\b(doctor|physician|prescription|drug dosage|medication dose|symptom|diagnosis|surgery|vaccine|blood pressure|diabetes|cancer)\b/i,

    // Explicit "how to" queries on concrete tasks (not emotional)
    /^how (do (i|you)|to|can (i|you))\s+(make|build|fix|repair|install|setup|configure|write|draw|design|create)\b/i,
];

// Safety words — if the message contains these, don't flag as out-of-scope
// even if a pattern matched (prevents false positives on e.g. "I feel anxious about my presentation")
const SAFETY_OVERRIDE_TERMS: RegExp[] = [
    /\b(feel|feeling|felt|emotion|stress|anxious|anxiety|worry|worried|overwhelm|struggling|mental|wellbeing|mind|cope|help me|support)\b/i,
];

export class DomainGuard {

    /**
     * Primary check — runs directly on raw message text, independent of intent classifier.
     * Returns true if the message is clearly off-topic and should be blocked.
     */
    static isOutOfScope(message: string): boolean {
        const text = message.trim();

        // If any safety override term is present, don't block (emotional framing takes priority)
        const hasSafetyTerm = SAFETY_OVERRIDE_TERMS.some(re => re.test(text));
        if (hasSafetyTerm) return false;

        // Check blocklist patterns
        return OUT_OF_SCOPE_PATTERNS.some(re => re.test(text));
    }

    /**
     * Fallback check — uses intent type from the classifier as a secondary signal.
     * Returns true only when the classifier explicitly labels the intent out_of_scope.
     */
    static shouldRedirect(intent: IntentMatch): boolean {
        return intent.type === 'out_of_scope';
    }

    /**
     * Combined check: Layer 1 (pattern match) OR Layer 2 (intent label).
     */
    static blocked(message: string, intent: IntentMatch): boolean {
        return DomainGuard.isOutOfScope(message) || DomainGuard.shouldRedirect(intent);
    }
}
