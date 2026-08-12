import React from 'react';
import { Users, Clock, Target, ShieldAlert, ArrowRight, Check } from 'lucide-react';
import { NegotiationScenario } from '../../types/scenario';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface ScenarioCardProps {
  scenario: NegotiationScenario;
  isSelected?: boolean;
  onSelect: (scenario: NegotiationScenario) => void;
}

export function ScenarioCard({ scenario, isSelected = false, onSelect }: ScenarioCardProps) {
  return (
    <Card
      className={`transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
        isSelected
          ? 'ring-2 ring-blue-600 border-blue-600/30 bg-blue-50/20'
          : 'hover:border-slate-300'
      }`}
      onClick={() => onSelect(scenario)}
    >
      <div>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="info" size="sm" className="font-semibold">
              {scenario.participants.length} Autonomous Agents
            </Badge>
            {isSelected && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-100/80 px-2 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5" /> Selected
              </span>
            )}
          </div>
          <CardTitle className="text-xl">{scenario.name}</CardTitle>
          <CardDescription className="line-clamp-2 mt-1">
            {scenario.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3.5 pt-0">
          {/* Main Objective */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
              <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Main Objective</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {scenario.objective}
            </p>
          </div>

          {/* Key Constraint */}
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Key Constraint</span>
            </div>
            <p className="text-xs text-amber-800/90 leading-relaxed">
              {scenario.keyConstraint}
            </p>
          </div>

          {/* Participants preview */}
          <div className="pt-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Participating Stakeholders
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scenario.agents.map((agent) => (
                <span
                  key={agent.id}
                  className="text-xs bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md border border-slate-200 flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  {agent.name}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{scenario.estimatedDuration}</span>
        </div>

        <Button
          size="sm"
          variant={isSelected ? 'primary' : 'outline'}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(scenario);
          }}
        >
          {isSelected ? 'Selected' : 'Select Scenario'}
        </Button>
      </CardFooter>
    </Card>
  );
}
