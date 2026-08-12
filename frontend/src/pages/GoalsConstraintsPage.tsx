import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { PageHeader } from '../components/common/PageHeader';
import { SetupProgress } from '../components/setup/SetupProgress';
import { GoalsList } from '../components/setup/GoalsList';
import { ConstraintsList } from '../components/setup/ConstraintsList';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Target,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  Sliders,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

export function GoalsConstraintsPage() {
  const navigate = useNavigate();
  const {
    selectedScenario,
    agents,
    personalities,
    addGoal,
    removeGoal,
    addConstraint,
    removeConstraint,
    resetAgentGoalsAndConstraints,
    resetAllGoalsAndConstraints,
  } = useNegotiationSetupStore();

  const [activeAgentId, setActiveAgentId] = useState<string>(agents[0]?.id || '');
  const [isEditMode, setIsEditMode] = useState<boolean>(true); // Default to enabled customization

  if (!selectedScenario) {
    navigate('/new-negotiation/scenario');
    return null;
  }

  const currentAgent = agents.find((a) => a.id === activeAgentId) || agents[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SetupProgress
        currentStep={2}
        onStepClick={(step) => {
          if (step === 1) navigate('/new-negotiation/agents');
          if (step === 3) navigate('/new-negotiation/review');
        }}
      />

      <PageHeader
        title="Goals & Constraints Configuration"
        description="Inspect or customize the tactical goals and hard non-violable boundaries governing autonomous agent bargaining envelopes."
        badge={
          <Badge variant="info" size="md">
            Step 2 of 4
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <button
              type="button"
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shadow-2xs ${
                isEditMode
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {isEditMode ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Custom Editing Enabled</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Read-Only Benchmark Mode</span>
                </>
              )}
            </button>

            {/* Reset Defaults */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => resetAgentGoalsAndConstraints(currentAgent.id)}
              title="Restore official scenario defaults for this agent"
            >
              Reset Agent Defaults
            </Button>
          </div>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scenarios', href: '/new-negotiation/scenario' },
          { label: 'Agents', href: '/new-negotiation/agents' },
          { label: 'Goals & Constraints' },
        ]}
      />

      {/* Scenario Overview Summary Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Scenario Purpose & Framework
            </span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedScenario.name}</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">{selectedScenario.purpose}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Expected Outcome:</span>
            <Badge variant="default" size="sm">
              {selectedScenario.expectedOutcome}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Agent Selector Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {agents.map((agent) => {
          const isActive = agent.id === currentAgent.id;
          const persona = personalities[agent.id] || agent.personality;

          return (
            <button
              key={agent.id}
              onClick={() => setActiveAgentId(agent.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>{agent.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-normal ${
                  isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {persona} ({agent.goal.length} goals, {agent.constraints.length} limits)
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Agent Goals & Constraints Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GOALS COLUMN */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 bg-blue-50/40 border-b border-blue-100/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-blue-950 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span>GOALS: Desired Outcomes ({currentAgent.goal.length})</span>
              </CardTitle>
              <p className="text-[11px] text-blue-700/80 mt-0.5">
                What {currentAgent.name} optimizes to maximize.
              </p>
            </div>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              Utility Driver
            </span>
          </CardHeader>

          <CardContent className="p-6">
            <GoalsList
              goals={currentAgent.goal}
              isEditable={isEditMode}
              onAddGoal={(g) => addGoal(currentAgent.id, g)}
              onRemoveGoal={(gid) => removeGoal(currentAgent.id, gid)}
            />
          </CardContent>
        </Card>

        {/* CONSTRAINTS COLUMN */}
        <Card className="border-slate-200">
          <CardHeader className="py-4 px-6 bg-amber-50/50 border-b border-amber-200/70 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>CONSTRAINTS: Hard Boundaries ({currentAgent.constraints.length})</span>
              </CardTitle>
              <p className="text-[11px] text-amber-800/80 mt-0.5">
                Strict limits {currentAgent.name} cannot violate under any circumstances.
              </p>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> Non-Violable
            </span>
          </CardHeader>

          <CardContent className="p-6">
            <ConstraintsList
              constraints={currentAgent.constraints}
              isEditable={isEditMode}
              onAddConstraint={(c) => addConstraint(currentAgent.id, c)}
              onRemoveConstraint={(cid) => removeConstraint(currentAgent.id, cid)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Info Notice */}
      <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Interactive Flexibility:</strong> You can add or remove goals and constraints for any participating agent to simulate custom business scenarios. The autonomous reasoning engine will dynamically factor in all configured goals and enforce all strict boundary constraints during arena exchanges.
        </p>
      </div>

      {/* Footer Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/new-negotiation/agents')}
        >
          Back: Agents
        </Button>

        <Button
          size="md"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/new-negotiation/review')}
        >
          Next: Review & Confirm
        </Button>
      </div>
    </div>
  );
}
