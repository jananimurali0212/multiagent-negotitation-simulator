import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { dashboardApi, DashboardSummary, negotiationApi } from '../lib/api';

import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Grid2X2,
  Layers,
  PieChart,
  Play,
  Pause,
  Square,
  X,
  ShoppingCart,
  Target,
  Users,
  Zap,
  AlertTriangle,
} from 'lucide-react';

/* ============================================================
   PROJECT DESIGN TOKENS
============================================================ */

const COLORS = {
  primary: '#1E2230',
  secondary: '#C86D51',
  accent: '#3B82F6',
  background: '#EEF1F8',
  backgroundSoft: '#F4F6FB',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
};

/* ============================================================
   GLASS SURFACE HELPERS
============================================================ */

const glassPrimary =
  'border border-white/85 bg-white/[0.68] backdrop-blur-2xl shadow-[0_14px_40px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.9)]';

const glassInner =
  'border border-white/80 bg-white/[0.52] backdrop-blur-xl shadow-[0_6px_20px_rgba(15,23,42,0.025)]';

/* ============================================================
   SCENARIO VISUAL CONFIG
============================================================ */

type ScenarioVisual = {
  tag: string;
  category: string;
  duration: string;
  participants: string;
  focus: string;
  accent: string;
  soft: string;
  border: string;
  icon: React.ReactNode;
};

const scenarioVisuals: Record<string, ScenarioVisual> = {
  'vendor-pricing': {
    tag: 'Buyer vs Vendor',
    category: 'Business',
    duration: '15 – 20 min',
    participants: '2 Agents',
    focus: 'Price • Quality • Delivery',
    accent: COLORS.secondary,
    soft: 'rgba(200,109,81,0.08)',
    border: 'rgba(200,109,81,0.22)',
    icon: <ShoppingCart size={29} strokeWidth={1.8} />,
  },
  'job-offer': {
    tag: 'Candidate vs Hiring Manager',
    category: 'HR',
    duration: '15 – 20 min',
    participants: '2 Agents',
    focus: 'Salary • Benefits • Role',
    accent: COLORS.accent,
    soft: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.22)',
    icon: <Briefcase size={29} strokeWidth={1.8} />,
  },
  'budget-allocation': {
    tag: 'Dept. Heads vs Finance',
    category: 'Business',
    duration: '20 – 25 min',
    participants: '3 Agents',
    focus: 'Budget • Priorities • Trade-offs',
    accent: COLORS.primary,
    soft: 'rgba(30,34,48,0.06)',
    border: 'rgba(30,34,48,0.20)',
    icon: <PieChart size={29} strokeWidth={1.8} />,
  },
};

/* ============================================================
   METRIC CARD
============================================================ */

interface MetricCardProps {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent: string;
  soft: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  description,
  icon,
  accent,
  soft,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`
      group relative min-h-[122px] overflow-hidden rounded-[20px] p-5 ${glassPrimary}
      ${onClick ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(15,23,42,0.07)]' : ''}
    `}
  >
    <div
      className="pointer-events-none absolute right-[-10px] top-[-20px] h-[105px] w-[105px] rounded-full blur-[35px]"
      style={{ background: soft }}
    />
    <div
      className="pointer-events-none absolute bottom-[-18px] right-[20px] opacity-[0.06]"
      style={{ color: accent }}
    >
      {icon}
    </div>

    <div className="relative z-10 flex items-start gap-4">
      <div
        className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-[15px] border bg-white/65 backdrop-blur-md"
        style={{
          color: accent,
          borderColor: `${accent}28`,
          boxShadow: `0 5px 15px ${accent}10`,
        }}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[27px] font-bold leading-none tracking-[-0.03em]" style={{ color: accent }}>
          {value}
        </p>
        <p className="mt-1.5 text-[12px] font-semibold text-[#0F172A]">{label}</p>
        <p className="mt-1 text-[10px] font-medium text-[#64748B]">{description}</p>
      </div>
    </div>
  </div>
);

/* ============================================================
   QUICK ACTION CARD
============================================================ */

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  soft: string;
  borderColor: string;
  path: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({
  title,
  description,
  icon,
  accent,
  soft,
  borderColor,
  path,
}) => {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className="group flex min-h-[126px] w-full flex-col justify-between rounded-[17px] border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs"
      style={{
        backgroundColor: soft,
        borderColor: borderColor,
      }}
    >
      <div>
        <div
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border bg-white/80 backdrop-blur-md"
          style={{
            color: accent,
            borderColor: `${accent}24`,
          }}
        >
          {icon}
        </div>
        <h4 className="mt-3 text-[11.5px] font-semibold text-[#0F172A]">{title}</h4>
        <p className="mt-1 text-[10px] font-medium leading-4 text-[#64748B]">{description}</p>
      </div>

      <div
        className="flex justify-end transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: accent }}
      >
        <ArrowRight size={17} />
      </div>
    </button>
  );
};

/* ============================================================
   SCENARIO CARD
============================================================ */

interface ScenarioCardProps {
  scenarioId: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
  scenarioId,
  title,
  description,
  selected,
  onSelect,
}) => {
  const visual = scenarioVisuals[scenarioId] ?? scenarioVisuals['vendor-pricing'];

  return (
    <article
      onClick={onSelect}
      className="group relative min-h-[282px] cursor-pointer overflow-hidden rounded-[21px] border p-5 transition-all duration-250 hover:-translate-y-0.5"
      style={{
        backgroundColor: visual.soft,
        borderColor: selected ? visual.accent : visual.border,
        boxShadow: selected
          ? `0 0 0 2px ${visual.accent}18, 0 18px 42px rgba(15,23,42,0.06)`
          : '0 10px 26px rgba(15,23,42,0.04)',
      }}
    >
      {selected && (
        <div
          className="absolute right-4 top-4 z-20 flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: visual.accent }}
        >
          <CheckCircle2 size={15} strokeWidth={3} />
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div
            className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-full border bg-white/80 shadow-sm backdrop-blur-md"
            style={{
              color: visual.accent,
              borderColor: visual.border,
            }}
          >
            {visual.icon}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <h3 className="pr-5 text-[13px] font-semibold leading-[1.25] tracking-[-0.01em] text-[#0F172A]">
              {title}
            </h3>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <span
                className="rounded-full border px-2 py-1 text-[9px] font-medium"
                style={{
                  color: visual.accent,
                  borderColor: visual.border,
                  backgroundColor: 'rgba(255,255,255,0.7)',
                }}
              >
                {visual.tag}
              </span>
              <span className="rounded-full border border-[#E2E7EF] bg-white/65 px-2 py-1 text-[9px] font-medium text-[#64748B]">
                {visual.category}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 max-w-[350px] text-[10.5px] font-medium leading-[1.55] text-[#64748B]">
          {description}
        </p>

        <div className="my-4 h-px bg-[#E8ECF3]" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <Users size={13} className="text-[#64748B]" />
            <span className="text-[9.5px] font-medium text-[#64748B]">{visual.participants}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={13} className="text-[#64748B]" />
            <span className="text-[9.5px] font-medium text-[#64748B]">{visual.duration}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Target size={13} className="text-[#64748B]" />
            <span className="text-[9.5px] font-medium text-[#64748B]">{visual.focus}</span>
          </div>
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="mt-4 flex h-[35px] w-full items-center justify-center gap-2 rounded-full border text-[10px] font-semibold backdrop-blur-md transition-all hover:bg-white cursor-pointer"
          style={{
            color: visual.accent,
            borderColor: visual.border,
            backgroundColor: 'rgba(255,255,255,0.85)',
          }}
        >
          Select Scenario
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
};

/* ============================================================
   DASHBOARD SCREEN
============================================================ */

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, scenarios, selectScenario, setSelectedReportId, resumeSession } = useStore();

  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const handleViewSession = async (session: any) => {
    const rawStatus = (session.status || '').toLowerCase();
    const sessionId = session.session_id || session.id;
    if (rawStatus === 'running' || rawStatus === 'paused') {
      await resumeSession(sessionId);
      navigate(session.mode === 'human-ai' ? '/arena/practice' : '/arena/simulation');
    } else {
      navigate('/history');
    }
  };

  const handlePauseSession = async (session: any) => {
    const sessionId = session.session_id || session.id;
    try {
      await negotiationApi.pauseNegotiation(sessionId);
      setSummaryData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recent_negotiations: prev.recent_negotiations.map((item) =>
            (item.id === sessionId || item.session_id === sessionId)
              ? { ...item, status: 'paused', outcome: 'Paused' }
              : item
          ),
        };
      });
    } catch (err) {
      console.error('Failed to pause negotiation:', err);
    }
  };

  const handleResumeSession = async (session: any) => {
    const sessionId = session.session_id || session.id;
    try {
      await negotiationApi.resumeSession(sessionId);
      await resumeSession(sessionId);
      navigate(session.mode === 'human-ai' ? '/arena/practice' : '/arena/simulation');
    } catch (err) {
      console.error('Failed to resume negotiation:', err);
    }
  };

  const handleStopSession = async (session: any) => {
    const sessionId = session.session_id || session.id;
    try {
      await negotiationApi.stopNegotiation(sessionId, 'stop');
      setSummaryData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          recent_negotiations: prev.recent_negotiations.map((item) =>
            (item.id === sessionId || item.session_id === sessionId)
              ? { ...item, status: 'terminated', outcome: 'Stopped' }
              : item
          ),
        };
      });
    } catch (err) {
      console.error('Failed to stop negotiation:', err);
    }
  };

  const handleDeleteSession = async (session: any) => {
    const sessionId = session.session_id || session.id;
    if (!window.confirm('Are you sure you want to delete this negotiation session?')) return;
    try {
      await negotiationApi.deleteSession(sessionId);
      setSummaryData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_negotiations: Math.max(0, prev.total_negotiations - 1),
          recent_negotiations: prev.recent_negotiations.filter(
            (item) => item.id !== sessionId && item.session_id !== sessionId
          ),
        };
      });
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleViewReport = (session: any) => {
    if (session.report_id) {
      setSelectedReportId(session.report_id);
    }
    navigate('/reports');
  };

  useEffect(() => {
    let isMounted = true;
    setLoadingSummary(true);
    dashboardApi
      .getSummary()
      .then((data) => {
        if (isMounted) setSummaryData(data);
      })
      .catch((err) => {
        console.warn('Backend summary endpoint fallback:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingSummary(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getUserDisplayName = () => {
    if (!user) return 'there';
    if ('name' in user && user.name) return String(user.name);
    if ('email' in user && user.email) return user.email.split('@')[0];
    return 'there';
  };

  const handleStartScenario = (scenarioId: string) => {
    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) return;
    selectScenario(scenario);
    navigate('/setup/mode');
  };

  const fixedScenarios = scenarios.filter(
    (scenario) =>
      scenario.id === 'vendor-pricing' ||
      scenario.id === 'job-offer' ||
      scenario.id === 'budget-allocation'
  );

  const scenarioDescriptions: Record<string, string> = {
    'vendor-pricing':
      'Negotiate price, quality, and delivery terms with a vendor while balancing cost and long-term value.',
    'job-offer':
      'Negotiate salary, benefits, and role expectations between a candidate and a hiring manager.',
    'budget-allocation':
      'Allocate budget across competing project priorities with multiple stakeholders.',
  };

  const totalNegotiations = summaryData?.total_negotiations ?? 0;
  const agreementsReached = summaryData?.agreements_reached ?? 0;
  const deadlocksDetected = summaryData?.deadlocks_detected ?? 0;
  const reportsGenerated = summaryData?.reports_generated ?? 0;
  const recentNegotiations = summaryData?.recent_negotiations ?? [];

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#EEF1F8] px-4 py-4 font-sans text-[#0F172A] lg:px-6"
      style={{
        background: 'linear-gradient(135deg, #EEF1F8 0%, #EEF1F8 55%, #F4F6FB 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[170px] top-[15%] h-[420px] w-[420px] rounded-full bg-[#3B82F6]/4 blur-[120px]" />
        <div className="absolute -right-[160px] top-[35%] h-[430px] w-[430px] rounded-full bg-[#C86D51]/4 blur-[120px]" />
        <div className="absolute bottom-[-180px] left-[28%] h-[400px] w-[400px] rounded-full bg-[#3B82F6]/3 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1450px] space-y-5">
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
          <div className={`relative min-h-[170px] overflow-hidden rounded-[23px] p-6 ${glassPrimary}`}>
            <div className="pointer-events-none absolute right-[-40px] top-[-50px] h-[180px] w-[180px] rounded-full bg-[#3B82F6]/7 blur-[55px]" />
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <span className="h-[6px] w-[6px] rounded-full bg-[#3B82F6]" />
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
                  Workspace Overview
                </span>
              </div>
              <p className="mt-5 text-[16px] font-medium text-[#64748B]">Welcome back,</p>
              <h1 className="mt-1 flex items-center gap-2 text-[29px] font-bold tracking-[-0.03em] text-[#C86D51] capitalize">
                {getUserDisplayName()} <span className="text-[24px]">👋</span>
              </h1>
              <p className="mt-3 max-w-[330px] text-[11px] font-medium leading-5 text-[#64748B]">
                Continue your negotiation journey or start a new simulation.
              </p>
            </div>
          </div>

          <div className={`min-h-[170px] rounded-[23px] p-5 ${glassPrimary}`}>
            <div className="flex h-full items-center justify-between gap-2 overflow-x-auto">
              {[
                { number: '01', line1: 'Choose', line2: 'Scenario', active: true },
                { number: '02', line1: 'Configure', line2: 'Agents', active: false },
                { number: '03', line1: 'Set Goals &', line2: 'Constraints', active: false },
                { number: '04', line1: 'Review &', line2: 'Confirm', active: false },
                { number: '05', line1: 'Start', line2: 'Negotiation', active: false },
                { number: '06', line1: 'Analyze', line2: 'Outcome', active: false },
              ].map((step, index) => (
                <React.Fragment key={step.number}>
                  <div className="flex min-w-[88px] flex-1 flex-col items-center text-center">
                    <div
                      className={`flex h-[50px] w-[50px] items-center justify-center rounded-full border text-[14px] font-semibold ${step.active
                          ? 'border-[#3B82F6] bg-[#3B82F6] text-white shadow-[0_7px_18px_rgba(59,130,246,0.24)]'
                          : 'border-[#DDE3EE] bg-white/60 text-[#64748B]'
                        }`}
                    >
                      {step.number}
                    </div>
                    <p className={`mt-3 text-[9.5px] font-semibold leading-[1.35] ${step.active ? 'text-[#3B82F6]' : 'text-[#334155]'}`}>
                      {step.line1}<br />{step.line2}
                    </p>
                  </div>
                  {index < 5 && <div className="mt-[25px] min-w-[25px] flex-1 border-t border-dashed border-[#CBD5E1]" />}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* METRICS ROW FROM BACKEND DATA */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Negotiations"
            value={totalNegotiations}
            description="All negotiation sessions"
            icon={<Activity size={21} />}
            accent="#3B82F6"
            soft="rgba(59,130,246,0.08)"
            onClick={() => navigate('/reports')}
          />

          <MetricCard
            label="Agreements Reached"
            value={agreementsReached}
            description="Successful outcomes"
            icon={<CheckCircle2 size={21} />}
            accent="#2E8B67"
            soft="rgba(46,139,103,0.08)"
            onClick={() => navigate('/reports')}
          />

          <MetricCard
            label="Deadlocks Detected"
            value={deadlocksDetected}
            description="Negotiations without agreement"
            icon={<AlertTriangle size={21} />}
            accent="#C86D51"
            soft="rgba(200,109,81,0.08)"
            onClick={() => navigate('/reports')}
          />

          <MetricCard
            label="Reports Generated"
            value={reportsGenerated}
            description="Negotiation outcome reports"
            icon={<FileText size={21} />}
            accent="#6C5CE7"
            soft="rgba(108,92,231,0.08)"
            onClick={() => navigate('/reports')}
          />
        </section>

        {/* QUICK ACTIONS & SCENARIO OPTIONS WITH SEMANTIC SOFT BACKGROUND TINTS */}
        <section className="grid grid-cols-1 gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
          <div className={`rounded-[23px] p-5 ${glassPrimary}`}>
            <div className="mb-4 flex items-center gap-2">
              <Zap size={16} className="text-[#3B82F6]" />
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0F172A]">
                Quick Actions
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <QuickActionCard
                title="Start New Negotiation"
                description="Begin a new negotiation simulation"
                icon={<Play size={16} />}
                accent="#3B82F6"
                soft="rgba(59,130,246,0.08)"
                borderColor="rgba(59,130,246,0.25)"
                path="/setup/scenario"
              />

              <QuickActionCard
                title="Explore Scenarios"
                description="Choose from three enterprise scenarios"
                icon={<Layers size={16} />}
                accent="#C86D51"
                soft="rgba(200,109,81,0.08)"
                borderColor="rgba(200,109,81,0.25)"
                path="/setup/scenario"
              />

              <QuickActionCard
                title="View Recent Results"
                description="Review your previous outcomes"
                icon={<BarChart3 size={16} />}
                accent="#3B82F6"
                soft="rgba(59,130,246,0.08)"
                borderColor="rgba(59,130,246,0.25)"
                path="/reports"
              />

              <QuickActionCard
                title="How It Works"
                description="Understand the negotiation process"
                icon={<BookOpen size={16} />}
                accent="#1E2230"
                soft="rgba(30,34,48,0.06)"
                borderColor="rgba(30,34,48,0.18)"
                path="/help"
              />
            </div>
          </div>

          <div className={`rounded-[23px] p-5 ${glassPrimary}`}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Grid2X2 size={16} className="text-[#3B82F6]" />
                  <h2 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#0F172A]">
                    Choose Your Scenario
                  </h2>
                </div>
                <p className="mt-1 text-[10px] font-medium text-[#64748B]">
                  Select one of our enterprise-ready negotiation scenarios to get started
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/setup/scenario')}
                className="flex items-center gap-1 rounded-full border border-[#3B82F6]/20 bg-white/45 px-3 py-1.5 text-[9.5px] font-semibold text-[#3B82F6] backdrop-blur-md transition-all hover:bg-white/70 cursor-pointer"
              >
                View All Scenarios
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {fixedScenarios.map((scenario) => (
                <ScenarioCard
                  key={scenario.id}
                  scenarioId={scenario.id}
                  title={scenario.title}
                  description={scenarioDescriptions[scenario.id] ?? scenario.description}
                  selected={false}
                  onSelect={() => handleStartScenario(scenario.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* UNIFIED RECENT NEGOTIATIONS WITH 3-DOT ACTION MENU */}
        <section className="w-full">
          <div className={`rounded-[23px] p-6 ${glassPrimary}`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#3B82F6]/10 text-[#3B82F6]">
                  <Clock size={17} />
                </div>
                <div>
                  <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#0F172A]">
                    Recent Negotiations
                  </h2>
                  <p className="text-[10px] font-medium text-[#64748B]">
                    Active, paused, and completed negotiation lifecycles
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/history')}
                  className="flex items-center gap-1 text-[10px] font-bold text-[#3B82F6] hover:underline cursor-pointer"
                >
                  View Full History <ArrowRight size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/setup/scenario')}
                  className="flex items-center gap-1.5 rounded-full border border-[#3B82F6]/20 bg-white/60 px-3.5 py-1.5 text-[10px] font-bold text-[#3B82F6] backdrop-blur-md transition-all hover:bg-white cursor-pointer"
                >
                  <Play size={11} fill="currentColor" /> Start New Session
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {recentNegotiations.map((item) => (
                <RecentNegotiationItem
                  key={item.id || item.session_id}
                  item={item}
                  onView={() => handleViewSession(item)}
                  onPause={() => handlePauseSession(item)}
                  onResume={() => handleResumeSession(item)}
                  onStop={() => handleStopSession(item)}
                  onDelete={() => handleDeleteSession(item)}
                  onViewReport={() => handleViewReport(item)}
                />
              ))}

              {recentNegotiations.length === 0 && !loadingSummary && (
                <div className="text-center py-10 text-xs text-slate-400 font-semibold bg-white/30 rounded-2xl border border-white/50 space-y-2">
                  <Activity size={24} className="mx-auto text-slate-300 mb-1" />
                  <p>No negotiation sessions recorded yet.</p>
                  <button
                    onClick={() => navigate('/setup/scenario')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3B82F6] hover:underline cursor-pointer pt-1"
                  >
                    Start your first negotiation <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

/* ============================================================
   RECENT NEGOTIATION ITEM COMPONENT WITH 3-DOT MENU
============================================================ */

interface RecentNegotiationItemProps {
  item: any;
  onView: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDelete: () => void;
  onViewReport: () => void;
}

const RecentNegotiationItem: React.FC<RecentNegotiationItemProps> = ({
  item,
  onView,
  onPause,
  onResume,
  onStop,
  onDelete,
  onViewReport,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const rawStatus = (item.status || '').toLowerCase();
  const isRunning = rawStatus === 'running';
  const isPaused = rawStatus === 'paused';
  const isStopped = rawStatus === 'terminated' || rawStatus === 'stopped';
  const isFinished = rawStatus === 'finished' || rawStatus === 'deadlock';

  const statusBadge = () => {
    if (isRunning) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-1 text-[9px] font-bold text-blue-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
          Running
        </span>
      );
    }
    if (isPaused) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50/80 px-2.5 py-1 text-[9px] font-bold text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Paused
        </span>
      );
    }
    if (isStopped) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[9px] font-bold text-slate-600">
          Stopped
        </span>
      );
    }
    if (item.outcome === 'Agreement Reached' || (isFinished && item.outcome !== 'Deadlock')) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[9px] font-bold text-emerald-600">
          <CheckCircle2 size={11} />
          Agreement Reached
        </span>
      );
    }
    if (item.outcome === 'Deadlock' || rawStatus === 'deadlock') {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-2.5 py-1 text-[9px] font-bold text-red-600">
          <AlertTriangle size={11} />
          Deadlock
        </span>
      );
    }
    return (
      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[9px] font-bold text-slate-600 capitalize">
        {item.status || 'Active'}
      </span>
    );
  };

  const agentsDisplay = item.agent_names?.length
    ? item.agent_names.join(' vs ')
    : item.scenario_id === 'vendor-pricing'
      ? 'Buyer Agent vs Vendor Agent'
      : item.scenario_id === 'job-offer'
        ? 'Recruiter Agent vs Candidate Agent'
        : 'Department Head Agent vs Project Manager Agent vs Finance Manager Agent';

  const formattedDate = item.updated_at || item.created_at
    ? new Date(item.updated_at || item.created_at).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div
      className={`group relative flex items-center justify-between rounded-[18px] p-4 transition-all hover:bg-white/80 ${glassInner}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 cursor-pointer" onClick={onView}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-blue-500/20 bg-blue-500/10 text-blue-600">
          {isFinished ? <FileText size={18} /> : <Activity size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[12px] font-bold text-[#0F172A]">
              {item.scenario_title || item.scenario_id?.replace('-', ' ').toUpperCase()}
            </h3>
            <span className="text-[9.5px] font-semibold text-[#64748B]">
              • {item.mode === 'human-ai' ? 'Human vs AI Practice' : 'AI vs AI Simulation'}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#64748B]">
            <span className="font-semibold text-slate-700">{agentsDisplay}</span>
            <span>• Round {item.current_round || item.rounds_completed || 1} of {item.max_rounds || 20}</span>
            {formattedDate && <span>• {formattedDate}</span>}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3 pl-3">
        {statusBadge()}

        {/* 3-Dot Action Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-200/60 text-slate-600 transition-colors cursor-pointer border-none bg-transparent"
            title="Negotiation Options"
          >
            <span className="text-[16px] font-bold leading-none">⋮</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-30 w-44 rounded-xl border border-slate-200/80 bg-white/95 py-1.5 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 text-[11px] font-semibold text-slate-700">
              {/* RUNNING MENU */}
              {isRunning && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onView();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-blue-600 font-bold"
                  >
                    <Activity size={13} /> View Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onPause();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-amber-600"
                  >
                    <Pause size={13} /> Pause Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onStop();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-red-600"
                  >
                    <Square size={13} /> Stop Negotiation
                  </button>
                </>
              )}

              {/* PAUSED MENU */}
              {isPaused && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onView();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-blue-600 font-bold"
                  >
                    <Activity size={13} /> View Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onResume();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-emerald-600"
                  >
                    <Play size={13} /> Resume Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onStop();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-red-600"
                  >
                    <Square size={13} /> Stop Negotiation
                  </button>
                </>
              )}

              {/* STOPPED MENU */}
              {isStopped && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onView();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-slate-800"
                  >
                    <FileText size={13} /> View Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-left border-none bg-transparent cursor-pointer text-red-600"
                  >
                    <X size={13} /> Delete Negotiation
                  </button>
                </>
              )}

              {/* COMPLETED / FINISHED MENU */}
              {isFinished && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onView();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-slate-800"
                  >
                    <FileText size={13} /> View Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onViewReport();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-emerald-600 font-bold"
                  >
                    <CheckCircle2 size={13} /> View Report
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-left border-none bg-transparent cursor-pointer text-red-600"
                  >
                    <X size={13} /> Delete Negotiation
                  </button>
                </>
              )}

              {!isRunning && !isPaused && !isStopped && !isFinished && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onView();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-slate-100/80 text-left border-none bg-transparent cursor-pointer text-slate-800"
                  >
                    <Activity size={13} /> View Negotiation
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="flex w-full items-center gap-2 px-3.5 py-2 hover:bg-red-50 text-left border-none bg-transparent cursor-pointer text-red-600"
                  >
                    <X size={13} /> Delete Negotiation
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;