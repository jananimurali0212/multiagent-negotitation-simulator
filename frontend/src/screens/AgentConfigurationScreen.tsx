import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Agent } from '../store/useStore';
import {
  ArrowLeft,
  ShieldAlert,
  ChevronRight,
  Users,
  Clock,
  BookOpen,
  UserRound,
  BriefcaseBusiness,
  BarChart3,
  Zap,
  Shield,
  Check,
  RotateCcw,
} from 'lucide-react';
import { negotiationApi } from '../lib/api';

const PRIMARY = '#1E2230';
const ACCENT = '#3B82F6';
const TERRACOTTA = '#C86D51';
const TEXT = '#0F172A';
const MUTED = '#64748B';

export const GOAL_PRESETS: Record<string, string[]> = {
  'vendor-pricing-vendor': [
    'Maximize Sale Value & Total Contract Price',
    'Protect Profit Margin & Minimize Discounting',
    'Secure Long-Term Multi-Year Contract Commitment',
    'Increase Order Volume & Tiered Units',
    'Improve Payment Terms (Upfront / Net 15)',
    'Retain Strategic Enterprise Customer',
    'Reduce Delivery & SLA Liability Risk',
    'Increase Annual Recurring Revenue (ARR)',
    'Protect Service & Engineering Support Capacity',
    'Expand Account Value & Cross-Sell Opportunities',
    'Improve Contract Predictability & Renewal Terms',
    'Secure Minimum Order Quantity (MOQ) Commitment',
    'Other'
  ],
  'vendor-pricing-buyer': [
    'Minimize Total Cost of Ownership (TCO)',
    'Stay Well Within Approved Annual Budget',
    'Maximize Total Deal Value & Included Services',
    'Secure Expedited Delivery & Deployment Schedule',
    'Ensure Premium Quality & Performance Standards',
    'Extend Product Warranty & Coverage Duration',
    'Secure Premium 24/7 SLA Support at Standard Rates',
    'Secure Flexible Payment Terms (Net 60/90)',
    'Reduce Supplier & Single-Vendor Dependence',
    'Avoid Vendor Lock-In & Preserve Flexibility',
    'Secure Tiered Volume Discount Milestones',
    'Secure Favorable Contract Exit & Termination Rights',
    'Other'
  ],
  'job-offer-recruiter': [
    'Close Candidate Within Approved Salary Band Budget',
    'Fill Open Position Quickly to Support Team Operations',
    'Secure Candidate Acceptance on Initial Offer',
    'Maintain Strict Corporate Compensation Policy & Equity Bands',
    'Balance Salary with Attractive Performance Bonuses & Perks',
    'Reduce Early Attrition & Hiring Risk',
    'Meet Departmental Quarterly Hiring Deadlines',
    'Protect Internal Pay Equity Across Equivalent Roles',
    'Secure Critical High-Demand Technical Skills',
    'Improve Overall Offer Package Competitiveness',
    'Maintain Designated Role Seniority Level & Title',
    'Optimize Total Compensation Structure',
    'Other'
  ],
  'job-offer-candidate': [
    'Maximize Base Salary Offer',
    'Maximize Total Annual Compensation Package',
    'Improve Performance & Sign-On Bonus Terms',
    'Increase Equity & Stock Option Grant Units',
    'Secure Premium Health, Retirement & Wellness Benefits',
    'Secure Full Remote or Flexible Work Schedule',
    'Improve Work Schedule Flexibility & Core Hours',
    'Expand Role Scope, Responsibility & Title Seniority',
    'Ensure Accelerated Career Growth & Promotion Pathway',
    'Secure Preferred Work Location',
    'Improve Overall Work-Life Balance & Time Off',
    'Secure Dedicated Professional Development & Training Budget',
    'Other'
  ],
  'budget-allocation-project-manager': [
    'Secure Sufficient Operating Budget for Full Delivery',
    'Protect Complete Project Scope & Feature Set',
    'Meet Target Milestone & Product Launch Deadlines',
    'Secure Dedicated Key Specialist & Engineering Resources',
    'Protect High-Priority Deliverables & Core Modules',
    'Reduce Schedule Slippage & Delivery Timeline Risk',
    'Maintain High Quality & Defect-Free Standards',
    'Secure Adequate Financial Contingency Buffer (15%+)',
    'Protect Technical Architecture & Server Infrastructure Needs',
    'Fulfill All Key Stakeholder Delivery Commitments',
    'Other'
  ],
  'budget-allocation-finance-manager': [
    'Keep Total Spending Within Approved Budget Cap',
    'Optimize Resource & Capital Expense Spending',
    'Reduce Unnecessary & Non-Essential Costs',
    'Improve Fiscal Year Budget Utilization Efficiency',
    'Protect Against Financial Overruns & Unexpected Expenses',
    'Maintain Healthy Emergency Reserve Fund',
    'Maximize Return on Investment (ROI) & Profitability',
    'Control External Contractor & Consulting Fees',
    'Reduce Budget Allocation Variance Across Teams',
    'Balance Budget Allocations Fairly Across Departments',
    'Other'
  ],
  'budget-allocation-department-head': [
    'Secure Maximum Departmental Budget Share',
    'Protect Strategic Operational Priorities & Core Programs',
    'Maintain Full Team Capacity & Key Staff Retention',
    'Fund High-Impact Strategic Growth Initiatives',
    'Improve Departmental Capability & Technology Tools',
    'Secure Advanced Technology & Infrastructure Resources',
    'Protect High Service Quality & Uptime Performance SLAs',
    'Achieve Key Departmental Objectives & OKRs',
    'Support Long-Term Department Growth Initiatives',
    'Protect Business Continuity & Operational Resilience',
    'Other'
  ]
};

GOAL_PRESETS['budget-allocation-department head'] = GOAL_PRESETS['budget-allocation-department-head'];
GOAL_PRESETS['budget-allocation-project manager'] = GOAL_PRESETS['budget-allocation-project-manager'];
GOAL_PRESETS['budget-allocation-finance manager'] = GOAL_PRESETS['budget-allocation-finance-manager'];

export const CONSTRAINT_PRESETS: Record<string, string[]> = {
  'vendor-pricing-vendor': [
    'Minimum Price Floor (Cannot Sell Below Base Cost)',
    'Minimum Margin Requirement',
    'Maximum Discount Limit (Max 15%)',
    'Minimum Order Quantity (MOQ) Requirement',
    'Minimum Contract Duration (1 Year Minimum)',
    'Maximum Payment Delay (Net 30 Max)',
    'Production & Manufacturing Capacity Limit',
    'Delivery & Onboarding Timeline Capacity',
    'Warranty Coverage Limit',
    'Support & SLA Engineering Allocation Limit',
    'Corporate Legal & Compliance Contract Policy',
    'Other'
  ],
  'vendor-pricing-buyer': [
    'Maximum Approved Annual Budget Cap',
    'Maximum Acceptable Price Floor',
    'Required Delivery & Deployment Deadline',
    'Minimum Quality & Performance Threshold',
    'Minimum Required Warranty Coverage',
    'Maximum Payment Period (Net 45 Minimum)',
    'Corporate Procurement & Vendor Policy',
    'Executive Financial Approval Limit',
    'Mandatory Security & Compliance Certifications',
    'Maximum Acceptable Supplier Risk Rating',
    'Contract Indemnification & Liability Limit',
    'Other'
  ],
  'job-offer-recruiter': [
    'Maximum Approved Salary Band Cap',
    'Corporate Compensation Policy & Grade Limits',
    'Headcount & Operational Hiring Budget Ceiling',
    'Strict Hiring & Onboarding Deadline',
    'Internal Pay Equity Constraint Across Team',
    'Approved Benefits & Relocation Package Cap',
    'Fixed Role Level & Title Grade Hierarchy',
    'Mandatory Required Technical Skill Qualifications',
    'Executive Approval Threshold for Special Packages',
    'Office Co-Location Requirement',
    'Other'
  ],
  'job-offer-candidate': [
    'Minimum Acceptable Base Salary Floor',
    'Minimum Required Total Compensation Threshold',
    'Mandatory Health Insurance & Coverage Benefits',
    'Joining Availability & Notice Period Deadline',
    'Geographic Location & Commute Limits',
    'Remote / Hybrid Schedule Requirement',
    'Minimum Acceptable Seniority Title & Level',
    'Minimum Equity / Stock Option Units',
    'Notice Period Constraint with Current Employer',
    'Travel & Relocation Limitation',
    'Other'
  ],
  'budget-allocation-project-manager': [
    'Minimum Required Operating Budget Floor',
    'Critical Launch & Milestone Deadline',
    'Minimum Required Staffing & Specialist Count',
    'Mandatory Product Feature Scope',
    'Minimum Quality & Testing Benchmark',
    'Minimum Contingency Buffer Requirement',
    'Critical Third-Party Technology & API Dependency',
    'Regulatory & Compliance Statutory Requirement',
    'Other'
  ],
  'budget-allocation-finance-manager': [
    'Maximum Approved Budget Ceiling',
    'Department Fiscal Budget Allocation Cap',
    'Single-Project Approval Expenditure Limit',
    'Corporate Financial & Expense Policy',
    'Required Emergency Reserve Buffer (15% Min)',
    'Minimum Return on Investment (ROI) Benchmark',
    'Fiscal-Year Budget Spending Rollover Limit',
    'Cash-Flow & Quarterly Expenditure Ceiling',
    'Other'
  ],
  'budget-allocation-department-head': [
    'Minimum Department Operational Budget Ceiling',
    'Mandatory Operational & Facility Expenses',
    'Required Team Headcount & Capacity',
    'Service-Level Agreement (SLA) Requirement',
    'Critical Resource & License Requirement',
    'Department Project Execution Deadline',
    'Cross-Team Operational Dependency',
    'Minimum Funding Requirement for Active Programs',
    'Other'
  ]
};

CONSTRAINT_PRESETS['budget-allocation-department head'] = CONSTRAINT_PRESETS['budget-allocation-department-head'];
CONSTRAINT_PRESETS['budget-allocation-project manager'] = CONSTRAINT_PRESETS['budget-allocation-project-manager'];
CONSTRAINT_PRESETS['budget-allocation-finance manager'] = CONSTRAINT_PRESETS['budget-allocation-finance-manager'];

export const AgentConfigurationScreen: React.FC = () => {
  const navigate = useNavigate();

  const {
    selectedScenario,
    configuredAgents,
    updateAgentConfig,
    selectedMode,
    humanRole,
    setHumanRole,
  } = useStore();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [continueAttempted, setContinueAttempted] = useState(false);

  // State to track goal and constraint dropdown selections vs custom inputs per agent
  const [selectedGoalOption, setSelectedGoalOption] = useState<Record<string, string>>({});
  const [selectedConstraintOption, setSelectedConstraintOption] = useState<Record<string, string>>({});

  const expectedCount = selectedScenario?.defaultAgents?.length || 2;
  const activeAgents = configuredAgents.slice(0, expectedCount);

  const getPresetKey = (role: string) => {
    const r = (role || '').toLowerCase().replace(/[\s_-]+/g, '-');
    const scenarioId = selectedScenario?.id || 'job-offer';
    if (scenarioId === 'job-offer') {
      if (r.includes('recruiter') || r.includes('hr')) return 'job-offer-recruiter';
      if (r.includes('candidate') || r.includes('dev')) return 'job-offer-candidate';
    }
    if (scenarioId === 'vendor-pricing') {
      if (r.includes('buyer')) return 'vendor-pricing-buyer';
      if (r.includes('vendor')) return 'vendor-pricing-vendor';
    }
    if (scenarioId === 'budget-allocation') {
      if (r.includes('department') || r.includes('dept') || r.includes('head')) return 'budget-allocation-department-head';
      if (r.includes('project') || r.includes('pm') || r.includes('manager')) return 'budget-allocation-project-manager';
      if (r.includes('finance') || r.includes('financial')) return 'budget-allocation-finance-manager';
    }
    return `${scenarioId}-${r}`;
  };

  // Auto-set default humanRole in human-ai mode if not set
  useEffect(() => {
    if (selectedMode === 'human-ai' && !humanRole) {
      if (selectedScenario?.id === 'job-offer') {
        setHumanRole('candidate');
      } else if (selectedScenario?.id === 'vendor-pricing') {
        setHumanRole('buyer');
      } else if (selectedScenario?.id === 'budget-allocation') {
        setHumanRole('department-head');
      }
    }
  }, [selectedMode, humanRole, selectedScenario, setHumanRole]);

  // Ensure agent roles & names are fixed automatically based on scenario & position
  useEffect(() => {
    if (!selectedScenario) return;
    activeAgents.forEach((agent, index) => {
      let fixedRole = agent.role;
      let defaultName = agent.name;
      if (selectedScenario.id === 'job-offer') {
        fixedRole = index === 0 ? 'Recruiter' : 'Candidate';
        defaultName = index === 0 ? 'Recruiter Agent' : 'Candidate Agent';
      } else if (selectedScenario.id === 'vendor-pricing') {
        fixedRole = index === 0 ? 'Buyer' : 'Vendor';
        defaultName = index === 0 ? 'Buyer Agent' : 'Vendor Agent';
      } else if (selectedScenario.id === 'budget-allocation') {
        fixedRole = index === 0 ? 'Department Head' : index === 1 ? 'Project Manager' : 'Finance Manager';
        defaultName = index === 0 ? 'Department Head Agent' : index === 1 ? 'Project Manager Agent' : 'Finance Manager Agent';
      }
      if (agent.role !== fixedRole || agent.name !== defaultName) {
        updateAgentConfig(agent.id, { role: fixedRole, name: defaultName });
      }

      // NO DEFAULT SELECTION: Dropdowns start unselected as "" ("Select Primary Goal" / "Select Key Constraint")
      if (selectedGoalOption[agent.id] === undefined) {
        if (agent.selectedGoalOption !== undefined) {
          setSelectedGoalOption(prev => ({ ...prev, [agent.id]: agent.selectedGoalOption || '' }));
        } else {
          const currentGoal = agent.goals?.[0]?.text || '';
          const presetKey = getPresetKey(fixedRole);
          const goalPresets = GOAL_PRESETS[presetKey] || ['Other'];
          if (goalPresets.includes(currentGoal)) {
            setSelectedGoalOption(prev => ({ ...prev, [agent.id]: currentGoal }));
          } else if (currentGoal) {
            setSelectedGoalOption(prev => ({ ...prev, [agent.id]: 'Other' }));
          } else {
            setSelectedGoalOption(prev => ({ ...prev, [agent.id]: '' }));
          }
        }
      }

      if (selectedConstraintOption[agent.id] === undefined) {
        if (agent.selectedConstraintOption !== undefined) {
          setSelectedConstraintOption(prev => ({ ...prev, [agent.id]: agent.selectedConstraintOption || '' }));
        } else {
          const currentConstraint = agent.constraints?.[0]?.value || '';
          const presetKey = getPresetKey(fixedRole);
          const constraintPresets = CONSTRAINT_PRESETS[presetKey] || ['Other'];
          if (constraintPresets.includes(currentConstraint)) {
            setSelectedConstraintOption(prev => ({ ...prev, [agent.id]: currentConstraint }));
          } else if (currentConstraint) {
            setSelectedConstraintOption(prev => ({ ...prev, [agent.id]: 'Other' }));
          } else {
            setSelectedConstraintOption(prev => ({ ...prev, [agent.id]: '' }));
          }
        }
      }
    });
  }, [selectedScenario, configuredAgents]);

  const isAgentHuman = (index: number) => {
    if (selectedMode !== 'human-ai') return false;
    if (selectedScenario?.id === 'vendor-pricing') {
      return (humanRole === 'buyer' && index === 0) || (humanRole === 'vendor' && index === 1);
    }
    if (selectedScenario?.id === 'job-offer') {
      return (humanRole === 'recruiter' && index === 0) || (humanRole === 'candidate' && index === 1);
    }
    if (selectedScenario?.id === 'budget-allocation') {
      return (
        (humanRole === 'department-head' && index === 0) ||
        (humanRole === 'project-manager' && index === 1) ||
        (humanRole === 'finance-director' && index === 2)
      );
    }
    return false;
  };

  const displayAgents = selectedMode === 'human-ai'
    ? activeAgents.filter((_, index) => !isAgentHuman(index))
    : activeAgents;

  const validateAgents = (agentsToValidate: typeof activeAgents) => {
    const errors: Record<string, string> = {};
    agentsToValidate.forEach((agent) => {
      const originalIndex = activeAgents.findIndex(a => a.id === agent.id);
      const isHuman = isAgentHuman(originalIndex);
      if (selectedMode === 'human-ai' && isHuman) return;

      if (!agent?.personality) {
        errors[`personality-${agent.id}`] = 'Personality is required.';
      }

      const goalOpt = selectedGoalOption[agent.id];
      const primaryGoalText = agent?.goals?.[0]?.text || '';
      if (!goalOpt || goalOpt === 'Select Primary Goal' || (goalOpt === 'Other' && !primaryGoalText.trim())) {
        errors[`goal-${agent.id}`] = 'Primary Goal is required.';
      }

      const constraintOpt = selectedConstraintOption[agent.id];
      const constraintText = agent?.constraints?.[0]?.value || '';
      if (!constraintOpt || constraintOpt === 'Select Key Constraint' || (constraintOpt === 'Other' && !constraintText.trim())) {
        errors[`constraint-${agent.id}`] = 'Key Constraint is required.';
      }
    });
    return errors;
  };

  const currentErrors = validateAgents(displayAgents);
  const isFormValid = Object.keys(currentErrors).length === 0;

  const handleContinue = async () => {
    setContinueAttempted(true);

    const errors = validateAgents(displayAgents);

    if (Object.keys(errors).length > 0) {
      setErrorMsg('Please complete all required fields before continuing.');
      setTimeout(() => {
        const firstKey = Object.keys(errors)[0];
        const el = document.querySelector(`[data-field-id="${firstKey}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const input = el.querySelector('input, textarea, select') as HTMLElement | null;
          input?.focus();
        }
      }, 50);
      return;
    }

    setErrorMsg(null);

    // Immediate session persistence with idempotency
    try {
      const agentsPayload = displayAgents.map((a: any) => ({
        agent_template_id: a.id || `agent-${Math.random()}`,
        avatar: a.avatar || a.name?.slice(0, 2).toUpperCase() || 'AG',
        name: a.name,
        role: a.role,
        personality: a.personality,
        experience: a.experience || 'Intermediate',
        negotiation_parameters: a.negotiation_parameters || {},
        goals: (a.goals || []).map((g: any) => ({ text: g.text, priority: g.priority || 'High' })),
        constraints: (a.constraints || []).map((c: any) => ({ label: c.label, value: c.value })),
      }));

      const { activeSessionId, setActiveSessionId, setActiveSessionStatus, selectedScenario, selectedMode, humanRole } = useStore.getState();

      if (!activeSessionId) {
        const session = await negotiationApi.createSession({
          scenario_id: selectedScenario?.id || 'vendor-pricing',
          mode: selectedMode || 'ai-ai',
          human_role: humanRole || undefined,
          agents: agentsPayload,
        });
        if (session && session.id) {
          setActiveSessionId(session.id);
          setActiveSessionStatus(session.status || 'setup');
        }
      } else {
        await negotiationApi.updateAgents(activeSessionId, agentsPayload);
      }
    } catch (err) {
      console.warn('Backend session auto-save note:', err);
    }

    navigate('/setup/goals');
  };

  const handleReset = () => {
    if (!selectedScenario) return;
    // Reset agent fields to default values for the selected scenario without touching session ID, scenario, or mode
    selectedScenario.defaultAgents.forEach((defAgent: any) => {
      updateAgentConfig(defAgent.id, {
        name: defAgent.name || '',
        role: defAgent.role || '',
        personality: defAgent.personality || 'Collaborative',
        experience: defAgent.experience || 'Intermediate',
      });
    });
    setErrorMsg(null);
    setContinueAttempted(false);
  };

  const updatePrimaryGoal = (agentId: string, text: string) => {
    const agent = configuredAgents.find(a => a.id === agentId);
    if (!agent) return;
    if (agent.goals && agent.goals.length > 0) {
      const { updateAgentGoal } = useStore.getState();
      updateAgentGoal(agentId, agent.goals[0].id, { text });
    } else {
      updateAgentConfig(agentId, {
        goals: [{ id: 'g1', text, priority: 'High' }]
      });
    }
  };

  const updateKeyConstraint = (agentId: string, value: string) => {
    const agent = configuredAgents.find(a => a.id === agentId);
    if (!agent) return;
    if (agent.constraints && agent.constraints.length > 0) {
      const { updateAgentConstraint } = useStore.getState();
      updateAgentConstraint(agentId, agent.constraints[0].id, { value });
    } else {
      updateAgentConfig(agentId, {
        constraints: [{ id: 'c1', label: 'Primary Constraint', value }]
      });
    }
  };

  const handlePersonalityChange = (agentId: string, value: Agent['personality']) => {
    updateAgentConfig(agentId, { personality: value });
  };

  const getAgentVisual = (index: number) => {
    if (index === 0) {
      return { icon: UserRound, iconColor: ACCENT, iconBg: 'rgba(59,130,246,0.10)' };
    }
    if (index === 1) {
      return { icon: BriefcaseBusiness, iconColor: TERRACOTTA, iconBg: 'rgba(200,109,81,0.10)' };
    }
    return { icon: BarChart3, iconColor: '#16A36A', iconBg: 'rgba(22,163,106,0.10)' };
  };

  const getPersonalityVisual = (
    personality: Agent['personality'],
    type: 'Aggressive' | 'Collaborative' | 'Risk-Averse'
  ) => {
    const active = personality === type;
    if (type === 'Aggressive') {
      return { active, color: TERRACOTTA, background: 'rgba(200,109,81,0.10)', icon: Zap };
    }
    if (type === 'Collaborative') {
      return { active, color: ACCENT, background: 'rgba(59,130,246,0.10)', icon: Users };
    }
    return { active, color: '#7C3AED', background: 'rgba(124,58,237,0.09)', icon: Shield };
  };

  if (!selectedScenario) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[24px] p-8 text-center bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl">
          <ShieldAlert size={44} className="mx-auto mb-4 text-orange-600" />
          <h3 className="text-lg font-bold text-slate-900">No Scenario Selected</h3>
          <p className="mt-2 text-sm text-slate-600">Please select a negotiation scenario before configuring agents.</p>
          <button
            onClick={() => navigate('/setup/scenario')}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md cursor-pointer"
          >
            Select Scenario <ChevronRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      <section className="relative z-10 mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[22px] sm:text-[26px] lg:text-[29px] font-bold tracking-[-0.02em] leading-tight text-slate-900">
            {selectedMode === 'human-ai'
              ? 'Configure AI Opponent Agent'
              : `Configure Negotiation Agents (${activeAgents.length} Participants)`}
          </h1>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-slate-500">
            {selectedMode === 'human-ai'
              ? 'Select the role you want to play, then configure your AI opponent agent details.'
              : 'Agent roles are fixed automatically based on your selected scenario. Select context-aware primary goals, key constraints, and personalities.'}
          </p>
        </div>
      </section>

      <section className="relative z-10 grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,2.8fr)_minmax(320px,0.85fr)]">
        <div className="rounded-[24px] border border-white/80 bg-white/60 backdrop-blur-2xl p-6 md:p-8 shadow-sm">
          {/* HUMAN ROLE SELECTOR CARD */}
          {selectedMode === 'human-ai' && (
            <div className="mb-6 p-5 rounded-[22px] border border-blue-200/80 bg-blue-50/50 backdrop-blur-xl shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <UserRound className="text-blue-600" size={18} />
                <h3 className="text-sm font-bold text-slate-900">Select Your Role</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                Choose the role you will play in this negotiation. You will configure only the AI Opponent Agent below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedScenario.id === 'job-offer' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHumanRole('candidate')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        humanRole === 'candidate' || !humanRole
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Candidate (Job Seeker)</span>
                        {(humanRole === 'candidate' || !humanRole) && <Check size={14} />}
                      </div>
                      <div className={`text-[10px] mt-1.5 ${humanRole === 'candidate' || !humanRole ? 'text-blue-100' : 'text-slate-500'}`}>
                        You play as Candidate. Opponent: AI Recruiter.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHumanRole('recruiter')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        humanRole === 'recruiter'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Recruiter / Employer</span>
                        {humanRole === 'recruiter' && <Check size={14} />}
                      </div>
                      <div className={`text-[10px] mt-1.5 ${humanRole === 'recruiter' ? 'text-blue-100' : 'text-slate-500'}`}>
                        You play as Employer. Opponent: AI Candidate.
                      </div>
                    </button>
                  </>
                )}

                {selectedScenario.id === 'vendor-pricing' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHumanRole('buyer')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        humanRole === 'buyer' || !humanRole
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Buyer</span>
                        {(humanRole === 'buyer' || !humanRole) && <Check size={14} />}
                      </div>
                      <div className={`text-[10px] mt-1.5 ${humanRole === 'buyer' || !humanRole ? 'text-blue-100' : 'text-slate-500'}`}>
                        You play as Buyer. Opponent: AI Vendor.
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHumanRole('vendor')}
                      className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        humanRole === 'vendor'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>Vendor</span>
                        {humanRole === 'vendor' && <Check size={14} />}
                      </div>
                      <div className={`text-[10px] mt-1.5 ${humanRole === 'vendor' ? 'text-blue-100' : 'text-slate-500'}`}>
                        You play as Vendor. Opponent: AI Buyer.
                      </div>
                    </button>
                  </>
                )}

                {selectedScenario.id === 'budget-allocation' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setHumanRole('department-head')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        humanRole === 'department-head' || !humanRole
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">Department Head</div>
                      <div className={`text-[10px] mt-1 ${humanRole === 'department-head' || !humanRole ? 'text-blue-100' : 'text-slate-500'}`}>You play as Department Head</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHumanRole('project-manager')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        humanRole === 'project-manager'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">Project Manager</div>
                      <div className={`text-[10px] mt-1 ${humanRole === 'project-manager' ? 'text-blue-100' : 'text-slate-500'}`}>You play as Project Manager</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHumanRole('finance-director')}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        humanRole === 'finance-director'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      <div className="font-bold text-xs">Finance Director</div>
                      <div className={`text-[10px] mt-1 ${humanRole === 'finance-director' ? 'text-blue-100' : 'text-slate-500'}`}>You play as Finance Director</div>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {continueAttempted && !isFormValid && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse"></span>
              {errorMsg || 'Please complete all required fields before continuing.'}
            </div>
          )}

          <div className="space-y-6">
            {displayAgents.map((agent) => {
              const index = activeAgents.findIndex(a => a.id === agent.id);
              const visual = getAgentVisual(index);
              const AgentIcon = visual.icon;
              const isHuman = isAgentHuman(index);

              const aggressive = getPersonalityVisual(agent.personality, 'Aggressive');
              const collaborative = getPersonalityVisual(agent.personality, 'Collaborative');
              const riskAverse = getPersonalityVisual(agent.personality, 'Risk-Averse');

              const isGoalInvalid = continueAttempted && !!currentErrors[`goal-${agent.id}`];
              const isConstraintInvalid = continueAttempted && !!currentErrors[`constraint-${agent.id}`];

              const presetKey = getPresetKey(agent.role);
              const goalOptions = GOAL_PRESETS[presetKey] || ['Other'];
              const constraintOptions = CONSTRAINT_PRESETS[presetKey] || ['Other'];

              const selectedGoal = selectedGoalOption[agent.id] !== undefined
                ? selectedGoalOption[agent.id]
                : (goalOptions.includes(agent.goals?.[0]?.text || '') ? agent.goals?.[0]?.text : (agent.goals?.[0]?.text ? 'Other' : ''));
              const selectedConstraint = selectedConstraintOption[agent.id] !== undefined
                ? selectedConstraintOption[agent.id]
                : (constraintOptions.includes(agent.constraints?.[0]?.value || '') ? agent.constraints?.[0]?.value : (agent.constraints?.[0]?.value ? 'Other' : ''));

              return (
                <div
                  key={agent.id}
                  className="group relative overflow-hidden rounded-[22px] p-6 border border-slate-200 bg-white/70 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border"
                        style={{ background: visual.iconBg, borderColor: `${visual.iconColor}33` }}
                      >
                        <AgentIcon size={20} style={{ color: visual.iconColor }} />
                      </div>
                      <div>
                        {/* PREDEFINED NON-EDITABLE AGENT NAME HEADING */}
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                            {agent.name || `${agent.role} Agent`}
                          </span>
                          {selectedMode === 'human-ai' ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                              AI Opponent
                            </span>
                          ) : isHuman ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                              You (Human Player)
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Role and Agent Name are predefined for this scenario.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    {/* PRIMARY GOAL DROPDOWN & CUSTOM INPUT */}
                    <div data-field-id={`goal-${agent.id}`} className="space-y-2">
                      <label className={`text-[10px] font-bold uppercase tracking-wider block ${isGoalInvalid ? 'text-red-500' : 'text-slate-600'}`}>
                        Primary Goal *
                      </label>
                      <select
                        value={selectedGoal}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedGoalOption(prev => ({ ...prev, [agent.id]: val }));
                          updateAgentConfig(agent.id, { selectedGoalOption: val });
                          if (val !== '' && val !== 'Other') {
                            updatePrimaryGoal(agent.id, val);
                          } else {
                            updatePrimaryGoal(agent.id, '');
                          }
                        }}
                        className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-all ${
                          isGoalInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                      >
                        <option value="" disabled>Select Primary Goal</option>
                        {goalOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {/* REVEAL CUSTOM INPUT IF OTHER IS SELECTED */}
                      {selectedGoal === 'Other' && (
                        <div className="pt-1 animate-in fade-in duration-200">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Custom Primary Goal *
                          </label>
                          <textarea
                            value={agent.goals?.[0]?.text || ''}
                            onChange={(e) => updatePrimaryGoal(agent.id, e.target.value)}
                            placeholder="Enter your primary goal..."
                            className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all h-20 resize-none ${
                              isGoalInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                      )}
                      {isGoalInvalid && <p className="text-[9px] text-red-500 font-semibold mt-1">{currentErrors[`goal-${agent.id}`]}</p>}
                    </div>

                    {/* KEY CONSTRAINT DROPDOWN & CUSTOM INPUT */}
                    <div data-field-id={`constraint-${agent.id}`} className="space-y-2">
                      <label className={`text-[10px] font-bold uppercase tracking-wider block ${isConstraintInvalid ? 'text-red-500' : 'text-slate-600'}`}>
                        Key Constraint *
                      </label>
                      <select
                        value={selectedConstraint}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedConstraintOption(prev => ({ ...prev, [agent.id]: val }));
                          updateAgentConfig(agent.id, { selectedConstraintOption: val });
                          if (val !== '' && val !== 'Other') {
                            updateKeyConstraint(agent.id, val);
                          } else {
                            updateKeyConstraint(agent.id, '');
                          }
                        }}
                        className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer transition-all ${
                          isConstraintInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                        }`}
                      >
                        <option value="" disabled>Select Key Constraint</option>
                        {constraintOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>

                      {/* REVEAL CUSTOM INPUT IF OTHER IS SELECTED */}
                      {selectedConstraint === 'Other' && (
                        <div className="pt-1 animate-in fade-in duration-200">
                          <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Custom Key Constraint *
                          </label>
                          <textarea
                            value={agent.constraints?.[0]?.value || ''}
                            onChange={(e) => updateKeyConstraint(agent.id, e.target.value)}
                            placeholder="Enter your key constraint..."
                            className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all h-20 resize-none ${
                              isConstraintInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                            }`}
                          />
                        </div>
                      )}
                      {isConstraintInvalid && <p className="text-[9px] text-red-500 font-semibold mt-1">{currentErrors[`constraint-${agent.id}`]}</p>}
                    </div>
                  </div>

                  {!isHuman && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-2">
                        Personality *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <PersonalityButton
                          label="Aggressive"
                          visual={aggressive}
                          onClick={() => handlePersonalityChange(agent.id, 'Aggressive')}
                        />
                        <PersonalityButton
                          label="Collaborative"
                          visual={collaborative}
                          onClick={() => handlePersonalityChange(agent.id, 'Collaborative')}
                        />
                        <PersonalityButton
                          label="Risk-Averse"
                          visual={riskAverse}
                          onClick={() => handlePersonalityChange(agent.id, 'Risk-Averse')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-4">
          <GlassSummaryCard>
            <SummaryHeading icon={<BriefcaseBusiness size={16} />} title="Setup Summary" />
            <div className="mt-3 rounded-xl p-4 bg-white/50 border border-white">
              <p className="text-[10px] font-bold uppercase text-slate-400">Scenario</p>
              <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedScenario.title}</p>
              <p className="text-[10px] text-slate-500 mt-1">{selectedScenario.category} • {activeAgents.length} Agents</p>
            </div>
          </GlassSummaryCard>

          <GlassSummaryCard>
            <SummaryHeading icon={<Users size={16} />} title="Agent Roles" />
            <div className="mt-3 space-y-2">
              {activeAgents.map((agent, index) => (
                <div key={agent.id} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-b-0">
                  <span className="text-xs font-semibold text-slate-800">{agent.name || `Agent ${index + 1}`}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {agent.role}
                  </span>
                </div>
              ))}
            </div>
          </GlassSummaryCard>
        </aside>
      </section>

      {/* FOOTER & RESET & SAVE & CONTINUE BUTTONS */}
      <section className="relative z-10 mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/setup/mode')}
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft size={15} /> Back
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100/90 border border-slate-200 hover:bg-slate-200/80 shadow-xs transition-all cursor-pointer"
            title="Reset agent configuration fields"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>

        <button
          onClick={handleContinue}
          disabled={!isFormValid}
          className={`flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold transition-all border-none ${
            isFormValid
              ? 'bg-blue-600 text-white cursor-pointer hover:-translate-y-0.5 shadow-lg'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          Save & Continue
          <ChevronRight size={15} />
        </button>
      </section>
    </div>
  );
};

const PersonalityButton: React.FC<{
  label: string;
  visual: any;
  onClick: () => void;
}> = ({ label, visual, onClick }) => {
  const Icon = visual.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${
        visual.active ? 'border-blue-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
      }`}
      style={{
        background: visual.active ? visual.background : 'rgba(255,255,255,0.6)',
        color: visual.active ? visual.color : MUTED,
      }}
    >
      <Icon size={14} className="mb-1" />
      <span>{label}</span>
    </button>
  );
};

const GlassSummaryCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-[20px] border border-white/80 bg-white/60 backdrop-blur-xl p-5 shadow-sm">
    {children}
  </div>
);

const SummaryHeading: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
    <span className="text-blue-600">{icon}</span>
    <span>{title}</span>
  </div>
);

export default AgentConfigurationScreen;