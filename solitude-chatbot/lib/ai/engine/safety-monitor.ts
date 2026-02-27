import { SafetyLevel, SafetyAssessment } from './types';

// ─── SafetyMonitor ────────────────────────────────────────────────────────────
//
// Responsible for detecting crisis-level language and escalating appropriately.
// Fully independent of other modules. Accepts a raw message, returns a
// SafetyAssessment with a level, score, and the specific phrases that matched.
//

type PatternKind = 'direct' | 'context';

type SafetyPattern = {
    id: string;
    kind: PatternKind;
    weight: number;
    re: RegExp;
};

const SAFE_NON_CRISIS_SINGLE_WORDS = new Set(['help', 'stress', 'sad', 'tired']);

// Weighted phrase scoring (high-confidence only).
// - Direct patterns require first-person framing to reduce false positives.
// - Context patterns never trigger CRISIS alone.
const SAFETY_PATTERNS: SafetyPattern[] = [
    // ── Direct, explicit self-harm / suicide intent ─────────────────────────
    {
        id: 'want_to_die',
        kind: 'direct',
        weight: 12,
        re: /\b(i\s*(?:really\s*)?(?:want|wanna)\s*to\s*die)\b/i
    },
    {
        id: 'want_to_kill_myself',
        kind: 'direct',
        weight: 14,
        re: /\b(i\s*(?:really\s*)?(?:want|wanna)\s*to\s*kill\s*myself)\b/i
    },
    {
        id: 'plan_to_kill_myself',
        kind: 'direct',
        weight: 16,
        re: /\b(i\s*(?:am|\'m)?\s*(?:going|planning|plan)\s*to\s*kill\s*myself)\b/i
    },
    {
        id: 'end_my_life',
        kind: 'direct',
        weight: 14,
        re: /\b(i\s*(?:really\s*)?(?:want|wanna|plan|planning)\s*to\s*end\s*my\s*life)\b/i
    },
    {
        id: 'take_my_own_life',
        kind: 'direct',
        weight: 14,
        re: /\b(i\s*(?:really\s*)?(?:want|wanna|plan|planning)\s*to\s*take\s*my\s*own\s*life)\b/i
    },
    {
        id: 'thinking_about_suicide',
        kind: 'direct',
        weight: 13,
        re: /\b(i\s*(?:am|\'m)?\s*(?:thinking about|thinking of|considering)\s*suicide)\b/i
    },
    {
        id: 'suicidal_thoughts',
        kind: 'direct',
        weight: 12,
        re: /\b(i\s*(?:am|\'m)?\s*(?:having|getting)\s*suicidal\s*thoughts?)\b/i
    },
    {
        id: 'urge_self_harm',
        kind: 'direct',
        weight: 12,
        re: /\b(i\s*(?:am|\'m)?\s*(?:want|wanna|feel like|feel)\s*(?:to\s*)?(?:hurt\s*myself|cut\s*myself|self[-\s]?harm))\b/i
    },

    // ── Context / concerning language (never CRISIS by itself) ──────────────
    {
        id: 'cant_go_on',
        kind: 'context',
        weight: 4,
        re: /\b(i\s*(?:can\'t|cant)\s*go\s*on)\b/i
    },
    {
        id: 'no_reason_to_live',
        kind: 'context',
        weight: 5,
        re: /\b(no\s*reason\s*to\s*live)\b/i
    },
    {
        id: 'better_off_dead',
        kind: 'context',
        weight: 5,
        re: /\b(better\s*off\s*dead)\b/i
    },
    {
        id: 'hopeless',
        kind: 'context',
        weight: 2,
        re: /\b(hopeless)\b/i
    },
    {
        id: 'worthless',
        kind: 'context',
        weight: 2,
        re: /\b(worthless)\b/i
    }
];

// High-confidence trigger rules:
// - CRISIS requires at least one DIRECT match and a sufficiently high score.
const CRISIS_DIRECT_MIN = 1;
const CRISIS_SCORE_THRESHOLD = 12;
const MONITOR_THRESHOLD = 4;

function normalize(input: string): string {
    return input
        .toLowerCase()
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function isNegated(msg: string, matchIndex: number): boolean {
    // Simple "nearby negation" heuristic to avoid triggering on:
    // "I don't want to kill myself"
    const windowStart = Math.max(0, matchIndex - 24);
    const prefix = msg.slice(windowStart, matchIndex);
    return /\b(don\'t|dont|do not|not|never)\b/i.test(prefix);
}

/**
 * SafetyMonitor.assess()
 *
 * Scans the message for crisis-level language.
 * Returns a SafetyAssessment with level, score, and matched phrases.
 * Pure function — no side effects.
 */
export class SafetyMonitor {
    static assess(message: string): SafetyAssessment {
        const msg = normalize(message);

        // Explicit non-crisis guard for single-word messages.
        if (SAFE_NON_CRISIS_SINGLE_WORDS.has(msg)) {
            return { level: 'SAFE', triggered: false, matchedPhrases: [], score: 0 };
        }

        let score = 0;
        let directMatches = 0;
        const matchedPhrases: string[] = [];

        for (const pattern of SAFETY_PATTERNS) {
            const match = msg.match(pattern.re);
            if (!match || match.index == null) continue;
            if (isNegated(msg, match.index)) continue;

            score += pattern.weight;
            matchedPhrases.push(pattern.id);
            if (pattern.kind === 'direct') directMatches += 1;
        }

        let level: SafetyLevel;
        const crisisHighConfidence = directMatches >= CRISIS_DIRECT_MIN && score >= CRISIS_SCORE_THRESHOLD;
        if (crisisHighConfidence) {
            level = 'CRISIS';
        } else if (score >= MONITOR_THRESHOLD) {
            level = 'MONITOR';
        } else {
            level = 'SAFE';
        }

        return {
            level,
            triggered: level === 'CRISIS',
            matchedPhrases,
            score
        };
    }

    /**
     * Returns a calm, supportive crisis response with helpline info.
     * Multiple variants to avoid repetition across sessions.
     */
    static buildResponse(): string {
        const responses = [
            "I hear you, and I’m really glad you said it out loud. If you can, please reach out to someone you trust right now, and consider calling a crisis helpline: in the U.S./Canada you can call or text 988; otherwise, contact your local emergency number or look up your country’s crisis hotline.",
            "That sounds incredibly heavy, and you don’t have to hold it alone. Please seek real-world support right now—someone you trust, or a local helpline (U.S./Canada: call/text 988; elsewhere: your local emergency number or your country’s crisis hotline).",
            "I’m here with you in this moment. Please connect with support in the real world as soon as you can: a trusted person, or a crisis line (U.S./Canada: 988; otherwise your local emergency number or local crisis hotline)."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}
