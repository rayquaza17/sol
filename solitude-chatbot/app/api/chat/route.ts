import { NextResponse } from 'next/server';
import { processMessage, createInitialState } from '@/lib/ai/engine/engine';
import { ConversationState } from '@/lib/ai/engine/types';

// ─── In-Memory Session Store ──────────────────────────────────────────────────
// Keyed by sessionId. Clears on server restart.
const sessionStore = new Map<string, ConversationState>();

// ─── POST /api/chat ───────────────────────────────────────────────────────────

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, mood, sessionId = 'default' } = body;

        const lastMessage: string = messages?.[messages.length - 1]?.content || '';
        if (!lastMessage.trim()) {
            return NextResponse.json(
                { content: "I'm here — feel free to share whatever's on your mind.", isCrisis: false },
                { status: 200 }
            );
        }

        // Retrieve or create session state
        const currentState = sessionStore.get(sessionId) ?? createInitialState();

        // Process the message through the conversation engine
        const result = processMessage({
            message: lastMessage,
            mood,
            history: messages,
            state: currentState
        });

        // Persist updated state
        sessionStore.set(sessionId, result.state);

        return NextResponse.json({
            content: result.content,
            reply: result.content,
            intent: result.intent,
            isCrisis: result.isCrisis
        });

    } catch (error) {
        console.error('[Chat API Error]', error);
        return NextResponse.json(
            { content: "I'm having a little trouble right now — but I'm still here with you.", isCrisis: false },
            { status: 500 }
        );
    }
}
