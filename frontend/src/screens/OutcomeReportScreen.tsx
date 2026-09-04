import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  reportApi,
  OutcomeReport as BackendOutcomeReport,
  TimelineEvent,
  ParameterProgression,
  TurningPointEvent,
  DetectedTechnique,
  AgentScorecard,
  ValidationCheck,
} from '../lib/api';
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
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  Play,
  Share2,
  Trash2,
  Clock,
  ShieldCheck,
  Target,
  ArrowRight,
  HelpCircle,
  FileText,
  UserCheck,
  Check,
  X,
  Minus,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

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

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // 1. Fetch report list from backend API on mount
  const refreshReportsList = async () => {
    try {
      setLoading(true);
      const data = await reportApi.list();
      const list = data || [];
      setBackendReports(list);
      return list;
    } catch (err) {
      console.warn('Backend reports fetch warning:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshReportsList().then((list) => {
      if (list.length > 0 && !selectedReportId) {
        setSelectedReportId(list[0].id);
      }
    });
  }, []);

  // 2. Fetch specific report detail when selected with safe fallback & generation recovery
  const loadReportDetail = async (targetId: string, retryCount = 0) => {
    setReportError(null);
    setIsGeneratingReport(true);

    try {
      // First attempt: GET /reports/{id}
      try {
        const detail = await reportApi.get(targetId);
        if (detail) {
          setActiveReportDetail(detail);
          setBackendReports((prev) => {
            if (!prev.some((r) => r.id === detail.id || r.session_id === detail.session_id)) {
              return [detail, ...prev];
            }
            return prev.map((r) => (r.id === detail.id || r.session_id === detail.session_id ? detail : r));
          });
          setIsGeneratingReport(false);
          return;
        }
      } catch (err) {
        // Fall through to session lookup
      }

      // Second attempt: GET /reports/session/{id}
      try {
        const sessDetail = await reportApi.getBySession(targetId);
        if (sessDetail) {
          setActiveReportDetail(sessDetail);
          setBackendReports((prev) => {
            if (!prev.some((r) => r.id === sessDetail.id || r.session_id === sessDetail.session_id)) {
              return [sessDetail, ...prev];
            }
            return prev.map((r) => (r.id === sessDetail.id || r.session_id === sessDetail.session_id ? sessDetail : r));
          });
          setIsGeneratingReport(false);
          return;
        }
      } catch (err) {
        // Fall through to generate endpoint
      }

      // Third attempt: POST /reports/session/{id}/generate (if session is terminal but report wasn't generated yet)
      try {
        const genDetail = await reportApi.generate(targetId);
        if (genDetail) {
          setActiveReportDetail(genDetail);
          setBackendReports((prev) => {
            if (!prev.some((r) => r.id === genDetail.id || r.session_id === genDetail.session_id)) {
              return [genDetail, ...prev];
            }
            return prev.map((r) => (r.id === genDetail.id || r.session_id === genDetail.session_id ? genDetail : r));
          });
          setIsGeneratingReport(false);
          return;
        }
      } catch (err) {
        // Fall through
      }

      // If still not found and retryCount < 2, retry after 1.5s
      if (retryCount < 2) {
        setTimeout(() => {
          loadReportDetail(targetId, retryCount + 1);
        }, 1500);
        return;
      }

      // Fallback to local store or show message
      const found = allReportsList.find((r) => r.id === targetId || r.session_id === targetId);
      if (found) {
        setActiveReportDetail(found as any);
      } else {
        setReportError('Unable to load or generate the outcome report for this session.');
      }
    } catch (err: any) {
      console.error('Failed to load report detail:', err);
      setReportError(err.message || 'Failed to load report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  useEffect(() => {
    if (!selectedReportId) {
      setActiveReportDetail(null);
      return;
    }
    loadReportDetail(selectedReportId);
  }, [selectedReportId]);

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

  const analysis = activeReport?.analysis;

  const handleExport = (format: string, report: any) => {
    const exportPayload = {
      report_id: report.id,
      session_id: report.session_id,
      scenario_title: report.scenario_title,
      mode: report.mode,
      outcome: report.outcome,
      rounds_completed: report.rounds_completed,
      final_terms: report.final_terms,
      analysis: report.analysis || null,
      metrics: report.metrics,
      summary: report.summary,
      recommendations: report.recommendations,
      created_at: report.created_at,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${report.scenario_id || 'negotiation'}-intelligence-report-${report.id}.${format.toLowerCase()}`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getOutcomeBadge = (outcome: string) => {
    const out = (outcome || '').toLowerCase();
    if (out.includes('agree') || out === 'agreement reached') {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Agreement Reached
        </span>
      );
    }
    if (out.includes('deadlock')) {
      return (
        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10.5px] font-bold bg-red-50 border border-red-200 text-red-700 uppercase tracking-wider">
          <AlertTriangle size={13} className="text-red-600" />
          Deadlock Reached
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-[10.5px] font-bold bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider">
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

  const isAgreement = (activeReport?.outcome || '').toLowerCase().includes('agree');

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
                Negotiation Intelligence & Explainability
              </span>
            </div>
            <h1 className="mt-1 text-[24px] font-bold tracking-[-0.03em] text-[#1E2230]">
              Negotiation Intelligence Reports
            </h1>
            <p className="text-[11px] font-medium text-[#64748B]">
              Evidence-based analytics derived purely from configured constraints, message transcripts, and validated offers.
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
        {selectedReportId && isGeneratingReport && !activeReport ? (
          <div className={`rounded-[24px] p-12 text-center space-y-4 ${glassPrimary}`}>
            <div className="mx-auto w-12 h-12 rounded-full border-3 border-blue-600/30 border-t-blue-600 animate-spin" />
            <h3 className="text-sm font-bold text-slate-800">Generating Negotiation Intelligence Report...</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Analyzing constraints, message transcripts, and offer evolution to produce dynamic insights.
            </p>
          </div>
        ) : selectedReportId && reportError && !activeReport ? (
          <div className={`rounded-[24px] p-8 text-center space-y-4 ${glassPrimary}`}>
            <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Report Unavailable</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">{reportError}</p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => loadReportDetail(selectedReportId)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer border-none"
              >
                Retry Report Generation
              </button>
              <button
                onClick={() => setSelectedReportId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer border-none"
              >
                Back to Reports List
              </button>
            </div>
          </div>
        ) : activeReport ? (
          <div className="space-y-6">
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
                  Export Intelligence JSON
                </button>
              </div>
            </div>

            {/* 1. REPORT HEADER & OVERVIEW */}
            <div className={`rounded-[24px] p-6 md:p-8 space-y-6 ${glassPrimary}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/60">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                    Negotiation Assessment
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#0F172A] mt-1">
                    {activeReport.scenario_title || activeReport.scenario_id?.replace('-', ' ').toUpperCase()}
                  </h2>
                  {analysis?.overview?.scenario_objective && (
                    <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                      <span className="font-semibold text-slate-800">Objective:</span> {analysis.overview.scenario_objective}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs mt-2.5 text-[#64748B]">
                    <span className="font-semibold text-slate-800">
                      {activeReport.mode === 'human-ai' ? 'Human vs AI Interactive Practice' : 'Autonomous AI vs AI Simulation'}
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
                    {analysis?.overview?.duration && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <Clock size={13} className="text-slate-400" />
                          {analysis.overview.duration}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div>{getOutcomeBadge(activeReport.outcome)}</div>
              </div>

              {/* 2. DYNAMIC KPI CARDS (NO FABRICATED METRICS) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Rounds Completed
                  </span>
                  <p className="text-2xl font-bold mt-1 text-[#0F172A]">
                    {activeReport.rounds_completed ?? activeReport.metrics?.rounds_completed ?? 1}{' '}
                    <span className="text-xs font-medium text-slate-400">Rounds</span>
                  </p>
                </div>

                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Total Message Turns
                  </span>
                  <p className="text-2xl font-bold mt-1 text-[#0F172A] flex items-center gap-1">
                    <Activity size={20} className="text-blue-500" />
                    {analysis?.overview?.total_turns ?? activeReport.metrics?.total_turns ?? 'Available'}
                    <span className="text-xs font-medium text-slate-400">Exchanges</span>
                  </p>
                </div>

                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {isAgreement ? 'Agreement Confidence' : 'Deadlock Confidence'}
                  </span>
                  <p className={`text-2xl font-bold mt-1 flex items-center gap-1 ${isAgreement ? 'text-emerald-600' : 'text-amber-600'}`}>
                    <ShieldCheck size={20} className={isAgreement ? 'text-emerald-500' : 'text-amber-500'} />
                    {analysis?.confidence_analysis?.confidence_score !== undefined && analysis?.confidence_analysis?.confidence_score !== null
                      ? `${analysis.confidence_analysis.confidence_score}%`
                      : 'Verified'}
                    <span className="text-[10px] font-semibold text-slate-500 ml-1">
                      ({analysis?.confidence_analysis?.confidence_level || 'Evidence-Backed'})
                    </span>
                  </p>
                </div>

                <div className={`rounded-2xl p-4.5 ${glassInner}`}>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Concessions Detected
                  </span>
                  <p className="text-2xl font-bold mt-1 text-purple-600 flex items-center gap-1">
                    <TrendingUp size={20} className="text-purple-500" />
                    {analysis?.concession_analysis?.total_concessions_detected ?? 0}
                    <span className="text-xs font-medium text-slate-400">Moves</span>
                  </p>
                </div>
              </div>

              {/* 3. DEDICATED OUTCOME EXPLANATION (WHY AGREEMENT OR WHY DEADLOCK) */}
              {isAgreement && analysis?.agreement_analysis ? (
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Why Agreement Was Reached
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl bg-white/80 p-3 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Initial Gap
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.agreement_analysis.how_agreement_reached.initial_gap}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Bargaining Movement
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.agreement_analysis.how_agreement_reached.negotiation_movement}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Final Convergence
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.agreement_analysis.how_agreement_reached.final_convergence}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Acceptance Trigger
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.agreement_analysis.how_agreement_reached.acceptance_trigger}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {!isAgreement && analysis?.deadlock_analysis ? (
                <div className="rounded-2xl border border-red-200/80 bg-red-50/60 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={16} className="text-red-600" />
                    Why Agreement Was Not Reached (Deadlock Analysis)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl bg-white/80 p-3.5 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Primary Conflict
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.deadlock_analysis.primary_conflict}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3.5 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Feasibility Assessment
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.deadlock_analysis.last_compatible_opportunity}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/80 p-3.5 shadow-xs">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Deadlock Trigger
                      </span>
                      <p className="text-slate-800 font-medium">
                        {analysis.deadlock_analysis.deadlock_cause}: {analysis.deadlock_analysis.stagnation_evidence}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 4. RATIFIED FINAL TERMS */}
              <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <Handshake size={17} className="text-[#3B82F6]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    {isAgreement ? 'Ratified Final Terms' : 'Final Position on Table Prior to Deadlock'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
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
                    <div className="col-span-full text-center py-6 text-xs font-semibold text-slate-400 bg-white/40 rounded-xl">
                      No commercial parameters were locked in this session.
                    </div>
                  )}
                </div>
              </div>

              {/* 5. ORIGINAL CONFIGURATION SNAPSHOT */}
              {analysis?.configuration_snapshot && analysis.configuration_snapshot.length > 0 && (
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Target size={17} className="text-[#3B82F6]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Original Configuration Snapshot
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    {analysis.configuration_snapshot.map((agent) => (
                      <div
                        key={agent.agent_id || agent.name}
                        className="rounded-xl border border-white/85 bg-white/70 p-4 space-y-3.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">
                              {agent.avatar || agent.name.slice(0, 2).toUpperCase()}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{agent.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium">{agent.role}</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-bold text-slate-600">
                            {agent.personality || 'Standard'}
                          </span>
                        </div>

                        {/* Goals */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                            Configured Goals
                          </span>
                          <div className="space-y-1">
                            {agent.goals.map((g, gIdx) => (
                              <div key={gIdx} className="flex items-start gap-1.5 text-xs text-slate-800">
                                <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-bold mt-0.5 ${g.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                  {g.priority}
                                </span>
                                <span className="font-medium text-[11.5px]">{g.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Constraints */}
                        {agent.hard_constraints.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                              Hard Constraints
                            </span>
                            <div className="space-y-1">
                              {agent.hard_constraints.map((c, cIdx) => (
                                <div key={cIdx} className="text-[11.5px] text-slate-700 font-medium bg-slate-50/80 px-2.5 py-1 rounded-lg border border-slate-100">
                                  <span className="font-bold text-slate-900">{c.label}:</span> {c.value}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Parameters Table */}
                        {agent.parameter_positions && agent.parameter_positions.length > 0 && (
                          <div className="pt-2">
                            <table className="w-full text-[11px] text-left border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[8.5px]">
                                  <th className="py-1">Parameter</th>
                                  <th className="py-1">Initial Position</th>
                                  <th className="py-1 text-right">Final Outcome</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {agent.parameter_positions.map((p, pIdx) => (
                                  <tr key={pIdx}>
                                    <td className="py-1.5 font-bold text-slate-800 capitalize">{p.parameter}</td>
                                    <td className="py-1.5 text-slate-600">{p.initial_position}</td>
                                    <td className="py-1.5 text-right font-semibold text-blue-600">{p.final_position}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. NEGOTIATION JOURNEY / TIMELINE */}
              {analysis?.negotiation_timeline && analysis.negotiation_timeline.length > 0 && (
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Clock size={17} className="text-[#3B82F6]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Negotiation Journey / Timeline ({analysis.negotiation_timeline.length} Events)
                    </h3>
                  </div>

                  <div className="relative border-l-2 border-blue-200 ml-3 space-y-4 py-2">
                    {analysis.negotiation_timeline.map((evt, idx) => (
                      <div key={idx} className="relative pl-6 space-y-1.5">
                        <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                            Round {evt.round} • Turn {evt.turn_index + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{evt.sender}</span>
                          <span className="text-[9px] text-slate-500 font-semibold">({evt.role})</span>
                          <span className="ml-auto text-[9.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {evt.action}
                          </span>

                          {/* Turn Token Telemetry Badge */}
                          {evt.is_user ? (
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100/80 border border-slate-200 px-2 py-0.5 rounded-full" title="Human message (No LLM completion)">
                              Human turn
                            </span>
                          ) : evt.token_usage?.usage_available ? (
                            <span className="text-[9px] font-mono font-bold text-blue-700 bg-blue-50/90 border border-blue-200 px-2 py-0.5 rounded-full" title={`${evt.token_usage.provider || 'LLM'}: ${evt.token_usage.input_tokens ?? 0} in / ${evt.token_usage.output_tokens ?? 0} out`}>
                              ⚡ {(evt.token_usage.total_tokens ?? 0).toLocaleString()} tok
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs text-slate-700 font-medium bg-white/70 p-3 rounded-xl border border-slate-100/90 shadow-xs">
                          {evt.key_position}
                        </p>

                        {evt.what_changed && (
                          <div className="text-[10.5px] text-blue-800 bg-blue-50/60 px-3 py-1 rounded-lg border border-blue-100">
                            <span className="font-bold">What changed:</span> {evt.what_changed}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. OFFER EVOLUTION & CHARTS */}
              <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                <div className="flex items-center gap-2 text-[#0F172A]">
                  <BarChart3 size={17} className="text-[#3B82F6]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Offer Evolution & Progression Analysis
                  </h3>
                </div>

                {analysis?.offer_evolution?.has_numeric_chart_data && analysis.offer_evolution.chart_data.length >= 2 ? (
                  <div className="space-y-4 pt-2">
                    <div className="h-64 w-full bg-white/80 p-4 rounded-xl border border-slate-100 shadow-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analysis.offer_evolution.chart_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="round" tick={{ fontSize: 11, fill: '#64748B' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              borderRadius: '12px',
                              border: '1px solid #E2E8F0',
                              fontSize: '11px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                          {analysis.offer_evolution.parameters.map((p, pIdx) => (
                            <Line
                              key={p.parameter}
                              type="monotone"
                              dataKey={p.parameter}
                              stroke={pIdx === 0 ? '#3B82F6' : pIdx === 1 ? '#10B981' : '#8B5CF6'}
                              strokeWidth={2.5}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-500 font-medium bg-white/40 rounded-xl border border-slate-100">
                    <p>{analysis?.offer_evolution?.reason || 'Insufficient numeric offer data for progression visualization.'}</p>
                    {analysis?.offer_evolution?.parameters && analysis.offer_evolution.parameters.length > 0 && (
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {analysis.offer_evolution.parameters.map((p, idx) => (
                          <span key={idx} className="bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 text-[10.5px] font-semibold text-slate-700">
                            {p.parameter}: {p.progression.length} proposal state(s)
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 8. CRITICAL TURNING POINTS */}
              {analysis?.turning_points && analysis.turning_points.length > 0 && (
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Sparkles size={17} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Critical Turning Points & Milestones
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    {analysis.turning_points.map((tp, idx) => (
                      <div key={idx} className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                            Round {tp.round} • Turn {tp.turn + 1}
                          </span>
                          <span className="text-[10px] font-bold text-slate-700">{tp.agent}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{tp.what_happened}</h4>
                        <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{tp.why_it_mattered}</p>
                        <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-lg border border-amber-100/60 font-mono">
                          <span className="font-bold text-slate-700 font-sans">Evidence:</span> {tp.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. CONCESSION & STRATEGY ANALYSIS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Concession Analysis */}
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <TrendingUp size={17} className="text-purple-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Concession Dynamics
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {analysis?.concession_analysis?.agent_concessions?.map((ac, idx) => (
                      <div key={idx} className="rounded-xl border border-white/85 bg-white/75 p-3.5 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{ac.agent_name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                            {ac.concessions_count} Concession{ac.concessions_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">{ac.direction}</p>
                        {ac.largest_concession && (
                          <div className="text-[10px] text-slate-700 bg-purple-50/40 p-2 rounded-lg border border-purple-100">
                            <span className="font-bold">Largest adjustment:</span> {ac.largest_concession.parameter} changed from '{ac.largest_concession.previous_value}' to '{ac.largest_concession.new_value}' in Round {ac.largest_concession.round}.
                          </div>
                        )}
                      </div>
                    ))}
                    {(!analysis?.concession_analysis?.agent_concessions || analysis.concession_analysis.agent_concessions.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-4">No concessions detected in this session.</p>
                    )}
                  </div>
                </div>

                {/* Strategy & Technique Analysis */}
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Lightbulb size={17} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Detected Negotiation Strategies ({analysis?.strategy_analysis?.total_detected ?? 0})
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {analysis?.strategy_analysis?.techniques?.map((tech, idx) => (
                      <div key={idx} className="rounded-xl border border-white/85 bg-white/75 p-3 space-y-1 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{tech.technique}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tech.confidence === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            {tech.confidence} Confidence
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 font-medium">Used by: <span className="font-bold text-slate-700">{tech.used_by}</span></p>
                        <p className="text-[11px] text-slate-700 font-medium leading-relaxed bg-slate-50 p-2 rounded-lg">
                          {tech.evidence}
                        </p>
                      </div>
                    ))}
                    {(!analysis?.strategy_analysis?.techniques || analysis.strategy_analysis.techniques.length === 0) && (
                      <p className="text-xs text-slate-400 text-center py-4">Insufficient evidence to classify specific tactical maneuvers.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 10. AGENT PERFORMANCE ANALYSIS SCORECARD */}
              {analysis?.agent_analysis && analysis.agent_analysis.length > 0 && (
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <UserCheck size={17} className="text-[#3B82F6]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Agent Negotiation Performance Scorecard
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.agent_analysis.map((sc, idx) => (
                      <div key={idx} className="rounded-xl border border-white/85 bg-white/75 p-4 space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{sc.agent_name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{sc.role}</p>
                          </div>
                          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {sc.constraint_compliance}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Offers Tabled</span>
                            <span className="text-sm font-bold text-blue-600">{sc.offers_made_count}</span>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <span className="text-[9px] font-bold uppercase text-slate-400 block">Concessions Made</span>
                            <span className="text-sm font-bold text-purple-600">{sc.concessions_made_count}</span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-700 space-y-1">
                          <p><span className="font-bold text-slate-900">Primary Objective:</span> {sc.primary_objective}</p>
                          <p><span className="font-bold text-slate-900">Initial Position:</span> {sc.initial_position}</p>
                          <p><span className="font-bold text-slate-900">Final Position:</span> {sc.final_position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. AGREEMENT VALIDATION CHECKLIST */}
              {analysis?.confidence_analysis?.checks && analysis.confidence_analysis.checks.length > 0 && (
                <div className={`rounded-2xl p-6 space-y-4 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <ShieldCheck size={17} className="text-emerald-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Validation & Evidence Checklist
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {analysis.confidence_analysis.checks.map((check, idx) => (
                      <div key={idx} className="rounded-xl border border-white/85 bg-white/80 p-3.5 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{check.name}</span>
                          {check.status === 'passed' ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <Check size={12} />
                            </span>
                          ) : check.status === 'failed' ? (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700">
                              <X size={12} />
                            </span>
                          ) : (
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                              <Minus size={12} />
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-500 font-medium leading-tight">{check.description}</p>
                        <div className="text-[10px] text-slate-700 bg-slate-50 p-2 rounded-lg font-mono">
                          {check.evidence}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* LLM TOKEN USAGE TELEMETRY SECTION */}
              <div className={`rounded-2xl p-6 space-y-5 ${glassInner}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center gap-2.5 text-[#0F172A]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
                        LLM Token Usage Telemetry
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Measured LLM token consumption across negotiation orchestration turns
                      </p>
                    </div>
                  </div>

                  {analysis?.token_usage?.available ? (
                    <span className="self-start sm:self-auto rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                      Active Telemetry
                    </span>
                  ) : (
                    <span className="self-start sm:self-auto rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[9.5px] font-bold text-slate-500">
                      Telemetry Unavailable
                    </span>
                  )}
                </div>

                {analysis?.token_usage?.available ? (
                  <div className="space-y-5">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                      <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Tokens</span>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-slate-900">
                            {(analysis.token_usage.total_tokens ?? 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500">tokens</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Prompt / Input</span>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-blue-600">
                            {(analysis.token_usage.input_tokens ?? 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({analysis.token_usage.input_percentage || 0}%)
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completion / Output</span>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-emerald-600">
                            {(analysis.token_usage.output_tokens ?? 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({analysis.token_usage.output_percentage || 0}%)
                          </span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/80 bg-white/70 p-4 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">LLM Invocations</span>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-indigo-700">
                            {analysis.token_usage.llm_calls || 0}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">calls</span>
                        </div>
                      </div>
                    </div>

                    {/* Input vs Output Visual Ratio */}
                    <div className="rounded-xl border border-white/80 bg-white/60 p-4 space-y-2">
                      <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                        <span>Input ({analysis.token_usage.input_percentage || 0}%)</span>
                        <span>Output ({analysis.token_usage.output_percentage || 0}%)</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          style={{ width: `${analysis.token_usage.input_percentage || 50}%` }}
                          className="bg-blue-500 transition-all duration-500"
                        />
                        <div
                          style={{ width: `${analysis.token_usage.output_percentage || 50}%` }}
                          className="bg-emerald-500 transition-all duration-500"
                        />
                      </div>
                    </div>

                    {/* Breakdown by Agent and Breakdown by Model */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* By Agent */}
                      <div className="rounded-xl border border-white/80 bg-white/70 p-4 space-y-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Usage by Agent
                        </h4>
                        <div className="space-y-2.5">
                          {(analysis.token_usage.by_agent || []).map((ag, i) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-800">{ag.agent_name || ag.role}</p>
                                <p className="text-[10px] text-slate-500">{ag.calls} turns • {ag.role}</p>
                              </div>
                              <div className="text-right font-mono font-bold text-slate-800">
                                {ag.total_tokens.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">tok</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* By Model */}
                      <div className="rounded-xl border border-white/80 bg-white/70 p-4 space-y-3">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                          Usage by Model & Provider
                        </h4>
                        <div className="space-y-2.5">
                          {(analysis.token_usage.by_model || []).map((m, i) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50/80 border border-slate-100">
                              <div>
                                <p className="font-bold text-slate-800">{m.model}</p>
                                <span className="text-[9.5px] font-semibold text-blue-600 uppercase tracking-wider">
                                  {m.provider}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-slate-800">{m.total_tokens.toLocaleString()} tok</p>
                                <p className="text-[10px] text-slate-500">{m.calls} invocations</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-5 text-center space-y-1.5">
                    <p className="text-xs font-semibold text-slate-600">
                      Token usage telemetry was not captured for this negotiation session or was run using fallback logic.
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Future sessions will record provider usage metadata automatically.
                    </p>
                  </div>
                )}
              </div>

              {/* 12. DYNAMIC EXECUTIVE SUMMARY & STRATEGIC RECOMMENDATIONS */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className={`rounded-2xl p-6 space-y-3.5 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <FileText size={17} className="text-blue-600" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Evidence-Grounded Executive Summary
                    </h3>
                  </div>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100/80">
                    {activeReport.summary || analysis?.summary || 'Negotiation completed and ratified across participating agents.'}
                  </p>
                </div>

                <div className={`rounded-2xl p-6 space-y-3.5 ${glassInner}`}>
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Lightbulb size={17} className="text-amber-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider">
                      Strategic Recommendations
                    </h3>
                  </div>
                  <div className="text-xs text-slate-800 font-medium leading-relaxed bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80 whitespace-pre-line">
                    {activeReport.recommendations || analysis?.recommendations || 'Anchor initial proposals with structured multi-issue options to maximize surplus.'}
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