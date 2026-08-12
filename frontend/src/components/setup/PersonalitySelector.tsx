import React from 'react';
import { Personality } from '../../types/negotiation';
import { Flame, Users2, Shield } from 'lucide-react';

interface PersonalitySelectorProps {
  value: Personality;
  onChange: (personality: Personality) => void;
  disabled?: boolean;
}

interface PersonalityOption {
  id: Personality;
  label: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  activeColor: string;
  badgeBg: string;
}

const PERSONALITY_OPTIONS: PersonalityOption[] = [
  {
    id: 'Aggressive',
    label: 'Aggressive',
    tagline: 'High anchor & hard bargaining',
    description: 'Anchors high, makes small concessions and applies pressure to maximize immediate capture.',
    icon: <Flame className="w-4 h-4 text-rose-600" />,
    activeColor: 'border-rose-500 bg-rose-50/30 text-rose-950 ring-2 ring-rose-500/20',
    badgeBg: 'bg-rose-100 text-rose-700',
  },
  {
    id: 'Collaborative',
    label: 'Collaborative',
    tagline: 'Win-win & multi-issue trading',
    description: 'Looks for balanced, win-win outcomes by discovering mutual value and trade-offs.',
    icon: <Users2 className="w-4 h-4 text-blue-600" />,
    activeColor: 'border-blue-500 bg-blue-50/30 text-blue-950 ring-2 ring-blue-500/20',
    badgeBg: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'Risk-Averse',
    label: 'Risk-Averse',
    tagline: 'Certainty & deadlock avoidance',
    description: 'Prioritizes certainty and avoids costly deadlock by guarding strict downside boundaries.',
    icon: <Shield className="w-4 h-4 text-emerald-600" />,
    activeColor: 'border-emerald-500 bg-emerald-50/30 text-emerald-950 ring-2 ring-emerald-500/20',
    badgeBg: 'bg-emerald-100 text-emerald-700',
  },
];

export function PersonalitySelector({ value, onChange, disabled = false }: PersonalitySelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {PERSONALITY_OPTIONS.map((opt) => {
        const isSelected = value === opt.id;

        return (
          <div
            key={opt.id}
            onClick={() => !disabled && onChange(opt.id)}
            className={`p-3.5 rounded-xl border transition-all duration-150 flex flex-col justify-between cursor-pointer select-none ${
              isSelected
                ? `${opt.activeColor} shadow-sm`
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-700'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium mb-1.5">{opt.tagline}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{opt.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
