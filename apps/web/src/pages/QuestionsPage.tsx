import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { BookOpen, Search, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

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
        setQuestions([]);
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
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-cyan-400" />
            Interview Question Bank
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore questions drawn by the AI interviewer during mock rounds.
          </p>
        </div>

        {/* Domain Filter */}
        <div className="flex items-center gap-2">
          {['all', 'frontend', 'backend', 'hr'].map((domain) => (
            <button
              key={domain}
              onClick={() => setFilterDomain(domain)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                filterDomain === domain
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-card border border-border text-slate-300 hover:border-slate-600'
              }`}
            >
              {domain}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by topic (e.g. React, Event Loop, REST, Conflict)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Question List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
          Loading questions...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">
          No matching questions found in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl border border-border/80 bg-card/40 backdrop-blur space-y-3 transition-colors"
              >
                <div
                  className="flex items-start justify-between cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
                        {item.category}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.domain}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white mt-1">
                      {item.question_text}
                    </h3>
                  </div>
                  <button className="text-slate-400 hover:text-white shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-border/40 space-y-3 text-xs">
                    <div>
                      <span className="font-semibold text-cyan-300 block mb-1">
                        Expected Key Points:
                      </span>
                      <ul className="space-y-1">
                        {item.expected_key_points.map((pt, i) => (
                          <li key={i} className="text-slate-300 flex items-start gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {item.model_answer && (
                      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300">
                        <span className="font-semibold text-slate-400 block mb-1">Model Answer Overview:</span>
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

