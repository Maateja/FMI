import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Activity, Sparkles, ArrowRight, Video, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginDemo } = useAuthStore();

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background Aurora Gradient Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-b from-cyan-500/20 via-indigo-500/10 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-emerald-500/10 blur-[100px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:pt-24 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-xs font-semibold text-cyan-300 mb-8 backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Next-Gen AI Voice Interview Platform for College Freshers</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-white max-w-4xl mx-auto leading-tight"
        >
          Master your campus interviews with realistic{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            AI Voice practice
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          No robotic avatars. Experience an audio-reactive Aurora orb interviewer that speaks, listens, adapts follow-up questions, and coaches your technical gaps and body language.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
            >
              Go to Your Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all"
              >
                Start Practicing Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => loginDemo('Frontend Developer')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-border bg-card/60 backdrop-blur text-white font-medium hover:bg-card hover:border-cyan-500/40 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 text-cyan-400" />
                Try Instant Demo Login
              </button>
            </>
          )}
        </motion.div>

        {/* Aurora Orb Visual Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 relative mx-auto max-w-xl p-8 rounded-3xl border border-cyan-500/20 bg-slate-900/60 backdrop-blur-xl shadow-2xl"
        >
          <div className="flex flex-col items-center">
            {/* Simulated Orb glow */}
            <div className="relative flex items-center justify-center w-36 h-36">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 blur-xl opacity-70 animate-aurora-glow" />
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-cyan-400 via-teal-400 to-indigo-500 shadow-inner flex items-center justify-center border border-white/20">
                <Mic className="h-8 w-8 text-white/90 animate-pulse" />
              </div>
            </div>

            <div className="mt-6 text-center">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold">
                Interviewer State: Speaking
              </span>
              <p className="mt-2 text-base text-slate-200 font-medium max-w-md">
                "Welcome! Let's start with a classic: Can you explain how the JavaScript Event Loop coordinates the call stack and microtask queue?"
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="container mx-auto max-w-6xl px-4 py-16 border-t border-border/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur space-y-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Mic className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Realistic Voice Loop</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Powered by LiveKit WebRTC, Silero VAD, Groq Whisper STT, and Kokoro neural voice with natural conversational interruption handling.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur space-y-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Private Vision Metrics</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              MediaPipe calculates eye-contact, posture, and stability directly in your browser. Zero raw video ever leaves your computer.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-border/60 bg-card/40 backdrop-blur space-y-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Actionable Scorecards</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Structured feedback on filler words, WPM, and technical accuracy, with tailored learning resources and PDF export.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
