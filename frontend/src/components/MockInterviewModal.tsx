'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Clock, CheckSquare, Square, Calculator, Layers, Award, ChevronRight, Save, Check } from 'lucide-react';

interface MockPhase {
  phase_id: string;
  name: string;
  recommended_minutes: number;
  goal: string;
  checklist: string[];
}

interface MockPrompt {
  id: string;
  title: string;
  difficulty: string;
  target_level: string;
  description: string;
  duration_minutes: number;
  phases: MockPhase[];
  rubric: {
    category: string;
    weight: number;
    description: string;
  }[];
}

interface MockInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiBase: string;
}

export const MockInterviewModal: React.FC<MockInterviewModalProps> = ({
  isOpen,
  onClose,
  apiBase
}) => {
  const [prompts, setPrompts] = useState<MockPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<MockPrompt | null>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  
  // Timer state (in seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(45 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Scratchpad states
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<string>('');
  const [capacityMath, setCapacityMath] = useState<string>('// Quick Estimation Scratchpad\n// Daily Active Users (DAU) = \n// Requests/day = \n// Average QPS = \n// Peak QPS (3x) = \n// Storage per day = \n// 5-Year Storage = ');
  const [architectureMermaid, setArchitectureMermaid] = useState<string>('flowchart TD\n    Client --> LB[Load Balancer]\n    LB --> Gateway[API Gateway]\n    Gateway --> Service[App Service]');
  
  // Rubric scores (out of 10)
  const [rubricScores, setRubricScores] = useState<Record<number, number>>({
    0: 8, 1: 8, 2: 8, 3: 8, 4: 8
  });
  const [sessionSaved, setSessionSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Load prompts
  useEffect(() => {
    if (!isOpen) return;
    fetch(`${apiBase}/api/mock-interview/prompts`)
      .then(res => res.json())
      .then((data: MockPrompt[]) => {
        setPrompts(data);
        if (data.length > 0 && !selectedPrompt) {
          setSelectedPrompt(data[0]);
        }
      })
      .catch(err => console.error('Failed to load mock prompts:', err));
  }, [isOpen, apiBase]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(45 * 60);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveSession = async () => {
    if (!selectedPrompt) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/mock-interview/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_slug: selectedPrompt.id,
          title: selectedPrompt.title,
          current_phase: selectedPrompt.phases[activePhaseIndex]?.phase_id || 'completed',
          notes,
          capacity_math: capacityMath,
          architecture_mermaid: architectureMermaid,
          rubric_scores: JSON.stringify(rubricScores),
          status: 'completed'
        })
      });
      if (res.ok) {
        setSessionSaved(true);
        setTimeout(() => setSessionSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save mock interview session:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentPhase = selectedPrompt?.phases[activePhaseIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold text-slate-100">
                  45-Minute Mock Interview Simulation Mode
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Senior / Staff Bar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Paced 5-phase execution timer, capacity scratchpad, architecture whiteboard & self-evaluation rubric.
              </p>
            </div>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-xl">
              <span className={`font-mono text-xl font-bold ${
                secondsRemaining < 300 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}>
                {formatTime(secondsRemaining)}
              </span>
              <button
                onClick={toggleTimer}
                className={`p-1.5 rounded-lg text-white ${
                  isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                } transition-colors`}
                title={isRunning ? 'Pause' : 'Start Timer'}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={resetTimer}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset to 45:00"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prompt Selector Bar */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/70 border-b border-slate-800 overflow-x-auto text-xs scrollbar-thin">
          <span className="font-semibold text-slate-400 whitespace-nowrap">Scenario:</span>
          {prompts.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPrompt(p);
                setActivePhaseIndex(0);
                resetTimer();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedPrompt?.id === p.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* 5-Phase Guided Stepper */}
        {selectedPrompt && (
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800 overflow-x-auto gap-2 text-xs scrollbar-thin">
            {selectedPrompt.phases.map((phase, idx) => (
              <button
                key={phase.phase_id}
                onClick={() => setActivePhaseIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  activePhaseIndex === idx
                    ? 'bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  activePhaseIndex === idx ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {idx + 1}
                </span>
                <span>{phase.name}</span>
                <span className="text-[10px] text-slate-500">({phase.recommended_minutes}m)</span>
              </button>
            ))}
          </div>
        )}

        {/* Main Workspace Split Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Column: Phase Guidance & Checklist */}
          <div className="w-1/2 flex flex-col border-r border-slate-800 bg-slate-950/80 p-5 overflow-y-auto space-y-5 scrollbar-thin">
            {currentPhase && (
              <>
                <div className="space-y-1 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Target Time: {currentPhase.recommended_minutes} Minutes
                    </span>
                    <span className="text-xs text-slate-400">
                      Phase {activePhaseIndex + 1} of 5
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">{currentPhase.name}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{currentPhase.goal}</p>
                </div>

                {/* Phase Checklist */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                    Mandatory Discussion Checklist
                  </span>
                  <div className="space-y-2">
                    {currentPhase.checklist.map((item, idx) => {
                      const itemKey = `${selectedPrompt?.id}-${currentPhase.phase_id}-${idx}`;
                      const isChecked = !!checkedItems[itemKey];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(itemKey)}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          )}
                          <span className="text-xs leading-relaxed">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Candidate Interview Notes */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Candidate Live Interview Notes:
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-36 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none font-mono"
                    placeholder="Type assumptions, client API contracts, data models, or key trade-offs discussed with the interviewer..."
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column: Capacity Calculator & Live Whiteboard Sketchpad */}
          <div className="w-1/2 flex flex-col bg-slate-900/60 overflow-y-auto p-5 space-y-5 scrollbar-thin">
            
            {/* Capacity Math Scratchpad */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-400" />
                  Capacity Math & Estimation Pad
                </span>
                <span className="text-[11px] text-slate-500 font-mono">1M/day ≈ 12 QPS</span>
              </div>
              <textarea
                value={capacityMath}
                onChange={(e) => setCapacityMath(e.target.value)}
                className="w-full h-32 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 leading-relaxed focus:outline-none focus:border-emerald-500 resize-none"
                placeholder="Perform math here..."
              />
            </div>

            {/* Architecture Mermaid Whiteboard */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Architecture Whiteboard (Mermaid)
                </span>
                <span className="text-[11px] text-slate-500">Draft your system design</span>
              </div>
              <textarea
                value={architectureMermaid}
                onChange={(e) => setArchitectureMermaid(e.target.value)}
                className="w-full flex-1 min-h-[140px] p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-sky-300 leading-relaxed focus:outline-none focus:border-sky-500 resize-none"
                placeholder="flowchart TD..."
              />
            </div>

            {/* Evaluation Rubric */}
            {selectedPrompt && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Self-Evaluation Rubric (Score 1 - 10)
                </span>
                <div className="space-y-2.5">
                  {selectedPrompt.rubric.map((r, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-slate-300 truncate max-w-[260px]">{r.category} ({r.weight}%)</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={rubricScores[i] || 8}
                          onChange={(e) => setRubricScores({ ...rubricScores, [i]: parseInt(e.target.value) })}
                          className="w-24 accent-emerald-500"
                        />
                        <span className="w-6 text-right font-mono font-bold text-emerald-400">
                          {rubricScores[i] || 8}/10
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer Controls */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActivePhaseIndex(prev => Math.max(0, prev - 1))}
              disabled={activePhaseIndex === 0}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              Previous Phase
            </button>
            <button
              onClick={() => setActivePhaseIndex(prev => Math.min((selectedPrompt?.phases.length || 1) - 1, prev + 1))}
              disabled={!selectedPrompt || activePhaseIndex === selectedPrompt.phases.length - 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              Next Phase
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSession}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors disabled:opacity-50"
            >
              {sessionSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{sessionSaved ? 'Rehearsal Saved!' : isSaving ? 'Saving...' : 'Complete & Log Rehearsal'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              Exit Mock
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
