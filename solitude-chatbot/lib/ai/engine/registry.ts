import { IntentType } from './types';

export const ACKNOWLEDGEMENTS = {
    DEFAULT: [
        "I hear you.",
        "That sounds incredibly heavy.",
        "I'm listening closely.",
        "It makes sense that you feel this way.",
        "Thank you for sharing that with me."
    ],
    HIGH_INTENSITY: [
        "I can hear how much pain you're in right now.",
        "This sounds like an incredibly difficult moment for you.",
        "I'm right here with you through this intensity.",
        "It takes a lot of strength to even say that out loud."
    ]
};

export const REFLECTIONS: Record<IntentType, string[]> = {
    VENT: [
        "It sounds like everything is just piling up all at once.",
        "You've been carrying this weight for a long time.",
        "It feels like there's just no space to breathe right now.",
        "It seems like you're exhausted from trying to hold it all together."
    ],
    ANXIETY: [
        "It feels like your mind is racing a million miles an hour.",
        "The uncertainty of it all is weighing heavy on you.",
        "It sounds like it's hard to find a quiet place in your thoughts.",
        "You're feeling a strong sense of unease about what's coming."
    ],
    SADNESS: [
        "There's a deep sense of loss or emptiness in your words.",
        "It feels like the color has been drained out of things today.",
        "You're sitting with a really heavy heart right now.",
        "It sounds like a wave of sadness has washed over you."
    ],
    ANGER: [
        "You're feeling unheard and frustrated by how things are going.",
        "It feels unfair, and that anger is completely valid.",
        "It sounds like you've reached a breaking point with this.",
        "That fire inside is protecting something important to you."
    ],
    LONELINESS: [
        "It feels like you're shouting into a void and no one hears.",
        "The silence around you feels heavier than usual today.",
        "You're missing a sense of genuine connection right now.",
        "It sounds like you feel invisible in a crowded world."
    ],
    CONFUSION: [
        "It feels like you're trying to untangle a giant knot.",
        "You're looking for a clear path but everything looks foggy.",
        "It's hard to know which way to turn when nothing makes sense.",
        "You're feeling lost in all the different possibilities."
    ],
    REFLECTION: [
        "You're doing the brave work of looking inward.",
        "It sounds like you're connecting some important dots.",
        "You're starting to see this situation from a new angle.",
        "This realization feels like a significant step for you."
    ],
    GROUNDING: [
        "You're trying to find your feet again.",
        "It sounds like you need a moment to just be skilled.",
        "You're reaching for something steady to hold onto.",
        "Slowing down feels necessary right now."
    ],
    CRISIS: [
        "You're in a place of deep darkness right now.",
        "It feels like there's no way out of this pain.",
        "You're carrying a burden that feels too heavy to bear alone."
    ],
    GREETING: [
        "I'm glad you found your way back here.",
        "It's good to be connected with you again.",
        "I was hoping we'd get a chance to talk."
    ],
    GENERAL: [
        "You're sharing something specific that's on your mind.",
        "It sounds like this is taking up a lot of your thoughts.",
        "You're processing how this impacts you."
    ]
};

export const INSIGHTS: Record<IntentType, string[]> = {
    VENT: [
        "Sometimes just letting it all out is the most productive thing you can do.",
        "You don't have to fix everything right this second.",
        "Your feelings are a natural response to so much pressure.",
        "It's okay to put down the heavy things for a moment."
    ],
    ANXIETY: [
        "This feeling is a wave, and like all waves, it will eventually settle.",
        "You are safe right here, right now, in this conversation.",
        "Your mind is trying to protect you, even if it feels overwhelming.",
        "We can take this one small breath at a time."
    ],
    SADNESS: [
        "Grief and sadness are often signs of how much we care.",
        "It's okay to not be okay today. There is no rush to feel better.",
        "Be gentle with yourself while you navigate this heaviness.",
        "This feeling doesn't define you, even if it surrounds you."
    ],
    ANGER: [
        "Your anger is telling you that a boundary has been crossed.",
        "It's healthy to feel this; it means you value yourself.",
        "We can honor this anger without letting it consume you.",
        "There is energy in this emotion that can be channeled when you're ready."
    ],
    LONELINESS: [
        "Even in the quietest moments, you are connected to the world around you.",
        "Solitude can be a space for rest, even when it feels like isolation.",
        "You are worthy of connection, even when it feels out of reach.",
        "Being alone doesn't mean you are broken."
    ],
    CONFUSION: [
        "Clarity often comes in small glimpses rather than a floodlight.",
        "It's valid to simply not know the answer right now.",
        "Living the questions is just as important as finding the answers.",
        "Trust that the path will reveal itself as you take small steps."
    ],
    REFLECTION: [
        "These insights are building blocks for a more authentic life.",
        "Understanding yourself is a journey that never truly ends.",
        "You have a lot of wisdom inside you, waiting to be heard.",
        "Every realization brings you a little closer to peace."
    ],
    GROUNDING: [
        "The ground beneath you is solid and will support you.",
        "Your breath is an anchor you can always return to.",
        "This moment is the only one you need to handle right now.",
        "Peace is available in the space between your thoughts."
    ],
    CRISIS: [
        "Please remember that this pain is temporary, but you are irreplaceable. Reaching out for help is an act of courage. Call AASRA at 91-9820466726.",
        "Your life has value that you might not be able to see right now. Please let someone share this weight with you. iCall (9152987821) is listening.",
        "You don't have to walk this path alone. There are people who want to help you stay. Please dial a crisis line like 91-9820466726."
    ],
    GREETING: [
        "This is a safe space for whatever you need to bring today.",
        "There is no pressure here, just presence.",
        "Take all the time you need to settle in."
    ],
    GENERAL: [
        "We can explore this at whatever pace feels right for you.",
        "I'm here to walk through this with you, step by step.",
        "Your perspective on this matters."
    ]
};

export const GENTLE_QUESTIONS = [
    "What does that feeling feel like physically in your body?",
    "If this emotion had a color, what would it be?",
    "What is one small thing that could bring a tiny bit of relief?",
    "What is the hardest part of this for you right now?",
    "Is there a part of you that knows what you need?",
    "How long have you been feeling this way?",
    "What would you say to a friend in this situation?",
    "Is there a safe place you can go to in your mind?"
];
