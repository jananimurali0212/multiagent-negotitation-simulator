import { NegotiationMode, NegotiationStatus, NegotiationAgent } from '../types/negotiation';
import { mockPost, mockFetch } from './apiAdapter';
import { RECENT_NEGOTIATIONS, RecentNegotiationItem } from '../data/mockNegotiations';

export interface CreateNegotiationPayload {
  scenarioId: string;
  mode: NegotiationMode;
  agents: NegotiationAgent[];
  maxRounds: number;
}

export interface NegotiationSessionSummary {
  sessionId: string;
  scenarioId: string;
  scenarioName: string;
  mode: NegotiationMode;
  status: NegotiationStatus;
  currentRound: number;
  maxRounds: number;
  startedAt: string;
}

export const negotiationService = {
  async getRecentNegotiations(): Promise<RecentNegotiationItem[]> {
    return mockFetch<RecentNegotiationItem[]>(RECENT_NEGOTIATIONS, 200);
  },

  async createSession(payload: CreateNegotiationPayload): Promise<NegotiationSessionSummary> {
    const sessionId = `${payload.mode === 'simulation' ? 'sim' : 'prac'}-${Date.now().toString().slice(-5)}`;
    const session: NegotiationSessionSummary = {
      sessionId,
      scenarioId: payload.scenarioId,
      scenarioName: payload.scenarioId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      mode: payload.mode,
      status: 'in_progress',
      currentRound: 1,
      maxRounds: payload.maxRounds,
      startedAt: new Date().toISOString(),
    };
    return mockPost<NegotiationSessionSummary>(session, 300);
  },

  async pauseNegotiation(sessionId: string): Promise<{ success: boolean; status: NegotiationStatus }> {
    return mockPost({ success: true, status: 'paused' as NegotiationStatus }, 150);
  },

  async resumeNegotiation(sessionId: string): Promise<{ success: boolean; status: NegotiationStatus }> {
    return mockPost({ success: true, status: 'in_progress' as NegotiationStatus }, 150);
  },

  async endNegotiation(sessionId: string): Promise<{ success: boolean; status: NegotiationStatus }> {
    return mockPost({ success: true, status: 'ended' as NegotiationStatus }, 200);
  }
};
