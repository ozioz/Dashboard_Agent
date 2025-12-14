"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AudioVisualizer from "@/components/AudioVisualizer";

export default function LivePage() {
    const [isConnected, setIsConnected] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false); // AI speaking
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize WebSocket
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/live");

        ws.onopen = () => {
            setIsConnected(true);
            console.log("Connected to Live API");
        };

        ws.onclose = () => {
            setIsConnected(false);
            console.log("Disconnected from Live API");
        };

        ws.onerror = (err) => {
            console.error("WebSocket error:", err);
            setError("Bağlantı hatası. Backend sunucusunun çalıştığından emin olun.");
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "audio") {
                setIsSpeaking(true);
                await playAudio(data.data);
                setIsSpeaking(false);
            }
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
    }, []);

    // Play audio from base64
    const playAudio = async (base64Data: string) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            const ctx = audioContextRef.current;
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.start(0);

            return new Promise<void>((resolve) => {
                source.onended = () => resolve();
            });
        } catch (err) {
            console.error("Audio playback error:", err);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = (reader.result as string).split(",")[1];
                        wsRef.current?.send(JSON.stringify({ type: "audio", data: base64data }));
                    };
                    reader.readAsDataURL(event.data);
                }
            };

            mediaRecorder.start(100); // Send chunks every 100ms
            setIsRecording(true);
        } catch (err) {
            setError("Mikrofon erişimi reddedildi.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl flex flex-col items-center justify-center min-h-[80vh]">
            <Card className="w-full">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Canlı Danışman Modu</CardTitle>
                    <CardDescription>
                        Yapay zeka ile sesli görüşme yapın. Manifesto kurallarına göre sizi yönlendirecek.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">

                    {/* Visualizer */}
                    <div className="flex justify-center">
                        <AudioVisualizer isListening={isRecording} isSpeaking={isSpeaking} />
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col items-center gap-4">
                        <Button
                            size="lg"
                            variant={isRecording ? "destructive" : "default"}
                            className={`rounded-full w-20 h-20 ${isRecording ? "animate-pulse" : ""}`}
                            onClick={toggleRecording}
                            disabled={!isConnected}
                        >
                            {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            {!isConnected ? "Bağlanıyor..." : isRecording ? "Dinliyor..." : isSpeaking ? "Konuşuyor..." : "Konuşmak için dokunun"}
                        </p>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Hata</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
