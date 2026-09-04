import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { negotiationApi } from '../lib/api';
import {
  MessageSquare,
  Search,
  Pin,
  Archive,
  Trash2,
  Edit2,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Play,
  Pause,
  ArrowRight,
  ChevronRight,
  Clock,
  User,
  Sparkles,
  Layers,
  Check,
  X,
  Info,
} from 'lucide-react';

/* ============================================================
   DESIGN TOKENS & GLASS SURFACE STYLES
============================================================ */

const glassPrimary =
  'border border-white/85 bg-white/[0.72] backdrop-blur-2xl shadow-[0_14px_40px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.9)]';

const glassInner =
  'border border-white/80 bg-white/[0.55] backdrop-blur-xl shadow-[0_6px_20px_rgba(15,23,42,0.025)]';

/* ============================================================
   AVATAR HELPER
============================================================ */

const getAgentAvatarColor = (roleName: string, isUser: boolean) => {
  if (isUser) {
    return { bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-400' };
  }
  const r = (roleName || '').toLowerCase();
  if (r.includes('vendor') || r.includes('seller') || r.includes('sales')) {
    return { bg: 'bg-[#C86D51]', text: 'text-white', border: 'border-orange-300' };
  }
  if (r.includes('buyer') || r.includes('procurement')) {
    return { bg: 'bg-[#3B82F6]', text: 'text-white', border: 'border-blue-300' };
  }
  if (r.includes('recruiter') || r.includes('hr')) {
    return { bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-300' };
  }
  if (r.includes('candidate')) {
    return { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-300' };
  }
  if (r.includes('department') || r.includes('head')) {
    return { bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-300' };
  }
  if (r.includes('project') || r.includes('manager')) {
    return { bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-300' };
  }
  if (r.includes('finance')) {
    return { bg: 'bg-slate-700', text: 'text-white', border: 'border-slate-400' };
  }
  return { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-300' };
};

export const NegotiationHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedReportId, resumeSession } = useStore();

  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedSessionDetails, setSelectedSessionDetails] = useState<any | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Local personalization state (pinned / custom titles / archived)
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('agy_pinned_negotiations') || '[]');
    } catch {
      return [];
    }
  });

  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('agy_archived_negotiations') || '[]');
    } catch {
      return [];
    }
  });

  const [customTitles, setCustomTitles] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('agy_custom_negotiation_titles') || '{}');
    } catch {
      return {};
    }
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load all user sessions
  const fetchSessions = async () => {
    setLoadingList(true);
    try {
      const data = await negotiationApi.listSessions();
      setSessions(data || []);
      if (data && data.length > 0 && !selectedSessionId) {
        setSelectedSessionId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch full details of selected session
  useEffect(() => {
    if (!selectedSessionId) {
      setSelectedSessionDetails(null);
      return;
    }

    let isMounted = true;
    setLoadingDetails(true);
    negotiationApi
      .getSession(selectedSessionId)
      .then((data) => {
        if (isMounted) setSelectedSessionDetails(data);
      })
      .catch((err) => {
        console.error('Failed to load session details:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingDetails(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSessionId]);

  // Click outside listener for 3-dot menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pin / Unpin handler
  const togglePin = (id: string) => {
    const next = pinnedIds.includes(id) ? pinnedIds.filter((x) => x !== id) : [...pinnedIds, id];
    setPinnedIds(next);
    localStorage.setItem('agy_pinned_negotiations', JSON.stringify(next));
    setActiveMenuId(null);
  };

  // Archive / Unarchive handler
  const toggleArchive = (id: string) => {
    const next = archivedIds.includes(id) ? archivedIds.filter((x) => x !== id) : [...archivedIds, id];
    setArchivedIds(next);
    localStorage.setItem('agy_archived_negotiations', JSON.stringify(next));
    setActiveMenuId(null);
  };

  // Delete single session handler
  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this negotiation conversation?')) return;
    try {
      await negotiationApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setSelectedSessionIds((prev) => prev.filter((item) => item !== id));
      if (selectedSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    } finally {
      setActiveMenuId(null);
    }
  };

  // Bulk Delete sessions handler
  const handleBulkDelete = async (deleteAll: boolean = false) => {
    const targetCount = deleteAll ? sessions.length : selectedSessionIds.length;
    if (targetCount === 0) return;

    const confirmMsg = deleteAll
      ? `Are you sure you want to permanently delete ALL ${targetCount} negotiation history sessions? This action cannot be undone.`
      : `Are you sure you want to delete the ${targetCount} selected negotiation(s)?`;

    if (!window.confirm(confirmMsg)) return;

    setIsBulkDeleting(true);
    try {
      await negotiationApi.bulkDelete(deleteAll ? undefined : selectedSessionIds, deleteAll);
      if (deleteAll) {
        setSessions([]);
        setSelectedSessionId(null);
        setSelectedSessionDetails(null);
        setSelectedSessionIds([]);
      } else {
        const remaining = sessions.filter((s) => !selectedSessionIds.includes(s.id));
        setSessions(remaining);
        if (selectedSessionId && selectedSessionIds.includes(selectedSessionId)) {
          setSelectedSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
        setSelectedSessionIds([]);
      }
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Failed to delete negotiations. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Toggle single item selection
  const toggleSelectSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSessionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Rename session handler
  const saveRename = (id: string) => {
    if (editingTitle.trim()) {
      const next = { ...customTitles, [id]: editingTitle.trim() };
      setCustomTitles(next);
      localStorage.setItem('agy_custom_negotiation_titles', JSON.stringify(next));
    }
    setEditingId(null);
    setEditingTitle('');
  };

  const getScenarioTitle = (scenarioId: string) => {
    if (scenarioId === 'vendor-pricing') return 'Vendor Pricing Negotiation';
    if (scenarioId === 'job-offer') return 'Job Salary Negotiation';
    if (scenarioId === 'budget-allocation') return 'Project Budget Allocation';
    return (scenarioId || '').replace('-', ' ').toUpperCase();
  };

  // Filtered & sorted sessions
  const filteredSessions = sessions
    .filter((s) => {
      const isArchived = archivedIds.includes(s.id);
      if (showArchived && !isArchived) return false;
      if (!showArchived && isArchived) return false;

      const title = customTitles[s.id] || getScenarioTitle(s.scenario_id);
      const query = searchQuery.toLowerCase();
      return (
        title.toLowerCase().includes(query) ||
        (s.mode || '').toLowerCase().includes(query) ||
        (s.status || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
    });

  const isAllSelected = filteredSessions.length > 0 && filteredSessions.every((s) => selectedSessionIds.includes(s.id));

  // Toggle Select All filtered sessions
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSessionIds([]);
    } else {
      setSelectedSessionIds(filteredSessions.map((s) => s.id));
    }
  };

  const currentScenarioTitle = selectedSessionDetails
    ? customTitles[selectedSessionDetails.id] || getScenarioTitle(selectedSessionDetails.scenario_id)
    : '';

  const situationBriefings: Record<string, string> = {
    'vendor-pricing':
      'Enterprise CRM procurement discussion between Buyer Agent and Vendor Agent. The buyer is seeking flexible, cost-effective terms within approved budget limits, while the vendor focuses on contract margin and value-added support commitments.',
    'job-offer':
      'Compensation package negotiation between Recruiter Agent and Candidate Agent. Focuses on balancing target salary expectations, equity options, and flexible work arrangements within organizational grade caps.',
    'budget-allocation':
      'Capital allocation negotiation across competing initiatives led by Department Head Agent, Project Manager Agent, and Finance Manager Agent. Focuses on consensus-based fund distribution under strict financial control boundaries.',
  };

  return (
    <main
      className="relative min-h-screen bg-[#EEF1F8] px-4 py-4 font-sans text-[#0F172A] lg:px-6"
      style={{
        background: 'linear-gradient(135deg, #EEF1F8 0%, #EEF1F8 55%, #F4F6FB 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[170px] top-[15%] h-[420px] w-[420px] rounded-full bg-[#3B82F6]/4 blur-[120px]" />
        <div className="absolute -right-[160px] top-[35%] h-[430px] w-[430px] rounded-full bg-[#C86D51]/4 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1550px] space-y-4">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-[6px] w-[6px] rounded-full bg-[#3B82F6]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
                Conversation Archives
              </span>
            </div>
            <h1 className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-[#1E2230]">
              Negotiation History
            </h1>
            <p className="text-[11px] font-medium text-[#64748B]">
              Browse complete conversational transcripts, situation briefings, and agreed outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                showArchived
                  ? 'border-[#3B82F6] bg-[#3B82F6] text-white shadow-xs'
                  : 'border-slate-300 bg-white/70 text-slate-700 hover:bg-white'
              }`}
            >
              <Archive size={13} />
              {showArchived ? 'Showing Archived' : 'View Archive'}
            </button>

            <button
              onClick={() => navigate('/setup/scenario')}
              className="flex items-center gap-1.5 rounded-full border border-[#3B82F6]/20 bg-[#3B82F6] px-4 py-1.5 text-[10.5px] font-bold text-white shadow-sm hover:bg-[#3273dd] transition-all cursor-pointer"
            >
              <Play size={11} fill="currentColor" />
              New Negotiation
            </button>
          </div>
        </div>

        {/* CHATGPT-STYLE TWO PANE WORKSPACE */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
          {/* LEFT SIDEBAR: CONVERSATION LIST */}
          <div className={`flex flex-col h-[calc(100vh-170px)] min-h-[580px] rounded-[24px] p-4 ${glassPrimary}`}>
            {/* Search Input */}
            <div className="relative mb-2.5">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search negotiations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-slate-200/80 bg-white/70 py-2 pl-9 pr-4 text-[11px] font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#3B82F6] focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/10"
              />
            </div>

            {/* Select All & Bulk Actions Toolbar */}
            {filteredSessions.length > 0 && (
              <div className="mb-2.5 flex items-center justify-between px-1.5 py-1.5 rounded-xl bg-white/60 border border-slate-200/60 text-[10.5px]">
                <label className="flex items-center gap-1.5 cursor-pointer select-none font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Select All ({filteredSessions.length})</span>
                </label>

                <div className="flex items-center gap-1.5">
                  {selectedSessionIds.length > 0 && (
                    <button
                      onClick={() => handleBulkDelete(false)}
                      disabled={isBulkDeleting}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-all shadow-xs cursor-pointer border-none disabled:opacity-50"
                      title="Delete Selected Negotiations"
                    >
                      <Trash2 size={11} />
                      <span>Delete ({selectedSessionIds.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleBulkDelete(true)}
                    disabled={isBulkDeleting}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 text-red-600 font-semibold transition-colors cursor-pointer border border-transparent hover:border-red-200 disabled:opacity-50"
                    title="Delete All Negotiations"
                  >
                    <Trash2 size={11} />
                    <span>Delete All</span>
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {filteredSessions.map((session) => {
                const isSelected = selectedSessionId === session.id;
                const isChecked = selectedSessionIds.includes(session.id);
                const isPinned = pinnedIds.includes(session.id);
                const title = customTitles[session.id] || getScenarioTitle(session.scenario_id);
                const rawStatus = (session.status || '').toLowerCase();
                const isRunning = rawStatus === 'running';
                const isPaused = rawStatus === 'paused';
                const isFinished = rawStatus === 'finished' || rawStatus === 'deadlock';
                const isStopped = rawStatus === 'terminated' || rawStatus === 'stopped';

                const formattedDate = new Date(session.updated_at || session.created_at).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                });

                return (
                  <div
                    key={session.id}
                    style={{ zIndex: activeMenuId === session.id ? 50 : 1 }}
                    onClick={() => setSelectedSessionId(session.id)}
                    className={`group relative flex items-center justify-between rounded-[16px] p-3 transition-all cursor-pointer ${
                      isChecked
                        ? 'border border-blue-500/60 bg-blue-50/70 shadow-xs ring-1 ring-blue-500/20'
                        : isSelected
                        ? 'border border-[#3B82F6]/40 bg-white/95 shadow-md ring-1 ring-[#3B82F6]/20'
                        : `hover:bg-white/75 ${glassInner}`
                    }`}
                  >
                    {/* Item Checkbox */}
                    <div
                      className="mr-2 flex items-center shrink-0"
                      onClick={(e) => toggleSelectSession(session.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 items-start gap-2.5">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border ${
                          isSelected
                            ? 'border-[#3B82F6] bg-[#3B82F6]/10 text-[#3B82F6]'
                            : 'border-slate-200 bg-white/80 text-slate-500'
                        }`}
                      >
                        <MessageSquare size={14} />
                      </div>

                      <div className="min-w-0 flex-1">
                        {editingId === session.id ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveRename(session.id)}
                              className="w-full rounded-md border border-[#3B82F6] bg-white px-2 py-0.5 text-[11px] font-bold text-slate-900 outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => saveRename(session.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {isPinned && <Pin size={11} className="text-amber-500 shrink-0 fill-amber-500" />}
                            <p className="truncate text-[11px] font-bold text-[#0F172A]">{title}</p>
                          </div>
                        )}

                        <div className="mt-1 flex items-center gap-2 text-[9.5px] font-medium text-slate-500">
                          <span>{session.mode === 'human-ai' ? 'Practice' : 'Simulation'}</span>
                          <span>•</span>
                          <span>Rd {session.current_round || 1}</span>
                          <span>•</span>
                          <span>{formattedDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2">
                      {/* Status Badge */}
                      {isRunning && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" title="Running" />}
                      {isPaused && <span className="h-2 w-2 rounded-full bg-amber-500" title="Paused" />}
                      {isFinished && <span className="h-2 w-2 rounded-full bg-emerald-500" title="Completed" />}
                      {isStopped && <span className="h-2 w-2 rounded-full bg-slate-400" title="Stopped" />}

                      {/* 3-Dot Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === session.id ? null : session.id);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-200 text-slate-600 transition-colors border-none bg-transparent cursor-pointer font-bold text-sm"
                          title="Actions"
                        >
                          ⋮
                        </button>

                        {activeMenuId === session.id && (
                          <div
                            ref={menuRef}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-100 text-[11px] font-semibold text-slate-800"
                          >
                            <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                              Negotiation Options
                            </div>

                            <button
                              onClick={() => {
                                setEditingId(session.id);
                                setEditingTitle(title);
                                setActiveMenuId(null);
                              }}
                              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-100 text-left border-none bg-white cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
                            >
                              <Edit2 size={13} className="text-slate-500" /> Rename Title
                            </button>

                            <button
                              onClick={() => togglePin(session.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-100 text-left border-none bg-white cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
                            >
                              <Pin size={13} className={isPinned ? 'text-amber-500 fill-amber-500' : 'text-slate-500'} />
                              {isPinned ? 'Unpin from Top' : 'Pin to Top'}
                            </button>

                            <button
                              onClick={() => toggleArchive(session.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-100 text-left border-none bg-white cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
                            >
                              <Archive size={13} className="text-slate-500" />
                              {archivedIds.includes(session.id) ? 'Unarchive' : 'Archive Session'}
                            </button>

                            <div className="my-1 border-t border-slate-100" />

                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-left border-none bg-white cursor-pointer text-red-600 font-bold transition-colors"
                            >
                              <Trash2 size={13} className="text-red-500" /> Delete Negotiation
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSessions.length === 0 && !loadingList && (
                <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                  {showArchived ? 'No archived negotiations found.' : 'No negotiation history found.'}
                </div>
              )}
            </div>
          </div>

          {/* MAIN PANEL: COMPLETE CONVERSATION TRANSCRIPT */}
          <div className={`flex flex-col h-[calc(100vh-170px)] min-h-[580px] rounded-[24px] overflow-hidden ${glassPrimary}`}>
            {selectedSessionDetails ? (
              <>
                {/* CONVERSATION TOP BAR */}
                <div className="flex flex-wrap items-center justify-between border-b border-white/80 bg-white/60 px-6 py-4 backdrop-blur-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[15px] font-bold text-[#0F172A]">{currentScenarioTitle}</h2>
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[8.5px] font-bold text-blue-600 capitalize">
                        {selectedSessionDetails.mode === 'human-ai' ? 'Human vs AI' : 'AI vs AI'}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">
                      Round {selectedSessionDetails.current_round} of {selectedSessionDetails.max_rounds} • Status:{' '}
                      <span className="font-semibold text-slate-800 capitalize">
                        {selectedSessionDetails.status}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(selectedSessionDetails.status === 'running' ||
                      selectedSessionDetails.status === 'paused') && (
                      <button
                        onClick={async () => {
                          await resumeSession(selectedSessionDetails.id);
                          navigate(
                            selectedSessionDetails.mode === 'human-ai'
                              ? '/arena/practice'
                              : '/arena/simulation'
                          );
                        }}
                        className="flex items-center gap-1.5 rounded-full border border-blue-500 bg-blue-600 px-4 py-1.5 text-[10.5px] font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
                      >
                        <Play size={12} fill="currentColor" /> Open in Arena
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const targetReportId = selectedSessionDetails?.report_id || selectedSessionDetails?.id;
                        if (targetReportId) {
                          setSelectedReportId(targetReportId);
                        }
                        navigate('/reports');
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-[10.5px] font-bold text-slate-700 shadow-xs hover:bg-white transition-all cursor-pointer"
                    >
                      <FileText size={13} /> View Reports
                    </button>
                  </div>
                </div>

                {/* SCROLLABLE CHAT MESSAGES & SITUATION BRIEFING */}
                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                  {/* Situation Briefing Card */}
                  <div className="rounded-[20px] border border-blue-100 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white/70 p-4 shadow-xs">
                    <div className="flex items-center gap-2 text-blue-700">
                      <Sparkles size={15} />
                      <h4 className="text-[11.5px] font-bold uppercase tracking-wider">
                        Scenario Situation Briefing
                      </h4>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-slate-700">
                      {situationBriefings[selectedSessionDetails.scenario_id] ||
                        'Negotiation session conducted under configured agent parameters and objectives.'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-blue-100/60 text-[9.5px] text-slate-600">
                      <span className="font-semibold text-blue-900">Agents Involved:</span>
                      {(selectedSessionDetails.agents || []).map((a: any) => (
                        <span
                          key={a.id || a.name}
                          className="rounded-md border border-blue-200/60 bg-white/80 px-2 py-0.5 font-medium"
                        >
                          {a.name} ({a.role})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="space-y-4">
                    {(selectedSessionDetails.messages || []).map((msg: any, idx: number) => {
                      const avatarColors = getAgentAvatarColor(msg.role || msg.sender, msg.is_user);
                      const initials = (msg.sender || 'AG')
                        .split(' ')
                        .map((w: string) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <div
                          key={msg.id || idx}
                          className={`flex items-start gap-3.5 rounded-[18px] p-4 transition-all ${
                            msg.is_user
                              ? 'border border-emerald-200/80 bg-emerald-50/30'
                              : 'border border-white/90 bg-white/70'
                          } shadow-xs`}
                        >
                          {/* Avatar */}
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] border shadow-xs font-bold text-xs ${avatarColors.bg} ${avatarColors.text} ${avatarColors.border}`}
                          >
                            {msg.is_user ? <User size={18} /> : initials}
                          </div>

                          {/* Message Body */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[12px] font-bold text-[#0F172A]">
                                  {msg.sender}
                                </span>
                                <span className="rounded-full border border-slate-200 bg-white/80 px-2 py-0.5 text-[8.5px] font-semibold text-slate-600">
                                  {msg.role}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[9.5px] font-medium text-slate-400">
                                <span>Round {msg.round || 1}</span>
                                <span>•</span>
                                <span>
                                  {msg.timestamp
                                    ? new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                </span>
                              </div>
                            </div>

                            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                              {msg.content}
                            </p>

                            {/* Offer Card Callout */}
                            {msg.offer_data && Object.keys(msg.offer_data).length > 0 && (
                              <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 p-2.5 text-[10px]">
                                <span className="font-bold text-blue-800">Proposed Terms:</span>
                                {Object.entries(msg.offer_data).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="rounded-md border border-blue-200 bg-white px-2 py-0.5 font-semibold text-blue-900"
                                  >
                                    {k}: {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {(!selectedSessionDetails.messages ||
                      selectedSessionDetails.messages.length === 0) && (
                      <div className="py-12 text-center text-xs text-slate-400 font-semibold">
                        No messages exchanged in this session yet.
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Outcome Banner if Completed */}
                  {(selectedSessionDetails.status === 'finished' ||
                    selectedSessionDetails.status === 'deadlock' ||
                    selectedSessionDetails.agreement_reached) && (
                    <div
                      className={`rounded-[20px] border p-5 text-center space-y-2 ${
                        selectedSessionDetails.agreement_reached
                          ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                          : 'border-red-200 bg-red-50/70 text-red-900'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 font-bold text-[13px]">
                        {selectedSessionDetails.agreement_reached ? (
                          <>
                            <CheckCircle2 size={18} className="text-emerald-600" />
                            Negotiation Finalized: Agreement Reached
                          </>
                        ) : (
                          <>
                            <AlertTriangle size={18} className="text-red-600" />
                            Negotiation Concluded: Deadlock Reached
                          </>
                        )}
                      </div>

                      {selectedSessionDetails.final_terms &&
                        Object.keys(selectedSessionDetails.final_terms).length > 0 && (
                          <div className="flex flex-wrap justify-center gap-2 pt-2">
                            {Object.entries(selectedSessionDetails.final_terms).map(([k, v]) => (
                              <span
                                key={k}
                                className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-[10px] font-bold text-emerald-900 shadow-xs"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                <MessageSquare size={36} className="text-slate-300 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-600">Select a Negotiation</h3>
                <p className="max-w-xs text-xs">
                  Choose a negotiation from the sidebar to review the full conversational transcript and terms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default NegotiationHistoryScreen;
