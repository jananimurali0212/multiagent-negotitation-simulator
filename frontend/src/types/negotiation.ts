export type Personality = 'Aggressive' | 'Collaborative' | 'Risk-Averse';

export type NegotiationMode = 'simulation' | 'practice';

export type NegotiationStatus =
  | 'idle'
  | 'initializing'
  | 'in_progress'
  | 'paused'
  | 'deadlock'
  | 'agreement'
  | 'completed'
  | 'ended';

export interface Goal {
  id: string;
  description: string;
  priority?: 'High' | 'Medium' | 'Low';
  targetValue?: string;
}

export interface Constraint {
  id: string;
  description: string;
  value?: string; // e.g. "Scenario-defined limit" or specific value
}

export interface NegotiationAgent {
  id: string;
  name: string;
  role: string;
  personality: Personality;
  goal: Goal[];
  constraints: Constraint[];
  currentOffer?: string;
  position?: string;
  status?: 'speaking' | 'waiting' | 'thinking';
  avatarBg?: string;
  avatarText?: string;
}

export interface NegotiationOffer {
  value: string;
  details?: string;
  type: 'offer' | 'counteroffer' | 'concession' | 'final';
  numericValue?: number;
}

export interface NegotiationMessage {
  id: string;
  sessionId: string;
  round: number;
  agentId: string;
  agentName: string;
  agentRole: string;
  content: string;
  timestamp: string;
  offer?: NegotiationOffer;
  decisionSummary?: string; // High-level decision summary (NO hidden chain-of-thought)
  isHuman?: boolean;
}

export interface ConcessionDataPoint {
  round: number;
  [key: string]: number | string; // agent names map to numeric offer values
}

export interface NegotiationTelemetry {
  round: number;
  agreementLikelihood: number; // 0 - 100%
  offerGap: string;
  bestOffer: string;
  target: string;
  concessionTrend: ConcessionDataPoint[];
}

export interface DeadlockState {
  isDeadlock: boolean;
  round: number;
  reason: string;
  repeatedPositions: string[];
  offerGap: string;
  resolutionStrategy?: 'Reframing' | 'Additional Information' | 'Strategy Adjustment' | 'Speaker Change';
}

export interface AgreementState {
  isAgreed: boolean;
  round: number;
  finalTerms: { term: string; value: string }[];
  summary: string;
}

export interface CoachingTip {
  id: string;
  type: 'strategy' | 'concession' | 'risk' | 'strength';
  message: string;
  timestamp: string;
}

export interface HumanPerformanceMetrics {
  concessionControl: number; // 0 - 100
  argumentStrength: number;  // 0 - 100
  activeListening: number;   // 0 - 100
  dealProgress: number;      // 0 - 100
}
