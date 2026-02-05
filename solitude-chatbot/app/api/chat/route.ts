import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/ai/engine/processor';
import { ResponseContext, ConversationState } from '@/lib/ai/engine/types';
import { createInitialState } from '@/lib/ai/engine/state-manager';

// In-memory state store (clears on server restart)
const stateStore = new Map<string, ConversationState>();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { messages, mode, mood, sessionId = 'default' } = body;

        const lastMessage = messages[messages.length - 1]?.content || "";

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
