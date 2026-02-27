import { EmotionalIntensity } from './types';

const INTENSE_WORDS = [
    'always', 'never', 'hate', 'horrible', 'impossible',
    'can\'t stand', 'destroying', 'ruining', 'suffocating',
    'unbearable', 'everything is', 'nothing works', 'falling apart'
];

/**
 * Detects the emotional intensity of a message based on
 * word choice, punctuation, and capitalization.
 */
export function detectIntensity(message: string): EmotionalIntensity {
    const msg = message.toLowerCase();
    let score = 0;

    for (const word of INTENSE_WORDS) {
        if (msg.includes(word)) score += 2;
    }

    // Exclamation marks
    score += (msg.match(/!/g) || []).length * 1.5;

    // ALL CAPS words
    const upperCount = (message.match(/[A-Z]/g) || []).length;
    const lowerCount = (message.match(/[a-z]/g) || []).length;
    if (upperCount > 5 && upperCount > lowerCount) score += 3;

    if (score > 6) return 'HIGH';
    if (score > 2) return 'MEDIUM';
    return 'LOW';
}
