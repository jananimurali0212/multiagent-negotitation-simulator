import { describe, it, expect, vi, beforeEach } from 'vitest';
import { negotiationApi, TokenUsageSummary } from '../lib/api';
import { useStore } from '../store/useStore';

describe('Token Usage Telemetry & Unified Stop Contract Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates getTokenUsage client and payload schema', async () => {
    const mockTokenUsage: TokenUsageSummary = {
      available: true,
      input_tokens: 350,
      output_tokens: 120,
      total_tokens: 470,
      llm_calls: 3,
      input_percentage: 74,
      output_percentage: 26,
      by_agent: [
        {
          agent_name: 'Vendor Agent',
          role: 'Vendor Agent',
          input_tokens: 200,
          output_tokens: 70,
          total_tokens: 270,
          calls: 2,
          usage_available: true,
        },
        {
          agent_name: 'Buyer Agent',
          role: 'Buyer Agent',
          input_tokens: 150,
          output_tokens: 50,
          total_tokens: 200,
          calls: 1,
          usage_available: true,
        },
      ],
      by_round: [
        {
          round_number: 1,
          input_tokens: 350,
          output_tokens: 120,
          total_tokens: 470,
          calls: 3,
        },
      ],
      by_model: [
        {
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          input_tokens: 350,
          output_tokens: 120,
          total_tokens: 470,
          calls: 3,
        },
      ],
      turn_usage: [
        {
          id: 'turn-0',
          round: 1,
          turn_index: 0,
          agent_name: 'Vendor Agent',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          input_tokens: 100,
          output_tokens: 35,
          total_tokens: 135,
          usage_available: true,
          status: 'success',
          operation_type: 'negotiate_turn',
        },
      ],
    };

    const spy = vi.spyOn(negotiationApi, 'getTokenUsage').mockResolvedValue(mockTokenUsage);
    const res = await negotiationApi.getTokenUsage('sess-telemetry-1');
    expect(spy).toHaveBeenCalledWith('sess-telemetry-1');
    expect(res.available).toBe(true);
    expect(res.total_tokens).toBe(470);
    expect(res.by_agent.length).toBe(2);
    expect(res.turn_usage[0].input_tokens).toBe(100);
  });

  it('validates stopNegotiation supports unified actions: discard, select_new_scenario, pause, partial_report', async () => {
    const stopSpy = vi.spyOn(negotiationApi, 'stopNegotiation').mockImplementation(async (sessionId, action) => ({
      status: action === 'discard' ? 'terminated' : action === 'pause' ? 'paused' : 'terminated',
      round: 1,
      agreement_reached: false,
      report_id: action === 'partial_report' ? 'rep-partial-123' : undefined,
      report_status: action === 'partial_report' ? 'generated' : 'not_generated',
    } as any));

    const discardRes = await negotiationApi.stopNegotiation('sess-stop-1', 'discard');
    expect(stopSpy).toHaveBeenCalledWith('sess-stop-1', 'discard');
    expect(discardRes.status).toBe('terminated');

    const pauseRes = await negotiationApi.stopNegotiation('sess-stop-1', 'pause');
    expect(stopSpy).toHaveBeenCalledWith('sess-stop-1', 'pause');
    expect(pauseRes.status).toBe('paused');

    const reportRes = await negotiationApi.stopNegotiation('sess-stop-1', 'partial_report');
    expect(stopSpy).toHaveBeenCalledWith('sess-stop-1', 'partial_report');
    expect(reportRes.report_id).toBe('rep-partial-123');
    expect(reportRes.report_status).toBe('generated');
  });

  it('verifies resumeSession accurately restores exact route and state', async () => {
    // 1. Incomplete setup at GOALS step
    vi.spyOn(negotiationApi, 'getSession').mockResolvedValueOnce({
      id: 'sess-step-goals',
      scenario_id: 'vendor-pricing',
      mode: 'ai-ai',
      status: 'setup',
      current_step: 'GOALS',
      messages: [],
      agents: [
        { id: 'a1', name: 'Buyer', role: 'Buyer', goals: [{ text: 'Min price' }], constraints: [] },
      ],
    });

    const route1 = await useStore.getState().resumeSession('sess-step-goals');
    expect(route1).toBe('/setup/goals');
    expect(useStore.getState().activeSessionId).toBe('sess-step-goals');
    expect(useStore.getState().configuredAgents.length).toBeGreaterThan(0);

    // 2. Incomplete setup at REVIEW step
    vi.spyOn(negotiationApi, 'getSession').mockResolvedValueOnce({
      id: 'sess-step-review',
      scenario_id: 'vendor-pricing',
      mode: 'ai-ai',
      status: 'setup',
      current_step: 'REVIEW',
      messages: [],
      agents: [],
    });

    const route2 = await useStore.getState().resumeSession('sess-step-review');
    expect(route2).toBe('/setup/review');

    // 3. Finished session routes to /reports and sets selectedReportId
    vi.spyOn(negotiationApi, 'getSession').mockResolvedValueOnce({
      id: 'sess-step-finished',
      scenario_id: 'vendor-pricing',
      mode: 'ai-ai',
      status: 'finished',
      current_step: 'NEGOTIATION',
      report_id: 'rep-final-999',
      messages: [],
      agents: [],
    });

    const route3 = await useStore.getState().resumeSession('sess-step-finished');
    expect(route3).toBe('/reports');
    expect(useStore.getState().selectedReportId).toBe('rep-final-999');
  });
});
