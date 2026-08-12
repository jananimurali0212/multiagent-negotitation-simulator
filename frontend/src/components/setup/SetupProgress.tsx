import React from 'react';
import { Check } from 'lucide-react';

interface SetupProgressProps {
  currentStep: number; // 1 to 4
  steps?: { title: string; subtitle: string }[];
  onStepClick?: (step: number) => void;
}

const DEFAULT_STEPS = [
  { title: 'Agents', subtitle: 'Configure personas' },
  { title: 'Goals & Constraints', subtitle: 'Verify boundaries' },
  { title: 'Review', subtitle: 'Validate parameters' },
  { title: 'Confirm', subtitle: 'Launch session' },
];

export function SetupProgress({ currentStep, steps = DEFAULT_STEPS, onStepClick }: SetupProgressProps) {
  return (
    <div className="w-full py-4 mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto relative">
        {/* Background Connecting Line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-0" />
        
        {/* Active Connecting Progress Line */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <button
              key={step.title}
              type="button"
              disabled={stepNum > currentStep}
              onClick={() => onStepClick && onStepClick(stepNum)}
              className={`flex flex-col items-center group relative z-10 bg-slate-50 px-2 cursor-pointer disabled:cursor-not-allowed`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 ${
                  isCompleted
                    ? 'bg-blue-600 text-white ring-4 ring-slate-50'
                    : isCurrent
                    ? 'bg-white border-2 border-blue-600 text-blue-600 ring-4 ring-blue-50 shadow-sm'
                    : 'bg-white border border-slate-300 text-slate-400 ring-4 ring-slate-50'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <div className="text-center mt-2">
                <span
                  className={`text-xs font-semibold block transition-colors ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {step.title}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block">{step.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
