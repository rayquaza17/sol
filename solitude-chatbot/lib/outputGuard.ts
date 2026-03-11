// ─── OutputGuard ──────────────────────────────────────────────────────────────
//
// Post-processes LLM output before sending to the frontend.
//
//   1. Trim whitespace
//   2. Strip AI identity leaks
//   3. Sentence cap (max 3)
//   4. Question cap (max 1)
//   5. Domain drift detection → replace with safe fallback
//   6. Consecutive question suppression → strip trailing question if last
//      response also ended with a question (avoids relentless questioning)
//   7. Opening-phrase repetition guard → strip repeated opener if it appeared
//      in any of the last 3 responses
//   8. High similarity guard → nudge with a safe variation when two consecutive
//      responses share > 70% word overlap (Jaccard similarity)
//
// ─────────────────────────────────────────────────────────────────────────────

const AI_LEAK_PHRASES: string[] = [
    'as an ai language model',
    'i am just an ai',
    "i'm just an ai",
    'as a language model',
    'as an ai',
    "i'm an ai",
    'i am an ai',
];

const DOMAIN_DRIFT_SIGNALS: RegExp[] = [
    /here'?s (a |the )?(code|recipe|solution)/i,
    /step \d+:/i,
    /```/,
    /function\s+\w+\s*\(/,
    /def\s+\w+\s*\(/,
    /class\s+\w+/,
    /import\s+\w+/,
    /http[s]?:\/\//i,
];

const DOMAIN_DRIFT_FALLBACK =
    "I'm here to focus on emotional wellbeing. Tell me what's been on your mind.";

const SAFE_FALLBACK = "I'm here with you. Take your time — there's no rush.";

// ─── Opening-phrase repetition guard ─────────────────────────────────────────
//
// These phrases often become "filler" openers that the LLM reuses constantly.
// If the new response starts with one of them AND it also appeared at the start
// of any recent response, we strip the opener so the rest of the sentence
// stands on its own — preserving meaning while varying the entry point.

const REPETITIVE_OPENERS: RegExp[] = [
    /^it sounds like\s*/i,
    /^i hear (that|you)\s*/i,
    /^that sounds (like\s*)?/i,
    /^it seems like\s*/i,
    /^i understand (that\s*)?/i,
    /^i can (hear|see|tell) (that\s*)?/i,
    /^it's (completely )?normal (to|that)\s*/i,
    /^that must (be\s*)?/i,
    /^i can imagine\s*/i,
    /^i want you to know (that\s*)?/i,
    /^first(ly)?,?\s*/i,
];

/**
 * Returns the matched opener string if `text` starts with a known repetitive
 * phrase, otherwise returns null.
 */
function matchOpener(text: string): RegExpMatchArray | null {
    for (const re of REPETITIVE_OPENERS) {
        const m = text.match(re);
        if (m) return m;
    }
    return null;
}

/**
 * Returns true if any of the recentResponses share the same opening phrase
 * family as `opener`.
 */
function openerSeenRecently(opener: RegExpMatchArray, recent: string[]): boolean {
    // Re-test each recent response with the same pattern that matched `opener`
    return recent.some(r => {
        for (const re of REPETITIVE_OPENERS) {
            if (re.test(r.trimStart())) return true;
        }
        return false;
    });
}

/**
 * Strip the leading opener from text, capitalising the remainder.
 */
function stripOpener(text: string, match: RegExpMatchArray): string {
    const rest = text.slice(match[0].length).trimStart();
    if (!rest) return text; // nothing left — keep original
    return rest.charAt(0).toUpperCase() + rest.slice(1);
}

// ─── Jaccard word-overlap similarity ─────────────────────────────────────────

function tokenize(text: string): Set<string> {
    return new Set(
        text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 2), // ignore very short words
    );
}

function jaccardSimilarity(a: string, b: string): number {
    const setA = tokenize(a);
    const setB = tokenize(b);
    if (setA.size === 0 || setB.size === 0) return 0;

    let intersection = 0;
    setA.forEach(w => { if (setB.has(w)) intersection++; });

    const union = setA.size + setB.size - intersection;
    return intersection / union;
}

// ─── Other helpers ────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
    return text
        // Split after sentence-ending punctuation (.!?) but NOT after a digit
        // followed by a period — that would break numbered lists like "1. ..."
        .split(/(?<=[!?]|(?<!\d)\.(?!\d))\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function stripAILeaks(text: string): string {
    const lower = text.toLowerCase();
    for (const phrase of AI_LEAK_PHRASES) {
        if (lower.includes(phrase)) {
            const sentences = splitSentences(text);
            const cleaned = sentences.filter(
                s => !AI_LEAK_PHRASES.some(p => s.toLowerCase().includes(p))
            );
            return cleaned.join(' ');
        }
    }
    return text;
}

function hasDomainDrift(text: string): boolean {
    const matches = DOMAIN_DRIFT_SIGNALS.filter(r => r.test(text)).length;
    return matches >= 2;
}

/** Returns true if text's last sentence ends with a question mark. */
function endsWithQuestion(text: string): boolean {
    return text.trimEnd().endsWith('?');
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Validates and post-processes LLM output before returning to the frontend.
 *
 * @param text            Raw LLM output
 * @param lastResponse    Previous assistant response (consecutive question guard)
 * @param recentResponses Last 3–4 assistant responses (diversity guards)
 */
export function validateOutput(
    text: string,
    lastResponse?: string,
    recentResponses: string[] = [],
): string {
    // 1. Trim
    let result = text.trim();
    if (!result) return SAFE_FALLBACK;

    // 2. Domain drift — replace entirely
    if (hasDomainDrift(result)) return DOMAIN_DRIFT_FALLBACK;

    // 3. Strip AI identity leaks
    result = stripAILeaks(result).trim();
    if (!result) return SAFE_FALLBACK;

    // 4. Sentence cap (max 5)
    let sentences = splitSentences(result);
    if (sentences.length > 5) {
        sentences = sentences.slice(0, 5);
    }

    // 5. Question cap (max 1)
    let questionsKept = 0;
    sentences = sentences.filter(s => {
        if (s.includes('?')) {
            questionsKept++;
            return questionsKept <= 1;
        }
        return true;
    });

    // 6. Consecutive question suppression
    if (lastResponse && endsWithQuestion(lastResponse)) {
        const last = sentences[sentences.length - 1];
        if (last && last.includes('?')) {
            sentences = sentences.slice(0, -1);
        }
    }

    result = sentences.join(' ').trim() || SAFE_FALLBACK;

    // 7. Opening-phrase repetition guard
    //    Only strip if the same opener family appeared in the last 3 responses
    //    (use up to last 3 entries from recentResponses).
    const window = recentResponses.slice(-3);
    if (window.length > 0) {
        const openerMatch = matchOpener(result);
        if (openerMatch && openerSeenRecently(openerMatch, window)) {
            const stripped = stripOpener(result, openerMatch);
            if (stripped && stripped !== result) {
                result = stripped;
            }
        }
    }

    // 8. High-similarity guard (Jaccard ≥ 0.70 against most recent response)
    //    If the response is nearly identical in wording to the last reply,
    //    prepend a brief bridging phrase to differentiate it slightly while
    //    preserving the underlying meaning.
    if (lastResponse) {
        const similarity = jaccardSimilarity(result, lastResponse);
        if (similarity >= 0.70) {
            const BRIDGE_PHRASES = [
                'To add to that —',
                'Building on what I said —',
                'Putting it another way —',
                'And more importantly —',
            ];
            const bridge = BRIDGE_PHRASES[Math.floor(Math.random() * BRIDGE_PHRASES.length)];
            result = `${bridge} ${result}`;
        }
    }

    return result || SAFE_FALLBACK;
}
