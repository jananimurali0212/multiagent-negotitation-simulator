import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { negotiationSocket } from '../services/negotiationSocket';
import { NegotiationHeader } from '../components/negotiation/NegotiationHeader';
import { AgentStatusCard } from '../components/negotiation/AgentStatusCard';
import { ConversationFeed } from '../components/negotiation/ConversationFeed';
import { NegotiationMetrics } from '../components/negotiation/NegotiationMetrics';
import { SimulationControls } from '../components/negotiation/SimulationControls';
import { DeadlockAlert } from '../components/negotiation/DeadlockAlert';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { CheckCircle2, FileText, ArrowRight, Bot } from 'lucide-react';

export function SimulationArenaPage() {
  const { sessionId = 'sim-demo' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { selectedScenario, maximumRounds, agents: setupAgents } = useNegotiationSetupStore();
  const session = useSessionStore();

  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Initialize session and connect WebSocket simulator
  useEffect(() => {
    const scenario = selectedScenario || {
      id: 'vendor-pricing-negotiation',
      name: 'Vendor Pricing Negotiation',
      objective: 'Reach a mutually agreeable annual contract value and SLA tier.',
      defaultMaxRounds: 10,
    };

    session.initSession({
      sessionId,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      mode: 'simulation',
      maxRounds: maximumRounds || scenario.defaultMaxRounds || 10,
      objective: scenario.objective,
      agents: setupAgents && setupAgents.length > 0 ? setupAgents : [
        {
          id: 'vendor-agent',
          name: 'Vendor Agent',
          role: 'Seller',
          personality: 'Collaborative',
          goal: [{ id: '1', description: 'Maximize price and protect margin.' }],
          constraints: [{ id: '1', description: 'Minimum acceptable margin floor.' }],
          currentOffer: '$52,000',
          position: '$52,000 / year',
          status: 'waiting'
        },
        {
          id: 'buyer-agent',
          name: 'Buyer Agent',
          role: 'Buyer',
          personality: 'Collaborative',
          goal: [{ id: '2', description: 'Minimize annual software licensing cost.' }],
          constraints: [{ id: '2', description: 'Maximum approved fiscal budget.' }],
          currentOffer: '$40,000',
          position: '$40,000 / year',
          status: 'waiting'
        }
      ],
    });

    negotiationSocket.connect(
      sessionId,
      scenario.id,
      'simulation',
      maximumRounds || 10,
      {
        onMessage: (msg) => {
          session.addMessage(msg);
        },
        onTelemetry: (telemetry) => {
          session.setTelemetry(telemetry);
        },
        onStatusChange: (status) => {
          session.setStatus(status);
          if (status === 'agreement' || status === 'completed') {
            setAgreementModalOpen(true);
          }
        },
        onAgentStatus: (agentId, status, currentOffer) => {
          session.setAgentStatus(agentId, status, currentOffer);
        },
        onDeadlock: (deadlock) => {
          session.setDeadlock(deadlock);
        },
        onAgreement: (agreement) => {
          session.setAgreement(agreement);
          setAgreementModalOpen(true);
        }
      }
    );

    // Elapsed time timer
    timerRef.current = window.setInterval(() => {
      session.incrementTimer();
    }, 1000);

    return () => {
      negotiationSocket.disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionId]);

  const handlePause = () => negotiationSocket.pause();
  const handleResume = () => negotiationSocket.resume();
  const handleStep = () => negotiationSocket.step();
  const handleSpeedChange = (spd: number) => negotiationSocket.setSpeed(spd);
  const handleTriggerDeadlock = () => negotiationSocket.triggerDeadlock();

  const handleResolveDeadlock = (strategy: 'Reframing' | 'Additional Information' | 'Strategy Adjustment' | 'Speaker Change') => {
    session.setDeadlock(null);
    negotiationSocket.resolveDeadlock(strategy);
  };

  const handleEndSimulation = () => {
    negotiationSocket.disconnect();
    navigate(`/negotiation/${sessionId}/report`);
  };

  return (
    <div className="space-y-4">
      {/* Session Metadata Header */}
      <NegotiationHeader
        scenarioName={session.scenarioName || 'Vendor Pricing Negotiation'}
        mode="simulation"
        status={session.status}
        currentRound={session.currentRound}
        maxRounds={session.maxRounds}
        elapsedSeconds={session.elapsedSeconds}
        agentCount={session.agents.length}
        objective={session.objective}
      />

      {/* Deadlock Notification Banner if triggered */}
      {session.deadlockState && (
        <DeadlockAlert
          deadlockState={session.deadlockState}
          onResolve={handleResolveDeadlock}
          onEndNegotiation={handleEndSimulation}
        />
      )}

      {/* 3-Column Negotiation Battlefield */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Left Column: Agent Status Cards (1 col) */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Autonomous Agents ({session.agents.length})
            </span>
          </div>

          {session.agents.map((agent) => (
            <AgentStatusCard
              key={agent.id}
              agent={agent}
              isCurrentSpeaker={agent.status === 'speaking'}
            />
          ))}
        </div>

        {/* Center Column: Live Conversation Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <ConversationFeed
            messages={session.messages}
            isWaitingForAgent={session.status === 'in_progress' && session.agents.some(a => a.status === 'thinking')}
          />
        </div>

        {/* Right Column: Live Telemetry & Metrics (1 col) */}
        <div className="space-y-4 lg:col-span-1">
          <NegotiationMetrics telemetry={session.telemetry} />
        </div>
      </div>

      {/* Bottom Simulation Playback Controls */}
      <SimulationControls
        status={session.status}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onSpeedChange={handleSpeedChange}
        onTriggerDeadlock={handleTriggerDeadlock}
        onEnd={() => setConfirmEndOpen(true)}
        onViewReport={() => navigate(`/negotiation/${sessionId}/report`)}
      />

      {/* Agreement Celebration Modal */}
      <Modal
        isOpen={agreementModalOpen}
        onClose={() => setAgreementModalOpen(false)}
        maxWidth="md"
      >
        <div className="text-center py-4 space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Mutual Agreement Reached!</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            All participating autonomous agents successfully converged upon a mutually beneficial settlement terms package in Round {session.currentRound}.
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 mt-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Settlement Highlights:
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Final Valuation:</span>
              <span className="font-bold text-slate-900 font-mono">
                {session.telemetry.bestOffer}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Agreement Likelihood:</span>
              <span className="font-bold text-emerald-600 font-mono">100%</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setAgreementModalOpen(false)}>
              Keep Reviewing Feed
            </Button>
            <Button
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                setAgreementModalOpen(false);
                navigate(`/negotiation/${sessionId}/report`);
              }}
            >
              Inspect Outcome Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* End Session Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={handleEndSimulation}
        title="End Simulation Session?"
        description="Terminating the simulation will finalize all current turns and generate the post-mortem outcome report."
        confirmLabel="End & View Report"
        variant="primary"
      />
    </div>
  );
}
