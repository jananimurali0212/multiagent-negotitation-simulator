import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders();
  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.detail || data.message || `HTTP ${response.status} error occurred on ${endpoint}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
      const fullUrl = `${API_BASE_URL}${endpoint}`;
      console.error(`[API NETWORK ERROR] Fetch failed for ${options.method || 'GET'} ${fullUrl}`, err);
      throw new Error(
        `Unable to connect to negotiation backend server at ${API_BASE_URL}. Request: ${options.method || 'GET'} ${endpoint}. Possible cause: Backend server unavailable, incorrect API base URL, CORS policy block, or network connection failure. No HTTP response was received.`
      );
    }
    throw err;
  }
}

// Scenarios API
export interface ScenarioDimension {
  dimension: string;
  label: string;
  required: boolean;
}

export interface AgentDefaultData {
  agent_template_id: string;
  name: string;
  role: string;
  avatar: string;
  personality: string;
  experience?: string;
  negotiation_parameters?: Record<string, any>;
  goals: Array<{ text: string; priority: string }>;
  constraints: Array<{ label: string; value: string }>;
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  description: string;
  agent_count: number;
  estimated_duration: string;
  objective: string;
  negotiable_dimensions: ScenarioDimension[];
  default_agents_data: AgentDefaultData[];
}

export const scenarioApi = {
  list: () => apiRequest<Scenario[]>('/scenarios'),
  get: (id: string) => apiRequest<Scenario>(`/scenarios/${id}`),
};

// Negotiations API
export interface NegotiationSetupPayload {
  scenario_id: string;
  mode: 'ai-ai' | 'human-ai';
  human_role?: string;
  agents?: AgentDefaultData[];
}

export type NegotiationStatus =
  | 'setup'
  | 'ready'
  | 'running'
  | 'waiting_for_human'
  | 'paused'
  | 'finished'
  | 'deadlock'
  | 'terminated';

export interface NegotiationMessageResponse {
  id: string;
  sender: string;
  role: string;
  avatar?: string;
  content: string;
  round: number;
  turn_index: number;
  is_user: boolean;
  timestamp: string;
  offer_data?: Record<string, any>;
}

export interface NegotiationStepResponse {
  status: NegotiationStatus;
  round: number;
  current_turn_speaker?: string;
  next_speaker?: string;
  message?: NegotiationMessageResponse | null;
  agreement_reached: boolean;
  final_terms?: Record<string, any>;
  validation_error?: string;
  report_id?: string;
  report_status?: 'not_generated' | 'generating' | 'generated' | 'failed';
}

export type TurnResultResponse = NegotiationStepResponse;

export const negotiationApi = {
  createSession: (payload: NegotiationSetupPayload) =>
    apiRequest<{ id: string; status: string; current_round: number }>('/negotiations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  executeStep: (sessionId: string) =>
    apiRequest<NegotiationStepResponse>(`/negotiations/${sessionId}/step`, {
      method: 'POST',
    }),
  submitUserTurn: (sessionId: string, userMessage: string, userOffer?: Record<string, any>) =>
    apiRequest<NegotiationStepResponse>(`/negotiations/${sessionId}/human-turn`, {
      method: 'POST',
      body: JSON.stringify({ message: userMessage, offer: userOffer || {} }),
    }),
  submitHumanTurn: (sessionId: string, userMessage: string, userOffer?: Record<string, any>) =>
    apiRequest<NegotiationStepResponse>(`/negotiations/${sessionId}/human-turn`, {
      method: 'POST',
      body: JSON.stringify({ message: userMessage, offer: userOffer || {} }),
    }),
  getSession: (sessionId: string) =>
    apiRequest<any>(`/negotiations/${sessionId}`),
  updateAgents: (sessionId: string, agents: any[]) =>
    apiRequest<any>(`/negotiations/${sessionId}/agents`, {
      method: 'PUT',
      body: JSON.stringify({ agents }),
    }),
  updateGoalsConstraints: (sessionId: string, payload: any[]) =>
    apiRequest<any>(`/negotiations/${sessionId}/goals-constraints`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  listSessions: () =>
    apiRequest<any[]>('/negotiations'),
  deleteSession: (sessionId: string) =>
    apiRequest<{ status: string; session_id: string }>(`/negotiations/${sessionId}`, {
      method: 'DELETE',
    }),
  bulkDelete: (sessionIds?: string[], deleteAll: boolean = false) =>
    apiRequest<{ status: string; deleted_count: number }>('/negotiations/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ session_ids: sessionIds, delete_all: deleteAll }),
    }),
  resumeSession: (sessionId: string) =>
    apiRequest<any>(`/negotiations/${sessionId}/resume`, {
      method: 'POST',
    }),
  stopNegotiation: (sessionId: string, action: string = 'stop') =>
    apiRequest<NegotiationStepResponse>(`/negotiations/${sessionId}/stop?action=${action}`, {
      method: 'POST',
    }),
  pauseNegotiation: (sessionId: string) =>
    apiRequest<NegotiationStepResponse>(`/negotiations/${sessionId}/stop?action=pause`, {
      method: 'POST',
    }),
  getTokenUsage: (sessionId: string) =>
    apiRequest<TokenUsageSummary>(`/negotiations/${sessionId}/token-usage`),
};

// Dashboard API
export interface DashboardRecentNegotiation {
  id: string;
  session_id: string;
  scenario_id: string;
  scenario_title: string;
  mode: string;
  status: string;
  outcome: string;
  current_round: number;
  max_rounds: number;
  rounds_completed: number;
  agents?: Array<{ name: string; role: string; avatar: string }>;
  agent_names?: string[];
  report_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardSummary {
  total_negotiations: number;
  agreements_reached: number;
  deadlocks_detected: number;
  reports_generated: number;
  recent_negotiations: DashboardRecentNegotiation[];
}

export const dashboardApi = {
  getSummary: () => apiRequest<DashboardSummary>('/dashboard/summary'),
};

export interface TimelineEvent {
  turn_index: number;
  round: number;
  sender: string;
  role: string;
  is_user: boolean;
  action: string;
  key_position: string;
  offer?: Record<string, any>;
  what_changed?: string | null;
  reason?: string;
  token_usage?: {
    usage_available?: boolean;
    provider?: string;
    model?: string;
    input_tokens?: number | null;
    output_tokens?: number | null;
    total_tokens?: number | null;
    is_human?: boolean;
    label?: string;
  } | null;
}

export interface ParameterProgression {
  parameter: string;
  progression: Array<{
    round: number;
    turn: number;
    sender: string;
    role: string;
    value: string;
    numeric_value?: number | null;
  }>;
  has_numeric_data: boolean;
  reason?: string | null;
}

export interface OfferEvolutionData {
  parameters: ParameterProgression[];
  has_numeric_chart_data: boolean;
  chart_data: Array<Record<string, any>>;
  reason?: string | null;
}

export interface AgentConcessionInfo {
  agent_name: string;
  role: string;
  concessions_count: number;
  concession_moves: Array<{
    round: number;
    turn: number;
    parameter: string;
    previous_value: string;
    new_value: string;
    delta?: number | null;
  }>;
  direction: string;
  largest_concession?: {
    round: number;
    turn: number;
    parameter: string;
    previous_value: string;
    new_value: string;
    delta?: number | null;
  } | null;
  concession_progress?: string | null;
}

export interface ConcessionAnalysisData {
  total_concessions_detected: number;
  agent_concessions: AgentConcessionInfo[];
}

export interface TurningPointEvent {
  round: number;
  turn: number;
  agent: string;
  what_happened: string;
  why_it_mattered: string;
  evidence: string;
}

export interface DetectedTechnique {
  technique: string;
  used_by: string;
  evidence: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface StrategyAnalysisData {
  techniques: DetectedTechnique[];
  total_detected: number;
}

export interface AgentConfigurationSnapshot {
  agent_id: string;
  name: string;
  role: string;
  avatar?: string;
  personality?: string;
  experience?: string;
  primary_goal: string;
  goals: Array<{ text: string; priority: string }>;
  hard_constraints: Array<{ label: string; value: string }>;
  negotiable_parameters: Record<string, any>;
  parameter_positions: Array<{
    parameter: string;
    initial_position: string;
    final_position: string;
  }>;
}

export interface ValidationCheck {
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'not_applicable';
  evidence: string;
}

export interface ConfidenceAnalysisData {
  confidence_score: number | null;
  confidence_level: 'High Confidence' | 'Medium Confidence' | 'Low Confidence';
  checks: ValidationCheck[];
}

export interface AgentScorecard {
  agent_name: string;
  role: string;
  avatar?: string;
  primary_objective: string;
  initial_position: string;
  final_position: string;
  offers_made_count: number;
  concessions_made_count: number;
  detected_techniques: string[];
  constraint_compliance: string;
  outcome_contribution: string;
}

export interface ReportIntelligenceAnalysis {
  overview?: {
    scenario_title: string;
    scenario_id: string;
    scenario_objective: string;
    mode: string;
    outcome: string;
    participants: Array<{ name: string; role: string; avatar?: string }>;
    rounds_completed: number;
    total_turns: number;
    started_at?: string;
    completed_at?: string;
    duration: string;
  };
  configuration_snapshot?: AgentConfigurationSnapshot[];
  negotiation_timeline?: TimelineEvent[];
  offer_evolution?: OfferEvolutionData;
  concession_analysis?: ConcessionAnalysisData;
  turning_points?: TurningPointEvent[];
  strategy_analysis?: StrategyAnalysisData;
  agreement_analysis?: {
    final_agreement_terms: Record<string, any>;
    all_constraints_satisfied: boolean;
    agent_compatibility: Array<{
      agent_name: string;
      role: string;
      is_compatible: boolean;
      notes: string;
    }>;
    how_agreement_reached: {
      initial_gap: string;
      negotiation_movement: string;
      final_convergence: string;
      acceptance_trigger: string;
    };
  } | null;
  deadlock_analysis?: {
    primary_conflict: string;
    last_compatible_opportunity: string;
    stagnation_evidence: string;
    deadlock_cause: string;
    conflicting_constraints: Array<{
      agent: string;
      label: string;
      value: string;
    }>;
  } | null;
  confidence_analysis?: ConfidenceAnalysisData;
  agent_analysis?: AgentScorecard[];
  metrics?: {
    rounds_completed: number;
    total_turns: number;
    agreement_confidence?: number | null;
    constraint_compliance_rate?: number;
    concessions_detected?: number;
    techniques_detected?: number;
    [key: string]: any;
  };
  final_terms?: Record<string, any>;
  summary?: string;
  recommendations?: string;
  token_usage?: TokenUsageSummary;
}

export interface TurnTokenUsage {
  id: string;
  round: number;
  turn_index: number;
  agent_name?: string;
  agent_role?: string;
  provider: string;
  model: string;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  usage_available: boolean;
  status: string;
  operation_type: string;
}

export interface TokenUsageByAgent {
  agent_name: string;
  role: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  calls: number;
  usage_available: boolean;
}

export interface TokenUsageByRound {
  round_number: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  calls: number;
}

export interface TokenUsageByModel {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  calls: number;
}

export interface TokenUsageSummary {
  available: boolean;
  reason?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  total_tokens?: number | null;
  llm_calls: number;
  input_percentage: number;
  output_percentage: number;
  by_agent: TokenUsageByAgent[];
  by_round: TokenUsageByRound[];
  by_model: TokenUsageByModel[];
  turn_usage: TurnTokenUsage[];
}

// Outcome Reports API
export interface OutcomeReport {
  id: string;
  session_id: string;
  scenario_id: string;
  scenario_title: string;
  mode: string;
  outcome: string;
  rounds_completed: number;
  final_terms: Record<string, any>;
  metrics: {
    rounds_completed?: number;
    total_turns?: number;
    agreement_confidence?: number | null;
    constraint_compliance_rate?: number;
    concessions_detected?: number;
    techniques_detected?: number;
    [key: string]: any;
  };
  summary: string;
  recommendations: string;
  analysis?: ReportIntelligenceAnalysis;
  created_at: string;
}

export const reportApi = {
  list: () => apiRequest<OutcomeReport[]>('/reports'),
  get: (reportId: string) => apiRequest<OutcomeReport>(`/reports/${reportId}`),
  getBySession: (sessionId: string) => apiRequest<OutcomeReport>(`/reports/session/${sessionId}`),
  generate: (sessionId: string) =>
    apiRequest<OutcomeReport>(`/reports/session/${sessionId}/generate`, {
      method: 'POST',
    }),
  delete: (reportId: string) =>
    apiRequest<{ status: string; report_id: string }>(`/reports/${reportId}`, {
      method: 'DELETE',
    }),
  bulkDelete: (reportIds?: string[], deleteAll: boolean = false) =>
    apiRequest<{ status: string; deleted_count: number }>('/reports/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ report_ids: reportIds, delete_all: deleteAll }),
    }),
};
