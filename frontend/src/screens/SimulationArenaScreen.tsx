import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { negotiationApi, apiRequest, TurnResultResponse, NegotiationStatus } from '../lib/api';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Zap,
  X,
  Compass,
  FileText,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface SimulationMessage {
  id: string;
  sender: string;
  role: string;
  avatar?: string;
  content: string;
  offerData?: Record<string, any>;
  rationaleSummary?: string;
  round: number;
  timestamp: string;
  isAgent0: boolean;
}

export const SimulationArenaScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedScenario, configuredAgents, setSelectedReportId, scenarioData } = useStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SimulationMessage[]>([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState<NegotiationStatus>('running');
  const [isPaused, setIsPaused] = useState(false);
  const [isExecutingStep, setIsExecutingStep] = useState(false);
  const [currentSpeakerName, setCurrentSpeakerName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [deadlockReason, setDeadlockReason] = useState<string>('');
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  // Refs for async loop state freshness
  const isPausedRef = useRef(isPaused);
  const statusRef = useRef(status);
  const isExecutingStepRef = useRef(isExecutingStep);
  const sessionIdRef = useRef(sessionId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearLoopTimer();
    };
  }, []);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { isExecutingStepRef.current = isExecutingStep; }, [isExecutingStep]);
  useEffect(() => { sessionIdRef.current = sessionId; }, [sessionId]);

  // Agent 0 (Buyer / Recruiter / Department Head)
  const agent0 = configuredAgents[0] || selectedScenario?.defaultAgents?.[0] || {
    name: selectedScenario?.id === 'job-offer' ? 'Employer / Recruiter' : selectedScenario?.id === 'budget-allocation' ? 'Department Head' : 'Buyer',
    role: selectedScenario?.id === 'job-offer' ? 'Lead HR Partner (Recruiter)' : selectedScenario?.id === 'budget-allocation' ? 'Department Head' : 'Procurement Director (Buyer)',
    avatar: selectedScenario?.id === 'job-offer' ? 'HR' : selectedScenario?.id === 'budget-allocation' ? 'DH' : 'BY',
    personality: 'Aggressive',
  };

  // Agent 1 (Vendor / Candidate / Project Manager)
  const agent1 = configuredAgents[1] || selectedScenario?.defaultAgents?.[1] || {
    name: selectedScenario?.id === 'job-offer' ? 'Candidate' : selectedScenario?.id === 'budget-allocation' ? 'Project Manager' : 'Vendor',
    role: selectedScenario?.id === 'job-offer' ? 'Candidate' : selectedScenario?.id === 'budget-allocation' ? 'Project Manager' : 'Enterprise Sales VP (Vendor)',
    avatar: selectedScenario?.id === 'job-offer' ? 'CD' : selectedScenario?.id === 'budget-allocation' ? 'PM' : 'VN',
    personality: 'Collaborative',
  };

  // Clear pending timer
  const clearLoopTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  // Helper for Agent Display Role in Chat
  const getAgentRoleTitle = (isAgent0: boolean, rawRole?: string) => {
    const roleText = rawRole || (isAgent0 ? agent0.role : agent1.role) || 'Agent';
    if (roleText.toLowerCase().includes('agent')) {
      return roleText;
    }
    return `${roleText} Agent`;
  };

  // 1. Initialize session using user-filled details
  const initSession = async () => {
    if (!selectedScenario) return;
    clearLoopTimer();
    setMessages([]);
    setCurrentRound(1);
    setStatus('running');
    setIsPaused(false);
    setIsExecutingStep(false);
    setErrorMessage('');
    setIsStopModalOpen(false);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const existingSessionId = urlParams.get('session_id') || sessionStorage.getItem(`simulation_session_${selectedScenario.id}`);

      if (existingSessionId) {
        try {
          const sessionData = await negotiationApi.getSession(existingSessionId);
          if (sessionData && sessionData.scenario_id === selectedScenario.id && mountedRef.current) {
            setSessionId(sessionData.id);
            setCurrentRound(sessionData.current_round || 1);
            setStatus(sessionData.status as any);
            if (sessionData.deadlock_reason) {
              setDeadlockReason(sessionData.deadlock_reason);
            }
            setCurrentSpeakerName(sessionData.current_turn_speaker || agent0.name);
            if (sessionData.messages && sessionData.messages.length > 0) {
              setMessages(
                sessionData.messages.map((m: any) => ({
                  id: m.id || `msg-${Date.now()}-${Math.random()}`,
                  sender: m.sender || agent0.name,
                  role: m.role || agent0.role,
                  avatar: (m.role === agent0.role || m.sender === agent0.name) ? agent0.avatar : agent1.avatar,
                  content: m.content || '',
                  offerData: m.offer_data,
                  rationaleSummary: m.rationale_summary,
                  round: m.round || 1,
                  timestamp: m.timestamp
                    ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isAgent0: (m.sender || '').toLowerCase().includes((agent0.name || '').toLowerCase()),
                }))
              );
            }
            if (sessionData.status === 'running') {
              timerRef.current = setTimeout(() => executeNextStep(), 1500);
            }
            return;
          }
        } catch (e) {
          console.warn('Could not restore existing simulation session:', e);
        }
      }

      // Build agents payload from configuredAgents (user-filled details)
      const agentsSource = configuredAgents && configuredAgents.length >= 2 ? configuredAgents : selectedScenario.defaultAgents || [];
      const agentsPayload = agentsSource.map((ag) => ({
        agent_template_id: ag.id || 'agent',
        name: ag.name,
        role: ag.role,
        avatar: ag.avatar,
        personality: ag.personality,
        experience: ag.experience || 'Medium',
        negotiation_parameters: {
          targetPrice: ag.targetPrice,
          minPrice: ag.minPrice,
          maxBudget: ag.maxBudget,
          targetSalary: ag.targetSalary,
          minSalary: ag.minSalary,
          maxSalary: ag.maxSalary,
          targetAllocation: ag.targetAllocation,
          minAllocation: ag.minAllocation,
          paymentTerms: ag.paymentTerms,
          warrantySupport: ag.warrantySupport,
          deliveryRequirement: ag.deliveryRequirement,
          ...(ag.negotiation_parameters || {}),
        },
        goals: (ag.goals || []).map((g) => ({ text: g.text, priority: g.priority })),
        constraints: (ag.constraints || []).map((c) => ({ label: c.label, value: c.value })),
      }));

      console.log('[AI-AI][CREATE] Initializing session with custom agents for scenario:', selectedScenario.id);
      const res = await negotiationApi.createSession({
        scenario_id: selectedScenario.id,
        mode: 'ai-ai',
        agents: agentsPayload,
        scenario_data: scenarioData,
      });
      console.log('[AI-AI][CREATE_SUCCESS] Session ID created:', res.id);
      setSessionId(res.id);
      sessionStorage.setItem(`simulation_session_${selectedScenario.id}`, res.id);
      setCurrentRound(res.current_round || 1);
      setCurrentSpeakerName(agent0.name);

      console.log('[AI-AI][START] Starting negotiation session:', res.id);
      await apiRequest(`/negotiations/${res.id}/start`, { method: 'POST' });
      console.log('[AI-AI][START_SUCCESS] Negotiation session is active.');
    } catch (err: any) {
      console.error('[AI-AI][INIT_ERROR] Session initialization error:', err);
      setErrorMessage(err.message || 'Failed to initialize AI-vs-AI session on backend.');
      setStatus('terminated');
    }
  };

  useEffect(() => {
    initSession();
    return () => clearLoopTimer();
  }, [selectedScenario]);

  // 2. Sequential Step Execution Function
  const executeNextStep = async () => {
    const currentSessionId = sessionIdRef.current;
    if (
      !currentSessionId ||
      isPausedRef.current ||
      isExecutingStepRef.current ||
      statusRef.current === 'finished' ||
      statusRef.current === 'deadlock' ||
      statusRef.current === 'terminated'
    ) {
      return;
    }

    setIsExecutingStep(true);
    console.log('[AI-AI][STEP_REQUEST] Executing step for session:', currentSessionId);
    try {
      const stepRes: TurnResultResponse = await negotiationApi.executeStep(currentSessionId);
      console.log('[AI-AI][STEP_RESPONSE] Step result received:', stepRes);
      if (!mountedRef.current) return;

      setCurrentRound(stepRes.round || 1);
      if (stepRes.status) {
        setStatus(stepRes.status);
      }
      if (stepRes.deadlock_reason) {
        setDeadlockReason(stepRes.deadlock_reason);
      }

      if (stepRes.current_turn_speaker) {
        setCurrentSpeakerName(stepRes.current_turn_speaker);
      }

      if (stepRes.message) {
        const rawSender = (stepRes.message.sender || '').trim();
        const rawRole = (stepRes.message.role || '').trim();
        const normSender = rawSender.toLowerCase();
        const normRole = rawRole.toLowerCase();
        const normAgent0Name = (agent0.name || '').trim().toLowerCase();
        const normAgent1Name = (agent1.name || '').trim().toLowerCase();
        const normAgent0Role = (agent0.role || '').trim().toLowerCase();
        const normAgent1Role = (agent1.role || '').trim().toLowerCase();

        let isAgent0 = true;
        if (normSender && normAgent0Name && normSender.includes(normAgent0Name)) {
          isAgent0 = true;
        } else if (normSender && normAgent1Name && normSender.includes(normAgent1Name)) {
          isAgent0 = false;
        } else if (normRole && normAgent0Role && (normRole.includes(normAgent0Role) || normAgent0Role.includes(normRole))) {
          isAgent0 = true;
        } else if (normRole && normAgent1Role && (normRole.includes(normAgent1Role) || normAgent1Role.includes(normRole))) {
          isAgent0 = false;
        } else {
          isAgent0 = (stepRes.message.turn_index % 2 === 0);
        }

        const activeAgentObj = isAgent0 ? agent0 : agent1;
        const displayName = rawSender && rawSender !== 'Agent' ? rawSender : activeAgentObj.name;
        const displayRole = rawRole && rawRole !== 'Participant' ? rawRole : activeAgentObj.role;
        const displayAvatar = stepRes.message.avatar || activeAgentObj.avatar || (isAgent0 ? 'A0' : 'A1');

        const newMsg: SimulationMessage = {
          id: stepRes.message.id || `msg-${Date.now()}`,
          sender: displayName,
          role: displayRole,
          avatar: displayAvatar,
          content: stepRes.message.content,
          offerData: stepRes.message.offer_data || stepRes.final_terms,
          rationaleSummary: stepRes.message.rationale_summary,
          round: stepRes.message.round,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          isAgent0: isAgent0,
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }

      const isTerminal = stepRes.agreement_reached || stepRes.status === 'finished' || stepRes.status === 'deadlock' || stepRes.status === 'terminated';

      if (isTerminal) {
        console.log('[AI-AI][TERMINAL] Terminal negotiation outcome reached:', stepRes.status);
        setStatus(stepRes.status || (stepRes.agreement_reached ? 'finished' : 'deadlock'));
      } else if (!isPausedRef.current) {
        clearLoopTimer();
        timerRef.current = setTimeout(() => {
          executeNextStep();
        }, 2500);
      }
    } catch (err: any) {
      console.error('[AI-AI][STEP_ERROR] Error executing step:', err);
      setErrorMessage(err.message || 'Error executing negotiation step.');
      setStatus('terminated');
    } finally {
      setIsExecutingStep(false);
    }
  };

  // Trigger loop execution when session is initialized or unpaused
  useEffect(() => {
    if (sessionId && !isPaused && status === 'running' && !isExecutingStep) {
      clearLoopTimer();
      timerRef.current = setTimeout(() => {
        executeNextStep();
      }, 800);
    }
    return () => clearLoopTimer();
  }, [sessionId, isPaused, status]);

  // Auto scroll feed to bottom
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages.length, isExecutingStep]);

  // Handle Pause / Resume
  const handleTogglePause = () => {
    setIsPaused((prev) => {
      const next = !prev;
      if (!next && status === 'running') {
        clearLoopTimer();
        timerRef.current = setTimeout(() => executeNextStep(), 300);
      }
      return next;
    });
  };

  // Handle Stop Button Click -> Opens Stop Options Modal
  const handleStopClick = () => {
    clearLoopTimer();
    setIsPaused(true);
    setIsStopModalOpen(true);
  };

  // Handle Stop Modal Choices
  const handleStopModalAction = async (action: 'restart' | 'new_scenario' | 'view_report') => {
    setIsStopModalOpen(false);
    if (action === 'restart') {
      initSession();
    } else if (action === 'new_scenario') {
      navigate('/setup/scenario');
    } else if (action === 'view_report') {
      if (sessionId) {
        try {
          await negotiationApi.completeNegotiation(sessionId);
          setSelectedReportId(sessionId);
        } catch (e) {
          console.warn('Stop simulation error:', e);
        }
      }
      setStatus('terminated');
      navigate(sessionId ? `/reports?session_id=${sessionId}` : '/reports');
    }
  };

  if (!selectedScenario) {
    return (
      <div className="min-h-screen bg-[#EEF1F8] flex items-center justify-center p-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl shadow-xl p-10 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Activity size={26} />
          </div>
          <h3 className="text-lg font-bold text-[#14234D]">No Scenario Loaded</h3>
          <p className="text-sm text-slate-500">Please select a negotiation scenario before entering the simulation arena.</p>
          <button
            onClick={() => navigate('/setup/scenario')}
            className="px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all border-none cursor-pointer"
          >
            Setup Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#14234D] pb-8 w-full relative">
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
        {/* SIMULATION HEADER & TOP CONTROL BAR */}
        <section className="rounded-[22px] border border-white/90 bg-white/80 backdrop-blur-xl shadow-[0_10px_35px_rgba(46,65,110,0.06)] px-6 py-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Scenario</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <h2 className="text-[15px] font-bold text-[#14234D]">{selectedScenario.title}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[9px] font-semibold border border-blue-100 uppercase tracking-wider">
                    AI vs AI Autonomous
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Orchestration</p>
                <p className="text-[13px] font-semibold text-[#14234D] mt-1 flex items-center gap-1.5">
                  <Zap size={14} className="text-purple-600" />
                  LangGraph Multi-Agent
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Round Safety Limit</p>
                <p className="text-[13px] font-semibold text-[#14234D] mt-1">Round {currentRound} / 20</p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      status === 'running' && !isPaused
                        ? 'bg-emerald-500 animate-pulse'
                        : isPaused
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-700">
                    {isPaused ? 'PAUSED' : status}
                  </span>
                </div>
              </div>
            </div>

            {/* AI vs AI CONTROL BUTTONS: PAUSE AND STOP */}
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              {/* Pause / Resume Option */}
              <button
                onClick={handleTogglePause}
                disabled={status === 'finished' || status === 'deadlock' || status === 'terminated'}
                className={`px-4 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                    : 'bg-white hover:bg-amber-50 text-amber-700 border-amber-200'
                } disabled:opacity-50`}
              >
                {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} />}
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>

              {/* Stop Option */}
              <button
                onClick={handleStopClick}
                className="px-4 py-2.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Square size={13} fill="currentColor" />
                <span>Stop</span>
              </button>
            </div>
          </div>
        </section>

        {/* ERROR BANNER */}
        {errorMessage && (
          <div className="p-4 rounded-[22px] border border-red-200 bg-red-50/80 text-red-700 text-xs font-semibold flex items-center gap-3 animate-in fade-in duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TERMINATION / COMPLETION BANNERS */}
        {status === 'finished' && (
          <div className="p-6 rounded-[22px] border border-emerald-200 bg-emerald-50/80 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div>
              <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={18} />
                Agreement Reached
              </h3>
              <p className="text-xs text-emerald-700 mt-1">
                The AI agents successfully reached an agreement based on customized parameters.
              </p>
            </div>
            <button
              onClick={() => {
                if (sessionId) setSelectedReportId(sessionId);
                navigate(sessionId ? `/reports?session_id=${sessionId}` : '/reports');
              }}
              className="shrink-0 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all hover:-translate-y-0.5 cursor-pointer border-none"
            >
              View Full Report
            </button>
          </div>
        )}

        {status === 'deadlock' && (
          <div className="p-6 rounded-[24px] border-2 border-red-300 bg-red-50/95 backdrop-blur-xl shadow-xl space-y-4 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-black shadow-md">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-red-900 tracking-wide uppercase">
                    NEGOTIATION DEADLOCK
                  </h3>
                  <p className="text-xs text-red-700 font-medium">
                    Impasse declared: Negotiation halted because mutually acceptable terms cannot be reconciled.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (sessionId) {
                    try {
                      await negotiationApi.completeNegotiation(sessionId);
                      setSelectedReportId(sessionId);
                    } catch (e) {
                      console.warn('Error completing session:', e);
                    }
                  }
                  navigate(sessionId ? `/reports?session_id=${sessionId}` : '/reports');
                }}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md transition-all hover:-translate-y-0.5 cursor-pointer border-none"
              >
                Complete Negotiation & View Report
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white/90 p-4 rounded-2xl border border-red-200 shadow-xs">
              <div>
                <span className="font-extrabold text-red-900 block mb-1">Deadlock Reason:</span>
                <p className="text-red-800 bg-red-100/70 p-2.5 rounded-xl font-semibold leading-relaxed">
                  {deadlockReason || 'Zone of Possible Agreement (ZOPA) is empty; reservation boundaries are mutually exclusive.'}
                </p>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block mb-1">Unresolved Terms:</span>
                <p className="text-slate-700 bg-slate-100 p-2.5 rounded-xl font-medium leading-relaxed">
                  Contract terms and valuation thresholds conflict across mandatory participant limits.
                </p>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block mb-1">Last Proposal:</span>
                <p className="text-slate-700 bg-slate-100 p-2.5 rounded-xl font-medium leading-relaxed truncate">
                  {messages.length > 0 && messages[messages.length - 1]?.sender
                    ? `${messages[messages.length - 1].sender} (Round ${messages[messages.length - 1].round}): "${messages[messages.length - 1].content}"`
                    : 'No proposals recorded'}
                </p>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 block mb-1">Other Party's Position:</span>
                <p className="text-slate-700 bg-slate-100 p-2.5 rounded-xl font-medium leading-relaxed truncate">
                  {messages.length > 1 && messages[messages.length - 2]?.sender
                    ? `${messages[messages.length - 2].sender} (Round ${messages[messages.length - 2].round}): "${messages[messages.length - 2].content}"`
                    : 'Uncompromising baseline reservation threshold'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* MAIN LAYOUT: LEFT AGENT | CENTER CHAT | RIGHT AGENT */}
        <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_280px] gap-6 items-start">
          {/* LEFT AGENT SIDEBAR (AGENT 0) */}
          <aside className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                {agent0.avatar || 'MB'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14234D]">{getAgentRoleTitle(true, agent0.role)}</h3>
                <p className="text-[11px] text-blue-600 font-semibold mt-0.5">{agent0.role}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Personality:</span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {agent0.personality}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Position:</span>
                <span className="font-semibold text-slate-700">Left Negotiator</span>
              </div>
            </div>
          </aside>

          {/* CENTER CHAT INTERFACE FOR AI VS AI AGENTS */}
          <section className="bg-white/75 border border-white/90 rounded-[24px] shadow-[0_12px_40px_rgba(15,23,42,0.05)] overflow-hidden min-h-[580px] flex flex-col backdrop-blur-[24px]">
            {/* CHAT HEADER */}
            <div className="px-6 py-3.5 border-b border-slate-100 bg-white/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <MessageSquare size={15} className="text-blue-600" />
                <span>LangGraph AI vs AI Chat Stream</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                Auto-Advancing Stream
              </span>
            </div>

            {/* CHAT MESSAGES BODY */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:18px_18px]"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center animate-pulse">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-[#14234D]">LangGraph Initialization in Progress</h4>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    AI agents are loading custom strategy prompts and preparing opening negotiation proposals...
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isLeft = msg.isAgent0;
                  const showRoundDivider = index === 0 || messages[index - 1].round !== msg.round;
                  const roleDisplayName = getAgentRoleTitle(isLeft, msg.role);

                  return (
                    <React.Fragment key={msg.id}>
                      {showRoundDivider && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-[1px] bg-slate-200/80" />
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-white/90 px-3.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                            Round {msg.round}
                          </span>
                          <div className="flex-1 h-[1px] bg-slate-200/80" />
                        </div>
                      )}

                      <div
                        className={`flex gap-3 text-xs ${isLeft ? 'justify-start' : 'justify-end'} animate-in fade-in duration-300`}
                      >
                        {/* Left Avatar */}
                        {isLeft && (
                          <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                            {msg.avatar || agent0.avatar || 'A0'}
                          </div>
                        )}

                        {/* Chat Bubble */}
                        <div className={`space-y-1.5 max-w-[80%] md:max-w-[70%]`}>
                          {/* Header above bubble - displaying Agent Name and Role */}
                          <div className={`flex items-center gap-2 px-1 ${isLeft ? 'justify-start' : 'justify-end'}`}>
                            <span className="font-bold text-[11px] text-[#14234D]">{msg.sender}</span>
                            <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {msg.role}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400 bg-slate-100/60 px-1.5 py-0.5 rounded-md">
                              Round {msg.round} • {msg.timestamp}
                            </span>
                          </div>

                          {/* Bubble content */}
                          <div
                            className={`p-4 rounded-2xl border shadow-sm ${
                              isLeft
                                ? 'bg-blue-50/90 border-blue-100 text-slate-800 rounded-tl-none'
                                : 'bg-orange-50/90 border-orange-100 text-slate-800 rounded-tr-none'
                            }`}
                          >
                            <p className="leading-relaxed text-[12px] whitespace-pre-line">{msg.content}</p>

                            {/* Offer preview badge if structured offer exists */}
                            {msg.offerData && Object.keys(msg.offerData).length > 0 && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-2 text-[10px] font-bold">
                                {Object.entries(msg.offerData).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className={`px-2.5 py-1 rounded-lg border ${
                                      isLeft
                                        ? 'bg-blue-100/80 text-blue-800 border-blue-200'
                                        : 'bg-orange-100/80 text-orange-800 border-orange-200'
                                    }`}
                                  >
                                    {k}: <span className="font-extrabold">{String(v)}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Strategic Rationale Accordion */}
                            {msg.rationaleSummary && (
                              <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                                <details className="group text-[11px]">
                                  <summary className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 font-semibold cursor-pointer list-none select-none">
                                    <Sparkles size={12} className="text-amber-500 group-open:rotate-12 transition-transform" />
                                    <span>Strategic Rationale</span>
                                    <ChevronDown size={11} className="group-open:rotate-180 transition-transform ml-auto" />
                                  </summary>
                                  <div className="mt-1.5 p-2 rounded-xl bg-white/80 border border-slate-200/70 text-slate-700 leading-relaxed font-normal shadow-2xs">
                                    {msg.rationaleSummary}
                                  </div>
                                </details>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Avatar */}
                        {!isLeft && (
                          <div className="w-9 h-9 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                            {msg.avatar || agent1.avatar || 'A1'}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })
              )}

              {/* LOADING / TYPING ANIMATION WHEN AGENT IS GENERATING RESPONSE */}
              {isExecutingStep && (
                <div className="flex gap-3 text-xs justify-start items-center animate-pulse">
                  <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
                    <Sparkles size={16} />
                  </div>
                  <div className="p-3.5 bg-purple-50/80 border border-purple-100 rounded-2xl rounded-tl-none flex items-center gap-3">
                    <span className="text-[11px] text-purple-800 font-semibold">
                      {currentSpeakerName
                        ? `${currentSpeakerName.includes('Agent') ? currentSpeakerName : currentSpeakerName + ' Agent'} is reasoning...`
                        : 'Generating next AI agent turn...'}
                    </span>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CHAT FOOTER STATUS BAR */}
            <div className="border-t border-slate-100 bg-white/70 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                <span className="text-[11px] font-semibold text-slate-600">
                  {isPaused
                    ? 'Autonomous turn progression paused.'
                    : status === 'running'
                    ? 'Autonomous multi-agent turn stream in progress...'
                    : `Simulation complete (${status}).`}
                </span>
              </div>
              <span className="text-[10px] font-bold text-slate-400">Round {currentRound} / 20</span>
            </div>
          </section>

          {/* RIGHT AGENT SIDEBAR (AGENT 1) */}
          <aside className="bg-white/70 border border-white/85 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] backdrop-blur-[24px] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                {agent1.avatar || 'ER'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#14234D]">{getAgentRoleTitle(false, agent1.role)}</h3>
                <p className="text-[11px] text-orange-600 font-semibold mt-0.5">{agent1.role}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Personality:</span>
                <span className="font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                  {agent1.personality}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Position:</span>
                <span className="font-semibold text-slate-700">Right Negotiator</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* STOP OPTIONS POPUP MODAL */}
      {isStopModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-white/80 shadow-2xl max-w-md w-full p-7 space-y-6 text-center animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => {
                setIsStopModalOpen(false);
                setIsPaused(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-all border-none cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Square size={24} fill="currentColor" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-[#14234D]">Negotiation Simulation Stopped</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The negotiation stream has been paused. Please select an action below to proceed:
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleStopModalAction('restart')}
                className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg transition-all border-none cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Start New Negotiation</span>
              </button>

              <button
                onClick={() => handleStopModalAction('new_scenario')}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-[#14234D] font-bold text-xs flex items-center justify-center gap-2.5 transition-all border-none cursor-pointer"
              >
                <Compass size={16} className="text-slate-600" />
                <span>Select New Scenario</span>
              </button>

              <button
                onClick={() => handleStopModalAction('view_report')}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-2.5 border border-emerald-200 transition-all cursor-pointer"
              >
                <FileText size={16} />
                <span>View Outcome & Diagnostic Report</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsStopModalOpen(false);
                  setIsPaused(false);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-all border-none bg-transparent cursor-pointer"
              >
                Resume Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationArenaScreen;