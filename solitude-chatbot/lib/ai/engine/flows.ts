import { GuidedFlow } from './types';

export const REFLECTION_FLOWS: Record<string, GuidedFlow> = {
    'SITUATION_REFLECT': {
        id: 'SITUATION_REFLECT',
        name: 'Gentle Situation Reflection',
        steps: [
            { question: "I'm here to listen. What happened that's on your mind right now?" },
            { question: "I hear you. How did that situation make you feel in the moment?" },
            { question: "That's completely valid. Reflecting on it now, what do you wish was different?" },
            { question: "Thank you for sharing that with me. What's one small thing you can do for yourself today to find a bit of peace?" }
        ]
    },
    'DAILY_CHECK': {
        id: 'DAILY_CHECK',
        name: 'Daily Emotional Pulse',
        steps: [
            { question: "How would you describe the 'weather' of your internal world today?" },
            { question: "What's one thing, no matter how small, that felt okay today?" },
            { question: "And what's one thing you're ready to let go of before you sleep?" }
        ]
    }
};

export function getFlow(id: string): GuidedFlow | undefined {
    return REFLECTION_FLOWS[id];
}
