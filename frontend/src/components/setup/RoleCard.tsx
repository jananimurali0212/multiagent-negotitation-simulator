import React from 'react';
import { NegotiationAgent, Personality } from '../../types/negotiation';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { PersonalitySelector } from './PersonalitySelector';
import { Target, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface RoleCardProps {
  agent: NegotiationAgent;
  personality: Personality;
  onPersonalityChange: (personality: Personality) => void;
  isHumanControlled?: boolean;
}

export function RoleCard({
  agent,
  personality,
  onPersonalityChange,
  isHumanControlled = false,
}: RoleCardProps) {
  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/70 py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm shadow-xs ${
              agent.avatarBg || 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {agent.avatarText || agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold">{agent.name}</CardTitle>
              {isHumanControlled ? (
                <Badge variant="ai" size="sm">
                  Human User Seat
                </Badge>
              ) : (
                <Badge variant="info" size="sm">
                  Autonomous Agent
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">Role: {agent.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Configured
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        {/* Read-Only Scenario Goals & Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Read-only Goal */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Target className="w-3.5 h-3.5 text-blue-600" />
                <span>Primary Goal</span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-Only
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {agent.goal[0]?.description || 'Maximize stakeholder utility.'}
            </p>
            {agent.goal[0]?.targetValue && (
              <span className="inline-block mt-2 text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                Target: {agent.goal[0].targetValue}
              </span>
            )}
          </div>

          {/* Read-only Constraint */}
          <div className="p-3.5 bg-amber-50/40 rounded-xl border border-amber-200/70 relative">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Hard Constraint</span>
              </div>
              <span className="text-[10px] font-semibold text-amber-600/70 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Read-Only
              </span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              {agent.constraints[0]?.description || 'Operate strictly within authorized limits.'}
            </p>
            <span className="inline-block mt-2 text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded">
              Limit: {agent.constraints[0]?.value || 'Scenario-defined limit'}
            </span>
          </div>
        </div>

        {/* Personality Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Agent Persona & Behavioral Strategy
            </label>
            <span className="text-xs text-slate-500 font-medium">
              Active Strategy: <strong className="text-slate-900">{personality}</strong>
            </span>
          </div>
          <PersonalitySelector value={personality} onChange={onPersonalityChange} />
        </div>

        {/* Configuration Summary Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500 gap-2">
          <div>
            <span className="font-semibold text-slate-700">Configuration Summary: </span>
            <span className="font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {agent.name.replace(' Agent', '')} — {agent.role} — {personality}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Autonomous decision engine ready
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
