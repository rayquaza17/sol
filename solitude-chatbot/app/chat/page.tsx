'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import './chat.css';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Welcome to Solitude. This is your safe space. How are you feeling right now?",
            sender: 'bot',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const getAIResponse = (userMessage: string): string => {
        const msg = userMessage.toLowerCase();

        if (msg.includes('suicide') || msg.includes('kill') || msg.includes('die')) {
            return "I'm really holding space for you right now. Please know you're not alone. If you're in India, please call AASRA at 91-9820466726 (24/7) or iCall at 9152987821. Your life matters deeply.";
        }

        if (msg.includes('anxious') || msg.includes('panic') || msg.includes('stress')) {
            return "I hear the weight in your words. Let's take a slow breath together. Would you like to try a quick grounding exercise or just talk?";
        }

        if (msg.includes('hello') || msg.includes('hi')) {
            return "Hello friend. I'm here to listen. What's on your heart today?";
        }

        const simpleResponses = [
            "I'm listening. Tell me more about that.",
            "That sounds like a lot to carry. How long have you felt this way?",
            "Your feelings are valid. What would feel helpful right now?",
            "I'm here with you. What else is on your mind?"
        ];

        return simpleResponses[Math.floor(Math.random() * simpleResponses.length)];
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Simulate AI delay
        setTimeout(() => {
            const response = getAIResponse(userMsg.text);
            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response,
                sender: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMsg]);
            setIsTyping(false);
        }, 1500);
    };

    return (
        <div className="chat-wrapper">
            <nav className="chat-nav">
                <Link href="/" className="brand small">
                    <span className="sparkle">✦</span>
                    <span>Solitude</span>
                </Link>
                <Link href="/" className="btn btn-secondary btn-sm">Exit Sanctuary</Link>
            </nav>

            <div className="chat-body">
                <div className="chat-inner">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`msg-bubble ${msg.sender === 'user' ? 'msg-user' : 'msg-bot'}`}>
                            {msg.text}
                        </div>
                    ))}
                    {isTyping && (
                        <div className="msg-bubble msg-bot typing">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="chat-input-zone">
                <form onSubmit={handleSend} className="input-box">
                    <input
                        type="text"
                        className="chat-field"
                        placeholder="Share your thoughts..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                    <button type="submit" className="send-btn" disabled={!input.trim()}>
                        ➔
                    </button>
                </form>
            </div>
        </div>
    );
}
