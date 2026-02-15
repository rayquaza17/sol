import { IntentType, FactType } from './types';

// ─── Response Policy ────────────────────────────────────────────────
//
//  Structure:  Presence (Acknowledge/Reflect) → Gentle Continuation → Question (optional)
//  Tone:       Poetic, simple, grounded. Calm companion role.
//  Rules:      1 in 3 Stillness responses. Max 1 question. No consecutive questions.
//
// ─────────────────────────────────────────────────────────────────────

// Step 1: Presence. Must anchor to the latest user message.
export const ACKNOWLEDGEMENTS = {
    DEFAULT: [
        "I hear you. I'm just sitting with what you said about {{topic}} for a second.",
        "Mm... {{topic}} feels like a lot to carry right now.",
        "I'm here. No rush to move past this {{topic}}.",
        "I'm listening. Truly. Especially when you talk about {{topic}}.",
        "That makes a lot of sense, hearing you describe {{topic}}.",
        "I'm right here with you, holding this part about {{topic}}."
    ],
    HIGH_INTENSITY: [
        "That sounds incredibly heavy. I'm holding space for all of it, especially the {{topic}}.",
        "I hear the pain in what you shared about {{topic}}. We don't have to fix it right this second.",
        "I'm staying right here. You don't have to carry this {{topic}} alone.",
        "Hmm... I'm really feeling the depth of what you're going through with {{topic}}."
    ]
};

// ─── Anchoring Templates ──────────────────────────────────────────
// Used when we need a direct, non-cliché acknowledgement of the SUBJECT.
export const ANCHORING_TEMPLATES = {
    ADVICE_REQUEST: [
        "You're looking for some ways to handle {{topic}}.",
        "I hear that you're asking for some perspective on {{topic}}.",
        "Handling {{topic}} is a big task. I can definitely share some thoughts on that."
    ],
    VENTING: [
        "It sounds like you just need to get the {{topic}} out of your system for a moment.",
        "I'm just listening to everything you're saying about {{topic}}.",
        "You're carrying a lot regarding {{topic}}, and it's okay to just let it exist here.",
        "I hear you on the {{topic}} part. I'm just sitting with that.",
        "There's a lot to untangle with {{topic}}, isn't there?",
        "I'm keeping you company while you find your words for this {{topic}}."
    ]
};

// ─── Stillness Responses ───────────────────────────────────────────
// Messages that simply acknowledge without pushing forward.
export const STILLNESS_RESPONSES = [
    "I'm here with you.",
    "That sounds like a lot to hold.",
    "I'm just listening.",
    "I hear that.",
    "I'm sitting here with you. No pressure to say more.",
    "That's real. I'm just letting that sink in.",
    "I'm just staying present with you."
];

// ─── Short-Form Responses ──────────────────────────────────────────
// Brief but warm acknowledgments that show genuine care and presence
export const SHORT_RESPONSES = [
    "I hear you. That sounds really hard.",
    "I'm here with you.",
    "That sounds really challenging.",
    "I can feel the weight of that.",
    "You're carrying a lot right now.",
    "I'm right here, listening.",
    "That must feel overwhelming.",
    "I can sense how much this matters.",
    "That takes a lot of strength.",
    "I'm holding space for you.",
    "That sounds incredibly tough.",
    "I can hear how hard this is.",
    "You're not alone in this.",
    "I'm staying right here with you.",
    "That must be really difficult.",
    "I can feel that with you.",
    "That sounds like a lot to carry.",
    "I'm here, and I'm listening.",
    "That makes complete sense.",
    "I can hear the weight in that."
];

// ─── Casual Openers ─────────────────────────────────────────────────
// Warm, empathetic sentence starters that show attentiveness
export const CASUAL_OPENERS = [
    "I can hear that...",
    "It sounds like...",
    "I'm sensing that...",
    "What I'm hearing is...",
    "That feels like...",
    "From what you're sharing...",
    "I'm picking up that...",
    "It seems like...",
    "The way you describe it...",
    "I can feel that...",
    "What's coming through is...",
    "I'm understanding that...",
    "It feels like you're...",
    "I'm hearing that...",
    "There's a sense that..."
];

// ─── Quiet Presence ─────────────────────────────────────────────────
// Minimal but warm responses that show attentive presence
export const QUIET_PRESENCE = [
    "I'm here.",
    "I'm listening.",
    "I'm with you.",
    "Take all the time you need.",
    "I'm not going anywhere.",
    "I'm staying right here.",
    "I hear you.",
    "I'm here, just listening.",
    "I'm right here with you.",
    "Take your time.",
    "I'm present with you."
];

// ─── Reflections ────────────────────────────────────────────────────
// Step 1 variation: Paraphrase or show understanding.
export const REFLECTIONS: Record<IntentType, string[]> = {
    VENT: [
        "It feels like everything is piling up and there's nowhere to just... be.",
        "You've been holding it all together for so long, and it's exhausting.",
        "The noise of it all just won't stop, will it?",
        "It's like you're carrying a mountain and everyone's just watching.",
        "Everything's hitting at once. It's understandable that it feels like too much."
    ],
    ANXIETY: [
        "There's this hum of 'what if' that's making everything feel fragile.",
        "Your mind is already three miles down the road, isn't it?",
        "It's like your body is bracing for a storm that hasn't even arrived yet.",
        "The uncertainty... it has a way of making the ground feel unsteady.",
        "I can feel that tightness. Like you're waiting for the other shoe to drop."
    ],
    SADNESS: [
        "The world feels a little grey and quiet right now, doesn't it?",
        "There's a heaviness that doesn't really have a name, but it's there.",
        "It's like you're moving through water... everything takes so much effort.",
        "Some days just carry a deeper ache than others.",
        "I hear the quietness in your heart today."
    ],
    ANGER: [
        "Something feels fundamentally unfair, and it burns.",
        "You've hit a wall, and you're tired of being the one who has to move.",
        "There's a sharpness to this frustration that's hard to ignore.",
        "You've been patient, and now that patience is just... gone.",
        "It hurts when things aren't handled with the care they deserve."
    ],
    LONELINESS: [
        "The distance between you and everyone else feels wider today.",
        "Even with people around, that feeling of being unknown is still there.",
        "It's a specific kind of quiet when you're waiting for someone to truly see you.",
        "You're looking for a connection that actually reaches you.",
        "Being alone is one thing... feeling lonely is something much heavier."
    ],
    CONFUSION: [
        "The pieces aren't clicking together, and it's frustrating to be in the dark.",
        "Every path looks a bit foggy from here, doesn't it?",
        "You're turning it over and over, trying to find the edge of it.",
        "It's hard when you just want one clear answer and there are none.",
        "You're in that messy middle part where nothing is certain yet."
    ],
    REFLECTION: [
        "You're starting to see the shape of things in a different way.",
        "There's a quiet realization happening underneath the surface.",
        "You're noticing the patterns, even the ones that are hard to look at.",
        "This feels like one of those moments where things start to shift.",
        "You're looking at this with a lot of honesty right now."
    ],
    GROUNDING: [
        "Your mind is racing, but we can just focus on the floor beneath you.",
        "Everything is moving fast. Let's just try to find one steady thing.",
        "The air in the room, the weight of your hands... let's stay here.",
        "There's no rush to fix the big things. Just this one breath is enough.",
        "The world outside is loud, but this space can be quiet."
    ],
    CRISIS: [
        "You're in a very dark place. I'm not going to look away.",
        "This level of pain... it's overwhelming. I hear how much you're hurting.",
        "I'm staying right here with you in this darkness."
    ],
    GREETING: [
        "Hi... I'm here. No rush for anything deep.",
        "Hey. It's good to see you. We can just sit here a bit.",
        "Hi. Wherever you are today is a fine place to start."
    ],
    SMALL_TALK: [
        "I'm here."
    ],
    FACTUAL: [
        "I hear you."
    ],
    JOKE: [
        "I hear you."
    ],
    UNCLEAR: [
        "I'm here."
    ],
    GENERAL: [
        "I can tell those thoughts are weighing on you.",
        "There's something important in the way you're seeing this.",
        "I'm just listening to the space between your words too."
    ]
};

// ─── Insights ───────────────────────────────────────────────────────
// Step 2: Gentle continuation. Supportive, non-clinical.
export const INSIGHTS: Record<IntentType, string[]> = {
    VENT: [
        "Sometimes... we just need to let the pressure out without having a plan.",
        "You don't have to perform 'okay' here. You can just be tired.",
        "It's okay to let things stay messy for a while.",
        "You've carried enough for a dozen people today.",
        "Rest isn't something you earn... it's just something you need."
    ],
    ANXIETY: [
        "That loud voice in your head... it's just trying to protect you, in its own messy way.",
        "We don't have to solve tomorrow's problems in this room.",
        "It's okay if the only thing you do right now is breathe.",
        "Uncertainty is a heavy thing to hold, but you don't have to hold it perfectly.",
        "Sometimes staying still is the bravest thing you can do."
    ],
    SADNESS: [
        "Sadness is just another way of being honest about what matters to us.",
        "You're allowed to just be in this grey space for as long as it takes.",
        "The heaviness is here, but it doesn't have to be the whole story.",
        "There's a kind of strength in just letting yourself feel this.",
        "Be gentle with yourself. You're navigating a lot."
    ],
    ANGER: [
        "Your anger is just your heart's way of saying it deserves better.",
        "It's okay to let that fire burn for a bit. You don't have to douse it yet.",
        "You're not being difficult. You're being human.",
        "Naming the hurt underneath the anger... that's the real work.",
        "Limits are important. I'm glad you're finding yours."
    ],
    LONELINESS: [
        "Wanting to be seen is one of the most natural things in the world.",
        "You're worth being known... even in the quiet moments like this.",
        "Loneliness is just a signal that your heart is still looking for its people.",
        "I'm here, and I'm really listening. You're not invisible here.",
        "It's okay to admit that the silence is hard sometimes."
    ],
    CONFUSION: [
        "The answer doesn't have to arrive all at once. It usually leaks in slowly.",
        "Not knowing is just the middle part of the story.",
        "You can trust your gut to find the thread eventually.",
        "Complexity takes time to untangle. There's no deadline here.",
        "Sometimes 'I don't know' is the most honest thing we can say."
    ],
    REFLECTION: [
        "That kind of noticing... it changes the shape of the room, doesn't it?",
        "You're doing the quiet work of understanding yourself.",
        "These thoughts are like seeds. We can just let them sit for a bit.",
        "Understanding isn't a destination... it's just a way of walking.",
        "I'm glad you're paying attention to those quieter parts."
    ],
    GROUNDING: [
        "The floor is solid. The air is here. You are here.",
        "Your body knows how to find its way back to center.",
        "One small thing at a time... that's all we're doing.",
        "There's no emergency in this very second.",
        "Let's just stay in this moment for a heartbeat longer."
    ],
    CRISIS: [
        "You matter to me. Your voice matters. Please stay with me.",
        "This pain is a storm, but it's not the sky. It will shift eventually.",
        "You don't have to carry this darkness alone. Please reach out to AASRA at 91-9820466726."
    ],
    GREETING: [
        "No pressure to have it figured out. We can just start wherever.",
        "I'm here if you want to talk, or just to sit in the quiet.",
        "Take a breath. This space is yours."
    ],
    SMALL_TALK: [
        "It's good to just connect for a bit.",
        "I'm just here, keeping you company."
    ],
    FACTUAL: [
        "I might not have all the facts, but I'm here for the feeling of things.",
        "I'm better with emotions than data, honestly."
    ],
    JOKE: [
        "It's nice to have a moment of lightness.",
        "I appreciate the humor. It's a way to breathe sometimes."
    ],
    UNCLEAR: [
        "I'm not sure I caught that, but I'm still here with you.",
        "Could you say a bit more? I want to make sure I'm following."
    ],
    GENERAL: [
        "There's a truth in what you're saying that feels important.",
        "I'm just sitting with the meaning of that for a moment.",
        "It's interesting how those things connect when we slow down."
    ]
};

// ─── Advice Strategies ──────────────────────────────────────────────
// Step 2 variation: When ActionType is ADVICE. Specific and short.
export const ADVICE_STRATEGIES: Record<string, string[]> = {
    ANXIETY: [
        "Try focusing only on the next ten minutes. Don't look past that.",
        "Name three things you can touch right now. It helps ground the body.",
        "Try the 4-7-8 breath once. In for 4, hold for 7, out for 8."
    ],
    VENT: [
        "Maybe just let the thoughts exist without trying to fix them today.",
        "It can help to step away from the screen/situation for five minutes."
    ],
    SADNESS: [
        "Be very small today. One task at a time.",
        "Try something sensory — a warm drink or a heavy blanket."
    ],
    GENERAL: [
        "Break it into one tiny piece. Don't solve the whole thing now.",
        "Sometimes a five-minute walk is enough to clear the fog."
    ]
};

// ─── Continuity Transitions ─────────────────────────────────────────
// Step 2 variation: Referencing history.
export const CONTINUITY_TRANSITIONS = [
    "Building on what you said earlier about {{oldTopic}}...",
    "Going back to when you mentioned {{oldTopic}}...",
    "Since you shared earlier that {{oldTopic}} was on your mind...",
    "I'm still thinking about that {{oldTopic}} you brought up a bit ago."
];

// ─── Questions ──────────────────────────────────────────────────────
// Step 3: Optional. Max 1. Pacing dependent.
export const GENTLE_QUESTIONS = [
    "Where does that feeling land in your body right now?",
    "If that feeling had a color, what would you see?",
    "What's the one part of this that feels hardest to say out loud?",
    "What do you wish someone truly understood about this?",
    "If you could hit pause on just one thing today, what would it be?",
    "What would 'feeling a little lighter' look like for you?",
    "Is there a version of this where you're a bit more gentle with yourself?"
];

export const INTENT_QUESTIONS: Record<IntentType, string[]> = {
    VENT: [
        "What would help you feel even 1% more heard right now?",
        "If you could put down one of those heavy things for just five minutes, which would it be?",
        "What's the loudest thought in your head at this very moment?",
        "Who is the person you wish was just... listening to this?"
    ],
    ANXIETY: [
        "What's the specific thing your brain keeps circling back to?",
        "Does this feeling have a shape... or is it more like a fog?",
        "When was the last time your chest felt like it had space to breathe?",
        "If your anxiety was trying to tell you something important, what would it be saying?"
    ],
    SADNESS: [
        "What does this sadness want from you today?",
        "Is there a small memory from today that still felt a bit warm?",
        "If you weren't trying to be 'okay', what would you say to me?",
        "Where in your body do you feel this heaviness most?"
    ],
    ANGER: [
        "What line got crossed that made this feel so sharp?",
        "Underneath the fire... is there something softer that's hurting?",
        "What would 'fair' actually look like in this situation?",
        "If you could say one thing to the situation itself, what would it be?"
    ],
    LONELINESS: [
        "When did you last feel like someone actually saw the real you?",
        "What kind of connection would feel like a breath of fresh air right now?",
        "Does the quiet feel peaceful sometimes, or just heavy?",
        "What do you wish you could share with someone who truly gets it?"
    ],
    CONFUSION: [
        "What's the one piece of the puzzle that just won't fit?",
        "If you didn't have to decide anything right now, how would that feel?",
        "Is there a tiny voice in your gut that already knows something?",
        "What would you do if you weren't worried about getting it 'wrong'?"
    ],
    REFLECTION: [
        "What brought this sudden noticing to the surface for you?",
        "Now that you see this, does it change how you feel about tomorrow?",
        "What part of yourself are you rediscovering in this?",
        "Is there something you want to handle differently because of this?"
    ],
    GROUNDING: [
        "What's one thing you can see right now that's a calming color?",
        "Can you feel the weight of your feet on the floor?",
        "What's the quietest sound you can hear in the room?",
        "If you take one breath that goes all the way down... where does it stop?"
    ],
    CRISIS: [],
    GREETING: [
        "How has the air been feeling around you today?",
        "Is there anything specific bringing you to this quiet space?",
        "Where is your mind drifting to as we start?"
    ],
    SMALL_TALK: [],
    FACTUAL: [],
    JOKE: [],
    UNCLEAR: [],
    GENERAL: [
        "What feels like the most 'raw' part of what you just said?",
        "Where does this go from here, in your mind?",
        "Is there a part of this you're still hesitant to look at?",
        "What would it mean to you if this felt just a little bit different?"
    ]
};

// ─── Callback Templates ────────────────────────────────────────────
export const CALLBACK_TEMPLATES: Record<FactType, string[]> = {
    emotion: [
        "You mentioned feeling {{value}} earlier... I'm still holding space for that.",
        "That {{value}} you shared before — is it still sitting with you now?",
        "I'm remembering what you said about {{value}}. It felt like a big part of your day.",
        "The {{value}} you talked about... it seems that runs pretty deep."
    ],
    event: [
        "About that thing with {{value}}... how is that sitting in your mind now?",
        "I keep coming back to what you said about {{value}}.",
        "The {{value}} situation... I can still feel the echo of it in your words.",
        "What you shared about {{value}} earlier — it really stayed with me."
    ],
    concern: [
        "You flagged {{value}} as something heavy, and I haven't forgotten.",
        "The {{value}} worry you mentioned — is it still shouting today?",
        "I noticed {{value}} came up a few times. It's clearly important.",
        "You brought up {{value}} before... how are you feeling about it in this moment?"
    ]
};

// ─── Topic Acknowledgements ────────────────────────────────────────
export const TOPIC_ACKNOWLEDGEMENTS = [
    "We've been here before with {{topic}}... it's still present, isn't it?",
    "{{topic}} is showing up again. It clearly has more to say.",
    "I notice {{topic}} keeps circling back. That's your mind's way of telling us it matters.",
    "We touched on {{topic}} earlier. It seems like there's still a lot there to look at.",
    "It makes sense that {{topic}} is resurfacing. These things take time."
];

// ─── Sentence Openers ──────────────────────────────────────────────
export const CONNECTORS = {
    TO_INSIGHT: [
        "And honestly,",
        "Hmm... what I notice is,",
        "The thing is,",
        "What stays with me is that",
        "Worth saying:",
        "I'm thinking that",
        "Maybe...",
        ""  // Empty = no connector
    ],
    TO_QUESTION: [
        "I'm curious...",
        "Something I'm wondering is,",
        "If I can ask...",
        "I'm just thinking,",
        "Hmm...",
        ""  // Empty = just ask directly
    ]
};

// ─── Human Hesitations ─────────────────────────────────────────────
export const HESITATIONS = [
    "Hmm...",
    "Yeah...",
    "Mm...",
    "Honestly...",
    "I get that.",
    "Right...",
    "Fair enough.",
    "I hear you.",
    "Okay...",
    "I see...",
    "That's...",
    "Well...",
    "So...",
    "I mean...",
    "You know...",
    "I might be wrong, but",
    "It feels like",
    "From what I'm hearing"
];

// ─── Special Distress Logic ────────────────────────────────────────
// Clichés only allowed in HIGH status.
export const DISTRESS_ANCHORS = [
    "I'm here for you.",
    "Thank you for trusting me with this.",
    "Take a deep breath, just for a second."
];

// ─── Casual Pivots ──────────────────────────────────────────────────
export const CASUAL_PIVOTS = [
    "I see.",
    "Got it.",
    "Makes sense.",
    "I'm with you.",
    "Right."
];
