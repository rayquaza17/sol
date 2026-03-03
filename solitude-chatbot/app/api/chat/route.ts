import { NextResponse } from 'next/server';
import { ConversationEngine, createInitialState } from '@/lib/ai/engine/engine';
import { validateOutput } from '@/lib/outputGuard';
import { ConversationState } from '@/lib/ai/engine/types';
import { detectIntensity } from '@/lib/ai/engine/state';
import { StageTracker } from '@/lib/ai/engine/stage-tracker';
import { constructPrompt } from '@/lib/promptConstructor';

// ─── In-Memory Session Store ──────────────────────────────────────────────────
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

        // ── Step 1: Intent, CrisisMonitor, DomainGuard, MemoryBuilder ─────────
        const engineResult = ConversationEngine.process(lastMessage, currentState);

        // ── Level 3 Crisis: bypass Ollama entirely ────────────────────────────
        if (engineResult.crisisLevel === 3 && engineResult.crisisResponse) {
            const intensity = detectIntensity(lastMessage);
            const stage = StageTracker.determineStage(currentState.memory);
            const updatedState = ConversationEngine.updateMemory(
                currentState,
                lastMessage,
                engineResult.crisisResponse,
                engineResult.intent,
                intensity,
                stage,
            );
            sessionStore.set(sessionId, updatedState);
            return NextResponse.json({
                content: engineResult.crisisResponse,
                reply: engineResult.crisisResponse,
                intent: engineResult.intent,
                isCrisis: true,
            });
        }

        // ── Out-of-scope: bypass Ollama with deterministic boundary response ──
        if (engineResult.isOutOfScope && engineResult.outOfScopeResponse) {
            // Persist lastIntent='out_of_scope' so next turn can detect repeat
            sessionStore.set(sessionId, engineResult.state);
            return NextResponse.json({
                content: engineResult.outOfScopeResponse,
                reply: engineResult.outOfScopeResponse,
                intent: engineResult.intent,
                isCrisis: false,
            });
        }

        // ── Step 2: Build structured prompt ──────────────────────────────────
        const intensity = detectIntensity(lastMessage);
        const stage = StageTracker.determineStage(currentState.memory);
        const constructedPrompt = constructPrompt({
            userMessage: lastMessage,
            intent: engineResult.intent,
            memoryState: currentState.memory,
            stage,
            intensity,
            isCrisis: engineResult.isCrisis,
        });


        // ── Step 3: Call Ollama ───────────────────────────────────────────────
        let generatedText: string;
        try {
            const ollamaRes = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'llama3',
                    prompt: constructedPrompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                    },
                }),
            });

            if (!ollamaRes.ok) {
                throw new Error(`Ollama returned status ${ollamaRes.status}`);
            }

            const data = await ollamaRes.json();
            generatedText = data.response ?? '';
        } catch {
            return NextResponse.json(
                { content: 'Local language model is not running. Please start Ollama.', isCrisis: false },
                { status: 200 }
            );
        }

        // ── Step 4: Output Guard ──────────────────────────────────────────────
        const lastResponse = currentState.memory.recentResponses.at(-1);
        const finalContent = validateOutput(generatedText, lastResponse);

        // ── Step 5: Update memory ─────────────────────────────────────────────
        const updatedState = ConversationEngine.updateMemory(
            currentState,
            lastMessage,
            finalContent,
            engineResult.intent,
            intensity,
            stage,
        );

        sessionStore.set(sessionId, updatedState);

        // ── Step 6: Return response ───────────────────────────────────────────
        return NextResponse.json({
            content: finalContent,
            reply: finalContent,
            intent: engineResult.intent,
            isCrisis: engineResult.isCrisis,
        });

    } catch (error) {
        console.error('[Chat API Error]', error);
        return NextResponse.json(
            { content: "I'm having a little trouble right now — but I'm still here with you.", isCrisis: false },
            { status: 500 }
        );
    }
}
