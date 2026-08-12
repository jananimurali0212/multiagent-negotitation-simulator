import React, { useState } from 'react';
import { DeadlockState } from '../../types/negotiation';
import { AlertOctagon, RefreshCw, Layers, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

interface DeadlockAlertProps {
  deadlockState: DeadlockState;
  onResolve: (strategy: 'Reframing' | 'Additional Information' | 'Strategy Adjustment' | 'Speaker Change') => void;
  onEndNegotiation: () => void;
}

const STRATEGIES: { id: 'Reframing' | 'Additional Information' | 'Strategy Adjustment' | 'Speaker Change'; label: string; desc: string }[] = [
  {
    id: 'Reframing',
    label: 'Reframing',
    desc: 'Introduce non-monetary trade-offs (SLA, payment terms, or project scope) to expand value.',
  },
  {
    id: 'Additional Information',
    label: 'Additional Information',
    desc: 'Inject new benchmark data or market parity context to re-anchor expectations.',
  },
  {
    id: 'Strategy Adjustment',
    label: 'Strategy Adjustment',
    desc: 'Temporarily relax aggressive anchors to trigger reciprocal concessions.',
  },
  {
    id: 'Speaker Change',
    label: 'Speaker Change',
    desc: 'Shift speaking initiative to an alternate mediator or stakeholder agent.',
  },
];

export function DeadlockAlert({ deadlockState, onResolve, onEndNegotiation }: DeadlockAlertProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<'Reframing' | 'Additional Information' | 'Strategy Adjustment' | 'Speaker Change'>('Reframing');

  return (
    <div className="bg-amber-50/90 border-2 border-amber-400 rounded-2xl p-5 shadow-lg my-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-950">Negotiation Deadlock Detected</h3>
            <p className="text-xs text-amber-800 font-medium">
              The agents have stopped making meaningful progress.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-bold bg-white/80 px-2.5 py-1 rounded-md border border-amber-300 text-amber-900">
          <Layers className="w-3.5 h-3.5 text-amber-700" />
          <span>Round {deadlockState.round}</span>
        </div>
      </div>

      {/* Deadlock Context Box */}
      <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 mb-4 space-y-2 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span className="font-semibold text-slate-700">Root Impasse Reason:</span>
          <span className="font-bold text-amber-900">Offer Gap: {deadlockState.offerGap}</span>
        </div>
        <p className="text-slate-700 leading-relaxed font-medium">{deadlockState.reason}</p>

        {deadlockState.repeatedPositions && deadlockState.repeatedPositions.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
              Stalled Positions:
            </span>
            <ul className="space-y-1">
              {deadlockState.repeatedPositions.map((pos, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{pos}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Visual Resolution Selector */}
      <div className="mb-4">
        <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block mb-2">
          Select AI Orchestrator Resolution Protocol
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {STRATEGIES.map((strat) => {
            const isSelected = selectedStrategy === strat.id;
            return (
              <div
                key={strat.id}
                onClick={() => setSelectedStrategy(strat.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-100/90 border-amber-500 text-amber-950 shadow-xs'
                    : 'bg-white/90 border-amber-200 text-slate-700 hover:bg-amber-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">{strat.label}</span>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-700" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{strat.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Triggers */}
      <div className="flex items-center justify-between pt-3 border-t border-amber-300">
        <Button
          variant="outline"
          size="sm"
          className="bg-white hover:bg-slate-50 text-slate-700"
          onClick={onEndNegotiation}
        >
          End Negotiation & View Report
        </Button>

        <Button
          variant="primary"
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white"
          rightIcon={<RefreshCw className="w-3.5 h-3.5" />}
          onClick={() => onResolve(selectedStrategy)}
        >
          Apply {selectedStrategy} & Continue
        </Button>
      </div>
    </div>
  );
}
