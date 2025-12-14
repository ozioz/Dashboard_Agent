"use client";

import { useEffect, useRef } from "react";

interface AudioVisualizerProps {
    isListening: boolean;
    isSpeaking: boolean;
}

export default function AudioVisualizer({ isListening, isSpeaking }: AudioVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let frame = 0;

        const draw = () => {
            frame++;
            const width = canvas.width;
            const height = canvas.height;
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);

            // Base line
            ctx.beginPath();
            ctx.moveTo(0, centerY);

            const bars = 50;
            const spacing = width / bars;

            for (let i = 0; i < bars; i++) {
                const x = i * spacing;
                let amplitude = 5;

                if (isListening) {
                    // Gentle wave for listening
                    amplitude = 15 + Math.sin(frame * 0.1 + i * 0.2) * 10;
                } else if (isSpeaking) {
                    // Energetic wave for speaking
                    amplitude = 30 + Math.random() * 40;
                }

                // Draw symmetric bars
                ctx.fillStyle = isSpeaking ? "#3b82f6" : isListening ? "#10b981" : "#9ca3af";
                const barHeight = amplitude;

                // Rounded bar
                ctx.beginPath();
                ctx.roundRect(x, centerY - barHeight / 2, spacing - 2, barHeight, 4);
                ctx.fill();
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isListening, isSpeaking]);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={100}
            className="w-full h-24 rounded-lg bg-slate-50 border"
        />
    );
}
