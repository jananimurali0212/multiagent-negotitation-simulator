import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Scenario } from '../store/useStore';

import {
  Users,
  Clock3,
  Target,
  Check,
  ChevronRight,
  Sparkles,
  Lightbulb,
  Bot,
  UsersRound,
  BarChart3,
  ShoppingCart,
  BriefcaseBusiness,
  PieChart,
} from 'lucide-react';

const COLORS = {
  primary: '#1E2230',
  secondary: '#C86D51',
  accent: '#3B82F6',
  background: '#EEF1F8',
  backgroundSoft: '#F4F6FB',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
};

type ScenarioVisual = {
  tag: string;
  focus: string;
  duration: string;
  participants: string;
  accent: string;
  accentSoft: string;
  border: string;
  icon: React.ReactNode;
  backgroundIcon: React.ReactNode;
};

const scenarioVisuals: Record<string, ScenarioVisual> = {
  'vendor-pricing': {
    tag: 'Buyer vs Vendor',
    focus: 'Price • Quality • Delivery',
    duration: '15 – 20 min',
    participants: '2 Agents',
    accent: COLORS.secondary,
    accentSoft: 'rgba(200,109,81,0.08)',
    border: 'rgba(200,109,81,0.22)',
    icon: <ShoppingCart size={28} strokeWidth={1.7} />,
    backgroundIcon: <ShoppingCart size={180} strokeWidth={0.7} />,
  },
  'job-offer': {
    tag: 'Candidate vs Hiring Manager',
    focus: 'Salary • Benefits • Role',
    duration: '15 – 20 min',
    participants: '2 Agents',
    accent: COLORS.accent,
    accentSoft: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.22)',
    icon: <BriefcaseBusiness size={28} strokeWidth={1.7} />,
    backgroundIcon: <BriefcaseBusiness size={180} strokeWidth={0.7} />,
  },
  'budget-allocation': {
    tag: 'Dept. Heads vs Finance',
    focus: 'Budget • Priorities • Trade-offs',
    duration: '20 – 25 min',
    participants: '3 Agents',
    accent: COLORS.primary,
    accentSoft: 'rgba(30,34,48,0.055)',
    border: 'rgba(30,34,48,0.16)',
    icon: <PieChart size={28} strokeWidth={1.7} />,
    backgroundIcon: <PieChart size={180} strokeWidth={0.7} />,
  },
};

interface ScenarioCardProps {
  scenario: Scenario;
  selected: boolean;
  onSelect: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, selected, onSelect }) => {
  const visual = scenarioVisuals[scenario.id] ?? scenarioVisuals['vendor-pricing'];

  return (
    <article
      onClick={onSelect}
      className="group relative min-h-[390px] cursor-pointer overflow-hidden rounded-[24px] border bg-white/70 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: selected ? visual.accent : 'rgba(255,255,255,0.85)',
        backgroundColor: selected ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.70)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: selected
          ? `0 0 0 2px ${visual.accent}18, 0 20px 50px rgba(15,23,42,0.06)`
          : '0 12px 40px rgba(15,23,42,0.05)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at 85% 85%, ${visual.accentSoft}, transparent 42%)`,
        }}
      />

      <div
        className="pointer-events-none absolute bottom-[-25px] right-[-18px] opacity-[0.075] transition-all duration-500 group-hover:scale-105 group-hover:opacity-[0.11]"
        style={{ color: visual.accent }}
      >
        {visual.backgroundIcon}
      </div>

      <div
        className="pointer-events-none absolute bottom-[38px] right-[38px] h-[105px] w-[105px] rounded-full border opacity-20"
        style={{ borderColor: visual.accent }}
      />
      <div
        className="pointer-events-none absolute bottom-[54px] right-[54px] h-[73px] w-[73px] rounded-full border opacity-15"
        style={{ borderColor: visual.accent }}
      />

      {selected && (
        <div
          className="absolute right-5 top-5 z-20 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm"
          style={{ backgroundColor: visual.accent }}
        >
          <Check size={13} strokeWidth={3} />
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div
            className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] border bg-white/80 shadow-sm"
            style={{
              color: visual.accent,
              borderColor: visual.border,
              backgroundColor: 'rgba(255,255,255,0.82)',
            }}
          >
            {visual.icon}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <h3 className="pr-7 text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] text-[#0F172A]">
              {scenario.title}
            </h3>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span
                className="rounded-full border px-2.5 py-1 text-[10px] font-medium"
                style={{
                  color: visual.accent,
                  borderColor: visual.border,
                  backgroundColor: visual.accentSoft,
                }}
              >
                {visual.tag}
              </span>
              <span className="rounded-full border border-[#E5E7EB] bg-white/70 px-2.5 py-1 text-[10px] font-medium text-[#64748B]">
                {scenario.category}
              </span>
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-[410px] text-[11.5px] font-medium leading-[1.65] text-[#64748B]">
          {scenario.description}
        </p>

        <div className="my-5 h-px w-full bg-[#E8EBF2]" />

        <div className="space-y-4">
          <div className="flex items-center">
            <div className="flex w-[135px] shrink-0 items-center gap-2 text-[11px] font-medium text-[#64748B]">
              <Users size={14} strokeWidth={1.7} />
              <span>Participants</span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#1E2230]">
              {visual.participants}
            </span>
          </div>

          <div className="flex items-center">
            <div className="flex w-[135px] shrink-0 items-center gap-2 text-[11px] font-medium text-[#64748B]">
              <Clock3 size={14} strokeWidth={1.7} />
              <span>Typical Duration</span>
            </div>
            <span className="text-[11.5px] font-semibold text-[#1E2230]">
              {visual.duration}
            </span>
          </div>

          <div className="flex items-start">
            <div className="flex w-[135px] shrink-0 items-center gap-2 text-[11px] font-medium text-[#64748B]">
              <Target size={14} strokeWidth={1.7} />
              <span>Focus Area</span>
            </div>
            <span className="text-[11.5px] font-semibold leading-5 text-[#1E2230]">
              {visual.focus}
            </span>
          </div>
        </div>

        <div className="flex-grow" />

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect();
          }}
          className="mt-5 flex h-[40px] w-full items-center justify-center gap-1.5 rounded-full border bg-white/65 text-[11.5px] font-semibold transition-all duration-200 hover:bg-white cursor-pointer"
          style={{
            color: visual.accent,
            borderColor: visual.border,
          }}
        >
          <span>Select & Continue</span>
          <ChevronRight size={15} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
};

const InformationStrip: React.FC = () => {
  const items = [
    {
      title: 'Not sure which one to choose?',
      description: 'All scenarios are beginner-friendly and designed to build real negotiation skills.',
      icon: <Lightbulb size={18} strokeWidth={1.7} />,
      color: COLORS.secondary,
    },
    {
      title: 'Realistic AI Agents',
      description: 'Each agent has unique goals, boundary constraints, and dynamic personalities.',
      icon: <Bot size={18} strokeWidth={1.7} />,
      color: COLORS.accent,
    },
    {
      title: 'Multiple Modes',
      description: 'Practice through AI-vs-AI simulations or directly negotiate against an AI agent.',
      icon: <UsersRound size={18} strokeWidth={1.7} />,
      color: COLORS.primary,
    },
    {
      title: 'Instant Insights',
      description: 'Receive detailed outcome analysis after every completed negotiation.',
      icon: <BarChart3 size={18} strokeWidth={1.7} />,
      color: COLORS.secondary,
    },
  ];

  return (
    <section className="overflow-hidden rounded-[22px] border border-white/80 bg-white/65 backdrop-blur-xl shadow-[0_8px_30px_rgba(30,34,48,0.035)]">
      <div className="grid grid-cols-1 divide-y divide-[#E7EAF0] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
        {items.map((item, index) => (
          <div
            key={item.title}
            className={`flex min-h-[105px] items-center gap-3.5 px-5 py-5 ${
              index === 0 ? 'lg:px-6' : 'lg:px-5'
            }`}
          >
            <div
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[12px] border bg-white/85"
              style={{
                color: item.color,
                borderColor: `${item.color}20`,
              }}
            >
              {item.icon}
            </div>
            <div>
              <h4 className="text-[11.5px] font-semibold leading-5 text-[#0F172A]">
                {item.title}
              </h4>
              <p className="mt-0.5 text-[10px] font-medium leading-4 text-[#64748B]">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export const ScenarioSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { scenarios, selectedScenario, selectScenario } = useStore();

  const fixedScenarios = scenarios.filter(
    (scenario) =>
      scenario.id === 'vendor-pricing' ||
      scenario.id === 'job-offer' ||
      scenario.id === 'budget-allocation'
  );

  const handleSelectScenario = (scenario: Scenario) => {
    selectScenario(scenario);
    navigate('/setup/mode');
  };

  return (
    <div className="relative py-4 font-sans text-[#0F172A]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -left-[180px] -top-[180px] h-[420px] w-[420px] rounded-full blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.07), transparent 68%)',
          }}
        />
        <div
          className="absolute -right-[180px] top-[220px] h-[430px] w-[430px] rounded-full blur-[110px]"
          style={{
            background: 'radial-gradient(circle, rgba(200,109,81,0.055), transparent 68%)',
          }}
        />
        <div
          className="absolute bottom-[-230px] left-[32%] h-[430px] w-[430px] rounded-full blur-[110px]"
          style={{
            background: 'radial-gradient(circle, rgba(30,34,48,0.025), transparent 68%)',
          }}
        />
      </div>

      <div
        className="relative z-10 w-full rounded-[26px] border border-white/85 bg-white/[0.62] backdrop-blur-2xl p-5 sm:p-6 lg:p-8 space-y-8"
        style={{
          boxShadow: '0 14px 45px rgba(15, 23, 42, 0.05)',
        }}
      >
        <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[760px]">
            <div className="mb-1.5 flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS.accent }} />
              <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                NEGOTIATION SETUP
              </span>
            </div>

            <h1 className="text-[22px] sm:text-[26px] lg:text-[30px] font-bold tracking-[-0.02em] leading-tight text-[#0F172A]">
              Choose Your Negotiation Scenario
            </h1>

            <p className="mt-2 max-w-[700px] text-[12px] font-medium leading-5 text-[#64748B]">
              Select one of our enterprise-ready negotiation scenarios. Each scenario is designed to help you practice real-world negotiation strategies with AI agents.
            </p>
          </div>

          <div className="flex min-h-[76px] w-full shrink-0 items-center gap-3.5 rounded-[20px] border border-white/80 bg-white/60 px-4 py-3.5 backdrop-blur-xl shadow-[0_8px_28px_rgba(30,34,48,0.035)] lg:w-[350px]">
            <div
              className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] border bg-white/80"
              style={{
                color: COLORS.accent,
                borderColor: `${COLORS.accent}18`,
              }}
            >
              <Sparkles size={19} strokeWidth={1.6} />
            </div>

            <div>
              <p className="text-[11.5px] font-semibold text-[#0F172A]">
                All scenarios are 100% free
              </p>
              <p className="mt-0.5 text-[10px] font-medium leading-4 text-[#64748B]">
                No limits. No subscriptions. Practice as much as you want.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {fixedScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              selected={selectedScenario?.id === scenario.id}
              onSelect={() => handleSelectScenario(scenario)}
            />
          ))}
        </section>

        <InformationStrip />
      </div>
    </div>
  );
};

export default ScenarioSelectionScreen;