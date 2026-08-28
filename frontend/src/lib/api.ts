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

export type NegotiationStatus = 'running' | 'finished' | 'deadlock' | 'terminated';

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
  message?: NegotiationMessageResponse | null;
  agreement_reached: boolean;
  final_terms?: Record<string, any>;
  validation_error?: string;
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
    apiRequest<NegotiationStepResponse>(`/negotiations/${sessionId}/user-turn`, {
      method: 'POST',
      body: JSON.stringify({ message: userMessage, offer: userOffer || {} }),
    }),
  getSession: (sessionId: string) =>
    apiRequest<any>(`/negotiations/${sessionId}`),
  listSessions: () =>
    apiRequest<any[]>('/negotiations'),
};

// Dashboard API
export interface DashboardSummary {
  total_negotiations: number;
  agreements_reached: number;
  deadlocks_detected: number;
  reports_generated: number;
  current_negotiations: Array<{
    id: string;
    scenario_id: string;
    mode: string;
    status: string;
    current_round: number;
    max_rounds: number;
    updated_at?: string;
  }>;
  recent_negotiations: Array<{
    id: string;
    session_id: string;
    scenario_id: string;
    scenario_title: string;
    mode: string;
    outcome: string;
    rounds_completed: number;
    created_at?: string;
  }>;
}

export const dashboardApi = {
  getSummary: () => apiRequest<DashboardSummary>('/dashboard/summary'),
};

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
    agreementRate?: number;
    avgRounds?: number;
    utilityScore?: number;
    concessionRate?: number;
    [key: string]: any;
  };
  summary: string;
  recommendations: string;
  created_at: string;
}

export const reportApi = {
  list: () => apiRequest<OutcomeReport[]>('/reports'),
  get: (reportId: string) => apiRequest<OutcomeReport>(`/reports/${reportId}`),
};
