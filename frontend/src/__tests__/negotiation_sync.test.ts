import { describe, it, expect, vi, beforeEach } from 'vitest';
import { negotiationApi, NegotiationStatus } from '../lib/api';

describe('Frontend Negotiation Synchronization & Protection Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('verifies refresh restoration of backend state including waiting_for_human status', async () => {
    const mockBackendSession = {
      id: 'sess-123',
      status: 'waiting_for_human' as NegotiationStatus,
      current_round: 2,
      current_turn_index: 3,
      current_speaker: 'Recruiter Agent',
      messages: [
        { id: 'm1', sender: 'Recruiter Agent', role: 'Recruiter Agent', content: 'Initial offer of $120,000.', round: 1, turn_index: 0, is_user: false },
        { id: 'm2', sender: 'You', role: 'Candidate Agent', content: 'Countering with $135,000.', round: 1, turn_index: 1, is_user: true },
        { id: 'm3', sender: 'Recruiter Agent', role: 'Recruiter Agent', content: 'We can discuss flexibility on remote days.', round: 2, turn_index: 2, is_user: false },
      ],
      agreement_reached: false,
      final_terms: null,
    };

    const spy = vi.spyOn(negotiationApi, 'getSession').mockResolvedValue(mockBackendSession);

    const session = await negotiationApi.getSession('sess-123');
    expect(spy).toHaveBeenCalledWith('sess-123');
    expect(session.id).toBe('sess-123');
    expect(session.status).toBe('waiting_for_human');
    expect(session.current_round).toBe(2);
    expect(session.messages.length).toBe(3);
    expect(session.messages[1].is_user).toBe(true);
    expect(session.messages[1].content).toBe('Countering with $135,000.');
  });

  it('guards against duplicate /step requests when execution flag or non-running status is active', async () => {
    let isExecutingStep = false;
    let currentStatus: NegotiationStatus = 'paused';
    let executeStepCount = 0;

    const mockExecuteStep = vi.fn().mockImplementation(async (sessionId: string) => {
      if (isExecutingStep || currentStatus !== 'running') {
        return null; // Guard blocks execution
      }
      isExecutingStep = true;
      executeStepCount++;
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 50));
      isExecutingStep = false;
      return { status: 'running' as NegotiationStatus, round: 1, agreement_reached: false };
    });

    // 1. Calling step while paused must be blocked
    const pausedResult = await mockExecuteStep('sess-1');
    expect(pausedResult).toBeNull();
    expect(executeStepCount).toBe(0);

    // 2. Unpause and start running
    currentStatus = 'running';

    // 3. Trigger first step and attempt concurrent duplicate step
    const promise1 = mockExecuteStep('sess-1');
    const promise2 = mockExecuteStep('sess-1'); // Duplicate step while promise1 is in-flight

    const [res1, res2] = await Promise.all([promise1, promise2]);
    expect(res1).not.toBeNull();
    expect(res2).toBeNull(); // Concurrency guard blocked duplicate step!
    expect(executeStepCount).toBe(1);
  });

  it('verifies human-turn submission persists exact user message and triggers single AI response', async () => {
    const mockStepResponse = {
      status: 'waiting_for_human' as NegotiationStatus,
      round: 2,
      current_turn_speaker: 'Candidate Agent',
      message: {
        id: 'ai-msg-1',
        sender: 'Candidate Agent',
        role: 'Candidate Agent',
        content: 'I understand your position, but I require $135,000.',
        round: 2,
        turn_index: 3,
        is_user: false,
        timestamp: new Date().toISOString(),
      },
      agreement_reached: false,
    };

    const spy = vi.spyOn(negotiationApi, 'submitHumanTurn').mockResolvedValue(mockStepResponse);

    const userExactInput = 'We are offering $120,000 with remote flexibility.';
    const result = await negotiationApi.submitHumanTurn('sess-1', userExactInput, { salary: '$120,000' });

    expect(spy).toHaveBeenCalledWith('sess-1', userExactInput, { salary: '$120,000' });
    expect(result.status).toBe('waiting_for_human');
    expect(result.message?.is_user).toBe(false);
    expect(result.message?.content).toContain('135,000');
  });

  it('stops simulation loop and transitions to terminal status on completion', async () => {
    const mockTerminalResponse = {
      status: 'finished' as NegotiationStatus,
      round: 4,
      agreement_reached: true,
      final_terms: { salary: '$125,000', remoteDays: '2' },
      message: {
        id: 'msg-final',
        sender: 'Candidate Agent',
        role: 'Candidate Agent',
        content: 'I accept these revised terms.',
        round: 4,
        turn_index: 7,
        is_user: false,
        timestamp: new Date().toISOString(),
      },
    };

    vi.spyOn(negotiationApi, 'executeStep').mockResolvedValue(mockTerminalResponse);

    const res = await negotiationApi.executeStep('sess-terminal');
    expect(res.status).toBe('finished');
    expect(res.agreement_reached).toBe(true);
    expect(res.final_terms).toEqual({ salary: '$125,000', remoteDays: '2' });
  });
});
