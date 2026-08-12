import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { negotiationSocket } from '../services/negotiationSocket';
import { NegotiationHeader } from '../components/negotiation/NegotiationHeader';
import { AgentStatusCard } from '../components/negotiation/AgentStatusCard';
import { ConversationFeed } from '../components/negotiation/ConversationFeed';
import { PracticeAssistant } from '../components/negotiation/PracticeAssistant';
import { PerformancePanel } from '../components/negotiation/PerformancePanel';
import { OfferDialog } from '../components/negotiation/OfferDialog';
import { DeadlockAlert } from '../components/negotiation/DeadlockAlert';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import {
  Send,
  DollarSign,
  Square,
  RotateCcw,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Bot
} from 'lucide-react';

export function PracticeArenaPage() {
  const { sessionId = 'prac-demo' } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const { selectedScenario, maximumRounds, agents: setupAgents } = useNegotiationSetupStore();
  const session = useSessionStore();

  const [inputMessage, setInputMessage] = useState('');
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const [agreementModalOpen, setAgreementModalOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  const scenario = selectedScenario || {
    id: 'job-offer-negotiation',
    name: 'Job Offer Negotiation',
    objective: 'Align total compensation, signing incentive, remote flexibility, and start date.',
    defaultMaxRounds: 10,
  };

  useEffect(() => {
    session.initSession({
      sessionId,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      mode: 'practice',
      maxRounds: maximumRounds || scenario.defaultMaxRounds || 10,
      objective: scenario.objective,
      agents: setupAgents && setupAgents.length > 0 ? setupAgents : [
        {
          id: 'human-user',
          name: 'You (Candidate)',
          role: 'Candidate',
          personality: 'Collaborative',
          goal: [{ id: '1', description: 'Maximize salary, benefits, and hybrid work flexibility.' }],
          constraints: [{ id: '1', description: 'Minimum acceptable offer threshold ($148,000 floor).' }],
          currentOffer: '$165,000',
          position: '$165,000 base target',
          status: 'waiting'
        },
        {
          id: 'recruiter-agent',
          name: 'Recruiter Agent',
          role: 'Recruiter',
          personality: 'Collaborative',
          goal: [{ id: '2', description: 'Close the hire within approved salary band.' }],
          constraints: [{ id: '2', description: 'Maximum approved salary band ($160,000 cap).' }],
          currentOffer: '$142,000',
          position: '$142,000 standard offer',
          status: 'waiting'
        }
      ],
    });

    negotiationSocket.connect(
      sessionId,
      scenario.id,
      'practice',
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
        },
        onCoachTip: (tip) => {
          session.addCoachTip(tip);
        },
        onHumanMetrics: (metrics) => {
          session.setHumanMetrics(metrics);
        }
      }
    );

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    negotiationSocket.sendHumanMessage(inputMessage);
    setInputMessage('');
  };

  const handleCustomOfferSubmit = (rationale: string, offer: any) => {
    negotiationSocket.sendHumanMessage(rationale, offer);
  };

  const handleEndPractice = () => {
    negotiationSocket.disconnect();
    navigate(`/negotiation/${sessionId}/report`);
  };

  const handleRestart = () => {
    navigate(0);
  };

  return (
    <div className="space-y-4">
      {/* Practice Arena Header */}
      <NegotiationHeader
        scenarioName={session.scenarioName || 'Job Offer Negotiation'}
        mode="practice"
        status={session.status}
        currentRound={session.currentRound}
        maxRounds={session.maxRounds}
        elapsedSeconds={session.elapsedSeconds}
        agentCount={2}
        objective={session.objective}
      />

      {/* Deadlock banner if triggered */}
      {session.deadlockState && (
        <DeadlockAlert
          deadlockState={session.deadlockState}
          onResolve={(strat) => {
            session.setDeadlock(null);
            negotiationSocket.resolveDeadlock(strat);
          }}
          onEndNegotiation={handleEndPractice}
        />
      )}

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Left Column: Stakeholder Cards (1 col) */}
        <div className="space-y-4 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 block">
            Negotiation Parties
          </span>

          {/* User Card */}
          <Card className="border-blue-300 bg-blue-50/20 shadow-xs">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">You (Human Negotiator)</h4>
                  <p className="text-[11px] text-blue-700 font-semibold">Seat: Lead Candidate / Buyer</p>
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-blue-200/80 text-xs">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Goal</span>
                <p className="text-slate-800 font-medium">Maximize base compensation and hybrid terms.</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Counterpart Card */}
          {session.agents.filter(a => a.id !== 'human-user').map(agent => (
            <AgentStatusCard
              key={agent.id}
              agent={agent}
              isCurrentSpeaker={agent.status === 'speaking'}
            />
          ))}
        </div>

        {/* Center Column: Interactive Dialogue Feed & Input Box (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <ConversationFeed
            messages={session.messages}
            isWaitingForAgent={session.agents.some(a => a.status === 'thinking')}
          />

          {/* Human Negotiator Input Form */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-3.5">
              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea
                  rows={2}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your negotiation response, rationale, or counter-condition..."
                  className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 leading-relaxed resize-none"
                />

                <div className="flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    leftIcon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                    onClick={() => setOfferDialogOpen(true)}
                  >
                    Make Formal Offer
                  </Button>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={!inputMessage.trim()}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send Response
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Real-time Practice Assistant & Scoring (1 col) */}
        <div className="space-y-4 lg:col-span-1">
          <PracticeAssistant tips={session.coachingTips} />
          <PerformancePanel metrics={session.humanMetrics} />
        </div>
      </div>

      {/* Arena Footer Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={handleRestart}
          >
            Restart Session
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
            onClick={() => navigate('/new-negotiation/scenario')}
          >
            New Scenario
          </Button>
        </div>

        <Button
          variant="destructive"
          size="sm"
          leftIcon={<Square className="w-3.5 h-3.5" />}
          onClick={() => setConfirmEndOpen(true)}
        >
          End Practice & View Report
        </Button>
      </div>

      {/* Structured Offer Dialog */}
      <OfferDialog
        isOpen={offerDialogOpen}
        onClose={() => setOfferDialogOpen(false)}
        onSubmitOffer={handleCustomOfferSubmit}
        scenarioName={session.scenarioName}
        defaultOfferValue={scenario.id === 'job-offer-negotiation' ? '$158,000' : '$45,000'}
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
          <h3 className="text-xl font-bold text-slate-900">Practice Deal Successfully Closed!</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
            You reached agreement with the AI counterpart in Round {session.currentRound} with strong concession discipline.
          </p>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left space-y-2 mt-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Your Performance Summary:
            </span>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Concession Discipline Score:</span>
              <span className="font-bold text-blue-600 font-mono">{session.humanMetrics.concessionControl}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Argument Strength:</span>
              <span className="font-bold text-emerald-600 font-mono">{session.humanMetrics.argumentStrength}%</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <Button
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => {
                setAgreementModalOpen(false);
                navigate(`/negotiation/${sessionId}/report`);
              }}
            >
              View Full Outcome Report
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm End Dialog */}
      <ConfirmDialog
        isOpen={confirmEndOpen}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={handleEndPractice}
        title="Conclude Practice Session?"
        description="This will finalize the interactive dialogue and calculate your performance analytics."
        confirmLabel="Conclude & View Report"
      />
    </div>
  );
}
