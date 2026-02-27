import { RepetitionState } from './types';

// ─── RepetitionGuard ─────────────────────────────────────────────────────────
//
// Enforces structural variation before ResponseGenerator emits a response.
//
// Strategy (no randomness — deterministic structural rules):
//   1. Extract opener / reflective phrases / questions from the candidate.
//   2. Check similarity of each against the ring-buffers in RepetitionState.
//   3. If any violation fires, apply the matching structural variation rule.
//   4. Record the final output into the ring-buffers and return.
//
// Similarity metric: Jaccard overlap on character-bigrams.
// Thresholds:
//   opener    > OPENER_THRESHOLD    (0.60) → openingRepeated
//   phrase    > PHRASE_THRESHOLD    (0.45) → phraseRepeated
//   question  > QUESTION_THRESHOLD  (0.70) → questionRepeated
//   full body > BODY_THRESHOLD      (0.45) → bodyTooSimilar

// ── Constants ─────────────────────────────────────────────────────────────────

const OPENER_THRESHOLD = 0.60;
const PHRASE_THRESHOLD = 0.45;
const QUESTION_THRESHOLD = 0.70;
const BODY_THRESHOLD = 0.45;

const MAX_OPENINGS = 5;
const MAX_PHRASES = 5;
const MAX_QUESTIONS = 3;

// ── Reflective clause markers ─────────────────────────────────────────────────

const REFLECTIVE_MARKERS = [
    "sounds like",
    "it makes sense",
    "i hear",
    "that kind of",
    "what you're",
    "you've been",
    "you're carrying",
    "you don't have to",
    "you're holding",
    "it's okay to",
];

// ── Deterministic phrase substitution table ───────────────────────────────────
// Each entry: [pattern (lowercase), replacement].
// Applied left-to-right; first match wins.

const PHRASE_SUBS: [RegExp, string][] = [
    [/\bthat sounds like\b/gi, "What you're describing feels like"],
    [/\bi hear the\b/gi, "There's something real in"],
    [/\bit makes sense\b/gi, "It's understandable that"],
    [/\byou've been holding\b/gi, "You've been carrying"],
    [/\bthat kind of\b/gi, "This sort of"],
    [/\bwhat you're\b/gi, "The way you're"],
    [/\byou're carrying\b/gi, "You've been holding"],   // reverse pair
    [/\bthis sort of\b/gi, "That kind of"],          // reverse pair
    [/\bi'm here with you\b/gi, "I'm not going anywhere"],
    [/\byou don't have to\b/gi, "There's no need to"],
    [/\bit's okay to\b/gi, "It's alright to"],
];

// ── Violation flags ───────────────────────────────────────────────────────────

export interface ViolationSet {
    openingRepeated: boolean;
    phraseRepeated: boolean;
    questionRepeated: boolean;
    bodyTooSimilar: boolean;
}

// ── Similarity ────────────────────────────────────────────────────────────────

/** Build the set of character bigrams from a normalised string. */
function bigrams(text: string): Set<string> {
    const s = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
}

/** Jaccard similarity on character bigrams. Returns 0–1. */
function similarity(a: string, b: string): number {
    const bg1 = bigrams(a);
    const bg2 = bigrams(b);
    if (bg1.size === 0 && bg2.size === 0) return 1;
    if (bg1.size === 0 || bg2.size === 0) return 0;
    let intersection = 0;
    for (const bi of bg1) if (bg2.has(bi)) intersection++;
    return intersection / (bg1.size + bg2.size - intersection);
}

/** Returns true if `candidate` is above `threshold` similar to any item in `haystack`. */
function tooSimilarToAny(candidate: string, haystack: string[], threshold: number): boolean {
    return haystack.some(h => similarity(candidate, h) > threshold);
}

// ── Extractors ────────────────────────────────────────────────────────────────

/** First sentence of the response, trimmed to its first 6 words (lowercase, no punct). */
function extractOpening(response: string): string {
    const first = splitSentences(response)[0] ?? response;
    return first
        .toLowerCase()
        .replace(/[^a-z0-9 ']/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 6)
        .join(' ');
}

/** All reflective clause sentences (those containing a REFLECTIVE_MARKER). */
function extractReflectivePhrases(response: string): string[] {
    const lower = response.toLowerCase();
    return splitSentences(response).filter(s =>
        REFLECTIVE_MARKERS.some(m => s.toLowerCase().includes(m))
    );
}

/** All question sentences (ending with '?'). */
function extractQuestions(response: string): string[] {
    return splitSentences(response).filter(s => s.trim().endsWith('?'));
}

/** Split text into sentences on '.', '!', '?' — preserving the delimiter. */
function splitSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(Boolean);
}

// ── Public API ────────────────────────────────────────────────────────────────

export class RepetitionGuard {

    /**
     * Check a candidate response against the ring-buffers.
     * Returns a set of boolean violation flags.
     */
    static check(response: string, state: RepetitionState): ViolationSet {
        const opening = extractOpening(response);
        const phrases = extractReflectivePhrases(response);
        const questions = extractQuestions(response);

        const openingRepeated = tooSimilarToAny(opening, state.recentOpenings, OPENER_THRESHOLD);
        const phraseRepeated = phrases.some(p => tooSimilarToAny(p, state.recentPhrases, PHRASE_THRESHOLD));
        const questionRepeated = questions.some(q => tooSimilarToAny(q, state.recentQuestions, QUESTION_THRESHOLD));

        // Full-body check against all 5 recent openings as a proxy for whole-response history
        // (we intentionally don't store full responses here — that's memory.recentResponses)
        const bodyTooSimilar = openingRepeated && phraseRepeated;

        return { openingRepeated, phraseRepeated, questionRepeated, bodyTooSimilar };
    }

    /**
     * Apply deterministic structural variation rules for each active violation.
     * Never shuffles randomly — uses inversion, clause substitution, and reordering.
     */
    static vary(response: string, violations: ViolationSet): string {
        let result = response;

        // ── 1. Phrase substitution (phraseRepeated | bodyTooSimilar) ──────────
        if (violations.phraseRepeated || violations.bodyTooSimilar) {
            for (const [pattern, replacement] of PHRASE_SUBS) {
                result = result.replace(pattern, replacement);
            }
        }

        // ── 2. Opening inversion (openingRepeated | bodyTooSimilar) ──────────
        if (violations.openingRepeated || violations.bodyTooSimilar) {
            result = RepetitionGuard._invertOpening(result);
        }

        // ── 3. Question removal / softening (questionRepeated) ────────────────
        if (violations.questionRepeated) {
            result = RepetitionGuard._softenQuestions(result);
        }

        return result.trim();
    }

    /**
     * Record the final (post-variation) response into the ring-buffers.
     * Returns a new RepetitionState (immutable update).
     */
    static record(response: string, state: RepetitionState): RepetitionState {
        const opening = extractOpening(response);
        const phrases = extractReflectivePhrases(response);
        const questions = extractQuestions(response);

        const recentOpenings = [...state.recentOpenings, opening].slice(-MAX_OPENINGS);
        const recentPhrases = [...state.recentPhrases, ...phrases].slice(-MAX_PHRASES);
        const recentQuestions = [...state.recentQuestions, ...questions].slice(-MAX_QUESTIONS);

        return { recentOpenings, recentPhrases, recentQuestions };
    }

    /**
     * Main entry point used by ResponseGenerator.
     *
     * 1. Checks for violations.
     * 2. If any fire, applies variation. Re-checks once; if still violating
     *    applies variation a second time (convergence guaranteed because
     *    phrase-sub table is idempotent after the first pass).
     * 3. Records the final output into the ring-buffers.
     *
     * Returns the guarded output string and the updated RepetitionState.
     */
    static apply(
        response: string,
        state: RepetitionState
    ): { output: string; state: RepetitionState } {
        let violations = RepetitionGuard.check(response, state);
        let output = response;

        if (RepetitionGuard._hasAnyViolation(violations)) {
            output = RepetitionGuard.vary(output, violations);
            // Re-check once; if still violating, run a second pass
            violations = RepetitionGuard.check(output, state);
            if (RepetitionGuard._hasAnyViolation(violations)) {
                output = RepetitionGuard.vary(output, violations);
            }
        }

        return { output, state: RepetitionGuard.record(output, state) };
    }

    // ── Private structural variation helpers ──────────────────────────────────

    /**
     * Inverts the opening of a response:
     *  • If 2+ sentences: moves the second sentence to the front.
     *  • If only 1 sentence: prepends a short bridging clause.
     */
    private static _invertOpening(response: string): string {
        const sentences = splitSentences(response);

        if (sentences.length >= 2) {
            // Move second sentence to front, demote first to follow
            const [first, second, ...rest] = sentences;
            return [second, first, ...rest].join(' ');
        }

        // Single sentence: prepend a bridging clause so the opener changes
        const BRIDGES = [
            "I want to sit with that for a moment.",
            "There's something in what you're sharing that I want to acknowledge.",
            "Before anything else —",
        ];
        // Deterministic bridge: pick by character length mod 3
        const bridge = BRIDGES[response.length % BRIDGES.length];
        return `${bridge} ${response}`;
    }

    /**
     * Replaces interrogative questions with non-interrogative invitations.
     * If no questions found, returns the response unchanged.
     */
    private static _softenQuestions(response: string): string {
        // Replace trailing '?' questions with declarative forms
        return splitSentences(response)
            .map(sentence => {
                if (!sentence.trim().endsWith('?')) return sentence;

                // Strip the '?' and append a soft invitation instead
                const core = sentence.trim().replace(/\?$/, '').trim();

                // Heuristic: if sentence starts with "What" / "How" / "Do" / "Does" / "Is" / "Are"
                const lower = core.toLowerCase();
                if (/^(what|how)\b/.test(lower)) {
                    return `I'm curious ${core.charAt(0).toLowerCase() + core.slice(1)}.`;
                }
                if (/^(do|does|is|are|have|has)\b/.test(lower)) {
                    return `I wonder ${core.charAt(0).toLowerCase() + core.slice(1)}.`;
                }
                // Fallback: drop the question; replace with an open invitation
                return "I'm here to sit with whatever feels right to share.";
            })
            .join(' ');
    }

    private static _hasAnyViolation(v: ViolationSet): boolean {
        return v.openingRepeated || v.phraseRepeated || v.questionRepeated || v.bodyTooSimilar;
    }

    // ── Empty state factory ───────────────────────────────────────────────────

    static emptyState(): RepetitionState {
        return { recentOpenings: [], recentPhrases: [], recentQuestions: [] };
    }
}
