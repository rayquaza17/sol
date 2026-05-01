import { NextResponse } from 'next/server';
import { ConversationEngine, createInitialState } from '@/lib/ai/engine/engine';
import { validateOutput } from '@/lib/outputGuard';
import { ConversationState } from '@/lib/ai/engine/types';
import { detectIntensity } from '@/lib/ai/engine/state';
import { StageTracker } from '@/lib/ai/engine/stage-tracker';
import { constructPrompt } from '@/lib/promptConstructor';
import { generateFallbackResponse } from '@/lib/fallbackResponder';

// ─── In-Memory Session Store ──────────────────────────────────────────────────
const sessionStore = new Map<string, ConversationState>();

// ─── Ollama Availability Check ────────────────────────────────────────────────
//
// Pings the Ollama API root. If it responds, Ollama is available.
// Cached for 30 seconds to avoid hammering on every request.
//
let ollamaAvailableCache: { available: boolean; checkedAt: number } | null = null;
const OLLAMA_CHECK_TTL_MS = 30_000; // 30 seconds

async function isOllamaAvailable(): Promise<boolean> {
    const now = Date.now();
    if (ollamaAvailableCache && now - ollamaAvailableCache.checkedAt < OLLAMA_CHECK_TTL_MS) {
        return ollamaAvailableCache.available;
    }

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout
        const res = await fetch('http://localhost:11434/api/tags', {
            method: 'GET',
            signal: controller.signal,
        });
        clearTimeout(timeout);
        const available = res.ok;
        ollamaAvailableCache = { available, checkedAt: now };
        return available;
    } catch {
        ollamaAvailableCache = { available: false, checkedAt: now };
        return false;
    }
}

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


        // ── Step 3: Call Ollama OR use fallback ──────────────────────────────
        let generatedText: string;

        const ollamaReady = await isOllamaAvailable();

        if (ollamaReady) {
            // ── Ollama IS available — use the real LLM ──────────────────────
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
                // Ollama was detected but failed mid-request — use fallback
                console.warn('[Chat API] Ollama detected but generate failed — using fallback');
                ollamaAvailableCache = null; // invalidate cache
                generatedText = generateFallbackResponse({
                    intent: engineResult.intent,
                    stage,
                    intensity,
                    memory: currentState.memory,
                    isCrisis: engineResult.isCrisis,
                });
            }
        } else {
            // ── Ollama NOT available — use pre-authored fallback responses ───
            console.info('[Chat API] Ollama not available — using fallback responder');
            generatedText = generateFallbackResponse({
                intent: engineResult.intent,
                stage,
                intensity,
                memory: currentState.memory,
                isCrisis: engineResult.isCrisis,
            });
        }

        // ── Step 4: Output Guard ──────────────────────────────────────────────
        const lastResponse = currentState.memory.recentResponses.at(-1);
        const recentResponses = currentState.memory.recentResponses.slice(-3);
        const finalContent = validateOutput(generatedText, lastResponse, recentResponses);

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
