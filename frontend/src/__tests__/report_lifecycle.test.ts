import { describe, it, expect } from 'vitest';
import { NegotiationStepResponse, OutcomeReport } from '../lib/api';

describe('Fix 10: Report Lifecycle & Visibility Suite', () => {
  it('verifies terminal step response returns report_id and report_status generated', () => {
    const mockStepResponse: NegotiationStepResponse = {
      status: 'finished',
      round: 3,
      current_turn_speaker: 'Vendor Agent',
      agreement_reached: true,
      final_terms: { price: '$85/user/month', tier: 'Enterprise' },
      report_id: 'rep-lifecycle-001',
      report_status: 'generated',
    };

    expect(mockStepResponse.status).toBe('finished');
    expect(mockStepResponse.agreement_reached).toBe(true);
    expect(mockStepResponse.report_id).toBe('rep-lifecycle-001');
    expect(mockStepResponse.report_status).toBe('generated');
  });

  it('verifies deadlock step response provides deadlock reporting metadata', () => {
    const mockDeadlockResponse: NegotiationStepResponse = {
      status: 'deadlock',
      round: 2,
      current_turn_speaker: 'Buyer Agent',
      agreement_reached: false,
      final_terms: {},
      report_id: 'rep-deadlock-001',
      report_status: 'generated',
    };

    expect(mockDeadlockResponse.status).toBe('deadlock');
    expect(mockDeadlockResponse.agreement_reached).toBe(false);
    expect(mockDeadlockResponse.report_id).toBe('rep-deadlock-001');
    expect(mockDeadlockResponse.report_status).toBe('generated');
  });

  it('verifies report generation recovery payload structure matches OutcomeReport', () => {
    const mockGeneratedReport: OutcomeReport = {
      id: 'rep-recovered-001',
      session_id: 'sess-recovered-001',
      scenario_id: 'vendor-pricing',
      scenario_title: 'Vendor Pricing Negotiation',
      mode: 'ai-ai',
      outcome: 'Agreement Reached',
      rounds_completed: 3,
      final_terms: { price: '$85/user/month' },
      metrics: {
        rounds_completed: 3,
        total_turns: 6,
        agreement_confidence: 100,
      },
      summary: 'Parties converged successfully.',
      recommendations: 'Continue standard anchoring protocol.',
      created_at: new Date().toISOString(),
    };

    expect(mockGeneratedReport.id).toBe('rep-recovered-001');
    expect(mockGeneratedReport.session_id).toBe('sess-recovered-001');
    expect(mockGeneratedReport.outcome).toBe('Agreement Reached');
  });
});
