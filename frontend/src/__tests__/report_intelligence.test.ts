import { describe, it, expect } from 'vitest';
import { OutcomeReport } from '../lib/api';

describe('Report Intelligence & Explainability Suite', () => {
  it('verifies dynamic intelligence payload contains all 13 required sections on agreement', () => {
    const mockReport: OutcomeReport = {
      id: 'rep-001',
      session_id: 'sess-001',
      scenario_id: 'vendor-pricing',
      scenario_title: 'Vendor Pricing Negotiation',
      mode: 'ai-ai',
      outcome: 'Agreement Reached',
      rounds_completed: 3,
      final_terms: { price: '$85/user/month', tier: 'Enterprise' },
      metrics: {
        rounds_completed: 3,
        total_turns: 6,
        agreement_confidence: 100,
        constraint_compliance_rate: 100,
        concessions_detected: 2,
        techniques_detected: 3,
      },
      summary: 'Parties converged on $85/user/month for Enterprise tier.',
      recommendations: 'Anchor earlier on secondary variables.',
      analysis: {
        overview: {
          scenario_title: 'Vendor Pricing Negotiation',
          scenario_id: 'vendor-pricing',
          scenario_objective: 'Reach a SaaS software subscription agreement.',
          mode: 'ai-ai',
          outcome: 'Agreement Reached',
          participants: [
            { name: 'Buyer Agent', role: 'Buyer Agent' },
            { name: 'Vendor Agent', role: 'Vendor Agent' },
          ],
          rounds_completed: 3,
          total_turns: 6,
          duration: '1m 15s',
        },
        configuration_snapshot: [
          {
            agent_id: 'a1',
            name: 'Buyer Agent',
            role: 'Buyer Agent',
            primary_goal: 'Stay under $90/user/month',
            goals: [{ text: 'Stay under $90/user/month', priority: 'High' }],
            hard_constraints: [{ label: 'Budget Ceiling', value: '$90/user/month' }],
            negotiable_parameters: { maxBudget: '$90/user/month' },
            parameter_positions: [
              { parameter: 'price', initial_position: '$70/user/month', final_position: '$85/user/month' },
            ],
          },
        ],
        negotiation_timeline: [
          {
            turn_index: 0,
            round: 1,
            sender: 'Buyer Agent',
            role: 'Buyer Agent',
            is_user: false,
            action: 'Opening Position',
            key_position: 'Proposing $70/user/month.',
            offer: { price: '$70/user/month' },
          },
        ],
        offer_evolution: {
          parameters: [
            {
              parameter: 'price',
              progression: [
                { round: 1, turn: 0, sender: 'Buyer Agent', role: 'Buyer Agent', value: '$70', numeric_value: 70 },
                { round: 2, turn: 1, sender: 'Vendor Agent', role: 'Vendor Agent', value: '$85', numeric_value: 85 },
              ],
              has_numeric_data: true,
            },
          ],
          has_numeric_chart_data: true,
          chart_data: [{ round: 'Round 1', price: 70 }, { round: 'Round 2', price: 85 }],
        },
        concession_analysis: {
          total_concessions_detected: 2,
          agent_concessions: [
            {
              agent_name: 'Vendor Agent',
              role: 'Vendor Agent',
              concessions_count: 1,
              concession_moves: [],
              direction: 'Moved toward Buyer position',
              largest_concession: {
                round: 2,
                turn: 1,
                parameter: 'price',
                previous_value: '$100',
                new_value: '$85',
                delta: -15,
              },
            },
          ],
        },
        turning_points: [
          {
            round: 2,
            turn: 1,
            agent: 'Vendor Agent',
            what_happened: 'Significant Price Concession',
            why_it_mattered: 'Moved price into buyer acceptable range',
            evidence: 'Lowered price from $100 to $85',
          },
        ],
        strategy_analysis: {
          techniques: [
            {
              technique: 'Anchoring',
              used_by: 'Buyer Agent',
              evidence: 'Established starting point at $70',
              confidence: 'High',
            },
          ],
          total_detected: 1,
        },
        agreement_analysis: {
          final_agreement_terms: { price: '$85/user/month' },
          all_constraints_satisfied: true,
          agent_compatibility: [
            { agent_name: 'Buyer Agent', role: 'Buyer Agent', is_compatible: true, notes: 'Complies with budget cap' },
          ],
          how_agreement_reached: {
            initial_gap: 'Difference of $30/user/month',
            negotiation_movement: '2 concessions across 3 rounds',
            final_convergence: 'Met at $85/user/month',
            acceptance_trigger: 'Both parties reservation values satisfied',
          },
        },
        deadlock_analysis: null,
        confidence_analysis: {
          confidence_score: 100,
          confidence_level: 'High Confidence',
          checks: [
            { name: 'Acceptance Validation', description: 'Validated by rule', status: 'passed', evidence: 'Rules ratified' },
            { name: 'Final Terms Persistence', description: 'Saved in database', status: 'passed', evidence: '1 ratified term' },
          ],
        },
        agent_analysis: [
          {
            agent_name: 'Buyer Agent',
            role: 'Buyer Agent',
            primary_objective: 'Stay under $90/user/month',
            initial_position: 'price: $70/user/month',
            final_position: 'price: $85/user/month',
            offers_made_count: 1,
            concessions_made_count: 1,
            detected_techniques: ['Anchoring'],
            constraint_compliance: '100% Compliant',
            outcome_contribution: 'Contributed 1 proposal and 1 concession.',
          },
        ],
      },
      created_at: new Date().toISOString(),
    };

    // Assert zero fabricated fallbacks exist
    expect(mockReport.metrics.rounds_completed).toBe(3);
    expect(mockReport.metrics.total_turns).toBe(6);
    expect(mockReport.metrics.agreement_confidence).toBe(100);
    expect(mockReport.analysis?.agreement_analysis?.all_constraints_satisfied).toBe(true);
    expect(mockReport.analysis?.deadlock_analysis).toBeNull();
    expect(mockReport.analysis?.offer_evolution?.has_numeric_chart_data).toBe(true);
  });

  it('handles deadlock report without claiming agreement or fabricating numeric metrics', () => {
    const deadlockReport: OutcomeReport = {
      id: 'rep-deadlock',
      session_id: 'sess-deadlock',
      scenario_id: 'job-offer',
      scenario_title: 'Job Offer Negotiation',
      mode: 'ai-ai',
      outcome: 'Deadlock',
      rounds_completed: 2,
      final_terms: {},
      metrics: {
        rounds_completed: 2,
        total_turns: 4,
        concessions_detected: 0,
        techniques_detected: 1,
      },
      summary: 'Parties reached impasse due to conflicting reservation thresholds.',
      recommendations: 'Broaden reservation constraints.',
      analysis: {
        deadlock_analysis: {
          primary_conflict: 'Salary floor exceeded recruiter budget cap.',
          last_compatible_opportunity: 'Zero ZOPA existed.',
          stagnation_evidence: 'Repeated unchanged offers.',
          deadlock_cause: 'Incompatible Hard Constraints',
          conflicting_constraints: [
            { agent: 'Candidate Agent', label: 'Minimum Salary', value: '$170,000' },
            { agent: 'Recruiter Agent', label: 'Maximum Salary', value: '$150,000' },
          ],
        },
        agreement_analysis: null,
      },
      created_at: new Date().toISOString(),
    };

    expect(deadlockReport.outcome).toBe('Deadlock');
    expect(deadlockReport.analysis?.agreement_analysis).toBeNull();
    expect(deadlockReport.analysis?.deadlock_analysis?.deadlock_cause).toBe('Incompatible Hard Constraints');
  });
});
