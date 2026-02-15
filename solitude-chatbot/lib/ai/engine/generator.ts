import { ResponseContext, IntentType, ActionType, ConversationState, IntentMatch } from './types';
import {
    REFLECTIONS,
    INSIGHTS,
    ADVICE_STRATEGIES,
    DISTRESS_ANCHORS,
    ACKNOWLEDGEMENTS,
    ANCHORING_TEMPLATES,
    GENTLE_QUESTIONS,
    INTENT_QUESTIONS,
    CONNECTORS,
    HESITATIONS,
    CASUAL_PIVOTS
} from './registry';
import { MemoryManager } from './memory';
import { humanizeResponse } from './humanizer';
import { applyPresentationMode } from './presentation';

// --- Constants ---
const PRESENTATION_MODE = true;

// --- Utility Functions ---

function getSimilarity(s1: string, s2: string): number {
    if (!s1 || !s2) return 0;
    const tokens1 = new Set(s1.toLowerCase().split(/\s+/).filter(t => t.length > 2));
    const tokens2 = new Set(s2.toLowerCase().split(/\s+/).filter(t => t.length > 2));
    if (tokens1.size === 0 || tokens2.size === 0) return 0;
    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);
    return intersection.size / union.size;
}

function selectFreshPhrase(
    pool: string[],
    usedPhrases: string[],
    recentFullPhrases: string[],
    recentOpeners: string[]
): string {
    const available = pool.filter(p => {
        // 1. Not in usedPhrases (long-term turn-exhaustion)
        if (usedPhrases.includes(p)) return false;

        // 2. Not similar to recent phrases (short-term anti-repetition)
        if (recentFullPhrases.some(rfp => getSimilarity(p, rfp) > 0.35)) return false;

        // 3. Doesn't start with a recent opener
        const opener = p.split(/[,\s]/)[0].toLowerCase();
        if (recentOpeners.some(ro => ro.toLowerCase() === opener)) return false;

        // 4. No direct substring overlap for short phrases
        if (p.length < 40 && recentFullPhrases.some(rfp => rfp.includes(p) || p.includes(rfp))) return false;

        return true;
    });

    if (available.length === 0) {
        // Emergency: just pick something not EXACTLY in most recent phrases
        const fallback = pool.filter(p => !recentFullPhrases.includes(p));
        return fallback.length > 0 ? fallback[Math.floor(Math.random() * fallback.length)] : pool[Math.floor(Math.random() * pool.length)];
    }
    return available[Math.floor(Math.random() * available.length)];
}

function formatTemplate(template: string, replacements: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
}

function injectHesitation(base: string): string {
    if (Math.random() < 0.25) {
        const h = HESITATIONS[Math.floor(Math.random() * HESITATIONS.length)];
        return `${h} ${base.charAt(0).toLowerCase() + base.slice(1)}`;
    }
    return base;
}

/**
 * Generates a concise, 1-2 sentence response directly from intent.
 * Bypasses legacy template stacking.
 */
function buildSimpleResponse(
    intentMatch: IntentMatch,
    state: ConversationState,
    phrasesToTrack: string[]
): string {
    const { actionType, type: intent } = intentMatch;
    const subject = intentMatch.subject || "that";
    const turnCount = state.messageCount;

    // 1. SELECT ACKNOWLEDGMENT
    const particles = ["Yeah...", "I hear you.", "Makes sense.", "I see."];
    const greetingParticles = ["Hey.", "Hi.", "I'm here."];
    const particlePool = actionType === 'GREET' ? greetingParticles : particles;
    const particle = particlePool[Math.floor(Math.random() * particlePool.length)];

    // 2. SELECT ADAPTIVE SENTENCE
    let adaptive = "";
    if (actionType === 'ADVICE') {
        const strategies = ADVICE_STRATEGIES[intent] || ADVICE_STRATEGIES.GENERAL;
        adaptive = strategies[Math.floor(Math.random() * strategies.length)];
    } else {
        const reflections = REFLECTIONS[intent] || REFLECTIONS.GENERAL;
        adaptive = reflections[Math.floor(Math.random() * reflections.length)];
    }

    // Replace template
    adaptive = adaptive.replace(/{{topic}}/g, subject);

    const final = `${particle} ${adaptive}`.trim();
    phrasesToTrack.push(final);
    return final;
}

// --- Main Generator ---

export function generateEmpatheticResponse(
    context: ResponseContext,
    state: ConversationState,
    intentMatch: IntentMatch
): { content: string, newState: ConversationState } {
    const intent = intentMatch.type;
    const actionType = intentMatch.actionType;
    const subject = intentMatch.subject || "what we're talking about";
    const turnCount = state.messageCount;
    const isHighDistress = state.intensity === 'HIGH';

    const memory = state.memory;
    const usedPhrases = memory.usedPhrases;
    const recentOpeners = memory.recentOpeners;
    const recentPhrases = memory.recentPhrases;

    const components: string[] = [];
    const phrasesToTrack: string[] = [];

    let finalContent = "";

    // --- BYPASS LOGIC ---
    if (PRESENTATION_MODE || state.presentationState.enabled) {
        finalContent = buildSimpleResponse(intentMatch, state, phrasesToTrack);
    } else {
        // --- LEGACY COMPOSER (A+B+C STACKING) ---
        let stepA = "";
        if (actionType === 'GREET' && turnCount <= 1) {
            stepA = selectFreshPhrase(REFLECTIONS.GREETING, usedPhrases, recentPhrases, recentOpeners);
        } else if (actionType === 'ADVICE') {
            stepA = selectFreshPhrase(ANCHORING_TEMPLATES.ADVICE_REQUEST, usedPhrases, recentPhrases, recentOpeners);
            stepA = formatTemplate(stepA, { topic: subject });
        } else if (actionType === 'VENT' || actionType === 'QUESTION') {
            stepA = selectFreshPhrase(ANCHORING_TEMPLATES.VENTING, usedPhrases, recentPhrases, recentOpeners);
            stepA = formatTemplate(stepA, { topic: subject });
        } else if (actionType === 'CASUAL' && turnCount > 1) {
            stepA = selectFreshPhrase(CASUAL_PIVOTS, usedPhrases, recentPhrases, recentOpeners);
        } else {
            const reflectPool = REFLECTIONS[intent] || REFLECTIONS.GENERAL;
            stepA = selectFreshPhrase(reflectPool, usedPhrases, recentPhrases, recentOpeners);
        }

        if (isHighDistress && Math.random() < 0.4) {
            const distress = selectFreshPhrase(DISTRESS_ANCHORS, usedPhrases, recentPhrases, recentOpeners);
            stepA = `${distress} ${stepA}`;
        }

        stepA = injectHesitation(stepA);
        components.push(stepA);

        let stepB = "";
        if (actionType === 'ADVICE') {
            const strategies = ADVICE_STRATEGIES[intent] || ADVICE_STRATEGIES.GENERAL;
            stepB = selectFreshPhrase(strategies, usedPhrases, recentPhrases, recentOpeners);
        } else if (actionType === 'VENT' || actionType === 'QUESTION' || actionType === 'CASUAL') {
            const insights = INSIGHTS[intent] || INSIGHTS.GENERAL;
            stepB = selectFreshPhrase(insights, usedPhrases, recentPhrases, recentOpeners);
            const conn = CONNECTORS.TO_INSIGHT[Math.floor(Math.random() * CONNECTORS.TO_INSIGHT.length)];
            if (conn && stepB) stepB = `${conn} ${stepB.charAt(0).toLowerCase() + stepB.slice(1)}`;
        }

        if (stepB) components.push(stepB);

        let stepC = "";
        const canAsk = memory.turnsSinceLastQuestion >= (intent === 'GREETING' ? 0 : 2) && actionType !== 'ADVICE';
        if (canAsk && Math.random() < 0.35) {
            const qPool = INTENT_QUESTIONS[intent] || GENTLE_QUESTIONS;
            stepC = MemoryManager.getAvailableQuestion(qPool, memory) || "";
            if (stepC) components.push(stepC);
        }

        finalContent = components.join(" ").trim();
        phrasesToTrack.push(...components);
    }

    // --- FINAL ALIGNMENT GUARDRAIL ---
    const normalizedContent = finalContent.toLowerCase();
    const hasSubject = !subject || normalizedContent.includes(subject.toLowerCase()) ||
        (intentMatch.matchedKeywords.length > 0 && intentMatch.matchedKeywords.some(k => normalizedContent.includes(k.toLowerCase())));

    if (!hasSubject && actionType !== 'GREET' && actionType !== 'CASUAL') {
        const repair = `I want to make sure I followed you correctly — you were sharing about the ${subject}, right?`;
        finalContent = PRESENTATION_MODE ? finalContent : `${finalContent} ${repair}`;
    }

    // --- UPDATE STATE (Pre-Humanization) ---
    const newUsedPhrases = [...usedPhrases, ...phrasesToTrack];
    if (newUsedPhrases.length > 60) newUsedPhrases.splice(0, 20);

    const preHumanizedState = {
        ...state,
        memory: {
            ...memory,
            usedPhrases: newUsedPhrases,
            turnsSinceLastQuestion: finalContent.includes('?') ? 0 : memory.turnsSinceLastQuestion + 1
        }
    };

    // --- APPLY HUMANIZATION LAYER ---
    const { humanizedResponse, newHumanizationState } = humanizeResponse(
        finalContent,
        context.message,
        preHumanizedState,
        intentMatch
    );

    // --- STATE WITH HUMANIZATION ---
    const postHumanizedState = {
        ...preHumanizedState,
        humanizationState: newHumanizationState
    };

    // --- APPLY PRESENTATION MODE (FINAL LAYER) ---
    const { presentationResponse, newPresentationState } = applyPresentationMode(
        humanizedResponse,
        context.message,
        postHumanizedState,
        intentMatch
    );

    // --- FINAL STATE WITH PRESENTATION MODE ---
    const finalState = {
        ...postHumanizedState,
        presentationState: newPresentationState
    };

    return { content: presentationResponse, newState: finalState };
}

