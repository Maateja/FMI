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
      <div className="container mx-auto max-w-4xl px-4 py-20 flex flex-col items-center justify-center space-y-4 bg-white min-h-[calc(100vh-4rem)]">
        <Sparkles className="h-8 w-8 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-600 font-medium">
          Compiling speech cadence, body language telemetry, and rubric scores...
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center space-y-4 bg-white min-h-[calc(100vh-4rem)]">
        <p className="text-sm font-semibold text-rose-600">{error || 'Report not found'}</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const printUrl = `http://localhost:8000/api/v1/interviews/${id}/report/html`;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-8 bg-white min-h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <a
          href={printUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm transition-colors"
        >
          <Printer className="h-3.5 w-3.5 text-indigo-600" />
          Print / Download PDF
        </a>
      </div>

      {/* Hero Score Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-50/90 via-white to-cyan-50/70 border border-indigo-100 shadow-soft flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full">
            Evaluation Report &bull; Performance Analysis
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Interview Performance Scorecard
          </h1>
          <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
            {report.summary}
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-indigo-100 shadow-md min-w-[150px]">
          <span className="text-5xl font-black text-indigo-600">
            {report.overall_score}
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
            Overall / 100
          </span>
        </div>
      </div>

      {/* Score Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Technical */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Technical Accuracy
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {report.technical_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              style={{ width: `${report.technical_score}%` }}
              className="h-full bg-indigo-600 transition-all duration-500"
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Technical depth, algorithmic correctness, and architecture tradeoffs.
          </p>
        </div>

        {/* Communication */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Communication &amp; Clarity
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {report.communication_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              style={{ width: `${report.communication_score}%` }}
              className="h-full bg-cyan-600 transition-all duration-500"
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Structured pacing ({report.speech_analytics.wpm} WPM) and minimal filler frequency.
          </p>
        </div>

        {/* Body Language */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">
              Body Language &amp; Composure
            </span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              {report.body_language_score}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              style={{ width: `${report.body_language_score}%` }}
              className="h-full bg-emerald-600 transition-all duration-500"
            />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Camera eye contact ({Math.round(report.body_analytics.avg_eye_contact * 100)}%) and posture.
          </p>
        </div>
      </div>

      {/* Analytics Breakdown: Speech & Non-Verbal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Speech Analytics */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-cyan-600" />
            Speech Analytics &amp; Delivery
          </h3>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Pacing (WPM)</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {report.speech_analytics.wpm}
              </span>
              <span className="text-[10px] font-medium text-cyan-700 block mt-0.5">Target: 130 - 160</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Filler Word Rate</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {report.speech_analytics.filler_rate}%
              </span>
              <span className="text-[10px] font-medium text-emerald-700 block mt-0.5">Target: &lt; 3.0%</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Avg Answer Length</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {report.speech_analytics.average_answer_length_seconds}s
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Longest Pause</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {report.speech_analytics.longest_pause_seconds}s
              </span>
            </div>
          </div>

          {Object.keys(report.speech_analytics.filler_words_found).length > 0 && (
            <div className="space-y-1.5 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500">
                Filler Words Frequency:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(report.speech_analytics.filler_words_found).map(([word, cnt]) => (
                  <span
                    key={word}
                    className="px-2.5 py-0.5 rounded-full bg-amber-50 text-[11px] text-amber-800 font-medium border border-amber-200"
                  >
                    &ldquo;{word}&rdquo; &times; {cnt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Non-Verbal Analytics */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600" />
            Non-Verbal Cues (Vision Telemetry)
          </h3>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase flex items-center gap-1">
                <Eye className="h-3 w-3 text-indigo-600" /> Eye Contact
              </span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {Math.round(report.body_analytics.avg_eye_contact * 100)}%
              </span>
              <span className="text-[10px] font-semibold text-indigo-700 block mt-0.5">High Focus</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Head Stability</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {Math.round(report.body_analytics.head_pose_stability * 100)}%
              </span>
              <span className="text-[10px] font-semibold text-teal-700 block mt-0.5">Calm Composure</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Upright Posture</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {Math.round(report.body_analytics.avg_posture * 100)}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] font-semibold uppercase">Expressiveness</span>
              <span className="text-slate-900 font-bold font-mono text-lg">
                {Math.round(report.body_analytics.expressiveness * 100)}%
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Privacy Assurance
            </span>
            <p className="text-[11px] text-emerald-700">
              Vision landmarks were computed client-side in the browser. Zero video frames were saved or transmitted.
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-emerald-50/60 border border-emerald-200 space-y-3 shadow-soft">
          <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            Key Strengths
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {report.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold mt-0.5">&bull;</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-amber-50/60 border border-amber-200 space-y-3 shadow-soft">
          <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            Growth Opportunities
          </h3>
          <ul className="space-y-2 text-xs text-slate-700">
            {report.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-600 font-bold mt-0.5">&bull;</span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Per-Question Detailed Feedback */}
      {report.per_question_feedback.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            Per-Question Rubric Breakdown
          </h3>

          <div className="space-y-4">
            {report.per_question_feedback.map((q) => (
              <div
                key={q.question_number}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-indigo-700 font-bold">
                    Question #{q.question_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-semibold">
                    Score: {q.technical_accuracy_score}/100
                  </span>
                </div>
                <p className="text-slate-900 font-bold text-sm">{q.question_text}</p>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs">
                  <span className="text-slate-400 block font-mono text-[10px] font-bold">Your Response:</span>
                  {q.user_answer_summary}
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-100 text-indigo-950 text-xs">
                  <span className="text-indigo-600 block font-mono text-[10px] font-bold">Model Answer Insights:</span>
                  {q.model_answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Curated Recommendations */}
      {report.recommended_resources.length > 0 && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-600" />
            Curated Skill-Building Resources
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.recommended_resources.map((res) => (
              <div
                key={res.id}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 flex flex-col justify-between text-xs hover:border-indigo-200 transition-colors"
              >
                <div className="space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-sm">{res.title}</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {res.description}
                  </p>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs pt-2"
                >
                  <span>Study Resource</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Link
          to="/dashboard"
          className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
        >
          <Award className="h-4 w-4" />
          <span>Practice Another Mock</span>
        </Link>
      </div>
    </div>
  );
};
