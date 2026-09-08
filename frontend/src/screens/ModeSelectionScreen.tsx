import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Handshake,
  ShieldCheck,
  Zap,
  ShoppingCart,
  CircleUserRound,
  UsersRound,
  Bot,
  User,
  Scale,
  Sparkles,
} from 'lucide-react';

/* =========================================================
   DESIGN TOKENS & PALETTE
========================================================= */
const COLORS = {
  primary: '#1E2230',
  secondary: '#C86D51',
  accent: '#3B82F6',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  collaborative: '#10B981',
  collaborativeSoft: '#ECFDF5',
  collaborativeBorder: '#6EE7B7',
  riskAverse: '#3B82F6',
  riskAverseSoft: '#EFF6FF',
  riskAverseBorder: '#93C5FD',
  aggressive: '#E11D48',
  aggressiveSoft: '#FFF1F2',
  aggressiveBorder: '#FDA4AF',
};

type NegotiationPersonality = 'Collaborative' | 'Risk-Averse' | 'Aggressive';

interface PersonalityDefinition {
  id: NegotiationPersonality;
  name: string;
  tagline: string;
  accent: string;
  soft: string;
  border: string;
  icon: React.ReactNode;
  description: string;
  metrics: {
    cooperation: string;
    concessionRate: string;
    flexibility: string;
    pressure: string;
  };
  highlights: string[];
}

const PERSONALITIES: PersonalityDefinition[] = [
  {
    id: 'Collaborative',
    name: 'Collaborative',
    tagline: 'Win-Win & Creative Trade-Offs',
    accent: COLORS.collaborative,
    soft: COLORS.collaborativeSoft,
    border: COLORS.collaborativeBorder,
    icon: <Handshake size={24} className="text-[#10B981]" />,
    description:
      'Proactively proposes multi-variable trade-offs (price, payment terms, delivery, remote work), makes balanced reciprocal concessions, and seeks joint value creation.',
    metrics: {
      cooperation: 'High',
      concessionRate: 'Moderate (~7%)',
      flexibility: 'High',
      pressure: 'Low',
    },
    highlights: [
      'Tables multi-variable package trade-offs',
      'Exchanges reciprocal concessions when justified',
      'Actively prevents premature deadlock',
    ],
  },
  {
    id: 'Risk-Averse',
    name: 'Risk-Averse',
    tagline: 'Safety Buffers & Constraint Guard',
    accent: COLORS.riskAverse,
    soft: COLORS.riskAverseSoft,
    border: COLORS.riskAverseBorder,
    icon: <ShieldCheck size={24} className="text-[#3B82F6]" />,
    description:
      'Prioritizes baseline reservation requirements, makes cautious concessions, guards safety margins, and avoids unbuffered or speculative compromises.',
    metrics: {
      cooperation: 'Moderate',
      concessionRate: 'Low (~2.5%)',
      flexibility: 'Low / Moderate',
      pressure: 'Cautious',
    },
    highlights: [
      'Preserves safety buffer above minimum floors',
      'Makes small, tightly metered concessions',
      'Demands strict contractual guarantees',
    ],
  },
  {
    id: 'Aggressive',
    name: 'Aggressive',
    tagline: 'Tactical Pressure & Hard Anchors',
    accent: COLORS.aggressive,
    soft: COLORS.aggressiveSoft,
    border: COLORS.aggressiveBorder,
    icon: <Zap size={24} className="text-[#E11D48]" />,
    description:
      'Opens with bold anchor positions, applies counter-pressure emphasizing market leverage, delays concessions systematically, and defends value vigorously.',
    metrics: {
      cooperation: 'Selective',
      concessionRate: 'Minimal (~1.2%)',
      flexibility: 'Low',
      pressure: 'High',
    },
    highlights: [
      'Opens with ambitious anchor positions',
      'Delays downward concessions systematically',
      'Accepts only when terms are decisively favorable',
    ],
  },
];

export const ModeSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedScenario,
    selectedMode,
    setSelectedMode,
    humanRole,
    setHumanRole,
    personality,
    setPersonality,
    updateScenarioData,
  } = useStore();

  const scenarioId = selectedScenario?.id || 'vendor-pricing';

  // 1. Negotiation Mode: strictly 'ai-ai' or 'human-ai'
  const [currentMode, setCurrentMode] = useState<'ai-ai' | 'human-ai'>(
    selectedMode === 'ai-ai' ? 'ai-ai' : 'human-ai'
  );

  // 2. Scenario-specific human role options
  const roleOptions = useMemo(() => {
    switch (scenarioId) {
      case 'vendor-pricing':
        return [
          {
            id: 'buyer',
            label: 'Buyer',
            opposingLabel: 'Vendor',
            description: 'You negotiate licensing price discounts, SLA warranty, and payment terms against the Vendor AI.',
          },
          {
            id: 'vendor',
            label: 'Vendor',
            opposingLabel: 'Buyer',
            description: 'You defend product margins, contract duration, and delivery terms against the Buyer AI.',
          },
        ];
      case 'job-offer':
        return [
          {
            id: 'candidate',
            label: 'Candidate',
            opposingLabel: 'Employer / Recruiter',
            description: 'You negotiate base salary, stock options, and remote work flexibility with the Employer AI.',
          },
          {
            id: 'recruiter',
            label: 'Employer / Recruiter',
            opposingLabel: 'Candidate',
            description: 'You manage departmental compensation caps and hiring guidelines with the Candidate AI.',
          },
        ];
      case 'budget-allocation':
        return [
          {
            id: 'project-manager',
            label: 'Project Manager',
            opposingLabel: 'Finance Manager & Dept Head',
            description: 'You advocate for core engineering prototypes, infrastructure, and technical headcount.',
          },
          {
            id: 'finance-director',
            label: 'Finance Manager',
            opposingLabel: 'Project Manager & Dept Head',
            description: 'You enforce corporate fiscal caps, emergency reserves, and measurable ROI milestones.',
          },
          {
            id: 'department-head',
            label: 'Department Head',
            opposingLabel: 'Finance Manager & Project Manager',
            description: 'You champion user acquisition, commercial launch, and marketing campaign funding.',
          },
        ];
      default:
        return [
          { id: 'buyer', label: 'Participant 1', opposingLabel: 'Participant 2', description: 'Primary Negotiator' },
          { id: 'vendor', label: 'Participant 2', opposingLabel: 'Participant 1', description: 'Counterparty' },
        ];
    }
  }, [scenarioId]);

  // Selected Human Role state
  const [selectedHumanRole, setSelectedHumanRole] = useState<string>(() => {
    if (humanRole && roleOptions.some((r) => r.id === humanRole)) {
      return humanRole;
    }
    return roleOptions[0]?.id || 'buyer';
  });

  // Selected Personality state
  const [selectedPersonality, setSelectedPersonality] = useState<NegotiationPersonality>(
    personality || 'Collaborative'
  );

  useEffect(() => {
    if (!roleOptions.some((r) => r.id === selectedHumanRole)) {
      setSelectedHumanRole(roleOptions[0]?.id || 'buyer');
    }
  }, [roleOptions, selectedHumanRole]);

  // Matchup details for the active human role
  const activeRoleConfig = useMemo(() => {
    return roleOptions.find((r) => r.id === selectedHumanRole) || roleOptions[0];
  }, [roleOptions, selectedHumanRole]);

  const scenarioInfo = useMemo(() => {
    if (!selectedScenario) {
      return {
        title: 'Vendor Pricing Negotiation',
        tag: 'Buyer vs Vendor',
        icon: <ShoppingCart size={20} />,
      };
    }
    if (selectedScenario.id === 'vendor-pricing') {
      return {
        title: 'Vendor Pricing Negotiation',
        tag: 'Buyer vs Vendor',
        icon: <ShoppingCart size={20} />,
      };
    }
    if (selectedScenario.id === 'job-offer') {
      return {
        title: 'Job Offer Negotiation',
        tag: 'Candidate vs Employer / Recruiter',
        icon: <CircleUserRound size={20} />,
      };
    }
    return {
      title: 'Project Budget Allocation',
      tag: 'Project Manager vs Finance vs Dept Head',
      icon: <UsersRound size={20} />,
    };
  }, [selectedScenario]);

  const handleContinue = () => {
    setSelectedMode(currentMode);
    if (currentMode === 'human-ai') {
      setHumanRole(selectedHumanRole);
    } else {
      setHumanRole(null);
    }
    setPersonality(selectedPersonality);
    updateScenarioData({
      personality: selectedPersonality,
      mode: currentMode,
      human_role: currentMode === 'human-ai' ? selectedHumanRole : undefined,
    });
    localStorage.setItem('negotiation-mode', selectedPersonality.toLowerCase());
    navigate('/setup/scenario-data');
  };

  const handleBack = () => {
    navigate('/setup/scenario');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Selected Scenario Badge */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Scenario Selection
        </button>

        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-xs backdrop-blur">
          <span className="text-xs font-medium text-slate-500">Step 1 Scenario:</span>
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            {scenarioInfo.icon}
            {scenarioInfo.title}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {scenarioInfo.tag}
          </span>
        </div>
      </div>

      {/* Main Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider">
          <Scale size={14} />
          Step 2 & 3 Configuration
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
          Select Mode & Negotiation Roles
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Choose between autonomous AI simulation or interactive human practice, configure your participant role,
          and select the behavioral strategy.
        </p>
      </div>

      {/* =========================================================
          STEP 2: SELECT NEGOTIATION MODE (EXACTLY TWO MODES)
      ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            2
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Select Negotiation Mode
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Option 1: AI vs AI — Simulation Mode */}
          <div
            onClick={() => setCurrentMode('ai-ai')}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
              currentMode === 'ai-ai'
                ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            {currentMode === 'ai-ai' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Bot size={26} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">AI vs AI — Simulation Mode</h3>
                <span className="text-xs font-semibold text-purple-700">Autonomous Machine-to-Machine</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Both negotiation participants are controlled by autonomous AI agents. Watch turn-by-turn counteroffers,
              concession velocity, and multi-issue trade-offs until agreement or deadlock.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Sparkles size={14} className="text-purple-600" />
              <span>Full automated analytics and comparative report generated upon completion.</span>
            </div>
          </div>

          {/* Option 2: Human vs AI — Practice Mode */}
          <div
            onClick={() => setCurrentMode('human-ai')}
            className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all ${
              currentMode === 'human-ai'
                ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            {currentMode === 'human-ai' && (
              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Check size={14} strokeWidth={3} />
              </div>
            )}
            <div className="flex items-center gap-3.5 mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <CircleUserRound size={26} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Human vs AI — Practice Mode</h3>
                <span className="text-xs font-semibold text-blue-700">Interactive Single-Player Sandbox</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              You play one participant role directly, and an autonomous AI agent plays the opposing role.
              Submit custom offers, conditional trade-offs, and test your tactics in real time.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs font-medium text-slate-500">
              <Handshake size={14} className="text-blue-600" />
              <span>The AI dynamically understands your offers with complete multi-turn memory.</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================
          STEP 3: IF HUMAN VS AI, CHOOSE YOUR ROLE
      ========================================================= */}
      {currentMode === 'human-ai' ? (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Choose Your Role
            </h2>
            <span className="text-xs text-slate-500 font-medium ml-1">
              (The AI automatically assumes the opposing role)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roleOptions.map((role) => {
              const isSelected = selectedHumanRole === role.id;
              return (
                <div
                  key={role.id}
                  onClick={() => setSelectedHumanRole(role.id)}
                  className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-white shadow-md ring-2 ring-blue-500/20'
                      : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900">
                        I am the {role.label}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DYNAMIC MATCHUP BANNER */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-lg bg-blue-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <User size={14} />
                You: {activeRoleConfig?.label}
              </div>
              <span className="text-xs font-bold text-slate-400">VS</span>
              <div className="px-3 py-1 rounded-lg bg-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Bot size={14} />
                AI: {activeRoleConfig?.opposingLabel}
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-700">
              Configured: You will negotiate directly against the AI counterparty ({activeRoleConfig?.opposingLabel}).
            </p>
          </div>
        </div>
      ) : (
        /* AI vs AI Matchup Banner */
        <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-lg bg-purple-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Bot size={14} />
              AI Participant 1: {roleOptions[0]?.label}
            </div>
            <span className="text-xs font-bold text-slate-400">VS</span>
            <div className="px-3 py-1 rounded-lg bg-indigo-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Bot size={14} />
              AI Participant 2: {roleOptions[1]?.label}
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-700">
            Both sides will be driven autonomously by LLM orchestrator turn-taking.
          </p>
        </div>
      )}

      {/* =========================================================
          STEP 4: SELECT PERSONALITY / STRATEGY
      ========================================================= */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
            {currentMode === 'human-ai' ? 4 : 3}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {currentMode === 'human-ai'
              ? 'Select AI Counterparty Personality'
              : 'Select Negotiation Strategy Style'}
          </h2>
          <span className="text-xs text-slate-500 font-medium ml-1">
            (Governs opening anchor, concession timing, and deadlock resistance)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PERSONALITIES.map((p) => {
            const isSelected = selectedPersonality === p.id;
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPersonality(p.id)}
                className={`relative flex flex-col justify-between rounded-2xl border-2 cursor-pointer p-5 transition-all bg-white ${
                  isSelected
                    ? 'shadow-lg scale-[1.01] ring-2'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
                style={{
                  borderColor: isSelected ? p.accent : undefined,
                  boxShadow: isSelected ? `0 10px 25px ${p.accent}20` : undefined,
                }}
              >
                {isSelected && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold text-white shadow-xs flex items-center gap-1"
                    style={{ backgroundColor: p.accent }}
                  >
                    <Check size={11} strokeWidth={3} />
                    ACTIVE PERSONALITY
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl border"
                        style={{
                          backgroundColor: p.soft,
                          borderColor: p.border,
                        }}
                      >
                        {p.icon}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{p.name}</h3>
                        <p className="text-xs font-semibold" style={{ color: p.accent }}>
                          {p.tagline}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-transparent text-white' : 'border-slate-300 bg-white'
                      }`}
                      style={{ backgroundColor: isSelected ? p.accent : undefined }}
                    >
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Cooperation
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {p.metrics.cooperation}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Concessions
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {p.metrics.concessionRate}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-1">
                    {p.highlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <CheckCircle2
                          size={13}
                          className="shrink-0 mt-0.5"
                          style={{ color: p.accent }}
                        />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPersonality(p.id);
                    }}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    style={{
                      backgroundColor: isSelected ? p.accent : undefined,
                    }}
                  >
                    {isSelected ? 'Personality Selected' : `Select ${p.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Strip */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Sparkles size={18} className="text-blue-500 shrink-0" />
          <span>
            Ready to proceed with{' '}
            <strong className="text-slate-900">
              {currentMode === 'human-ai'
                ? `Human vs AI (You: ${activeRoleConfig?.label})`
                : 'AI vs AI Simulation'}
            </strong>{' '}
            using{' '}
            <strong className="text-slate-900">{selectedPersonality}</strong> strategy.
          </span>
        </div>

        <button
          type="button"
          onClick={handleContinue}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all shrink-0"
        >
          <span>Continue to Enter Real Data</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;