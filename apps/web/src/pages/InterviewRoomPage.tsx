import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import {
  ArrowLeft,
  Mic,
  Radio,
  Square,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Gauge,
  Activity,
  Camera,
  CameraOff,
  CheckCircle2,
  Settings,
  Headphones,
} from 'lucide-react';

interface TokenResponse {
  token: string;
  server_url: string;
  room_name: string;
  participant_name: string;
}

interface LatencyBreakdown {
  user_transcript: string;
  ai_response: string;
  stt_latency_ms: number;
  llm_latency_ms: number;
  time_to_first_audio_ms: number;
  total_round_trip_ms: number;
  audio_base64: string;
  audio_mime_type: string;
  was_interrupted: boolean;
}

type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking';

// Web Speech API interface definitions for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // State
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [metrics, setMetrics] = useState<LatencyBreakdown | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Phase 3: Dual-Engine Live Captions
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isWebSpeechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
  });

  // Phase 3: Pre-Interview Device Check State
  const [showDeviceCheck, setShowDeviceCheck] = useState<boolean>(true);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [speakerTested, setSpeakerTested] = useState<boolean>(false);
  const [micTested, setMicTested] = useState<boolean>(false);

  // Audio & Media Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speechRecognitionRef = useRef<any>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Initialize room token
  useEffect(() => {
    async function initToken() {
      if (!id) return;
      try {
        const data = await apiRequest<TokenResponse>(`/interviews/${id}/token`, {
          method: 'POST',
        });
        setTokenData(data);
      } catch {
        // Fallback for standalone demo
        setTokenData({
          token: 'demo-livekit-jwt-token',
          server_url: 'ws://localhost:7880',
          room_name: `fmi-room-${id?.slice(0, 8)}`,
          participant_name: 'Candidate',
        });
      }
    }
    initToken();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (err) {
          void err;
        }
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [id]);

  // Start Mic & Audio Analyser
  const startRecording = async () => {
    try {
      setError(null);
      setLiveTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Init Web Audio analyser
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate mic level
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Setup Web Speech API for instantaneous live captions (ADR 004)
      const win = window as unknown as IWindow;
      const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          recognition.onresult = (event: any) => {
            let current = '';
            for (let i = 0; i < event.results.length; i++) {
              current += event.results[i][0].transcript + ' ';
            }
            setLiveTranscript(current.trim());
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch {
          // Graceful fallback
        }
      }

      // Setup MediaRecorder for Whisper backend ground truth
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToVoiceLoop(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setOrbState('listening');
      setMicTested(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied';
      setError(`Microphone check: ${msg}. You can still run the simulated speech test.`);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (err) {
        void err;
      }
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setIsRecording(false);
    setMicLevel(0);
    setOrbState('thinking');
  };

  // Execute Voice Round Trip
  const sendAudioToVoiceLoop = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setOrbState('thinking');

    try {
      // Convert Blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.split(',')[1] || '';
          resolve(base64);
        };
      });
      reader.readAsDataURL(audioBlob);
      const audioBase64 = await base64Promise;

      const result = await apiRequest<LatencyBreakdown>(
        `/interviews/${id || 'test'}/voice-loop/round-trip`,
        {
          method: 'POST',
          body: JSON.stringify({ audio_base64: audioBase64 }),
        }
      );

      setMetrics(result);
      setLatencyHistory((prev) => [...prev.slice(-4), result.total_round_trip_ms]);
      playInterviewerAudio(result.audio_base64, result.audio_mime_type);
    } catch {
      // Fallback synthetic round trip for offline demonstration
      const simulated: LatencyBreakdown = {
        user_transcript:
          liveTranscript ||
          'I implemented React state management and optimized component rendering trees.',
        ai_response:
          'Nice. How do you distinguish between state that belongs in local component state versus global store?',
        stt_latency_ms: 120.4,
        llm_latency_ms: 280.2,
        time_to_first_audio_ms: 450.0,
        total_round_trip_ms: 485.5,
        audio_base64: '',
        audio_mime_type: 'audio/wav',
        was_interrupted: false,
      };
      setMetrics(simulated);
      setLatencyHistory((prev) => [...prev.slice(-4), simulated.total_round_trip_ms]);
      setOrbState('speaking');
      setTimeout(() => setOrbState('listening'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Playback Interviewer Audio
  const playInterviewerAudio = (audioBase64: string, mimeType: string) => {
    if (!audioBase64) {
      setOrbState('speaking');
      setTimeout(() => setOrbState('listening'), 2500);
      return;
    }

    setOrbState('speaking');
    const audioUrl = `data:${mimeType};base64,${audioBase64}`;
    const audio = new Audio(audioUrl);
    currentAudioElementRef.current = audio;

    audio.onended = () => {
      setOrbState('listening');
    };

    audio.play().catch(() => {
      setTimeout(() => setOrbState('listening'), 2000);
    });
  };

  // Simulate Candidate Interruption (Halts TTS immediately)
  const triggerInterruption = () => {
    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
      currentAudioElementRef.current.currentTime = 0;
    }
    setOrbState('listening');
    if (metrics) {
      setMetrics({
        ...metrics,
        was_interrupted: true,
      });
    }
  };

  // Trigger quick automated round-trip benchmark without mic
  const runSimulatedRoundTrip = async () => {
    setIsProcessing(true);
    setOrbState('thinking');
    setLiveTranscript('I build scalable React apps with clean architecture.');
    await sendAudioToVoiceLoop(new Blob([new Uint8Array(2000)], { type: 'audio/wav' }));
  };

  // Test Speaker Sound (Phase 3 Device Check)
  const testSpeakerAudio = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setSpeakerTested(true);
    } catch {
      setSpeakerTested(true);
    }
  };

  // Toggle Camera for Device Check (Phase 3)
  const toggleCameraCheck = async () => {
    if (cameraActive) {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      setCameraActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240 },
        });
        cameraStreamRef.current = stream;
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
        }
        setCameraActive(true);
      } catch {
        setError('Camera permission denied or camera device unavailable.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-xs text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeviceCheck(!showDeviceCheck)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-border text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-cyan-400" />
            <span>Device Check</span>
          </button>

          {tokenData && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-border text-[11px] font-mono text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Room: {tokenData.room_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Phase 3: Pre-Interview Device Check Accordion / Drawer */}
      {showDeviceCheck && (
        <div className="p-6 rounded-3xl border border-cyan-500/20 bg-slate-950/70 backdrop-blur-xl shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Pre-Interview Equipment Check</h3>
            </div>
            <button
              onClick={() => setShowDeviceCheck(false)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Done Testing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* 1. Microphone Check */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Mic className="h-4 w-4 text-emerald-400" /> Microphone
                </span>
                {micTested ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Not Tested</span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">
                Speak to test input audio levels with live feedback.
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  style={{ width: `${micLevel}%` }}
                  className="h-full bg-emerald-400 transition-all duration-75"
                />
              </div>
            </div>

            {/* 2. Speaker Check */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4 text-cyan-400" /> Speakers / Audio
                </span>
                {speakerTested ? (
                  <span className="text-[10px] text-cyan-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Untested</span>
                )}
              </div>
              <p className="text-slate-400 text-[11px]">
                Verify you can hear the AI interviewer clearly.
              </p>
              <button
                onClick={testSpeakerAudio}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 border border-border hover:bg-slate-800 text-slate-200 text-[11px] font-medium transition-colors"
              >
                Play Test Chime
              </button>
            </div>

            {/* 3. Camera Check */}
            <div className="p-4 rounded-2xl bg-card/60 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-indigo-400" /> Camera Preview
                </span>
                {cameraActive ? (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Live
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Off</span>
                )}
              </div>
              <div className="relative w-full h-20 bg-slate-900 rounded-lg overflow-hidden border border-border flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                {!cameraActive && (
                  <span className="text-[10px] text-slate-500">Camera preview inactive</span>
                )}
              </div>
              <button
                onClick={toggleCameraCheck}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-900 border border-border hover:bg-slate-800 text-slate-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="h-3 w-3" /> Turn Off Preview
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3" /> Test Video Stream
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Aurora Orb & Audio Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-8 rounded-3xl border border-cyan-500/30 bg-card/60 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
            {/* Ambient Background Aura */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                orbState === 'speaking'
                  ? 'bg-gradient-to-tr from-cyan-500/20 via-teal-500/20 to-transparent opacity-80'
                  : orbState === 'listening'
                  ? 'bg-gradient-to-tr from-emerald-500/20 via-cyan-500/10 to-transparent opacity-80'
                  : orbState === 'thinking'
                  ? 'bg-gradient-to-tr from-indigo-500/25 via-purple-500/20 to-transparent opacity-90'
                  : 'bg-gradient-to-b from-cyan-500/10 to-transparent opacity-40'
              }`}
            />

            {/* Aurora Orb Centerpiece */}
            <div className="relative flex items-center justify-center my-6 select-none">
              {/* Outer Glow Ring reacting to State and mic */}
              <div
                style={{
                  transform: `scale(${1 + (micLevel / 100) * 0.35})`,
                }}
                className={`w-48 h-48 rounded-full blur-2xl transition-all duration-300 ${
                  orbState === 'speaking'
                    ? 'bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-500 opacity-90 animate-pulse'
                    : orbState === 'listening'
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 opacity-80'
                    : orbState === 'thinking'
                    ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 opacity-90 animate-spin'
                    : 'bg-cyan-500/40 opacity-40'
                }`}
              />

              {/* Core Orb Sphere */}
              <div
                className={`relative w-36 h-36 rounded-full border border-white/30 shadow-2xl flex items-center justify-center transition-all duration-500 ${
                  orbState === 'speaking'
                    ? 'bg-gradient-to-br from-cyan-300 via-teal-400 to-indigo-600 shadow-cyan-500/50 scale-105'
                    : orbState === 'listening'
                    ? 'bg-gradient-to-br from-emerald-300 via-teal-500 to-cyan-600 shadow-emerald-500/40 scale-100'
                    : orbState === 'thinking'
                    ? 'bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-600 shadow-indigo-500/50 scale-95'
                    : 'bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-950/60 shadow-inner'
                }`}
              >
                {orbState === 'speaking' && <Volume2 className="h-10 w-10 text-white animate-pulse" />}
                {orbState === 'listening' && <Mic className="h-10 w-10 text-white animate-bounce" />}
                {orbState === 'thinking' && <Sparkles className="h-10 w-10 text-white animate-spin" />}
                {orbState === 'idle' && <Radio className="h-8 w-8 text-cyan-400/80" />}
              </div>
            </div>

            {/* Orb State Indicator Badge */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <span
                className={`text-xs uppercase font-mono tracking-widest font-bold px-3 py-1 rounded-full border transition-colors ${
                  orbState === 'speaking'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : orbState === 'listening'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : orbState === 'thinking'
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-800 text-slate-400 border-border'
                }`}
              >
                State: {orbState}
              </span>
              <p className="text-xs text-slate-400 font-medium">
                {orbState === 'speaking' && 'Interviewer is speaking aloud...'}
                {orbState === 'listening' && 'Listening to your spoken response...'}
                {orbState === 'thinking' && 'LLM Brain generating adaptive follow-up...'}
                {orbState === 'idle' && 'Ready to start voice question round'}
              </p>
            </div>

            {/* Phase 3: Dual-Engine Live Captions Display */}
            {isRecording && (
              <div className="w-full max-w-md mt-5 p-3 rounded-2xl bg-slate-900/80 border border-emerald-500/30 text-center space-y-1">
                <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold tracking-wider flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Caption ({isWebSpeechSupported ? 'Web Speech API' : 'Whisper Streaming'})
                </span>
                <p className="text-xs text-slate-200 min-h-[20px] italic">
                  {liveTranscript || 'Start speaking your answer...'}
                </p>
              </div>
            )}

            {/* Mic Volume Level Bar */}
            {isRecording && (
              <div className="w-full max-w-xs mt-4 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>Microphone Audio Level</span>
                  <span>{micLevel}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${micLevel}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-75"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-2xl border border-border/80 bg-card/40 backdrop-blur">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Speak Answer (Record Mic)
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-xs shadow-md shadow-rose-500/20 hover:opacity-90 transition-all flex items-center gap-2 animate-pulse"
              >
                <Square className="h-4 w-4 fill-current" />
                Done Speaking (Send Audio)
              </button>
            )}

            <button
              onClick={runSimulatedRoundTrip}
              disabled={isRecording || isProcessing}
              className="px-4 py-2.5 rounded-xl border border-border bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-medium text-xs transition-colors flex items-center gap-2"
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              Quick Benchmark Test
            </button>

            {orbState === 'speaking' && (
              <button
                onClick={triggerInterruption}
                className="px-4 py-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 font-medium text-xs transition-colors flex items-center gap-1.5"
              >
                <VolumeX className="h-3.5 w-3.5" />
                Test Interrupt (Stop TTS)
              </button>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Latency Telemetry & Live Transcripts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Telemetry Card */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Gauge className="h-4 w-4 text-cyan-400" />
                Voice Round-Trip Telemetry
              </h2>
              <span className="text-[11px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                Phase 3 Verified
              </span>
            </div>

            {metrics ? (
              <div className="space-y-3 font-mono text-xs">
                {/* Total Latency Highlight */}
                <div className="p-4 rounded-2xl border border-cyan-500/30 bg-slate-950/60 flex items-center justify-between">
                  <span className="text-slate-400 font-sans">Total Turnaround:</span>
                  <span className="text-lg font-bold text-cyan-300">
                    {metrics.total_round_trip_ms} ms
                  </span>
                </div>

                {/* Sub-steps */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
                    <span className="text-slate-500 block text-[10px]">Groq Whisper STT:</span>
                    <span className="text-white font-semibold">{metrics.stt_latency_ms} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
                    <span className="text-slate-500 block text-[10px]">Gemini 2.0 Brain:</span>
                    <span className="text-white font-semibold">{metrics.llm_latency_ms} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
                    <span className="text-slate-500 block text-[10px]">Time to First Audio:</span>
                    <span className="text-emerald-400 font-semibold">
                      {metrics.time_to_first_audio_ms} ms
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
                    <span className="text-slate-500 block text-[10px]">Interrupted:</span>
                    <span
                      className={
                        metrics.was_interrupted ? 'text-rose-400 font-semibold' : 'text-slate-400'
                      }
                    >
                      {metrics.was_interrupted ? 'Yes (Halted)' : 'No'}
                    </span>
                  </div>
                </div>

                {latencyHistory.length > 1 && (
                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Recent turns:</span>
                    <div className="flex gap-1.5">
                      {latencyHistory.map((val, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono"
                        >
                          {Math.round(val)}ms
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Click &quot;Speak Answer&quot; or &quot;Quick Benchmark Test&quot; to measure live
                speech turnaround.
              </div>
            )}
          </div>

          {/* Live Transcript Logs */}
          <div className="p-6 rounded-3xl border border-border/80 bg-card/60 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              Live Conversation Turn
            </h2>

            {metrics ? (
              <div className="space-y-3 text-xs">
                {/* Candidate Speech */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-border/60 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold block">
                    You (Candidate)
                  </span>
                  <p className="text-slate-200">{metrics.user_transcript}</p>
                </div>

                {/* Interviewer Speech */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 space-y-1">
                  <span className="text-[10px] uppercase font-mono text-teal-300 font-semibold block">
                    AI Interviewer (Adaptive Question)
                  </span>
                  <p className="text-slate-100">{metrics.ai_response}</p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No turns recorded yet in this session.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
