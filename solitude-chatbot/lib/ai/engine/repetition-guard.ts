import { RepetitionState } from './types';

// ─── RepetitionGuard ─────────────────────────────────────────────────────────
//
// Enforces structural variation before ResponseGenerator emits a response.
//
// Strategy (deterministic — no randomness):
//   1. Extract opener / reflective phrases / questions from the candidate.
//   2. Check similarity of each against ring-buffers in RepetitionState.
//   3. Also run a full-body semantic check against the last 5 stored responses.
//   4. If any violation fires, apply the matching structural variation rule.
//   5. Re-check once; apply a second pass if still violating.
//   6. Record the final output into all ring-buffers and return.
//
// Similarity metric: Jaccard overlap on character-bigrams.
//
// Thresholds:
//   opener    > 0.60 → openingRepeated
//   phrase    > 0.45 → phraseRepeated
//   question  > 0.70 → questionRepeated
//   full body > 0.45 → bodyTooSimilar (against last 5 full responses)
//
// ─────────────────────────────────────────────────────────────────────────────

// ── Constants ─────────────────────────────────────────────────────────────────

const OPENER_THRESHOLD = 0.60;
const PHRASE_THRESHOLD = 0.45;
const QUESTION_THRESHOLD = 0.70;
const BODY_THRESHOLD = 0.45;

const MAX_OPENINGS = 5;
const MAX_PHRASES = 5;
const MAX_QUESTIONS = 3;
const MAX_QUESTION_TYPES = 3;

// ── Reflective clause markers ─────────────────────────────────────────────────

const REFLECTIVE_MARKERS = [
    "sounds like", "it makes sense", "i hear", "that kind of",
    "what you're", "you've been", "you're carrying", "you don't have to",
    "you're holding", "it's okay to", "something in", "the weight",
];

// ── Phrase substitution table (deterministic, left-to-right, first match wins) ─

const PHRASE_SUBS: [RegExp, string][] = [
    [/\bthat sounds like\b/gi, "What you're describing feels like"],
    [/\bi hear the\b/gi, "There's something real in"],
    [/\bit makes sense\b/gi, "It's understandable that"],
    [/\byou've been holding\b/gi, "You've been carrying"],
    [/\bthat kind of\b/gi, "This sort of"],
    [/\bwhat you're\b/gi, "The way you're"],
    [/\byou're carrying\b/gi, "You've been holding"],
    [/\bthis sort of\b/gi, "That kind of"],
    [/\bi'm here with you\b/gi, "I'm not going anywhere"],
    [/\byou don't have to\b/gi, "There's no need to"],
    [/\bit's okay to\b/gi, "It's alright to"],
    [/\bsomething in\b/gi, "There's something underneath"],
    [/\bthe weight\b/gi, "That heaviness"],
];

// ── Violation flags ───────────────────────────────────────────────────────────

export interface ViolationSet {
    openingRepeated: boolean;
    phraseRepeated: boolean;
    questionRepeated: boolean;
    bodyTooSimilar: boolean;
}

// ── Similarity helpers ────────────────────────────────────────────────────────

function bigrams(text: string): Set<string> {
    const s = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
    const out = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
    return out;
}

function similarity(a: string, b: string): number {
    const bg1 = bigrams(a);
    const bg2 = bigrams(b);
    if (bg1.size === 0 && bg2.size === 0) return 1;
    if (bg1.size === 0 || bg2.size === 0) return 0;
    let intersection = 0;
    for (const bi of bg1) if (bg2.has(bi)) intersection++;
    return intersection / (bg1.size + bg2.size - intersection);
}

function tooSimilarToAny(candidate: string, haystack: string[], threshold: number): boolean {
    return haystack.some(h => similarity(candidate, h) > threshold);
}

// ── Extractors ────────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
    return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
}

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

function extractReflectivePhrases(response: string): string[] {
    return splitSentences(response).filter(s =>
        REFLECTIVE_MARKERS.some(m => s.toLowerCase().includes(m))
    );
}

function extractQuestions(response: string): string[] {
    return splitSentences(response).filter(s => s.trim().endsWith('?'));
}

/**
 * Extracts the first word of each question sentence (normalised to title-case)
 * for question-type tracking. e.g. "What part..." → "What"
 */
function extractQuestionTypes(response: string): string[] {
    return extractQuestions(response)
        .map(q => {
            const first = q.trim().split(/\s+/)[0] ?? '';
            return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
        })
        .filter(Boolean);
}

// ── Public API ────────────────────────────────────────────────────────────────

export class RepetitionGuard {

    /**
     * Checks violations against ring-buffers.
     * Also checks full-body similarity against recent full responses.
     */
    static check(
        response: string,
        state: RepetitionState,
        recentResponses: string[] = []
    ): ViolationSet {
        const opening = extractOpening(response);
        const phrases = extractReflectivePhrases(response);
        const questions = extractQuestions(response);

        const openingRepeated = tooSimilarToAny(opening, state.recentOpenings, OPENER_THRESHOLD);
        const phraseRepeated = phrases.some(p => tooSimilarToAny(p, state.recentPhrases, PHRASE_THRESHOLD));
        const questionRepeated = questions.some(q => tooSimilarToAny(q, state.recentQuestions, QUESTION_THRESHOLD));

        // Full-body semantic similarity against the last 5 complete responses
        const bodyTooSimilar =
            (openingRepeated && phraseRepeated) ||
            recentResponses.some(r => similarity(response, r) > BODY_THRESHOLD);

        return { openingRepeated, phraseRepeated, questionRepeated, bodyTooSimilar };
    }

    /**
     * Apply structural variation rules — deterministic, no random choices.
     *
     * When violations fire, up to four strategies are applied in order:
     *   1. Phrase substitution (phraseRepeated | bodyTooSimilar)
     *   2. Opening inversion (openingRepeated | bodyTooSimilar)
     *   3. Question softening or removal (questionRepeated)
     *   4. Structural restructure (bodyTooSimilar: sentence order inversion + forward statement)
     */
    static vary(response: string, violations: ViolationSet): string {
        let result = response;

        // ── 1. Phrase substitution ─────────────────────────────────────────────
        if (violations.phraseRepeated || violations.bodyTooSimilar) {
            for (const [pattern, replacement] of PHRASE_SUBS) {
                result = result.replace(pattern, replacement);
            }
        }

        // ── 2. Opening inversion ──────────────────────────────────────────────
        if (violations.openingRepeated || violations.bodyTooSimilar) {
            result = RepetitionGuard._invertOpening(result);
        }

        // ── 3. Question softening ─────────────────────────────────────────────
        if (violations.questionRepeated) {
            result = RepetitionGuard._softenQuestions(result);
        }

        // ── 4. Structural restructure (aggressive body similarity) ─────────────
        if (violations.bodyTooSimilar) {
            result = RepetitionGuard._restructureBody(result);
        }

        return result.trim();
    }

    /**
     * Records the final response into all ring-buffers.
     * Returns a new RepetitionState (immutable update).
     */
    static record(response: string, state: RepetitionState): RepetitionState {
        const opening = extractOpening(response);
        const phrases = extractReflectivePhrases(response);
        const questions = extractQuestions(response);
        const questionTypes = extractQuestionTypes(response);

        const recentOpenings = [...state.recentOpenings, opening].slice(-MAX_OPENINGS);
        const recentPhrases = [...state.recentPhrases, ...phrases].slice(-MAX_PHRASES);
        const recentQuestions = [...state.recentQuestions, ...questions].slice(-MAX_QUESTIONS);
        const recentQuestionTypes = [
            ...(state.recentQuestionTypes ?? []),
            ...questionTypes
        ].slice(-MAX_QUESTION_TYPES);

        return { recentOpenings, recentPhrases, recentQuestions, recentQuestionTypes };
    }

    /**
     * Main entry point.
     * 1. Check violations (including full-body against recentResponses).
     * 2. Vary if any fire; re-check + vary once more if still violating.
     * 3. Record final output into ring-buffers.
     */
    static apply(
        response: string,
        state: RepetitionState,
        recentResponses: string[] = []
    ): { output: string; state: RepetitionState } {
        let violations = RepetitionGuard.check(response, state, recentResponses);
        let output = response;

        if (RepetitionGuard._hasAnyViolation(violations)) {
            output = RepetitionGuard.vary(output, violations);
            violations = RepetitionGuard.check(output, state, recentResponses);
            if (RepetitionGuard._hasAnyViolation(violations)) {
                output = RepetitionGuard.vary(output, violations);
            }
        }

        return { output, state: RepetitionGuard.record(output, state) };
    }

    // ── Private structural helpers ─────────────────────────────────────────────

    /**
     * Inverts the response opening:
     * - 2+ sentences: move second sentence to the front.
     * - Single sentence: prepend a deterministic bridging clause.
     */
    private static _invertOpening(response: string): string {
        const sentences = splitSentences(response);
        if (sentences.length >= 2) {
            const [first, second, ...rest] = sentences;
            return [second, first, ...rest].join(' ');
        }
        const BRIDGES = [
            "I want to sit with that for a moment.",
            "There's something in what you're sharing that I want to acknowledge.",
            "Before anything else —",
        ];
        return `${BRIDGES[response.length % BRIDGES.length]} ${response}`;
    }

    /**
     * Softens interrogative questions into declarative invitations.
     */
    private static _softenQuestions(response: string): string {
        return splitSentences(response)
            .map(sentence => {
                if (!sentence.trim().endsWith('?')) return sentence;
                const core = sentence.trim().replace(/\?$/, '').trim();
                const lower = core.toLowerCase();
                if (/^(what|how)\b/.test(lower)) {
                    return `I'm curious ${core.charAt(0).toLowerCase() + core.slice(1)}.`;
                }
                if (/^(do|does|is|are|have|has)\b/.test(lower)) {
                    return `I wonder ${core.charAt(0).toLowerCase() + core.slice(1)}.`;
                }
                return "I'm here to sit with whatever feels right to share.";
            })
            .join(' ');
    }

    /**
     * Structural restructure for body-level similarity:
     * - Drops the first sentence and appends a forward-looking observation instead.
     * This changes the opening entirely when phrase subs + inversion aren't enough.
     */
    private static _restructureBody(response: string): string {
        const sentences = splitSentences(response);
        if (sentences.length < 2) return response;

        // Drop sentence 1, keep the rest, append a forward observation
        const FORWARD_CLOSERS = [
            "There's no rush to get anywhere different from here.",
            "You don't need to have this figured out right now.",
            "Whatever comes next can wait — this moment is enough.",
        ];
        const closer = FORWARD_CLOSERS[response.length % FORWARD_CLOSERS.length];
        return [...sentences.slice(1), closer].join(' ');
    }

    private static _hasAnyViolation(v: ViolationSet): boolean {
        return v.openingRepeated || v.phraseRepeated || v.questionRepeated || v.bodyTooSimilar;
    }

    static emptyState(): RepetitionState {
        return {
            recentOpenings: [],
            recentPhrases: [],
            recentQuestions: [],
            recentQuestionTypes: [],
        };
    }
}
