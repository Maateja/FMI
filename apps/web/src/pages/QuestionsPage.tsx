import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { BookOpen, Search, CheckCircle2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface QuestionItem {
  id: string;
  domain: string;
  difficulty: string;
  category: string;
  question_text: string;
  expected_key_points: string[];
  probing_follow_ups: string[];
  model_answer?: string;
}

export const QuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadQuestions() {
      try {
        const query = filterDomain !== 'all' ? `?domain=${filterDomain}` : '';
        const data = await apiRequest<QuestionItem[]>(`/questions${query}`);
        setQuestions(data);
      } catch {
        // Fallback local question repository
        setQuestions([
          {
            id: 'fe-01',
            domain: 'frontend',
            category: 'React Internals',
            difficulty: 'Fresher',
            question_text: 'Explain the Virtual DOM reconciliation algorithm and how React keys optimize list re-rendering.',
            expected_key_points: [
              'Diffing algorithm heuristics (O(n) complexity vs O(n^3))',
              'Component type comparison and element recycling',
              'Keys providing stable identity across renders',
            ],
            probing_follow_ups: [
              'What happens if an index is used as a key when items are inserted at the start?',
            ],
            model_answer: 'React maintains an in-memory virtual tree. On state updates, it generates a new tree and diffs it against the previous one using key identity to preserve or unmount nodes efficiently.',
          },
          {
            id: 'be-01',
            domain: 'backend',
            category: 'Database Indexing',
            difficulty: 'Fresher',
            question_text: 'What are B-Tree indexes in PostgreSQL, and why might an index scan be skipped by the query planner?',
            expected_key_points: [
              'Balanced tree search with logarithmic O(log N) lookup',
              'Sequential scans favored for small tables or high selectivity',
              'Overhead on writes/updates for maintaining index structures',
            ],
            probing_follow_ups: [
              'How does EXPLAIN ANALYZE help identify missing indexes?',
            ],
            model_answer: 'B-Trees store sorted pointers allowing rapid range and equality searches. The query planner will bypass indexes when table cardinality is small or cost estimation shows sequential scans are cheaper.',
          },
          {
            id: 'hr-01',
            domain: 'hr',
            category: 'Behavioral',
            difficulty: 'Fresher',
            question_text: 'Describe a situation where your project team experienced a disagreement on technical direction. How did you resolve it?',
            expected_key_points: [
              'STAR structure (Situation, Task, Action, Result)',
              'Objective benchmarking instead of personal bias',
              'Team alignment and learning outcome',
            ],
            probing_follow_ups: [
              'What would you do differently if faced with the same disagreement today?',
            ],
            model_answer: 'I focused on evaluating trade-offs by building a quick proof-of-concept benchmark, which depersonalized the conflict and aligned the team around empirical results.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, [filterDomain]);

  const filtered = questions.filter((q) =>
    q.question_text.toLowerCase().includes(search.toLowerCase()) ||
    q.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6 bg-white min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-700 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Placement Preparation Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            Interview Question Bank
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and study official questions drawn by the AI interviewer during mock rounds.
          </p>
        </div>

        {/* Domain Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'frontend', 'backend', 'hr'].map((domain) => (
            <button
              key={domain}
              onClick={() => setFilterDomain(domain)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterDomain === domain
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic (e.g. React, Event Loop, REST, Indexing, Conflict)..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white shadow-sm transition-all"
        />
      </div>

      {/* Question List */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
          Loading question repository...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No matching questions found in this category.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-soft hover:shadow-card-hover space-y-3 transition-all"
              >
                <div
                  className="flex items-start justify-between cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="space-y-1.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-bold">
                        {item.category}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {item.domain}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.question_text}
                    </h3>
                  </div>
                  <button className="text-slate-400 hover:text-slate-700 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-4 border-t border-slate-100 space-y-3.5 text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block mb-1.5">
                        Expected Key Points &amp; Evaluation Criteria:
                      </span>
                      <ul className="space-y-1.5">
                        {item.expected_key_points.map((pt, i) => (
                          <li key={i} className="text-slate-600 flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {item.model_answer && (
                      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-950">
                        <span className="font-bold text-indigo-800 block mb-1">Model Answer Concept:</span>
                        {item.model_answer}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
