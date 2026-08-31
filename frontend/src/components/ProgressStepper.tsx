import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Step {
  label: string;
  desc: string;
  paths: string[];
}

export const ProgressStepper: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const { 
    selectedMode, 
    getFirstIncompleteStepId, 
    setGuardModal, 
    reports,
    canAccessStep,
    getRouteForStepId,
    getStepIdForPath
  } = store;

  const steps: Step[] = [
    { label: 'Choose Scenario', desc: 'Select negotiation context', paths: ['/setup/scenario', '/setup/mode'] },
    { label: 'Configure Agents', desc: 'Set roles & personalities', paths: ['/setup/agents'] },
    { label: 'Goals & Constraints', desc: 'Define objectives & limits', paths: ['/setup/goals'] },
    { label: 'Review & Confirm', desc: 'Review all setup details', paths: ['/setup/review'] },
    { label: 'Negotiation', desc: 'Choose mode & begin', paths: ['/arena/simulation', '/arena/practice'] },
    { label: 'Outcome', desc: 'Analyze & learn', paths: ['/reports'] }
  ];

  // Determine current active step index
  const activeIndex = steps.findIndex(step => 
    step.paths.some(path => location.pathname.startsWith(path))
  );

  // If the path is not one of the workflow steps (e.g. dashboard, settings, help), don't render the stepper
  if (activeIndex === -1) {
    return null;
  }

  const getRouteForStepIdx = (idx: number): string => {
    switch (idx) {
      case 0: return '/setup/scenario';
      case 1: return '/setup/agents';
      case 2: return '/setup/goals';
      case 3: return '/setup/review';
      case 4: return '/arena';
      case 5: return '/reports';
      default: return '/setup/scenario';
    }
  };

  const getGuardModalContent = (firstIncompleteId: string) => {
    switch (firstIncompleteId) {
      case 'SCENARIO':
        return {
          title: 'Complete the setup first',
          message: 'You need to select a negotiation scenario before continuing.',
          actionText: 'Choose Scenario',
          actionRoute: '/setup/scenario'
        };
      case 'MODE':
        return {
          title: 'Choose a negotiation mode',
          message: 'Select AI vs AI or Human vs AI before configuring agents.',
          actionText: 'Choose Mode',
          actionRoute: '/setup/mode'
        };
      case 'AGENTS':
        return {
          title: 'Configure your agents first',
          message: 'Complete all required agent configuration details before continuing to the negotiation.',
          actionText: 'Configure Agents',
          actionRoute: '/setup/agents'
        };
      case 'GOALS':
        return {
          title: 'Complete goals and constraints',
          message: 'Define the required negotiation goals and constraints before continuing.',
          actionText: 'Set Goals & Constraints',
          actionRoute: '/setup/goals'
        };
      case 'REVIEW':
        return {
          title: 'Review your negotiation setup',
          message: 'Review and confirm the configured scenario, agents, goals, and constraints before starting.',
          actionText: 'Review & Confirm',
          actionRoute: '/setup/review'
        };
      default:
        return {
          title: 'Access Restricted',
          message: 'Please complete the setup steps before proceeding.',
          actionText: 'Go to Setup',
          actionRoute: '/setup/scenario'
        };
    }
  };

  const handleStepClick = (idx: number) => {
    // If clicking current or completed step, always allow back/current navigation
    if (idx <= activeIndex) {
      if (idx === 0 && location.pathname === '/setup/mode') {
        navigate('/setup/scenario');
      } else {
        navigate(getRouteForStepIdx(idx));
      }
      return;
    }

    // Future step click
    const destination = getRouteForStepIdx(idx);
    const stepId = getStepIdForPath(destination);

    if (stepId === 'OUTCOME') {
      navigate(destination);
      return;
    }

    if (stepId && !canAccessStep(stepId)) {
      const firstIncompleteId = getFirstIncompleteStepId();
      const modalContent = getGuardModalContent(firstIncompleteId);
      setGuardModal({
        isOpen: true,
        ...modalContent
      });
      return;
    }

    // Otherwise, allow navigation
    if (destination === '/arena') {
      const nextRoute = selectedMode === 'human-ai' ? '/arena/practice' : '/arena/simulation';
      navigate(nextRoute);
    } else {
      navigate(destination);
    }
  };

  return (
    <div className="sticky top-[96px] lg:top-[104px] z-40 w-full mb-6 pointer-events-auto">
      <div className="bg-white/65 border border-white/70 shadow-[0_10px_35px_rgb(0,0,0,0.015)] backdrop-blur-lg rounded-[22px] px-6 md:px-10 py-5 md:py-6 flex items-center justify-between overflow-x-auto gap-4 select-none">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          return (
            <React.Fragment key={idx}>
              {/* Step Circle & Text */}
              <div 
                onClick={() => handleStepClick(idx)}
                className="flex items-center gap-[10px] shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
              >
                {/* Visual badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-accent/10 border border-accent/30 text-accent' 
                    : isCurrent 
                      ? 'bg-accent text-white shadow-md shadow-accent/20' 
                      : 'bg-warmpearl text-slate-400 border border-gray-200'
                }`}>
                  {isCompleted ? <Check size={14} strokeWidth={3} /> : `0${idx + 1}`}
                </div>
                
                {/* Labels */}
                <div className="flex flex-col">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider leading-none ${
                    isCurrent ? 'text-primary' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                  <span className="text-[9px] font-medium text-slate-400 mt-[4px] leading-none">
                    {isCompleted ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}
                  </span>
                </div>
              </div>

              {/* Connecting line between steps */}
              {idx < steps.length - 1 && (
                <div className="flex-grow min-w-[12px] max-w-[80px] h-px border-t border-dashed border-slate-300" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
