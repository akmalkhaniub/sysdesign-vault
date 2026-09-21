'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Save, RotateCcw, Copy, Check, Plus, Code, Layers, Sparkles } from 'lucide-react';

interface PaletteSnippet {
  id: string;
  name: string;
  description: string;
  snippet: string;
}

interface ArchitectureCanvasProps {
  videoId: string;
  videoTitle: string;
  theme: 'dark' | 'light';
  apiBase: string;
}

export const ArchitectureCanvas: React.FC<ArchitectureCanvasProps> = ({
  videoId,
  videoTitle,
  theme,
  apiBase
}) => {
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [diagramTitle, setDiagramTitle] = useState<string>('');
  const [palette, setPalette] = useState<PaletteSnippet[]>([]);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const mermaidRef = useRef<any>(null);

  // Load palette & initial diagram
  useEffect(() => {
    fetch(`${apiBase}/api/diagrams/palette`)
      .then(res => res.json())
      .then(data => setPalette(data))
      .catch(err => console.error('Failed to load palette:', err));

    fetch(`${apiBase}/api/diagrams/${videoId}`)
      .then(res => res.json())
      .then(data => {
        setDiagramTitle(data.title || `Architecture: ${videoTitle}`);
        setMermaidCode(data.mermaid_code || '');
        setIsCustom(data.is_custom || false);
      })
      .catch(err => console.error('Failed to load diagram:', err));
  }, [videoId, videoTitle, apiBase]);

  // Dynamically initialize Mermaid on client
  useEffect(() => {
    import('mermaid').then(m => {
      mermaidRef.current = m.default;
      mermaidRef.current.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
        themeVariables: theme === 'dark' ? {
          primaryColor: '#2563eb',
          primaryTextColor: '#f8fafc',
          primaryBorderColor: '#3b82f6',
          lineColor: '#60a5fa',
          secondaryColor: '#059669',
          tertiaryColor: '#1e293b'
        } : {
          primaryColor: '#3b82f6',
          primaryTextColor: '#0f172a',
          primaryBorderColor: '#2563eb',
          lineColor: '#2563eb'
        }
      });
      renderDiagram(mermaidCode);
    });
  }, [theme]);

  // Re-render when mermaidCode changes
  const renderDiagram = async (code: string) => {
    if (!mermaidRef.current || !code.trim()) return;
    try {
      const renderId = `mermaid-svg-${Date.now()}`;
      const { svg } = await mermaidRef.current.render(renderId, code);
      setSvgContent(svg);
      setRenderError(null);
    } catch (err: any) {
      // Syntax error while typing
      setRenderError(err?.message || 'Syntax error in Mermaid diagram');
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      renderDiagram(mermaidCode);
    }, 300);
    return () => clearTimeout(timer);
  }, [mermaidCode]);

  const insertSnippet = (snippet: string) => {
    setMermaidCode(prev => {
      if (!prev.trim()) {
        return `flowchart TD\n${snippet}`;
      }
      return `${prev}\n\n${snippet}`;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/api/diagrams/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: diagramTitle,
          mermaid_code: mermaidCode,
          diagram_type: 'flowchart'
        })
      });
      if (res.ok) {
        setIsCustom(true);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save diagram:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(mermaidCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (confirm('Reset to standard architecture preset?')) {
      try {
        const res = await fetch(`${apiBase}/api/diagrams/${videoId}`);
        const data = await res.json();
        setMermaidCode(data.mermaid_code || '');
        setDiagramTitle(data.title || `Architecture: ${videoTitle}`);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <input
            type="text"
            value={diagramTitle}
            onChange={(e) => setDiagramTitle(e.target.value)}
            className="bg-transparent font-semibold text-sm text-slate-200 border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none px-1"
            placeholder="Diagram Title..."
          />
          {isCustom && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
              Saved Custom
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 rounded ${viewMode === 'split' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 rounded ${viewMode === 'preview' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Visual
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-2 py-1 rounded ${viewMode === 'code' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Editor
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Copy Mermaid Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to Default Preset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saveSuccess ? 'Saved!' : isSaving ? 'Saving...' : 'Save Canvas'}</span>
          </button>
        </div>
      </div>

      {/* Component Palette Snippets Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto text-xs scrollbar-thin">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-amber-400" /> Insert Component:
        </span>
        {palette.map((p) => (
          <button
            key={p.id}
            onClick={() => insertSnippet(p.snippet)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-sky-950 hover:border-sky-700 border border-slate-700/60 text-slate-300 hover:text-sky-300 whitespace-nowrap transition-all"
            title={p.description}
          >
            <Plus className="w-3 h-3 text-sky-400" />
            <span>{p.name}</span>
          </button>
        ))}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code Editor Panel */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'} flex flex-col bg-slate-950/90`}>
            <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-sky-400" /> Mermaid Definition
              </span>
              <span>Live Render Active</span>
            </div>
            <textarea
              value={mermaidCode}
              onChange={(e) => setMermaidCode(e.target.value)}
              className="flex-1 w-full p-3 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none scrollbar-thin"
              placeholder="flowchart TD..."
              spellCheck={false}
            />
            {renderError && (
              <div className="p-2 bg-rose-950/70 border-t border-rose-800/60 text-rose-300 text-[11px] font-mono line-clamp-2">
                ⚠️ {renderError}
              </div>
            )}
          </div>
        )}

        {/* Visual Render Panel */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} flex-1 flex flex-col bg-slate-900/40 relative overflow-auto p-4 items-center justify-center`}>
            {svgContent ? (
              <div
                className="w-full h-full flex items-center justify-center overflow-auto [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div className="text-slate-500 text-xs flex flex-col items-center gap-2">
                <Layers className="w-8 h-8 opacity-40 animate-pulse text-sky-400" />
                <span>Compiling architecture diagram...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
