import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  CheckCircle2,
  Calendar,
  FileText,
  BarChart2,
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
        setInterviews([
          {
            id: 'mock-sample-01',
            target_role: 'Frontend Developer',
            difficulty: 'Fresher',
            status: 'completed',
            duration_seconds: 480,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ]);
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
      navigate(`/interview/${interview.id}`);
    } catch {
      const dummyId = `mock-${Date.now()}`;
      navigate(`/interview/${dummyId}`);
    } finally {
      setStarting(false);
    }
  };

  const tracks = [
    {
      role: 'Frontend Developer',
      difficulty: 'Fresher',
      tags: ['React 19', 'TypeScript', 'DOM', 'CSS Grid', 'Web Performance'],
      color: 'border-indigo-100 hover:border-indigo-300',
      iconColor: 'bg-indigo-50 text-indigo-600',
      totalQuestions: 4,
      avgDuration: '15 mins',
    },
    {
      role: 'Backend Developer',
      difficulty: 'Fresher',
      tags: ['FastAPI', 'PostgreSQL', 'JWT', 'REST API', 'Indexing'],
      color: 'border-cyan-100 hover:border-cyan-300',
      iconColor: 'bg-cyan-50 text-cyan-600',
      totalQuestions: 4,
      avgDuration: '15 mins',
    },
    {
      role: 'Data & Machine Learning',
      difficulty: 'Fresher',
      tags: ['Pandas', 'Classification', 'SQL', 'Loss Functions'],
      color: 'border-emerald-100 hover:border-emerald-300',
      iconColor: 'bg-emerald-50 text-emerald-600',
      totalQuestions: 4,
      avgDuration: '15 mins',
    },
    {
      role: 'HR & Behavioral',
      difficulty: 'Fresher',
      tags: ['STAR Technique', 'Conflict', 'Strengths', 'Career Goals'],
      color: 'border-amber-100 hover:border-amber-300',
      iconColor: 'bg-amber-50 text-amber-600',
      totalQuestions: 3,
      avgDuration: '10 mins',
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 bg-white min-h-[calc(100vh-4rem)]">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-cyan-50/50 p-6 sm:p-8 shadow-soft">
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Campus Placement Readiness Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.fullName || 'Candidate'}!
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Targeting <span className="text-indigo-600 font-semibold">{user?.targetRole || 'Software Engineer'}</span>. Practice realistic voice rounds with our interactive 3D AI interviewers.
            </p>
          </div>

          <button
            onClick={() => handleStartInterview(user?.targetRole || 'Frontend Developer')}
            disabled={starting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            <Mic className="h-4 w-4" />
            {starting ? 'Initializing Room...' : 'Start Quick Mock'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Completed Sessions</span>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">{interviews.length}</span>
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> +1 this week
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Communication</span>
            <div className="h-9 w-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">88%</span>
            <span className="text-xs font-medium text-slate-500">WPM: 135 (Optimal)</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Body Language</span>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">92%</span>
            <span className="text-xs font-semibold text-emerald-600">Eye contact steady</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily Free Quota</span>
            <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900">4 / 5</span>
            <span className="text-xs font-medium text-slate-500">Rounds available</span>
          </div>
        </div>
      </div>

      {/* Practice Tracks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recommended Placement Tracks</h2>
            <p className="text-xs text-slate-500">Select a specialized track tailored for freshers and campus recruitments</p>
          </div>
          <Link to="/questions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            Browse all topics <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tracks.map((track) => (
            <div
              key={track.role}
              className={`p-6 rounded-2xl border bg-white shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all flex flex-col justify-between ${track.color}`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {track.difficulty}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {track.avgDuration}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{track.role}</h3>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {track.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{track.totalQuestions} Questions</span>
                <button
                  onClick={() => handleStartInterview(track.role)}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition-colors flex items-center gap-1"
                >
                  <Play className="h-3 w-3 fill-current" /> Start
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Interviews History */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Your Recent Mock Sessions</h2>

        {loading ? (
          <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50/50 text-center text-xs text-slate-400 animate-pulse">
            Loading recent mock sessions...
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
            <BarChart2 className="h-8 w-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No mock sessions completed yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start your first session today to get personalized speech speed analytics, filler word reports, and body language feedback.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-soft">
            <div className="divide-y divide-slate-100">
              {interviews.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{item.target_role}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {Math.round(item.duration_seconds / 60) || 8} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Link
                      to={`/interview/${item.id}/report`}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Report
                    </Link>
                    <Link
                      to={`/interview/${item.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors flex items-center gap-1"
                    >
                      Resume
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
