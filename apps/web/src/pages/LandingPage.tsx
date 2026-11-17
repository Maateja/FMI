import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
  Video,
  BarChart3,
  Award,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, loginDemo } = useAuthStore();

  const tracks = [
    {
      title: 'Frontend Developer',
      icon: '⚛️',
      description: 'React 19, TypeScript, browser performance, DOM architecture & accessibility.',
      questions: '15+ Rounds',
      badge: 'Popular',
    },
    {
      title: 'Backend Developer',
      icon: '⚙️',
      description: 'FastAPI, PostgreSQL, indexing, REST API design, caching & distributed systems.',
      questions: '18+ Rounds',
      badge: 'High Demand',
    },
    {
      title: 'Data & Machine Learning',
      icon: '🧠',
      description: 'Python, model evaluation, gradient descent, feature engineering & SQL queries.',
      questions: '12+ Rounds',
      badge: 'New',
    },
    {
      title: 'Campus HR & Behavioral',
      icon: '🤝',
      description: 'STAR methodology, conflict resolution, team leadership & behavioral storytelling.',
      questions: '10+ Rounds',
      badge: 'Essential',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Background Subtle Gradient & Grid Accent */}
      <div className="absolute inset-0 bg-grid-slate pointer-events-none opacity-40 -z-10" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-indigo-100/50 via-cyan-50/40 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 pt-16 pb-20 text-center sm:pt-24 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-200/80 bg-indigo-50/80 text-xs font-semibold text-indigo-700 mb-8 shadow-sm backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-pulse" />
          <span>Next-Gen Voice AI Mock Interviews for College Freshers</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl text-slate-900 max-w-4xl mx-auto leading-[1.12]"
        >
          Master your campus placements with realistic{' '}
          <span className="bg-gradient-to-r from-indigo-600 via-indigo-600 to-cyan-600 bg-clip-text text-transparent">
            AI Voice practice
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
        >
          No robotic avatars or multiple-choice quizzes. Practice live two-way verbal interviews with an audio-reactive Aurora orb that listens, challenges your depth, and analyzes your body language.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              Go to Your Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                Start Free Practice
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => loginDemo('Frontend Developer')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold shadow-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5"
              >
                <Zap className="h-4 w-4 text-indigo-600" />
                Try Instant Demo Mode
              </button>
            </>
          )}
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs text-slate-500 font-medium"
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Zero Video Stored (GDPR Private)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-indigo-600" />
            <span>Sub-second Live Speech Feedback</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4 text-cyan-600" />
            <span>Curated Skill-Gap Roadmaps</span>
          </div>
        </motion.div>
      </section>

      {/* Feature Pillars Grid */}
      <section id="features" className="container mx-auto max-w-6xl px-4 py-16 border-t border-slate-200/80">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
            Engineered for Placement Success
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
            Everything you need to crack Day-1 hiring
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            From technical problem solving to non-verbal composure, FMI simulates the real pressure of technical interview panels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-soft hover:shadow-card-hover transition-all">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Adaptive Follow-Up Probing</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              If your explanation is superficial, the AI interviewer dynamically probes deeper into edge cases, architecture trade-offs, and time complexity.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-soft hover:shadow-card-hover transition-all">
            <div className="h-12 w-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-5">
              <Video className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Private Body Language Telemetry</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Client-side MediaPipe landmarking monitors eye contact consistency, head pose stability, and posture without ever uploading raw video frames.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-soft hover:shadow-card-hover transition-all">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Speech & Clarity Analytics</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track words per minute, filler words (um, like, basically), pause frequency, and talk-to-listen ratios with personalized improvement resources.
            </p>
          </div>
        </div>
      </section>

      {/* Curriculum Tracks Section */}
      <section id="curriculum" className="container mx-auto max-w-6xl px-4 py-16 border-t border-slate-200/80">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200/60">
              Curated Tracks
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
              Specialized interview tracks for freshers
            </h2>
          </div>
          <Link
            to="/questions"
            className="mt-4 md:mt-0 text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            Explore all 40+ questions
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tracks.map((track) => (
            <div
              key={track.title}
              className="p-6 rounded-2xl border border-slate-200 bg-white shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{track.icon}</span>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {track.badge}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{track.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{track.description}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{track.questions}</span>
                <span className="text-indigo-600 font-bold">Try Track →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-slate-50 py-12">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900 text-sm">FMI</span>
            <span>— Freshers Mock Interview Platform</span>
          </div>
          <div className="flex items-center space-x-6 font-medium">
            <Link to="/questions" className="hover:text-slate-900 transition-colors">Questions</Link>
            <Link to="/login" className="hover:text-slate-900 transition-colors">Sign In</Link>
            <a href="https://github.com/Maateja/FMI" target="_blank" rel="noreferrer" className="hover:text-slate-900 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
