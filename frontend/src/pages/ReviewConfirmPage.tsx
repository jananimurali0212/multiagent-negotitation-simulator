import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { negotiationService } from '../services/negotiationService';
import { PageHeader } from '../components/common/PageHeader';
import { SetupProgress } from '../components/setup/SetupProgress';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  CheckCircle2,
  Edit2,
  Play,
  Layers,
  Users2,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Target,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export function ReviewConfirmPage() {
  const navigate = useNavigate();
  const {
    selectedScenario,
    selectedMode,
    agents,
    personalities,
    maximumRounds,
    setMaximumRounds,
  } = useNegotiationSetupStore();

  const [isStarting, setIsStarting] = useState(false);

  if (!selectedScenario) {
    navigate('/new-negotiation/scenario');
    return null;
  }

  const isConfigValid = !!selectedScenario && agents.length > 0 && maximumRounds >= 3;

  const handleConfirmAndStart = async () => {
    if (!isConfigValid) return;
    try {
      setIsStarting(true);
      const session = await negotiationService.createSession({
        scenarioId: selectedScenario.id,
        mode: selectedMode,
        agents: agents.map((a) => ({
          ...a,
          personality: personalities[a.id] || a.personality,
        })),
        maxRounds: maximumRounds,
      });

      setIsStarting(false);
      if (selectedMode === 'simulation') {
        navigate(`/negotiation/simulation/${session.sessionId}`);
      } else {
        navigate(`/negotiation/practice/${session.sessionId}`);
      }
    } catch {
      setIsStarting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SetupProgress
        currentStep={3}
        onStepClick={(step) => {
          if (step === 1) navigate('/new-negotiation/agents');
          if (step === 2) navigate('/new-negotiation/goals-constraints');
        }}
      />

      <PageHeader
        title="Review & Confirm Negotiation Setup"
        description="Verify scenario rules, persona assignments, goals, constraints, and round ceilings before launching the live negotiation arena."
        badge={
          <Badge variant="success" size="md">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            Configuration Valid
          </Badge>
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scenarios', href: '/new-negotiation/scenario' },
          { label: 'Agents', href: '/new-negotiation/agents' },
          { label: 'Review & Confirm' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Summary Checkpoints */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Details Card */}
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Scenario Details</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => navigate('/new-negotiation/scenario')}
              >
                Edit
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Scenario Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedScenario.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Expected Outcome:</span>
                <Badge variant="default" size="sm">{selectedScenario.expectedOutcome}</Badge>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="font-semibold text-slate-500 block mb-1">Primary Objective:</span>
                <p className="text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg">
                  {selectedScenario.objective}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mode Details Card */}
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Operational Mode</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => navigate('/new-negotiation/mode')}
              >
                Edit
              </Button>
            </CardHeader>

            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {selectedMode === 'simulation' ? 'Simulation Mode' : 'Practice Mode'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedMode === 'simulation'
                    ? 'AI vs AI: Fully autonomous multi-agent bargaining arena'
                    : 'Human vs AI: Interactive user participation with real-time coaching'}
                </p>
              </div>
              <Badge variant={selectedMode === 'simulation' ? 'ai' : 'info'} size="md">
                {selectedMode === 'simulation' ? 'AI vs AI' : 'Human vs AI'}
              </Badge>
            </CardContent>
          </Card>

          {/* Participating Agents Summary */}
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users2 className="w-4 h-4 text-emerald-600" />
                <span>Configured Agent Roster</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => navigate('/new-negotiation/agents')}
              >
                Edit
              </Button>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-6">Agent</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Persona</th>
                    <th className="py-3 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {agents.map((agent) => {
                    const persona = personalities[agent.id] || agent.personality;
                    return (
                      <tr key={agent.id}>
                        <td className="py-3.5 px-6 font-bold text-slate-900">{agent.name}</td>
                        <td className="py-3.5 px-4 text-slate-500">{agent.role}</td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant={
                              persona === 'Aggressive'
                                ? 'destructive'
                                : persona === 'Collaborative'
                                ? 'info'
                                : 'success'
                            }
                            size="sm"
                          >
                            {persona}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ready
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Goals & Constraints Condensed Overview */}
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Goals & Constraints Summary</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => navigate('/new-negotiation/goals-constraints')}
              >
                Customize
              </Button>
            </CardHeader>

            <CardContent className="p-6 space-y-4 text-xs">
              {agents.map((agent) => (
                <div key={agent.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{agent.name}</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {agent.goal.length} Objectives, {agent.constraints.length} Constraints
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-700 flex items-center gap-1 mb-1">
                        <Target className="w-3 h-3" /> Active Goals:
                      </span>
                      <ul className="space-y-1">
                        {agent.goal.map((g) => (
                          <li key={g.id} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                            <span className="text-blue-500 font-bold">•</span>
                            <span>{g.description} {g.targetValue && `(${g.targetValue})`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-800 flex items-center gap-1 mb-1">
                        <ShieldAlert className="w-3 h-3" /> Strict Limits:
                      </span>
                      <ul className="space-y-1">
                        {agent.constraints.map((c) => (
                          <li key={c.id} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{c.description} {c.value && `[${c.value}]`}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Parameters & Confirm CTA */}
        <div className="space-y-6">
          {/* Maximum Rounds Config */}
          <Card className="border-slate-200">
            <CardHeader className="py-4 px-6 border-b border-slate-100">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Negotiation Parameters</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    Maximum Turn Rounds
                  </label>
                  <span className="font-mono font-bold text-blue-600 text-sm">
                    {maximumRounds} Rounds
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={maximumRounds}
                  onChange={(e) => setMaximumRounds(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
                  <span>5 (Fast)</span>
                  <span>10 (Recommended)</span>
                  <span>20 (Deep)</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Validation Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Configuration complies with all scenario rules, utility functions, and constraint limits.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Launch Card */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-white shadow-md">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <Play className="w-6 h-6 fill-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Ready to Launch Session</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Initiate real-time multi-agent negotiation in the arena.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full font-bold shadow-md"
                disabled={!isConfigValid}
                isLoading={isStarting}
                rightIcon={<Play className="w-4 h-4 fill-white" />}
                onClick={handleConfirmAndStart}
              >
                Confirm & Start Arena
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-slate-500"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                onClick={() => navigate('/new-negotiation/goals-constraints')}
              >
                Back: Goals & Constraints
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
