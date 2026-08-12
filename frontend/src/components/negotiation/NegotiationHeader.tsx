import React from 'react';
import { Clock, Layers, Users, Target } from 'lucide-react';
import { NegotiationMode, NegotiationStatus } from '../../types/negotiation';
import { Badge } from '../common/Badge';

interface NegotiationHeaderProps {
  scenarioName: string;
  mode: NegotiationMode;
  status: NegotiationStatus;
  currentRound: number;
  maxRounds: number;
  elapsedSeconds: number;
  agentCount: number;
  objective: string;
}

export function NegotiationHeader({
  scenarioName,
  mode,
  status,
  currentRound,
  maxRounds,
  elapsedSeconds,
  agentCount,
  objective,
}: NegotiationHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge variant="success" size="md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
            Live In Progress
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="warning" size="md">
            Paused
          </Badge>
        );
      case 'deadlock':
        return (
          <Badge variant="destructive" size="md">
            Deadlock Detected
          </Badge>
        );
      case 'agreement':
      case 'completed':
        return (
          <Badge variant="info" size="md">
            Agreement Reached
          </Badge>
        );
      case 'ended':
        return (
          <Badge variant="secondary" size="md">
            Ended
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="md">
            Initializing
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Scenario & Mode Identity */}
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{scenarioName}</h2>
            {getStatusBadge()}
            <Badge variant={mode === 'simulation' ? 'ai' : 'info'} size="sm">
              {mode === 'simulation' ? 'AI vs AI Simulation' : 'Human vs AI Practice'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 max-w-2xl">
            <Target className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{objective}</span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex items-center flex-wrap gap-3 sm:gap-4 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          {/* Timer */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200/80 shadow-xs">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">Elapsed</span>
              <span className="text-xs font-bold font-mono text-slate-800">{formatTime(elapsedSeconds)}</span>
            </div>
          </div>

          {/* Round Indicator */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200/80 shadow-xs">
            <Layers className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">Round</span>
              <span className="text-xs font-bold font-mono text-slate-800">
                {currentRound} <span className="text-slate-400 font-normal">/ {maxRounds}</span>
              </span>
            </div>
          </div>

          {/* Agent count */}
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-slate-200/80 shadow-xs">
            <Users className="w-4 h-4 text-slate-600" />
            <div>
              <span className="text-[10px] text-slate-400 font-medium block leading-none">Seats</span>
              <span className="text-xs font-bold text-slate-800">{agentCount} Parties</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
