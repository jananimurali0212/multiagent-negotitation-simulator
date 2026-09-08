import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleUserRound,
  Lightbulb,
  ShoppingCart,
  UsersRound,
} from 'lucide-react';

/* =========================================================
   DESIGN TOKENS
========================================================= */

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

/* =========================================================
   TYPES
========================================================= */

type NegotiationMode = 'ai-ai' | 'human-ai';

/* =========================================================
   AI VS AI VISUAL
========================================================= */

const AiVsAiVisual: React.FC = () => {
  return (
    <div className="relative flex h-[112px] items-center justify-center">
      {/* Ambient glows */}
      <div className="absolute left-[14%] h-[94px] w-[94px] rounded-full bg-[#3B82F6]/8 blur-[5px]" />

      <div className="absolute right-[14%] h-[94px] w-[94px] rounded-full bg-[#C86D51]/8 blur-[5px]" />

      {/* Left AI */}
      <div className="absolute left-[15%] top-[20px] flex h-[82px] w-[82px] items-center justify-center rounded-full border border-[#3B82F6]/15 bg-white/60 shadow-[0_8px_24px_rgba(59,130,246,0.08)] backdrop-blur-md">
        <div className="relative flex h-[45px] w-[54px] items-center justify-center rounded-[15px] border-2 border-[#3B82F6] bg-[#EEF5FF]">
          <span className="absolute left-[10px] top-[14px] h-[6px] w-[6px] rounded-full bg-[#3B82F6]" />
          <span className="absolute right-[10px] top-[14px] h-[6px] w-[6px] rounded-full bg-[#3B82F6]" />

          <span className="absolute -top-[9px] h-[9px] w-[2px] bg-[#3B82F6]" />
          <span className="absolute -top-[12px] h-[5px] w-[5px] rounded-full bg-[#3B82F6]" />

          <span className="absolute -left-[6px] top-[14px] h-[15px] w-[4px] rounded-full bg-[#3B82F6]" />
          <span className="absolute -right-[6px] top-[14px] h-[15px] w-[4px] rounded-full bg-[#3B82F6]" />

          <span className="absolute bottom-[9px] h-[2px] w-[16px] rounded-full bg-[#3B82F6]" />
        </div>
      </div>

      {/* VS */}
      <div className="relative z-10 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-slate-200 bg-white/85 text-[13px] font-bold text-[#1E2230] shadow-sm backdrop-blur-md">
        VS
      </div>

      {/* Right AI */}
      <div className="absolute right-[15%] top-[20px] flex h-[82px] w-[82px] items-center justify-center rounded-full border border-[#C86D51]/15 bg-white/60 shadow-[0_8px_24px_rgba(200,109,81,0.08)] backdrop-blur-md">
        <div className="relative flex h-[45px] w-[54px] items-center justify-center rounded-[15px] border-2 border-[#C86D51] bg-[#FFF3EE]">
          <span className="absolute left-[10px] top-[14px] h-[6px] w-[6px] rounded-full bg-[#C86D51]" />
          <span className="absolute right-[10px] top-[14px] h-[6px] w-[6px] rounded-full bg-[#C86D51]" />

          <span className="absolute -top-[9px] h-[9px] w-[2px] bg-[#C86D51]" />
          <span className="absolute -top-[12px] h-[5px] w-[5px] rounded-full bg-[#C86D51]" />

          <span className="absolute -left-[6px] top-[14px] h-[15px] w-[4px] rounded-full bg-[#C86D51]" />
          <span className="absolute -right-[6px] top-[14px] h-[15px] w-[4px] rounded-full bg-[#C86D51]" />

          <span className="absolute bottom-[9px] h-[2px] w-[16px] rounded-full bg-[#C86D51]" />
        </div>
      </div>

      {/* Connection */}
      <div className="absolute left-[30%] right-[30%] top-[58px] h-px border-t border-dashed border-slate-300">
        <span className="absolute left-1/2 top-[-3px] h-[6px] w-[6px] -translate-x-1/2 rounded-full bg-[#3B82F6]" />
      </div>

      {/* Labels */}
      <div className="absolute left-[17%] top-[95px] rounded-full bg-[#EEF5FF] px-3 py-1 text-[9px] font-semibold text-[#3B82F6]">
        AI
      </div>

      <div className="absolute right-[17%] top-[95px] rounded-full bg-[#FFF1EC] px-3 py-1 text-[9px] font-semibold text-[#C86D51]">
        AI
      </div>
    </div>
  );
};

/* =========================================================
   HUMAN VS AI VISUAL
========================================================= */

const HumanVsAiVisual: React.FC = () => {
  return (
    <div className="relative flex h-[112px] items-center justify-center">
      <div className="absolute left-[14%] h-[94px] w-[94px] rounded-full bg-[#3B82F6]/8 blur-[5px]" />

      <div className="absolute right-[14%] h-[94px] w-[94px] rounded-full bg-[#C86D51]/8 blur-[5px]" />

      {/* Human */}
      <div className="absolute left-[14%] top-[10px] flex h-[84px] w-[84px] items-center justify-center rounded-full border border-[#3B82F6]/12 bg-white/65 shadow-[0_8px_24px_rgba(59,130,246,0.08)]">
        <div className="relative h-[53px] w-[53px]">
          <div className="absolute left-[10px] top-[1px] h-[31px] w-[31px] rounded-full bg-[#1E2230]" />
          <div className="absolute left-[7px] top-[29px] h-[19px] w-[37px] rounded-t-[20px] rounded-b-[10px] bg-[#3B82F6]" />
          <div className="absolute left-[15px] top-[8px] h-[11px] w-[14px] rounded-full bg-[#F1B995]" />
        </div>
      </div>

      {/* VS */}
      <div className="relative z-10 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-slate-200 bg-white/85 text-[13px] font-bold text-[#1E2230] shadow-sm backdrop-blur-md">
        VS
      </div>

      {/* AI */}
      <div className="absolute right-[14%] top-[20px] flex h-[78px] w-[78px] items-center justify-center rounded-full border border-[#C86D51]/15 bg-white/60 shadow-[0_8px_24px_rgba(200,109,81,0.08)] backdrop-blur-md">
        <div className="relative flex h-[43px] w-[52px] items-center justify-center rounded-[14px] border-2 border-[#C86D51] bg-[#FFF3EE]">
          <span className="absolute left-[10px] top-[14px] h-[6px] w-[6px] rounded-full bg-[#C86D51]" />
          <span className="absolute right-[10px] top-[14px] h-[6px] w-[6px] rounded-full bg-[#C86D51]" />
          <span className="absolute bottom-[8px] h-[2px] w-[15px] rounded-full bg-[#C86D51]" />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute left-[15%] top-[95px] rounded-full bg-[#EEF5FF] px-3 py-1 text-[9px] font-semibold text-[#3B82F6]">
        YOU
      </div>

      <div className="absolute right-[15%] top-[95px] rounded-full bg-[#FFF1EC] px-3 py-1 text-[9px] font-semibold text-[#C86D51]">
        AI
      </div>

      <div className="absolute left-[30%] right-[30%] top-[58px] h-px border-t border-dashed border-slate-300" />
    </div>
  );
};

/* =========================================================
   MAIN MODE SELECTION SCREEN
   NOTE:
   - No navbar here
   - No progress bar here
   - Both already exist in the shared application layout
========================================================= */

export const ModeSelectionScreen: React.FC = () => {
  const navigate = useNavigate();

  const { selectedScenario, selectedMode, setSelectedMode } = useStore();

  React.useEffect(() => {
    if (!selectedMode) {
      const stored = localStorage.getItem('negotiation-mode');
      if (stored === 'ai-ai' || stored === 'human-ai') {
        setSelectedMode(stored as any);
      }
    }
  }, [selectedMode, setSelectedMode]);

  /* =========================================================
     SELECTED SCENARIO INFORMATION
  ========================================================= */

  const scenarioInfo = useMemo(() => {
    if (!selectedScenario) {
      return {
        title: 'No Scenario Selected',
        tag: 'Select a scenario first',
        icon: <ShoppingCart size={24} />,
        accent: COLORS.accent,
        soft: '#EAF2FF',
      };
    }

    if (selectedScenario.id === 'vendor-pricing') {
      return {
        title: 'Vendor Pricing Negotiation',
        tag: 'Buyer vs Vendor',
        icon: <ShoppingCart size={24} />,
        accent: COLORS.secondary,
        soft: '#FFF0EA',
      };
    }

    if (selectedScenario.id === 'job-offer') {
      return {
        title: 'Job Offer Negotiation',
        tag: 'Candidate vs Hiring Manager',
        icon: <CircleUserRound size={24} />,
        accent: COLORS.accent,
        soft: '#EAF2FF',
      };
    }

    return {
      title: 'Project Budget Allocation',
      tag: 'Dept. Heads vs Finance',
      icon: <UsersRound size={24} />,
      accent: '#6C5CE7',
      soft: '#F1EEFF',
    };
  }, [selectedScenario]);

  /* =========================================================
     MODE SELECTION
  ========================================================= */

  const handleSelectMode = (
    mode: NegotiationMode
  ) => {
    setSelectedMode(mode);

    localStorage.setItem(
      'negotiation-mode',
      mode
    );

    /*
      IMPORTANT:
      If your Zustand store already contains something like:

      selectNegotiationMode(mode)

      call it here as well.

      The centralized workflow state should remain
      the source of truth for route guards.
    */
  };

  /* =========================================================
     CONTINUE
  ========================================================= */

  const handleContinue = () => {
    /*
      Strict workflow:
      Scenario must exist.
    */

    if (!selectedScenario) {
      navigate('/setup/scenario');
      return;
    }

    /*
      Mode must be selected.
    */

    if (!selectedMode) {
      return;
    }

    /*
      Continue to Real Scenario Data Input.
    */

    navigate('/setup/scenario-data');
  };

  /* =========================================================
     BACK
  ========================================================= */

  const handleBack = () => {
    navigate('/setup/scenario');
  };

  return (
    <div
      className="
        relative
        py-5
        font-sans
        text-[#0F172A]
      "
    >
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Left glow */}
        <div
          className="
            absolute
            -left-[180px]
            top-[120px]
            h-[460px]
            w-[460px]
            rounded-full
            bg-[#3B82F6]/4
            blur-[120px]
          "
        />

        {/* Right glow */}
        <div
          className="
            absolute
            -right-[180px]
            top-[280px]
            h-[470px]
            w-[470px]
            rounded-full
            bg-[#C86D51]/4
            blur-[130px]
          "
        />

        {/* Bottom glow */}
        <div
          className="
            absolute
            bottom-[-200px]
            left-[30%]
            h-[430px]
            w-[430px]
            rounded-full
            bg-[#3B82F6]/3
            blur-[120px]
          "
        />

        {/* Subtle network */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.045]"
          viewBox="0 0 1600 1200"
          preserveAspectRatio="none"
        >
          <line
            x1="0"
            y1="260"
            x2="145"
            y2="120"
            stroke="#3B82F6"
            strokeWidth="1"
          />

          <line
            x1="145"
            y1="120"
            x2="95"
            y2="390"
            stroke="#3B82F6"
            strokeWidth="1"
          />

          <line
            x1="1510"
            y1="170"
            x2="1600"
            y2="90"
            stroke="#3B82F6"
            strokeWidth="1"
          />

          <line
            x1="1510"
            y1="170"
            x2="1580"
            y2="460"
            stroke="#3B82F6"
            strokeWidth="1"
          />

          <circle
            cx="145"
            cy="120"
            r="5"
            fill="#3B82F6"
          />

          <circle
            cx="95"
            cy="390"
            r="5"
            fill="#3B82F6"
          />

          <circle
            cx="1510"
            cy="170"
            r="5"
            fill="#3B82F6"
          />
        </svg>
      </div>

      {/* =====================================================
          MAIN CONTENT
          
          NO NAVBAR
          NO SECOND PROGRESS BAR
      ===================================================== */}

      <div className="relative z-10 w-full">
        <section
          className="
            rounded-[26px]
            border
            border-white/85
            bg-white/[0.62]
            p-5
            backdrop-blur-2xl
            sm:p-6
            lg:p-8
          "
          style={{
            boxShadow:
              '0 16px 45px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.88)',
          }}
        >
          {/* =================================================
              PAGE HEADER
          ================================================= */}

          <div className="mb-7">
            <div className="flex items-center gap-2">
              <span className="h-[7px] w-[7px] rounded-full bg-[#3B82F6]" />

              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#3B82F6]">
                STEP 02 OF 06
              </span>
            </div>

            <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.025em] text-[#0F172A] sm:text-[28px]">
              Choose Negotiation Mode
            </h1>

            <p className="mt-3 max-w-[760px] text-[12.5px] font-medium leading-6 text-[#64748B] sm:text-[13px]">
              Select how you want this negotiation to be
              conducted. This will determine your role and
              the type of negotiation experience.
            </p>
          </div>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">

            {/* =================================================
                MODE CARDS
            ================================================= */}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {/* =================================================
                  AI VS AI
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  handleSelectMode('ai-ai')
                }
                className="
                  group
                  relative
                  min-h-[480px]
                  overflow-hidden
                  rounded-[20px]
                  border
                  bg-white/[0.56]
                  p-6
                  text-left
                  backdrop-blur-2xl
                  transition-all
                  duration-200
                "
                style={{
                  borderColor:
                    selectedMode === 'ai-ai'
                      ? '#3B82F6'
                      : 'rgba(220,228,240,0.95)',

                  boxShadow:
                    selectedMode === 'ai-ai'
                      ? '0 0 0 2px rgba(59,130,246,0.12), 0 18px 45px rgba(59,130,246,0.08)'
                      : '0 10px 28px rgba(15,23,42,0.035)',

                  background:
                    selectedMode === 'ai-ai'
                      ? 'linear-gradient(145deg, rgba(255,255,255,0.78), rgba(244,248,255,0.60))'
                      : 'linear-gradient(145deg, rgba(255,255,255,0.62), rgba(255,255,255,0.42))',
                }}
              >
                {/* Selection indicator */}

                <div
                  className="
                    absolute
                    right-5
                    top-5
                    flex
                    h-[28px]
                    w-[28px]
                    items-center
                    justify-center
                    rounded-full
                    border
                  "
                  style={{
                    borderColor:
                      selectedMode === 'ai-ai'
                        ? '#3B82F6'
                        : '#D7DFEC',

                    backgroundColor:
                      selectedMode === 'ai-ai'
                        ? '#3B82F6'
                        : 'rgba(255,255,255,0.68)',
                  }}
                >
                  {selectedMode === 'ai-ai' && (
                    <Check
                      size={15}
                      className="text-white"
                      strokeWidth={3}
                    />
                  )}
                </div>

                {/* Illustration */}

                <AiVsAiVisual />

                {/* Heading */}

                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-[44px]
                      w-[44px]
                      items-center
                      justify-center
                      rounded-full
                      border
                      bg-white/70
                    "
                    style={{
                      color: '#3B82F6',
                      borderColor:
                        'rgba(59,130,246,0.20)',
                    }}
                  >
                    <UsersRound size={20} />
                  </div>

                  <div>
                    <h2 className="text-[17px] font-semibold text-[#0F172A]">
                      AI vs AI
                    </h2>

                    <span className="mt-1 inline-flex rounded-full bg-[#EAF2FF] px-3 py-1 text-[9.5px] font-medium text-[#3B82F6]">
                      AI agents negotiate with each other
                    </span>
                  </div>
                </div>

                {/* Description */}

                <p className="mt-5 text-[11.5px] font-medium leading-6 text-[#64748B]">
                  Watch two AI agents negotiate
                  autonomously based on their goals,
                  constraints, and personalities.
                </p>

                {/* Benefits */}

                <div className="mt-5 space-y-3">
                  {[
                    'Observe realistic negotiation strategies',
                    'Learn from AI decision-making patterns',
                    'Best for analysis and training',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#3B82F6]/20 bg-[#EEF5FF]">
                        <Check
                          size={11}
                          className="text-[#3B82F6]"
                          strokeWidth={3}
                        />
                      </div>

                      <span className="text-[10.5px] font-medium text-[#334155]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </button>

              {/* =================================================
                  HUMAN VS AI
              ================================================= */}

              <button
                type="button"
                onClick={() =>
                  handleSelectMode('human-ai')
                }
                className="
                  group
                  relative
                  min-h-[480px]
                  overflow-hidden
                  rounded-[20px]
                  border
                  bg-white/[0.56]
                  p-6
                  text-left
                  backdrop-blur-2xl
                  transition-all
                  duration-200
                "
                style={{
                  borderColor:
                    selectedMode === 'human-ai'
                      ? '#C86D51'
                      : 'rgba(220,228,240,0.95)',

                  boxShadow:
                    selectedMode === 'human-ai'
                      ? '0 0 0 2px rgba(200,109,81,0.10), 0 18px 45px rgba(200,109,81,0.08)'
                      : '0 10px 28px rgba(15,23,42,0.035)',
                }}
              >
                {/* Selection indicator */}

                <div
                  className="
                    absolute
                    right-5
                    top-5
                    flex
                    h-[28px]
                    w-[28px]
                    items-center
                    justify-center
                    rounded-full
                    border
                  "
                  style={{
                    borderColor:
                      selectedMode === 'human-ai'
                        ? '#C86D51'
                        : '#D7DFEC',

                    backgroundColor:
                      selectedMode === 'human-ai'
                        ? '#C86D51'
                        : 'rgba(255,255,255,0.68)',
                  }}
                >
                  {selectedMode === 'human-ai' && (
                    <Check
                      size={15}
                      className="text-white"
                      strokeWidth={3}
                    />
                  )}
                </div>

                {/* Illustration */}

                <HumanVsAiVisual />

                {/* Heading */}

                <div className="mt-6 flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-[44px]
                      w-[44px]
                      items-center
                      justify-center
                      rounded-full
                      border
                      bg-white/70
                    "
                    style={{
                      color: '#C86D51',
                      borderColor:
                        'rgba(200,109,81,0.20)',
                    }}
                  >
                    <CircleUserRound size={20} />
                  </div>

                  <div>
                    <h2 className="text-[17px] font-semibold text-[#0F172A]">
                      Human vs AI
                    </h2>

                    <span className="mt-1 inline-flex rounded-full bg-[#FFF0EA] px-3 py-1 text-[9.5px] font-medium text-[#C86D51]">
                      You negotiate against an AI agent
                    </span>
                  </div>
                </div>

                {/* Description */}

                <p className="mt-5 text-[11.5px] font-medium leading-6 text-[#64748B]">
                  Take the role of one party and
                  negotiate directly against an AI agent
                  with configurable behavior.
                </p>

                {/* Benefits */}

                <div className="mt-5 space-y-3">
                  {[
                    'Practice real negotiation skills',
                    'Receive AI-powered feedback',
                    'Best for hands-on learning',
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-[#C86D51]/20 bg-[#FFF0EA]">
                        <Check
                          size={11}
                          className="text-[#C86D51]"
                          strokeWidth={3}
                        />
                      </div>

                      <span className="text-[10.5px] font-medium text-[#334155]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            </div>

            {/* =================================================
                RIGHT SIDE
            ================================================= */}

            <aside className="space-y-5">

              {/* Selected Scenario */}

              <section
                className="
                  rounded-[20px]
                  border
                  border-white/85
                  bg-white/[0.62]
                  p-6
                  backdrop-blur-2xl
                "
                style={{
                  boxShadow:
                    '0 12px 32px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <h3 className="text-[13px] font-semibold text-[#3B82F6]">
                  Selected Scenario
                </h3>

                <div className="mt-6 flex items-center gap-4">
                  <div
                    className="
                      flex
                      h-[62px]
                      w-[62px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-[15px]
                      border
                      bg-white/75
                    "
                    style={{
                      color: scenarioInfo.accent,
                      borderColor: `${scenarioInfo.accent}24`,
                    }}
                  >
                    {scenarioInfo.icon}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[14px] font-semibold leading-5 text-[#0F172A]">
                      {scenarioInfo.title}
                    </h4>

                    <span
                      className="mt-2 inline-flex rounded-full px-3 py-1 text-[9px] font-medium"
                      style={{
                        color: scenarioInfo.accent,
                        backgroundColor: scenarioInfo.soft,
                      }}
                    >
                      {scenarioInfo.tag}
                    </span>
                  </div>
                </div>
              </section>

              {/* About Modes */}

              <section
                className="
                  rounded-[20px]
                  border
                  border-white/85
                  bg-white/[0.62]
                  p-6
                  backdrop-blur-2xl
                "
                style={{
                  boxShadow:
                    '0 12px 32px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.9)',
                }}
              >
                <h3 className="text-[13px] font-semibold text-[#3B82F6]">
                  About Negotiation Modes
                </h3>

                {/* AI vs AI */}

                <div className="mt-7 flex gap-4">
                  <div
                    className="
                      flex
                      h-[46px]
                      w-[46px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-[14px]
                      border
                      bg-[#EEF5FF]
                      text-[#3B82F6]
                    "
                  >
                    <UsersRound size={20} />
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-[#3B82F6]">
                      AI vs AI
                    </p>

                    <p className="mt-2 text-[10.5px] font-medium leading-5 text-[#64748B]">
                      Ideal for observing complex
                      strategies, concession patterns,
                      and value creation in action.
                    </p>
                  </div>
                </div>

                {/* Human vs AI */}

                <div className="mt-7 flex gap-4">
                  <div
                    className="
                      flex
                      h-[46px]
                      w-[46px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-[14px]
                      border
                      bg-[#FFF0EA]
                      text-[#C86D51]
                    "
                  >
                    <CircleUserRound size={20} />
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-[#C86D51]">
                      Human vs AI
                    </p>

                    <p className="mt-2 text-[10.5px] font-medium leading-5 text-[#64748B]">
                      Perfect for building your
                      negotiation skills with intelligent,
                      adaptive AI opponents.
                    </p>
                  </div>
                </div>

                <div className="my-6 h-px bg-[#E8EDF5]" />

                {/* Tip */}

                <div className="flex gap-4 rounded-[15px] border border-white/80 bg-white/35 p-4">
                  <div
                    className="
                      flex
                      h-[46px]
                      w-[46px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-[14px]
                      border
                      bg-[#F1EEFF]
                      text-[#6C5CE7]
                    "
                  >
                    <Lightbulb size={20} />
                  </div>

                  <div>
                    <p className="text-[12px] font-semibold text-[#6C5CE7]">
                      Tip
                    </p>

                    <p className="mt-2 text-[10.5px] font-medium leading-5 text-[#64748B]">
                      You can change the mode later
                      before starting the negotiation.
                    </p>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          {/* =================================================
              BOTTOM ACTIONS
          ================================================= */}

          <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="
                flex
                h-[54px]
                items-center
                justify-center
                gap-2
                rounded-full
                border
                border-white/90
                bg-white/[0.64]
                px-7
                text-[12px]
                font-semibold
                text-[#0F172A]
                backdrop-blur-xl
                shadow-[0_8px_24px_rgba(15,23,42,0.04)]
                transition-all
                hover:bg-white/[0.82]
              "
            >
              <ArrowLeft size={17} />
              Back to Scenario
            </button>

            <button
              type="button"
              disabled={!selectedMode}
              onClick={handleContinue}
              className="
                flex
                h-[54px]
                items-center
                justify-center
                gap-3
                rounded-full
                px-8
                text-[12px]
                font-semibold
                transition-all
              "
              style={{
                backgroundColor: selectedMode
                  ? '#3B82F6'
                  : '#DCE3EE',

                color: selectedMode
                  ? '#FFFFFF'
                  : '#94A3B8',

                boxShadow: selectedMode
                  ? '0 10px 26px rgba(59,130,246,0.24)'
                  : 'none',

                cursor: selectedMode
                  ? 'pointer'
                  : 'not-allowed',
              }}
            >
              Continue to Enter Scenario Data
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModeSelectionScreen;