import React from 'react';
import { NegotiationAgent } from '../../types/negotiation';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Badge } from '../common/Badge';
import { Mic, Clock, Sparkles, Target, DollarSign, Shield } from 'lucide-react';

interface AgentStatusCardProps {
  agent: NegotiationAgent;
  isCurrentSpeaker?: boolean;
  isHumanControlled?: boolean;
}

export function AgentStatusCard({
  agent,
  isCurrentSpeaker = false,
  isHumanControlled = false,
}: AgentStatusCardProps) {
  const status = agent.status || 'waiting';

  const getStatusIndicator = () => {
    if (status === 'speaking') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full ring-2 ring-blue-400/30 animate-pulse">
          <Mic className="w-3 h-3 text-blue-600" /> Speaking
        </span>
      );
    }
    if (status === 'thinking') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full animate-bounce">
          <Sparkles className="w-3 h-3 text-violet-600" /> Thinking...
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3 text-slate-400" /> Waiting
      </span>
    );
  };

  const getPersonalityBadgeVariant = () => {
    switch (agent.personality) {
      case 'Aggressive':
        return 'destructive';
      case 'Collaborative':
        return 'info';
      case 'Risk-Averse':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card
      className={`transition-all duration-200 ${
        status === 'speaking'
          ? 'ring-2 ring-blue-600/70 border-blue-600 shadow-md bg-blue-50/10'
          : 'border-slate-200'
      }`}
    >
      <CardHeader className="py-3 px-4 bg-slate-50/60 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border ${
              agent.avatarBg || 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {agent.avatarText || agent.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <span>{isHumanControlled ? 'You (Human User)' : agent.name}</span>
            </CardTitle>
            <p className="text-[11px] text-slate-500 font-medium">Role: {agent.role}</p>
          </div>
        </div>

        {getStatusIndicator()}
      </CardHeader>

      <CardContent className="p-3.5 space-y-2.5">
        {/* Personality Badge */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-medium">Strategy Persona</span>
          <Badge variant={getPersonalityBadgeVariant()} size="sm">
            {agent.personality}
          </Badge>
        </div>

        {/* Current Offer */}
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/70">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-0.5">
            Active Position / Offer
          </span>
          <div className="flex items-center gap-1 text-sm font-bold text-slate-900 font-mono">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{agent.currentOffer || agent.position || 'Establishing terms...'}</span>
          </div>
        </div>

        {/* Goal summary */}
        <div className="text-[11px] text-slate-600 bg-slate-50/60 p-2 rounded border border-slate-100">
          <div className="flex items-center gap-1 font-semibold text-slate-700 mb-0.5">
            <Target className="w-3 h-3 text-blue-600" />
            <span>Core Objective</span>
          </div>
          <p className="line-clamp-2 leading-relaxed">{agent.goal[0]?.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
