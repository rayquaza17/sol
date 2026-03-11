"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useMotionTemplate } from "framer-motion";

interface CursorGlowProps {
    isActive: boolean;
}

export function CursorGlow({ isActive }: CursorGlowProps) {
    const [isVisible, setIsVisible] = useState(false);

    // Track mouse immediately without React renders and without spring delay (1:1 tracking)
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [isVisible, mouseX, mouseY]);

    // Derived template for CSS mask image (Flashlight effect)
    // We widened the 100% opacity center block drastically to make it look "a bit too bright" or super easy to notice.
    const maskRadius = isActive ? 550 : 350;
    const maskImage = useMotionTemplate`radial-gradient(${maskRadius}px circle at ${mouseX}px ${mouseY}px, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 60%, transparent 100%)`;

    // Avoid hydration mismatch by waiting for client mount
    if (typeof window === "undefined") return null;

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-[-1]"
            style={{ WebkitMaskImage: maskImage, maskImage: maskImage }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ duration: 1 }}
        >
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern
                        id="dotted-grid"
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                    >
                        {/* Smaller, closer dots for a subtle but dense texture */}
                        <circle cx="2" cy="2" r="1" className="fill-white opacity-70" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dotted-grid)" />
            </svg>
        </motion.div>
    );
}
