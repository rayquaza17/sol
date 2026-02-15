import { NextResponse } from 'next/server';
import { processMessage, detectIntentAdvanced } from '@/lib/ai/engine/processor';
import { ResponseContext, ConversationState } from '@/lib/ai/engine/types';
import { createInitialState } from '@/lib/ai/engine/state-manager';
import { detectCrisis, buildCrisisResponse } from '@/utils/detectCrisis';

const PRESENTATION_MODE = true;

// In-memory state store (clears on server restart)
const stateStore = new Map<string, ConversationState>();

/**
 * Extracts a meaningful keyword from a user message.
 * Pure function: No external dependencies.
 */
function extractKeyword(message: string): string {
    const commonTopics = [
        'exam', 'test', 'stress', 'work', 'job', 'family', 'friend', 'relationship',
        'anxiety', 'pressure', 'tired', 'overwhelmed', 'depressed', 'sad', 'angry',
        'lonely', 'scared', 'worried', 'nervous', 'exhausted'
    ];
    const words = message.toLowerCase().split(/\s+/);
    for (const word of words) {
        for (const topic of commonTopics) {
            if (word.includes(topic)) return topic;
        }
    }
    return "that";
}

/**
 * Builds a simple presentation reply based on intent.
 * Pure function: No imports, no engine calls, no therapeutic language.
 */
function buildPresentationReply(message: string, intent: string): string {
    const topic = extractKeyword(message) || "that";
    const cleanTopic = topic.toLowerCase();

    // --- Greeting ---
    if (intent === "greeting") {
        const openings = [
            "Hey 🙂 You don't have to rush — we can just start wherever feels easiest.",
            "Hi… I'm here with you. What's been lingering in your mind lately?",
            "Hey there 🌙 Take your time — what feels worth sharing right now?",
            "Hello 🙂 This space is yours. Where would you like to begin?"
        ];

        return openings[Math.floor(Math.random() * openings.length)];
    }

    // --- Advice ---
    if (intent === "advice") {
        return `Yeah… ${cleanTopic} can feel heavy sometimes. Maybe try starting with one small step instead of everything at once.`;
    }

    // --- Vent ---
    if (intent === "vent") {
        return `That sounds like a lot to carry lately — especially with ${cleanTopic} in the mix. I'm here with you.`;
    }

    // --- Neutral / fallback with Topic Echo ---
    return `I hear you… ${cleanTopic} seems to be sitting in the background here. Tell me a little more about it.`;
}


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, mode, mood, sessionId = 'default' } = body;
        const lastMessage = messages[messages.length - 1]?.content || "";

        // --- CRISIS DETECTION LAYER ---
        if (detectCrisis(lastMessage)) {
            const crisisReply = buildCrisisResponse();
            return NextResponse.json({
                content: crisisReply,
                reply: crisisReply,
                isCrisis: true
            });
        }

        // --- PRESENTATION MODE BYPASS ---
        if (PRESENTATION_MODE) {
            const intentMatch = detectIntentAdvanced(lastMessage);
            let normalizedIntent =
                (intentMatch?.actionType || "neutral").toLowerCase();

            // --- Lightweight Presentation Intent Fix ---
            const lowerMsg = lastMessage.trim().toLowerCase();

            if (["hi", "hello", "hey", "yo", "sup"].includes(lowerMsg)) {
                normalizedIntent = "greeting";
            }

            if (lowerMsg.includes("advice") || lowerMsg.includes("suggest")) {
                normalizedIntent = "advice";
            }

            if (lowerMsg.includes("stress") || lowerMsg.includes("tired") || lowerMsg.includes("overwhelmed")) {
                normalizedIntent = "vent";
            }

            const simpleReply = buildPresentationReply(lastMessage, normalizedIntent);
            const delay = Math.min(900, Math.max(350, simpleReply.length * 8));
            await new Promise(resolve => setTimeout(resolve, delay));

            return NextResponse.json({
                content: simpleReply,
                reply: simpleReply,
                intent: intentMatch
            });
        }

        // Retrieve or initialize state
        let currentState = stateStore.get(sessionId);
        if (!currentState) {
            currentState = createInitialState(mode);
        }

        const context: ResponseContext = {
            message: lastMessage,
            mode,
            mood,
            history: messages,
            state: currentState
        };

        const result = await processMessage(context);

        // Persist updated state
        stateStore.set(sessionId, result.state);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Local Engine Error:', error);
        return NextResponse.json(
            { content: "I'm having a little trouble finding my words right now. I'm still here with you, though.", isCrisis: false },
            { status: 500 }
        );
    }
}


