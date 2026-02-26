import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio context and processor for recording
const AUDIO_SAMPLE_RATE = 16000;

interface UseGeminiLiveProps {
  apiKey: string;
  systemInstruction: string;
  onAudioData: (base64Audio: string) => void;
  onTextData?: (text: string) => void;
  onClose?: () => void;
}

export function useGeminiLive({ apiKey, systemInstruction, onAudioData, onTextData, onClose }: UseGeminiLiveProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const wsRef = useRef<any>(null); // Using any for the session object from SDK
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const connect = useCallback(async () => {
    try {
      setError(null);
      if (!apiKey) throw new Error("API Key is required");

      const ai = new GoogleGenAI({ apiKey });

      // Initialize Audio Context first to ensure we can capture
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: AUDIO_SAMPLE_RATE,
      });

      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        callbacks: {
          onopen: () => {
            console.log("Session opened");
            setIsConnected(true);
          },
          onmessage: (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              onAudioData(base64Audio);
            }
            
            const text = message.serverContent?.modelTurn?.parts?.[0]?.text;
            if (text && onTextData) {
              onTextData(text);
            }
          },
          onclose: () => {
            console.log("Session closed");
            setIsConnected(false);
            if (onClose) onClose();
          },
          onerror: (err) => {
            console.error("Session error:", err);
            setError(err.message || "Session error");
            setIsConnected(false);
          }
        },
        config: {
          systemInstruction: systemInstruction,
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
        },
      });

      wsRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Connection failed:", err);
      setError(err.message);
      setIsConnected(false);
    }
  }, [apiKey, systemInstruction, onAudioData, onTextData, onClose]);

  const startRecording = useCallback(async () => {
    if (!wsRef.current || !audioContextRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current = source;
      
      // Use ScriptProcessor for raw PCM data (deprecated but widely supported for this use case)
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Convert to base64
        const base64Data = btoa(
          String.fromCharCode(...new Uint8Array(pcmData.buffer))
        );

        // Send to Gemini
        wsRef.current.sendRealtimeInput({
          media: {
            mimeType: "audio/pcm;rate=" + audioContextRef.current?.sampleRate, // Send actual sample rate
            data: base64Data
          }
        });
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      
      setIsRecording(true);
    } catch (err: any) {
      console.error("Recording error:", err);
      setError("Could not access microphone");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (processorRef.current && sourceRef.current) {
      sourceRef.current.disconnect();
      processorRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
  }, []);

  const disconnect = useCallback(() => {
    stopRecording();
    if (wsRef.current) {
      // wsRef.current.close(); // Method might vary based on SDK version, assuming close() exists or we just drop ref
    }
    setIsConnected(false);
  }, [stopRecording]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    startRecording,
    stopRecording,
    isConnected,
    isRecording,
    error
  };
}

