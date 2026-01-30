
import React, { useEffect, useState, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { User } from '../types';

interface LiveCallOverlayProps {
  onClose: () => void;
  targetName: string;
  targetAvatar: string;
  isAiCall: boolean;
  targetId?: string;
  currentUser: User;
}

const LiveCallOverlay: React.FC<LiveCallOverlayProps> = ({ onClose, targetName, targetAvatar, isAiCall, targetId, currentUser }) => {
  const [status, setStatus] = useState<'connecting' | 'active' | 'error'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  
  const bc = useRef<BroadcastChannel | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());

  useEffect(() => {
    // Fix: Aligned BroadcastChannel version with App.tsx
    bc.current = new BroadcastChannel('telegemini_v12_broadcast');
    
    const initAudio = () => {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    };
    initAudio();

    if (isAiCall) {
        startAiCall();
    } else {
        startHumanCall();
    }

    bc.current.onmessage = (e) => {
        if (e.data.type === 'VOICE_DATA' && e.data.payload.senderId === targetId) {
            playAudioChunk(decode(e.data.payload.data));
            setStatus('active');
        }
        if (e.data.type === 'CALL_HANGUP' && e.data.payload.targetId === currentUser.id) {
            onClose();
        }
    };

    return () => {
      if (audioContextRef.current) audioContextRef.current.close();
      bc.current?.close();
    };
  }, []);

  const startAiCall = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new AudioContext({ sampleRate: 16000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('active');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              // CRITICAL: Ensure real-time input is sent only after session resolves
              sessionPromise.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const data = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (data) playAudioChunk(decode(data));
            if (msg.serverContent?.outputTranscription) setTranscription(msg.serverContent.outputTranscription.text);
          },
          onerror: () => setStatus('error'),
          onclose: () => onClose()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
        }
      });
    } catch (err) { setStatus('error'); }
  };

  const startHumanCall = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const inputCtx = new AudioContext({ sampleRate: 16000 });
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              bc.current?.postMessage({ type: 'VOICE_DATA', payload: { targetId, senderId: currentUser.id, data: encode(new Uint8Array(int16.buffer)) } });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
          setStatus('connecting'); // Waiting for other side voice data
      } catch (err) { setStatus('error'); }
  };

  const playAudioChunk = async (data: Uint8Array) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
    const audioBuffer = await decodeAudioData(data, ctx, 24000, 1);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += audioBuffer.duration;
    sourcesRef.current.add(source);
  };

  function createBlob(data: Float32Array): any {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }
  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  function decode(base64: string) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  }
  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, channels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / channels;
    const buffer = ctx.createBuffer(channels, frameCount, sampleRate);
    for (let c = 0; c < channels; c++) {
      const channelData = buffer.getChannelData(c);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * channels + c] / 32768.0;
    }
    return buffer;
  }

  return (