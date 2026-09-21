"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  BookOpen,
  Layers,
  Sparkles,
  ExternalLink,
  Clock,
  Video as VideoIcon,
  StickyNote,
  Compass,
  Play,
  CheckCircle2,
  Trash2,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  BookmarkPlus,
  Star,
  PlusCircle,
  Inbox,
  CheckCheck,
  Bookmark,
  Copy,
  Check,
  Bot,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Camera,
  GitCompare,
  X,
  Mic,
  MicOff,
  Radio,
  FastForward,
  Square,
  ListOrdered,
  FileText,
  Download,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  EyeOff
} from "lucide-react";

interface ChannelItem {
  id: string;
  name: string;
  url: string;
  avatar_url?: string;
  channel_yt_id?: string;
}

interface VideoListItem {
  id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  category: string;
  topic_slug: string;
  thumbnail_url: string;
  status: "inbox" | "watch_later" | "watched";
  is_favorite: boolean;
  related_count: number;
  has_transcript: boolean;
  segment_count: number;
}

interface RelatedVideo {
  id: string;
  channel_id: string;
  channel_name: string;
  title: string;
  thumbnail_url: string;
  relation_type: string;
  similarity_note: string;
}

interface Note {
  id: number;
  video_id: string;
  timestamp_sec?: number;
  title: string;
  content: string;
  created_at: string;
}

interface DiagramSnapshot {
  id: number;
  video_id: string;
  timestamp_sec: number;
  caption: string;
  image_url?: string;
  notes?: string;
  created_at: string;
}

interface VideoDetail {
  id: string;
  channel_id: string;
  channel: {
    id: string;
    name: string;
    url: string;
  };
  title: string;
  description: string;
  category: string;
  topic_slug: string;
  thumbnail_url: string;
  status: "inbox" | "watch_later" | "watched";
  is_favorite: boolean;
  related_videos: RelatedVideo[];
  chapters?: ChapterItem[];
  notes: Note[];
  snapshots: DiagramSnapshot[];
}

interface ChapterItem {
  id: number;
  start_time: number;
  title: string;
}

interface TranscriptSegment {
  id?: number;
  start_time: number;
  duration: number;
  text: string;
}

interface ArchitectureSummary {
  title: string;
  topic: string;
  channel: string;
  functional_requirements: string[];
  key_components: { name: string; role: string }[];
  core_tradeoffs: string[];
}

const API_BASE = "http://127.0.0.1:8000/api";

export default function VaultPage() {
  const [isDark, setIsDark] = useState<boolean>(true);
  // Expandable / Collapsible Section States
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isPlayerCollapsed, setIsPlayerCollapsed] = useState<boolean>(false);

  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>("IUrQ5_g3XKs");
  const [videoDetail, setVideoDetail] = useState<VideoDetail | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptSegment[]>([]);
  const [transcriptSearch, setTranscriptSearch] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedChannel, setSelectedChannel] = useState<string>("ALL");
  const [libraryFilter, setLibraryFilter] = useState<"all" | "inbox" | "watch_later" | "watched" | "favorites">("all");
  const [activeTab, setActiveTab] = useState<"transcript" | "related" | "notes" | "llm" | "snapshots">("transcript");
  const [loading, setLoading] = useState<boolean>(true);

  // Multi-video comparison modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [copiedComparePrompt, setCopiedComparePrompt] = useState(false);

  // Diagram Snapshot modal
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotTime, setSnapshotTime] = useState<number>(0);
  const [snapshotCaption, setSnapshotCaption] = useState("");
  const [snapshotNotes, setSnapshotNotes] = useState("");

  // Notes state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");

  // LLM Synthesis state
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFullTranscript, setCopiedFullTranscript] = useState(false);
  const [llmSummary, setLlmSummary] = useState<ArchitectureSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Add Channel Modal state
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelHandle, setNewChannelHandle] = useState("");
  const [syncing, setSyncing] = useState(false);

  // BATCH AUTO-TRANSCRIBER & WEB SPEECH RUNNER STATE
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchQueue, setBatchQueue] = useState<string[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [currentQueueIndex, setCurrentQueueIndex] = useState(0);
  const [recordedSegments, setRecordedSegments] = useState<TranscriptSegment[]>([]);
  const [liveSpokenText, setLiveSpokenText] = useState<string>("");
  const [batchTimerSec, setBatchTimerSec] = useState<number>(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Verbatim Transcript & Chapter Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<"transcript" | "chapters">("transcript");
  const [rawImportText, setRawImportText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [copiedJsHelper, setCopiedJsHelper] = useState(false);
  const [activeCenterView, setActiveCenterView] = useState<"transcript" | "chapters">("transcript");

  // PHASE 1: Global Transcript Search & Obsidian Export State
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState<any[]>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchChannel, setGlobalSearchChannel] = useState("ALL");
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedMarkdownText, setCopiedMarkdownText] = useState(false);

  // Global Ctrl+K / Cmd+K Search Hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowGlobalSearch((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem("vault_theme");
    const dark = saved !== "light";
    setIsDark(dark);
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("vault_theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 1. Fetch video catalog & channels
  const loadVideosAndChannels = async () => {
    setLoading(true);
    try {
      const [vRes, chRes] = await Promise.all([
        fetch(`${API_BASE}/videos`),
        fetch(`${API_BASE}/channels`)
      ]);
      const vData = await vRes.json();
      const chData = await chRes.json();
      setVideos(vData);
      setChannels(chData);
      if (vData.length > 0 && !selectedVideoId) {
        setSelectedVideoId(vData[0].id);
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideosAndChannels();
  }, []);

  // 2. Fetch details and transcripts
  useEffect(() => {
    if (!selectedVideoId) return;

    async function loadDetailAndTranscript() {
      try {
        const [detailRes, transcriptRes] = await Promise.all([
          fetch(`${API_BASE}/videos/${selectedVideoId}`),
          fetch(`${API_BASE}/videos/${selectedVideoId}/transcript`),
        ]);
        if (detailRes.ok) {
          const detail = await detailRes.json();
          setVideoDetail(detail);
        }
        if (transcriptRes.ok) {
          const transcriptData = await transcriptRes.json();
          setTranscripts(transcriptData);
        }
      } catch (err) {
        console.error("Error fetching video details:", err);
      }
    }
    loadDetailAndTranscript();
    setLlmSummary(null);
  }, [selectedVideoId]);

  // Jump player to timestamp
  const seekTo = (seconds: number) => {
    if (iframeRef.current) {
      const base = `https://www.youtube-nocookie.com/embed/${selectedVideoId}?autoplay=1&start=${Math.floor(seconds)}`;
      iframeRef.current.src = base;
    }
  };

  // Update Status
  const updateStatus = async (videoId: string, status?: string, is_favorite?: boolean) => {
    try {
      const payload: any = {};
      if (status !== undefined) payload.status = status;
      if (is_favorite !== undefined) payload.is_favorite = is_favorite;

      const res = await fetch(`${API_BASE}/videos/${videoId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updated = await res.json();
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId ? { ...v, status: updated.status, is_favorite: updated.is_favorite } : v
          )
        );
        if (videoDetail && videoDetail.id === videoId) {
          setVideoDetail({
            ...videoDetail,
            status: updated.status,
            is_favorite: updated.is_favorite,
          });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Sync Subscriptions
  const handleSyncFeeds = async () => {
    setSyncing(true);
    try {
      await fetch(`${API_BASE}/sync`, { method: "POST" });
      await loadVideosAndChannels();
    } catch (err) {
      console.error("Failed to sync:", err);
    } finally {
      setSyncing(false);
    }
  };

  // Add Custom Channel
  const handleAddChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelHandle.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle_or_url: newChannelHandle.trim() }),
      });
      if (res.ok) {
        setShowAddChannel(false);
        setNewChannelHandle("");
        await loadVideosAndChannels();
      }
    } catch (err) {
      console.error("Failed to add channel:", err);
    }
  };

  // Diagram Snapshot
  const handleOpenSnapshotModal = () => {
    setSnapshotTime(0);
    setSnapshotCaption("Key Architecture Diagram / System Topology");
    setSnapshotNotes("");
    setShowSnapshotModal(true);
  };

  const handleSaveSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId || !snapshotCaption.trim()) return;

    try {
      const res = await fetch(`${API_BASE}/videos/${selectedVideoId}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: selectedVideoId,
          timestamp_sec: snapshotTime,
          caption: snapshotCaption,
          notes: snapshotNotes,
        }),
      });
      if (res.ok) {
        const snap = await res.json();
        if (videoDetail) {
          setVideoDetail({
            ...videoDetail,
            snapshots: [...videoDetail.snapshots, snap],
          });
        }
        setShowSnapshotModal(false);
        setActiveTab("snapshots");
      }
    } catch (err) {
      console.error("Failed to save snapshot:", err);
    }
  };

  // Multi-Video Comparison
  const handleRunComparison = async () => {
    if (selectedForCompare.length < 2) return;
    setCompareLoading(true);
    try {
      const res = await fetch(`${API_BASE}/compare-transcripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_ids: selectedForCompare }),
      });
      if (res.ok) {
        const data = await res.json();
        setComparisonResult(data);
      }
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setCompareLoading(false);
    }
  };

  // Web Speech Runner
  const startSpeechRecognition = (currentVidId: string) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Speech Recognition not supported. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const finalClean = transcript.trim();
            if (finalClean) {
              setRecordedSegments((prev) => [
                ...prev,
                {
                  start_time: batchTimerSec,
                  duration: 4.0,
                  text: finalClean,
                },
              ]);
              setLiveSpokenText("");
            }
          } else {
            interim += transcript;
          }
        }
        if (interim) {
          setLiveSpokenText(interim);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== "no-speech" && isBatchRunning) {
          try { recognition.stop(); } catch (_) {}
        }
      };

      recognition.onend = () => {
        if (isBatchRunning) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
      recognitionRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleStartBatchRunner = async () => {
    if (batchQueue.length === 0) {
      alert("Please add at least 1 video to the queue.");
      return;
    }

    // Explicitly prompt for microphone access in browser
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch (permErr) {
      alert("Microphone access is required for Web Speech recognition. Please click the camera/microphone icon in your address bar and choose 'Allow'.");
      return;
    }

    setIsBatchRunning(true);
    setCurrentQueueIndex(0);
    setRecordedSegments([]);
    setBatchTimerSec(0);

    const firstVidId = batchQueue[0];
    setSelectedVideoId(firstVidId);

    timerIntervalRef.current = setInterval(() => {
      setBatchTimerSec((t) => t + 1);
    }, 1000);

    startSpeechRecognition(firstVidId);
  };

  const handleSaveCurrentAndAdvance = async () => {
    const currentVidId = batchQueue[currentQueueIndex];
    if (currentVidId && recordedSegments.length > 0) {
      try {
        await fetch(`${API_BASE}/videos/${currentVidId}/transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: recordedSegments,
            mark_watched: true,
          }),
        });
        loadVideosAndChannels();
      } catch (err) {
        console.error("Failed to save transcript:", err);
      }
    }

    const nextIndex = currentQueueIndex + 1;
    if (nextIndex < batchQueue.length) {
      setCurrentQueueIndex(nextIndex);
      setRecordedSegments([]);
      setBatchTimerSec(0);
      const nextVidId = batchQueue[nextIndex];
      setSelectedVideoId(nextVidId);
    } else {
      setIsBatchRunning(false);
      stopSpeechRecognition();
      alert("Batch transcription completed! All transcripts saved to your vault.");
    }
  };

  const handleStopBatchRunner = async () => {
    setIsBatchRunning(false);
    stopSpeechRecognition();
    const currentVidId = batchQueue[currentQueueIndex];
    if (currentVidId && recordedSegments.length > 0) {
      try {
        await fetch(`${API_BASE}/videos/${currentVidId}/transcript`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: recordedSegments,
            mark_watched: true,
          }),
        });
        loadVideosAndChannels();
      } catch (err) {
        console.error("Failed to save transcript:", err);
      }
    }
  };

  // Download Transcript as .txt
  const handleDownloadTranscript = () => {
    if (!videoDetail || transcripts.length === 0) return;
    const lines = transcripts.map((s) => `[${formatTime(s.start_time)}] ${s.text}`);
    const fullContent = `# ${videoDetail.title}\nChannel: ${videoDetail.channel.name}\n\n` + lines.join("\n");
    const blob = new Blob([fullContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${videoDetail.title.replace(/[^a-zA-Z0-9]/g, "_")}_transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Full Text
  const handleCopyFullTranscript = async () => {
    if (transcripts.length === 0) return;
    const fullText = transcripts.map((s) => s.text).join(" ");
    await navigator.clipboard.writeText(fullText);
    setCopiedFullTranscript(true);
    setTimeout(() => setCopiedFullTranscript(false), 2000);
  };

  // LLM context
  const handleCopyLLMPrompt = async () => {
    if (!selectedVideoId) return;
    try {
      const res = await fetch(`${API_BASE}/videos/${selectedVideoId}/llm-context`);
      if (res.ok) {
        const data = await res.json();
        await navigator.clipboard.writeText(data.prompt_context);
        setCopiedPrompt(true);
        setTimeout(() => setCopiedPrompt(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy LLM context:", err);
    }
  };

  // Generate Architecture Summary
  const handleGenerateSummary = async () => {
    if (!selectedVideoId) return;
    setSummaryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/videos/${selectedVideoId}/summarize`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLlmSummary(data);
      }
    } catch (err) {
      console.error("Failed to generate summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Import Verbatim Transcript Handler
  const handleImportTranscript = async () => {
    if (!selectedVideoId || !rawImportText.trim()) {
      alert("Please paste the transcript text into the box.");
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch(`${API_BASE}/videos/${selectedVideoId}/import-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawImportText }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Import error: ${errData.detail || "Unable to parse transcript"}`);
        return;
      }
      const data = await res.json();
      // Refresh current video details and transcripts
      const [tRes, dRes] = await Promise.all([
        fetch(`${API_BASE}/videos/${selectedVideoId}/transcript`),
        fetch(`${API_BASE}/videos/${selectedVideoId}`),
      ]);
      if (tRes.ok) setTranscripts(await tRes.json());
      if (dRes.ok) setVideoDetail(await dRes.json());
      loadVideosAndChannels();
      setShowImportModal(false);
      setRawImportText("");
      setActiveCenterView("transcript");
      alert(`Success! Imported ${data.segments_saved} verbatim spoken lines into vault.`);
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Import Chapter Milestones Handler
  const handleImportChapters = async () => {
    if (!selectedVideoId || !rawImportText.trim()) {
      alert("Please paste the chapter list into the box.");
      return;
    }
    setIsImporting(true);
    try {
      const res = await fetch(`${API_BASE}/videos/${selectedVideoId}/chapters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: rawImportText }),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Chapter import error: ${errData.detail || "No timestamps detected"}`);
        return;
      }
      const data = await res.json();
      const dRes = await fetch(`${API_BASE}/videos/${selectedVideoId}`);
      if (dRes.ok) setVideoDetail(await dRes.json());
      setShowImportModal(false);
      setRawImportText("");
      setActiveCenterView("chapters");
      alert(`Success! Saved ${data.chapters_saved} milestone chapters.`);
    } catch (err: any) {
      alert(`Failed to import chapters: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Copy 1-Click JS Helper snippet
  const handleCopyJsSnippet = async () => {
    const jsSnippet = `copy(Array.from(document.querySelectorAll('ytd-transcript-segment-renderer')).map(el => el.innerText).join('\\n'))`;
    await navigator.clipboard.writeText(jsSnippet);
    setCopiedJsHelper(true);
    setTimeout(() => setCopiedJsHelper(false), 2500);
  };

  // Phase 1: Search Transcripts Global Handler
  const handleSearchTranscripts = async (q: string, ch: string) => {
    if (!q.trim()) {
      setGlobalSearchResults([]);
      return;
    }
    setGlobalSearchLoading(true);
    try {
      const chParam = ch !== "ALL" ? `&channel_id=${encodeURIComponent(ch)}` : "";
      const res = await fetch(`${API_BASE}/search/transcripts?q=${encodeURIComponent(q)}${chParam}`);
      if (res.ok) {
        const data = await res.json();
        setGlobalSearchResults(data.results || []);
      }
    } catch (err) {
      console.error("Global search error:", err);
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  // Phase 1: Obsidian Exporters
  const handleDownloadSingleMarkdown = () => {
    if (!selectedVideoId) return;
    window.open(`${API_BASE}/export/markdown/${selectedVideoId}`, "_blank");
  };

  const handleDownloadFullVault = () => {
    window.open(`${API_BASE}/export/obsidian-vault`, "_blank");
  };

  const handleCopyMarkdownToClipboard = async () => {
    if (!selectedVideoId) return;
    try {
      const res = await fetch(`${API_BASE}/export/markdown/${selectedVideoId}`);
      if (res.ok) {
        const mdText = await res.text();
        await navigator.clipboard.writeText(mdText);
        setCopiedMarkdownText(true);
        setTimeout(() => setCopiedMarkdownText(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy markdown:", err);
    }
  };

  // Create Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim() || !selectedVideoId) return;

    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: selectedVideoId,
          title: noteTitle,
          content: noteContent,
          timestamp_sec: 0,
        }),
      });
      if (res.ok) {
        const newNote = await res.json();
        if (videoDetail) {
          setVideoDetail({
            ...videoDetail,
            notes: [newNote, ...videoDetail.notes],
          });
        }
        setNoteTitle("");
        setNoteContent("");
      }
    } catch (err) {
      console.error("Failed to add note:", err);
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: number) => {
    try {
      const res = await fetch(`${API_BASE}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (res.ok && videoDetail) {
        setVideoDetail({
          ...videoDetail,
          notes: videoDetail.notes.filter((n) => n.id !== noteId),
        });
      }
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  // Delete Snapshot
  const handleDeleteSnapshot = async (snapId: number) => {
    try {
      const res = await fetch(`${API_BASE}/snapshots/${snapId}`, {
        method: "DELETE",
      });
      if (res.ok && videoDetail) {
        setVideoDetail({
          ...videoDetail,
          snapshots: videoDetail.snapshots.filter((s) => s.id !== snapId),
        });
      }
    } catch (err) {
      console.error("Failed to delete snapshot:", err);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  // Filter videos
  const filteredVideos = videos.filter((v) => {
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.topic_slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.channel_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesChannel =
      selectedChannel === "ALL" || v.channel_id === selectedChannel;

    let matchesLibrary = true;
    if (libraryFilter === "inbox") matchesLibrary = v.status === "inbox";
    else if (libraryFilter === "watch_later") matchesLibrary = v.status === "watch_later";
    else if (libraryFilter === "watched") matchesLibrary = v.status === "watched";
    else if (libraryFilter === "favorites") matchesLibrary = v.is_favorite;

    return matchesSearch && matchesChannel && matchesLibrary;
  });

  const filteredTranscripts = transcripts.filter((s) =>
    s.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 transition-colors">
      {/* 1. Header with Theme Switcher, Auto-Transcriber, Search & Section Toggles */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0d1322] px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          {/* Collapse/Expand Left Sidebar Button */}
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 hover:border-cyan-500 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title={isLeftCollapsed ? "Expand Video Catalog" : "Collapse Video Catalog"}
          >
            {isLeftCollapsed ? <PanelLeftOpen className="w-4 h-4 text-cyan-500" /> : <PanelLeftClose className="w-4 h-4" />}
            <span className="hidden md:inline">{isLeftCollapsed ? "Expand Catalog" : "Collapse Catalog"}</span>
          </button>

          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              System Design Vault
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                Studio
              </span>
            </h1>
          </div>
        </div>

        {/* Center Search Bar with Ctrl+K trigger */}
        <div className="flex-1 max-w-md mx-4 relative cursor-pointer" onClick={() => setShowGlobalSearch(true)}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <div className="w-full bg-slate-100 dark:bg-[#131b2e] border border-slate-200 dark:border-slate-700/60 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between hover:border-cyan-500 transition-all">
            <span className="truncate">Search all transcripts & chapters...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">
              Ctrl+K
            </kbd>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* 📝 Export to Obsidian / Notion Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm"
            title="Export problem notes and chapters to Obsidian or Notion"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export to Obsidian</span>
          </button>

          {/* 🎙️ Batch Auto-Transcriber */}
          <button
            onClick={() => setShowBatchModal(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
          >
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Auto-Transcribe Queue</span>
            {isBatchRunning && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping ml-0.5" />}
          </button>

          {/* Multi-Video Compare Button */}
          <button
            onClick={() => setShowCompareModal(true)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compare</span> ({selectedForCompare.length})
          </button>

          {/* Sync Feed Button */}
          <button
            onClick={handleSyncFeeds}
            disabled={syncing}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Sync all subscribed channels via public RSS"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">{syncing ? "Syncing..." : "Sync Feed"}</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors"
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          {/* Collapse/Expand Right Sidebar Button */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-500 hover:border-cyan-500 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title={isRightCollapsed ? "Expand Knowledge Studio" : "Collapse Knowledge Studio"}
          >
            <span className="hidden md:inline">{isRightCollapsed ? "Expand Studio" : "Collapse Studio"}</span>
            {isRightCollapsed ? <PanelRightOpen className="w-4 h-4 text-cyan-500" /> : <PanelRightClose className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* 2. Main 3-Column Studio Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT COLUMN: Video List Sidebar (Collapsible) */}
        {!isLeftCollapsed ? (
          <aside className="w-80 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0c111d] flex flex-col shrink-0 transition-all z-10">
            {/* Library Status Filters with Clear Done Explanation */}
            <div className="grid grid-cols-4 p-2 gap-1 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100/60 dark:bg-[#0a0f1c]">
              <button
                onClick={() => setLibraryFilter("inbox")}
                className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  libraryFilter === "inbox"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="New unreviewed videos"
              >
                <Inbox className="w-3 h-3" /> Inbox
              </button>
              <button
                onClick={() => setLibraryFilter("watch_later")}
                className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  libraryFilter === "watch_later"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Queue of problems to practice next"
              >
                <Clock className="w-3 h-3" /> Later
              </button>
              <button
                onClick={() => setLibraryFilter("watched")}
                className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  libraryFilter === "watched"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Done = Videos you have completed studying"
              >
                <CheckCheck className="w-3 h-3 text-emerald-500" /> Done
              </button>
              <button
                onClick={() => setLibraryFilter("favorites")}
                className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
                  libraryFilter === "favorites"
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
                title="Starred canonical videos"
              >
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Starred
              </button>
            </div>

            {/* Channel Filters + Prominent "+ Add Channel" Button */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center gap-1 bg-slate-50 dark:bg-[#0f1626]">
              <button
                onClick={() => setSelectedChannel("ALL")}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${
                  selectedChannel === "ALL"
                    ? "bg-cyan-500 text-slate-950 font-bold"
                    : "bg-slate-200 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400"
                }`}
              >
                All
              </button>

              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChannel(ch.id)}
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-all truncate max-w-[120px] ${
                    selectedChannel === ch.id
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-slate-200 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title={ch.name}
                >
                  {ch.name}
                </button>
              ))}

              {/* Explicit + Add Channel Chip */}
              <button
                onClick={() => setShowAddChannel(true)}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                title="Add any YouTube channel handle to watch out for"
              >
                <PlusCircle className="w-3 h-3" />
                + Add Channel
              </button>
            </div>

            {/* Videos Scroll Area with Transcript Indicator Badges */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
              {filteredVideos.map((v) => {
                const isSelected = v.id === selectedVideoId;
                const isCheckedForCompare = selectedForCompare.includes(v.id);

                return (
                  <div
                    key={v.id}
                    className={`p-3 transition-all flex gap-3 group relative cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/10 border-l-4 border-cyan-500"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Compare Select Checkbox */}
                    <input
                      type="checkbox"
                      checked={isCheckedForCompare}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (isCheckedForCompare) {
                          setSelectedForCompare(selectedForCompare.filter((id) => id !== v.id));
                        } else {
                          setSelectedForCompare([...selectedForCompare, v.id]);
                        }
                      }}
                      className="mt-1 rounded text-cyan-500 focus:ring-0 focus:ring-offset-0 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 shrink-0"
                      title="Select for Multi-Video Comparison"
                    />

                    <div
                      onClick={() => setSelectedVideoId(v.id)}
                      className="relative w-20 h-13 rounded-lg overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700/50"
                    >
                      <img
                        src={v.thumbnail_url}
                        alt={v.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>

                    <div
                      onClick={() => setSelectedVideoId(v.id)}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 truncate max-w-[105px]">
                          {v.channel_name}
                        </span>
                        {v.is_favorite && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                        )}
                      </div>
                      <h3 className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
                        {v.title}
                      </h3>

                      {/* Transcript Ready Badge */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        {v.has_transcript ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <FileText className="w-2.5 h-2.5" /> Transcript Ready ({v.segment_count})
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-400">
                            No transcript yet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        ) : (
          /* Collapsed Left Strip Handle */
          <div
            onClick={() => setIsLeftCollapsed(false)}
            className="w-8 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c111d] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex flex-col items-center py-4 gap-4 transition-colors z-10"
            title="Expand Video Catalog"
          >
            <PanelLeftOpen className="w-4 h-4 text-cyan-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 [writing-mode:vertical-lr] rotate-180">
              Video Catalog
            </span>
          </div>
        )}

        {/* CENTER COLUMN: Video Player (Collapsible) + Transcripts (Expandable) */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-[#0a0e17] border-r border-slate-200 dark:border-slate-800/80 transition-all overflow-hidden">
          {/* Collapsible Video Player Section */}
          <div className="p-4 pb-2 transition-all">
            <div className="flex items-center justify-between pb-1.5 mb-1.5">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <VideoIcon className="w-3.5 h-3.5 text-cyan-500" />
                Distraction-Free Player
              </span>
              <button
                onClick={() => setIsPlayerCollapsed(!isPlayerCollapsed)}
                className="text-xs font-semibold px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-cyan-500 flex items-center gap-1 transition-colors shadow-sm"
              >
                {isPlayerCollapsed ? (
                  <>
                    <Eye className="w-3 h-3 text-cyan-500" /> Show Video Player
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" /> Hide Player (Focus on Transcript)
                  </>
                )}
              </button>
            </div>

            {!isPlayerCollapsed && (
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-xl border border-slate-300 dark:border-slate-800 relative transition-all">
                <iframe
                  ref={iframeRef}
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${selectedVideoId}?enablejsapi=1&rel=0&modestbranding=1`}
                  title="System Design Video Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* Video Meta Title & Action Buttons */}
            {videoDetail && (
              <div className="mt-2 flex flex-wrap items-start justify-between gap-3 bg-white dark:bg-[#0d1322] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                      {videoDetail.channel.name}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                      {videoDetail.topic_slug.replace("-", " ")}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {videoDetail.title}
                  </h2>
                </div>

                {/* Status Toggles & Snapshot Capture */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* 📸 Snapshot Diagram Button */}
                  <button
                    onClick={handleOpenSnapshotModal}
                    className="px-2.5 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors shadow-sm"
                    title="Capture discussion point or whiteboard diagram at current timestamp"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Snapshot Diagram
                  </button>

                  {/* Favorite */}
                  <button
                    onClick={() => updateStatus(videoDetail.id, undefined, !videoDetail.is_favorite)}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      videoDetail.is_favorite
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Star / Favorite"
                  >
                    <Star className={`w-3.5 h-3.5 ${videoDetail.is_favorite ? "fill-amber-500" : ""}`} />
                  </button>

                  {/* Watch Later */}
                  <button
                    onClick={() => updateStatus(videoDetail.id, videoDetail.status === "watch_later" ? "inbox" : "watch_later")}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
                      videoDetail.status === "watch_later"
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-600 dark:text-cyan-300"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                    title="Add to study queue"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {videoDetail.status === "watch_later" ? "In Later" : "+ Later"}
                  </button>

                  {/* Mark Watched (Done) */}
                  <button
                    onClick={() => updateStatus(videoDetail.id, videoDetail.status === "watched" ? "inbox" : "watched")}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      videoDetail.status === "watched"
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                    title="Mark as Watched / Completed"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                    {videoDetail.status === "watched" ? "Done (Watched)" : "Mark Done"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Timeline & Transcripts Section */}
          <div className="flex-1 overflow-hidden flex flex-col px-4 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1322] p-2.5 rounded-xl border shadow-sm">
              <div className="flex items-center gap-2">
                {/* View Switcher: Verbatim Transcript vs Chapters */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setActiveCenterView("transcript")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeCenterView === "transcript"
                        ? "bg-white dark:bg-cyan-500 text-slate-900 dark:text-slate-950 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Verbatim Transcript ({transcripts.length})
                  </button>
                  <button
                    onClick={() => setActiveCenterView("chapters")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeCenterView === "chapters"
                        ? "bg-white dark:bg-cyan-500 text-slate-900 dark:text-slate-950 shadow-sm"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Chapters / Roadmap ({videoDetail?.chapters?.length || 0})
                  </button>
                </div>

                {/* Direct Import Button */}
                <button
                  onClick={() => {
                    setImportMode(activeCenterView);
                    setShowImportModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold flex items-center gap-1 hover:bg-indigo-100 transition-colors shadow-sm"
                  title="Import verbatim transcript or chapters copied from YouTube"
                >
                  <Download className="w-3.5 h-3.5 rotate-180" />
                  + Import {activeCenterView === "transcript" ? "Verbatim" : "Chapters"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter lines..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs px-2.5 py-1 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => setActiveTab("transcript")}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Full Reading View →
                </button>
              </div>
            </div>

            {/* Content List: Either Verbatim Transcripts or Milestone Chapters */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-2">
              {activeCenterView === "transcript" ? (
                filteredTranscripts.length > 0 ? (
                  filteredTranscripts.map((seg) => (
                    <button
                      key={seg.id || seg.start_time}
                      onClick={() => seekTo(seg.start_time)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800/70 transition-all flex items-start gap-3 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50 shadow-sm hover:shadow"
                    >
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shrink-0">
                        {formatTime(seg.start_time)}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 group-hover:text-slate-950 dark:group-hover:text-white leading-relaxed">
                        {seg.text}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 py-8">
                    <p>No verbatim transcript lines found for this video.</p>
                    <button
                      onClick={() => {
                        setImportMode("transcript");
                        setShowImportModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-sm"
                    >
                      📥 1-Click Import YouTube Verbatim Transcript
                    </button>
                  </div>
                )
              ) : (
                /* Chapters / Roadmap View */
                videoDetail?.chapters && videoDetail.chapters.length > 0 ? (
                  videoDetail.chapters.map((chap) => (
                    <button
                      key={chap.id}
                      onClick={() => seekTo(chap.start_time)}
                      className="w-full text-left p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-800/70 transition-all flex items-center justify-between group border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors shrink-0">
                          {formatTime(chap.start_time)}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                          {chap.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 font-medium">
                        Seek <FastForward className="w-3 h-3" />
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-2 py-8">
                    <p>No milestone chapters imported yet.</p>
                    <button
                      onClick={() => {
                        setImportMode("chapters");
                        setShowImportModal(true);
                      }}
                      className="text-cyan-500 hover:underline font-bold"
                    >
                      + Import Chapters from YouTube Description
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: 5-Tab Knowledge Studio (Collapsible) */}
        {!isRightCollapsed ? (
          <aside className="w-96 bg-white dark:bg-[#0c111d] flex flex-col shrink-0 transition-all border-l border-slate-200 dark:border-slate-800/80 z-10">
            {/* 5 Studio Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0f1626] p-1.5 gap-1">
              <button
                onClick={() => setActiveTab("transcript")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "transcript"
                    ? "bg-cyan-500 text-slate-950 shadow font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Full continuous transcript document"
              >
                <FileText className="w-3.5 h-3.5" />
                Transcript
              </button>
              <button
                onClick={() => setActiveTab("related")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "related"
                    ? "bg-cyan-500 text-slate-950 shadow font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Alternative solutions on other channels"
              >
                <Compass className="w-3.5 h-3.5" />
                Channels
              </button>
              <button
                onClick={() => setActiveTab("snapshots")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "snapshots"
                    ? "bg-cyan-500 text-slate-950 shadow font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Saved whiteboard diagrams"
              >
                <Camera className="w-3.5 h-3.5" />
                Diagrams
              </button>
              <button
                onClick={() => setActiveTab("llm")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "llm"
                    ? "bg-cyan-500 text-slate-950 shadow font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="LLM context and architecture cheatsheet"
              >
                <Bot className="w-3.5 h-3.5" />
                LLM
              </button>
              <button
                onClick={() => setActiveTab("notes")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                  activeTab === "notes"
                    ? "bg-cyan-500 text-slate-950 shadow font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
                title="Study notes"
              >
                <StickyNote className="w-3.5 h-3.5" />
                Notes
              </button>
            </div>

            {/* TAB 1: Complete Readable Transcript Reader */}
            {activeTab === "transcript" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-500" />
                      Complete Saved Transcript
                    </h5>
                    <span className="text-[10px] text-slate-400">
                      {transcripts.length} segments
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Continuous reading view of the stored transcript. Copy or export anytime.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={handleCopyFullTranscript}
                      className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-sm"
                    >
                      {copiedFullTranscript ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedFullTranscript ? "Copied!" : "Copy Full Text"}
                    </button>
                    <button
                      onClick={handleDownloadTranscript}
                      className="py-1.5 px-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      title="Download transcript as .txt file"
                    >
                      <Download className="w-3.5 h-3.5" /> Download (.txt)
                    </button>
                    <button
                      onClick={() => {
                        setImportMode("transcript");
                        setShowImportModal(true);
                      }}
                      className="col-span-2 py-1.5 px-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5 rotate-180" />
                      📥 Import Verbatim Transcript from YouTube
                    </button>
                  </div>
                </div>

                {/* Continuous Reading Box */}
                <div className="flex-1 overflow-y-auto p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs leading-relaxed space-y-2 font-sans">
                  {transcripts.length > 0 ? (
                    transcripts.map((s, idx) => (
                      <p key={idx} className="text-slate-700 dark:text-slate-300">
                        <button
                          onClick={() => seekTo(s.start_time)}
                          className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 font-bold hover:underline mr-1.5"
                        >
                          [{formatTime(s.start_time)}]
                        </button>
                        {s.text}
                      </p>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      No saved transcript available for this video yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Related Videos on Other Channels */}
            {activeTab === "related" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 mb-2">
                  <h5 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" /> Cross-Channel Problem Comparison
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Compare how ByteByteGo, Gaurav Sen, and other architects solve this problem. Click "Watch This" to switch your player instantly.
                  </p>
                </div>

                {videoDetail && videoDetail.related_videos.length > 0 ? (
                  videoDetail.related_videos.map((rel) => (
                    <div
                      key={rel.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/90 hover:border-cyan-500/50 transition-all flex flex-col gap-2 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 border border-indigo-500/30">
                          {rel.channel_name}
                        </span>
                        <button
                          onClick={() => setSelectedVideoId(rel.id)}
                          className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-cyan-500" /> Watch This
                        </button>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {rel.title}
                      </h4>

                      {rel.similarity_note && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-[#080d16] p-2 rounded-lg border border-slate-200 dark:border-slate-800/50">
                          💡 {rel.similarity_note}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No additional channel videos linked for this topic yet.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Saved Architecture Diagrams / Snapshots */}
            {activeTab === "snapshots" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Saved Architecture Diagrams
                  </span>
                  <button
                    onClick={handleOpenSnapshotModal}
                    className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    + Snapshot Frame
                  </button>
                </div>

                {videoDetail?.snapshots && videoDetail.snapshots.length > 0 ? (
                  videoDetail.snapshots.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 relative group space-y-2 shadow-sm"
                    >
                      <button
                        onClick={() => handleDeleteSnapshot(s.id)}
                        className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete snapshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => seekTo(s.timestamp_sec)}
                          className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-colors"
                        >
                          Jump to {formatTime(s.timestamp_sec)}
                        </button>
                      </div>

                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 pr-6">
                        {s.caption}
                      </h5>

                      {s.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-[#080d16] p-2 rounded-lg border border-slate-200 dark:border-slate-800/50">
                          {s.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No architecture diagrams or whiteboard snapshots captured yet. Click "Snapshot Diagram" while watching to save visual bookmarks.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: LLM Synthesis Studio */}
            {activeTab === "llm" && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
                  <h5 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                    <Bot className="w-4 h-4" /> NotebookLM / LLM Context Export
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Export the entire timecoded transcript to feed into NotebookLM, Claude, ChatGPT, or local LLMs without source restrictions.
                  </p>
                  <button
                    onClick={handleCopyLLMPrompt}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    {copiedPrompt ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    {copiedPrompt ? "Copied Prompt to Clipboard!" : "Copy Full Context for LLM"}
                  </button>
                </div>

                {/* Synthesis Card */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Architecture Blueprint
                    </h5>
                    <button
                      onClick={handleGenerateSummary}
                      disabled={summaryLoading}
                      className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50"
                    >
                      {summaryLoading ? "Analyzing..." : "Generate Synthesis"}
                    </button>
                  </div>

                  {llmSummary ? (
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-cyan-600 dark:text-cyan-400">Functional Goals:</span>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                          {llmSummary.functional_requirements.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Core Components:</span>
                        <div className="space-y-1 mt-1">
                          {llmSummary.key_components.map((c, i) => (
                            <div key={i} className="bg-white dark:bg-[#080d16] p-1.5 rounded border border-slate-200 dark:border-slate-800/60">
                              <strong className="text-slate-800 dark:text-slate-200">{c.name}:</strong>{" "}
                              <span className="text-slate-600 dark:text-slate-400">{c.role}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="font-bold text-amber-600 dark:text-amber-400">Key Trade-offs:</span>
                        <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 mt-1 space-y-0.5">
                          {llmSummary.core_tradeoffs.map((t, i) => (
                            <li key={i}>{t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center py-4">
                      Click "Generate Synthesis" to extract an instant architecture blueprint from this transcript.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Architecture Notes */}
            {activeTab === "notes" && (
              <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                <form
                  onSubmit={handleAddNote}
                  className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80 mb-4 space-y-2.5 shadow-sm"
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <BookmarkPlus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Add Takeaway Note
                  </span>
                  <input
                    type="text"
                    placeholder="Key Trade-off / Architecture point..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full bg-white dark:bg-[#121929] border border-slate-300 dark:border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                  />
                  <textarea
                    placeholder="e.g., Redis Lua script ensures atomic token consumption..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    rows={3}
                    className="w-full bg-white dark:bg-[#121929] border border-slate-300 dark:border-slate-700/60 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                  >
                    Save Note to Vault
                  </button>
                </form>

                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {videoDetail?.notes && videoDetail.notes.length > 0 ? (
                    videoDetail.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 relative group hover:border-cyan-500/50 transition-all shadow-sm"
                      >
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="absolute top-2.5 right-2.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete note"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 pr-6">
                          {note.title}
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No notes recorded for this system design problem yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        ) : (
          /* Collapsed Right Strip Handle */
          <div
            onClick={() => setIsRightCollapsed(false)}
            className="w-8 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c111d] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer flex flex-col items-center py-4 gap-4 transition-colors z-10"
            title="Expand Knowledge Studio"
          >
            <PanelRightOpen className="w-4 h-4 text-cyan-500" />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 [writing-mode:vertical-lr]">
              Knowledge Studio
            </span>
          </div>
        )}
      </div>

      {/* 3. 🎙️ BATCH AUTO-TRANSCRIBER RUNNER MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Browser Web Speech Batch Transcriber
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Runs natively in Chrome/Edge. Transcribes spoken video audio to database in real-time. Zero LLM, zero cost.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isBatchRunning) {
                    if (confirm("Stop batch transcription runner?")) {
                      handleStopBatchRunner();
                      setShowBatchModal(false);
                    }
                  } else {
                    setShowBatchModal(false);
                  }
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Recording Status Card */}
            {isBatchRunning ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Transcribing Video {currentQueueIndex + 1} of {batchQueue.length}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                    Elapsed: {formatTime(batchTimerSec)}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  Now Playing: {videos.find((v) => v.id === batchQueue[currentQueueIndex])?.title}
                </div>

                {/* Live Captioning Box */}
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 min-h-[90px] max-h-[140px] overflow-y-auto text-xs space-y-1">
                  {recordedSegments.length === 0 && !liveSpokenText && (
                    <div className="text-amber-600 dark:text-amber-400 text-[11px] leading-relaxed p-1 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800">
                      <strong>⚠️ Waiting for audio input:</strong> The Web Speech API listens through your <strong>Microphone</strong>.
                      <ul className="list-disc list-inside mt-1 space-y-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                        <li>Ensure your microphone is unmuted and speaker sound can be heard by the mic.</li>
                        <li>For silent, crystal-clear recording: Enable <em>"Stereo Mix"</em> in Windows Sound Settings so computer audio routes directly to the speech engine.</li>
                        <li>Check your browser address bar (padlock icon) to verify microphone permission is <strong>Allowed</strong>.</li>
                      </ul>
                    </div>
                  )}
                  {recordedSegments.slice(-4).map((s, idx) => (
                    <p key={idx} className="text-slate-600 dark:text-slate-300">
                      <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 mr-2 font-bold">
                        [{formatTime(s.start_time)}]
                      </span>
                      {s.text}
                    </p>
                  ))}
                  {liveSpokenText && (
                    <p className="text-emerald-600 dark:text-emerald-400 italic">
                      ... {liveSpokenText}
                    </p>
                  )}
                </div>

                {/* Batch Controls */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {recordedSegments.length} sentence segments captured
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCurrentAndAdvance}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <FastForward className="w-3.5 h-3.5" /> Next Video & Save
                    </button>
                    <button
                      onClick={handleStopBatchRunner}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop & Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Video Queue Picker */
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-emerald-500" />
                    Select Videos to Queue for Batch Recording
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBatchQueue(videos.filter((v) => v.status === "watch_later").map((v) => v.id))}
                      className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      + All Watch Later
                    </button>
                    <button
                      onClick={() => setBatchQueue(videos.filter((v) => v.status === "inbox").map((v) => v.id))}
                      className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      + All Inbox
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50 dark:bg-slate-900/40 p-1">
                  {videos.map((v) => {
                    const isQueued = batchQueue.includes(v.id);
                    return (
                      <label
                        key={v.id}
                        className={`p-2 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${
                          isQueued ? "bg-emerald-500/10" : "hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isQueued}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBatchQueue([...batchQueue, v.id]);
                            } else {
                              setBatchQueue(batchQueue.filter((id) => id !== v.id));
                            }
                          }}
                          className="rounded text-emerald-500 focus:ring-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {v.title}
                          </h4>
                          <span className="text-[10px] text-slate-400">
                            {v.channel_name} • Status: {v.status}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {batchQueue.length} video(s) ready in queue
                  </span>
                  <button
                    onClick={handleStartBatchRunner}
                    disabled={batchQueue.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Start Batch Auto-Transcribing
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Multi-Video Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-500" /> Multi-Video Transcript Comparison
              </h3>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select 2 or more videos to generate a unified architectural comparison prompt for LLMs (evaluating differences in databases, caching, and trade-offs).
            </p>

            {/* Selection Checkboxes */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900/50">
              {videos.map((v) => (
                <label
                  key={v.id}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-800 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedForCompare.includes(v.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedForCompare([...selectedForCompare, v.id]);
                      } else {
                        setSelectedForCompare(selectedForCompare.filter((id) => id !== v.id));
                      }
                    }}
                    className="rounded text-cyan-500 focus:ring-0"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{v.title}</span>
                  <span className="text-[10px] text-slate-400">({v.channel_name})</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                {selectedForCompare.length} video(s) selected
              </span>
              <button
                onClick={handleRunComparison}
                disabled={selectedForCompare.length < 2 || compareLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow"
              >
                <Sparkles className="w-4 h-4" />
                {compareLoading ? "Generating Comparison..." : "Generate Comparative Prompt"}
              </button>
            </div>

            {/* Generated LLM Comparison Output */}
            {comparisonResult && (
              <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    Comparative LLM Prompt Ready
                  </span>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(comparisonResult.comparison_prompt);
                      setCopiedComparePrompt(true);
                      setTimeout(() => setCopiedComparePrompt(false), 2500);
                    }}
                    className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-1"
                  >
                    {copiedComparePrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedComparePrompt ? "Copied!" : "Copy Prompt for LLM"}
                  </button>
                </div>
                <pre className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">
                  {comparisonResult.comparison_prompt}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Diagram Snapshot Modal */}
      {showSnapshotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-500" /> Snapshot Architecture Diagram
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save a visual bookmark of an important whiteboard diagram or discussion point with timestamp seeking.
            </p>
            <form onSubmit={handleSaveSnapshot} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Timestamp (Seconds)</label>
                <input
                  type="number"
                  value={snapshotTime}
                  onChange={(e) => setSnapshotTime(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-100 dark:bg-[#131b2e] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Diagram Caption</label>
                <input
                  type="text"
                  placeholder="e.g. WebSocket Connection Manager Topology"
                  value={snapshotCaption}
                  onChange={(e) => setSnapshotCaption(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-[#131b2e] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Discussion Notes</label>
                <textarea
                  placeholder="e.g. State machine handling client reconnects and heartbeats..."
                  value={snapshotNotes}
                  onChange={(e) => setSnapshotNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-100 dark:bg-[#131b2e] border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Add Custom Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-500" /> Add Favorite Channel
              </h3>
              <button
                onClick={() => setShowAddChannel(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-cyan-600 dark:text-cyan-400">💡 How to add channels:</p>
              <p>Type the channel's YouTube handle (e.g. <code>@alexxubyte</code>, <code>@ThePrimeTimeagen</code>, <code>@Jordanhasnolife</code>) or paste the channel URL.</p>
            </div>

            <form onSubmit={handleAddChannelSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Channel Handle or URL</label>
                <input
                  type="text"
                  placeholder="@handle or https://www.youtube.com/@channel"
                  value={newChannelHandle}
                  onChange={(e) => setNewChannelHandle(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-[#131b2e] border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChannel(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
                >
                  Subscribe & Add to Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. VERBATIM TRANSCRIPT & CHAPTER IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                  <Download className="w-4 h-4 rotate-180" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Import {importMode === "transcript" ? "Verbatim Transcript" : "Description Chapters"}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Paste text copied from YouTube. Automatically parses timestamps and saves to database.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1">
              <button
                onClick={() => setImportMode("transcript")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  importMode === "transcript"
                    ? "bg-white dark:bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                📜 Verbatim YouTube Transcript (Word-for-Word)
              </button>
              <button
                onClick={() => setImportMode("chapters")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  importMode === "chapters"
                    ? "bg-white dark:bg-cyan-500 text-slate-950 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                📌 Description Milestone Chapters (Roadmap)
              </button>
            </div>

            {/* Step-by-Step Instructions Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  How to copy from YouTube:
                </span>
                {selectedVideoId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-cyan-400 hover:underline font-bold flex items-center gap-1 text-[11px]"
                  >
                    Open Video on YouTube ↗
                  </a>
                )}
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                {importMode === "transcript" ? (
                  <>
                    <li>On YouTube, click <strong>"... More"</strong> under the video title → <strong>"Show transcript"</strong>.</li>
                    <li>Select all lines in the transcript panel and copy (<kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">Ctrl + A</kbd> → <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">Ctrl + C</kbd>).</li>
                    <li>
                      <span className="italic">Or in Chrome DevTools console (F12), run this 1-click helper:</span>{" "}
                      <button
                        onClick={handleCopyJsSnippet}
                        className="text-indigo-600 dark:text-cyan-400 hover:underline font-bold inline-flex items-center gap-1"
                      >
                        {copiedJsHelper ? "✓ Copied 1-Click Script to Clipboard!" : "Copy 1-Click Console Snippet"}
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>Copy the chapter list from the YouTube video description (e.g. <code>0:00 Intro\n04:12 Requirements</code>).</li>
                    <li>Paste it directly into the box below.</li>
                  </>
                )}
              </ol>
            </div>

            {/* Paste Text Area */}
            <div className="flex-1 flex flex-col min-h-[160px]">
              <label className="text-[11px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                <span>Paste {importMode === "transcript" ? "Verbatim Transcript Lines" : "Milestone Chapters"} Below:</span>
                {rawImportText.trim() && (
                  <span className="text-emerald-500 lowercase font-normal text-[11px]">
                    {rawImportText.split("\n").filter(Boolean).length} lines detected
                  </span>
                )}
              </label>
              <textarea
                value={rawImportText}
                onChange={(e) => setRawImportText(e.target.value)}
                placeholder={
                  importMode === "transcript"
                    ? "0:00\nWelcome to this system design interview...\n0:05\nToday we design YouTube..."
                    : "0:00 Introduction & Problem Scope\n02:30 Functional vs Non-Functional Requirements\n06:15 High-Level Architecture..."
                }
                className="w-full flex-1 bg-slate-50 dark:bg-[#111827] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none min-h-[180px]"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Auto-cleans formatting & binds timestamps to the player
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isImporting || !rawImportText.trim()}
                  onClick={importMode === "transcript" ? handleImportTranscript : handleImportChapters}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
                >
                  {isImporting ? (
                    "Saving to Database..."
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save {importMode === "transcript" ? "Verbatim Transcript" : "Chapters"} to Vault
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 7. 🔍 GLOBAL TRANSCRIPT SEARCH MODAL (Ctrl+K) */}
      {showGlobalSearch && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 pt-16 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl space-y-3 max-h-[85vh] flex flex-col overflow-hidden">
            {/* Search Input Header */}
            <div className="p-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-cyan-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Search verbatim transcripts & chapters across all 58+ videos (e.g. Redis Lua, Cassandra, H3)..."
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    handleSearchTranscripts(e.target.value, globalSearchChannel);
                  }}
                  className="w-full bg-transparent text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setShowGlobalSearch(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Chips inside search modal */}
              <div className="flex items-center gap-1.5 pt-3 overflow-x-auto">
                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Channel:</span>
                <button
                  onClick={() => {
                    setGlobalSearchChannel("ALL");
                    handleSearchTranscripts(globalSearchQuery, "ALL");
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                    globalSearchChannel === "ALL"
                      ? "bg-cyan-500 text-slate-950 font-bold"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  All Channels
                </button>
                {channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setGlobalSearchChannel(ch.id);
                      handleSearchTranscripts(globalSearchQuery, ch.id);
                    }}
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-md truncate max-w-[130px] transition-colors ${
                      globalSearchChannel === ch.id
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {ch.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {globalSearchLoading ? (
                <div className="py-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" />
                  Searching transcripts across entire library...
                </div>
              ) : globalSearchResults.length > 0 ? (
                globalSearchResults.map((res, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedVideoId(res.video_id);
                      setShowGlobalSearch(false);
                      seekTo(res.timestamp_sec);
                    }}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 cursor-pointer transition-all space-y-1.5 group hover:border-cyan-500/50 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors truncate">
                          {res.video_title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          • {res.channel_name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {res.source_type === "chapter_milestone" ? "📌 Chapter" : "📜 Verbatim"}
                        </span>
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                          {res.timestamp_label}
                        </span>
                      </div>
                    </div>
                    <p
                      className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{ __html: res.snippet }}
                    />
                  </div>
                ))
              ) : globalSearchQuery.trim() ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No transcript matches found for "{globalSearchQuery}". Try different keywords.
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                  <p>Type keywords to search across all video transcripts in real-time.</p>
                  <p className="text-[11px] text-slate-500">Examples: <code>"Redis Lua"</code>, <code>"Kafka partition"</code>, <code>"Cassandra"</code>, <code>"H3 hexagon"</code>, <code>"S3 presigned"</code></p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono">Esc</kbd> to close</span>
              <span>{globalSearchResults.length} matches found</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. 📝 OBSIDIAN & NOTION EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Export to Obsidian / Notion
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Export study notes, chapters, diagrams & transcripts formatted for your second brain.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: Current Video Markdown */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-500" />
                    Current Problem Note (.md)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">1 file</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Includes YAML frontmatter, roadmap chapters with clickable timestamp links, architecture takeaways, and verbatim transcript appendix.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleDownloadSingleMarkdown}
                    className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Markdown (.md)
                  </button>
                  <button
                    onClick={handleCopyMarkdownToClipboard}
                    className="py-2 px-3 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedMarkdownText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedMarkdownText ? "Copied!" : "Copy Text"}
                  </button>
                </div>
              </div>

              {/* Option 2: Full Obsidian Vault ZIP */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-500" />
                    Complete Obsidian Vault (.zip)
                  </h4>
                  <span className="text-[10px] text-purple-500 font-bold px-1.5 py-0.5 rounded bg-purple-500/10">All 58 Problems</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Generates an interconnected Zettelkasten Obsidian vault containing an <code>Index.md</code> master catalog, individual problem notes, and <code>[[wikilinks]]</code> between alternative solutions.
                </p>
                <button
                  onClick={handleDownloadFullVault}
                  className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" /> Download Full Vault ZIP
                </button>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-slate-400 text-center">
              Compatible with Obsidian, Notion, Logseq, Bear, and standard Markdown editors.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
