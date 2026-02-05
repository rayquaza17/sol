import { ConversationMode, MoodLevel } from './service';

export interface LocalResponse {
    content: string;
    isCrisis: boolean;
}

const RESPONSE_POOLS = {
    anxiety: [
        "I can sense you're feeling a bit anxious. Let's try to find our center together. Would you like to try the 5-4-3-2-1 grounding technique? Focus on 5 things you can see right now...",
        "Anxiety can feel like a storm, but you are the mountain beneath it. Take a slow breath with me. What's one small thing you can control in this moment?",
        "It's okay to feel this way. Anxiety is just your body trying to protect you, even if it's overreacting. Let's just sit with this feeling for a moment without trying to change it."
    ],
    stress: [
        "Everything seems to be moving so fast, doesn't it? Let's take a pause. Try box breathing: inhale for 4, hold for 4, exhale for 4, hold for 4. How does that feel?",
        "You've been carrying a lot lately. It's okay to put the weight down for a few minutes. What would 'rest' look like for you in this very moment?",
        "Stress is often a sign that we're trying to do too much. Is there one thing on your list we can mentally set aside for tomorrow?"
    ],
    depression: [
        "I hear the heaviness in your words, and I want you to know I'm sitting here with you. You don't have to 'fix' anything right now. Just being is enough.",
        "When things feel grey, even small steps are victories. I'm proud of you for reaching out today. What's one small thing that felt slightly okay today?",
        "Validation is the first step to healing. Your feelings are real, and they are valid. I'm here to listen as long as you need."
    ],
    sleep: [
        "Quiet moments at night can be the loudest. Try focusing on the weight of your body against the bed. Relax your jaw, then your shoulders...",
        "The day is over, and you've done enough. Whatever didn't get done can wait for the sun. Would you like to try a gentle visualization to help you drift off?",
        "Sleep can be elusive when the mind is busy. Let's try to label your thoughts as 'clouds' and watch them drift past without following them."
    ],
    loneliness: [
        "I'm here, and I'm listening. Even in silence, you aren't alone in this space. Tell me more about what's been on your heart.",
        "Loneliness can be a heavy companion. I'm grateful you shared this with me. What is one memory of connection that brings a little warmth to you?",
        "Connection starts with being kind to yourself. You are a person worthy of presence and time. I am holding space for you."
    ],
    general: [
        "I'm listening. Tell me more about that.",
        "Thank you for sharing that with me. It sounds like you've been reflecting deeply.",
        "I'm here in this quiet space with you. Whatever you're feeling right now is completely okay.",
        "That sounds like a meaningful reflection. How does it feel to put those thoughts into words?",
        "I appreciate your honesty. This is a safe space for everything you're carrying."
    ]
};

const KEYWORDS = {
    anxiety: ['anxious', 'anxiety', 'panic', 'worried', 'worry', 'scared', 'fear', 'heart racing', 'overwhelmed'],
    stress: ['stressed', 'stress', 'busy', 'too much', 'work', 'pressure', 'exhausted', 'tired'],
    depression: ['sad', 'depressed', 'depression', 'heavy', 'hopeless', 'empty', 'crying', 'numb'],
    sleep: ['sleep', 'insomnia', 'awake', 'night', 'tired', 'dream', 'exhausted'],
    loneliness: ['lonely', 'loneliness', 'alone', 'no one', 'ignored', 'isolated']
};

export function getLocalResponse(message: string, mode: ConversationMode, mood: MoodLevel): string {
    const msg = message.toLowerCase();

    // 1. Check for specific categories
    for (const [category, words] of Object.entries(KEYWORDS)) {
        if (words.some(word => msg.includes(word))) {
            const pool = RESPONSE_POOLS[category as keyof typeof RESPONSE_POOLS];
            return pool[Math.floor(Math.random() * pool.length)];
        }
    }

    // 2. Fallback to general responses or mode-specific prompts
    const generalPool = RESPONSE_POOLS.general;
    return generalPool[Math.floor(Math.random() * generalPool.length)];
}
