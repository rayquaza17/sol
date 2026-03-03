import { EmotionalIntensity } from './types';

// ─── Intensity Detection ──────────────────────────────────────────────────────
//
// Two-tier intensity system:
//   detectIntensityScore() → fine-grained 1–5 score (new)
//   detectIntensity()      → coarse LOW/MEDIUM/HIGH (backward compat)
//
// ─────────────────────────────────────────────────────────────────────────────

const INTENSE_WORDS = [
    'always', 'never', 'hate', 'horrible', 'impossible',
    'can\'t stand', 'destroying', 'ruining', 'suffocating',
    'unbearable', 'everything is', 'nothing works', 'falling apart'
];

const CRISIS_ADJACENT = [
    'hopeless', 'worthless', 'numb', 'empty', 'can\'t go on',
    'no point', 'give up', 'done with', 'exhausted',
];

/**
 * Detects fine-grained emotional intensity on a 1–5 scale.
 *
 * Scoring:
 *   - Intense words: +0.8 each
 *   - Crisis-adjacent words: +1.2 each
 *   - Exclamation marks: +0.4 each
 *   - ALL CAPS dominance: +1.0
 *   - Long message (>200 chars): +0.5
 *   - Very short expressive message (<15 chars with punctuation): +0.3
 *
 * Final score is clamped to [1, 5].
 */
export function detectIntensityScore(message: string): number {
    const msg = message.toLowerCase();
    let raw = 0;

    for (const word of INTENSE_WORDS) {
        if (msg.includes(word)) raw += 0.8;
    }

    for (const word of CRISIS_ADJACENT) {
        if (msg.includes(word)) raw += 1.2;
    }

    // Exclamation marks
    const exclamations = (msg.match(/!/g) || []).length;
    raw += exclamations * 0.4;

    // ALL CAPS words
    const upperCount = (message.match(/[A-Z]/g) || []).length;
    const lowerCount = (message.match(/[a-z]/g) || []).length;
    if (upperCount > 5 && upperCount > lowerCount) raw += 1.0;

    // Long message
    if (message.length > 200) raw += 0.5;

    // Very short expressive burst (e.g., "UGH!", "I HATE THIS!")
    if (message.length < 15 && exclamations > 0) raw += 0.3;

    // Map raw score to 1–5 scale
    // Thresholds: 0–0.5 → 1, 0.5–1.5 → 2, 1.5–3.0 → 3, 3.0–5.0 → 4, 5.0+ → 5
    let score: number;
    if (raw <= 0.5) score = 1;
    else if (raw <= 1.5) score = 2;
    else if (raw <= 3.0) score = 3;
    else if (raw <= 5.0) score = 4;
    else score = 5;

    return score;
}

/**
 * Detects the coarse emotional intensity of a message.
 * Delegates to detectIntensityScore() and maps: 1–2 → LOW, 3 → MEDIUM, 4–5 → HIGH.
 */
export function detectIntensity(message: string): EmotionalIntensity {
    const score = detectIntensityScore(message);
    if (score >= 4) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
}
