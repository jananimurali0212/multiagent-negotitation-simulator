import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { apiRequest, negotiationApi } from '../lib/api';

import {
  ArrowLeft,
  Play,
  ShoppingCart,
  BriefcaseBusiness,
  BarChart3,
  Shield,
  Clock3,
  Users,
  Sparkles,
  Pencil,
  Check,
  ChevronRight,
  Eye,
  Rocket,
} from 'lucide-react';

export const ReviewConfirmScreen: React.FC = () => {
  const navigate = useNavigate();

  const {
    selectedScenario,
    configuredAgents,
    resetSimulation,
    resetPractice,
    selectedMode,
    setSelectedMode,
    humanRole,
    reviewConfirmed,
    setReviewConfirmed,
    getFirstIncompleteStepId,
  } = useStore();

  /*
   * ---------------------------------------------------------
   * GUARD
   * ---------------------------------------------------------
   */

  if (!selectedScenario || configuredAgents.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: '#EEF1F8' }}
      >
        <div className="w-full max-w-md rounded-3xl border border-white/80 bg-white/75 backdrop-blur-xl shadow-[0_15px_45px_rgba(30,55,100,0.08)] p-10 text-center">
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <Shield className="text-blue-600" size={26} />
          </div>

          <h3 className="text-lg font-bold text-[#14234B]">
            Configuration Incomplete
          </h3>

          <p className="mt-2 text-sm text-[#64719A] leading-relaxed">
            Please complete the previous setup steps before reviewing your
            negotiation.
          </p>

          <button
            onClick={() => navigate('/setup/scenario')}
            className="mt-6 px-6 py-3 rounded-full bg-[#3867F6] text-white text-sm font-semibold hover:bg-[#2F5CE8] transition-all"
          >
            Go Back to Setup
          </button>
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------
   * START NEGOTIATION
   * ---------------------------------------------------------
   */

  const {
    activeSessionId,
    setActiveSessionId,
    setActiveSessionStatus,
  } = useStore();
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleConfirmReview = async () => {
    if (!selectedScenario || !configuredAgents || configuredAgents.length === 0) {
      return;
    }

    setIsSubmittingReview(true);
    try {
      const agentsPayload = configuredAgents.map((ag) => ({
        id: ag.id,
        agent_template_id: ag.id || 'agent',
        name: ag.name,
        role: ag.role,
        avatar: ag.avatar,
        personality: ag.personality,
        experience: ag.experience || 'Medium',
        negotiation_parameters: {
          targetPrice: ag.targetPrice,
          minPrice: ag.minPrice,
          maxBudget: ag.maxBudget,
          targetSalary: ag.targetSalary,
          minSalary: ag.minSalary,
          maxSalary: ag.maxSalary,
          targetAllocation: ag.targetAllocation,
          minAllocation: ag.minAllocation,
          paymentTerms: ag.paymentTerms,
          warrantySupport: ag.warrantySupport,
          deliveryRequirement: ag.deliveryRequirement,
          ...(ag.negotiation_parameters || {}),
        },
        goals: (ag.goals || []).map((g) => ({ text: g.text, priority: g.priority || 'Medium' })),
        constraints: (ag.constraints || []).map((c) => ({ label: c.label, value: c.value })),
      }));

      let currentSessId = activeSessionId;

      if (!currentSessId) {
        const createRes = await negotiationApi.createSession({
          scenario_id: selectedScenario.id,
          mode: selectedMode || 'ai-ai',
          human_role: selectedMode === 'human-ai' ? (humanRole || undefined) : undefined,
          agents: agentsPayload,
        });
        currentSessId = createRes.id;
        setActiveSessionId(currentSessId);
      } else {
        await negotiationApi.updateAgents(currentSessId, agentsPayload);
      }

      if (currentSessId) {
        await apiRequest(`/negotiations/${currentSessId}/confirm-review`, {
          method: 'POST',
          body: JSON.stringify({ confirm: true }),
        });
      }

      setReviewConfirmed(true);
      setActiveSessionStatus('ready');
    } catch (err: any) {
      console.error('Confirm review error:', err);
      // Ensure frontend local state allows progressing
      setReviewConfirmed(true);
      setActiveSessionStatus('ready');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleStartNegotiation = async () => {
    if (!selectedScenario || !configuredAgents || configuredAgents.length === 0) {
      return;
    }

    if (!reviewConfirmed) {
      await handleConfirmReview();
    }

    if (selectedMode === 'ai-ai') {
      navigate('/arena/simulation');
    } else {
      navigate('/arena/practice');
    }
  };

  /*
   * ---------------------------------------------------------
   * SCENARIO ICON
   * ---------------------------------------------------------
   */

  const ScenarioIcon = () => {
    if (selectedScenario.id === 'vendor-pricing') {
      return <ShoppingCart size={19} />;
    }

    if (selectedScenario.id === 'job-offer') {
      return <BriefcaseBusiness size={19} />;
    }

    return <BarChart3 size={19} />;
  };

  /*
   * ---------------------------------------------------------
   * AGENT COLOR
   * ---------------------------------------------------------
   */

  const getAgentTheme = (index: number) => {
    if (index === 0) {
      return {
        bg: 'bg-orange-50',
        icon: 'text-orange-500',
        badge: 'bg-orange-50 text-orange-600 border-orange-100',
      };
    }

    if (index === 1) {
      return {
        bg: 'bg-blue-50',
        icon: 'text-blue-500',
        badge: 'bg-blue-50 text-blue-600 border-blue-100',
      };
    }

    return {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-500',
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
  };

  /*
   * ---------------------------------------------------------
   * PROGRESS BAR
   * ---------------------------------------------------------
   */

  const steps = [
    {
      number: '01',
      title: 'Choose Scenario',
      status: 'Completed',
      route: '/setup/scenario',
    },
    {
      number: '02',
      title: 'Configure Agents',
      status: 'Completed',
      route: '/setup/agents',
    },
    {
      number: '03',
      title: 'Goals & Constraints',
      status: 'Completed',
      route: '/setup/goals',
    },
    {
      number: '04',
      title: 'Review & Confirm',
      status: 'In Progress',
      route: '/setup/review',
    },
    {
      number: '05',
      title: 'Start Negotiation',
      status: 'Pending',
      route: '/arena/simulation',
    },
    {
      number: '06',
      title: 'Outcome',
      status: 'Pending',
      route: '/reports',
    },
  ];

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div
      className="relative pb-8"
    >
      <div className="space-y-8">

        {/* =====================================================
            PAGE HEADER
        ===================================================== */}

        <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">

          <div>
            <h1 className="text-[22px] sm:text-[26px] lg:text-[29px] font-bold tracking-[-0.02em] leading-tight text-[#14234B]">
              Review & Confirm
            </h1>

            <p className="mt-1 text-[13px] text-[#64719A]">
              Review all setup details before starting the negotiation simulation.
            </p>
          </div>

          <button
            onClick={() => navigate('/setup/agents')}
            className="
              flex items-center gap-2
              px-4 py-2.5
              rounded-full
              border border-[#DCE3F3]
              bg-white/70
              backdrop-blur-md
              text-[12px]
              font-semibold
              text-[#3867F6]
              hover:bg-white
              transition-all
              shadow-sm
            "
          >
            <Pencil size={14} />
            Edit All
          </button>

        </section>

        {/* =====================================================
            SETUP SUMMARY
        ===================================================== */}

        <section
          className="
            rounded-[24px]
            border border-white/85
            bg-white/70
            backdrop-blur-[24px]
            shadow-[0_12px_40px_rgba(15,23,42,0.05)]
            p-6
          "
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">

            {/* Scenario */}

            <div className="flex items-center gap-3 px-4 py-3 xl:border-r border-[#E5EAF4]">
              <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                <ScenarioIcon />
              </div>

              <div className="min-w-0">
                <span className="text-[10px] text-[#8A94B2] block">
                  Scenario
                </span>

                <p className="mt-1 text-[13px] font-bold text-[#14234B] truncate">
                  {selectedScenario.title}
                </p>

                <p className="text-[10px] text-[#64719A] mt-0.5">
                  {selectedScenario.category}
                </p>
              </div>
            </div>

            {/* Mode */}

            <div className="flex items-center gap-3 px-4 py-3 xl:border-r border-[#E5EAF4]">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                <Users size={18} />
              </div>

              <div>
                <span className="text-[10px] text-[#8A94B2] block">
                  Mode
                </span>

                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => setSelectedMode('ai-ai')}
                    className={`
                      px-2.5 py-1 rounded-full text-[10px] font-semibold
                      border transition-all
                      ${selectedMode === 'ai-ai'
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-transparent text-[#8A94B2] border-transparent'
                      }
                    `}
                  >
                    AI vs AI
                  </button>

                  <button
                    onClick={() => setSelectedMode('human-ai')}
                    className={`
                      px-2.5 py-1 rounded-full text-[10px] font-semibold
                      border transition-all
                      ${selectedMode === 'human-ai'
                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                        : 'bg-transparent text-[#8A94B2] border-transparent'
                      }
                    `}
                  >
                    Practice
                  </button>
                </div>
              </div>
            </div>

            {/* Rounds */}

            <div className="flex items-center gap-3 px-4 py-3 xl:border-r border-[#E5EAF4]">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                <Shield size={18} />
              </div>

              <div>
                <span className="text-[10px] text-[#8A94B2] block">
                  Rounds
                </span>

                <p className="mt-1 text-[13px] font-bold text-[#14234B]">
                  12 Rounds
                </p>
              </div>
            </div>

            {/* Duration */}

            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                <Clock3 size={18} />
              </div>

              <div>
                <span className="text-[10px] text-[#8A94B2] block">
                  Est. Duration
                </span>

                <p className="mt-1 text-[13px] font-bold text-[#14234B]">
                  15 – 20 min
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* =====================================================
            PARTICIPANTS
        ===================================================== */}

        <section
          className="
            rounded-[24px]
            border border-white/85
            bg-white/70
            backdrop-blur-[24px]
            shadow-[0_12px_40px_rgba(15,23,42,0.05)]
            p-6
          "
        >

          <div className="flex items-center justify-between mb-4">

            <div>
              <h2 className="text-[15px] font-bold text-[#14234B]">
                Participants
                <span className="ml-1.5 text-[11px] font-normal text-[#7B86A5]">
                  ({configuredAgents.length} Primary Agents)
                </span>
              </h2>
            </div>

            <button
              className="
                flex items-center gap-1.5
                text-[11px]
                font-semibold
                text-[#3867F6]
                hover:text-[#244FD5]
              "
            >
              View Full Details
              <Eye size={13} />
            </button>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

            {configuredAgents.slice(0, selectedScenario?.defaultAgents?.length || 2).map((agent, index) => {
              const theme = getAgentTheme(index);
              const isHuman = selectedMode === 'human-ai' && (
                (humanRole === 'buyer' && index === 0) ||
                (humanRole === 'vendor' && index === 1) ||
                (humanRole === 'recruiter' && index === 0) ||
                (humanRole === 'candidate' && index === 1) ||
                (humanRole === 'department-head' && index === 0) ||
                (humanRole === 'project-manager' && index === 1) ||
                (humanRole === 'finance-director' && index === 2)
              );

              return (
                <div
                  key={agent.id}
                  className="
                    rounded-[20px]
                    border border-white/70
                    bg-white/58
                    backdrop-blur-[20px]
                    p-5
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-[0_8px_32px_rgba(15,23,42,0.03)]
                  "
                >
                  {/* Agent header */}
                  <div className="flex items-center gap-3 pb-4 border-b border-[#E8ECF4] relative">
                    <div
                      className={`
                        w-11 h-11 rounded-full
                        ${theme.bg}
                        ${theme.icon}
                        flex items-center justify-center font-bold text-xs uppercase
                      `}
                    >
                      {agent.avatar || (
                        index === 0 ? (
                          <BriefcaseBusiness size={18} />
                        ) : index === 1 ? (
                          <Users size={18} />
                        ) : (
                          <BarChart3 size={18} />
                        )
                      )}
                    </div>

                    <div className="min-w-0 pr-10">
                      <p className="text-[13px] font-bold text-[#14234B] truncate">
                        {isHuman ? 'You (Human Player)' : agent.name}
                      </p>

                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`
                            inline-flex
                            px-2 py-0.5
                            rounded-full
                            border
                            text-[9px]
                            font-semibold
                            ${theme.badge}
                          `}
                        >
                          {agent.role}
                        </span>
                        {selectedMode === 'human-ai' && (
                          <span
                            className={`
                              inline-flex
                              px-2 py-0.5
                              rounded-full
                              text-[9px]
                              font-semibold
                              ${isHuman ? 'bg-orange-50 text-orange-600 border border-orange-200' : 'bg-blue-50 text-blue-600 border border-blue-200'}
                            `}
                          >
                            {isHuman ? 'Human' : 'AI Opponent'}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate('/setup/agents')}
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold text-[#3867F6] bg-[#3867F6]/5 hover:bg-[#3867F6]/10 rounded-full border border-[#3867F6]/20 transition-all cursor-pointer shadow-sm"
                      title={isHuman ? 'Change Role' : `Edit ${agent.name} Details`}
                    >
                      <Pencil size={10} />
                      Edit
                    </button>
                  </div>

                  {/* Personality */}
                  <div className="pt-3 pb-3 border-b border-[#E8ECF4]">
                    <span className="text-[10px] text-[#8A94B2]">
                      Personality
                    </span>

                    <div className="mt-1">
                      <span
                        className={`
                          inline-flex
                          px-2.5 py-1
                          rounded-full
                          text-[10px]
                          font-semibold
                          ${isHuman
                            ? 'bg-slate-100 text-slate-700'
                            : agent.personality === 'Aggressive'
                              ? 'bg-orange-50 text-orange-600'
                              : agent.personality === 'Collaborative'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-emerald-50 text-emerald-600'
                          }
                        `}
                      >
                        {isHuman ? 'Human Controlled (Real-Time)' : agent.personality}
                      </span>
                    </div>
                  </div>

                  {/* Primary Goal */}
                  <div className="py-3 border-b border-[#E8ECF4]">
                    <span className="text-[10px] font-semibold text-[#14234B]">
                      Primary Goal
                    </span>

                    <p className="mt-1 text-[11px] text-[#64719A] leading-relaxed">
                      {isHuman
                        ? 'Negotiate directly in real-time practice arena'
                        : agent.goals[0]?.text || 'Complete negotiation cycle successfully'}
                    </p>
                  </div>

                  {/* Constraints */}
                  <div className="pt-3">
                    <span className="text-[10px] font-semibold text-[#14234B]">
                      Key Constraints
                    </span>

                    <div className="mt-2 space-y-1.5">
                      {isHuman ? (
                        <div className="flex items-start gap-1.5 text-[10px] text-[#64719A]">
                          <Check size={12} className="text-[#3867F6] mt-0.5 shrink-0" />
                          <span>Driven by your real-time decisions</span>
                        </div>
                      ) : (
                        agent.constraints.slice(0, 2).map((constraint) => {
                          const labelLower = (constraint.label || '').toLowerCase();
                          const isPrivateBoundary = (
                            labelLower.includes('budget') ||
                            labelLower.includes('price') ||
                            labelLower.includes('salary') ||
                            labelLower.includes('allocation') ||
                            labelLower.includes('cap') ||
                            labelLower.includes('floor') ||
                            labelLower.includes('margin')
                          );

                          return (
                            <div
                              key={constraint.id}
                              className="flex items-start gap-1.5 text-[10px] text-[#64719A]"
                            >
                              <Check
                                size={12}
                                className="text-[#3867F6] mt-0.5 shrink-0"
                              />

                              <span>
                                {constraint.label}: {isPrivateBoundary ? '[Confidential (Private)]' : constraint.value}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </section>

        {/* =====================================================
            WHAT HAPPENS NEXT
        ===================================================== */}

        <section
          className="
            rounded-[22px]
            border border-white/90
            bg-white/65
            backdrop-blur-xl
            shadow-[0_12px_35px_rgba(40,65,120,0.06)]
            px-5 sm:px-6
            py-5
            flex flex-col lg:flex-row
            items-center
            justify-between
            gap-5
            overflow-hidden
          "
        >

          <div className="flex items-start gap-4 max-w-3xl">

            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Rocket size={19} />
            </div>

            <div>

              <h3 className="text-[14px] font-bold text-[#14234B]">
                What happens next?
              </h3>

              <p className="mt-1.5 text-[11px] sm:text-[12px] text-[#64719A] leading-relaxed">
                Once you start the negotiation, your AI agents will begin
                interacting based on their goals, constraints and
                personalities. Watch the negotiation unfold in real-time and
                analyze the outcome after the session.
              </p>

            </div>

          </div>

          {/* Decorative negotiation bubbles */}

          <div className="hidden lg:flex items-center gap-2 shrink-0 opacity-80">

            <div className="w-14 h-10 rounded-[16px] rounded-br-sm bg-blue-100 border border-blue-200 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-200" />
            </div>

            <div className="w-14 h-10 rounded-[16px] rounded-bl-sm bg-orange-100 border border-orange-200 flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-orange-200" />
            </div>

          </div>

        </section>

        {/* =====================================================
            BOTTOM NAVIGATION
        ===================================================== */}

        <div className="flex items-center justify-between px-1 pb-3">

          <button
            onClick={() => navigate('/setup/goals')}
            className="
              flex items-center gap-2
              px-5 py-2.5
              rounded-full
              border border-[#D9E1F1]
              bg-white/70
              backdrop-blur-md
              text-[12px]
              font-semibold
              text-[#14234B]
              hover:bg-white
              transition-all
              shadow-sm
            "
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <div className="flex items-center gap-3">
            {!reviewConfirmed ? (
              <button
                onClick={handleConfirmReview}
                disabled={isSubmittingReview}
                className="
                  flex items-center gap-2
                  px-6 py-3
                  rounded-full
                  bg-[#10B981]
                  text-white
                  text-[12px]
                  font-semibold
                  shadow-[0_8px_20px_rgba(16,185,129,0.25)]
                  hover:bg-[#059669]
                  transition-all
                  disabled:opacity-50
                "
              >
                <Check size={15} />
                {isSubmittingReview ? 'Confirming...' : 'Confirm Setup Review'}
              </button>
            ) : (
              <button
                onClick={handleStartNegotiation}
                className="
                  flex items-center gap-2
                  px-6 py-3
                  rounded-full
                  bg-[#3867F6]
                  text-white
                  text-[12px]
                  font-semibold
                  shadow-[0_8px_20px_rgba(56,103,246,0.25)]
                  hover:bg-[#2F5CE8]
                  hover:shadow-[0_10px_25px_rgba(56,103,246,0.32)]
                  transition-all
                "
              >
                Start Negotiation
                <Play size={14} fill="currentColor" />
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default ReviewConfirmScreen;