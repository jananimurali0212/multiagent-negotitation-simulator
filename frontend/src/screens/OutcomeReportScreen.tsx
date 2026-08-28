import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { reportApi, OutcomeReport as BackendOutcomeReport } from '../lib/api';
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
  AlertTriangle
} from 'lucide-react';

const TEXT = '#0F172A';
const MUTED = '#64748B';

export const OutcomeReportScreen: React.FC = () => {
  const navigate = useNavigate();
  const { reports, selectedReportId, setSelectedReportId } = useStore();

  const [backendReports, setBackendReports] = useState<BackendOutcomeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReportDetail, setActiveReportDetail] = useState<BackendOutcomeReport | null>(null);

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
      .catch((err) => {
        console.warn('Backend report detail fetch warning:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedReportId]);

  const allReportsList = backendReports.length > 0 ? backendReports : reports.map(r => ({
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

  const activeReport = activeReportDetail || allReportsList.find((r) => r.id === selectedReportId);

  const handleExport = (format: string, report: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${report.scenario_id || 'scenario'}-report-${report.id}.${format.toLowerCase()}`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'Agreement Reached':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-600 uppercase tracking-wider">
            Agreement Reached
          </span>
        );
      case 'Deadlock':
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-50 border border-red-100 text-red-600 uppercase tracking-wider">
            Deadlock
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600 uppercase tracking-wider">
            {outcome || 'Terminated'}
          </span>
        );
    }
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
            Once you complete an AI vs AI simulation or a practice arena negotiation, your persistent reports will be stored in Supabase and display here.
          </p>

          <button
            onClick={() => navigate('/setup/scenario')}
            className="mt-8 px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider transition-all duration-200 shadow-md border-none cursor-pointer"
          >
            Start Setup Wizard
          </button>
        </div>
      </div>
    );
  }

  if (activeReport) {
    return (
      <div className="pb-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedReportId(null)}
            className="flex items-center gap-2 px-4.5 py-2 bg-white/70 border border-slate-200 hover:bg-white hover:border-slate-300 text-slate-600 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer shadow-xs"
          >
            <ArrowLeft size={14} />
            Back to Report History
          </button>

          <button
            onClick={() => handleExport('JSON', activeReport)}
            className="flex items-center gap-2 px-4.5 py-2 bg-white border border-[#DDE3EF] hover:border-blue-300 hover:bg-blue-50 text-[#111B46] rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
          >
            <Download size={13} />
            Download JSON
          </button>
        </div>

        <div
          className="rounded-[24px] border p-6 md:p-8 space-y-6"
          style={{
            background: 'rgba(255,255,255,0.58)',
            borderColor: 'rgba(255,255,255,0.80)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            boxShadow: '0 12px 40px rgba(15,23,42,0.03)',
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/60">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Outcome Analysis Report
              </span>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight mt-0.5" style={{ color: TEXT }}>
                {activeReport.scenario_title || 'Negotiation Outcome'}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs mt-1.5" style={{ color: MUTED }}>
                <span className="font-semibold">{activeReport.mode === 'human-ai' ? 'Human vs AI Practice' : 'AI vs AI Simulation'}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span className="flex items-center gap-1"><Calendar size={13} /> {activeReport.created_at || 'Recent'}</span>
              </div>
            </div>
            <div>
              {getOutcomeBadge(activeReport.outcome)}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/70 border border-white/80 rounded-2xl p-4.5 shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Rounds Completed</span>
              <p className="text-xl font-bold mt-1 text-[#111B46]">{activeReport.rounds_completed || 1}</p>
            </div>
            <div className="bg-white/70 border border-white/80 rounded-2xl p-4.5 shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Outcome</span>
              <p className="text-sm font-bold mt-1 text-blue-600">{activeReport.outcome}</p>
            </div>
            <div className="bg-white/70 border border-white/80 rounded-2xl p-4.5 shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Agreement Score</span>
              <p className="text-xl font-bold mt-1 text-emerald-600">{(activeReport.metrics as any)?.agreementRate || (activeReport.metrics as any)?.concessionControl || 85}%</p>
            </div>
            <div className="bg-white/70 border border-white/80 rounded-2xl p-4.5 shadow-xs">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Utility Score</span>
              <p className="text-xl font-bold mt-1 text-purple-600">{(activeReport.metrics as any)?.utilityScore || (activeReport.metrics as any)?.argumentStrength || 80}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.8fr_1fr] gap-6 items-start">
            <div className="space-y-6">
              <div className="bg-white/70 border border-white/85 rounded-2xl p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                  <Handshake size={15} className="text-blue-500" />
                  Agreed Final Terms
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(activeReport.final_terms || {}).map(([key, val]) => (
                    <div key={key} className="bg-white/60 p-3.5 rounded-xl border border-white/80">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="text-xs font-semibold text-[#111B46] mt-1 block">
                        {String(val) || 'N/A'}
                      </span>
                    </div>
                  ))}
                  {Object.keys(activeReport.final_terms || {}).length === 0 && (
                    <div className="col-span-3 text-center py-4 text-xs font-semibold text-slate-400">
                      No specific terms recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white/70 border border-white/85 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Lightbulb size={15} className="text-amber-500" />
                  Strategic Insights
                </h3>
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Outcome Summary</span>
                  <p className="text-[11px] leading-relaxed mt-1 text-[#111B46]">
                    {activeReport.summary || 'Negotiation concluded successfully.'}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Recommendations</span>
                  <p className="text-[11px] leading-relaxed mt-1 text-slate-600">
                    {activeReport.recommendations || 'Maintain strict concession limits and anchor early in future rounds.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-8 w-full space-y-6">
      <div>
        <h1 className="text-xl md:text-[25px] font-bold text-[#111B46] tracking-tight leading-tight">
          Negotiation History & Reports
        </h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          Review stored outcome summaries and performance telemetry.
        </p>
      </div>

      <div
        className="rounded-[24px] border p-6 md:p-8"
        style={{
          background: 'rgba(255,255,255,0.58)',
          borderColor: 'rgba(255,255,255,0.80)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 12px 40px rgba(15,23,42,0.03)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allReportsList.map((report) => (
            <div
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className="bg-white/70 hover:bg-white border border-white/85 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between h-[160px] group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-bold px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded uppercase tracking-wider">
                    {report.mode === 'human-ai' ? 'Practice' : 'Simulation'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold">
                    {report.created_at ? report.created_at.slice(0, 10) : 'Recent'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#111B46] tracking-tight mt-2 truncate">
                  {report.scenario_title}
                </h3>
                
                <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 mt-1 font-medium">
                  {report.summary}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100/50 pt-2.5 mt-2.5">
                {getOutcomeBadge(report.outcome)}

                <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform duration-200">
                  View Details
                  <Eye size={12} />
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