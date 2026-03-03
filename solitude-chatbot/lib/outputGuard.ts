// ─── OutputGuard ──────────────────────────────────────────────────────────────
//
// Post-processes LLM output before sending to the frontend.
//
//   1. Trim whitespace
//   2. Strip AI identity leaks
//   3. Sentence cap (max 3)
//   4. Question cap (max 1)
//   5. Domain drift detection → replace with safe fallback
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function splitSentences(text: string): string[] {
    return text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
}

function stripAILeaks(text: string): string {
    const lower = text.toLowerCase();
    for (const phrase of AI_LEAK_PHRASES) {
        if (lower.includes(phrase)) {
            // Remove the sentence containing the leak
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

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Validates and post-processes LLM output before returning to the frontend.
 */
export function validateOutput(text: string): string {
    // 1. Trim
    let result = text.trim();
    if (!result) return SAFE_FALLBACK;

    // 2. Domain drift — replace entirely
    if (hasDomainDrift(result)) return DOMAIN_DRIFT_FALLBACK;

    // 3. Strip AI identity leaks
    result = stripAILeaks(result).trim();
    if (!result) return SAFE_FALLBACK;

    // 4. Sentence cap (max 3)
    let sentences = splitSentences(result);
    if (sentences.length > 3) {
        sentences = sentences.slice(0, 3);
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

    return sentences.join(' ').trim() || SAFE_FALLBACK;
}
