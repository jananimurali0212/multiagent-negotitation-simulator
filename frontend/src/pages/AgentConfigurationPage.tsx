import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { PageHeader } from '../components/common/PageHeader';
import { SetupProgress } from '../components/setup/SetupProgress';
import { RoleCard } from '../components/setup/RoleCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { ArrowRight, ArrowLeft, Users2, ShieldCheck, Sparkles } from 'lucide-react';

export function AgentConfigurationPage() {
  const navigate = useNavigate();
  const {
    selectedScenario,
    selectedMode,
    agents,
    personalities,
    setPersonality,
  } = useNegotiationSetupStore();

  if (!selectedScenario) {
    navigate('/new-negotiation/scenario');
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Wizard Progress Indicator */}
      <SetupProgress
        currentStep={1}
        onStepClick={(step) => {
          if (step === 2) navigate('/new-negotiation/goals-constraints');
          if (step === 3) navigate('/new-negotiation/review');
        }}
      />

      <PageHeader
        title="Configure Agent Personas"
        description="Select behavioral strategies for each participating agent. Goals and constraints are scenario-defined reference benchmarks."
        badge={
          <Badge variant={selectedMode === 'simulation' ? 'ai' : 'info'} size="md">
            {selectedMode === 'simulation' ? 'Simulation Mode (AI vs AI)' : 'Practice Mode (Human vs AI)'}
          </Badge>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scenarios', href: '/new-negotiation/scenario' },
          { label: 'Mode', href: '/new-negotiation/mode' },
          { label: 'Agent Configuration' },
        ]}
      />

      {/* Scenario Overview Pill */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Scenario
          </span>
          <h4 className="text-sm font-bold text-slate-900">{selectedScenario.name}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {agents.length} Negotiating Parties
          </Badge>
        </div>
      </div>

      {/* Role Cards List */}
      <div className="space-y-6">
        {agents.map((agent, index) => {
          const isHumanControlled = selectedMode === 'practice' && index === 0;
          const currentPersonality = personalities[agent.id] || agent.personality || 'Collaborative';

          return (
            <RoleCard
              key={agent.id}
              agent={agent}
              personality={currentPersonality}
              onPersonalityChange={(p) => setPersonality(agent.id, p)}
              isHumanControlled={isHumanControlled}
            />
          );
        })}
      </div>

      {/* Navigation Footer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/new-negotiation/mode')}
        >
          Back: Mode
        </Button>

        <Button
          size="md"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/new-negotiation/goals-constraints')}
        >
          Next: Goals & Constraints
        </Button>
      </div>
    </div>
  );
}
