import { useRef, useEffect } from 'react';

export function useAudioPlayer() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const queueRef = useRef<string[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
      sampleRate: 24000, // Gemini output is typically 24kHz
    });
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const playChunk = async (base64Audio: string) => {
    if (!audioContextRef.current) return;

    // Decode base64
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create buffer (PCM 16-bit LE, 24kHz usually)
    // We need to decode this raw PCM data into an AudioBuffer
    // Gemini sends raw PCM. 
    // Format: Little Endian, 16-bit, 24000Hz (usually)
    
    // Convert Uint8Array to Int16Array
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
    buffer.copyToChannel(float32Data, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    const currentTime = audioContextRef.current.currentTime;
    // Schedule playback
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  };

  return { playChunk };
}
