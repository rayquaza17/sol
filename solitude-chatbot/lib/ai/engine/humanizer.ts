import {
    ResponseType,
    ResponseDepth,
    UserEnergyLevel,
    HumanizationState,
    ConversationState,
    ActionType,
    IntentMatch
} from './types';
import {
    SHORT_RESPONSES,
    CASUAL_OPENERS,
    QUIET_PRESENCE,
    HESITATIONS
} from './registry';

// ─── Constants ──────────────────────────────────────────────────────

const MAX_OPENER_HISTORY = 5;
const MAX_RESPONSE_TYPE_HISTORY = 3;
const MAX_DEPTH_HISTORY = 3;
const MAX_SHORT_PRESENCE_RATIO = 0.25; // Max 1 out of 4 responses can be SHORT_PRESENCE

// Ultra-minimal banned phrases (cannot appear standalone)
const BANNED_STANDALONE_PHRASES = new Set([
    'yeah', 'real', 'ok', 'okay', 'makes sense', 'got it', 'right', 'mm', 'hmm',
    'fair enough', 'that tracks', 'cool', 'sure', 'alright', 'i see', 'understood'
]);

// ─── User Energy Detection ──────────────────────────────────────────

export function detectUserEnergy(message: string, actionType: ActionType): UserEnergyLevel {
    const msg = message.toLowerCase();
    const length = message.length;

    // Casual indicators
    const casualMarkers = ['lol', 'haha', 'yeah', 'nah', 'idk', 'tbh', 'btw', 'sup', 'hey'];
    const hasCasualMarkers = casualMarkers.some(marker => msg.includes(marker));
    const isShort = length < 50;
    const hasMinimalPunctuation = (message.match(/[.!?]/g) || []).length <= 1;

    if (hasCasualMarkers || (isShort && hasMinimalPunctuation)) {
        return 'casual';
    }

    // Intense indicators
    const intenseMarkers = ['!!!', '...', 'always', 'never', 'can\'t', 'hate', 'exhausted', 'overwhelmed'];
    const hasIntenseMarkers = intenseMarkers.some(marker => msg.includes(marker));
    const hasMultipleExclamations = (message.match(/!/g) || []).length > 2;
    const isLong = length > 200;
    const hasEmotionalWords = /\b(stressed|anxious|sad|angry|lonely|scared|tired|hurt)\b/i.test(msg);

    if (hasIntenseMarkers || hasMultipleExclamations || (isLong && hasEmotionalWords)) {
        return 'intense';
    }

    return 'neutral';
}

// ─── Response Depth Selection ──────────────────────────────────────

export function selectResponseDepth(
    state: HumanizationState,
    userMessage: string,
    actionType: ActionType,
    userEnergy: UserEnergyLevel,
    turnCount: number
): ResponseDepth {
    const { lastResponseDepths, consecutiveShortCount, totalResponses } = state;
    const messageWordCount = userMessage.trim().split(/\s+/).length;

    // Calculate SHORT_PRESENCE ratio
    const shortPresenceCount = lastResponseDepths.filter(d => d === 'SHORT_PRESENCE').length;
    const shortPresenceRatio = totalResponses > 0 ? shortPresenceCount / totalResponses : 0;

    // RULE 1: Ban consecutive SHORT_PRESENCE responses
    const lastDepth = lastResponseDepths[lastResponseDepths.length - 1];
    if (lastDepth === 'SHORT_PRESENCE') {
        // Force REFLECTIVE_ENGAGEMENT or SUPPORTIVE_EXPANSION
        return actionType === 'ADVICE' ? 'SUPPORTIVE_EXPANSION' : 'REFLECTIVE_ENGAGEMENT';
    }

    // RULE 2: If 2+ short replies recently, force SUPPORTIVE_EXPANSION
    if (consecutiveShortCount >= 2) {
        return 'SUPPORTIVE_EXPANSION';
    }

    // RULE 3: Enforce max SHORT_PRESENCE ratio (1 out of 4)
    if (shortPresenceRatio >= MAX_SHORT_PRESENCE_RATIO && totalResponses >= 4) {
        return actionType === 'ADVICE' ? 'SUPPORTIVE_EXPANSION' : 'REFLECTIVE_ENGAGEMENT';
    }

    // RULE 4: User message length < 5 words → SHORT_PRESENCE or REFLECTIVE_ENGAGEMENT
    if (messageWordCount < 5) {
        // Allow SHORT_PRESENCE only if ratio permits and not consecutive
        if (shortPresenceRatio < MAX_SHORT_PRESENCE_RATIO) {
            return Math.random() < 0.4 ? 'SHORT_PRESENCE' : 'REFLECTIVE_ENGAGEMENT';
        }
        return 'REFLECTIVE_ENGAGEMENT';
    }

    // RULE 5: User asks for advice → SUPPORTIVE_EXPANSION
    if (actionType === 'ADVICE') {
        return 'SUPPORTIVE_EXPANSION';
    }

    // RULE 6: User expresses emotion → REFLECTIVE_ENGAGEMENT (default)
    if (actionType === 'VENT' || userEnergy === 'intense') {
        return 'REFLECTIVE_ENGAGEMENT';
    }

    // RULE 7: Early turns (1-2) → prefer REFLECTIVE_ENGAGEMENT
    if (turnCount <= 2) {
        return 'REFLECTIVE_ENGAGEMENT';
    }

    // DEFAULT: REFLECTIVE_ENGAGEMENT (most common)
    return 'REFLECTIVE_ENGAGEMENT';
}

// ─── Context Mirroring ──────────────────────────────────────────────

export function extractUserKeywords(message: string): string[] {
    const msg = message.toLowerCase();

    // Common words to filter out
    const stopWords = new Set([
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
        'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
        'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
        'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are',
        'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does',
        'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
        'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into',
        'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
        'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
        'there', 'when', 'where', 'why', 'how', 'all', 'both', 'each', 'few', 'more', 'most',
        'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than',
        'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'feel',
        'feeling', 'like', 'really', 'get', 'getting', 'got'
    ]);

    // Extract words (3+ characters, not stop words)
    const words = msg
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 3 && !stopWords.has(word));

    // Prioritize nouns and meaningful words (simple heuristic)
    const priorityWords = words.filter(word =>
        /^(exam|test|work|family|friend|relationship|job|school|college|stress|anxiety|depression|parent|sibling|deadline|project|assignment|boss|teacher|breakup|future|career|money|health)/.test(word)
    );

    // Return top 1-2 keywords
    const keywords = priorityWords.length > 0 ? priorityWords : words;
    return keywords.slice(0, 2);
}

// ─── Tone Calibration ───────────────────────────────────────────────

export function calibrateTone(
    response: string,
    userEnergy: UserEnergyLevel,
    messageLength: number
): string {
    // If user writes casually, reduce poetic language
    if (userEnergy === 'casual') {
        // Replace poetic phrases with simpler ones
        response = response
            .replace(/There's a kind of strength in/g, 'It takes strength to')
            .replace(/The world feels a little grey/g, 'Things feel pretty grey')
            .replace(/There's a heaviness that doesn't really have a name/g, 'There\'s a heaviness there')
            .replace(/You're navigating a lot/g, 'You\'re dealing with a lot');
    }

    // If user message is short, keep response concise
    if (messageLength < 50 && response.split(' ').length > 20) {
        // Truncate to first 1-2 sentences
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 2) {
            response = sentences.slice(0, 2).join('. ') + '.';
        }
    }

    // If user is intense, slow down (add ellipses for pacing)
    if (userEnergy === 'intense' && Math.random() < 0.3) {
        // Add occasional ellipses for breathing space
        response = response.replace(/\. /g, (match) => Math.random() < 0.2 ? '... ' : match);
    }

    return response;
}

// ─── Micro-Imperfection Injection ───────────────────────────────────

export function injectMicroImperfection(response: string, turnCount: number): string {
    // Only inject occasionally (25% chance) and not in first turn
    if (turnCount <= 1 || Math.random() > 0.25) {
        return response;
    }

    const imperfectionType = Math.random();

    if (imperfectionType < 0.4) {
        // Add hesitation at start
        const hesitation = HESITATIONS[Math.floor(Math.random() * HESITATIONS.length)];
        if (!response.startsWith(hesitation)) {
            return `${hesitation} ${response.charAt(0).toLowerCase() + response.slice(1)}`;
        }
    } else if (imperfectionType < 0.7) {
        // Add ellipses for breathing space
        const sentences = response.split('. ');
        if (sentences.length > 1 && Math.random() < 0.5) {
            sentences[0] = sentences[0] + '...';
            return sentences.join(' ');
        }
    } else {
        // Add softer transition
        const softeners = [
            'I might be wrong, but ',
            'It feels like ',
            'From what I\'m hearing, ',
            'The way I see it, '
        ];
        const softener = softeners[Math.floor(Math.random() * softeners.length)];
        if (!response.toLowerCase().startsWith('i ') && !response.toLowerCase().startsWith('it ')) {
            return `${softener}${response.charAt(0).toLowerCase() + response.slice(1)}`;
        }
    }

    return response;
}

// ─── Pacing System ──────────────────────────────────────────────────

export function applyPacingRules(
    response: string,
    turnCount: number,
    messageLength: number
): string {
    // Rule 1: No deep emotional framing in first 1-2 turns
    if (turnCount <= 2) {
        // Remove heavy emotional language
        response = response
            .replace(/holding space for/g, 'here with')
            .replace(/I'm really feeling the depth of/g, 'I hear')
            .replace(/Your heart's way of saying/g, 'a sign that');
    }

    // Rule 2: Reduce intensity if user messages are short
    if (messageLength < 30) {
        // Simplify response
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        if (sentences.length > 1) {
            response = sentences[0] + '.';
        }
    }

    return response;
}

// ─── Human Consistency Validation ───────────────────────────────────

export function validateHumanConsistency(response: string): string {
    // Check for overly polished or repetitive patterns
    const problematicPatterns = [
        /I'm here for you\./g,
        /Thank you for trusting me\./g,
        /Take a deep breath\./g,
        /You're not alone\./g
    ];

    let hasProblematicPattern = false;
    for (const pattern of problematicPatterns) {
        if (pattern.test(response)) {
            hasProblematicPattern = true;
            break;
        }
    }

    // If response has problematic patterns and is long, shorten it
    if (hasProblematicPattern && response.split(' ').length > 15) {
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
        // Keep only non-problematic sentences
        const filtered = sentences.filter(s => {
            return !problematicPatterns.some(p => p.test(s));
        });

        if (filtered.length > 0) {
            return filtered.join('. ') + '.';
        }
    }

    return response;
}

// ─── Depth-Based Response Construction ─────────────────────────────

export function constructDepthResponse(
    depth: ResponseDepth,
    rawResponse: string,
    userMessage: string,
    keywords: string[],
    userEnergy: UserEnergyLevel
): string {
    // SINGLE PASS: Just use the raw response. 
    // The presentation layer will handle the final formatting/particles.
    return rawResponse || "I'm here with you.";
}

// ─── Sentence Opener Tracking ───────────────────────────────────────

export function extractSentenceOpener(response: string): string {
    // Extract first 1-3 words as opener
    const words = response.split(/\s+/);
    const opener = words.slice(0, Math.min(3, words.length)).join(' ');
    return opener.toLowerCase().replace(/[.,!?;:]/g, '');
}

export function updateHumanizationState(
    state: HumanizationState,
    response: string,
    responseType: ResponseType,
    responseDepth: ResponseDepth
): HumanizationState {
    const opener = extractSentenceOpener(response);
    const isShortForm = responseType === 'short_ack' || responseType === 'quiet_presence';
    const isShortPresence = responseDepth === 'SHORT_PRESENCE';

    // Update consecutive short count
    const newConsecutiveShortCount = isShortPresence
        ? state.consecutiveShortCount + 1
        : 0;

    return {
        lastSentenceOpeners: [
            ...state.lastSentenceOpeners.slice(-MAX_OPENER_HISTORY + 1),
            opener
        ],
        lastResponseTypes: [
            ...state.lastResponseTypes.slice(-MAX_RESPONSE_TYPE_HISTORY + 1),
            responseType
        ],
        lastResponseDepths: [
            ...state.lastResponseDepths.slice(-MAX_DEPTH_HISTORY + 1),
            responseDepth
        ],
        userEnergyLevel: state.userEnergyLevel,
        shortFormCount: state.shortFormCount + (isShortForm ? 1 : 0),
        totalResponses: state.totalResponses + 1,
        consecutiveShortCount: newConsecutiveShortCount
    };
}

// ─── Main Humanization Function ────────────────────────────────────

export function humanizeResponse(
    rawResponse: string,
    userMessage: string,
    state: ConversationState,
    intentMatch: IntentMatch
): { humanizedResponse: string; newHumanizationState: HumanizationState } {
    const turnCount = state.messageCount;
    const userEnergy = detectUserEnergy(userMessage, intentMatch.actionType);
    const keywords = extractUserKeywords(userMessage);

    // Update user energy in state
    const currentHumanState = {
        ...state.humanizationState,
        userEnergyLevel: userEnergy
    };

    // Select response depth (PRIMARY CONTROLLER)
    const responseDepth = selectResponseDepth(
        currentHumanState,
        userMessage,
        intentMatch.actionType,
        userEnergy,
        turnCount
    );

    // Select response type (for variation tracking)
    const responseType = responseDepth === 'SHORT_PRESENCE'
        ? 'short_ack'
        : responseDepth === 'SUPPORTIVE_EXPANSION'
            ? 'gentle_suggestion'
            : 'reflection';

    let finalResponse: string;

    // Construct response based on depth
    finalResponse = constructDepthResponse(
        responseDepth,
        rawResponse,
        userMessage,
        keywords,
        userEnergy
    );

    // Apply humanization layers (only for non-SHORT_PRESENCE)
    if (responseDepth !== 'SHORT_PRESENCE') {
        // 1. Tone calibration
        finalResponse = calibrateTone(finalResponse, userEnergy, userMessage.length);

        // 2. Pacing rules
        finalResponse = applyPacingRules(finalResponse, turnCount, userMessage.length);

        // 3. Micro-imperfection injection
        finalResponse = injectMicroImperfection(finalResponse, turnCount);

        // 4. Human consistency validation
        finalResponse = validateHumanConsistency(finalResponse);
    }

    // ANTI-MONOTONY VALIDATION: Ensure response has substance
    const normalized = finalResponse.toLowerCase().replace(/[.!?,]/g, '').trim();
    if (BANNED_STANDALONE_PHRASES.has(normalized)) {
        // This should not happen due to depth construction, but failsafe
        finalResponse = `${finalResponse} I'm here with you.`;
    }

    // Update humanization state
    const newHumanizationState = updateHumanizationState(
        currentHumanState,
        finalResponse,
        responseType,
        responseDepth
    );

    return {
        humanizedResponse: finalResponse,
        newHumanizationState
    };
}
