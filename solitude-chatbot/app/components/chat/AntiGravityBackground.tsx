"use client";

import { useEffect, useRef, useState } from "react";

// --- Physics Engine Interfaces ---
interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    baseSpeedY: number;
    color: string;
    type: "circle" | "square" | "triangle" | "plus";
    rotation: number;
    rotationSpeed: number;
    opacity: number;
}

export function AntiGravityBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
    const targetMousePos = useRef({ x: -1000, y: -1000 });

    // --- Configuration ---
    const PARTICLE_COUNT = 80;
    const COLORS = [
        "rgba(0, 242, 254, 0.6)",   // Soft Neon Cyan
        "rgba(79, 172, 254, 0.6)",  // Soft Neon Blue
        "rgba(161, 140, 209, 0.6)", // Soft Neon Purple
        "rgba(251, 194, 235, 0.6)"  // Soft Neon Pink
    ];

    // Track original window size to handle resize gracefully without clearing all particles immediately
    const dimensions = useRef({ width: 0, height: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            targetMousePos.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Physics & Render Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let mouseX = -1000;
        let mouseY = -1000;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };
        window.addEventListener("mousemove", handleMouseMove);

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < PARTICLE_COUNT; i++) {
                createParticle();
            }
        };

        const createParticle = (yPos?: number) => {
            const size = Math.random() * 8 + 3;
            const p: Particle = {
                x: Math.random() * dimensions.current.width,
                y: yPos ?? (Math.random() * dimensions.current.height),
                size,
                baseSpeedY: -(Math.random() * 0.4 + 0.2) * (size * 0.15),
                speedY: 0,
                speedX: (Math.random() - 0.5) * 0.2,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                type: ["circle", "square", "triangle", "plus"][Math.floor(Math.random() * 4)] as Particle["type"],
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.015,
                opacity: Math.random() * 0.5 + 0.1
            };
            p.speedY = p.baseSpeedY;
            particles.push(p);
        };

        const handleResize = () => {
            dimensions.current.width = window.innerWidth;
            dimensions.current.height = window.innerHeight;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (particles.length === 0) {
                initParticles();
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        const drawShape = (p: Particle) => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = p.opacity;
            ctx.shadowBlur = 12;
            ctx.shadowColor = p.color;

            if (p.type === "circle") {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === "square") {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-p.size, -p.size, p.size * 2, p.size * 2);
            } else if (p.type === "triangle") {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, -p.size);
                ctx.lineTo(p.size, p.size);
                ctx.lineTo(-p.size, p.size);
                ctx.closePath();
                ctx.stroke();
            } else if (p.type === "plus") {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-p.size, 0);
                ctx.lineTo(p.size, 0);
                ctx.moveTo(0, -p.size);
                ctx.lineTo(0, p.size);
                ctx.stroke();
            }
            ctx.restore();
        };

        const updatePhysics = () => {
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                p.x += p.speedX;
                p.y += p.speedY;
                p.rotation += p.rotationSpeed;

                // Friction / Restore force
                p.speedY += (p.baseSpeedY - p.speedY) * 0.02;
                p.speedX *= 0.95; 

                // Mouse Repel
                const dx = p.x - mouseX;
                const dy = p.y - mouseY;
                const distSq = dx * dx + dy * dy;
                const interactionRadius = 250;

                if (distSq < interactionRadius * interactionRadius) {
                    const dist = Math.sqrt(distSq);
                    // Smooth quadratic falloff force
                    const force = Math.pow((interactionRadius - dist) / interactionRadius, 2) * 0.4; 
                    
                    p.speedX += (dx / dist) * force;
                    p.speedY += (dy / dist) * force;
                    p.rotationSpeed += (dx / dist) * force * 0.01;
                }

                // Wrap-around logic
                if (p.y < -50) {
                    particles.splice(i, 1);
                    createParticle(dimensions.current.height + 50);
                    i--;
                }
                if (p.x > dimensions.current.width + 50) p.x = -50;
                if (p.x < -50) p.x = dimensions.current.width + 50;
            }
        };

        const render = () => {
            ctx.fillStyle = "#050B15"; // Deep space dark matching sol-deep
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            updatePhysics();

            for (const p of particles) {
                drawShape(p);
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []); 
    // ^ Because we use interpolated state for mouse, we include it. 
    // Note: for ultra-high perf, we could bypass React state entirely for mouse tracking in the canvas loop, 
    // but React state interpolation here gives a slightly detached, floaty feel to the interaction radius itself.

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-[-2] pointer-events-none"
            style={{ width: "100vw", height: "100vh" }}
        />
    );
}
