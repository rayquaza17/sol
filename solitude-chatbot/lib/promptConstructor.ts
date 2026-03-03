import {
    IntentMatch,
    IntentType,
    ConversationMemory,
    ConversationStage,
    EmotionalIntensity,
} from './ai/engine/types';

// ─── PromptConstructor ────────────────────────────────────────────────────────
//
// Builds a structured prompt string from engine context for Ollama LLM.
//
// Structure:
//   1. System identity
//   2. Rules
//   3. Intent-based conditioning instruction
//   4. Stage-based conditioning instruction
//   5. Injected conversation state
//   6. USER MESSAGE
//   7. "Respond now."
//
// ─────────────────────────────────────────────────────────────────────────────

export interface PromptInput {
    userMessage: string;
    intent: IntentMatch;
    memoryState: ConversationMemory;
    stage: ConversationStage;
    intensity?: EmotionalIntensity;
    isCrisis?: boolean;
    /** Optional Level 2 soft intervention text injected before intent instruction */
    level2Injection?: string;
}

const SYSTEM_IDENTITY =
    'You are Solitude, a calm and grounded mental wellbeing conversational companion.';

const RULES = `RULES:
- Stay within emotional wellbeing topics.
- Do not provide medical diagnosis.
- Max 3 sentences.
- Max 1 question.
- Avoid clichés.
- Avoid therapy jargon.
- Keep tone natural and steady.`;

const CRISIS_ADDENDUM = `CRISIS DETECTED — This person may be in distress.
- Respond with warmth and grounding.
- Gently mention iCall at 9152987821 (available in India, Monday–Saturday 8am–10pm).
- Do NOT minimize their pain or ask probing questions.`;

// ─── Intent Conditioning ──────────────────────────────────────────────────────

function getIntentInstruction(intentType: IntentType): string {
    switch (intentType) {
        case 'venting':
            return 'User is venting. Focus on reflection and containment. Do not offer advice or solutions. Acknowledge what they are feeling.';
        case 'advice_request':
            return 'User is asking for advice. Provide a gentle, practical suggestion relevant to emotional wellbeing. Keep it brief.';
        case 'greeting':
            return 'Respond warmly but briefly. Invite them to share what is on their mind.';
        case 'reassurance_seeking':
            return 'User needs reassurance. Validate their feelings gently. Normalize their experience without dismissing it.';
        case 'grounding_request':
            return 'User needs grounding. Offer a simple, present-moment focus — breathing, senses, or stillness. Keep it concrete and calm.';
        case 'emotional_reflection':
            return 'User is reflecting on their emotions. Help them go deeper. Ask one thoughtful question or gently name what you observe.';
        case 'progress_update':
            return 'User is sharing a positive update or progress. Acknowledge it warmly. Reflect on how far they have come without being dramatic.';
        case 'crisis_signal':
            return 'User may be in crisis. Respond with immediate warmth. Do not probe. Gently encourage professional support.';
        case 'out_of_scope':
            return 'User has gone off-topic. Gently redirect them back to emotional wellbeing without being dismissive.';
        default:
            return 'Respond with calm, grounded presence. Reflect without advising.';
    }
}

// ─── Stage Conditioning ───────────────────────────────────────────────────────

function getStageInstruction(stage: ConversationStage): string {
    switch (stage) {
        case 'initial':
            return 'This is an early conversation. Keep responses open and welcoming. Do not push for detail.';
        case 'exploring':
            return 'The conversation is building. Use gentle clarifying questions to understand more.';
        case 'deepening':
            return 'The conversation has depth now. Synthesize what you have heard. Ask fewer questions.';
        case 'stabilizing':
            return 'The user may be tiring or calming down. Focus on grounding. Fewer questions, more presence.';
        case 'closing':
            return 'The conversation is winding down. Offer encouragement. Summarize gently if appropriate.';
    }
}

// ─── constructPrompt ──────────────────────────────────────────────────────────

export function constructPrompt(input: PromptInput): string {
    const { userMessage, intent, memoryState, stage, intensity = 'LOW', isCrisis = false } = input;

    const parts: string[] = [];

    // 1. System identity
    parts.push(SYSTEM_IDENTITY);
    parts.push('');

    // 2. Rules
    parts.push(RULES);
    parts.push('');

    // 3. Crisis addendum (Level 3 is handled before prompt construction, this is for Level 2)
    if (input.level2Injection) {
        parts.push(`CRITICAL CONTEXT:\n${input.level2Injection}`);
        parts.push('');
    } else if (isCrisis) {
        parts.push(CRISIS_ADDENDUM);
        parts.push('');
    }

    // 4. Intent-based conditioning
    parts.push(`INTENT INSTRUCTION:\n${getIntentInstruction(intent.type)}`);
    parts.push('');

    // 5. Stage-based conditioning
    parts.push(`STAGE INSTRUCTION:\n${getStageInstruction(stage)}`);
    parts.push('');

    // 6. Conversation state
    parts.push('CONVERSATION STATE:');
    parts.push(`Intent: ${intent.type}`);
    parts.push(`Stage: ${stage}`);
    parts.push(`Emotional Intensity: ${intensity}`);

    const activeTopics = memoryState.topics
        .filter(t => t.occurrences >= 2)
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 4);

    if (activeTopics.length > 0) {
        parts.push(`Active Themes: ${activeTopics.map(t => t.topic).join(', ')}`);
    }
    parts.push('');

    // 7. User message
    parts.push(`USER MESSAGE:\n${userMessage}`);
    parts.push('');

    // 8. Final instruction
    parts.push('Respond now.');

    return parts.join('\n');
}
