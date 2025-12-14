"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, CheckCircle, AlertTriangle, RefreshCw, ArrowRight, Download, Mic, MicOff, Play, HelpCircle, Send, Brain, Eye, FileText, PenTool, BookOpen, Image, Search, ListChecks, Sparkles, MessageSquare, ChevronRight, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { uploadAuditImage, simulateFutureState, reviseAssets, sendChatMessage, type AuditResponse, type ChatResponse } from "@/lib/api";
import AudioVisualizer from "@/components/AudioVisualizer";

// Agent Definitions
type AgentStep = "idle" | "visual_analysis" | "ux_audit" | "action_planning" | "simulation";

const AGENTS = [
  { id: "visual_analysis", name: "Görsel Analiz Uzmanı", icon: Eye, description: "Renk, kontrast ve düzen analizi yapılıyor..." },
  { id: "ux_audit", name: "UX Denetçisi", icon: Brain, description: "Kullanıcı deneyimi ve manifesto uyumu kontrol ediliyor..." },
  { id: "action_planning", name: "Stratejist", icon: FileText, description: "Aksiyon planı ve öneriler hazırlanıyor..." },
  { id: "simulation", name: "Simülasyon Mimarı", icon: PenTool, description: "Gelecek durum tasarımı oluşturuluyor..." },
];

export default function AuditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [simulationSvg, setSimulationSvg] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [revising, setRevising] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Agent State
  const [currentAgent, setCurrentAgent] = useState<AgentStep>("idle");

  // Checklist State
  const [checkedActions, setCheckedActions] = useState<number[]>([]);

  // Live Consultation State
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Chat State
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Track active tab - always start with "audit" to avoid hydration mismatch
  const [activeTab, setActiveTab] = useState<string>("audit");
  const [isClient, setIsClient] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Restore active tab from localStorage after hydration (client-side only)
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const savedTab = localStorage.getItem("activeTab");
      if (savedTab && (savedTab === "audit" || savedTab === "plan" || savedTab === "live")) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    if (isClient && typeof window !== "undefined") {
      localStorage.setItem("activeTab", activeTab);
    }
  }, [activeTab, isClient]);

  // Initialize WebSocket only when user navigates to Live Consultation tab
  useEffect(() => {
    // Only connect when:
    // TEMPORARILY DISABLED - Voice feature is under development
    // WebSocket connection is not needed for text chat only
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
    return;
    
    /* Original WebSocket code (commented out - voice feature temporarily disabled):
    // 1. User is on the "live" tab
    // 2. WebSocket is not already connected
    if (activeTab === "live" && !wsRef.current) {
      // Add a small delay to ensure backend is ready
      const connectTimeout = setTimeout(() => {
        console.log("Initializing WebSocket connection for Live Consultation...");
        const ws = new WebSocket("ws://localhost:8000/ws/live");

      ws.onopen = () => {
        console.log("WebSocket connection opened");
        // Send audit result context if available for token optimization
        if (result) {
          const auditContext = {
            type: "context",
            audit_result: {
              score: result.audit_result.score,
              summary: result.audit_result.summary,
              violations_count: result.audit_result.violations.length,
              top_violations: result.audit_result.violations.slice(0, 5).map(v => ({
                severity: v.severity,
                issue: v.issue,
                rule_section: v.rule_section
              }))
            }
          };
          ws.send(JSON.stringify(auditContext));
          console.log("📊 Sent audit context to backend for token optimization");
        }
        // Don't set isConnected to true yet - wait for Gemini connection confirmation
        // setIsConnected will be set when we receive "Connected successfully" status
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        console.log("Disconnected from Live API", event.code, event.reason);
        if (event.code !== 1000) {
          setError(`Bağlantı kapandı: ${event.reason || 'Bilinmeyen neden'}`);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("WebSocket bağlantı hatası. Backend servisinin çalıştığından emin olun.");
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "audio") {
            console.log("Received audio message from backend, length:", data.data.length);
            setIsSpeaking(true);
            await playAudio(data.data);
            setIsSpeaking(false);
          } else if (data.type === "status") {
            console.log("Status:", data.message);
            if (data.message.includes("Connected successfully")) {
              setIsConnected(true);
            }
          } else if (data.type === "log") {
            console.log("🔍 [Server Log]:", data.message);
          } else if (data.type === "error") {
            console.error("WebSocket error:", data.message);
            setError(data.message);
            setIsConnected(false);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      wsRef.current = ws;
      }, 500); // 500ms delay to ensure backend is ready

      return () => {
        clearTimeout(connectTimeout);
        // Only close WebSocket if user leaves the live tab
        if (activeTab !== "live" && wsRef.current) {
          console.log("Closing WebSocket connection (user left Live Consultation tab)");
          wsRef.current.close();
          wsRef.current = null;
          setIsConnected(false);
        }
      };
    }
    */

    return () => {
      // Cleanup if component unmounts
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeTab]);

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

      // Gemini sends PCM audio (Int16, 16kHz), we need to convert it to AudioBuffer
      // Convert Int16 PCM to Float32
      const pcmData = new Int16Array(bytes.buffer);
      const float32Data = new Float32Array(pcmData.length);
      for (let i = 0; i < pcmData.length; i++) {
        float32Data[i] = pcmData[i] / 32768.0; // Convert from Int16 range to Float32 range
      }

      // Create AudioBuffer
      const sampleRate = 16000; // Gemini uses 16kHz
      const audioBuffer = ctx.createBuffer(1, float32Data.length, sampleRate);
      audioBuffer.getChannelData(0).set(float32Data);

      // Play audio
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      console.log("🔊 Playing audio, duration:", audioBuffer.duration.toFixed(2), "seconds");
      
      source.start(0);

      return new Promise<void>((resolve) => {
        source.onended = () => {
          console.log("✅ Audio playback completed");
          resolve();
        };
      });
    } catch (err) {
      console.error("❌ Audio playback error:", err);
      // Try alternative method - maybe it's already in a playable format
      try {
        const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
        await audio.play();
        console.log("✅ Audio played using Audio element");
      } catch (err2) {
        console.error("❌ Alternative audio playback also failed:", err2);
      }
    }
  };

  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const lastChunkRef = useRef<string | null>(null);  // Store last chunk for turn_complete
  const isStoppingRef = useRef<boolean>(false);  // Flag to mark we're stopping

  const toggleRecording = async () => {
    if (isRecording) {
      // Mark that we're stopping - next chunk should have turn_complete
      isStoppingRef.current = true;
      
      if (processorRef.current && audioContextRef.current) {
        // Wait a bit for the last chunk to be processed with turn_complete flag
        await new Promise(resolve => setTimeout(resolve, 200));
        
        processorRef.current.disconnect();
        if (sourceRef.current) {
          sourceRef.current.disconnect();
        }
        await audioContextRef.current.close();
        audioContextRef.current = null;
        setIsRecording(false);

        // If no chunk was sent with turn_complete, send turn_complete signal separately
        if (isStoppingRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
          console.log("🛑 Sending turn_complete signal to backend (fallback)");
          wsRef.current.send(JSON.stringify({ type: "turn_complete" }));
        }
        
        isStoppingRef.current = false;
        lastChunkRef.current = null;
      }
    } else {
      console.log("🎤 Starting recording...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
            echoCancellation: true,
            noiseSuppression: true
          }
        });

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 16000,
        });
        audioContextRef.current = audioContext;

        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;

        // Create ScriptProcessor
        // bufferSize: 4096 (approx 256ms at 16kHz)
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        let chunkCount = 0;
        processor.onaudioprocess = (e) => {
          // Use a ref to check recording state to avoid closure issues
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            // Check if we're actually recording by checking the processor connection
            const inputData = e.inputBuffer.getChannelData(0);
            
            // Convert Float32Array to Int16Array (PCM format)
            const int16Data = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
              // Clamp and convert to 16-bit integer
              const s = Math.max(-1, Math.min(1, inputData[i]));
              int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            
            // Convert to base64
            const buffer = int16Data.buffer;
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64data = btoa(binary);
            
            // Send audio chunk
            try {
              chunkCount++;
              
              // Store last chunk for potential turn_complete
              lastChunkRef.current = base64data;
              
              // Check if we're stopping - if so, send with turn_complete flag
              const shouldMarkComplete = isStoppingRef.current;
              
              wsRef.current.send(JSON.stringify({ 
                type: "audio", 
                data: base64data,
                format: "audio/pcm;rate=16000",
                turn_complete: shouldMarkComplete
              }));
              
              if (shouldMarkComplete) {
                console.log(`📤 Sent final audio chunk #${chunkCount} with turn_complete=true`);
                lastChunkRef.current = null;  // Clear after sending
              } else if (chunkCount % 20 === 0) {
                console.log(`📤 Sent audio chunk #${chunkCount} to backend, size: ${base64data.length} bytes`);
              }
            } catch (err) {
              console.error("❌ Error sending audio chunk:", err);
            }
          } else {
            // Log if WebSocket is not open
            if (chunkCount === 0) {
              console.warn("⚠️ WebSocket not open, cannot send audio chunks");
            }
          }
        };

        source.connect(processor);
        processor.connect(audioContext.destination); // Necessary for script processor to run

        console.log("🎤 Recording started, microphone active");
        setIsRecording(true);
      } catch (err) {
        console.error("Mic error:", err);
        const error = err as Error;
        if (error.name === 'NotAllowedError') {
          setError("Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
        } else if (error.name === 'NotFoundError') {
          setError("Mikrofon bulunamadı. Lütfen bir mikrofon bağlı olduğundan emin olun.");
        } else {
          setError("Mikrofon başlatılamadı: " + (error.message || String(error)));
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !result) return;

    const userMsg = { role: "user", content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    const inputValue = chatInput;
    setChatInput("");
    setSendingChat(true);

    try {
      // Check if it's a command that might need the dashboard image
      const needsImage = inputValue.trim().startsWith("/auditor");
      const dashboardImage = needsImage && previewUrl ? await imageToBase64(previewUrl) : null;
      
      const chatResponse = await sendChatMessage(
        messages.concat(userMsg), 
        inputValue, 
        result.audit_result,
        dashboardImage
      );
      
      setMessages(prev => [...prev, { role: "model", content: chatResponse.response }]);
      
      // If re-audit was performed, update the result
      if (chatResponse.requires_reaudit && chatResponse.new_audit_result) {
        // Update result with new audit
        setResult(prev => prev ? {
          ...prev,
          audit_result: chatResponse.new_audit_result
        } : null);
        
        // Show notification
        setMessages(prev => [...prev, { 
          role: "system", 
          content: "🔄 Dashboard yeniden değerlendirildi. Yeni sonuçlar güncellendi." 
        }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "model", content: "Üzgünüm, bir hata oluştu." }]);
    } finally {
      setSendingChat(false);
      // Scroll to bottom after message is sent
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 100);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Helper function to convert image URL to base64
  const imageToBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:image/...;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error converting image to base64:", err);
      return null;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleAudit = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      // Step 1: Visual Analysis
      setCurrentAgent("visual_analysis");
      await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay for effect

      // Step 2: UX Audit (Start the actual request here)
      setCurrentAgent("ux_audit");
      const auditPromise = uploadAuditImage(file);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Overlap delay

      // Step 3: Action Planning
      setCurrentAgent("action_planning");
      const data = await auditPromise; // Wait for actual result
      await new Promise(resolve => setTimeout(resolve, 1500)); // Final polish delay

      setResult(data);
      setCheckedActions([]);
      setMessages([]);
    } catch (err) {
      setError("Denetim başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
      setCurrentAgent("idle");
    }
  };

  const handleSimulate = async () => {
    if (!result || !result.assets) return;
    setSimulating(true);
    setCurrentAgent("simulation");
    try {
      // Combine selected actions and user feedback
      let feedbackContext = "";

      if (checkedActions.length > 0) {
        const selectedActionTexts = checkedActions.map(i => result.assets?.action_list?.[i]?.action || "").filter(Boolean).join(", ");
        feedbackContext += `User selected actions to apply: ${selectedActionTexts}. `;
      }

      if (revisionFeedback) {
        feedbackContext += `User specific revision request: ${revisionFeedback}`;
      }

      // If neither, provide a default
      if (!feedbackContext) {
        feedbackContext = "Generate a standard improvement based on the audit.";
      }

      const svg = await simulateFutureState(result.audit_result, feedbackContext);
      setSimulationSvg(svg);
    } catch (err) {
      setError("Simülasyon oluşturulamadı.");
    } finally {
      setSimulating(false);
      setCurrentAgent("idle");
    }
  };

  const handleRevise = async () => {
    if (!result || !revisionFeedback) return;
    setRevising(true);
    setCurrentAgent("simulation"); // Re-use simulation agent
    try {
      const updatedAssets = await reviseAssets(result.assets, revisionFeedback);
      setResult({ ...result, assets: updatedAssets });
      handleSimulate();
    } catch (err) {
      setError("Revizyon başarısız oldu.");
    } finally {
      setRevising(false);
      setCurrentAgent("idle");
    }
  };

  const downloadTheme = () => {
    if (!result) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.assets.theme_json, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "theme.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const toggleAction = (index: number) => {
    setCheckedActions(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div className="animate-slide-in-right">
          <h1 className="text-3xl font-bold gradient-text">Power BI Akıllı Denetim</h1>
          <p className="text-muted-foreground mt-2">Dashboard'unuzu yükleyin, yapay zeka ile denetleyin ve iyileştirin.</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Rules Link */}
          <Button variant="outline" asChild className="transition-smooth hover-scale">
            <a href="/rules" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Kuralları Yönet
            </a>
          </Button>

          {/* User Guide Button */}
          <Button 
            variant="outline" 
            onClick={() => setShowGuide(!showGuide)}
            className="transition-smooth hover-scale"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Nasıl Kullanılır?
          </Button>
        </div>
      </div>

      {/* Modern User Guide Modal */}
      {showGuide && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setShowGuide(false)}
        >
          <Card 
            className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto animate-slide-in-up shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="border-b sticky top-0 bg-background z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Nasıl Kullanılır?
                  </CardTitle>
                  <CardDescription className="mt-2">
                    DashboardMaster ile Power BI dashboard'unuzu 5 adımda iyileştirin
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowGuide(false)}
                  className="hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="group relative p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-lg">
                    1
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Image className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">Dashboard Yükle</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Power BI dashboard'unuzun ekran görüntüsünü (PNG/JPG) yükleyin. Sistem otomatik olarak analiz edecek.
                    </p>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-primary/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                {/* Step 2 */}
                <div className="group relative p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:border-blue-400 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    2
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                        <Search className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Denetim Sonuçları</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      AI, dashboard'unuzu manifesto kurallarına göre denetler. İhlalleri ve puanınızı görüntüleyin.
                    </p>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-blue-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Step 3 */}
                <div className="group relative p-6 rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:border-green-400 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    3
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
                        <ListChecks className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Aksiyon Planı</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      İhlallere yönelik spesifik aksiyonları seçin. Her aksiyon bir ihlali düzeltmeye yöneliktir.
                    </p>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-green-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Step 4 */}
                <div className="group relative p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:border-purple-400 transition-all duration-300 hover:scale-105 hover:shadow-lg md:col-span-2 lg:col-span-1">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    4
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Simülasyon</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      "Simülasyonu Oluştur" butonuna tıklayarak iyileştirilmiş dashboard'un görselini görüntüleyin.
                    </p>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-purple-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                </div>

                {/* Step 5 */}
                <div className="group relative p-6 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:border-orange-400 transition-all duration-300 hover:scale-105 hover:shadow-lg md:col-span-2 lg:col-span-2">
                  <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                    5
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-orange-100 group-hover:bg-orange-200 transition-colors">
                        <MessageSquare className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Canlı Danışman</h3>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      AI danışman ile metin tabanlı sohbet edin. Denetim sonuçlarınızı sorun, öneriler alın. <code className="text-xs bg-background px-1 py-0.5 rounded">/auditor</code> komutu ile manifesto'ya yeni kural ekleyebilirsiniz.
                    </p>
                  </div>
                  <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-orange-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                </div>
              </div>

              {/* Quick Tips */}
              <div className="mt-8 p-4 rounded-lg bg-muted/50 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-2">💡 İpuçları</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Dashboard görüntüsü net ve tam ekran olmalı</li>
                      <li>• Aksiyon planındaki maddeleri seçerek simülasyonu özelleştirebilirsiniz</li>
                      <li>• Canlı Danışman'da <code className="text-xs bg-background px-1 py-0.5 rounded">/auditor</code> komutu ile manifesto'ya özel kurallar ekleyebilirsiniz</li>
                      <li>• Theme.json dosyasını indirip Power BI'da kullanabilirsiniz</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agent Visualization Overlay */}
      {(loading || simulating || revising) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <Card className="w-[400px] border-2 border-primary/50 shadow-2xl animate-in fade-in zoom-in duration-300">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Yapay Zeka Çalışıyor</CardTitle>
              <CardDescription>Uzman ajanlar dashboard'unuzu inceliyor.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              {AGENTS.map((agent) => {
                const isActive = currentAgent === agent.id;

                return (
                  <div key={agent.id} className={`flex items-center gap-4 transition-all duration-500 ${isActive ? "opacity-100 scale-105" : "opacity-40 grayscale"}`}>
                    <div className={`p-3 rounded-full ${isActive ? "bg-primary text-primary-foreground animate-pulse" : "bg-muted"}`}>
                      <agent.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={`font-medium ${isActive ? "text-primary" : ""}`}>{agent.name}</p>
                      <p className="text-xs text-muted-foreground">{agent.description}</p>
                    </div>
                    {isActive && <RefreshCw className="h-4 w-4 animate-spin ml-auto text-primary" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      {!result && (
        <Card className="w-full max-w-md mx-auto mt-10 card-hover animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Dashboard Yükle
            </CardTitle>
            <CardDescription>Analiz için ekran görüntüsünü (PNG/JPG) yükleyin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture" className="transition-smooth">Ekran Görüntüsü</Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="transition-smooth hover-scale cursor-pointer"
              />
            </div>

            {previewUrl && (
              <div className="relative w-full h-48 rounded-md overflow-hidden border animate-fade-in hover-scale transition-smooth shadow-lg">
                <img src={previewUrl} alt="Preview" className="object-contain w-full h-full" />
              </div>
            )}

            <Button
              className="w-full transition-smooth hover-scale animate-pulse-glow"
              onClick={handleAudit}
              disabled={!file || loading}
            >
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {loading ? "Denetleniyor..." : "Denetimi Başlat"}
            </Button>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Hata</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section - Always show tabs, but some tabs require result */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="audit" disabled={!result}>Denetim Sonuçları</TabsTrigger>
          <TabsTrigger value="plan" disabled={!result}>Aksiyon Planı & Simülasyon</TabsTrigger>
          <TabsTrigger value="live">Canlı Danışman</TabsTrigger>
        </TabsList>

          {/* Tab 1: Audit Results */}
          <TabsContent value="audit" className="space-y-6">
            {!result ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Denetim sonuçlarını görmek için önce bir dashboard yükleyin.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                {/* Score Card */}
                <Card className="md:col-span-1 card-hover animate-slide-in-right">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Denetim Puanı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="relative pt-1 mb-4">
                      <div className="flex mb-2 items-center justify-between">
                        <div>
                          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full transition-smooth ${result.audit_result.score >= 70 ? 'text-green-600 bg-green-200' : 'text-red-600 bg-red-200'}`}>
                            {result.audit_result.score >= 70 ? 'İyi' : 'Geliştirilmeli'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-semibold inline-block text-blue-600">
                            {result.audit_result.score}/100
                          </span>
                        </div>
                      </div>
                      <Progress value={result.audit_result.score} className="h-2 transition-smooth" />
                    </div>
                    <p className="text-sm text-muted-foreground text-left">{result.audit_result.summary}</p>
                  </CardContent>
                </Card>

                {/* Violations Card */}
                <Card className="md:col-span-2 h-[600px] flex flex-col card-hover animate-slide-in-right">
                  <CardHeader>
                    <CardTitle>İhlaller ({result.audit_result.violations.length})</CardTitle>
                    <CardDescription>Manifesto kurallarına uymayan noktalar.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full px-6 pb-6">
                      <div className="space-y-4 pr-4">
                        {[...result.audit_result.violations]
                          .sort((a, b) => {
                            const priority = { High: 3, Medium: 2, Low: 1 };
                            return (priority[b.severity as keyof typeof priority] || 0) - (priority[a.severity as keyof typeof priority] || 0);
                          })
                          .map((v, i) => (
                            <div key={i} className="border-b pb-4 last:border-0 transition-smooth hover-scale hover:bg-muted/50 p-2 rounded-md -m-2">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant={v.severity === "High" ? "destructive" : "secondary"} className="transition-smooth">{v.severity}</Badge>
                                <span className="text-xs text-muted-foreground">{v.rule_section}</span>
                              </div>
                              <p className="text-sm font-medium mb-1">{v.issue}</p>
                              <p className="text-xs text-muted-foreground">💡 {v.recommendation}</p>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Action Plan & Simulation */}
          <TabsContent value="plan" className="space-y-6">
            {!result || !result.assets ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Aksiyon planı ve simülasyonu görmek için önce bir dashboard yükleyin.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Action Checklist */}
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      Aksiyon Kontrol Listesi
                      <Button variant="outline" size="sm" onClick={downloadTheme}>
                        <Download className="mr-2 h-4 w-4" /> Theme.json
                      </Button>
                    </CardTitle>
                    <CardDescription>Uygulamak istediğiniz adımları seçin.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {result.assets?.action_list?.map((action, i) => (
                        <div key={i} className="flex items-start space-x-3 border-b pb-3 last:border-0">
                          <Checkbox
                            id={`action-${i}`}
                            checked={checkedActions.includes(i)}
                            onCheckedChange={() => toggleAction(i)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={`action-${i}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {action.action}
                            </label>
                            <p className="text-xs text-muted-foreground">
                              {action.reason}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 pt-4 border-t">
                    <Button className="w-full" onClick={handleSimulate} disabled={simulating || checkedActions.length === 0}>
                      {simulating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                      {simulating ? "Oluşturuluyor..." : "Seçilenlerle Simülasyon Oluştur"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Simulation View */}
              <div className="space-y-6">
                <Card className="h-[400px] flex flex-col">
                  <CardHeader>
                    <CardTitle>Gelecek Durum</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex items-center justify-center bg-slate-50 overflow-hidden relative p-4">
                    {!simulationSvg ? (
                      <div className="text-center text-muted-foreground">
                        <p>Henüz simülasyon oluşturulmadı.</p>
                        <p className="text-xs mt-2">Soldaki listeden aksiyonları seçip butona basın.</p>
                      </div>
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: simulationSvg }}
                        style={{
                          // Ensure SVG scales correctly
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      />
                    )}
                  </CardContent>
                </Card>

                {/* Revision Input */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revizyon İsteği</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="Örn: Arka planı daha açık yap, başlık fontunu değiştir..."
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                    />
                    <Button onClick={handleRevise} disabled={revising || !revisionFeedback} variant="secondary" className="w-full">
                      {revising ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                      Planı Güncelle
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
            )}
          </TabsContent>

          {/* Tab 3: Live Consultation - Text Chat Only (Voice temporarily disabled) */}
          <TabsContent value="live">
            <div className="grid grid-cols-1 gap-6">
              {/* Info Alert */}
              <Alert className="bg-blue-50 border-blue-200">
                <HelpCircle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-900">Sesli Görüşme Geçici Olarak Devre Dışı</AlertTitle>
                <AlertDescription className="text-blue-800">
                  Sesli görüşme özelliği şu anda geliştirme aşamasındadır. Lütfen metin sohbeti kullanarak denetim sonuçları hakkında sorular sorun ve öneriler alın.
                  {result && (
                    <span className="block mt-2 text-sm font-medium">
                      ✅ Analiz sonuçları aktif: {result.audit_result.score}/100 puan, {result.audit_result.violations.length} ihlal tespit edildi.
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Chat Interface - Full Width */}
              <Card className="h-[700px] flex flex-col">
                <CardHeader>
                  <CardTitle>Yazılı Sohbet</CardTitle>
                  <CardDescription>
                    Danışman ile mesajlaşın. Model: <code className="text-xs bg-muted px-1 py-0.5 rounded">gemini-2.5-flash</code>
                  </CardDescription>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Komutlar:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li><code>/auditor &lt;kural açıklaması&gt;</code> - Manifesto'ya yeni kural ekle ve yeniden değerlendir</li>
                    </ul>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto pr-4 mb-4 space-y-4">
                    {messages.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm mt-10 space-y-2">
                        <p>Henüz mesaj yok. Merhaba diyerek başlayın!</p>
                        <p className="text-xs">💡 <code>/auditor</code> komutu ile manifesto'ya yeni kural ekleyebilirsiniz.</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap break-words ${
                          msg.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : msg.role === "system"
                            ? "bg-blue-50 text-blue-900 border border-blue-200"
                            : "bg-muted"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {sendingChat && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg px-4 py-2 text-sm bg-muted animate-pulse">
                          Yazıyor...
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 items-end">
                    <Textarea
                      placeholder="Mesajınızı yazın... (Shift+Enter ile yeni satır, Enter ile gönder)"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendingChat}
                      rows={1}
                      className="resize-none min-h-[40px] max-h-[120px]"
                    />
                    <Button size="icon" onClick={handleSendMessage} disabled={sendingChat || !chatInput.trim()} className="shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
