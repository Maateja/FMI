import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { apiRequest } from '../services/api';
import {
  Mic,
  Sparkles,
  Play,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface InterviewItem {
  id: string;
  target_role: string;
  difficulty: string;
  status: string;
  duration_seconds: number;
  created_at: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchInterviews() {
      try {
        const data = await apiRequest<InterviewItem[]>('/interviews');
        setInterviews(data);
      } catch {
        // Dev fallback if backend offline
        setInterviews([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInterviews();
  }, []);

  const handleStartInterview = async (role: string, difficulty = 'fresher') => {
    setStarting(true);
    try {
      const interview = await apiRequest<InterviewItem>('/interviews', {
        method: 'POST',
        body: JSON.stringify({
          target_role: role,
          difficulty,
        }),
      });
      // In Phase 3/4, navigate to `/interview/${interview.id}/setup`
      navigate(`/interview/${interview.id}`);
    } catch {
      // In local offline fallback mode, create a local session id
      const dummyId = `mock-${Date.now()}`;
      navigate(`/interview/${dummyId}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 p-6 sm:p-8 backdrop-blur shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-300">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
              <span>Campus Placement Readiness Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.fullName || 'Candidate'}!
            </h1>
            <p className="text-sm text-slate-400 max-w-xl">
              Targeting <span className="text-cyan-400 font-semibold">{user?.targetRole || 'Software Engineer'}</span>. Practice realistic voice rounds with our adaptive Aurora orb.
            </p>
          </div>

          <button
            onClick={() => handleStartInterview(user?.targetRole || 'Frontend Developer')}
            disabled={starting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Mic className="h-4 w-4" />
            {starting ? 'Initializing Room...' : 'Start Quick Mock'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border/80 bg-card/50 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Interviews Completed</span>
            <Layers className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{interviews.length}</div>
          <span className="text-[11px] text-cyan-400/80 font-mono">Limit: 5/day free</span>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card/50 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Score</span>
            <Award className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">82%</div>
          <span className="text-[11px] text-emerald-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Top 15% freshers
          </span>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card/50 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Average Talk WPM</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">138</div>
          <span className="text-[11px] text-slate-400 font-mono">Ideal range: 130-150</span>
        </div>

        <div className="p-5 rounded-2xl border border-border/80 bg-card/50 backdrop-blur space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Eye Contact Score</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">88%</div>
          <span className="text-[11px] text-purple-400 font-mono">MediaPipe on-device</span>
        </div>
      </div>

      {/* Available Interview Tracks */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          Select an Interview Track
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Frontend Track */}
          <div className="p-6 rounded-2xl border border-cyan-500/30 bg-card/60 backdrop-blur flex flex-col justify-between hover:border-cyan-500/60 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Fresher Track
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" /> ~20 min
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                Frontend Developer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Warm-up, behavioral questions, Event Loop, React hooks, CSS layout, and performance optimization with adaptive probing.
              </p>
            </div>

            <button
              onClick={() => handleStartInterview('Frontend Developer')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 font-semibold text-xs text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start Frontend Mock
            </button>
          </div>

          {/* Backend Track */}
          <div className="p-6 rounded-2xl border border-indigo-500/30 bg-card/60 backdrop-blur flex flex-col justify-between hover:border-indigo-500/60 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Fresher Track
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" /> ~20 min
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                Backend Developer
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                RESTful APIs, SQL normalization, B-Tree indexes, JWT authentication, Redis caching, and error handling.
              </p>
            </div>

            <button
              onClick={() => handleStartInterview('Backend Developer')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-500 hover:text-white font-semibold text-xs text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start Backend Mock
            </button>
          </div>

          {/* HR & Behavioral Track */}
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-card/60 backdrop-blur flex flex-col justify-between hover:border-emerald-500/60 transition-all group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Campus Placement
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" /> ~15 min
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                General HR & Behavioral
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Self-introduction, conflict resolution, dealing with failures, ethical decisions, and STAR format behavioral evaluation.
              </p>
            </div>

            <button
              onClick={() => handleStartInterview('Software Engineer (HR Behavioral)')}
              className="mt-6 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-semibold text-xs text-slate-200 transition-all flex items-center justify-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Start HR Behavioral Mock
            </button>
          </div>
        </div>
      </div>

      {/* Past Attempts Table / Feed */}
      <div className="p-6 rounded-3xl border border-border/80 bg-card/40 backdrop-blur space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Your Mock Interview History</h2>
          <span className="text-xs text-slate-400 font-mono">{interviews.length} sessions logged</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Loading recent interviews...
          </div>
        ) : interviews.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
              <Mic className="h-5 w-5" />
            </div>
            <p className="text-sm text-slate-300 font-medium">No interviews recorded yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first voice interview to get detailed AI feedback on communication, technical depth, and body language.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {interviews.map((item) => (
              <div
                key={item.id}
                onClick={() => navigate(`/interviews/${item.id}`)}
                className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-3 rounded-xl cursor-pointer transition-colors"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{item.target_role}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {item.difficulty}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleDateString()} at{' '}
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {item.status}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

