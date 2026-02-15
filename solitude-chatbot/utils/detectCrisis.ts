/**
 * Lightweight deterministic Crisis Detection Layer.
 * Designed to detect high-risk phrases without flagging general emotional distress.
 */

const HIGH_RISK_PHRASES = [
    "end my life",
    "kill myself",
    "hurt myself",
    "want to die",
    "no reason to live",
    "thinking of suicide"
];

const MEDIUM_RISK_PHRASES = [
    "hopeless",
    "worthless",
    "can't go on",
    "give up on life"
];

/**
 * Detects if a message indicates a serious crisis.
 * Threshold: Score >= 3
 */
export function detectCrisis(message: string): boolean {
    const msg = message.toLowerCase();
    let score = 0;

    // High risk phrases have a weight of 3
    for (const phrase of HIGH_RISK_PHRASES) {
        if (msg.includes(phrase)) {
            score += 3;
        }
    }

    // Medium risk phrases have a weight of 1
    for (const phrase of MEDIUM_RISK_PHRASES) {
        if (msg.includes(phrase)) {
            score += 1;
        }
    }

    return score >= 3;
}

/**
 * Builds a calm and supportive response for crisis situations.
 */
export function buildCrisisResponse(): string {
    return "I’m really glad you said something. If you’re feeling unsafe, reaching out to someone nearby can make a big difference. You’re not alone — here are some real people you can contact right now. You deserve real support.\n\nAASRA Helpline (India): +91-9820466726";
}
