import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  UserCheck,
  Volume2,
} from 'lucide-react';

interface SpeechAnalytics {
  wpm: number;
  filler_rate: number;
  filler_words_found: Record<string, number>;
  pause_count: number;
  longest_pause_seconds: number;
  talk_time_ratio: number;
  average_answer_length_seconds: number;
}

interface BodyAnalytics {
  avg_eye_contact: number;
  avg_posture: number;
  head_pose_stability: number;
  expressiveness: number;
}

interface PerQuestionFeedback {
  question_number: number;
  question_text: string;
  user_answer_summary: string;
  relevance_score: number;
  technical_accuracy_score: number;
  depth_score: number;
  clarity_score: number;
  structure_score: number;
  missed_concepts: string[];
  strengths: string[];
  weaknesses: string[];
  model_answer: string;
}

interface RecommendedResource {
  id: string;
  title: string;
  description: string;
  url: string;
  resource_type: string;
  skill_gap_tag: string;
}

interface ReportData {
  id: string;
  interview_id: string;
  overall_score: number;
  communication_score: number;
  technical_score: number;
  body_language_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  speech_analytics: SpeechAnalytics;
  body_analytics: BodyAnalytics;
  per_question_feedback: PerQuestionFeedback[];
  recommended_resources: RecommendedResource[];
  pdf_url?: string;
  created_at: string;
}

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      if (!id) return;
      setIsLoading(true);
      try {
        const data = await apiRequest<ReportData>(`/interviews/${id}/report`);
        setReport(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <Sparkles className="h-8 w-8 text-cyan-400 animate-spin" />
        <p className="text-sm text-slate-400 font-mono">
          Compiling speech cadence, body language telemetry, and rubric scores...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center space-y-4">
        <p className="text-sm text-rose-400">{error || 'Report not found'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-border text-xs text-slate-200 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const printUrl = `http://localhost:8000/api/v1/interviews/${id}/report/html`;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="text-xs text-muted-foreground hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <a
          href={printUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Print / PDF View
        </a>
      </div>

      {/* Hero Score Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950/40 to-indigo-950/40 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            Evaluation Report &bull; Comprehensive Performance
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Interview Performance Analysis
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            {report.summary}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-inner min-w-[140px]">
          <span className="text-4xl md:text-5xl font-black text-cyan-300">
            {report.overall_score}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 mt-1">
            Overall / 100
          </span>
        </div>
      </div>

      {/* Score Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Technical */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Technical
            </span>
            <span className="text-xl font-bold text-white font-mono">
              {report.technical_score}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${report.technical_score}%` }}
              className="h-full bg-indigo-400"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Depth of answers, correctness, and architecture tradeoffs.
          </p>
        </div>

        {/* Communication */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Communication
            </span>
            <span className="text-xl font-bold text-white font-mono">
              {report.communication_score}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${report.communication_score}%` }}
              className="h-full bg-cyan-400"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Pacing ({report.speech_analytics.wpm} WPM) and low filler frequency.
          </p>
        </div>

        {/* Body Language */}
        <div className="p-5 rounded-2xl bg-card/60 border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-mono">
              Body Language
            </span>
            <span className="text-xl font-bold text-white font-mono">
              {report.body_language_score}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              style={{ width: `${report.body_language_score}%` }}
              className="h-full bg-emerald-400"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Eye contact ({Math.round(report.body_analytics.avg_eye_contact * 100)}%) and posture.
          </p>
        </div>
      </div>

      {/* Analytics Breakdown: Speech & Non-Verbal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speech Analytics */}
        <div className="p-6 rounded-3xl bg-card/60 border border-border space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-cyan-400" />
            Speech Analytics &amp; Delivery
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Pacing (WPM)</span>
              <span className="text-white font-bold font-mono text-base">
                {report.speech_analytics.wpm}
              </span>
              <span className="text-[10px] text-cyan-400 block mt-0.5">Target: 130 - 160</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Filler Rate</span>
              <span className="text-white font-bold font-mono text-base">
                {report.speech_analytics.filler_rate}%
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">Target: &lt; 3.0%</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Avg Answer Length</span>
              <span className="text-white font-bold font-mono text-base">
                {report.speech_analytics.average_answer_length_seconds}s
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Longest Pause</span>
              <span className="text-white font-bold font-mono text-base">
                {report.speech_analytics.longest_pause_seconds}s
              </span>
            </div>
          </div>

          {Object.keys(report.speech_analytics.filler_words_found).length > 0 && (
            <div className="space-y-1 pt-2 border-t border-border/40">
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Filler Words Frequency:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(report.speech_analytics.filler_words_found).map(([word, cnt]) => (
                  <span
                    key={word}
                    className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-amber-300 font-mono"
                  >
                    &ldquo;{word}&rdquo; &times; {cnt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Non-Verbal Analytics */}
        <div className="p-6 rounded-3xl bg-card/60 border border-border space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-400" />
            Non-Verbal Cues (Vision Telemetry)
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px] flex items-center gap-1">
                <Eye className="h-3 w-3 text-cyan-400" /> Eye Contact
              </span>
              <span className="text-white font-bold font-mono text-base">
                {Math.round(report.body_analytics.avg_eye_contact * 100)}%
              </span>
              <span className="text-[10px] text-cyan-400 block mt-0.5">High Focus</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Head Stability</span>
              <span className="text-white font-bold font-mono text-base">
                {Math.round(report.body_analytics.head_pose_stability * 100)}%
              </span>
              <span className="text-[10px] text-teal-400 block mt-0.5">Calm Composure</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Upright Posture</span>
              <span className="text-white font-bold font-mono text-base">
                {Math.round(report.body_analytics.avg_posture * 100)}%
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-border">
              <span className="text-slate-400 block text-[10px]">Expressiveness</span>
              <span className="text-white font-bold font-mono text-base">
                {Math.round(report.body_analytics.expressiveness * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 space-y-1">
            <span className="font-semibold block flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Privacy Assurance
            </span>
            <p className="text-[11px] text-slate-300">
              Vision landmarks were analyzed entirely on your device. Zero video frames were saved or transmitted to any server.
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-card/60 border border-emerald-500/30 space-y-3">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Key Strengths
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">&bull;</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-card/60 border border-amber-500/30 space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Growth Opportunities
          </h3>
          <ul className="space-y-2 text-xs text-slate-200">
            {report.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">&bull;</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-Question Detailed Feedback */}
      {report.per_question_feedback.length > 0 && (
        <div className="p-6 rounded-3xl bg-card/60 border border-border space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="h-4 w-4 text-cyan-400" />
            Per-Question Rubric Breakdown
          </h3>

          <div className="space-y-4">
            {report.per_question_feedback.map((q) => (
              <div
                key={q.question_number}
                className="p-4 rounded-2xl bg-slate-900/60 border border-border space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 font-semibold">
                    Question #{q.question_number}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono">
                    Score: {q.technical_accuracy_score}/100
                  </span>
                </div>
                <p className="text-white font-medium">{q.question_text}</p>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-border/40 text-slate-300 text-[11px]">
                  <span className="text-slate-500 block font-mono text-[10px]">Your Answer:</span>
                  {q.user_answer_summary}
                </div>
                <div className="p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-teal-200 text-[11px]">
                  <span className="text-cyan-400 block font-mono text-[10px]">Model Answer Insights:</span>
                  {q.model_answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Recommendations */}
      {report.recommended_resources.length > 0 && (
        <div className="p-6 rounded-3xl bg-card/60 border border-border space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            Curated Skill-Building Resources
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {report.recommended_resources.map((res) => (
              <div
                key={res.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-border space-y-2 flex flex-col justify-between text-xs"
              >
                <div className="space-y-1">
                  <h4 className="font-semibold text-white">{res.title}</h4>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {res.description}
                  </p>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium text-xs pt-2"
                >
                  <span>Study Resource</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4">
        <Link
          to="/dashboard"
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-border hover:bg-slate-800 text-slate-200 text-xs font-medium transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
        >
          <Award className="h-4 w-4" />
          <span>Practice Another Mock</span>
        </Link>
      </div>
    </div>
  );
};
