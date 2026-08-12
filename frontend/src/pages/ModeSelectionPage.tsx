import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { PageHeader } from '../components/common/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Bot, User, Check, ArrowRight, Play, Eye, Sparkles, ShieldCheck } from 'lucide-react';

export function ModeSelectionPage() {
  const navigate = useNavigate();
  const { selectedScenario, selectedMode, setMode } = useNegotiationSetupStore();

  const handleSelectMode = (mode: 'simulation' | 'practice') => {
    setMode(mode);
    navigate('/new-negotiation/agents');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Select Negotiation Mode"
        description="Choose whether to watch autonomous AI agents negotiate or take a direct participant seat against an AI opponent."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Scenarios', href: '/new-negotiation/scenario' },
          { label: 'Mode Selection' },
        ]}
      />

      {/* Selected Scenario Context Banner */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-500 font-medium">Selected Scenario:</span>
          <h4 className="text-sm font-bold text-slate-900">{selectedScenario?.name}</h4>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/new-negotiation/scenario')}>
          Change Scenario
        </Button>
      </div>

      {/* Two-Card Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* SIMULATION MODE */}
        <Card
          onClick={() => handleSelectMode('simulation')}
          className={`cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
            selectedMode === 'simulation'
              ? 'ring-2 ring-blue-600 border-blue-600/40 bg-blue-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
                  <Bot className="w-6 h-6" />
                </div>
                {selectedMode === 'simulation' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100/80 px-2.5 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5" /> Selected Mode
                  </span>
                )}
              </div>
              <CardTitle className="text-xl">Simulation Mode</CardTitle>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mt-0.5">
                AI vs AI Autonomous Arena
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                "The AI agents negotiate autonomously while you observe the conversation and live metrics."
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Key Characteristics:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Multi-stakeholder autonomous interaction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Real-time concession and likelihood curve tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Playback controls: Pause, Step, Speed (1x, 2x, 5x)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Automated stalemate deadlock resolution</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full"
              variant={selectedMode === 'simulation' ? 'primary' : 'outline'}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectMode('simulation');
              }}
            >
              Select Simulation Mode
            </Button>
          </div>
        </Card>

        {/* PRACTICE MODE */}
        <Card
          onClick={() => handleSelectMode('practice')}
          className={`cursor-pointer transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
            selectedMode === 'practice'
              ? 'ring-2 ring-blue-600 border-blue-600/40 bg-blue-50/20'
              : 'hover:border-slate-300'
          }`}
        >
          <div>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                {selectedMode === 'practice' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100/80 px-2.5 py-1 rounded-full">
                    <Check className="w-3.5 h-3.5" /> Selected Mode
                  </span>
                )}
              </div>
              <CardTitle className="text-xl">Practice Mode</CardTitle>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mt-0.5">
                Human vs AI Interactive Arena
              </span>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                "You participate directly in the negotiation against an AI agent."
              </p>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Key Characteristics:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Direct conversational bargaining and offer submission</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Real-time Practice Assistant tactical coaching tips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Live scoring on Concession Control and Argument Strength</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Personalized post-session training feedback</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </div>

          <div className="p-6 pt-0">
            <Button
              className="w-full"
              variant={selectedMode === 'practice' ? 'primary' : 'outline'}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={(e) => {
                e.stopPropagation();
                handleSelectMode('practice');
              }}
            >
              Select Practice Mode
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
