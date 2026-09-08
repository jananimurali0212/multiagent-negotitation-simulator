import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { negotiationApi } from '../lib/api';
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Building2,
  DollarSign,
  Clock,
  Briefcase,
  Users,
  PieChart,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';

export const ScenarioDataFormScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    selectedScenario,
    selectedMode,
    humanRole,
    setHumanRole,
    personality,
    scenarioData,
    setScenarioData,
  } = useStore();

  const scenarioId = selectedScenario?.id || 'vendor-pricing';
  const isHumanAi = selectedMode === 'human-ai';

  // Role options per scenario
  const getRolesForScenario = () => {
    switch (scenarioId) {
      case 'vendor-pricing':
        return [
          { id: 'buyer', label: 'Buyer', desc: 'Negotiate price discount, SLA warranty, and payment terms' },
          { id: 'vendor', label: 'Vendor', desc: 'Defend margins, contract volume, and delivery schedule' },
        ];
      case 'job-offer':
        return [
          { id: 'candidate', label: 'Candidate', desc: 'Push for higher base salary, equity, and remote days' },
          { id: 'recruiter', label: 'Employer / Recruiter', desc: 'Balance talent acquisition with department budget caps' },
        ];
      case 'budget-allocation':
        return [
          { id: 'project-manager', label: 'Project Manager', desc: 'Advocate for core engineering and project delivery resources' },
          { id: 'finance-director', label: 'Finance Manager', desc: 'Maintain fiscal discipline, ROI accountability, and spending limits' },
          { id: 'department-head', label: 'Department Head', desc: 'Champion marketing initiatives and secure department resources' },
        ];
      default:
        return [
          { id: 'buyer', label: 'Participant 1', desc: 'Primary negotiator' },
          { id: 'vendor', label: 'Participant 2', desc: 'Counterparty' },
        ];
    }
  };

  const roles = getRolesForScenario();
  const [selectedRole, setSelectedRole] = useState<string>(
    humanRole || (roles[0]?.id || 'buyer')
  );

  // Form states per scenario strictly aligned with Phase 3 specification
  // 1. Vendor Pricing Form State
  const [vendorData, setVendorData] = useState({
    product: scenarioData.product || '',
    product_description: scenarioData.product_description || '',
    quantity: scenarioData.quantity || '',
    initial_vendor_price: scenarioData.initial_vendor_price || scenarioData.current_vendor_price || '',
    target_price: scenarioData.target_price || '',
    maximum_budget: scenarioData.maximum_budget || '',
    minimum_acceptable_price: scenarioData.minimum_acceptable_price || scenarioData.vendor_floor || '',
    delivery_requirements: scenarioData.delivery_requirements || scenarioData.delivery_requirement || '',
    quality_requirements: scenarioData.quality_requirements || scenarioData.quality_requirement || '',
    payment_terms: scenarioData.payment_terms || '',
    other_requirements: scenarioData.other_requirements || scenarioData.other_conditions || '',
  });

  // 2. Job Offer Form State
  const [jobData, setJobData] = useState({
    job_role: scenarioData.job_role || '',
    company: scenarioData.company || '',
    initial_salary_offer: scenarioData.initial_salary_offer || scenarioData.current_initial_salary || '',
    expected_salary: scenarioData.expected_salary || '',
    minimum_acceptable_salary: scenarioData.minimum_acceptable_salary || '',
    maximum_budget: scenarioData.maximum_budget || scenarioData.max_salary || '',
    experience: scenarioData.experience || '',
    location: scenarioData.location || '',
    work_mode: scenarioData.work_mode || '',
    benefits: scenarioData.benefits || '',
    joining_date: scenarioData.joining_date || '',
    notice_period: scenarioData.notice_period || '',
    other_requirements: scenarioData.other_requirements || '',
  });

  // 3. Project Budget Allocation Form State
  const [budgetData, setBudgetData] = useState({
    project_name: scenarioData.project_name || scenarioData.project || '',
    total_budget: scenarioData.total_budget || '',
    teams_departments: scenarioData.teams_departments || '',
    initial_allocations: scenarioData.initial_allocations || scenarioData.initial_allocation || '',
    requested_budget: scenarioData.requested_budget || '',
    priorities: scenarioData.priorities || scenarioData.priority_areas || '',
    deadline: scenarioData.deadline || '',
    resource_requirements: scenarioData.resource_requirements || '',
    constraints: scenarioData.constraints || '',
    other_requirements: scenarioData.other_requirements || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    let finalData: Record<string, any> = {};
    if (scenarioId === 'vendor-pricing') {
      finalData = {
        ...vendorData,
        // Compatibility aliases for existing backend models/prompts
        current_vendor_price: vendorData.initial_vendor_price,
        delivery_requirement: vendorData.delivery_requirements,
        quality_requirement: vendorData.quality_requirements,
        other_conditions: vendorData.payment_terms
          ? `${vendorData.payment_terms}${vendorData.other_requirements ? `, ${vendorData.other_requirements}` : ''}`
          : vendorData.other_requirements,
      };
    } else if (scenarioId === 'job-offer') {
      finalData = {
        ...jobData,
        // Compatibility aliases
        current_initial_salary: jobData.initial_salary_offer,
      };
    } else {
      finalData = {
        ...budgetData,
        // Compatibility aliases
        project: budgetData.project_name,
        initial_allocation: budgetData.initial_allocations,
        priority_areas: budgetData.priorities,
      };
    }

    try {
      finalData.personality = personality || 'Collaborative';
      finalData.mode = selectedMode || 'human-ai';
      if (isHumanAi) {
        finalData.human_role = selectedRole;
      }
      setScenarioData(finalData);
      if (isHumanAi) {
        setHumanRole(selectedRole);
      }

      // 1. Create Session with real scenario data
      const sessionRes = await negotiationApi.createSession({
        scenario_id: scenarioId,
        mode: selectedMode || 'human-ai',
        human_role: isHumanAi ? selectedRole : undefined,
        scenario_data: finalData,
      });

      // 2. Start negotiation session
      await negotiationApi.startSession(sessionRes.id);

      // 3. Navigate directly to Chat Arena
      if (selectedMode === 'human-ai') {
        sessionStorage.setItem(`practice_session_${scenarioId}`, sessionRes.id);
        navigate(`/arena/practice?session_id=${sessionRes.id}`);
      } else {
        sessionStorage.setItem(`simulation_session_${scenarioId}`, sessionRes.id);
        navigate(`/arena/simulation?session_id=${sessionRes.id}`);
      }
    } catch (err: any) {
      console.error('Failed to start negotiation with real scenario data:', err);
      setError(err.message || 'Failed to initialize negotiation session.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back to Scenario Selection */}
      <button
        type="button"
        onClick={() => navigate('/setup/scenario')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Scenario Selection
      </button>

      {/* Header Banner */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 uppercase tracking-wide">
                Stage 2: Real Scenario Data Input
              </span>
              <span className="text-xs font-medium text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                {selectedMode === 'human-ai' ? 'Human vs AI Mode' : 'AI vs AI Simulation'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {selectedScenario?.title || 'Enter Scenario Parameters'}
            </h1>
            <p className="text-slate-600 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Enter your real negotiation parameters below. The values you enter here are the authoritative source of truth. AI agents will negotiate strictly using these figures and constraints.
            </p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50/80 border border-slate-200/60 rounded-xl shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 block">User Source of Truth</span>
              <span className="text-slate-500">Zero synthetic or demo values</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p className="font-semibold">Unable to start session</p>
            <p className="text-xs mt-0.5 text-red-600">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Human Role Selection (Only in Human vs AI Mode) */}
        {isHumanAi && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Your Negotiation Role</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Select which participant you will play in this negotiation. The counterparty will be driven by an autonomous AI agent.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {roles.map((r) => {
                const isSelected = selectedRole === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRole(r.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                        {r.label}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{r.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 1. VENDOR PRICING FIELDS */}
        {scenarioId === 'vendor-pricing' && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Vendor Pricing Parameters</h2>
                <p className="text-xs text-slate-500">Enter commercial and contract requirements for this procurement negotiation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.product}
                  onChange={(e) => setVendorData({ ...vendorData, product: e.target.value })}
                  placeholder="e.g. Industrial Solar Inverters / Enterprise ERP"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantity *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.quantity}
                  onChange={(e) => setVendorData({ ...vendorData, quantity: e.target.value })}
                  placeholder="e.g. 50 units / 500 licenses"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Product Description
                </label>
                <input
                  type="text"
                  value={vendorData.product_description}
                  onChange={(e) => setVendorData({ ...vendorData, product_description: e.target.value })}
                  placeholder="e.g. High-efficiency 50kW three-phase grid-tied solar power inverters with remote monitoring"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Vendor Price *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.initial_vendor_price}
                  onChange={(e) => setVendorData({ ...vendorData, initial_vendor_price: e.target.value })}
                  placeholder="e.g. ₹85,000 / unit or $80/seat/month"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Price *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.target_price}
                  onChange={(e) => setVendorData({ ...vendorData, target_price: e.target.value })}
                  placeholder="e.g. ₹65,000 / unit or $55/seat/month"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maximum Budget (Buyer Ceiling) *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.maximum_budget}
                  onChange={(e) => setVendorData({ ...vendorData, maximum_budget: e.target.value })}
                  placeholder="e.g. ₹72,000 / unit or $65/seat/month"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vendor Minimum Price (Floor)
                </label>
                <input
                  type="text"
                  value={vendorData.minimum_acceptable_price}
                  onChange={(e) => setVendorData({ ...vendorData, minimum_acceptable_price: e.target.value })}
                  placeholder="e.g. ₹60,000 / unit (defaults to 85% of initial if blank)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Requirements *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.delivery_requirements}
                  onChange={(e) => setVendorData({ ...vendorData, delivery_requirements: e.target.value })}
                  placeholder="e.g. 21 calendar days / Staggered weekly delivery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quality Requirements *
                </label>
                <input
                  type="text"
                  required
                  value={vendorData.quality_requirements}
                  onChange={(e) => setVendorData({ ...vendorData, quality_requirements: e.target.value })}
                  placeholder="e.g. ISO-9001 certified, 5-year warranty, 99.9% uptime SLA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={vendorData.payment_terms}
                  onChange={(e) => setVendorData({ ...vendorData, payment_terms: e.target.value })}
                  placeholder="e.g. Net-45 days / 30% advance, 70% on delivery"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Other Requirements
                </label>
                <textarea
                  rows={2}
                  value={vendorData.other_requirements}
                  onChange={(e) => setVendorData({ ...vendorData, other_requirements: e.target.value })}
                  placeholder="e.g. Free on-site installation, annual maintenance check, dedicated account manager"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. JOB OFFER FIELDS */}
        {scenarioId === 'job-offer' && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Job Offer Parameters</h2>
                <p className="text-xs text-slate-500">Enter compensation and role expectations for this employment negotiation.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Role *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.job_role}
                  onChange={(e) => setJobData({ ...jobData, job_role: e.target.value })}
                  placeholder="e.g. Lead Machine Learning Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.company}
                  onChange={(e) => setJobData({ ...jobData, company: e.target.value })}
                  placeholder="e.g. Apex AI Labs / Global Tech Inc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Salary Offer *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.initial_salary_offer}
                  onChange={(e) => setJobData({ ...jobData, initial_salary_offer: e.target.value })}
                  placeholder="e.g. ₹30,000 / month or $130,000 / year"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expected Salary *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.expected_salary}
                  onChange={(e) => setJobData({ ...jobData, expected_salary: e.target.value })}
                  placeholder="e.g. ₹40,000 / month or $165,000 / year"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Minimum Acceptable Salary (Floor) *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.minimum_acceptable_salary}
                  onChange={(e) => setJobData({ ...jobData, minimum_acceptable_salary: e.target.value })}
                  placeholder="e.g. ₹35,000 / month or $145,000 / year"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Maximum Budget / Salary Cap (Recruiter Ceiling)
                </label>
                <input
                  type="text"
                  value={jobData.maximum_budget}
                  onChange={(e) => setJobData({ ...jobData, maximum_budget: e.target.value })}
                  placeholder="e.g. ₹42,000 / month or $175,000 / year"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Experience *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.experience}
                  onChange={(e) => setJobData({ ...jobData, experience: e.target.value })}
                  placeholder="e.g. 6+ years production ML systems"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.location}
                  onChange={(e) => setJobData({ ...jobData, location: e.target.value })}
                  placeholder="e.g. Bangalore / San Francisco / London"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Mode *
                </label>
                <input
                  type="text"
                  required
                  value={jobData.work_mode}
                  onChange={(e) => setJobData({ ...jobData, work_mode: e.target.value })}
                  placeholder="e.g. Hybrid (2 days office, 3 remote) / Remote"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Joining Date
                </label>
                <input
                  type="text"
                  value={jobData.joining_date}
                  onChange={(e) => setJobData({ ...jobData, joining_date: e.target.value })}
                  placeholder="e.g. 1st of next month / Within 30 days"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notice Period
                </label>
                <input
                  type="text"
                  value={jobData.notice_period}
                  onChange={(e) => setJobData({ ...jobData, notice_period: e.target.value })}
                  placeholder="e.g. 30 days / Immediate"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Benefits
                </label>
                <input
                  type="text"
                  value={jobData.benefits}
                  onChange={(e) => setJobData({ ...jobData, benefits: e.target.value })}
                  placeholder="e.g. Medical insurance, annual learning stipend, 20 days PTO, stock options"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Other Requirements
                </label>
                <input
                  type="text"
                  value={jobData.other_requirements}
                  onChange={(e) => setJobData({ ...jobData, other_requirements: e.target.value })}
                  placeholder="e.g. Signing bonus, 6-month performance appraisal, home office budget"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. PROJECT BUDGET ALLOCATION FIELDS */}
        {scenarioId === 'budget-allocation' && (
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <PieChart className="w-5 h-5 text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Project Budget Allocation Parameters</h2>
                <p className="text-xs text-slate-500">Enter departmental funding pools and priorities for resource distribution.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.project_name}
                  onChange={(e) => setBudgetData({ ...budgetData, project_name: e.target.value })}
                  placeholder="e.g. Autonomous Fleet Infrastructure / Q3 Platform Rebuild"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Total Budget *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.total_budget}
                  onChange={(e) => setBudgetData({ ...budgetData, total_budget: e.target.value })}
                  placeholder="e.g. ₹5,00,00,000 / $2,000,000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Teams / Departments *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.teams_departments}
                  onChange={(e) => setBudgetData({ ...budgetData, teams_departments: e.target.value })}
                  placeholder="e.g. Engineering, AI Research, Operations, Security"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Allocations *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.initial_allocations}
                  onChange={(e) => setBudgetData({ ...budgetData, initial_allocations: e.target.value })}
                  placeholder="e.g. Engineering 40%, AI Research 30%, Ops 20%, Security 10%"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Requested Budget *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.requested_budget}
                  onChange={(e) => setBudgetData({ ...budgetData, requested_budget: e.target.value })}
                  placeholder="e.g. Engineering requests ₹2.5 Cr (50%), AI requests ₹1.8 Cr"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Priorities *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.priorities}
                  onChange={(e) => setBudgetData({ ...budgetData, priorities: e.target.value })}
                  placeholder="e.g. Reliability, GPU scaling, compliance readiness"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deadline *
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.deadline}
                  onChange={(e) => setBudgetData({ ...budgetData, deadline: e.target.value })}
                  placeholder="e.g. Q4 2026 / 6-month milestone"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resource Requirements
                </label>
                <input
                  type="text"
                  value={budgetData.resource_requirements}
                  onChange={(e) => setBudgetData({ ...budgetData, resource_requirements: e.target.value })}
                  placeholder="e.g. 5 senior devs, cloud compute quota, audit license"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Constraints & Caps
                </label>
                <textarea
                  rows={2}
                  value={budgetData.constraints}
                  onChange={(e) => setBudgetData({ ...budgetData, constraints: e.target.value })}
                  placeholder="e.g. Zero total budget overrun, strict 10% ceiling for external contractors"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Other Requirements
                </label>
                <input
                  type="text"
                  value={budgetData.other_requirements}
                  onChange={(e) => setBudgetData({ ...budgetData, other_requirements: e.target.value })}
                  placeholder="e.g. Monthly spend review cadence, CFO signoff on reallocation over 5%"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900 bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => navigate('/setup/scenario')}
            className="px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            Change Scenario
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-all transform active:scale-98 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Initializing Multi-Agent Session...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Start Negotiation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default ScenarioDataFormScreen;
