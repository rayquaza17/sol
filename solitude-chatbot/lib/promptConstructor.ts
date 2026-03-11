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
    'You are Solitude, a calm and grounded mental wellbeing conversational companion. ' +
    'Your role is to acknowledge what people are going through, offer supportive perspective, and occasionally suggest small practical steps. ' +
    'Your tone is warm and steady — like a trusted friend who listens well. Never sound clinical, formal, or robotic.';


const RULES = `RULES:
- Stay within emotional wellbeing topics.
- Do not provide medical diagnosis.
- Target 2–3 sentences. Maximum 5 sentences. Avoid long paragraphs.
- Only ask a question if it meaningfully helps move the conversation forward. If the response already provides helpful guidance, do not add a question.
- Avoid ending every response with a question.
- Avoid clichés.
- Avoid therapy jargon.
- Keep tone natural and steady.
- Acknowledge the user's situation naturally rather than labeling their emotions directly. Focus on what they described, not how they feel.
- NEVER open with: "It sounds like you're feeling", "I hear that you're feeling", "It seems like", "That sounds like", "I can hear that", "I understand that you're feeling".`;


// ─── Response Style ───────────────────────────────────────────────────────────
//
// Describes the preferred 3-step structure for every response.
// Injected after RULES so it applies globally, before intent conditioning.

const RESPONSE_STYLE = `RESPONSE STYLE:
Follow this structure naturally — do not label the steps:
  Step 1 — Reference the specific situation the user described (not their emotion label).
  Step 2 — Offer a supportive insight or one small, concrete suggestion relevant to that situation.
  Step 3 — Optionally add ONE gentle question, but only when it would genuinely help. Skip it if the response already feels complete.

Example (exam stress):
  DO: "Exam pressure can build up quickly, especially when subjects start competing for the same time. Tackling one small topic at a time often makes the load easier to manage."
  DON'T: "It sounds like you're feeling overwhelmed by your exams."`;


const CRISIS_ADDENDUM = `CRISIS DETECTED — This person may be in distress.
- Respond with warmth and grounding.
- Gently mention iCall at 9152987821 (available in India, Monday–Saturday 8am–10pm).
- Do NOT minimize their pain or ask probing questions.`;

// ─── Intent Conditioning ──────────────────────────────────────────────────────

function getIntentInstruction(intentType: IntentType): string {
    switch (intentType) {
        case 'venting':
            return 'User is venting. Reference the specific situation they described — do not label their emotions. Briefly acknowledge what they are going through, then offer one grounded insight or small practical suggestion if the situation warrants it.';

        case 'advice_request':
            return 'User is explicitly asking for advice. Provide 1\u20132 clear, practical, and realistic suggestions relevant to their situation. Do not respond with only questions. Do not give abstract or philosophical responses. Give the suggestions first. Only add a follow-up question if it would genuinely help clarify or deepen the support.';
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
            return 'Respond with calm, grounded presence. Follow the user\'s lead.';
    }
}

// Topics that warrant a proactive micro-suggestion when venting at moderate+ intensity
const ACTIONABLE_TOPICS = new Set([
    'exam', 'exams', 'exam stress', 'study', 'studying',
    'deadline', 'deadlines', 'workload', 'work', 'assignment', 'assignments',
    'procrastination', 'sleep', 'sleeping', 'anxiety', 'pressure',
    'presentation', 'interview', 'project', 'thesis', 'task', 'tasks',
    'burnout', 'overworked', 'overwhelm', 'overwhelmed',
]);

function hasActionableTopic(topics: { topic: string }[]): boolean {
    return topics.some(t =>
        ACTIONABLE_TOPICS.has(t.topic.toLowerCase())
    );
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

    // 2b. Response style guideline
    parts.push(RESPONSE_STYLE);
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

    // 4b. Proactive micro-suggestion for venting at moderate/high intensity on actionable themes
    if (
        intent.type === 'venting' &&
        (intensity === 'MEDIUM' || intensity === 'HIGH') &&
        hasActionableTopic(memoryState.topics)
    ) {
        const themeNames = memoryState.topics
            .filter(t => ACTIONABLE_TOPICS.has(t.topic.toLowerCase()))
            .map(t => t.topic)
            .slice(0, 3)
            .join(', ');
        parts.push(
            `MICRO-SUGGESTION INSTRUCTION:\nUser is experiencing stress related to: ${themeNames}. Briefly acknowledge their situation, then provide one small, practical, and non-overwhelming suggestion directly related to this theme. Do not prescribe multiple steps. Keep it manageable and specific.`
        );

        parts.push('');
    }

    // 5. Stage-based conditioning
    parts.push(`STAGE INSTRUCTION:\n${getStageInstruction(stage)}`);
    parts.push('');

    // 6. Conversation context (memory injection)
    parts.push('CONVERSATION CONTEXT:');
    parts.push(`Intent: ${intent.type}`);
    parts.push(`Stage: ${stage}`);
    parts.push(`Emotional Intensity: ${intensity}`);

    // Emotional tone from trend history
    const tone = memoryState.toneTrend ?? 'STABLE';
    parts.push(`Emotional Tone: ${tone}`);

    // Active themes — threshold 1 so topics from turn 1 appear in turn 2 prompts
    const activeTopics = memoryState.topics
        .filter(t => t.occurrences >= 1)
        .sort((a, b) => b.occurrences - a.occurrences)
        .slice(0, 5);

    // Context anchor instruction — when we know the active topic(s), tell the
    // model to open by referencing that specific situation, not a generic opener.
    if (activeTopics.length > 0) {
        const topicList = activeTopics.map(t => t.topic).join(', ');
        parts.push(`Active Themes: ${topicList}`);
        parts.push(
            `CONTEXT ANCHOR: The user has been discussing: ${topicList}. ` +
            `Open your response by grounding it in this specific context — ` +
            `e.g. "Exam pressure can build up quickly..." rather than a generic opener.`
        );
    }

    // If current message is very short (e.g. "any advice?"), inject last user message
    // as prior context so LLM understands what the user is referring to
    const isVagueFollowUp = userMessage.trim().split(/\s+/).length <= 5;
    if (isVagueFollowUp && memoryState.messages.length > 0) {
        const lastUserMsg = [...memoryState.messages]
            .reverse()
            .find(m => m.role === 'user');
        if (lastUserMsg) {
            parts.push(`Prior context: "${lastUserMsg.content.slice(0, 120)}"`);
        }
    }

    parts.push('');

    // 7. User message
    parts.push(`USER MESSAGE:\n${userMessage}`);
    parts.push('');

    // 8. Final instruction
    parts.push('Respond now.');

    return parts.join('\n');
}
