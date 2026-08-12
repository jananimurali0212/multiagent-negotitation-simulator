import { NegotiationMode, NegotiationStatus, Personality, ConcessionDataPoint } from './negotiation';

export interface FinalTerm {
  label: string;
  value: string;
}

export interface AgentPerformanceMetric {
  agentId: string;
  agentName: string;
  role: string;
  personality: Personality;
  objectiveSatisfaction: number; // 0 - 100%
  concessionControl: number;      // 0 - 100%
  finalPosition: string;
}

export interface OutcomeReport {
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  mode: NegotiationMode;
  status: NegotiationStatus;
  roundsElapsed: number;
  maxRounds: number;
  duration: string;
  createdAt: string;
  agreementSummary: string;
  finalTerms: FinalTerm[];
  concessionHistory: ConcessionDataPoint[];
  agentPerformance: AgentPerformanceMetric[];
  keyInsights: string[];
}

export interface AgreementTrendItem {
  date: string;
  rate: number;
  count: number;
}

export interface OutcomeBreakdownItem {
  name: string;
  value: number;
  color: string;
}

export interface AgentAggregatePerformance {
  agentName: string;
  role: string;
  totalSessions: number;
  avgSatisfaction: number;
  avgConcessionControl: number;
}

export interface ScenarioAggregatePerformance {
  scenarioName: string;
  count: number;
  agreementRate: number;
  avgRounds: number;
}

export interface AccountAnalytics {
  totalSimulations: number;
  winRate: number;
  averageAgreement: number;
  averageDuration: string;
  agreementTrend: AgreementTrendItem[];
  outcomesBreakdown: OutcomeBreakdownItem[];
  performanceByAgent: AgentAggregatePerformance[];
  scenarioPerformance: ScenarioAggregatePerformance[];
  keyInsights: string[];
  strengths: string[];
  areasToImprove: string[];
}
