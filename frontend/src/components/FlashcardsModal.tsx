'use client';

import React, { useState, useEffect } from 'react';
import { X, Brain, CheckCircle2, RotateCw, Plus, ArrowRight, Sparkles, Filter, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface FlashcardItem {
  id: number;
  category: string;
  topic_slug: string;
  front: string;
  back: string;
  explanation?: string;
  repetition: number;
  interval_days: number;
  ease_factor: number;
  is_due: boolean;
  next_review_at?: string;
}

interface FlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const FlashcardsModal: React.FC<FlashcardsModalProps> = ({
  isOpen,
  onClose,
  apiBase
}) => {
  const [cards, setCards] = useState<FlashcardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterDueOnly, setFilterDueOnly] = useState<boolean>(false);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // New Card Form State
  const [newFront, setNewFront] = useState<string>('');
  const [newBack, setNewBack] = useState<string>('');
  const [newExplanation, setNewExplanation] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('System Design');

  // Load cards
  const loadCards = () => {
    setLoading(true);
    let url = `${apiBase}/api/flashcards?due_only=${filterDueOnly}`;
    if (selectedCategory !== 'all') {
      url += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setCards(data);
        setCurrentIndex(0);
        setIsRevealed(false);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load flashcards:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) {
      loadCards();
    }
  }, [isOpen, filterDueOnly, selectedCategory]);

  const handleReview = async (quality: number) => {
    if (cards.length === 0) return;
    const currentCard = cards[currentIndex];

    try {
      const res = await fetch(`${apiBase}/api/flashcards/${currentCard.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quality })
      });
      if (res.ok) {
        const updated = await res.json();
        // Update local state
        setCards(prev => prev.map((c, i) => i === currentIndex ? { ...c, ...updated, is_due: false } : c));
        
        // Move to next card
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setCurrentIndex(0);
        }
        setIsRevealed(false);
      }
    } catch (err) {
      console.error('Failed to submit SM-2 review:', err);
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) return;

    try {
      const res = await fetch(`${apiBase}/api/flashcards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          front: newFront,
          back: newBack,
          explanation: newExplanation
        })
      });
      if (res.ok) {
        setNewFront('');
        setNewBack('');
        setNewExplanation('');
        setShowAddForm(false);
        loadCards();
      }
    } catch (err) {
      console.error('Failed to create flashcard:', err);
    }
  };

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const categories = ['all', 'Latency Numbers', 'Capacity Math', 'Caching Patterns', 'Distributed Systems', 'Databases & Storage', 'Message Streaming', 'Resiliency & Fault Tolerance'];
  const dueCount = cards.filter(c => c.is_due).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Spaced Repetition Flashcards
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 font-normal">
                  SuperMemo-2 (SM-2)
                </span>
                {dueCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-medium animate-pulse">
                    {dueCount} Due for Review
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Scientifically scheduled recall of critical latency numbers, capacity formulas, and storage trade-offs.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Back to Deck' : 'Add Flashcard'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Filters Bar */}
        {!showAddForm && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 overflow-x-auto gap-3 text-xs scrollbar-thin">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-400 whitespace-nowrap">Category:</span>
              <div className="flex items-center gap-1 overflow-x-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white font-medium'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {cat === 'all' ? 'All Cards' : cat}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-1.5 text-slate-300 whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={filterDueOnly}
                onChange={(e) => setFilterDueOnly(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-[11px]">Due Only</span>
            </label>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-900/95">
          {showAddForm ? (
            /* Add Flashcard Form */
            <form onSubmit={handleCreateCard} className="w-full max-w-xl space-y-4 bg-slate-950 p-6 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" /> Create System Design Flashcard
              </h3>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  placeholder="e.g., Latency Numbers, Distributed Systems"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Front (Question / Prompt)</label>
                <textarea
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  className="w-full h-20 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="e.g. What is the QPS formula for 10M daily requests?"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Back (Core Answer)</label>
                <textarea
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  className="w-full h-24 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="e.g. QPS = 10,000,000 / 100,000 = ~120 QPS..."
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Senior Explanation (Optional Context)</label>
                <textarea
                  value={newExplanation}
                  onChange={(e) => setNewExplanation(e.target.value)}
                  className="w-full h-16 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none"
                  placeholder="Why this matters in FAANG interviews..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                >
                  Save Flashcard
                </button>
              </div>
            </form>
          ) : loading ? (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
              <RotateCw className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm">Loading spaced repetition cards...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Award className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-200">All caught up!</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                You have reviewed all due flashcards in this category. You can uncheck "Due Only" to study ahead of schedule.
              </p>
            </div>
          ) : (
            /* Interactive Flashcard */
            <div className="w-full max-w-2xl flex flex-col gap-4">
              
              {/* Card Meta & Navigation */}
              <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                <span className="font-semibold text-purple-400 bg-purple-950/60 border border-purple-900/60 px-2.5 py-0.5 rounded-full">
                  {currentCard.category}
                </span>
                <div className="flex items-center gap-3">
                  <span>Card {currentIndex + 1} of {cards.length}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (currentIndex > 0) {
                          setCurrentIndex(prev => prev - 1);
                          setIsRevealed(false);
                        }
                      }}
                      disabled={currentIndex === 0}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (currentIndex < cards.length - 1) {
                          setCurrentIndex(prev => prev + 1);
                          setIsRevealed(false);
                        }
                      }}
                      disabled={currentIndex === cards.length - 1}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Flashcard Box */}
              <div
                onClick={() => !isRevealed && setIsRevealed(true)}
                className={`bg-slate-950 border-2 ${
                  isRevealed ? 'border-purple-800/80 shadow-purple-900/20' : 'border-slate-800 hover:border-slate-700 cursor-pointer'
                } rounded-2xl p-6 min-h-[280px] flex flex-col justify-between shadow-xl transition-all duration-300`}
              >
                {/* Question (Front) */}
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Question / Problem
                  </span>
                  <h3 className="text-base md:text-lg font-semibold text-slate-100 leading-relaxed">
                    {currentCard.front}
                  </h3>
                </div>

                {/* Answer Reveal (Back) */}
                {isRevealed ? (
                  <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-200">
                    <div>
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                        Answer & Key Numbers
                      </span>
                      <div className="text-xs md:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-line bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                        {currentCard.back.replace(/\\n/g, '\n')}
                      </div>
                    </div>

                    {currentCard.explanation && (
                      <div className="bg-purple-950/20 border border-purple-900/30 rounded-lg p-3 text-xs text-purple-200">
                        <span className="font-semibold text-purple-300 block mb-0.5">Staff Interview Context:</span>
                        {currentCard.explanation}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8 flex flex-col items-center justify-center py-6 text-slate-500 hover:text-purple-400 transition-colors">
                    <RotateCw className="w-5 h-5 mb-1.5 animate-bounce" />
                    <span className="text-xs font-medium">Click card to reveal answer</span>
                  </div>
                )}

                {/* Card SM-2 Stats Footer */}
                <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Repetition: <strong className="text-slate-300">{currentCard.repetition}</strong></span>
                    <span>Interval: <strong className="text-slate-300">{currentCard.interval_days}d</strong></span>
                    <span>Ease: <strong className="text-slate-300">{currentCard.ease_factor}</strong></span>
                  </div>
                  {currentCard.is_due ? (
                    <span className="text-amber-400 font-medium">Due today</span>
                  ) : (
                    <span className="text-emerald-400">Mastered</span>
                  )}
                </div>
              </div>

              {/* SM-2 Recall Rating Bar (Shown when revealed) */}
              {isRevealed && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <span className="text-xs font-semibold text-slate-300">
                    Rate your recall quality (SM-2 Interval Scheduling):
                  </span>
                  <div className="grid grid-cols-4 gap-2.5 w-full">
                    <button
                      onClick={() => handleReview(1)}
                      className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800 text-rose-300 transition-all text-center"
                    >
                      <span className="font-bold text-xs">Again (1)</span>
                      <span className="text-[10px] text-rose-400/80">Forgot (1d)</span>
                    </button>
                    <button
                      onClick={() => handleReview(3)}
                      className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-800 text-amber-300 transition-all text-center"
                    >
                      <span className="font-bold text-xs">Hard (3)</span>
                      <span className="text-[10px] text-amber-400/80">Struggled</span>
                    </button>
                    <button
                      onClick={() => handleReview(4)}
                      className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-sky-950/60 hover:bg-sky-900/80 border border-sky-800 text-sky-300 transition-all text-center"
                    >
                      <span className="font-bold text-xs">Good (4)</span>
                      <span className="text-[10px] text-sky-400/80">Normal recall</span>
                    </button>
                    <button
                      onClick={() => handleReview(5)}
                      className="flex flex-col items-center py-2.5 px-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800 text-emerald-300 transition-all text-center"
                    >
                      <span className="font-bold text-xs">Easy (5)</span>
                      <span className="text-[10px] text-emerald-400/80">Instant (bonus)</span>
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            The SuperMemo-2 algorithm dynamically calculates when you will be on the verge of forgetting, reinforcing memory right on time.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close Deck
          </button>
        </div>

      </div>
    </div>
  );
};
