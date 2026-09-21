'use client';

import React, { useState, useEffect } from 'react';
import { X, GitCompare, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, BookOpen, Layers } from 'lucide-react';

interface CreatorApproach {
  channel_name: string;
  approach_title: string;
  video_id: string;
  key_components: Record<string, string>;
  trade_offs: {
    pros: string[];
    cons: string[];
  };
}

interface ComparisonTopicDetail {
  slug: string;
  title: string;
  category: string;
  problem_summary: string;
  key_challenges: string[];
  creators: CreatorApproach[];
}

interface ComparisonTopicItem {
  slug: string;
  title: string;
  category: string;
  creators_count: number;
  key_challenges: string[];
}

interface ComparisonMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
  onSelectVideo?: (videoId: string) => void;
}

export const ComparisonMatrixModal: React.FC<ComparisonMatrixModalProps> = ({
  isOpen,
  onClose,
  apiBase,
  onSelectVideo
}) => {
  const [topics, setTopics] = useState<ComparisonTopicItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('youtube-streaming');
  const [detail, setDetail] = useState<ComparisonTopicDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Load topic list
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${apiBase}/api/comparisons`)
      .then(res => res.json())
      .then(data => {
        setTopics(data);
        if (data.length > 0 && !selectedSlug) {
          setSelectedSlug(data[0].slug);
        }
      })
      .catch(err => console.error('Failed to load comparison topics:', err));
  }, [isOpen, apiBase]);

  // Load detail whenever selectedSlug changes
  useEffect(() => {
    if (!isOpen || !selectedSlug) return;
    setLoading(true);
    fetch(`${apiBase}/api/comparisons/${selectedSlug}`)
      .then(res => res.json())
      .then(data => {
        setDetail(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load comparison detail:', err);
        setLoading(false);
      });
  }, [isOpen, selectedSlug, apiBase]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Cross-Channel Architectural Comparison Matrix
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700 font-normal">
                  Senior & Staff Trade-Offs
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare how different top engineering creators and tech giants solve the exact same system design problem.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Problem Selector Bar */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-950/60 border-b border-slate-800 overflow-x-auto scrollbar-thin">
          <span className="text-xs font-semibold text-slate-400 whitespace-nowrap mr-1">
            System Problem:
          </span>
          {topics.map((t) => (
            <button
              key={t.slug}
              onClick={() => setSelectedSlug(t.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedSlug === t.slug
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
            >
              <span>{t.title}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-indigo-300">
                {t.creators_count} approaches
              </span>
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin bg-slate-900/90">
          {loading || !detail ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm">Loading multi-perspective architectural matrix...</p>
            </div>
          ) : (
            <>
              {/* Problem Brief & Challenges */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                      {detail.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-100">{detail.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                      {detail.problem_summary}
                    </p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 min-w-[280px]">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1 mb-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Core Bottlenecks & Scale
                    </span>
                    <ul className="space-y-1">
                      {detail.key_challenges.map((c, i) => (
                        <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Side-by-side Creator Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {detail.creators.map((creator, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden shadow-lg transition-all"
                  >
                    {/* Creator Header */}
                    <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                          {creator.channel_name}
                        </span>
                        {creator.video_id && creator.video_id !== 'none' && (
                          <button
                            onClick={() => {
                              if (onSelectVideo) onSelectVideo(creator.video_id);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 transition-colors"
                          >
                            <span>Open in Vault</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
                        {creator.approach_title}
                      </h4>
                    </div>

                    {/* Component Table */}
                    <div className="p-4 space-y-3 flex-1">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Architecture Choices
                      </span>
                      <div className="space-y-2 text-xs">
                        {Object.entries(creator.key_components).map(([key, val]) => (
                          <div key={key} className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800/80">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-slate-200 text-xs leading-relaxed font-mono">
                              {val}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Pros */}
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 mb-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Strengths & Advantages
                        </span>
                        <div className="space-y-1">
                          {creator.trade_offs.pros.map((pro, pIdx) => (
                            <div key={pIdx} className="text-[11px] text-slate-300 bg-emerald-950/30 border border-emerald-900/40 rounded px-2 py-1">
                              + {pro}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cons */}
                      <div className="pt-1">
                        <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1 mb-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Weaknesses & Operational Costs
                        </span>
                        <div className="space-y-1">
                          {creator.trade_offs.cons.map((con, cIdx) => (
                            <div key={cIdx} className="text-[11px] text-slate-300 bg-rose-950/30 border border-rose-900/40 rounded px-2 py-1">
                              - {con}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Tip: In senior interviews, mentioning alternative creator approaches demonstrates depth and breadth of industry solutions.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Matrix
          </button>
        </div>

      </div>
    </div>
  );
};
