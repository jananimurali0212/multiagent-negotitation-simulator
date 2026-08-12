import React, { useState } from 'react';
import { Play, Pause, StepForward, FastForward, Square, AlertOctagon, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import { NegotiationStatus } from '../../types/negotiation';

interface SimulationControlsProps {
  status: NegotiationStatus;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onSpeedChange: (speed: number) => void;
  onEnd: () => void;
  onTriggerDeadlock: () => void;
  onViewReport?: () => void;
}

export function SimulationControls({
  status,
  onPause,
  onResume,
  onStep,
  onSpeedChange,
  onEnd,
  onTriggerDeadlock,
  onViewReport,
}: SimulationControlsProps) {
  const [activeSpeed, setActiveSpeed] = useState<number>(1);

  const isPaused = status === 'paused' || status === 'deadlock';
  const isFinished = status === 'completed' || status === 'agreement' || status === 'ended';

  const handleSpeedSelect = (speed: number) => {
    setActiveSpeed(speed);
    onSpeedChange(speed);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
      {/* Primary Playback Controls */}
      <div className="flex items-center gap-2">
        {!isFinished ? (
          <>
            {isPaused ? (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="w-4 h-4 fill-white" />}
                onClick={onResume}
              >
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Pause className="w-4 h-4" />}
                onClick={onPause}
              >
                Pause
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<StepForward className="w-4 h-4" />}
              onClick={onStep}
              title="Execute next turn cycle manually"
            >
              Step
            </Button>
          </>
        ) : (
          onViewReport && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FileText className="w-4 h-4" />}
              onClick={onViewReport}
            >
              View Full Outcome Report
            </Button>
          )
        )}
      </div>

      {/* Speed Controls */}
      {!isFinished && (
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 px-2 flex items-center gap-1">
            <FastForward className="w-3 h-3 text-slate-400" /> Speed:
          </span>
          {[1, 2, 5].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedSelect(speed)}
              className={`text-xs font-bold px-2.5 py-1 rounded-md transition-all ${
                activeSpeed === speed
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      )}

      {/* Termination & Edge Case Testing Controls */}
      <div className="flex items-center gap-2">
        {!isFinished && (
          <Button
            variant="outline"
            size="sm"
            className="text-amber-700 hover:bg-amber-50 hover:text-amber-800 border-amber-200"
            leftIcon={<AlertOctagon className="w-3.5 h-3.5" />}
            onClick={onTriggerDeadlock}
            title="Simulate stalemate deadlock state"
          >
            Simulate Deadlock
          </Button>
        )}

        <Button
          variant={isFinished ? 'outline' : 'destructive'}
          size="sm"
          leftIcon={<Square className="w-3.5 h-3.5" />}
          onClick={onEnd}
        >
          {isFinished ? 'Exit Arena' : 'End Simulation'}
        </Button>
      </div>
    </div>
  );
}
