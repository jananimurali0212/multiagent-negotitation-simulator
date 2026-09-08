import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { negotiationApi, apiRequest, TurnResultResponse } from '../lib/api';
import {
  Send,
  Sparkles,
  User,
  Bot,
  Square,
  AlertCircle,
  MessageSquare,
  Zap,
  Target,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Scale,
  Handshake,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Award,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  role: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  round?: number;
  offerData?: Record<string, any>;
  rationaleSummary?: string;
}

export const PracticeArenaScreen: React.FC = () => {
  const navigate = useNavigate();
  const { selectedScenario, configuredAgents, setSelectedReportId, humanRole, scenarioData } = useStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [status, setStatus] = useState<'setup' | 'ready' | 'running' | 'waiting_for_human' | 'finished' | 'deadlock' | 'terminated'>('setup');
  const [errorMessage, setErrorMessage] = useState('');
  const [deadlockReason, setDeadlockReason] = useState('');
  const [finalTerms, setFinalTerms] = useState<Record<string, any> | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [currentTurnSpeaker, setCurrentTurnSpeaker] = useState<string>('');
  const [isHumanTurn, setIsHumanTurn] = useState<boolean>(true);

  // Responsive mobile active view tab: 'chat' | 'tracker' | 'targets'
  const [mobileTab, setMobileTab] = useState<'chat' | 'tracker' | 'targets'>('chat');

  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scenarioId = selectedScenario?.id || 'vendor-pricing';

  // Authoritative agent list
  const allAgents = useMemo(() => {
    if (configuredAgents && configuredAgents.length > 0) return configuredAgents;
    const defaultData = (selectedScenario as any)?.default_agents_data;
    if (defaultData && defaultData.length > 0) return defaultData;
    if (selectedScenario?.defaultAgents && selectedScenario.defaultAgents.length > 0) return selectedScenario.defaultAgents;
    return [];
  }, [configuredAgents, selectedScenario]);

  // Robust human agent resolution matching backend turn resolver
  const userAgent = useMemo(() => {
    const cleanRole = (humanRole || '').toLowerCase().replace(/_/g, '-').trim();

    // 1. Direct role or template exact/substring match
    for (const ag of allAgents) {
      const r = (ag.role || '').toLowerCase().replace(/_/g, '-');
      const t = (ag.agent_template_id || '').toLowerCase().replace(/_/g, '-');
      const n = (ag.name || '').toLowerCase().replace(/_/g, '-');
      if (cleanRole && (cleanRole === r || cleanRole === t || cleanRole === n || r.includes(cleanRole) || t.includes(cleanRole))) {
        return ag;
      }
    }

    // 2. Canonical scenario-specific role bucket lookup
    const findMatch = (keywords: string[]) =>
      allAgents.find((ag: any) => {
        const r = (ag.role || '').toLowerCase();
        const t = (ag.agent_template_id || '').toLowerCase();
        const n = (ag.name || '').toLowerCase();
        return keywords.some((k) => r.includes(k) || t.includes(k) || n.includes(k));
      });

    if (scenarioId.includes('vendor') || scenarioId.includes('pricing')) {
      if (['buyer', 'procurement', 'purchas', 'alex'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['buyer', 'procurement', 'alex']);
        if (found) return found;
      }
      if (['vendor', 'seller', 'sales', 'sarah'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['vendor', 'sales', 'sarah']);
        if (found) return found;
      }
    } else if (scenarioId.includes('job') || scenarioId.includes('offer')) {
      if (['recruiter', 'hr', 'hiring', 'marcus'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['recruiter', 'hr', 'marcus']);
        if (found) return found;
      }
      if (['candidate', 'developer', 'engineer', 'elena'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['candidate', 'developer', 'elena']);
        if (found) return found;
      }
    } else if (scenarioId.includes('budget') || scenarioId.includes('allocation')) {
      if (['department', 'dept', 'marketing', 'cmo', 'liam'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['department', 'dept', 'marketing', 'cmo', 'liam']);
        if (found) return found;
      }
      if (['project', 'pm', 'engineering', 'priya'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['project', 'pm', 'engineering', 'priya']);
        if (found) return found;
      }
      if (['finance', 'cfo', 'david', 'vance'].some((k) => cleanRole.includes(k))) {
        const found = findMatch(['finance', 'cfo', 'david', 'vance']);
        if (found) return found;
      }
    }

    return allAgents[0] || {
      name: 'You',
      role: 'Negotiator',
      avatar: 'YOU',
      currency: '$',
    };
  }, [allAgents, humanRole, scenarioId]);

  // Opponent agents (all agents that are not the user)
  const opponentAgents = useMemo(() => {
    return allAgents.filter((a: any) => {
      if (a.id && userAgent.id) return a.id !== userAgent.id;
      return a.name !== userAgent.name;
    });
  }, [allAgents, userAgent]);

  const opponent = opponentAgents[0] || {
    name: 'AI Counterparty',
    role: 'Counterparty',
    avatar: 'AI',
    personality: 'Collaborative',
  };

  const isBuyer = (userAgent.role || '').toLowerCase().includes('buyer') || (userAgent.role || '').toLowerCase().includes('procurement') || humanRole === 'buyer';
  const isCandidate = (userAgent.role || '').toLowerCase().includes('candidate') || (userAgent.role || '').toLowerCase().includes('developer') || humanRole === 'candidate';

  // Extract latest offers for comparison
  const latestAiOffer = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].isUser && messages[i].offerData && Object.keys(messages[i].offerData!).length > 0) {
        return messages[i].offerData;
      }
    }
    return null;
  }, [messages]);

  const latestUserOffer = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].isUser && messages[i].offerData && Object.keys(messages[i].offerData!).length > 0) {
        return messages[i].offerData;
      }
    }
    return null;
  }, [messages]);

  // Dynamic Negotiation Stance Indicator
  const dynamicStance = useMemo(() => {
    if (status === 'deadlock') {
      return { label: 'Deadlocked', color: 'bg-red-100 text-red-700 border-red-200' };
    }
    if (status === 'finished') {
      return { label: 'Consensus Reached', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
    }
    if (currentRound === 1) {
      return { label: 'Anchoring Position', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    }
    const aiMessages = messages.filter((m) => !m.isUser);
    if (aiMessages.length >= 2) {
      return { label: 'Compromising', color: 'bg-amber-100 text-amber-800 border-amber-200' };
    }
    return { label: 'Firm Boundary', color: 'bg-purple-100 text-purple-700 border-purple-200' };
  }, [status, currentRound, messages]);

  // Terms Spread / Gap Metric
  const termsGap = useMemo(() => {
    if (!latestAiOffer || !latestUserOffer) return null;
    if (scenarioId === 'vendor-pricing') {
      const aiPrice = parseFloat(String(latestAiOffer.price || '').replace(/[^0-9.]/g, ''));
      const userPrice = parseFloat(String(latestUserOffer.price || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(aiPrice) && !isNaN(userPrice)) {
        const diff = Math.abs(aiPrice - userPrice);
        return {
          label: 'Price Gap',
          value: `$${diff.toFixed(0)}/user/mo`,
          detail: userPrice < aiPrice ? `AI asking $${(aiPrice - userPrice).toFixed(0)} more` : `AI offering $${(userPrice - aiPrice).toFixed(0)} less`,
          isClose: diff <= 10,
        };
      }
    } else if (scenarioId === 'job-offer') {
      const aiSal = parseInt(String(latestAiOffer.salary || '').replace(/[^0-9]/g, ''), 10);
      const userSal = parseInt(String(latestUserOffer.salary || '').replace(/[^0-9]/g, ''), 10);
      if (!isNaN(aiSal) && !isNaN(userSal)) {
        const diff = Math.abs(aiSal - userSal);
        return {
          label: 'Salary Gap',
          value: `$${diff.toLocaleString()}`,
          detail: userSal > aiSal ? `Target is $${(userSal - aiSal).toLocaleString()} higher` : `Target is $${(aiSal - userSal).toLocaleString()} lower`,
          isClose: diff <= 10000,
        };
      }
    }
    return null;
  }, [latestAiOffer, latestUserOffer, scenarioId]);

  // Initialize or restore session on mount/refresh
  useEffect(() => {
    if (!selectedScenario) return;

    let isMounted = true;
    setIsSubmitting(true);
    setErrorMessage('');

    const urlParams = new URLSearchParams(window.location.search);
    const existingSessionId = urlParams.get('session_id') || sessionStorage.getItem(`practice_session_${selectedScenario.id}`);

    const resumeExisting = async (id: string): Promise<boolean> => {
      try {
        const sessionData = await negotiationApi.getSession(id);
        if (sessionData && sessionData.scenario_id === selectedScenario.id && isMounted) {
          setSessionId(sessionData.id);
          setCurrentRound(sessionData.current_round || 1);
          setStatus(sessionData.status as any);
          if (sessionData.deadlock_reason) {
            setDeadlockReason(sessionData.deadlock_reason);
          }
          const restoredIsHuman = sessionData.is_human_turn ?? (sessionData.status === 'waiting_for_human');
          setIsHumanTurn(restoredIsHuman);
          setCurrentTurnSpeaker(sessionData.current_turn_speaker || (restoredIsHuman ? userAgent.name : opponent.name));

          if (sessionData.messages && sessionData.messages.length > 0) {
            setMessages(
              sessionData.messages.map((m: any) => ({
                id: m.id || `msg-${Date.now()}`,
                sender: m.sender || (m.is_user ? 'You' : opponent.name),
                role: m.role || (m.is_user ? userAgent.role : opponent.role),
                content: m.content || '',
                isUser: m.is_user || false,
                round: m.round || 1,
                timestamp: m.timestamp
                  ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                offerData: m.offer_data,
                rationaleSummary: m.rationale_summary,
              }))
            );
          }
          if (sessionData.status === 'finished' || sessionData.status === 'deadlock') {
            setFinalTerms(sessionData.final_terms || null);
            setShowOutcomeModal(true);
            setIsSubmitting(false);
            return true;
          }

          // Active session: If it's the AI's turn (e.g. initial round 0 or after human turn), auto-trigger AI turn
          if (sessionData.status === 'running' && !restoredIsHuman) {
            setIsSubmitting(true);
            try {
              const stepRes = await negotiationApi.executeStep(sessionData.id);
              if (isMounted && stepRes.message) {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: stepRes.message!.id || `msg-${Date.now()}`,
                    sender: stepRes.message!.sender || opponent.name,
                    role: stepRes.message!.role || opponent.role,
                    content: stepRes.message!.content,
                    isUser: false,
                    round: stepRes.message!.round || 1,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    offerData: stepRes.message!.offer_data,
                    rationaleSummary: stepRes.message!.rationale_summary,
                  },
                ]);
                setCurrentRound(stepRes.round || 1);
                if (stepRes.status) {
                  setStatus(stepRes.status as any);
                  const nextIsHuman = stepRes.is_human_turn ?? (stepRes.status === 'waiting_for_human');
                  setIsHumanTurn(nextIsHuman);
                  setCurrentTurnSpeaker(stepRes.current_turn_speaker || userAgent.name);
                  if (stepRes.status === 'finished' || stepRes.status === 'deadlock') {
                    setFinalTerms(stepRes.final_terms || stepRes.message.offer_data || null);
                    setShowOutcomeModal(true);
                  }
                }
              }
            } catch (stepErr) {
              console.error('Failed to trigger opening AI turn:', stepErr);
            }
          }

          setIsSubmitting(false);
          return true;
        }
      } catch (e) {
        console.warn('Could not restore session from storage, starting fresh:', e);
      }
      return false;
    };

    const initFreshSession = async () => {
      try {
        const res = await negotiationApi.createSession({
          scenario_id: selectedScenario.id,
          mode: 'human-ai',
          human_role:
            humanRole ||
            (selectedScenario.id === 'job-offer'
              ? 'candidate'
              : selectedScenario.id === 'budget-allocation'
              ? 'department-head'
              : 'buyer'),
          scenario_data: scenarioData,
        });
        if (!isMounted) return;

        setSessionId(res.id);
        sessionStorage.setItem(`practice_session_${selectedScenario.id}`, res.id);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('session_id', res.id);
        const startRes = await apiRequest<any>(`/negotiations/${res.id}/start`, { method: 'POST' });

        const humanStarts = startRes.is_human_turn ?? (startRes.status === 'waiting_for_human');
        if (isMounted) {
          setIsHumanTurn(humanStarts);
          setCurrentTurnSpeaker(startRes.current_turn_speaker || (humanStarts ? userAgent.name : opponent.name));
          setStatus(startRes.status as any);
        }

        if (!humanStarts && startRes.status === 'running') {
          const stepRes = await negotiationApi.executeStep(res.id);
          if (isMounted && stepRes.message) {
            setMessages([
              {
                id: stepRes.message.id || `msg-${Date.now()}`,
                sender: stepRes.message.sender || opponent.name,
                role: stepRes.message.role || opponent.role,
                content: stepRes.message.content,
                isUser: stepRes.message.is_user || false,
                round: stepRes.message.round || 1,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                offerData: stepRes.message.offer_data,
                rationaleSummary: stepRes.message.rationale_summary,
              },
            ]);
            setCurrentRound(stepRes.round || 1);
            if (stepRes.status) {
              setStatus(stepRes.status as any);
              if (stepRes.deadlock_reason) {
                setDeadlockReason(stepRes.deadlock_reason);
              }
              setIsHumanTurn(stepRes.is_human_turn ?? (stepRes.status === 'waiting_for_human'));
              setCurrentTurnSpeaker(stepRes.current_turn_speaker || userAgent.name);
              if (stepRes.status === 'finished' || stepRes.status === 'deadlock') {
                setFinalTerms(stepRes.final_terms || stepRes.message.offer_data || null);
                setShowOutcomeModal(true);
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Backend negotiation creation error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to connect to backend for negotiation setup.');
          setStatus('terminated');
        }
      } finally {
        if (isMounted) setIsSubmitting(false);
      }
    };

    (async () => {
      if (existingSessionId) {
        const restored = await resumeExisting(existingSessionId);
        if (restored) return;
      }
      await initFreshSession();
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedScenario]);

  // Auto-scroll feed to bottom smoothly
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTo({
        top: feedRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages.length, isSubmitting]);

  // Live validation assessment of opponent's offer against user's authentic scenario targets
  const liveAssessment = useMemo(() => {
    if (scenarioId === 'vendor-pricing') {
      const userTarget = parseFloat(String(scenarioData.target_price || userAgent.targetPrice || '55').replace(/[^0-9.]/g, ''));
      const userMax = parseFloat(String(scenarioData.maximum_budget || userAgent.maxBudget || '65').replace(/[^0-9.]/g, ''));
      const currentVendorPrice = parseFloat(String(scenarioData.current_vendor_price || userAgent.minPrice || '80').replace(/[^0-9.]/g, ''));

      const activePrice = latestAiOffer?.price 
        ? parseFloat(String(latestAiOffer.price).replace(/[^0-9.]/g, '')) 
        : currentVendorPrice;

      if (isBuyer) {
        if (activePrice <= userTarget) return { level: 'excellent', label: 'Optimal Price Zone', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (activePrice <= userMax) return { level: 'moderate', label: 'Within Acceptable Budget', color: 'text-amber-700 bg-amber-50 border-amber-200' };
        return { level: 'warning', label: 'Exceeds Maximum Budget Bound', color: 'text-red-700 bg-red-50 border-red-200' };
      } else {
        if (activePrice >= currentVendorPrice) return { level: 'excellent', label: 'Optimal Revenue Target', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        if (activePrice >= userTarget) return { level: 'moderate', label: 'Above Target Floor', color: 'text-amber-700 bg-amber-50 border-amber-200' };
        return { level: 'warning', label: 'Below Minimum Viable Floor', color: 'text-red-700 bg-red-50 border-red-200' };
      }
    } else if (scenarioId === 'job-offer') {
      const targetSal = parseFloat(String(scenarioData.expected_salary || userAgent.targetSalary || '185000').replace(/[^0-9.]/g, ''));
      const initialSal = parseFloat(String(scenarioData.current_initial_salary || '155000').replace(/[^0-9.]/g, ''));
      const activeSal = latestAiOffer?.salary 
        ? parseFloat(String(latestAiOffer.salary).replace(/[^0-9.]/g, '')) 
        : initialSal;

      if (!isCandidate) {
        if (activeSal <= initialSal) return { level: 'excellent', label: 'Within Preferred Budget', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        return { level: 'moderate', label: 'Above Initial Offer Band', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      } else {
        if (activeSal >= targetSal) return { level: 'excellent', label: 'Meets Your Expected Salary', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
        return { level: 'moderate', label: 'Below Your Expected Salary Target', color: 'text-amber-700 bg-amber-50 border-amber-200' };
      }
    }
    return { level: 'moderate', label: 'Active Negotiations', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  }, [scenarioId, isBuyer, isCandidate, scenarioData, latestAiOffer, userAgent]);

  // Auto-generate proposal message text from real user scenario data
  const handleAutoGenerateMessage = () => {
    let generated = '';
    if (scenarioId === 'vendor-pricing') {
      generated = `I propose our target rate of ${scenarioData.target_price || '$55/user/month'} on ${scenarioData.other_conditions || 'standard payment terms'}, with ${scenarioData.quality_requirement || '99.9% uptime SLA'} and ${scenarioData.delivery_requirement || '14 business days'} delivery.`;
    } else if (scenarioId === 'job-offer') {
      generated = `Based on my background, I propose a base salary of ${scenarioData.expected_salary || '$185,000 / year'} with ${scenarioData.work_mode || 'Hybrid flexibility'}, ${scenarioData.benefits || 'comprehensive benefits & equity'}, starting on ${scenarioData.joining_date || '30 days'}.`;
    } else {
      generated = `We propose allocating our ${scenarioData.total_budget || '$1,500,000'} project budget prioritizing ${scenarioData.priority_areas || 'core development & reliability'} to meet our deadline of ${scenarioData.deadline || 'Q4 2026'}.`;
    }
    setInputText(generated);
    inputRef.current?.focus();
  };

  // Quick Compromise Suggestion (anchoring to middle of current terms spread)
  const handleMeetInTheMiddle = () => {
    if (!latestAiOffer || !latestUserOffer) return;
    if (scenarioId === 'vendor-pricing') {
      const aiPrice = parseFloat(String(latestAiOffer.price || '80').replace(/[^0-9.]/g, ''));
      const userPrice = parseFloat(String(latestUserOffer.price || '55').replace(/[^0-9.]/g, ''));
      const mid = Math.round((aiPrice + userPrice) / 2);
      setInputText(`How about we meet in the middle at $${mid}/user/month with standard 14-day SLA terms?`);
      inputRef.current?.focus();
      return;
    }
    if (scenarioId === 'job-offer') {
      const aiSal = parseInt(String(latestAiOffer.salary || '160000').replace(/[^0-9]/g, ''), 10);
      const userSal = parseInt(String(latestUserOffer.salary || '185000').replace(/[^0-9]/g, ''), 10);
      const mid = Math.round((aiSal + userSal) / 2000) * 1000;
      setInputText(`Could we find common ground at $${mid.toLocaleString()} base salary with 3 days remote flexibility?`);
      inputRef.current?.focus();
      return;
    }
    setInputText('We propose adjusting department allocations to find a collaborative balance.');
    inputRef.current?.focus();
  };

  // Accept counterparty's active terms immediately
  const handleAcceptDeal = () => {
    if (!latestAiOffer) {
      setInputText('I agree to the proposed terms. Let us finalize the agreement.');
      inputRef.current?.focus();
      return;
    }
    const termsSummary = Object.entries(latestAiOffer)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');
    setInputText(`I accept your latest proposal (${termsSummary}). We have a deal!`);
    inputRef.current?.focus();
  };

  // Handle user send turn with immediate optimistic rendering
  const handleSend = async (customText?: string, customOffer?: Record<string, any>) => {
    const textToSend = (customText !== undefined ? customText : inputText).trim();
    if (!textToSend || isSubmitting || status === 'finished' || status === 'terminated' || !sessionId) return;

    setInputText('');
    setErrorMessage('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'You',
      role: userAgent.role,
      content: textToSend,
      isUser: true,
      round: currentRound,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      offerData: customOffer,
    };

    // 1. Optimistically display user's message immediately for responsive UI
    setMessages((prev) => [...prev, userMsg]);
    setIsSubmitting(true);

    try {
      // If no messages yet and AI was supposed to speak first, auto-execute AI opening turn first
      if (messages.length === 0 && !isHumanTurn && status === 'running') {
        try {
          const openingStep = await negotiationApi.executeStep(sessionId);
          if (openingStep.message) {
            const openAiMsg: ChatMessage = {
              id: openingStep.message.id || `ai-open-${Date.now()}`,
              sender: openingStep.message.sender || opponent.name,
              role: openingStep.message.role || opponent.role,
              content: openingStep.message.content,
              isUser: false,
              round: openingStep.message.round || 1,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              offerData: openingStep.message.offer_data,
              rationaleSummary: openingStep.message.rationale_summary,
            };
            // Put AI opening offer right before user's message
            setMessages([openAiMsg, userMsg]);
          }
        } catch (openErr) {
          console.warn('Auto opening AI step note:', openErr);
        }
      }

      const turnRes = await negotiationApi.submitUserTurn(sessionId, textToSend, customOffer);

      if (turnRes.validation_error && !turnRes.message) {
        setErrorMessage(turnRes.validation_error);
        // Rollback optimistic message so user can edit and re-send
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
        setInputText(textToSend);
        inputRef.current?.focus();
        setIsSubmitting(false);
        return;
      }

      setCurrentRound(turnRes.round || currentRound);

      if (turnRes.status) {
        setStatus(turnRes.status as any);
        if (turnRes.deadlock_reason) {
          setDeadlockReason(turnRes.deadlock_reason);
        }
        if (turnRes.status === 'finished' || turnRes.status === 'deadlock') {
          setFinalTerms(turnRes.final_terms || turnRes.message?.offer_data || customOffer || null);
          setShowOutcomeModal(true);
        }
      }

      if (turnRes.message) {
        const aiMsg: ChatMessage = {
          id: turnRes.message.id || `ai-${Date.now()}`,
          sender: turnRes.message.sender || opponent.name,
          role: turnRes.message.role || opponent.role,
          content: turnRes.message.content,
          isUser: turnRes.message.is_user || false,
          round: turnRes.message.round,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          offerData: turnRes.message.offer_data,
          rationaleSummary: turnRes.message.rationale_summary,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }

      const nextIsHuman = turnRes.is_human_turn ?? (turnRes.status === 'waiting_for_human');
      setIsHumanTurn(nextIsHuman);
      setCurrentTurnSpeaker(turnRes.current_turn_speaker || (nextIsHuman ? userAgent.name : opponent.name));

      // Multi-AI chaining: if next turn belongs to another AI agent (e.g. Budget Allocation with 3 agents)
      if (turnRes.status === 'running' && !nextIsHuman && sessionId) {
        setTimeout(async () => {
          try {
            const nextStep = await negotiationApi.executeStep(sessionId);
            if (nextStep.message) {
              setMessages((prev) => [
                ...prev,
                {
                  id: nextStep.message!.id || `ai-${Date.now()}`,
                  sender: nextStep.message!.sender || 'AI',
                  role: nextStep.message!.role || 'Participant',
                  content: nextStep.message!.content,
                  isUser: false,
                  round: nextStep.message!.round,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  offerData: nextStep.message!.offer_data,
                  rationaleSummary: nextStep.message!.rationale_summary,
                },
              ]);
            }
            if (nextStep.status) {
              setStatus(nextStep.status as any);
              if (nextStep.deadlock_reason) {
                setDeadlockReason(nextStep.deadlock_reason);
              }
              const chainedIsHuman = nextStep.is_human_turn ?? (nextStep.status === 'waiting_for_human');
              setIsHumanTurn(chainedIsHuman);
              setCurrentTurnSpeaker(nextStep.current_turn_speaker || userAgent.name);
              if (nextStep.status === 'finished' || nextStep.status === 'deadlock') {
                setFinalTerms(nextStep.final_terms || nextStep.message?.offer_data || null);
                setShowOutcomeModal(true);
              }
            }
          } catch (chainErr) {
            console.error('Multi-AI auto-step error:', chainErr);
          }
        }, 1200);
      }
    } catch (err: any) {
      console.error('Submit turn error:', err);
      setErrorMessage(err.message || 'Failed to submit offer to AI opponent.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopNegotiation = async () => {
    if (!sessionId) return;
    setIsSubmitting(true);
    try {
      await negotiationApi.completeNegotiation(sessionId);
    } catch (err) {
      console.warn('Complete session fallback:', err);
    } finally {
      setSelectedReportId(sessionId);
      setStatus('finished');
      setIsSubmitting(false);
      navigate(`/reports?session_id=${sessionId}`);
    }
  };

  if (!selectedScenario) {
    return (
      <div className="min-h-screen bg-[#EEF1F8] flex items-center justify-center p-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/80 bg-white/80 backdrop-blur-xl shadow-xl p-10 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <MessageSquare size={26} />
          </div>
          <h3 className="text-lg font-bold text-[#14234D]">No Scenario Loaded</h3>
          <p className="text-sm text-slate-500">Please select a negotiation scenario before entering the practice arena.</p>
          <button
            onClick={() => navigate('/setup/scenario')}
            className="px-6 py-3 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-all border-none cursor-pointer"
          >
            Select Scenario
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[#14234D] pb-12 w-full max-w-7xl mx-auto space-y-5">
      {/* TOP STATUS HEADER BAR */}
      <section className="rounded-[24px] border border-white/90 bg-white/85 backdrop-blur-xl shadow-[0_10px_35px_rgba(46,65,110,0.06)] px-6 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Scenario</p>
              <div className="flex items-center gap-2 mt-1">
                <h2 className="text-[14px] font-extrabold text-[#14234D] truncate">{selectedScenario.title}</h2>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Opponent</p>
              <p className="text-[13px] font-bold text-orange-600 mt-1 truncate">
                {opponent.name} <span className="text-slate-400 font-normal">({opponent.role})</span>
              </p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Negotiation Round</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[13px] font-bold text-[#14234D]">Round {currentRound}</span>
                <span className="text-[11px] text-slate-400">/ 20</span>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden ml-1">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (currentRound / 20) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Turn</p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === 'waiting_for_human' || isHumanTurn
                      ? 'bg-blue-600 animate-pulse'
                      : status === 'running'
                      ? 'bg-amber-500 animate-pulse'
                      : status === 'finished'
                      ? 'bg-emerald-500'
                      : 'bg-red-500'
                  }`}
                />
                <span className={`text-[12px] font-extrabold uppercase tracking-wider ${
                  status === 'waiting_for_human' || isHumanTurn ? 'text-blue-700' : 'text-amber-700'
                }`}>
                  {status === 'waiting_for_human' || isHumanTurn ? 'Your Turn' : `${currentTurnSpeaker || 'AI'} Thinking`}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleStopNegotiation}
              className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-red-500/10 border-none"
            >
              <Square size={12} fill="currentColor" />
              <span>Complete Negotiation</span>
            </button>
          </div>
        </div>
      </section>

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
                  Impasse declared: Mutually acceptable terms cannot be reconciled within constraint boundaries.
                </p>
              </div>
            </div>
            <button
              onClick={handleStopNegotiation}
              className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md transition-all hover:-translate-y-0.5 cursor-pointer border-none"
            >
              Complete Negotiation & View Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white/90 p-4 rounded-2xl border border-red-200 shadow-xs">
            <div>
              <span className="font-extrabold text-red-900 block mb-1">Deadlock Reason:</span>
              <p className="text-red-800 bg-red-100/70 p-2.5 rounded-xl font-semibold leading-relaxed">
                {deadlockReason || 'Zone of Possible Agreement (ZOPA) is empty; participant constraint thresholds are in direct conflict.'}
              </p>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block mb-1">Unresolved Terms:</span>
              <p className="text-slate-700 bg-slate-100 p-2.5 rounded-xl font-medium leading-relaxed">
                Fundamental pricing or package requirements conflict with hard reserve limitations.
              </p>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block mb-1">Last Proposal:</span>
              <p className="text-slate-700 bg-slate-100 p-2.5 rounded-xl font-medium leading-relaxed truncate">
                {messages.length > 0 && messages[messages.length - 1]?.sender
                  ? `${messages[messages.length - 1].sender} (Round ${messages[messages.length - 1].round || currentRound}): "${messages[messages.length - 1].content}"`
                  : 'No proposals recorded'}
              </p>
            </div>
            <div>
              <span className="font-extrabold text-slate-900 block mb-1">Other Party's Position:</span>
              <p className="text-slate-700 bg-slate-100 p-2.5 rounded-xl font-medium leading-relaxed truncate">
                {messages.length > 1 && messages[messages.length - 2]?.sender
                  ? `${messages[messages.length - 2].sender}: "${messages[messages.length - 2].content}"`
                  : 'Uncompromising constraint threshold'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE RESPONSIVE NAVIGATION TABS */}
      <div className="flex lg:hidden bg-white/80 rounded-2xl p-1 border border-slate-200 shadow-sm gap-1">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Chat Feed
        </button>
        <button
          onClick={() => setMobileTab('tracker')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'tracker' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Terms Compare
        </button>
        <button
          onClick={() => setMobileTab('targets')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
            mobileTab === 'targets' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Your Targets
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 font-semibold shadow-sm animate-in fade-in">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 p-1">
            <X size={14} />
          </button>
        </div>
      )}

      {/* MAIN 3-COLUMN RESPONSIVE LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: OPPONENT PROFILE & LIVE COMPARISON (Desktop: 3 cols) */}
        <div className={`space-y-4 lg:col-span-3 ${mobileTab === 'tracker' ? 'block' : 'hidden lg:block'}`}>
          {/* Opponent Card */}
          <aside className="bg-white/80 border border-white/90 rounded-[22px] p-5 shadow-sm backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">AI Counterparty</span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${dynamicStance.color} uppercase`}>
                {dynamicStance.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
                {opponent.avatar || 'AI'}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-extrabold text-[#14234D] truncate">{opponent.name}</h3>
                <p className="text-[11px] text-orange-600 font-bold truncate">{opponent.role}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Negotiation Style:</span>
              <span className="font-bold text-slate-700">{opponent.personality || 'Collaborative'}</span>
            </div>
          </aside>

          {/* Round & Live Negotiation Metrics Panel */}
          <aside className="bg-white/80 border border-white/90 rounded-[22px] p-5 shadow-sm backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-extrabold text-[#14234D] flex items-center gap-1.5 uppercase tracking-wider">
                <BarChart3 size={14} className="text-blue-600" />
                Live Negotiation Metrics
              </span>
              <span className="text-[10px] font-bold text-slate-400">Ceiling: 20</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-bold text-slate-600">Round Progress:</span>
                  <span className="text-[11px] font-extrabold text-[#14234D]">
                    Round {currentRound} <span className="text-slate-400 font-normal">/ 20</span>
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (currentRound / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {termsGap && (
                <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-0.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-bold">{termsGap.label}:</span>
                    <span className={`font-black ${termsGap.isClose ? 'text-emerald-600' : 'text-blue-700'}`}>
                      {termsGap.value}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">{termsGap.detail}</p>
                </div>
              )}

              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 text-[11px]">
                <span className="text-slate-500 font-bold">Exchange Turns:</span>
                <span className="font-extrabold text-[#14234D]">{messages.length} messages</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 text-[11px]">
                <span className="text-slate-500 font-bold">Current Stance:</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${dynamicStance.color} uppercase`}>
                  {dynamicStance.label}
                </span>
              </div>
            </div>
          </aside>

          {/* Live Deal Comparison Tracker */}
          <aside className="bg-white/80 border border-white/90 rounded-[22px] p-5 shadow-sm backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-extrabold text-[#14234D] flex items-center gap-1.5 uppercase tracking-wider">
                <Scale size={14} className="text-blue-600" />
                Latest Terms Comparison
              </span>
            </div>

            {/* Comparison Matrix */}
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100">
                <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wider mb-1">
                  Opponent's Last Offer:
                </p>
                {latestAiOffer ? (
                  <div className="space-y-0.5 font-bold text-[#14234D]">
                    {Object.entries(latestAiOffer).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-500 capitalize">{k}:</span>
                        <span className="text-orange-950 font-extrabold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No formal offer submitted yet.</p>
                )}
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1">Your Last Proposal:</p>
                {latestUserOffer ? (
                  <div className="space-y-0.5 font-bold text-[#14234D]">
                    {Object.entries(latestUserOffer).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-slate-500 capitalize">{k}:</span>
                        <span className="text-blue-950 font-extrabold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">You have not submitted an offer yet.</p>
                )}
              </div>
            </div>

            {/* Quick Compromise Action */}
            {latestAiOffer && (
              <button
                onClick={handleMeetInTheMiddle}
                disabled={isSubmitting || status === 'finished'}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-blue-50 text-blue-700 hover:text-blue-800 border border-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Scale size={13} />
                <span>Calculate Midpoint Compromise</span>
              </button>
            )}
          </aside>
        </div>

        {/* CENTER COLUMN: INTERACTIVE CHAT & REAL SCENARIO CONTEXT (Desktop: 6 cols) */}
        <div className={`space-y-4 lg:col-span-6 ${mobileTab === 'chat' ? 'block' : 'hidden lg:block'}`}>
          {/* REAL SCENARIO DATA CONTEXT PANEL */}
          <section className="bg-white/90 border border-white/95 rounded-[22px] p-4 sm:p-5 shadow-sm backdrop-blur-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <h3 className="text-xs font-extrabold text-[#14234D] uppercase tracking-wider">
                    Authoritative Scenario Data (Ground Truth)
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  User Provided
                </span>
              </div>

              {/* Display Scenario Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {scenarioId === 'vendor-pricing' && (
                  <>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Product</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.product || 'Enterprise Cloud ERP'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Quantity</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.quantity || '250 licenses'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Price</span>
                      <span className="font-extrabold text-orange-700 text-xs truncate block">{scenarioData.current_vendor_price || '$80/user'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Target Price</span>
                      <span className="font-extrabold text-emerald-700 text-xs truncate block">{scenarioData.target_price || '$55/user'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Max Budget</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.maximum_budget || '$65/user'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Delivery</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.delivery_requirement || '14 days'}</span>
                    </div>
                  </>
                )}

                {scenarioId === 'job-offer' && (
                  <>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Role</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.job_role || 'Staff Engineer'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Initial Offer</span>
                      <span className="font-extrabold text-orange-700 text-xs truncate block">{scenarioData.current_initial_salary || '$155,000'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Expected Salary</span>
                      <span className="font-extrabold text-emerald-700 text-xs truncate block">{scenarioData.expected_salary || '$185,000'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Experience</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.experience || '8+ years'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Work Mode</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.work_mode || 'Hybrid'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Joining Date</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.joining_date || '30 days'}</span>
                    </div>
                  </>
                )}

                {scenarioId === 'budget-allocation' && (
                  <>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Project</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.project || 'Infrastructure Modernization'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Budget</span>
                      <span className="font-extrabold text-purple-700 text-xs truncate block">{scenarioData.total_budget || '$1,500,000'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Deadline</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.deadline || 'Q4 2026'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 col-span-2">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Priority Focus</span>
                      <span className="font-extrabold text-slate-800 text-xs truncate block">{scenarioData.priority_areas || 'Reliability & Scalability'}</span>
                    </div>
                  </>
                )}
              </div>
            </section>

          {/* CHAT INTERFACE */}
          <section className="bg-white/85 border border-white/90 rounded-[24px] shadow-sm overflow-hidden h-[540px] md:h-[620px] flex flex-col backdrop-blur-xl">
            {/* CHAT HEADER */}
            <div className="px-5 py-3 border-b border-slate-100 bg-white/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700">
                <MessageSquare size={15} className="text-blue-600" />
                <span>Live Dialogue Feed</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active & Responsive</span>
              </span>
            </div>

            {/* CHAT FEED CONTAINER */}
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[radial-gradient(#f1f5f9_1px,transparent_1px)] [background-size:16px_16px] scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white/50 rounded-2xl border border-dashed border-slate-200 animate-in fade-in">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#14234D]">Opening Negotiation Turn</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">
                      You hold the opening turn as <span className="font-bold text-blue-600">{userAgent.role}</span>. Enter your opening proposal or offer terms below based on your scenario parameters.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.isUser;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 text-xs ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-sm">
                        {opponent.avatar || 'AI'}
                      </div>
                    )}

                    <div className="space-y-1.5 max-w-[85%] sm:max-w-[75%]">
                      <div className={`flex items-center gap-2 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <span className="font-extrabold text-[11px] text-[#14234D]">{msg.sender}</span>
                        <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {msg.timestamp}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-2xl border shadow-sm ${
                          isUser
                            ? 'bg-blue-600 text-white border-blue-600 rounded-tr-none'
                            : 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none'
                        }`}
                      >
                        <p className="leading-relaxed text-[12px] whitespace-pre-line">{msg.content}</p>

                        {/* Structured Offer Data Tags */}
                        {msg.offerData && Object.keys(msg.offerData).length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50 flex flex-wrap gap-1.5 text-[10px] font-bold">
                            {Object.entries(msg.offerData).map(([k, v]) => (
                              <span
                                key={k}
                                className={`px-2 py-0.5 rounded-md border ${
                                  isUser
                                    ? 'bg-blue-700/70 text-white border-blue-400'
                                    : 'bg-orange-50 text-orange-800 border-orange-200'
                                }`}
                              >
                                {k}: <span className="font-black">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Per-Turn Strategic Rationale Accordion */}
                        {!isUser && msg.rationaleSummary && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                            <details className="group text-[11px]" open>
                              <summary className="flex items-center gap-1.5 text-amber-900 bg-amber-50/80 hover:bg-amber-100/90 px-2.5 py-1 rounded-lg font-bold cursor-pointer list-none select-none transition-colors border border-amber-200/70">
                                <Sparkles size={12} className="text-amber-600 group-open:rotate-12 transition-transform" />
                                <span>AI Strategic Rationale</span>
                              </summary>
                              <div className="mt-2 p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 text-slate-700 text-[11px] leading-relaxed">
                                {msg.rationaleSummary}
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-extrabold text-[11px] shrink-0 shadow-sm">
                        YOU
                      </div>
                    )}
                  </div>
                );
              })}

              {/* AI Typing Animation */}
              {isSubmitting && (
                <div className="flex gap-3 text-xs justify-start items-center animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-sm">
                    {opponent.avatar || 'AI'}
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="text-[11px] text-orange-800 font-bold">
                      {opponent.name} is formulating a response...
                    </span>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK SUGGESTION PILLS */}
            <div className="px-4 py-2 bg-slate-50/90 border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Zap size={11} className="text-amber-500" /> Quick Prompts:
              </span>
              {scenarioId === 'vendor-pricing' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`We propose our target price of ${scenarioData.target_price || '$55/user/month'} on ${scenarioData.other_conditions || 'standard terms'}.`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Propose Target Rate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`We can agree if you guarantee ${scenarioData.quality_requirement || '99.9% SLA & Gold Support'} with ${scenarioData.delivery_requirement || '14 business days'} delivery.`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Require SLA & Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`Our maximum budget ceiling is ${scenarioData.maximum_budget || '$65/user/month'}. We cannot exceed this cap.`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Hold Budget Ceiling
                  </button>
                </>
              )}
              {scenarioId === 'job-offer' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`Based on my experience, my expected compensation is ${scenarioData.expected_salary || '$185,000 / year'}.`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Expected Salary
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`Remote flexibility is key for me. Can we formalize ${scenarioData.work_mode || 'Hybrid arrangement'} with joining on ${scenarioData.joining_date || '30 days'}?`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Confirm Work Mode & Date
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`Can we clarify the terms for ${scenarioData.benefits || 'comprehensive benefits & equity'} and ${scenarioData.other_requirements || 'bonus structure'}?`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Discuss Benefits & Equity
                  </button>
                </>
              )}
              {scenarioId === 'budget-allocation' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`We must align department allocations to prioritize ${scenarioData.priority_areas || 'core deliverables'} within our ${scenarioData.total_budget || '$1,500,000'} cap.`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Focus on Priorities
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputText(`To meet the deadline of ${scenarioData.deadline || 'Q4 2026'}, resource requirements (${scenarioData.resource_requirements || 'core engineering'}) must be funded.`);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-all font-semibold shrink-0 cursor-pointer"
                  >
                    Timeline & Resources
                  </button>
                </>
              )}
            </div>

            {/* CHAT INPUT BAR */}
            <div className="p-3.5 border-t border-slate-100 bg-white/95 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2 items-center"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    status === 'finished' || status === 'terminated'
                      ? 'Negotiation concluded.'
                      : isSubmitting
                      ? `${opponent.name} is formulating response... Please wait.`
                      : 'Type your negotiation proposal or counteroffer...'
                  }
                  disabled={status === 'finished' || status === 'terminated' || isSubmitting}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-800 font-medium disabled:opacity-50 transition-all placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || status === 'finished' || status === 'terminated' || isSubmitting}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 shrink-0 border-none cursor-pointer flex items-center gap-1.5"
                >
                  <span>Send</span>
                  <Send size={14} />
                </button>
              </form>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: PRIVATE REFERENCE BOUNDS & GOALS (Desktop: 3 cols) */}
        <div className={`space-y-4 lg:col-span-3 ${mobileTab === 'targets' ? 'block' : 'hidden lg:block'}`}>
          <aside className="bg-white/80 border border-white/90 rounded-[22px] p-5 shadow-sm backdrop-blur-xl space-y-4">
            <h3 className="font-extrabold text-xs text-[#14234D] uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
              <Target size={15} className="text-blue-600" />
              Your Confidential Targets
            </h3>

            <div className="space-y-2.5 text-xs font-semibold text-slate-700">
              {userAgent.targetPrice && (
                <div className="flex justify-between items-center p-2.5 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="text-slate-600">Target Benchmark:</span>
                  <span className="text-blue-700 font-extrabold">
                    {userAgent.currency || '$'}
                    {userAgent.targetPrice}
                  </span>
                </div>
              )}
              {userAgent.maxBudget && (
                <div className="flex justify-between items-center p-2.5 bg-red-50/60 rounded-xl border border-red-100">
                  <span className="text-slate-600">Max Budget Ceiling:</span>
                  <span className="text-red-600 font-extrabold">
                    {userAgent.currency || '$'}
                    {userAgent.maxBudget}
                  </span>
                </div>
              )}
              {userAgent.minPrice && (
                <div className="flex justify-between items-center p-2.5 bg-amber-50/60 rounded-xl border border-amber-100">
                  <span className="text-slate-600">Min Price Floor:</span>
                  <span className="text-amber-700 font-extrabold">
                    {userAgent.currency || '$'}
                    {userAgent.minPrice}
                  </span>
                </div>
              )}

              {/* Goals Checklist */}
              {userAgent.goals && userAgent.goals.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-extrabold block mb-2">
                    Priority Strategic Goals
                  </span>
                  <div className="space-y-1.5">
                    {userAgent.goals.map((g: any, idx: number) =>
                      g.text ? (
                        <div key={idx} className="flex items-start gap-2 text-[11px] font-medium text-slate-600">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{g.text}</span>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* TERMINAL OUTCOME MODAL */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div
                className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                  status === 'finished' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
                }`}
              >
                {status === 'finished' ? <Award size={28} /> : <AlertCircle size={28} />}
              </div>
              <h3 className={`text-xl font-extrabold ${status === 'deadlock' ? 'text-red-900' : 'text-[#14234D]'}`}>
                {status === 'finished' ? 'Negotiation Agreement Reached!' : status === 'deadlock' ? 'NEGOTIATION DEADLOCK' : 'Negotiation Concluded'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {status === 'deadlock'
                  ? `Impasse declared in Round ${currentRound} due to irreconcilable constraints.`
                  : `Simulation ended in Round ${currentRound} with ${opponent.name}.`}
              </p>
            </div>

            {status === 'deadlock' && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left space-y-2 text-xs">
                <span className="font-extrabold text-red-900 block">Deadlock Reason:</span>
                <p className="text-red-800 bg-red-100/60 p-2.5 rounded-xl font-semibold">
                  {deadlockReason || 'Zone of Possible Agreement (ZOPA) is empty; reservation thresholds are mutually exclusive.'}
                </p>
              </div>
            )}

            {finalTerms && Object.keys(finalTerms).length > 0 && status !== 'deadlock' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Final Agreed Terms:</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-bold text-[#14234D]">
                  {Object.entries(finalTerms).map(([k, v]) => (
                    <div key={k} className="p-2 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px] capitalize">{k}</span>
                      <span className="text-blue-700 font-extrabold">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  if (sessionId) setSelectedReportId(sessionId);
                  navigate(sessionId ? `/reports?session_id=${sessionId}` : '/reports');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all border-none cursor-pointer"
              >
                <FileText size={15} />
                <span>View Full Analytics Report</span>
              </button>
              <button
                onClick={() => navigate('/setup/scenario')}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border-none cursor-pointer"
              >
                Practice Another Scenario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PracticeArenaScreen;

