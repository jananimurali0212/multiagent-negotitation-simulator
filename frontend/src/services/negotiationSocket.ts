import {
  NegotiationMessage,
  NegotiationTelemetry,
  DeadlockState,
  AgreementState,
  NegotiationStatus,
  CoachingTip,
  HumanPerformanceMetrics,
  NegotiationOffer
} from '../types/negotiation';
import { SCRIPTED_SIMULATIONS, ScriptedTurn } from '../data/mockNegotiations';

export interface SocketCallbacks {
  onMessage?: (message: NegotiationMessage) => void;
  onTelemetry?: (telemetry: NegotiationTelemetry) => void;
  onStatusChange?: (status: NegotiationStatus) => void;
  onAgentStatus?: (agentId: string, status: 'speaking' | 'waiting' | 'thinking', currentOffer?: string) => void;
  onDeadlock?: (deadlock: DeadlockState) => void;
  onAgreement?: (agreement: AgreementState) => void;
  onCoachTip?: (tip: CoachingTip) => void;
  onHumanMetrics?: (metrics: HumanPerformanceMetrics) => void;
}

export class NegotiationSocketService {
  private sessionId: string | null = null;
  private scenarioId: string = 'vendor-pricing-negotiation';
  private mode: 'simulation' | 'practice' = 'simulation';
  private maxRounds: number = 10;
  private currentTurnIndex: number = 0;
  private timer: number | null = null;
  private isPaused: boolean = false;
  private speedMultiplier: number = 1; // 1x = 3500ms, 2x = 1800ms, 5x = 700ms
  private callbacks: SocketCallbacks = {};
  private scriptedTurns: ScriptedTurn[] = [];

  // Practice state
  private humanRound: number = 1;
  private humanOffersHistory: number[] = [];

  public connect(
    sessionId: string,
    scenarioId: string,
    mode: 'simulation' | 'practice',
    maxRounds: number,
    callbacks: SocketCallbacks
  ) {
    this.sessionId = sessionId;
    this.scenarioId = scenarioId;
    this.mode = mode;
    this.maxRounds = maxRounds;
    this.callbacks = callbacks;
    this.currentTurnIndex = 0;
    this.isPaused = false;
    this.humanRound = 1;
    this.humanOffersHistory = [];

    this.scriptedTurns = SCRIPTED_SIMULATIONS[scenarioId] || SCRIPTED_SIMULATIONS['vendor-pricing-negotiation'];

    this.callbacks.onStatusChange?.('in_progress');

    if (this.mode === 'simulation') {
      this.scheduleNextSimulationTurn(800);
    } else {
      // In practice mode, trigger initial AI greeting/opening
      this.triggerInitialPracticeTurn();
    }
  }

  public disconnect() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.sessionId = null;
    this.callbacks = {};
  }

  public pause() {
    this.isPaused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.callbacks.onStatusChange?.('paused');
  }

  public resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.callbacks.onStatusChange?.('in_progress');
    if (this.mode === 'simulation') {
      this.scheduleNextSimulationTurn(500);
    }
  }

  public setSpeed(multiplier: number) {
    this.speedMultiplier = multiplier;
  }

  public step() {
    if (this.mode === 'simulation') {
      this.executeSimulationTurn();
    }
  }

  public triggerDeadlock() {
    const deadlockState: DeadlockState = {
      isDeadlock: true,
      round: Math.min(this.currentTurnIndex + 1, this.maxRounds),
      reason: 'Agents have entered an impasse with zero concession velocity over consecutive rounds.',
      repeatedPositions: [
        'Vendor Agent holding firm at $48,000 baseline with no additional SLA tiers',
        'Buyer Agent unwilling to move beyond $43,000 fiscal limit'
      ],
      offerGap: '$5,000',
      resolutionStrategy: 'Reframing'
    };
    this.callbacks.onDeadlock?.(deadlockState);
    this.callbacks.onStatusChange?.('deadlock');
    this.pause();
  }

  public resolveDeadlock(strategy: 'Reframing' | 'Additional Information' | 'Strategy Adjustment' | 'Speaker Change') {
    this.isPaused = false;
    this.callbacks.onStatusChange?.('in_progress');

    // Emit resolution announcement message
    const resumeMessage: NegotiationMessage = {
      id: `sys-res-${Date.now()}`,
      sessionId: this.sessionId || 'sim',
      round: this.currentTurnIndex + 1,
      agentId: 'system-orchestrator',
      agentName: 'Orchestrator Agent',
      agentRole: 'Mediation',
      content: `Deadlock resolution strategy [${strategy}] applied. Introducing multi-variable trade options to bridge the gap.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      decisionSummary: `Applied ${strategy} to realign party utility curves.`,
    };
    this.callbacks.onMessage?.(resumeMessage);

    this.scheduleNextSimulationTurn(1500);
  }

  // Handle Practice Mode Human Submission
  public sendHumanMessage(content: string, offer?: NegotiationOffer) {
    if (this.mode !== 'practice') return;

    const round = this.humanRound;
    const humanMsg: NegotiationMessage = {
      id: `msg-human-${Date.now()}`,
      sessionId: this.sessionId || 'prac',
      round,
      agentId: 'human-user',
      agentName: 'You (Human Negotiator)',
      agentRole: this.scenarioId === 'job-offer-negotiation' ? 'Candidate' : 'Buyer',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      offer,
      isHuman: true,
    };

    this.callbacks.onMessage?.(humanMsg);

    // Provide immediate dynamic coaching tip
    this.generateCoachingTip(content, offer);

    // AI Counterpart starts thinking
    const aiAgentId = this.scenarioId === 'job-offer-negotiation' ? 'recruiter-agent' : 'vendor-agent';
    this.callbacks.onAgentStatus?.(aiAgentId, 'thinking');

    // Simulate AI response delay
    const delay = Math.max(1200 / this.speedMultiplier, 600);
    setTimeout(() => {
      this.generateAIResponse(round, offer);
      this.humanRound += 1;
    }, delay);
  }

  private scheduleNextSimulationTurn(customDelay?: number) {
    if (this.isPaused || this.currentTurnIndex >= this.scriptedTurns.length) {
      if (this.currentTurnIndex >= this.scriptedTurns.length) {
        this.callbacks.onStatusChange?.('completed');
      }
      return;
    }

    const baseDelay = customDelay ?? Math.round(3500 / this.speedMultiplier);
    this.timer = window.setTimeout(() => {
      this.executeSimulationTurn();
    }, baseDelay);
  }

  private executeSimulationTurn() {
    if (this.currentTurnIndex >= this.scriptedTurns.length) {
      this.callbacks.onStatusChange?.('completed');
      return;
    }

    const turn = this.scriptedTurns[this.currentTurnIndex];

    // Mark current agent as speaking
    this.callbacks.onAgentStatus?.(turn.agentId, 'speaking', turn.offerValue);

    // Build message
    const msg: NegotiationMessage = {
      id: `msg-turn-${this.currentTurnIndex + 1}-${Date.now()}`,
      sessionId: this.sessionId || 'sim',
      round: turn.round,
      agentId: turn.agentId,
      agentName: turn.agentName,
      agentRole: turn.agentRole,
      content: turn.content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      offer: {
        value: turn.offerValue,
        type: turn.offerType,
        numericValue: turn.numericValue,
      },
      decisionSummary: turn.decisionSummary,
    };

    this.callbacks.onMessage?.(msg);

    // Update telemetry
    const concessionTrend = this.scriptedTurns
      .slice(0, this.currentTurnIndex + 1)
      .map((t) => ({
        round: t.round,
        [t.agentName]: t.numericValue,
      }));

    this.callbacks.onTelemetry?.({
      round: turn.round,
      agreementLikelihood: turn.agreementLikelihood,
      offerGap: turn.offerGap,
      bestOffer: turn.offerValue,
      target: turn.numericValue.toLocaleString(),
      concessionTrend,
    });

    // Check triggers
    if (turn.isAgreementTrigger) {
      const agreement: AgreementState = {
        isAgreed: true,
        round: turn.round,
        finalTerms: [
          { term: 'Agreed Valuation / Cost', value: turn.offerValue },
          { term: 'Service & SLA Standard', value: 'Full Compliance with Baseline SLA' },
          { term: 'Settlement Terms', value: 'Approved & Signed by All Participating Agents' }
        ],
        summary: `Mutual agreement finalized in Round ${turn.round} with 100% policy compliance.`
      };
      this.callbacks.onAgreement?.(agreement);
      this.callbacks.onStatusChange?.('agreement');
      this.currentTurnIndex++;
      return;
    }

    this.currentTurnIndex++;

    // Switch status to waiting for the next turn
    setTimeout(() => {
      this.callbacks.onAgentStatus?.(turn.agentId, 'waiting');
    }, 1000 / this.speedMultiplier);

    this.scheduleNextSimulationTurn();
  }

  private triggerInitialPracticeTurn() {
    const isJob = this.scenarioId === 'job-offer-negotiation';
    const aiAgentId = isJob ? 'recruiter-agent' : 'vendor-agent';
    const aiName = isJob ? 'Recruiter Agent' : 'Vendor Agent';
    const aiRole = isJob ? 'Recruiter' : 'Seller';

    const openingContent = isJob
      ? 'Welcome! We were thrilled with your interview performance. We are pleased to extend an opening offer of $142,000 base salary with standard benefits. How does this sound?'
      : 'Hello! Thank you for considering our software solutions. For your 120-seat team requirement, our standard annual enterprise contract is $52,000 with Tier-1 SLA. What are your thoughts on this starting point?';

    const openingOfferVal = isJob ? '$142,000' : '$52,000';

    this.callbacks.onAgentStatus?.(aiAgentId, 'speaking', openingOfferVal);

    const initialMsg: NegotiationMessage = {
      id: `msg-prac-open-${Date.now()}`,
      sessionId: this.sessionId || 'prac',
      round: 1,
      agentId: aiAgentId,
      agentName: aiName,
      agentRole: aiRole,
      content: openingContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      offer: {
        value: openingOfferVal,
        type: 'offer',
      },
      decisionSummary: 'Presented standardized baseline opening offer.',
    };

    setTimeout(() => {
      this.callbacks.onMessage?.(initialMsg);
      this.callbacks.onAgentStatus?.(aiAgentId, 'waiting');
      this.callbacks.onTelemetry?.({
        round: 1,
        agreementLikelihood: 35,
        offerGap: isJob ? '$23,000' : '$12,000',
        bestOffer: openingOfferVal,
        target: isJob ? '$160,000' : '$44,000',
        concessionTrend: [{ round: 1, [aiName]: isJob ? 142000 : 52000 }]
      });
    }, 500);
  }

  private generateCoachingTip(content: string, offer?: NegotiationOffer) {
    const tips: string[] = [
      'Strong rationale provided. Linking your counteroffer to objective metrics or scope strengthens your anchor.',
      'Consider requesting non-monetary value items (e.g. training, faster SLAs, flexible terms) to expand the pie.',
      'Good concession control. Small, incremental movements prevent giving away value prematurely.',
      'Active listening tip: Acknowledge the counterpart\'s constraints before proposing your counter-condition.'
    ];

    let selectedTip = tips[Math.floor(Math.random() * tips.length)];
    if (offer && offer.value) {
      selectedTip = `You made a formal move to ${offer.value}. Ensure you defend this number with business value before making another concession.`;
    }

    const tipObj: CoachingTip = {
      id: `tip-${Date.now()}`,
      type: 'strategy',
      message: selectedTip,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.callbacks.onCoachTip?.(tipObj);

    // Update human metrics scores
    this.callbacks.onHumanMetrics?.({
      concessionControl: Math.min(85 + this.humanRound * 2, 95),
      argumentStrength: Math.min(78 + Math.floor(content.length / 10), 92),
      activeListening: 84,
      dealProgress: Math.min(30 + this.humanRound * 22, 98),
    });
  }

  private generateAIResponse(round: number, userOffer?: NegotiationOffer) {
    const isJob = this.scenarioId === 'job-offer-negotiation';
    const aiAgentId = isJob ? 'recruiter-agent' : 'vendor-agent';
    const aiName = isJob ? 'Recruiter Agent' : 'Vendor Agent';
    const aiRole = isJob ? 'Recruiter' : 'Seller';

    let aiContent = '';
    let aiOfferVal = '';
    let isAgreed = false;

    if (round >= 3 || (userOffer && userOffer.numericValue && userOffer.numericValue >= 155000 && isJob)) {
      isAgreed = true;
      aiOfferVal = isJob ? '$156,000' : '$45,500';
      aiContent = isJob
        ? 'We reviewed with our executive team. We are excited to meet you at $156,000 base salary with 2 days hybrid flexibility. We would be delighted to have you join the team!'
        : 'Your proposal meets our core margin requirements with the agreed onboarding terms. We accept at $45,500 annually. We look forward to a great partnership!';
    } else {
      aiOfferVal = isJob ? '$149,000' : '$48,000';
      aiContent = isJob
        ? `We appreciate your perspective. Our standard band is tightly regulated, but we can increase the base to ${aiOfferVal} and offer a $5,000 signing bonus. Does this move us closer?`
        : `We hear your budget constraints. If we keep standard Net 30 payment terms, we can adjust our position down to ${aiOfferVal} with full Tier-1 support included.`;
    }

    const aiMsg: NegotiationMessage = {
      id: `msg-ai-${Date.now()}`,
      sessionId: this.sessionId || 'prac',
      round,
      agentId: aiAgentId,
      agentName: aiName,
      agentRole: aiRole,
      content: aiContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      offer: {
        value: aiOfferVal,
        type: isAgreed ? 'final' : 'counteroffer',
      },
      decisionSummary: isAgreed
        ? 'Accepted terms within viable utility envelope.'
        : 'Made structured counteroffer with non-price value adjustments.',
    };

    this.callbacks.onMessage?.(aiMsg);
    this.callbacks.onAgentStatus?.(aiAgentId, 'waiting', aiOfferVal);

    this.callbacks.onTelemetry?.({
      round,
      agreementLikelihood: isAgreed ? 100 : Math.min(45 + round * 20, 85),
      offerGap: isAgreed ? '$0' : '$3,500',
      bestOffer: aiOfferVal,
      target: isJob ? '$158,000' : '$45,000',
      concessionTrend: [
        { round: 1, [aiName]: isJob ? 142000 : 52000, You: isJob ? 165000 : 40000 },
        { round: round, [aiName]: isJob ? 149000 : 48000, You: isJob ? 158000 : 44000 }
      ]
    });

    if (isAgreed) {
      const agreement: AgreementState = {
        isAgreed: true,
        round,
        finalTerms: [
          { term: 'Final Agreed Valuation', value: aiOfferVal },
          { term: 'Negotiation Outcome', value: 'Successfully Closed with High Satisfaction' }
        ],
        summary: `Practice session successfully finalized in Round ${round}.`
      };
      this.callbacks.onAgreement?.(agreement);
      this.callbacks.onStatusChange?.('agreement');
    }
  }
}

export const negotiationSocket = new NegotiationSocketService();
