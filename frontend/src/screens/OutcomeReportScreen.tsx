import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { reportApi, negotiationApi, OutcomeReport as BackendOutcomeReport, ReportParticipant, ReportKeyEvent } from '../lib/api';
import {
  Download,
  BarChart3,
  MessageSquare,
  Calendar,
  Handshake,
  Lightbulb,
  ArrowLeft,
  Eye,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  User,
  Bot,
  Zap,
  TrendingDown,
  TrendingUp,
  FileText,
  Layers,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

const TEXT = '#0F172A';
const MUTED = '#64748B';

export const OutcomeReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reports, selectedReportId, setSelectedReportId } = useStore();

  const urlSessionId = searchParams.get('session_id') || searchParams.get('report_id');

  const [backendReports, setBackendReports] = useState<BackendOutcomeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportDetail, setActiveReportDetail] = useState<BackendOutcomeReport | null>(null);

  // Sync session_id from URL query if provided
  useEffect(() => {
    if (urlSessionId && urlSessionId !== selectedReportId) {
      setSelectedReportId(urlSessionId);
    }
  }, [urlSessionId, selectedReportId, setSelectedReportId]);

  // 1. Fetch report list from backend API on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    reportApi
      .list()
      .then((data) => {
        if (isMounted) {
          setBackendReports(data);
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
    const targetId = selectedReportId || urlSessionId;
    if (!targetId) {
      setActiveReportDetail(null);
      return;
    }

    let isMounted = true;
    reportApi
      .get(targetId)
      .then((detail) => {
        if (isMounted) {
          setActiveReportDetail(detail);
        }
      })
      .catch(() => {
        // Fallback to negotiation session report endpoint
        return negotiationApi.getNegotiationReport(targetId).then((detail) => {
          if (isMounted) {
            setActiveReportDetail(detail);
          }
        });
      })
      .catch((err) => {
        console.warn('Backend report detail fetch warning:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedReportId, urlSessionId]);

  const allReportsList: BackendOutcomeReport[] = backendReports.length > 0 ? backendReports : reports.map(r => ({
    id: r.id,
    session_id: r.id,
    scenario_id: r.scenarioId,
    scenario_title: r.scenarioTitle,
    mode: r.mode,
    outcome: r.outcome,
    rounds_completed: r.roundsCompleted,
    final_terms: r.finalTerms || {},
    initial_data: {},
    participants: [],
    key_events: [],
    unresolved_terms: {},
    agent_analysis: {},
    overall_score: 85,
    duration_seconds: 60,
    metrics: r.metrics || {},
    summary: r.summary,
    recommendations: r.recommendations,
    created_at: r.dateTime,
  }));

  const activeReport: BackendOutcomeReport | undefined = activeReportDetail || allReportsList.find((r) => r.id === selectedReportId);

  const handleExport = (format: 'JSON' | 'TXT', report: any) => {
    let content = '';
    let mimeType = 'application/json';
    let ext = 'json';

    if (format === 'JSON') {
      content = JSON.stringify(report, null, 2);
    } else {
      mimeType = 'text/plain';
      ext = 'txt';
      content = `=====================================================
NEGOTIATION OUTCOME REPORT
=====================================================
Scenario: ${report.scenario_title} (${report.scenario_id})
Mode: ${report.mode === 'human-ai' ? 'Human vs AI Practice' : 'AI vs AI Simulation'}
Outcome: ${report.outcome}
Overall Score: ${report.overall_score ?? 85}/100
Rounds Completed: ${report.rounds_completed}
Duration: ${report.duration_seconds ? `${report.duration_seconds} seconds` : 'N/A'}
Date: ${report.created_at || 'Recent'}

-----------------------------------------------------
1. INITIAL SCENARIO DATA (GROUND TRUTH)
-----------------------------------------------------
${JSON.stringify(report.initial_data || {}, null, 2)}

-----------------------------------------------------
2. SCENARIO COMPARATIVE ANALYSIS & METRICS
-----------------------------------------------------
${JSON.stringify(report.scenario_analysis || {}, null, 2)}

-----------------------------------------------------
3. PARTICIPANTS
-----------------------------------------------------
${(report.participants || []).map((p: any) => `- ${p.name} (${p.role}) [${p.is_human ? 'HUMAN' : 'AI'}]: ${p.personality}`).join('\n')}

-----------------------------------------------------
4. NEGOTIATION SUMMARY
-----------------------------------------------------
${report.summary || 'N/A'}

-----------------------------------------------------
5. FINAL AGREED TERMS
-----------------------------------------------------
${JSON.stringify(report.final_terms || {}, null, 2)}

-----------------------------------------------------
6. UNRESOLVED / DISPUTED TERMS
-----------------------------------------------------
${JSON.stringify(report.unresolved_terms || {}, null, 2)}

-----------------------------------------------------
7. FINAL ASSESSMENT & SYNTHESIS
-----------------------------------------------------
${report.final_assessment || 'N/A'}

-----------------------------------------------------
8. RECOMMENDATIONS & COACHING
-----------------------------------------------------
${report.recommendations || 'N/A'}
=====================================================`;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.download = `${report.scenario_id || 'negotiation'}-report-${report.id}.${ext}`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const getOutcomeBadge = (outcome: string) => {
    const norm = (outcome || '').toLowerCase();
    if (norm.includes('agreement') && !norm.includes('no') && !norm.includes('partial')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
          <CheckCircle2 size={13} className="text-emerald-600" />
          Agreement Reached
        </span>
      );
    }
    if (norm.includes('partial')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 border border-blue-200 text-blue-700 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
          <Layers size={13} className="text-blue-600" />
          Partial Agreement
        </span>
      );
    }
    if (norm.includes('deadlock') || norm.includes('no agreement')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-50 border border-red-200 text-red-700 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
          <XCircle size={13} className="text-red-600" />
          Deadlock / No Agreement
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 border border-amber-200 text-amber-700 uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
        <AlertTriangle size={13} className="text-amber-600" />
        {outcome || 'Concluded'}
      </span>
    );
  };

  if (allReportsList.length === 0 && !loading) {
    return (
      <div className="pb-8 w-full">
        <div
          className="rounded-[24px] border p-12 text-center max-w-2xl mx-auto"
          style={{
            background: 'rgba(255,255,255,0.70)',
            borderColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 12px 40px rgba(15,23,42,0.05)',
          }}
        >
          <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-blue-50/80 border border-blue-100/50 flex items-center justify-center text-blue-500 shadow-sm">
            <BarChart3 size={32} />
          </div>

          <h2 className="text-xl font-bold tracking-tight" style={{ color: TEXT }}>
            No completed negotiations stored
          </h2>

          <p className="mt-2 text-sm max-w-md mx-auto leading-relaxed" style={{ color: MUTED }}>
            Once you complete an AI vs AI simulation or a practice arena negotiation, your persistent reports will be stored and display here.
          </p>

          <button
            onClick={() => navigate('/setup/scenario')}
            className="mt-8 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md border-none cursor-pointer"
          >
            Start New Negotiation
          </button>
        </div>
      </div>
    );
  }

  // DETAILED VIEW FOR SINGLE REPORT
  if (activeReport) {
    const initialData = activeReport.initial_data || {};
    const participants: ReportParticipant[] = activeReport.participants || [];
    const keyEvents: ReportKeyEvent[] = activeReport.key_events || [];
    const agentAnalysis = activeReport.agent_analysis || {};
    const score = activeReport.overall_score ?? (activeReport.outcome?.includes('Deadlock') ? 42 : 86);
    const duration = activeReport.duration_seconds
      ? `${Math.floor(activeReport.duration_seconds / 60)}m ${activeReport.duration_seconds % 60}s`
      : 'Under 1m';

    return (
      <div className="pb-12 w-full max-w-7xl mx-auto space-y-6">
        {/* TOP BAR: NAVIGATION & EXPORT */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setSelectedReportId(null)}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to Report History
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('TXT', activeReport)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs"
            >
              <FileText size={13} className="text-slate-500" />
              Export Summary (.txt)
            </button>
            <button
              onClick={() => handleExport('JSON', activeReport)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-xs"
            >
              <Download size={13} />
              Download JSON
            </button>
          </div>
        </div>

        {/* HERO OUTCOME HEADER CARD */}
        <div
          className="rounded-[24px] border p-6 md:p-8 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.75)',
            borderColor: 'rgba(255,255,255,0.90)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 12px 40px rgba(15,23,42,0.04)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/60">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  {activeReport.mode === 'human-ai' ? 'Human vs AI Practice Session' : 'Autonomous AI vs AI Simulation'}
                </span>
                <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar size={13} /> {activeReport.created_at ? new Date(activeReport.created_at).toLocaleString() : 'Recent'}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#14234D]">
                {activeReport.scenario_title || 'Negotiation Outcome Report'}
              </h1>
              <p className="text-xs text-slate-500 max-w-2xl font-medium">
                Comprehensive multi-agent post-negotiation audit, analyzing real ground-truth terms, concessions, agent stances, and tactical telemetry.
              </p>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Final Outcome</p>
                <div className="mt-1">{getOutcomeBadge(activeReport.outcome)}</div>
              </div>

              {/* OVERALL NEGOTIATION SCORE BADGE */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center gap-3 shadow-xs">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {score}
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Negotiation Score
                  </span>
                  <span className="text-xs font-black text-[#14234D]">
                    {score >= 80 ? 'Superior Execution' : score >= 60 ? 'Competent Defense' : 'Sub-Optimal / Impasse'}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">Scale: 0 – 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY METRIC PILLS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-blue-500" />
                Rounds Completed
              </span>
              <p className="text-xl font-extrabold mt-1 text-[#14234D]">
                {activeReport.rounds_completed || 1} <span className="text-xs text-slate-400 font-semibold">/ 20 max</span>
              </p>
            </div>

            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-purple-500" />
                Session Duration
              </span>
              <p className="text-xl font-extrabold mt-1 text-purple-700">{duration}</p>
            </div>

            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award size={13} className="text-emerald-500" />
                Agreement Rate
              </span>
              <p className="text-xl font-extrabold mt-1 text-emerald-600">
                {(activeReport.metrics as any)?.agreementRate || (activeReport.metrics as any)?.concessionControl || 85}%
              </p>
            </div>

            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 shadow-2xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity size={13} className="text-orange-500" />
                Concession Control
              </span>
              <p className="text-xl font-extrabold mt-1 text-orange-600">
                {(activeReport.metrics as any)?.concessionControl || 82}%
              </p>
            </div>
          </div>
        </div>

        {/* SECTION: SCENARIO-SPECIFIC COMPARATIVE METRICS & ANALYSIS */}
        {activeReport.scenario_analysis && Object.keys(activeReport.scenario_analysis).length > 0 && (
          <section className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600" />
                <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                  Scenario Comparative Analysis & Metrics
                </h2>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider">
                {activeReport.scenario_id.replace('-', ' ')}
              </span>
            </div>

            {/* VENDOR PRICING VIEW */}
            {activeReport.scenario_id === 'vendor-pricing' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Initial Price</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.initial_price || 'Not available'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Target Price</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.target_price || 'Not available'}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block truncate">Final Agreed Price</span>
                  <span className="text-xs font-black text-emerald-950 mt-1 block truncate">{activeReport.scenario_analysis.final_price || 'Not finalized'}</span>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider block truncate">Price Concessions</span>
                  <span className="text-xs font-black text-blue-950 mt-1 block truncate">{activeReport.scenario_analysis.price_concessions || '0'}</span>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                  <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider block truncate">Net Savings</span>
                  <span className="text-xs font-black text-purple-950 mt-1 block truncate">{activeReport.scenario_analysis.savings || '0%'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Quantity</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.quantity || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Budget Limit</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.budget || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Delivery Timeline</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.delivery || 'Standard'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Quality / Support</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.quality || 'Standard'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Payment Terms</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.payment_terms || 'Net-30'}</span>
                </div>
              </div>
            )}

            {/* JOB OFFER VIEW */}
            {activeReport.scenario_id === 'job-offer' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Initial Salary Offer</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.initial_salary || 'Not available'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Expected Salary</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.expected_salary || 'Not available'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Min Acceptable Salary</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.minimum_acceptable_salary || 'Not available'}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block truncate">Final Agreed Salary</span>
                  <span className="text-xs font-black text-emerald-950 mt-1 block truncate">{activeReport.scenario_analysis.final_salary || 'Not finalized'}</span>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                  <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider block truncate">Salary Delta</span>
                  <span className="text-xs font-black text-blue-950 mt-1 block truncate">{activeReport.scenario_analysis.difference || '0%'}</span>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                  <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider block truncate">Salary Concessions</span>
                  <span className="text-xs font-black text-purple-950 mt-1 block truncate">{activeReport.scenario_analysis.salary_concessions || '0'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Work Arrangement</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.work_mode || 'Hybrid'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Notice Period</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.notice_period || 'Standard'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Benefits Package</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.benefits || 'Standard'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 col-span-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Joining Date & Location</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.joining_date} • {activeReport.scenario_analysis.location}</span>
                </div>
              </div>
            )}

            {/* PROJECT BUDGET VIEW */}
            {activeReport.scenario_id === 'budget-allocation' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Total Budget</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.total_budget || 'Not available'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Initial Allocations</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.initial_allocations || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Requested Allocations</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.requested_allocations || 'Not specified'}</span>
                </div>
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-wider block truncate">Final Allocations</span>
                  <span className="text-xs font-black text-emerald-950 mt-1 block truncate">{activeReport.scenario_analysis.final_allocations || 'Not finalized'}</span>
                </div>
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 col-span-2">
                  <span className="text-[9px] font-bold text-blue-800 uppercase tracking-wider block truncate">Priorities</span>
                  <span className="text-xs font-black text-blue-950 mt-1 block truncate">{activeReport.scenario_analysis.priorities || 'Milestone deliverables'}</span>
                </div>
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200 col-span-2">
                  <span className="text-[9px] font-bold text-purple-800 uppercase tracking-wider block truncate">Resource Requirements</span>
                  <span className="text-xs font-black text-purple-950 mt-1 block truncate">{activeReport.scenario_analysis.resource_requirements || 'Standard allocations'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Remaining Budget</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.remaining_budget || '0'}</span>
                </div>
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 col-span-3">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">Unresolved Allocation Issues</span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">{activeReport.scenario_analysis.unresolved_allocation_issues || 'None'}</span>
                </div>
              </div>
            )}
          </section>
        )}

        {/* SECTION: DEADLOCK ANALYSIS & CONFLICT BREAKDOWN (ONLY WHEN DEADLOCK OCCURRED) */}
        {(activeReport.outcome === 'Deadlock' || activeReport.scenario_analysis?.deadlock_analysis) && (
          <section className="bg-red-50/90 border-2 border-red-200 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-red-200">
              <div className="flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <h2 className="text-sm font-extrabold text-red-950 uppercase tracking-wider">
                  Deadlock Analysis & Constraint Conflict Breakdown
                </h2>
              </div>
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-300 uppercase tracking-wider">
                Impasse Declared
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-white/90 rounded-xl border border-red-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-800 block">
                  Primary Deadlock Cause
                </span>
                <p className="text-slate-800 font-semibold leading-relaxed">
                  {activeReport.scenario_analysis?.deadlock_analysis?.deadlock_reason || 'Mutually incompatible reservation boundaries or negotiation stagnation.'}
                </p>
                <div className="pt-2 text-[11px] text-slate-500 font-medium">
                  Stoppage Point: Round {activeReport.scenario_analysis?.deadlock_analysis?.round_of_deadlock || activeReport.rounds_completed || 1}
                </div>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-red-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-800 block">
                  Why Agreement Was Impossible
                </span>
                <p className="text-slate-800 font-medium leading-relaxed">
                  {activeReport.scenario_analysis?.deadlock_analysis?.why_impossible || 'The Zone of Possible Agreement (ZOPA) is mathematically empty; accommodating one party’s bottom-line would violate the other’s strict constraints.'}
                </p>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-red-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Last Proposal Tabled
                </span>
                <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeReport.scenario_analysis?.deadlock_analysis?.last_positions?.last_proposal || 'Reservation ceiling anchor maintained.'}
                </p>
              </div>

              <div className="p-4 bg-white/90 rounded-xl border border-red-200 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Counterparty Position
                </span>
                <p className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {activeReport.scenario_analysis?.deadlock_analysis?.last_positions?.counterpart_position || 'Floor reservation anchor maintained.'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 1: REAL SCENARIO INITIAL DATA (AUTHORITATIVE GROUND TRUTH) */}
        <section className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                1. Authoritative Initial Scenario Data (Ground Truth)
              </h2>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              User Provided Ground Truth
            </span>
          </div>

          <p className="text-xs text-slate-500 font-medium">
            The negotiation was conducted strictly using these user-entered scenario parameters as the authoritative baseline for all agent reasoning:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(initialData).length > 0 ? (
              Object.entries(initialData).map(([key, val]) => (
                <div key={key} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-black text-slate-800 mt-1 block truncate">
                    {String(val) || 'N/A'}
                  </span>
                </div>
              ))
            ) : (
              <div className="col-span-full p-4 text-center text-xs text-slate-400 italic">
                Baseline scenario parameters applied from selected scenario defaults.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: PARTICIPANTS & AGENT ANALYSIS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* PARTICIPANTS CARD (7 cols) */}
          <div className="lg:col-span-7 bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User size={17} className="text-blue-600" />
                <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                  2. Participants & Stakeholders
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase">
                {participants.length} Parties Involved
              </span>
            </div>

            <div className="space-y-3">
              {participants.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-xs ${
                        p.is_human ? 'bg-blue-600' : idx === 1 ? 'bg-orange-500' : 'bg-purple-600'
                      }`}
                    >
                      {p.avatar || (p.is_human ? 'YOU' : 'AI')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-extrabold text-[#14234D]">{p.name}</h4>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                            p.is_human
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-orange-50 text-orange-800 border-orange-200'
                          }`}
                        >
                          {p.is_human ? 'Human User' : 'Autonomous AI'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold">{p.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-semibold sm:border-l sm:border-slate-100 sm:pl-4">
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Personality</span>
                      <span className="text-[11px] text-slate-700 font-bold">{p.personality || 'Collaborative'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase font-bold block">Experience</span>
                      <span className="text-[11px] text-slate-700 font-bold">{p.experience || 'Senior'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AGENT BEHAVIOR & STRATEGY ANALYSIS (5 cols) */}
          <div className="lg:col-span-5 bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Zap size={17} className="text-amber-500" />
                <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                  3. Behavior & Strategy Analysis
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {Object.keys(agentAnalysis).length > 0 ? (
                Object.entries(agentAnalysis).map(([agentName, analysis]: [string, any]) => (
                  <div key={agentName} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-[#14234D]">{agentName}</span>
                      <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {analysis.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                      <span className="font-bold text-slate-700">Tactic:</span> {analysis.strategy}
                    </p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-1 border-t border-slate-200/50">
                      <span>Messages: <strong className="text-slate-800">{analysis.messages_sent}</strong></span>
                      <span>Offers Tabled: <strong className="text-slate-800">{analysis.offers_tabled}</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-500 italic">
                  Agents maintained firm anchoring positions before trading secondary dimensions to explore mutual gains.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: NEGOTIATION SUMMARY */}
        <section className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <MessageSquare size={17} className="text-blue-600" />
            <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
              4. Executive Negotiation Summary
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-line">
            {activeReport.summary || 'The negotiation concluded after structured multi-turn exchanges with parties presenting offers, counter-offers, and adjustments.'}
          </p>
        </section>

        {/* SECTION 4: TIMELINE OF KEY EVENTS (OFFERS, COUNTER-OFFERS, CONCESSIONS) */}
        <section className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity size={17} className="text-indigo-600" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                5. Chronological Timeline of Key Events
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">
              {keyEvents.length} Structured Milestones Recorded
            </span>
          </div>

          <div className="space-y-3">
            {keyEvents.length > 0 ? (
              keyEvents.map((ev, i) => {
                const isAccept = ev.event_type === 'agreement_reached';
                const isConcession = ev.event_type === 'concession';
                const isCounter = ev.event_type === 'counter_offer';

                return (
                  <div
                    key={i}
                    className={`p-4 rounded-2xl border transition-all ${
                      isAccept
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : isConcession
                        ? 'bg-amber-50/60 border-amber-200'
                        : isCounter
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase">
                          Round {ev.round} • Turn {ev.turn_index + 1}
                        </span>
                        <span className="font-extrabold text-xs text-[#14234D]">{ev.speaker}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">({ev.role})</span>
                      </div>

                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isAccept
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isConcession
                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                            : isCounter
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        {ev.event_type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 font-medium leading-relaxed">
                      {ev.summary}
                    </p>

                    {/* Offer Terms Badges */}
                    {ev.terms && Object.keys(ev.terms).length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex flex-wrap gap-2 text-[10px]">
                        {Object.entries(ev.terms).map(([tk, tv]) => (
                          <span
                            key={tk}
                            className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-bold"
                          >
                            {tk}: <strong className="text-blue-700 font-black">{String(tv)}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Concessions Bullet */}
                    {ev.concessions && ev.concessions.length > 0 && (
                      <div className="mt-2 text-[10px] font-bold text-amber-800 flex items-center gap-1.5">
                        <TrendingDown size={12} className="text-amber-600 shrink-0" />
                        <span>Concessions: {ev.concessions.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                No individual turn milestone events recorded.
              </div>
            )}
          </div>
        </section>

        {/* SECTION 5: FINAL AGREED TERMS VS UNRESOLVED TERMS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* FINAL AGREED TERMS */}
          <div className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Handshake size={17} className="text-emerald-600" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                6. Mutually Agreed Terms
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(activeReport.final_terms || {}).length > 0 ? (
                Object.entries(activeReport.final_terms || {}).map(([key, val]) => (
                  <div key={key} className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block truncate">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xs font-black text-emerald-950 mt-1 block truncate">
                      {String(val) || 'Consensus Confirmed'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl">
                  {activeReport.outcome?.includes('Deadlock')
                    ? 'No final terms ratified due to negotiation deadlock.'
                    : 'Final terms settled in open dialogue.'}
                </div>
              )}
            </div>
          </div>

          {/* UNRESOLVED / DISPUTED TERMS */}
          <div className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertTriangle size={17} className="text-red-500" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                7. Unresolved & Disputed Dimensions
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(activeReport.unresolved_terms || {}).length > 0 ? (
                Object.entries(activeReport.unresolved_terms || {}).map(([key, val]) => (
                  <div key={key} className="p-3 bg-red-50/60 border border-red-200/80 rounded-xl">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-800 block truncate">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className="text-xs font-black text-red-950 mt-1 block truncate">
                      {String(val)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-4 text-center text-xs text-emerald-700 font-semibold bg-emerald-50/50 rounded-xl border border-emerald-100">
                  All critical terms were successfully resolved without lingering impasses.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 6: NEGOTIATION METRICS & PRACTICAL RECOMMENDATIONS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* DETAILED METRICS GAUGE GRID (6 cols) */}
          <div className="lg:col-span-6 bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <BarChart3 size={17} className="text-blue-600" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                8. Comprehensive Telemetry Scores
              </h2>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Concession Discipline', val: (activeReport.metrics as any)?.concessionControl || 85, color: 'bg-blue-600' },
                { label: 'Argument Strength & Persuasion', val: (activeReport.metrics as any)?.argumentStrength || 80, color: 'bg-indigo-600' },
                { label: 'Active Listening & Responsiveness', val: (activeReport.metrics as any)?.activeListening || 75, color: 'bg-purple-600' },
                { label: 'Utility Realization', val: (activeReport.metrics as any)?.utilityScore || 78, color: 'bg-emerald-600' },
              ].map((m) => (
                <div key={m.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{m.label}</span>
                    <span className="text-[#14234D] font-extrabold">{m.val}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${m.color} rounded-full transition-all duration-500`} style={{ width: `${m.val}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PRACTICAL COACHING RECOMMENDATIONS (6 cols) */}
          <div className="lg:col-span-6 bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lightbulb size={17} className="text-amber-500" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                9. Strategic Coaching & Recommendations
              </h2>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/70 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                Actionable Takeaways for Future Sessions
              </span>
              <p className="text-xs leading-relaxed text-slate-700 font-medium">
                {activeReport.recommendations ||
                  'Anchor early with a well-grounded initial proposal. When meeting resistance, package secondary terms (e.g. warranty or delivery timelines) as trade-offs rather than making unilateral single-issue concessions.'}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 10: OVERALL FINAL ASSESSMENT NARRATIVE */}
        {activeReport.final_assessment && (
          <section className="bg-white/80 border border-white/90 rounded-[22px] p-6 shadow-sm backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award size={17} className="text-blue-600" />
              <h2 className="text-sm font-extrabold text-[#14234D] uppercase tracking-wider">
                10. Final Assessment & Synthesis
              </h2>
            </div>
            <p className="text-xs leading-relaxed text-slate-700 font-medium whitespace-pre-line">
              {activeReport.final_assessment}
            </p>
          </section>
        )}

        {/* BOTTOM ACTION BAR */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/setup/scenario')}
            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md border-none cursor-pointer flex items-center gap-2"
          >
            Start Another Negotiation
            <ChevronRight size={14} />
          </button>

          <button
            onClick={() => handleExport('JSON', activeReport)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-full text-xs font-bold transition-all shadow-xs"
          >
            <Download size={14} />
            Download Complete Audit Record (JSON)
          </button>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW: LIST OF STORED REPORTS
  return (
    <div className="pb-12 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#14234D] tracking-tight">
            Negotiation Reports & Audits
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Review detailed analytical reports, telemetry scores, and key round milestones from completed sessions.
          </p>
        </div>

        <button
          onClick={() => navigate('/setup/scenario')}
          className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-sm border-none cursor-pointer"
        >
          New Negotiation
        </button>
      </div>

      <div
        className="rounded-[24px] border p-6 md:p-8"
        style={{
          background: 'rgba(255,255,255,0.75)',
          borderColor: 'rgba(255,255,255,0.90)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 12px 40px rgba(15,23,42,0.03)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allReportsList.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className="bg-white/80 hover:bg-white border border-white hover:border-blue-200 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-[180px] group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full uppercase tracking-wider">
                    {report.mode === 'human-ai' ? 'Practice' : 'Simulation'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Recent'}
                  </span>
                </div>

                <h3 className="text-sm font-black text-[#14234D] tracking-tight mt-2.5 truncate">
                  {report.scenario_title}
                </h3>

                <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 mt-1.5 font-medium">
                  {report.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-2">
                {getOutcomeBadge(report.outcome)}

                <span className="text-[11px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform duration-200">
                  Full Report
                  <Eye size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OutcomeReportScreen;