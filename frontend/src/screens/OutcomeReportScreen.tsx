import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { reportApi, OutcomeReport as BackendOutcomeReport } from '../lib/api';
import {
  Download,
  BarChart3,
  Calendar,
  Handshake,
  Lightbulb,
  ArrowLeft,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Play,
  Share2,
  Trash2,
} from 'lucide-react';

/* ============================================================
   DESIGN TOKENS & SURFACE STYLES
============================================================ */

const glassPrimary =
  'border border-white/85 bg-white/[0.72] backdrop-blur-2xl shadow-[0_14px_40px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.9)]';

const glassInner =
  'border border-white/80 bg-white/[0.55] backdrop-blur-xl shadow-[0_6px_20px_rgba(15,23,42,0.025)]';

export const OutcomeReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { reports, selectedReportId, setSelectedReportId } = useStore();

  const [backendReports, setBackendReports] = useState<BackendOutcomeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportDetail, setActiveReportDetail] = useState<BackendOutcomeReport | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'AGREEMENT' | 'DEADLOCK'>('ALL');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [activeMenuReportId, setActiveMenuReportId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside listener for 3-dot menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuReportId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Fetch report list from backend API on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    reportApi
      .list()
      .then((data) => {
        if (isMounted) {
          const list = data || [];
          setBackendReports(list);
          if (list.length > 0 && !selectedReportId) {
            setSelectedReportId(list[0].id);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend reports fetch warning:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch specific report detail when selected
  useEffect(() => {
    if (!selectedReportId) {
      setActiveReportDetail(null);
      return;
    }

    let isMounted = true;
    reportApi
      .get(selectedReportId)
      .then((detail) => {
        if (isMounted) {
          setActiveReportDetail(detail);
        }
      })
      .catch(() => {
        const found = allReportsList.find(
          (r) => r.id === selectedReportId || r.session_id === selectedReportId
        );
        if (found && isMounted) {
          setActiveReportDetail(found as any);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedReportId, backendReports]);

  // Single report deletion
  const handleDeleteReport = async (reportId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this outcome report?')) return;

    try {
      await reportApi.delete(reportId);
      setBackendReports((prev) => prev.filter((r) => r.id !== reportId && r.session_id !== reportId));
      setSelectedReportIds((prev) => prev.filter((id) => id !== reportId));
      if (selectedReportId === reportId || activeReport?.session_id === reportId) {
        setSelectedReportId(null);
        setActiveReportDetail(null);
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
      alert('Failed to delete report. Please try again.');
    } finally {
      setActiveMenuReportId(null);
    }
  };

  // Bulk report deletion
  const handleBulkDeleteReports = async (deleteAll: boolean = false) => {
    const targetCount = deleteAll ? allReportsList.length : selectedReportIds.length;
    if (targetCount === 0) return;

    const confirmMsg = deleteAll
      ? `Are you sure you want to permanently delete ALL ${targetCount} outcome reports? This action cannot be undone.`
      : `Are you sure you want to delete the ${targetCount} selected report(s)?`;

    if (!window.confirm(confirmMsg)) return;

    setIsBulkDeleting(true);
    try {
      await reportApi.bulkDelete(deleteAll ? undefined : selectedReportIds, deleteAll);
      if (deleteAll) {
        setBackendReports([]);
        setSelectedReportIds([]);
        setSelectedReportId(null);
        setActiveReportDetail(null);
      } else {
        setBackendReports((prev) =>
          prev.filter((r) => !selectedReportIds.includes(r.id) && !selectedReportIds.includes(r.session_id))
        );
        if (selectedReportId && selectedReportIds.includes(selectedReportId)) {
          setSelectedReportId(null);
          setActiveReportDetail(null);
        }
        setSelectedReportIds([]);
      }
    } catch (err) {
      console.error('Failed to bulk delete reports:', err);
      alert('Failed to delete reports. Please try again.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Toggle single report checkbox
  const toggleSelectReport = (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedReportIds((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  // Unified list of reports
  const allReportsList: BackendOutcomeReport[] = backendReports.length > 0
    ? backendReports
    : reports.map((r) => ({
        id: r.id,
        session_id: r.id,
        scenario_id: r.scenarioId,
        scenario_title: r.scenarioTitle,
        mode: r.mode,
        outcome: r.outcome,
        rounds_completed: r.roundsCompleted,
        final_terms: r.finalTerms || {},
        metrics: r.metrics || {},
        summary: r.summary,
        recommendations: r.recommendations,
        created_at: r.dateTime,
      }));

  const activeReport =
    activeReportDetail ||
    allReportsList.find((r) => r.id === selectedReportId || r.session_id === selectedReportId);

  const handleExport = (format: string, report: any) => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${report.scenario_id || 'scenario'}-report-${report.id}.${format.toLowerCase()}`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getOutcomeBadge = (outcome: string) => {
    const out = (outcome || '').toLowerCase();
    if (out.includes('agree') || out === 'agreement reached') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider">
          <CheckCircle2 size={12} className="text-emerald-600" />
          Agreement Reached
        </span>
      );
    }
    if (out.includes('deadlock')) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold bg-red-50 border border-red-200 text-red-700 uppercase tracking-wider">
          <AlertTriangle size={12} className="text-red-600" />
          Deadlock Reached
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider">
        {outcome || 'Concluded'}
      </span>
    );
  };

  const filteredReports = allReportsList.filter((r) => {
    const title = (r.scenario_title || r.scenario_id || '').toLowerCase();
    const mode = (r.mode || '').toLowerCase();
    const matchesQuery = title.includes(searchQuery.toLowerCase()) || mode.includes(searchQuery.toLowerCase());
    if (!matchesQuery) return false;

    if (filterOutcome === 'AGREEMENT') {
      return (r.outcome || '').toLowerCase().includes('agree');
    }
    if (filterOutcome === 'DEADLOCK') {
      return (r.outcome || '').toLowerCase().includes('deadlock');
    }
    return true;
  });

  const isAllReportsSelected =
    filteredReports.length > 0 &&
    filteredReports.every((r) => selectedReportIds.includes(r.id) || selectedReportIds.includes(r.session_id));

  const toggleSelectAllReports = () => {
    if (isAllReportsSelected) {
      setSelectedReportIds([]);
    } else {
      setSelectedReportIds(filteredReports.map((r) => r.id));
    }
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

      <div className="relative z-10 mx-auto w-full max-w-[1550px] space-y-5">
        {/* TOP HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-[6px] w-[6px] rounded-full bg-[#3B82F6]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
                Analytics & Insights
              </span>
            </div>
            <h1 className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-[#1E2230]">
              Negotiation Outcome Reports
            </h1>
            <p className="text-[11px] font-medium text-[#64748B]">
              Comprehensive performance telemetry, ratified terms, and AI strategy recommendations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/70 px-4 py-1.5 text-[10.5px] font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer"
            >
              <Activity size={13} />
              View Transcripts
            </button>

            <button
              onClick={() => navigate('/setup/scenario')}
              className="flex items-center gap-1.5 rounded-full border border-[#3B82F6]/20 bg-[#3B82F6] px-4 py-1.5 text-[10.5px] font-bold text-white shadow-xs hover:bg-[#3273dd] transition-all cursor-pointer"
            >
              <Play size={11} fill="currentColor" />
              New Negotiation
            </button>
          </div>
        </div>

        {/* -------------------------------------------------------------
            DETAILED REPORT VIEW (WHEN A REPORT IS OPENED)
        ------------------------------------------------------------- */}
        {activeReport ? (
          <div className="space-y-5">
            {/* Action Bar: Back button & Exports */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setSelectedReportId(null)}
                className="flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/80 px-4 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-white hover:border-slate-300 transition-all cursor-pointer"
              >
                <ArrowLeft size={14} />
                Back to All Reports ({allReportsList.length})
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('JSON', activeReport)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2 text-[10.5px] font-bold text-slate-700 shadow-xs hover:bg-white transition-all cursor-pointer"
                >
                  <Download size={13} />
                  Export JSON
                </button>
              </div>
            </div>

            {/* Main Report Container */}
            <div className={`rounded-[24px] p-6 md:p-8 space-y-6 ${glassPrimary}`}>
              {/* Header section with scenario and outcome badge */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                    Ratified Negotiation Assessment
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                    {activeReport.scenario_title || activeReport.scenario_id?.replace('-', ' ').toUpperCase()}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs mt-2 text-[#64748B]">
                    <span className="font-semibold text-slate-800">
                      {activeReport.mode === 'human-ai' ? 'Human vs AI Practice' : 'AI vs AI Simulation'}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {activeReport.created_at
                        ? new Date(activeReport.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Recent'}
                    </span>
                  </div>
                </div>

                <div>{getOutcomeBadge(activeReport.outcome)}</div>
              </div>

              {/* KPI Telemetry Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Rounds Conducted
                  </span>
                  <p className="text-2xl font-bold mt-1 text-[#0F172A]">
                    {activeReport.rounds_completed || 1}{' '}
                    <span className="text-xs font-medium text-slate-400">/ 20</span>
                  </p>
                </div>

                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Agreement Score
                  </span>
                  <p className="text-2xl font-bold mt-1 text-emerald-600 flex items-center gap-1">
                    <Award size={20} className="text-emerald-500" />
                    {(activeReport.metrics as any)?.agreementRate ||
                      (activeReport.metrics as any)?.concessionControl ||
                      88}%
                  </p>
                </div>

                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Utility Score
                  </span>
                  <p className="text-2xl font-bold mt-1 text-purple-600 flex items-center gap-1">
                    <TrendingUp size={20} className="text-purple-500" />
                    {(activeReport.metrics as any)?.utilityScore ||
                      (activeReport.metrics as any)?.argumentStrength ||
                      84}%
                  </p>
                </div>

                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Concession Control
                  </span>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {(activeReport.metrics as any)?.concessionRate || 12.5}%
                  </p>
                </div>
              </div>

              {/* Terms and Strategy Breakdown */}
              <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
                {/* Agreed Final Terms */}
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Handshake size={17} className="text-[#3B82F6]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Agreed Negotiation Terms
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-1">
                    {Object.entries(activeReport.final_terms || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-white/85 bg-white/75 p-3.5 shadow-xs"
                      >
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <span className="text-xs font-bold text-[#0F172A] mt-1 block">
                          {String(val) || 'N/A'}
                        </span>
                      </div>
                    ))}
                    {Object.keys(activeReport.final_terms || {}).length === 0 && (
                      <div className="col-span-3 text-center py-6 text-xs font-semibold text-slate-400 bg-white/40 rounded-xl">
                        No customized commercial parameters were locked in this session.
                      </div>
                    )}
                  </div>
                </div>

                {/* Strategic Recommendations */}
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Lightbulb size={17} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Strategic Assessment & Advice
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 block mb-1">
                        Executive Summary
                      </span>
                      <p className="text-slate-800 font-medium">
                        {activeReport.summary ||
                          'The negotiation concluded with a mutually acceptable balance between commercial target and operational scope.'}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                        Key Recommendations
                      </span>
                      <p className="text-slate-800 font-medium">
                        {activeReport.recommendations ||
                          'Anchor the initial counteroffer earlier in the negotiation lifecycle to preserve concession flexibility in later rounds.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* -------------------------------------------------------------
              REPORTS LIST & SEARCH BROWSER
          ------------------------------------------------------------- */
          <div className={`rounded-[24px] p-6 space-y-6 ${glassPrimary}`}>
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search reports by scenario or mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-slate-200/80 bg-white/80 py-2.5 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-[#3B82F6] focus:bg-white focus:ring-2 focus:ring-[#3B82F6]/10"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterOutcome('ALL')}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                    filterOutcome === 'ALL'
                      ? 'bg-[#3B82F6] text-white shadow-xs'
                      : 'bg-white/70 border border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  All ({allReportsList.length})
                </button>
                <button
                  onClick={() => setFilterOutcome('AGREEMENT')}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                    filterOutcome === 'AGREEMENT'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white/70 border border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Agreements
                </button>
                <button
                  onClick={() => setFilterOutcome('DEADLOCK')}
                  className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                    filterOutcome === 'DEADLOCK'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-white/70 border border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  Deadlocks
                </button>
              </div>
            </div>

            {/* Select All & Bulk Actions Toolbar */}
            {filteredReports.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/70 border border-slate-200/70 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isAllReportsSelected}
                    onChange={toggleSelectAllReports}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>Select All Reports ({filteredReports.length})</span>
                </label>

                <div className="flex items-center gap-2">
                  {selectedReportIds.length > 0 && (
                    <button
                      onClick={() => handleBulkDeleteReports(false)}
                      disabled={isBulkDeleting}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-none disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      <span>Delete Selected ({selectedReportIds.length})</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleBulkDeleteReports(true)}
                    disabled={isBulkDeleting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-red-200 disabled:opacity-50"
                  >
                    <Trash2 size={12} />
                    <span>Delete All Reports</span>
                  </button>
                </div>
              </div>
            )}

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const isSelected = selectedReportIds.includes(report.id) || selectedReportIds.includes(report.session_id);
                const isAgreement = (report.outcome || '').toLowerCase().includes('agree');
                const formattedDate = report.created_at
                  ? new Date(report.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`group relative flex flex-col justify-between rounded-[20px] p-5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border border-blue-500/60 bg-blue-50/70 shadow-md ring-1 ring-blue-500/20'
                        : `hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-lg ${glassInner}`
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => toggleSelectReport(report.id, e as any)}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="rounded-full border border-blue-200/60 bg-blue-50/80 px-2.5 py-0.5 text-[8.5px] font-bold text-blue-600 uppercase tracking-wider">
                            {report.mode === 'human-ai' ? 'Human vs AI' : 'AI Simulation'}
                          </span>
                        </div>

                        {/* 3-Dot Menu */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuReportId(activeMenuReportId === report.id ? null : report.id);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-200 text-slate-600 transition-colors border-none bg-transparent cursor-pointer font-bold text-sm"
                            title="Actions"
                          >
                            ⋮
                          </button>

                          {activeMenuReportId === report.id && (
                            <div
                              ref={menuRef}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-slate-200 bg-white py-1.5 shadow-2xl ring-1 ring-black/10 animate-in fade-in zoom-in-95 duration-100 text-[11px] font-semibold text-slate-800"
                            >
                              <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1">
                                Report Options
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedReportId(report.id);
                                  setActiveMenuReportId(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-100 text-left border-none bg-white cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
                              >
                                <Eye size={13} className="text-slate-500" /> Open Report
                              </button>

                              <button
                                onClick={() => {
                                  handleExport('JSON', report);
                                  setActiveMenuReportId(null);
                                }}
                                className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-slate-100 text-left border-none bg-white cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
                              >
                                <Download size={13} className="text-slate-500" /> Export JSON
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              <button
                                onClick={(e) => handleDeleteReport(report.id, e)}
                                className="flex w-full items-center gap-2.5 px-3 py-2 hover:bg-red-50 text-left border-none bg-white cursor-pointer text-red-600 font-bold transition-colors"
                              >
                                <Trash2 size={13} className="text-red-500" /> Delete Report
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-[#0F172A] group-hover:text-blue-600 transition-colors">
                          {report.scenario_title || report.scenario_id?.replace('-', ' ').toUpperCase()}
                        </h3>
                        <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500 line-clamp-2">
                          {report.summary || 'Negotiation completed and ratified across participating agents.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      {getOutcomeBadge(report.outcome)}

                      <span className="flex items-center gap-1 text-[10.5px] font-bold text-[#3B82F6] transition-transform group-hover:translate-x-1">
                        Open Report <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && !loading && (
                <div className="col-span-full py-16 text-center text-xs text-slate-400 font-semibold bg-white/30 rounded-2xl border border-white/50 space-y-3">
                  <BarChart3 size={32} className="mx-auto text-slate-300" />
                  <p>No outcome reports match your search criteria.</p>
                  <button
                    onClick={() => navigate('/setup/scenario')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#3B82F6] hover:underline cursor-pointer pt-1"
                  >
                    Start a new negotiation session <ChevronRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default OutcomeReportScreen;