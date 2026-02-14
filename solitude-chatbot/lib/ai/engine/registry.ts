import { IntentType, FactType } from './types';

// ─── Response Policy ────────────────────────────────────────────────
//
//  Structure:  Acknowledge → Reflect → Insight (one) → Question (optional)
//  Tone:       Calm, warm, grounded. Not motivational. Not clinical.
//  Rules:      No clichés. No back-to-back questions. No repetition.
//
// ─────────────────────────────────────────────────────────────────────

// ─── Acknowledgements ───────────────────────────────────────────────
// Short, grounding. The first thing the user reads. Never preachy.

export const ACKNOWLEDGEMENTS = {
    DEFAULT: [
        "Yeah, I hear that.",
        "That's a lot to sit with.",
        "Mm, that makes sense.",
        "I feel the weight of that.",
        "I'm with you on this.",
        "That's real. Thank you for saying it.",
        "I can tell that matters to you.",
        "Nothing about that sounds easy."
    ],
    HIGH_INTENSITY: [
        "I can feel the heaviness in what you're saying.",
        "That's a lot of pain in a small number of words.",
        "I hear you, and I'm not going anywhere.",
        "That took courage to put into words.",
        "I want you to know I'm sitting with that, not rushing past it.",
        "There's no need to soften this. I can hold it with you."
    ]
};

// ─── Reflections ────────────────────────────────────────────────────
// Paraphrase what the user shared. Show you actually understood.
// Never start with "It sounds like" for every single one.

export const REFLECTIONS: Record<IntentType, string[]> = {
    VENT: [
        "Everything's hitting all at once, and there's no room to breathe.",
        "You've been running on fumes trying to keep it all together.",
        "It's like the list never ends and nobody's noticing how much you're carrying.",
        "There's this pressure that just won't let up, and you're tired of pushing through it.",
        "You're exhausted, and not just physically — emotionally drained too."
    ],
    ANXIETY: [
        "Your mind keeps circling the same worries, and it won't quiet down.",
        "There's this constant hum of 'what if' that won't leave you alone.",
        "Even when things are objectively fine, your body is still bracing for something.",
        "You're stuck in that space where the unknown feels unbearable.",
        "It's like your chest is tight and your thoughts are three steps ahead of reality."
    ],
    SADNESS: [
        "There's a kind of heaviness that's hard to describe but impossible to ignore.",
        "The world feels dimmer than it usually does, even if nothing specific changed.",
        "You're carrying something that goes deeper than a bad day.",
        "It's the kind of ache that sits in your bones, not just your thoughts.",
        "Everything takes more effort right now, even things that used to feel simple."
    ],
    ANGER: [
        "Something crossed a line, and you're done pretending it's fine.",
        "You've been patient, and it hasn't been returned. That burns.",
        "There's a part of you that's been swallowing frustration for too long.",
        "You're not just annoyed — you're genuinely hurt underneath this.",
        "You've hit a wall, and the wall keeps not moving."
    ],
    LONELINESS: [
        "You're surrounded by people but the distance feels enormous.",
        "It's not that nobody's around — it's that nobody's really there.",
        "There's a gap between you and the people in your life that feels wider than usual.",
        "You want to be seen, not just looked at.",
        "The quiet feels louder today than it usually does."
    ],
    CONFUSION: [
        "You're turning this over and over, and it still doesn't click.",
        "Every option feels equally wrong and equally possible at the same time.",
        "You want clarity so badly, but the more you think, the foggier it gets.",
        "There's a fog between you and the answer, and it's frustrating.",
        "You're not lost because you're careless — you're lost because you care too much."
    ],
    REFLECTION: [
        "Something shifted in how you see this. You're noticing the edges of it.",
        "You're pulling on a thread that could unravel something important.",
        "There's a quieter understanding forming underneath all the noise.",
        "You're not just thinking about this — you're starting to feel the shape of it.",
        "This is the kind of noticing that doesn't happen accidentally."
    ],
    GROUNDING: [
        "You need something steady right now. Not advice, just ground.",
        "Your body is asking you to slow down, even if your mind won't cooperate.",
        "You're looking for an anchor, something that doesn't move.",
        "Right now, the most useful thing might be the simplest thing.",
        "There's no emergency. Just this moment, just this breath."
    ],
    CRISIS: [
        "You're in a dark place right now, and I'm not going to pretend otherwise.",
        "This level of pain is real. I'm not dismissing it.",
        "What you're feeling is overwhelming, and saying that out loud is not weakness."
    ],
    GREETING: [
        "Good to have you here. No agenda, no rush.",
        "Hey, welcome back. Take a second to settle in.",
        "I'm here. Wherever you want to start is exactly right."
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
        "There's something specific in that you're trying to name.",
        "This is sitting with you in a way that feels important.",
        "You're working through something, even if you're not sure what yet."
    ]
};

// ─── Insights ───────────────────────────────────────────────────────
// One gentle truth or reframe. Not motivational posters.
// No "You are worthy." No "You've got this." Talk like a thoughtful friend.

export const INSIGHTS: Record<IntentType, string[]> = {
    VENT: [
        "Sometimes the most useful thing to do with all of it is nothing — just let it exist without trying to fix it.",
        "You don't owe anyone a performance of having it together right now.",
        "Not everything needs a solution. Some things just need space.",
        "The fact that you're still showing up through all of this says more than you realize.",
        "Rest isn't a reward for finishing — it's a requirement for continuing."
    ],
    ANXIETY: [
        "That worried voice in your head is loud, but it's not always right.",
        "Your body is stuck in 'brace for impact' mode — that doesn't mean impact is coming.",
        "Anxiety borrows problems from tomorrow. You only need to handle right now.",
        "You don't have to figure out everything before you can breathe.",
        "Sometimes the bravest thing is to stay still when everything in you says run."
    ],
    SADNESS: [
        "Sadness doesn't mean you're broken. Sometimes it means you're paying attention.",
        "You don't have to rush past this feeling. It's allowed to be here for a while.",
        "The heaviness isn't permanent, even when it feels like the ceiling.",
        "Caring deeply about things will always come with moments like these.",
        "Being sad about the right things is a kind of honesty most people avoid."
    ],
    ANGER: [
        "Your anger is information — it's telling you where your limits are.",
        "Feeling this doesn't make you difficult. It makes you honest.",
        "You don't need permission to feel this. The feeling already has its reasons.",
        "There's nothing wrong with the anger. What matters is what you do next, and right now, you're doing this.",
        "Underneath the frustration, there's usually something you care about deeply."
    ],
    LONELINESS: [
        "Loneliness isn't a flaw — it's a signal that your capacity for connection is still alive.",
        "You're not defective for wanting to be known. That's one of the most human things there is.",
        "Being alone and being lonely are different rooms. You're allowed to name which one you're in.",
        "Sometimes the loneliest moments teach you the most about what you actually need from people.",
        "The fact that you notice the absence of connection means you know what the real thing feels like."
    ],
    CONFUSION: [
        "Not knowing isn't failing. It's the honest middle part that most people skip over.",
        "Clarity doesn't usually arrive all at once. It leaks in slowly, over quiet moments like this.",
        "You don't have to trust the answer yet. You just have to keep asking the question.",
        "Being confused means you're holding complexity instead of simplifying it away.",
        "Sometimes the clearest thing you can say is 'I don't know yet,' and that counts."
    ],
    REFLECTION: [
        "That kind of noticing changes things, even if you can't see it yet.",
        "Reflections like this don't usually happen when life is noisy. You're making space for them.",
        "Understanding yourself isn't a destination — it's more like tuning an instrument.",
        "What you're seeing now has probably been there a while. You're just ready to look.",
        "This kind of thinking isn't common. Most people never pause long enough to do it."
    ],
    GROUNDING: [
        "Your body knows things your mind hasn't caught up with yet.",
        "Right now, the only thing worth paying attention to is this moment.",
        "You don't need a plan. You need a breath.",
        "Nothing outside this moment needs your energy right now.",
        "The ground is still here. You are still here. That's enough."
    ],
    CRISIS: [
        "What you're feeling right now is real, and your life is worth more than this moment of pain. Please reach out — AASRA is available 24/7 at 91-9820466726.",
        "This pain is temporary, even though it doesn't feel that way. You don't have to carry it alone. iCall is listening at 9152987821.",
        "You matter, even if your mind is telling you otherwise right now. Please call 91-9820466726 — someone is there for you."
    ],
    GREETING: [
        "No script needed. Whatever's on your mind, that's where we start.",
        "This space isn't going anywhere. Take your time.",
        "You set the pace here. Say what you need to say, or say nothing at all."
    ],
    SMALL_TALK: [
        "I'm here and listening. I'm mostly focused on how you're feeling — how are things with you inwardly?",
        "It's good to connect. I'm here to support you with whatever's weighing on your mind."
    ],
    FACTUAL: [
        "That's outside what I know. I don't have real-time info, but I am here to listen to what's going on for you.",
        "I'm not great with facts like that. My focus is more on your internal world and how you're doing."
    ],
    JOKE: [
        "I appreciate the humor! I'm here if you want to share what's underneath it, or just to chat about how you're feeling.",
        "Humor is a good coping mechanism. I'm here to listen if there's more you want to say."
    ],
    UNCLEAR: [
        "I'm not sure I caught that. Could you say a bit more about what's on your mind?",
        "I didn't quite understand. I'm here to listen if you want to share how you're feeling."
    ],
    GENERAL: [
        "Naming something is often the first step to understanding it.",
        "There's usually more underneath what we first say. It tends to surface on its own.",
        "You don't have to have this figured out. Just talking about it shifts things."
    ]
};

// ─── Questions ──────────────────────────────────────────────────────
// Only asked when they genuinely move the conversation forward.
// Never ask what the user already answered. Never ask back-to-back.

export const GENTLE_QUESTIONS = [
    "Where do you feel this most in your body right now?",
    "If you could name this feeling with a single word, what would it be?",
    "What would even a tiny bit of relief look like for you?",
    "What's the hardest part of all this — like, the thing that follows you around?",
    "If you could tell someone the truth about how you're doing, what would you say?",
    "What do you wish someone understood about this?",
    "Is there a version of today that would've felt a little lighter?"
];

export const INTENT_QUESTIONS: Record<IntentType, string[]> = {
    VENT: [
        "What would take even a small amount of weight off you right now?",
        "If you could hit pause on one thing in your life today, what would it be?",
        "When all of this quiets down, what do you actually want?",
        "Is there someone who actually gets what this is like for you?"
    ],
    ANXIETY: [
        "What's the specific thing your brain keeps coming back to?",
        "When was the last time your body actually felt calm?",
        "What does your mind do right before the worry spiral starts?",
        "If anxiety had an off switch, what would be different about your life?"
    ],
    SADNESS: [
        "What does this sadness actually want from you, if you had to guess?",
        "Was there a moment recently that still carried some warmth?",
        "What do you miss most inside this feeling?",
        "If you weren't trying to be strong about it, what would you say?"
    ],
    ANGER: [
        "What line got crossed that pushed you here?",
        "Under all the frustration, is there something softer that's hurting?",
        "What would it take for this to actually feel resolved?",
        "If you could say one thing to the person or situation that caused this, what would it be?"
    ],
    LONELINESS: [
        "When was the last time you felt truly seen by another person?",
        "What kind of connection would actually feel real to you right now?",
        "What does 'not alone' actually look like in your life?",
        "If someone really understood you, what would they know?"
    ],
    CONFUSION: [
        "What's the one question that keeps looping in your head?",
        "If you didn't have to make a decision right now, how would that feel?",
        "Is there something your gut has been quietly telling you?",
        "What would you do if you knew you couldn't get it wrong?"
    ],
    REFLECTION: [
        "What set this reflection off for you?",
        "Now that you see this, does it change anything about what comes next?",
        "What part of yourself are you getting to know through this?",
        "Is there something you want to do differently because of this?"
    ],
    GROUNDING: [
        "Tell me three things you can see right where you are.",
        "What does the surface under your hands or feet feel like?",
        "What's one sound in your environment right now?",
        "If you take one slow breath, where does it land in your body?"
    ],
    CRISIS: [],
    GREETING: [
        "How's today been treating you so far?",
        "Anything specific bringing you here right now?",
        "Where's your mind at today?"
    ],
    SMALL_TALK: [],
    FACTUAL: [],
    JOKE: [],
    UNCLEAR: [],
    GENERAL: [
        "What feels most important about what you just said?",
        "Where does this go from here, in your mind?",
        "Is there something underneath that you haven't said yet?",
        "What would it mean to you if this got better?"
    ]
};

// ─── Callback Templates ────────────────────────────────────────────
// Natural references to things the user shared earlier.
// Never robotic. Written like someone who was actually paying attention.

export const CALLBACK_TEMPLATES: Record<FactType, string[]> = {
    emotion: [
        "You mentioned {{value}} earlier, and I haven't stopped thinking about that.",
        "That {{value}} you described before — it's still here in the room, isn't it?",
        "I keep coming back to the {{value}} you talked about. It clearly runs deep.",
        "The {{value}} you shared — that kind of thing doesn't just vanish between conversations."
    ],
    event: [
        "That thing with {{value}} you brought up — how's that sitting now?",
        "I remember what you said about {{value}}. That felt significant.",
        "The {{value}} situation — it's probably still echoing, isn't it?",
        "What you shared about {{value}} earlier, that landed with me."
    ],
    concern: [
        "You flagged {{value}} as something weighing on you, and I'm holding onto that.",
        "The {{value}} worry you mentioned — that doesn't just go away quietly.",
        "I noticed {{value}} came up earlier. That's clearly present for you.",
        "You brought up {{value}} before, and it seemed like more than a passing thought."
    ]
};

// ─── Topic Acknowledgements ────────────────────────────────────────
// When a previously discussed topic comes back up, acknowledge it
// instead of treating it like new territory.

export const TOPIC_ACKNOWLEDGEMENTS = [
    "We've been here before with {{topic}}, and the fact that it's back says something.",
    "{{topic}} is showing up again. It clearly has a hold on you right now.",
    "You brought up {{topic}} before, and here it is again — that tells me it's not done with you yet.",
    "I notice {{topic}} keeps circling back. That's your mind telling you it matters.",
    "We touched on {{topic}} earlier. There's more there, isn't there?"
];

// ─── Sentence Openers ──────────────────────────────────────────────
// Used to vary how multi-part responses begin their second/third segments.
// Prevents the "It sounds like... It feels like..." repetition pattern.

export const CONNECTORS = {
    TO_INSIGHT: [
        "And honestly,",
        "Here's what I notice though —",
        "The thing is,",
        "What stays with me is that",
        "Worth saying:",
        ""  // Empty = no connector, just start fresh
    ],
    TO_QUESTION: [
        "I'm curious —",
        "Something I keep wondering:",
        "If I can ask one thing —",
        "Here's what I want to know:",
        ""  // Empty = just ask directly
    ]
};
