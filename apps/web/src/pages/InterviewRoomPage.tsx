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
  Award,
  HelpCircle,
  ShieldCheck,
  Eye,
  Smile,
  UserCheck,
} from 'lucide-react';
import { CameraMetricsTracker, LiveCameraFeedback } from '../services/cameraMetrics';

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
  round?: string;
  question_index?: number;
  total_questions?: number;
  is_follow_up?: boolean;
  follow_up_count?: number;
  max_follow_ups?: number;
  quality_score?: number;
  is_completed?: boolean;
  turn_number?: number;
}

interface TurnLog {
  turn_number: number;
  round: string;
  user_transcript: string;
  ai_response: string;
  is_follow_up: boolean;
}

type OrbState = 'idle' | 'speaking' | 'listening' | 'thinking';

// Web Speech API interface definitions for TypeScript
interface IWindow extends Window {
  SpeechRecognition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  webkitSpeechRecognition?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Core State
  const [tokenData, setTokenData] = useState<TokenResponse | null>(null);
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [metrics, setMetrics] = useState<LatencyBreakdown | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Phase 4: State Machine & Adaptive Probing
  const [currentRound, setCurrentRound] = useState<string>('warmup');
  const [questionIndex, setQuestionIndex] = useState<number>(1);
  const [totalQuestions, setTotalQuestions] = useState<number>(4);
  const [followUpCount, setFollowUpCount] = useState<number>(0);
  const [isFollowUp, setIsFollowUp] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>(
    "Welcome to your interview! Please introduce yourself and share what motivated you to pursue a career in technology."
  );
  const [turnLogs, setTurnLogs] = useState<TurnLog[]>([]);

  // Phase 3: Dual-Engine Live Captions
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [isWebSpeechSupported] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const win = window as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  });
  const speechRecognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

  // Device Diagnostic check
  const [showDeviceCheck, setShowDeviceCheck] = useState(false);
  const [micTested, setMicTested] = useState(false);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // Phase 5: Client-side MediaPipe Camera Metrics
  const [cameraMetrics, setCameraMetrics] = useState<LiveCameraFeedback>({
    eyeContact: 88,
    stability: 92,
    posture: 85,
    expressiveness: 76,
  });
  const cameraTrackerRef = useRef<CameraMetricsTracker | null>(null);

  // Audio Recording & Analysis
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // 1. Fetch Room Token from FastAPI backend
  useEffect(() => {
    async function initSession() {
      if (!id) return;
      try {
        const data = await apiRequest<TokenResponse>(`/interviews/${id}/token`);
        setTokenData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Backend offline - using local simulation mode';
        setError(message);
        setTokenData({
          token: 'mock-jwt-token',
          server_url: 'ws://localhost:7880',
          room_name: `room-${id}`,
          participant_name: 'alex.fresher',
        });
      }
    }
    initSession();
  }, [id]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (currentAudioElementRef.current) {
        currentAudioElementRef.current.pause();
      }
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (cameraTrackerRef.current) {
        cameraTrackerRef.current.stop();
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Web Speech API
  const startSpeechRecognition = () => {
    if (!isWebSpeechSupported) return;
    try {
      const win = window as IWindow;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setLiveTranscript(transcript);
      };

      recognition.onerror = () => {
        // Fallback to Whisper chunks seamlessly
      };

      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch {
      // Graceful fallback
    }
  };

  const stopSpeechRecognition = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {
        // ignore
      }
      speechRecognitionRef.current = null;
    }
  };

  // Start Mic Recording & Audio Meter
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    setLiveTranscript('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Audio analysis for volume levels
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((acc, val) => acc + val, 0);
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicLevel(normalized);
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

      // Start Web Speech
      startSpeechRecognition();

      // MediaRecorder setup
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToVoiceLoop(audioBlob);
      };

      recorder.start();
      setIsRecording(true);
      setOrbState('listening');
      setMicTested(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not access microphone';
      setError(`Microphone error: ${message}. Check browser permissions.`);
      setIsRecording(false);
      setOrbState('idle');
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    stopSpeechRecognition();
    setIsRecording(false);
    setMicLevel(0);
    setOrbState('thinking');
  };

  // Send candidate audio to Phase 4 Voice Runner
  const sendAudioToVoiceLoop = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setOrbState('thinking');

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'candidate_response.webm');
      if (liveTranscript) {
        formData.append('live_transcript', liveTranscript);
      }

      const res = await apiRequest<LatencyBreakdown>(`/interviews/${id}/turn`, {
        method: 'POST',
        body: formData,
      });

      setMetrics(res);
      setLatencyHistory((prev) => [...prev.slice(-4), res.total_round_trip_ms]);

      if (res.round) setCurrentRound(res.round);
      if (res.question_index) setQuestionIndex(res.question_index);
      if (res.total_questions) setTotalQuestions(res.total_questions);
      if (res.is_follow_up !== undefined) setIsFollowUp(res.is_follow_up);
      if (res.follow_up_count !== undefined) setFollowUpCount(res.follow_up_count);
      if (res.is_completed !== undefined) setIsCompleted(res.is_completed);
      if (res.ai_response) setCurrentPrompt(res.ai_response);

      setTurnLogs((prev) => [
        ...prev,
        {
          turn_number: res.turn_number ?? prev.length + 1,
          round: res.round ?? currentRound,
          user_transcript: res.user_transcript,
          ai_response: res.ai_response,
          is_follow_up: res.is_follow_up ?? false,
        },
      ]);

      playInterviewerAudio(res.audio_base64, res.audio_mime_type);
    } catch {
      // Fallback local simulation
      const nextIdx = isFollowUp ? questionIndex : questionIndex + 1;
      const simDone = nextIdx > totalQuestions;
      const simulated: LatencyBreakdown = {
        user_transcript:
          liveTranscript || 'I have experience implementing state management with Redux and React Context.',
        ai_response: simDone
          ? 'That concludes our mock interview session today! Generating your performance analysis.'
          : 'Great explanation. How do you prevent unnecessary child re-renders when context values update?',
        stt_latency_ms: 120.4,
        llm_latency_ms: 280.2,
        time_to_first_audio_ms: 450.0,
        total_round_trip_ms: 485.5,
        audio_base64: '',
        audio_mime_type: 'audio/wav',
        was_interrupted: false,
        round: simDone ? 'completed' : 'technical',
        question_index: Math.min(nextIdx, totalQuestions),
        total_questions: totalQuestions,
        is_follow_up: false,
        follow_up_count: 0,
        is_completed: simDone,
      };

      setMetrics(simulated);
      setLatencyHistory((prev) => [...prev.slice(-4), simulated.total_round_trip_ms]);
      if (simDone) setIsCompleted(true);
      setCurrentPrompt(simulated.ai_response);
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

  // Interruption
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

  // Simulated Test
  const runSimulatedRoundTrip = async () => {
    setIsProcessing(true);
    setOrbState('thinking');
    setLiveTranscript('I build modular components with clean TypeScript abstractions.');
    await sendAudioToVoiceLoop(new Blob([new Uint8Array(2000)], { type: 'audio/wav' }));
  };

  // Speaker Sound Test
  const testSpeakerAudio = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.3);

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

  // Camera Toggle
  const toggleCameraCheck = async () => {
    if (cameraActive) {
      if (cameraTrackerRef.current) {
        cameraTrackerRef.current.stop();
        cameraTrackerRef.current = null;
      }
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
          videoPreviewRef.current.onloadedmetadata = () => {
            if (videoPreviewRef.current && id) {
              const tracker = new CameraMetricsTracker(id, (fb) => {
                setCameraMetrics(fb);
              });
              tracker.start(videoPreviewRef.current);
              cameraTrackerRef.current = tracker;
            }
          };
        }
        setCameraActive(true);
      } catch {
        setError('Camera permission denied or camera device unavailable.');
      }
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8 space-y-6 bg-white min-h-[calc(100vh-4rem)]">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Stage & Round Progress Tracker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {tokenData && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{tokenData.room_name}</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/80 text-xs font-medium">
            <span className="uppercase text-[11px] text-indigo-700 font-bold tracking-wider">
              {currentRound}
            </span>
            <span className="text-indigo-300">|</span>
            <span className="text-slate-700 font-semibold">
              Question {questionIndex} of {totalQuestions}
            </span>
            {isFollowUp && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300">
                Probe {followUpCount}/2
              </span>
            )}
          </div>

          <button
            onClick={() => setShowDeviceCheck(!showDeviceCheck)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-sm transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-indigo-600" />
            <span>Equipment</span>
          </button>
        </div>
      </div>

      {/* Current Question Prompt Center */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-white to-cyan-50/70 border border-indigo-100 shadow-soft relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5 shadow-sm shadow-indigo-600/30">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-100/60 px-2 py-0.5 rounded">
                AI Interviewer Question
              </span>
              {isFollowUp && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  Adaptive Probing
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg text-slate-900 font-medium leading-relaxed">
              {currentPrompt}
            </p>
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Interview Session Completed!
            </h3>
            <p className="text-xs text-emerald-700">
              All question rounds, follow-up probes, and speech analytics have been recorded.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to={`/interview/${id}/report`}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Award className="h-4 w-4" />
              <span>View Full Report</span>
            </Link>
            <Link
              to="/dashboard"
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </div>
      )}

      {/* Pre-Interview Device Check Accordion */}
      {showDeviceCheck && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Hardware Equipment Diagnostic
              </h3>
            </div>
            <button
              onClick={() => setShowDeviceCheck(false)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              Done Testing
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Mic */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Mic className="h-3.5 w-3.5 text-emerald-600" /> Microphone
                </span>
                {micTested ? (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Ready
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">Untested</span>
                )}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${micLevel}%` }}
                  className="h-full bg-emerald-500 transition-all duration-75"
                />
              </div>
            </div>

            {/* Speaker */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Volume2 className="h-3.5 w-3.5 text-indigo-600" /> Audio Chime
                </span>
                {speakerTested && (
                  <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <button
                onClick={testSpeakerAudio}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors"
              >
                Play Test Chime
              </button>
            </div>

            {/* Camera */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Camera className="h-3.5 w-3.5 text-cyan-600" /> Camera Feed
                </span>
                {cameraActive && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Live
                  </span>
                )}
              </div>
              <div className="relative w-full h-14 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                <video
                  ref={videoPreviewRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />
                {!cameraActive && (
                  <span className="text-[10px] text-slate-400">Preview inactive</span>
                )}
              </div>
              <button
                onClick={toggleCameraCheck}
                className="w-full py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                {cameraActive ? (
                  <>
                    <CameraOff className="h-3 w-3 text-rose-600" /> Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="h-3 w-3 text-indigo-600" /> Start Preview
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Aurora Orb & Audio Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-8 rounded-3xl border border-slate-200 bg-white shadow-soft relative overflow-hidden flex flex-col items-center justify-center min-h-[460px]">
            {/* Ambient Background Aura on White */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                orbState === 'speaking'
                  ? 'bg-radial-gradient from-cyan-100/70 via-indigo-50/50 to-transparent opacity-90'
                  : orbState === 'listening'
                  ? 'bg-radial-gradient from-emerald-100/70 via-teal-50/50 to-transparent opacity-90'
                  : orbState === 'thinking'
                  ? 'bg-radial-gradient from-purple-100/80 via-pink-50/50 to-transparent opacity-90'
                  : 'bg-radial-gradient from-slate-100/60 to-transparent opacity-60'
              }`}
            />

            {/* Aurora Orb Centerpiece */}
            <div className="relative flex items-center justify-center my-6 select-none">
              <div
                style={{
                  transform: `scale(${1 + (micLevel / 100) * 0.4})`,
                }}
                className={`w-52 h-52 rounded-full blur-2xl transition-all duration-300 ${
                  orbState === 'speaking'
                    ? 'bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 opacity-70 animate-pulse'
                    : orbState === 'listening'
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 opacity-70'
                    : orbState === 'thinking'
                    ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-80 animate-spin'
                    : 'bg-indigo-200/60 opacity-50'
                }`}
              />

              {/* Core Orb Sphere */}
              <div
                className={`relative w-40 h-40 rounded-full border border-white/80 shadow-2xl flex items-center justify-center transition-all duration-500 ${
                  orbState === 'speaking'
                    ? 'bg-gradient-to-br from-cyan-400 via-teal-400 to-indigo-600 shadow-cyan-500/40 scale-105'
                    : orbState === 'listening'
                    ? 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 shadow-emerald-500/35 scale-100'
                    : orbState === 'thinking'
                    ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/40 scale-95'
                    : 'bg-gradient-to-br from-slate-100 via-indigo-50 to-slate-200 shadow-inner'
                }`}
              >
                {orbState === 'speaking' && <Volume2 className="h-12 w-12 text-white animate-pulse" />}
                {orbState === 'listening' && <Mic className="h-12 w-12 text-white animate-bounce" />}
                {orbState === 'thinking' && <Sparkles className="h-12 w-12 text-white animate-spin" />}
                {orbState === 'idle' && <Radio className="h-10 w-10 text-indigo-500" />}
              </div>
            </div>

            {/* Orb State Indicator Badge */}
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <span
                className={`text-xs uppercase font-mono tracking-widest font-bold px-3.5 py-1 rounded-full border transition-colors ${
                  orbState === 'speaking'
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : orbState === 'listening'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : orbState === 'thinking'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {orbState}
              </span>
              <p className="text-xs text-slate-500 font-medium">
                {orbState === 'speaking' && 'Interviewer is speaking aloud...'}
                {orbState === 'listening' && 'Listening to your spoken response...'}
                {orbState === 'thinking' && 'LLM Brain evaluating depth & preparing response...'}
                {orbState === 'idle' && 'Click "Speak Answer" to begin your response'}
              </p>
            </div>

            {/* Dual-Engine Live Captions Display */}
            {isRecording && (
              <div className="w-full max-w-md mt-5 p-3.5 rounded-2xl bg-slate-50 border border-emerald-300 text-center space-y-1">
                <span className="text-[10px] uppercase font-mono text-emerald-700 font-bold tracking-wider flex items-center justify-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  Live Speech ({isWebSpeechSupported ? 'Web Speech API' : 'Whisper STT'})
                </span>
                <p className="text-xs text-slate-800 min-h-[20px] font-medium italic">
                  {liveTranscript || 'Start speaking your answer...'}
                </p>
              </div>
            )}

            {/* Mic Volume Level Bar */}
            {isRecording && (
              <div className="w-full max-w-xs mt-4 space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>Input Volume</span>
                  <span>{micLevel}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${micLevel}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-75"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-soft">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing || isCompleted}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Speak Answer (Record Mic)
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 hover:shadow-rose-600/30 transition-all flex items-center gap-2 animate-pulse"
              >
                <Square className="h-4 w-4 fill-current" />
                Done Speaking (Send Answer)
              </button>
            )}

            <button
              onClick={runSimulatedRoundTrip}
              disabled={isRecording || isProcessing || isCompleted}
              className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Zap className="h-3.5 w-3.5 text-indigo-600" />
              Simulate Answer
            </button>

            {orbState === 'speaking' && (
              <button
                onClick={triggerInterruption}
                className="px-4 py-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                <VolumeX className="h-3.5 w-3.5" />
                Interrupt Interviewer
              </button>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Right Column: Latency Telemetry & Vision Cues (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Telemetry Card */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Gauge className="h-4 w-4 text-indigo-600" />
                Round-Trip Telemetry
              </h2>
              <span className="text-[11px] font-mono font-semibold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                Phase 4 Adaptive
              </span>
            </div>

            {metrics ? (
              <div className="space-y-3 font-mono text-xs">
                {/* Total Latency */}
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/60 flex items-center justify-between">
                  <span className="text-slate-600 font-sans font-medium">Turn Turnaround:</span>
                  <span className="text-lg font-bold text-indigo-700">
                    {metrics.total_round_trip_ms} ms
                  </span>
                </div>

                {/* Sub-steps */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Groq Whisper STT:</span>
                    <span className="text-slate-900 font-bold">{metrics.stt_latency_ms} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Gemini 2.0 Brain:</span>
                    <span className="text-slate-900 font-bold">{metrics.llm_latency_ms} ms</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">First Audio Chunk:</span>
                    <span className="text-emerald-600 font-bold">
                      {metrics.time_to_first_audio_ms} ms
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[10px]">Answer Quality:</span>
                    <span className="text-indigo-600 font-bold">
                      {metrics.quality_score ?? 75}/100
                    </span>
                  </div>
                </div>

                {latencyHistory.length > 1 && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span>Recent turns:</span>
                    <div className="flex gap-1.5">
                      {latencyHistory.map((val, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono font-semibold"
                        >
                          {Math.round(val)}ms
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Speak your answer or click &quot;Simulate Answer&quot; to advance turns.
              </div>
            )}
          </div>

          {/* Privacy-Preserving Body Language Telemetry */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                Non-Verbal Cues (Vision)
              </h2>
              <span className="text-[10px] font-mono font-semibold text-emerald-700 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Zero Video Saved
              </span>
            </div>

            {/* Live Indicator Gauges */}
            <div className="space-y-3.5 text-xs">
              {/* Eye Contact */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    Eye Contact &amp; Focus
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {cameraMetrics.eyeContact}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${cameraMetrics.eyeContact}%` }}
                    className="h-full bg-indigo-600 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Head Stability */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-cyan-600" />
                    Head-Pose Stability
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {cameraMetrics.stability}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${cameraMetrics.stability}%` }}
                    className="h-full bg-cyan-600 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Posture */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-emerald-600" />
                    Upright Posture
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {cameraMetrics.posture}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${cameraMetrics.posture}%` }}
                    className="h-full bg-emerald-600 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Expressiveness */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-700 font-medium flex items-center gap-1.5">
                    <Smile className="h-3.5 w-3.5 text-amber-600" />
                    Expressiveness
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {cameraMetrics.expressiveness}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${cameraMetrics.expressiveness}%` }}
                    className="h-full bg-amber-500 transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                {cameraActive ? '● Camera tracking active' : '○ Camera tracking preview disabled'}
              </span>
              <button
                onClick={toggleCameraCheck}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                {cameraActive ? 'Turn Off' : 'Enable Camera'}
              </button>
            </div>
          </div>

          {/* Conversation Turns Log */}
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-soft space-y-4 max-h-[380px] overflow-y-auto">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" />
              Persisted Turns ({turnLogs.length})
            </h2>

            {turnLogs.length > 0 ? (
              <div className="space-y-3 text-xs">
                {turnLogs.map((turn, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-indigo-700 font-bold">
                        Turn #{turn.turn_number} &bull; {turn.round}
                      </span>
                      {turn.is_follow_up && (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                          Follow-up Probe
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-slate-800">
                        <span className="text-slate-400 font-mono text-[10px] font-bold">You: </span>
                        {turn.user_transcript}
                      </p>
                      <p className="text-indigo-900">
                        <span className="text-indigo-500 font-mono text-[10px] font-bold">AI: </span>
                        {turn.ai_response}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No turns recorded yet. Answer the opening prompt to begin!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
