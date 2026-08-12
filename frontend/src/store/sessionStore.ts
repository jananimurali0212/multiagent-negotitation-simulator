import { create } from 'zustand';
import {
  NegotiationMode,
  NegotiationStatus,
  NegotiationMessage,
  NegotiationTelemetry,
  DeadlockState,
  AgreementState,
  CoachingTip,
  HumanPerformanceMetrics,
  NegotiationAgent
} from '../types/negotiation';

interface SessionState {
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  mode: NegotiationMode;
  status: NegotiationStatus;
  currentRound: number;
  maxRounds: number;
  objective: string;
  messages: NegotiationMessage[];
  agents: NegotiationAgent[];
  telemetry: NegotiationTelemetry;
  deadlockState: DeadlockState | null;
  agreementState: AgreementState | null;
  coachingTips: CoachingTip[];
  humanMetrics: HumanPerformanceMetrics;
  elapsedSeconds: number;

  initSession: (params: {
    sessionId: string;
    scenarioId: string;
    scenarioName: string;
    mode: NegotiationMode;
    maxRounds: number;
    objective: string;
    agents: NegotiationAgent[];
  }) => void;
  addMessage: (message: NegotiationMessage) => void;
  setTelemetry: (telemetry: NegotiationTelemetry) => void;
  setStatus: (status: NegotiationStatus) => void;
  setAgentStatus: (agentId: string, status: 'speaking' | 'waiting' | 'thinking', currentOffer?: string) => void;
  setDeadlock: (deadlock: DeadlockState | null) => void;
  setAgreement: (agreement: AgreementState | null) => void;
  addCoachTip: (tip: CoachingTip) => void;
  setHumanMetrics: (metrics: Partial<HumanPerformanceMetrics>) => void;
  incrementTimer: () => void;
  resetSession: () => void;
}

const INITIAL_TELEMETRY: NegotiationTelemetry = {
  round: 1,
  agreementLikelihood: 30,
  offerGap: 'Pending',
  bestOffer: 'Evaluating...',
  target: 'Establishing Baseline',
  concessionTrend: [],
};

const INITIAL_HUMAN_METRICS: HumanPerformanceMetrics = {
  concessionControl: 85,
  argumentStrength: 80,
  activeListening: 85,
  dealProgress: 25,
};

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: '',
  scenarioId: '',
  scenarioName: '',
  mode: 'simulation',
  status: 'idle',
  currentRound: 1,
  maxRounds: 10,
  objective: '',
  messages: [],
  agents: [],
  telemetry: INITIAL_TELEMETRY,
  deadlockState: null,
  agreementState: null,
  coachingTips: [],
  humanMetrics: INITIAL_HUMAN_METRICS,
  elapsedSeconds: 0,

  initSession: (params) => {
    set({
      sessionId: params.sessionId,
      scenarioId: params.scenarioId,
      scenarioName: params.scenarioName,
      mode: params.mode,
      status: 'initializing',
      currentRound: 1,
      maxRounds: params.maxRounds,
      objective: params.objective,
      agents: params.agents.map((a) => ({ ...a, status: 'waiting' })),
      messages: [],
      telemetry: INITIAL_TELEMETRY,
      deadlockState: null,
      agreementState: null,
      coachingTips: [],
      humanMetrics: INITIAL_HUMAN_METRICS,
      elapsedSeconds: 0,
    });
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      currentRound: message.round > state.currentRound ? message.round : state.currentRound,
    }));
  },

  setTelemetry: (telemetry) => {
    set({ telemetry });
  },

  setStatus: (status) => {
    set({ status });
  },

  setAgentStatus: (agentId, status, currentOffer) => {
    set((state) => ({
      agents: state.agents.map((a) => {
        if (a.id === agentId) {
          return {
            ...a,
            status,
            currentOffer: currentOffer !== undefined ? currentOffer : a.currentOffer,
          };
        }
        // If one agent is speaking, others should be waiting
        if (status === 'speaking' && a.status === 'speaking') {
          return { ...a, status: 'waiting' };
        }
        return a;
      }),
    }));
  },

  setDeadlock: (deadlockState) => {
    set({ deadlockState });
  },

  setAgreement: (agreementState) => {
    set({ agreementState });
  },

  addCoachTip: (tip) => {
    set((state) => ({
      coachingTips: [tip, ...state.coachingTips].slice(0, 10),
    }));
  },

  setHumanMetrics: (metrics) => {
    set((state) => ({
      humanMetrics: { ...state.humanMetrics, ...metrics },
    }));
  },

  incrementTimer: () => {
    set((state) => ({
      elapsedSeconds: state.elapsedSeconds + 1,
    }));
  },

  resetSession: () => {
    set({
      sessionId: '',
      scenarioId: '',
      scenarioName: '',
      mode: 'simulation',
      status: 'idle',
      currentRound: 1,
      maxRounds: 10,
      objective: '',
      messages: [],
      agents: [],
      telemetry: INITIAL_TELEMETRY,
      deadlockState: null,
      agreementState: null,
      coachingTips: [],
      humanMetrics: INITIAL_HUMAN_METRICS,
      elapsedSeconds: 0,
    });
  }
}));
