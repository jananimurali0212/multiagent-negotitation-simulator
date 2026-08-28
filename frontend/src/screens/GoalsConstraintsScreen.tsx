import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, JobCandidateContext, JobEmployerContext, VendorPricingContext, BudgetAllocationContext } from '../store/useStore';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  CircleUserRound,
  BriefcaseBusiness,
  BarChart3,
  Target,
  ShieldCheck,
  Plus,
  Trash2,
  FileText,
  AlertTriangle,
  Building2,
  Sparkles,
  Pencil,
  DollarSign,
  MapPin,
  Sliders,
  Calendar,
  Award,
  ListOrdered,
  Check,
  Package,
  RefreshCw,
  Shield,
} from 'lucide-react';

export const VENDOR_PRICING_INDUSTRIES = [
  'IT / Software',
  'Banking / Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'E-commerce',
  'Telecommunications',
  'Automotive',
  'Logistics / Supply Chain',
  'Education',
  'Construction',
  'Energy',
  'Government',
  'Professional Services',
  'Other'
];

export const VENDOR_PRICING_COMPANY_TYPES = [
  'Startup',
  'SME',
  'Mid-size Enterprise',
  'Large Enterprise',
  'Government Organization',
  'Non-Profit',
  'Other'
];

export const VENDOR_PRICING_DEAL_TYPES = [
  'New Purchase',
  'Contract Renewal',
  'Supplier Switch',
  'Price Renegotiation',
  'Bulk Purchase',
  'Long-Term Contract',
  'RFP / RFQ',
  'Strategic Partnership',
  'Emergency Purchase',
  'Service Upgrade',
  'Multi-Year Agreement',
  'Other'
];

export const VENDOR_PRICING_SITUATIONS = [
  'Cost Optimization & Budget Cut Pressure',
  'Rapid Scaling & High Growth Expansion',
  'Emergency Supplier Replacement',
  'Corporate Digital Transformation',
  'Year-End Budget Spend Deadline',
  'Competitive Market Benchmarking',
  'Other'
];

export const VENDOR_PRICING_PRODUCT_CATEGORIES = [
  'Software License',
  'Hardware',
  'IT Equipment',
  'Industrial Equipment',
  'Raw Materials',
  'Components',
  'Office Equipment',
  'Packaging',
  'Other'
];

export const VENDOR_PRICING_SERVICE_CATEGORIES = [
  'Cloud Services',
  'Software Development',
  'Consulting',
  'IT Support',
  'Managed Services',
  'Professional Services',
  'Marketing Services',
  'Maintenance',
  'Logistics Services',
  'Other'
];

export const VENDOR_PRICING_CURRENCIES = [
  'INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD', 'CAD', 'JPY', 'Other'
];

export const VENDOR_PRICING_DIMENSIONS = [
  'Price',
  'Quantity / Volume',
  'Payment Terms',
  'Delivery / Lead Time',
  'Delivery Location',
  'Quality',
  'Warranty',
  'Service / Support SLA',
  'Contract Duration',
  'Renewal Terms',
  'Volume Discount',
  'Freight / Shipping',
  'Taxes / Fees',
  'Penalties',
  'Termination',
  'Other'
];

export const VENDOR_PRICING_TRADEOFFS = [
  'Price ↔ Volume',
  'Price ↔ Contract Duration',
  'Price ↔ Payment Terms',
  'Price ↔ Delivery',
  'Price ↔ Warranty',
  'Price ↔ Service Level',
  'Volume ↔ Discount',
  'Payment Terms ↔ Price',
  'Other'
];

export const VENDOR_OBJECTIVES = [
  'Maximize Sale Value & Total Contract Price',
  'Protect Profit Margin & Minimize Discounting',
  'Increase Order Volume & Licensing Tiers',
  'Secure Long-Term Multi-Year Contract Commitment',
  'Improve Payment Terms (Upfront / Net 15)',
  'Retain Strategic Enterprise Customer',
  'Increase Annual Recurring Revenue (ARR)',
  'Protect Service & Support Capacity',
  'Other'
];

export const BUYER_OBJECTIVES = [
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
  'Other'
];

export const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
  { code: 'JPY', symbol: '¥', label: 'JPY (¥) - Japanese Yen' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) - Singapore Dollar' },
  { code: 'AED', symbol: 'AED', label: 'AED (AED) - UAE Dirham' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR (SAR) - Saudi Riyal' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF (CHF) - Swiss Franc' },
];

export const CurrencySelector: React.FC<{
  value?: string;
  onChange: (code: string) => void;
}> = ({ value = 'USD', onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0 cursor-pointer shadow-sm"
  >
    {CURRENCY_OPTIONS.map((c) => (
      <option key={c.code} value={c.code}>
        {c.label}
      </option>
    ))}
  </select>
);

export const isNumericValue = (val?: string) => {
  if (!val || val.trim() === '') return false;
  const clean = val.replace(/[\$,₹,€,£,¥,A-Z,a-z,\s,/,,\-]/g, '');
  return clean.length > 0 && !isNaN(Number(clean));
};

export const getNumericVal = (val?: string) => {
  if (!val) return 0;
  const clean = val.replace(/[\$,₹,€,£,¥,A-Z,a-z,\s,/,,\-]/g, '');
  return Number(clean) || 0;
};

export const CANDIDATE_NON_NEGOTIABLE_OPTIONS = [
  'Minimum base salary threshold requirement',
  'Hybrid work arrangement with maximum 2 days in office',
  'Full remote work arrangement requirement',
  'Comprehensive health insurance coverage from Day 1',
  'Stock options / ESOP equity grant inclusion',
  '30 days maximum notice period constraint',
  'No weekend or on-call work duties without overtime',
  'Annual salary review and inflation adjustment clause',
  'Relocation allowance / sign-on bonus commitment',
  'Clear promotion path to Lead/Senior within 18 months',
  'Other (Custom Requirement)',
];

export const EMPLOYER_NON_NEGOTIABLE_OPTIONS = [
  'Maximum base salary cap cannot exceed approved budget',
  'Must work on-site at least 2-3 days per week (Hybrid)',
  'Standard 90-day probation period applies',
  'Must join within 30 days of offer acceptance',
  'Background check and degree verification mandatory',
  'Standard company benefits package (non-customizable)',
  'No remote-only work arrangement for this position',
  'IP assignment and non-disclosure agreement required',
  'Fixed working hours overlap with core timezone',
  'Annual performance-based bonus structure only',
  'Other (Custom Requirement)',
];

export const DEFAULT_CANDIDATE_CONTEXT: JobCandidateContext = {
  jobPosition: '',
  experienceLevel: '',
  companyName: '',
  companyType: '',
  hiringType: '',
  workLocation: '',
  workMode: '',
  jobLevel: '',
  currentSalary: '',
  expectedSalary: '',
  preferredSalaryMin: '',
  preferredSalaryTarget: '',
  compensationType: '',
  joiningAvailability: '',
  otherOffers: '',
  otherOffersDetails: '',
  importantBenefits: [],
  candidatePriorities: [],
  candidateSkills: '',
  nonNegotiables: '',
  negotiationFlexibility: 'Medium',
  customInfo: '',
};

export const DEFAULT_EMPLOYER_CONTEXT: JobEmployerContext = {
  companyName: '',
  companyType: '',
  jobPosition: '',
  jobLevel: '',
  hiringType: '',
  requiredExperience: '',
  workLocation: '',
  workMode: '',
  salaryBudgetMin: '',
  salaryBudgetTarget: '',
  salaryBudgetMax: '',
  compensationStructure: '',
  benefitsOffered: [],
  hiringUrgency: '',
  mustHaveSkills: '',
  preferredSkills: '',
  employerPriorities: [],
  nonNegotiables: '',
  compensationFlexibility: 'Medium',
  customInfo: '',
};

export const getCandidateErrors = (ctx: Partial<JobCandidateContext>): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!ctx.jobPosition?.trim()) errors.jobPosition = 'This field is required.';
  if (!ctx.experienceLevel?.trim()) errors.experienceLevel = 'This field is required.';
  if (!ctx.companyName?.trim()) errors.companyName = 'This field is required.';
  if (!ctx.companyType?.trim()) errors.companyType = 'This field is required.';
  if (!ctx.hiringType?.trim()) errors.hiringType = 'This field is required.';
  if (!ctx.workLocation?.trim()) errors.workLocation = 'This field is required.';
  if (!ctx.workMode?.trim()) errors.workMode = 'This field is required.';
  if (!ctx.jobLevel?.trim()) errors.jobLevel = 'This field is required.';

  if (ctx.experienceLevel !== 'Fresher') {
    if (!ctx.currentSalary?.trim()) {
      errors.currentSalary = 'Current salary is required.';
    } else if (!isNumericValue(ctx.currentSalary)) {
      errors.currentSalary = 'Numeric salary value is required (e.g. 140000).';
    }
  } else if (ctx.currentSalary?.trim() && !isNumericValue(ctx.currentSalary)) {
    errors.currentSalary = 'Numeric salary value is required (e.g. 140000).';
  }

  if (!ctx.expectedSalary?.trim()) {
    errors.expectedSalary = 'Expected salary is required.';
  } else if (!isNumericValue(ctx.expectedSalary)) {
    errors.expectedSalary = 'Numeric salary value is required (e.g. 175000).';
  }

  if (!ctx.preferredSalaryMin?.trim()) {
    errors.preferredSalaryMin = 'Minimum salary is required.';
  } else if (!isNumericValue(ctx.preferredSalaryMin)) {
    errors.preferredSalaryMin = 'Numeric salary value is required.';
  }

  if (!ctx.preferredSalaryTarget?.trim()) {
    errors.preferredSalaryTarget = 'Target salary is required.';
  } else if (!isNumericValue(ctx.preferredSalaryTarget)) {
    errors.preferredSalaryTarget = 'Numeric salary value is required.';
  }

  if (
    isNumericValue(ctx.preferredSalaryMin) &&
    isNumericValue(ctx.preferredSalaryTarget) &&
    getNumericVal(ctx.preferredSalaryMin) > getNumericVal(ctx.preferredSalaryTarget)
  ) {
    errors.preferredSalaryMin = 'Minimum salary cannot exceed target salary.';
  }

  if (!ctx.compensationType?.trim()) errors.compensationType = 'This field is required.';
  if (!ctx.joiningAvailability?.trim()) errors.joiningAvailability = 'This field is required.';
  if (!ctx.otherOffers?.trim()) errors.otherOffers = 'This field is required.';
  if (ctx.otherOffers === 'Yes' && !ctx.otherOffersDetails?.trim()) {
    errors.otherOffersDetails = 'Please specify details of other offers.';
  }
  if (!ctx.importantBenefits || ctx.importantBenefits.length === 0) {
    errors.importantBenefits = 'Select at least one important benefit.';
  }
  if (!ctx.candidatePriorities || ctx.candidatePriorities.length === 0) {
    errors.candidatePriorities = 'Select at least one priority factor.';
  }
  if (!ctx.candidateSkills?.trim()) errors.candidateSkills = 'This field is required.';
  if (!ctx.nonNegotiables?.trim()) errors.nonNegotiables = 'This field is required.';
  return errors;
};

export const getEmployerErrors = (ctx: Partial<JobEmployerContext>): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (!ctx.companyName?.trim()) errors.companyName = 'This field is required.';
  if (!ctx.companyType?.trim()) errors.companyType = 'This field is required.';
  if (!ctx.jobPosition?.trim()) errors.jobPosition = 'This field is required.';
  if (!ctx.jobLevel?.trim()) errors.jobLevel = 'This field is required.';
  if (!ctx.hiringType?.trim()) errors.hiringType = 'This field is required.';
  if (!ctx.requiredExperience?.trim()) errors.requiredExperience = 'This field is required.';
  if (!ctx.workLocation?.trim()) errors.workLocation = 'This field is required.';
  if (!ctx.workMode?.trim()) errors.workMode = 'This field is required.';

  if (!ctx.salaryBudgetMin?.trim()) {
    errors.salaryBudgetMin = 'Minimum budget is required.';
  } else if (!isNumericValue(ctx.salaryBudgetMin)) {
    errors.salaryBudgetMin = 'Numeric salary budget is required (e.g. 145000).';
  }

  if (!ctx.salaryBudgetTarget?.trim()) {
    errors.salaryBudgetTarget = 'Target budget is required.';
  } else if (!isNumericValue(ctx.salaryBudgetTarget)) {
    errors.salaryBudgetTarget = 'Numeric salary budget is required (e.g. 160000).';
  }

  if (!ctx.salaryBudgetMax?.trim()) {
    errors.salaryBudgetMax = 'Max budget cap is required.';
  } else if (!isNumericValue(ctx.salaryBudgetMax)) {
    errors.salaryBudgetMax = 'Numeric salary budget is required (e.g. 170000).';
  }

  if (
    isNumericValue(ctx.salaryBudgetMin) &&
    isNumericValue(ctx.salaryBudgetTarget) &&
    getNumericVal(ctx.salaryBudgetMin) > getNumericVal(ctx.salaryBudgetTarget)
  ) {
    errors.salaryBudgetMin = 'Minimum budget cannot exceed target budget.';
  }

  if (
    isNumericValue(ctx.salaryBudgetTarget) &&
    isNumericValue(ctx.salaryBudgetMax) &&
    getNumericVal(ctx.salaryBudgetTarget) > getNumericVal(ctx.salaryBudgetMax)
  ) {
    errors.salaryBudgetMax = 'Max cap cannot be less than target budget.';
  }

  if (!ctx.compensationStructure?.trim()) errors.compensationStructure = 'This field is required.';
  if (!ctx.benefitsOffered || ctx.benefitsOffered.length === 0) {
    errors.benefitsOffered = 'Select at least one benefit offered.';
  }
  if (!ctx.hiringUrgency?.trim()) errors.hiringUrgency = 'This field is required.';
  if (!ctx.mustHaveSkills?.trim()) errors.mustHaveSkills = 'This field is required.';
  if (!ctx.employerPriorities || ctx.employerPriorities.length === 0) {
    errors.employerPriorities = 'Select at least one employer priority.';
  }
  if (!ctx.nonNegotiables?.trim()) errors.nonNegotiables = 'This field is required.';
  return errors;
};

// ====================================================================
// VENDOR PRICING WIZARD FORM (Steps 1–7)
// ====================================================================
const VendorPricingWizardForm: React.FC<{
  configuredAgents: any[];
  updateAgentConfig: (id: string, updates: any) => void;
  selectedMode: string | null;
  humanRole: string | null;
  navigate: (path: string) => void;
}> = ({ configuredAgents, updateAgentConfig, selectedMode, humanRole, navigate }) => {
  const [vendorStep, setVendorStep] = useState<number>(1);
  const [activeTabAgent, setActiveTabAgent] = useState<'vendor' | 'buyer'>('vendor');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const { vendorPricingContext, updateVendorPricingContext } = useStore();
  const ctx = vendorPricingContext;

  function setCtx(updater: Partial<VendorPricingContext>): void;
  function setCtx(updater: (prev: VendorPricingContext) => Partial<VendorPricingContext>): void;
  function setCtx(updater: any): void {
    if (typeof updater === 'function') {
      const nextCtx = updater(vendorPricingContext);
      updateVendorPricingContext(nextCtx);
    } else {
      updateVendorPricingContext(updater);
    }
  }

  const isNumericOnly = (val: string) => /^\d+(\.\d+)?$/.test((val || '').toString().trim());

  const getErrors = () => {
    const errs: Record<string, string> = {};

    if (vendorStep === 1) {
      if (!ctx.industry) errs.industry = 'Industry / Domain is required.';
      if (ctx.industry === 'Other' && !ctx.customIndustry.trim()) errs.customIndustry = 'Please specify industry.';
      if (!ctx.companyType) errs.companyType = 'Company type is required.';
      if (ctx.companyType === 'Other' && !ctx.customCompanyType.trim()) errs.customCompanyType = 'Please specify company type.';
      if (!ctx.dealType) errs.dealType = 'Deal type is required.';
      if (ctx.dealType === 'Other' && !ctx.customDealType.trim()) errs.customDealType = 'Please specify deal type.';
      if (!ctx.companySituation) errs.companySituation = 'Company situation is required.';
    } else if (vendorStep === 2) {
      if (ctx.categoryType === 'Product') {
        if (!ctx.productCategory) errs.productCategory = 'Please select a product category.';
        if (ctx.productCategory === 'Software License' && !ctx.userSeats.trim()) errs.userSeats = 'Number of seats is required.';
      } else {
        if (!ctx.serviceCategory) errs.serviceCategory = 'Please select a service category.';
      }
    } else if (vendorStep === 3) {
      if (!ctx.quantityVolume.trim()) errs.quantityVolume = 'Quantity / Volume is required.';
      else if (!isNumericOnly(ctx.quantityVolume)) errs.quantityVolume = 'Numeric value is required (e.g. 500).';

      if (!ctx.contractDuration.trim()) errs.contractDuration = 'Contract duration is required.';
      else if (!isNumericOnly(ctx.contractDuration)) errs.contractDuration = 'Numeric months required (e.g. 12).';

      if (!ctx.currency) errs.currency = 'Currency is required.';

      if (!ctx.targetPrice.trim()) errs.targetPrice = 'Target price / budget is required.';
      else if (!isNumericOnly(ctx.targetPrice)) errs.targetPrice = 'Numeric amount is required (e.g. 150000).';
    } else if (vendorStep === 4) {
      if (!ctx.dimensions || ctx.dimensions.length === 0) errs.dimensions = 'Select at least one negotiation dimension.';
    } else if (vendorStep === 5) {
      const dims = ctx.dimensions || [];
      if (dims.includes('Delivery / Lead Time') && !ctx.leadTime.trim()) errs.leadTime = 'Lead time requirement is required.';
      if (dims.includes('Quality') && !ctx.qualityStandard.trim()) errs.qualityStandard = 'Quality standard is required.';
      if (dims.includes('Warranty') && !ctx.warrantyCoverage.trim()) errs.warrantyCoverage = 'Warranty coverage is required.';
      if (dims.includes('Service / Support SLA') && !ctx.supportLevel.trim()) errs.supportLevel = 'Support level SLA is required.';
      if (dims.includes('Payment Terms') && !ctx.paymentTerms.trim()) errs.paymentTerms = 'Payment terms are required.';
    } else if (vendorStep === 6) {
      if (!ctx.tradeOffs || ctx.tradeOffs.length === 0) errs.tradeOffs = 'Select at least one trade-off preference.';
      if (ctx.tradeOffs.includes('Other') && !ctx.customTradeOff.trim()) errs.customTradeOff = 'Please specify custom trade-off.';
    } else if (vendorStep === 7) {
      const configureVendorAI = selectedMode === 'ai-ai' || humanRole === 'buyer';
      const configureBuyerAI = selectedMode === 'ai-ai' || humanRole === 'vendor';

      if (configureVendorAI) {
        if (!ctx.vendorObjective || ctx.vendorObjective === 'Select Primary Objective') errs.vendorObjective = 'Vendor primary objective is required.';
        if (!ctx.vendorMinPrice.trim()) errs.vendorMinPrice = 'Minimum price floor is required.';
        else if (!isNumericOnly(ctx.vendorMinPrice)) errs.vendorMinPrice = 'Numeric price floor is required (e.g. 120000).';
      }

      if (configureBuyerAI) {
        if (!ctx.buyerObjective || ctx.buyerObjective === 'Select Primary Objective') errs.buyerObjective = 'Buyer primary objective is required.';
        if (!ctx.buyerMaxBudget.trim()) errs.buyerMaxBudget = 'Maximum approved budget is required.';
        else if (!isNumericOnly(ctx.buyerMaxBudget)) errs.buyerMaxBudget = 'Numeric max budget is required (e.g. 180000).';
      }
    }

    return errs;
  };

  const errors = getErrors();
  const isCurrentStepValid = Object.keys(errors).length === 0;

  const toggleArrayItem = (key: 'dimensions' | 'tradeOffs', item: string) => {
    setCtx(prev => {
      const arr = prev[key] || [];
      if (key === 'dimensions' && item === 'Price') return prev; // Price is always included
      const nextArr = arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
      return { ...prev, [key]: nextArr };
    });
  };

  const handleNextStep = () => {
    setAttemptedSubmit(true);
    if (!isCurrentStepValid) return;

    if (vendorStep < 7) {
      setVendorStep(prev => prev + 1);
      setAttemptedSubmit(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Final submit
      const vendorAgent = configuredAgents[0] || { id: 'agent-vendor' };
      const buyerAgent = configuredAgents[1] || { id: 'agent-buyer' };

      const getCleanNumber = (val: string) => Number((val || '').toString().replace(/[\$,₹,€,£,\s]/g, '')) || 0;

      const formattedParams = {
        "Industry": ctx.industry === 'Other' ? ctx.customIndustry : ctx.industry,
        "Company Type": ctx.companyType === 'Other' ? ctx.customCompanyType : ctx.companyType,
        "Deal Type": ctx.dealType === 'Other' ? ctx.customDealType : ctx.dealType,
        "Situation": ctx.companySituation,
        "Category": ctx.categoryType === 'Product' ? (ctx.productCategory === 'Other' ? ctx.customCategory : ctx.productCategory) : (ctx.serviceCategory === 'Other' ? ctx.customCategory : ctx.serviceCategory),
        "Quantity / Volume": ctx.quantityVolume,
        "Purchase Frequency": ctx.purchaseFrequency,
        "Contract Duration": `${ctx.contractDuration} Months`,
        "Currency": ctx.currency,
        "Target Price / Budget": `${ctx.currency} ${ctx.targetPrice}`,
        "Negotiable Dimensions": ctx.dimensions.join(', '),
        "Requirements": `Delivery: ${ctx.leadTime}, Quality: ${ctx.qualityStandard}, Warranty: ${ctx.warrantyCoverage}, SLA: ${ctx.supportLevel}, Payment: ${ctx.paymentTerms}`,
        "Trade-Off Preferences": ctx.tradeOffs.join(', '),
      };

      updateAgentConfig(vendorAgent.id, {
        targetPrice: ctx.targetPrice,
        minPrice: ctx.vendorMinPrice || Math.round(getCleanNumber(ctx.targetPrice) * 0.85).toString(),
        currency: ctx.currency,
        quantityVolume: ctx.quantityVolume,
        paymentTerms: ctx.paymentTerms,
        deliveryRequirement: ctx.leadTime,
        warrantySupport: ctx.warrantyCoverage,
        negotiation_parameters: {
          ...formattedParams,
          "Primary Objective": ctx.vendorObjective,
          "Hard Boundary": `Minimum Price Floor: ${ctx.currency} ${ctx.vendorMinPrice}`,
          "Custom Instructions": ctx.vendorCustomInstructions,
        },
        goals: [{ id: 'g1', text: ctx.vendorObjective || 'Maximize sale value and defend margins', priority: ctx.vendorPriority || 'High' }],
        constraints: [{ id: 'c1', label: 'Minimum Price Floor', value: `${ctx.currency} ${ctx.vendorMinPrice}` }]
      });

      updateAgentConfig(buyerAgent.id, {
        targetPrice: ctx.targetPrice,
        maxBudget: ctx.buyerMaxBudget || Math.round(getCleanNumber(ctx.targetPrice) * 1.15).toString(),
        currency: ctx.currency,
        quantityVolume: ctx.quantityVolume,
        paymentTerms: ctx.paymentTerms,
        deliveryRequirement: ctx.leadTime,
        warrantySupport: ctx.warrantyCoverage,
        negotiation_parameters: {
          ...formattedParams,
          "Primary Objective": ctx.buyerObjective,
          "Hard Boundary": `Maximum Approved Budget: ${ctx.currency} ${ctx.buyerMaxBudget}`,
          "Custom Instructions": ctx.buyerCustomInstructions,
        },
        goals: [{ id: 'g1', text: ctx.buyerObjective || 'Minimize total cost and stay within budget', priority: ctx.buyerPriority || 'High' }],
        constraints: [{ id: 'c1', label: 'Maximum Approved Budget Cap', value: `${ctx.currency} ${ctx.buyerMaxBudget}` }]
      });

      navigate('/setup/review');
    }
  };

  const VENDOR_WIZARD_STEPS = [
    { id: 1, title: '01 Deal Context', icon: Building2 },
    { id: 2, title: "02 What You're Buying", icon: Package },
    { id: 3, title: '03 Commercial Terms', icon: DollarSign },
    { id: 4, title: '04 Dimensions', icon: Sliders },
    { id: 5, title: '05 Requirements', icon: CheckCircle2 },
    { id: 6, title: '06 Trade-Offs', icon: RefreshCw },
    { id: 7, title: '07 AI Position', icon: Shield },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* LOCAL VENDOR SUB-STEP PROGRESS BAR */}
      <div className="p-4 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
          {VENDOR_WIZARD_STEPS.map((s) => {
            const isCompleted = vendorStep > s.id;
            const isActive = vendorStep === s.id;
            const StepIcon = s.icon;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => isCompleted && setVendorStep(s.id)}
                disabled={!isCompleted && !isActive}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? '✓' : s.id}
                </span>
                <StepIcon size={14} />
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 01 — DEAL CONTEXT */}
      {vendorStep === 1 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Building2 className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 01 — Business & Deal Context
            </h3>
          </div>

          {/* Industry */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${attemptedSubmit && errors.industry ? 'text-red-500' : 'text-slate-500'}`}>
              Industry / Domain *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VENDOR_PRICING_INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setCtx(prev => ({ ...prev, industry: ind }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.industry === ind
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
            {ctx.industry === 'Other' && (
              <input
                type="text"
                value={ctx.customIndustry}
                onChange={(e) => setCtx(prev => ({ ...prev, customIndustry: e.target.value }))}
                placeholder="Specify custom industry..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            )}
            {attemptedSubmit && errors.industry && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.industry}</p>}
          </div>

          {/* Company Type */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${attemptedSubmit && errors.companyType ? 'text-red-500' : 'text-slate-500'}`}>
              Company / Business Type *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VENDOR_PRICING_COMPANY_TYPES.map((ct) => (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setCtx(prev => ({ ...prev, companyType: ct }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.companyType === ct
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
            {ctx.companyType === 'Other' && (
              <input
                type="text"
                value={ctx.customCompanyType}
                onChange={(e) => setCtx(prev => ({ ...prev, customCompanyType: e.target.value }))}
                placeholder="Specify custom company type..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            )}
            {attemptedSubmit && errors.companyType && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.companyType}</p>}
          </div>

          {/* Deal Type */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${attemptedSubmit && errors.dealType ? 'text-red-500' : 'text-slate-500'}`}>
              Deal Type *
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {VENDOR_PRICING_DEAL_TYPES.map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setCtx(prev => ({ ...prev, dealType: dt }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.dealType === dt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>
            {ctx.dealType === 'Other' && (
              <input
                type="text"
                value={ctx.customDealType}
                onChange={(e) => setCtx(prev => ({ ...prev, customDealType: e.target.value }))}
                placeholder="Specify custom deal type..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              />
            )}
            {attemptedSubmit && errors.dealType && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.dealType}</p>}
          </div>

          {/* Company Situation */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${attemptedSubmit && errors.companySituation ? 'text-red-500' : 'text-slate-500'}`}>
              Company Situation & Negotiation Context *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              {VENDOR_PRICING_SITUATIONS.map((sit) => (
                <button
                  key={sit}
                  type="button"
                  onClick={() => setCtx(prev => ({ ...prev, companySituation: sit }))}
                  className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                    ctx.companySituation === sit
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {sit}
                </button>
              ))}
            </div>
            {attemptedSubmit && errors.companySituation && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.companySituation}</p>}
          </div>
        </div>
      )}

      {/* STEP 02 — PRODUCT / SERVICE */}
      {vendorStep === 2 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Package className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 02 — What Are You Negotiating For?
            </h3>
          </div>

          {/* Product vs Service Toggle */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
              Category Type *
            </label>
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => setCtx(prev => ({ ...prev, categoryType: 'Product' }))}
                className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  ctx.categoryType === 'Product'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Package size={22} className="mx-auto mb-1" />
                <span className="font-bold text-xs">Product</span>
              </button>

              <button
                type="button"
                onClick={() => setCtx(prev => ({ ...prev, categoryType: 'Service' }))}
                className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                  ctx.categoryType === 'Service'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/30'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Sliders size={22} className="mx-auto mb-1" />
                <span className="font-bold text-xs">Service</span>
              </button>
            </div>
          </div>

          {/* Product Category Selection */}
          {ctx.categoryType === 'Product' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${attemptedSubmit && errors.productCategory ? 'text-red-500' : 'text-slate-500'}`}>
                Product Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {VENDOR_PRICING_PRODUCT_CATEGORIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCtx(prev => ({ ...prev, productCategory: p }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      ctx.productCategory === p
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {attemptedSubmit && errors.productCategory && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.productCategory}</p>}

              {/* Contextual Follow-up for Software License */}
              {ctx.productCategory === 'Software License' && (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                  <h4 className="text-xs font-bold text-blue-900">Software Licensing Specifications</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">License Model</label>
                      <select
                        value={ctx.licenseType}
                        onChange={(e) => setCtx(prev => ({ ...prev, licenseType: e.target.value }))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="User Seats">Per User / Seat</option>
                        <option value="Concurrent Users">Concurrent Users</option>
                        <option value="Enterprise Site License">Enterprise Site License</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block mb-1">Number of Seats *</label>
                      <input
                        type="text"
                        value={ctx.userSeats}
                        onChange={(e) => setCtx(prev => ({ ...prev, userSeats: e.target.value }))}
                        placeholder="e.g. 100"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Service Category Selection */}
          {ctx.categoryType === 'Service' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <label className={`text-[10px] font-bold uppercase tracking-wider block ${attemptedSubmit && errors.serviceCategory ? 'text-red-500' : 'text-slate-500'}`}>
                Service Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {VENDOR_PRICING_SERVICE_CATEGORIES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCtx(prev => ({ ...prev, serviceCategory: s }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      ctx.serviceCategory === s
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {attemptedSubmit && errors.serviceCategory && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.serviceCategory}</p>}
            </div>
          )}
        </div>
      )}

      {/* STEP 03 — COMMERCIAL TERMS & DEAL SCALE */}
      {vendorStep === 3 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <DollarSign className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 03 — Deal Scale & Commercial Context
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity / Volume */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.quantityVolume ? 'text-red-500' : 'text-slate-500'}`}>
                Quantity / Volume *
              </label>
              <input
                type="text"
                value={ctx.quantityVolume}
                onChange={(e) => setCtx(prev => ({ ...prev, quantityVolume: e.target.value }))}
                placeholder="e.g. 500"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                  attemptedSubmit && errors.quantityVolume ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {attemptedSubmit && errors.quantityVolume && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.quantityVolume}</p>}
            </div>

            {/* Contract Duration */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.contractDuration ? 'text-red-500' : 'text-slate-500'}`}>
                Contract Duration (Months) *
              </label>
              <input
                type="text"
                value={ctx.contractDuration}
                onChange={(e) => setCtx(prev => ({ ...prev, contractDuration: e.target.value }))}
                placeholder="e.g. 12"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                  attemptedSubmit && errors.contractDuration ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {attemptedSubmit && errors.contractDuration && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.contractDuration}</p>}
            </div>

            {/* Currency Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Deal Currency *
              </label>
              <select
                value={ctx.currency}
                onChange={(e) => setCtx(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                {VENDOR_PRICING_CURRENCIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Target Value / Budget */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.targetPrice ? 'text-red-500' : 'text-slate-500'}`}>
                Target Deal Price / Budget *
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                  {ctx.currency}
                </span>
                <input
                  type="text"
                  value={ctx.targetPrice}
                  onChange={(e) => setCtx(prev => ({ ...prev, targetPrice: e.target.value }))}
                  placeholder="e.g. 150000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                    attemptedSubmit && errors.targetPrice ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {attemptedSubmit && errors.targetPrice && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.targetPrice}</p>}
            </div>
          </div>
        </div>
      )}

      {/* STEP 04 — WHAT CAN BE NEGOTIATED? */}
      {vendorStep === 4 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Sliders className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 04 — Select Negotiable Dimensions
            </h3>
          </div>

          <p className="text-xs text-slate-600">
            Select all terms that can be negotiated in this deal. Price is always included by default.
          </p>

          <div className="flex flex-wrap gap-2">
            {VENDOR_PRICING_DIMENSIONS.map((dim) => {
              const active = ctx.dimensions.includes(dim);
              return (
                <button
                  key={dim}
                  type="button"
                  onClick={() => toggleArrayItem('dimensions', dim)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {dim} {dim === 'Price' && '(Fixed)'}
                </button>
              );
            })}
          </div>
          {attemptedSubmit && errors.dimensions && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.dimensions}</p>}
        </div>
      )}

      {/* STEP 05 — DEAL REQUIREMENTS */}
      {vendorStep === 5 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <CheckCircle2 className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 05 — Specific Deal Requirements
            </h3>
          </div>

          <div className="space-y-4">
            {ctx.dimensions.includes('Delivery / Lead Time') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800">🚚 Delivery Requirements</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Max Lead Time *</label>
                    <input
                      type="text"
                      value={ctx.leadTime}
                      onChange={(e) => setCtx(prev => ({ ...prev, leadTime: e.target.value }))}
                      placeholder="e.g. 14 Days"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase text-slate-500 block mb-1">Delivery Location</label>
                    <input
                      type="text"
                      value={ctx.deliveryLocation}
                      onChange={(e) => setCtx(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      placeholder="e.g. Global Remote / On-Site"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {ctx.dimensions.includes('Quality') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800">✨ Quality Requirements</h4>
                <input
                  type="text"
                  value={ctx.qualityStandard}
                  onChange={(e) => setCtx(prev => ({ ...prev, qualityStandard: e.target.value }))}
                  placeholder="e.g. ISO 9001 / SOC 2 Type II Certified"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            )}

            {ctx.dimensions.includes('Warranty') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800">🛡️ Warranty Coverage</h4>
                <input
                  type="text"
                  value={ctx.warrantyCoverage}
                  onChange={(e) => setCtx(prev => ({ ...prev, warrantyCoverage: e.target.value }))}
                  placeholder="e.g. 12 Months Replacement Warranty"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            )}

            {ctx.dimensions.includes('Service / Support SLA') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800">⚡ Support & SLA Requirements</h4>
                <input
                  type="text"
                  value={ctx.supportLevel}
                  onChange={(e) => setCtx(prev => ({ ...prev, supportLevel: e.target.value }))}
                  placeholder="e.g. 24/7 Dedicated SLA with 99.9% Uptime Guarantee"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            )}

            {ctx.dimensions.includes('Payment Terms') && (
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-800">💳 Payment Terms Requirements</h4>
                <input
                  type="text"
                  value={ctx.paymentTerms}
                  onChange={(e) => setCtx(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="e.g. Net 30 Days / 50% Upfront + 50% Milestone"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 06 — DEAL FLEXIBILITY & TRADE-OFFS */}
      {vendorStep === 6 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <RefreshCw className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 06 — Deal Flexibility & Trade-Off Preferences
            </h3>
          </div>

          <p className="text-xs text-slate-600">
            What concession packages are you willing to trade during negotiation?
          </p>

          <div className="flex flex-wrap gap-2">
            {VENDOR_PRICING_TRADEOFFS.map((to) => {
              const active = ctx.tradeOffs.includes(to);
              return (
                <button
                  key={to}
                  type="button"
                  onClick={() => toggleArrayItem('tradeOffs', to)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {to}
                </button>
              );
            })}
          </div>
          {ctx.tradeOffs.includes('Other') && (
            <input
              type="text"
              value={ctx.customTradeOff}
              onChange={(e) => setCtx(prev => ({ ...prev, customTradeOff: e.target.value }))}
              placeholder="Specify custom trade-off..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          )}
          {attemptedSubmit && errors.tradeOffs && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.tradeOffs}</p>}
        </div>
      )}

      {/* STEP 07 — AI NEGOTIATION POSITION */}
      {vendorStep === 7 && (
        <div className="rounded-2xl p-6 border border-slate-200 bg-white/70 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Shield className="text-blue-600" size={18} />
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Step 07 — AI Negotiation Position & Hard Boundaries
            </h3>
          </div>

          {/* AI vs AI Agent Tabs Selector */}
          {selectedMode === 'ai-ai' && (
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-sm">
              <button
                type="button"
                onClick={() => setActiveTabAgent('vendor')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabAgent === 'vendor' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Vendor AI Position
              </button>
              <button
                type="button"
                onClick={() => setActiveTabAgent('buyer')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTabAgent === 'buyer' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Buyer AI Position
              </button>
            </div>
          )}

          {/* VENDOR AI POSITION */}
          {(selectedMode === 'ai-ai' ? activeTabAgent === 'vendor' : humanRole === 'buyer') && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">🎯 Vendor AI Position & Boundaries</h4>

              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.vendorObjective ? 'text-red-500' : 'text-slate-500'}`}>
                  Primary Objective *
                </label>
                <select
                  value={ctx.vendorObjective}
                  onChange={(e) => setCtx(prev => ({ ...prev, vendorObjective: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                    attemptedSubmit && errors.vendorObjective ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Primary Objective</option>
                  {VENDOR_OBJECTIVES.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.vendorObjective && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.vendorObjective}</p>}
              </div>

              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.vendorMinPrice ? 'text-red-500' : 'text-slate-500'}`}>
                  Hard Boundary — Minimum Price Floor *
                </label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                    {ctx.currency}
                  </span>
                  <input
                    type="text"
                    value={ctx.vendorMinPrice}
                    onChange={(e) => setCtx(prev => ({ ...prev, vendorMinPrice: e.target.value }))}
                    placeholder="e.g. 120000"
                    className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                      attemptedSubmit && errors.vendorMinPrice ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {attemptedSubmit && errors.vendorMinPrice && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.vendorMinPrice}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={ctx.vendorCustomInstructions}
                  onChange={(e) => setCtx(prev => ({ ...prev, vendorCustomInstructions: e.target.value }))}
                  placeholder="Add any additional context the AI should consider..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all h-20 resize-none"
                />
              </div>
            </div>
          )}

          {/* BUYER AI POSITION */}
          {(selectedMode === 'ai-ai' ? activeTabAgent === 'buyer' : humanRole === 'vendor') && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">🎯 Buyer AI Position & Boundaries</h4>

              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.buyerObjective ? 'text-red-500' : 'text-slate-500'}`}>
                  Primary Objective *
                </label>
                <select
                  value={ctx.buyerObjective}
                  onChange={(e) => setCtx(prev => ({ ...prev, buyerObjective: e.target.value }))}
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                    attemptedSubmit && errors.buyerObjective ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Primary Objective</option>
                  {BUYER_OBJECTIVES.map(o => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.buyerObjective && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.buyerObjective}</p>}
              </div>

              <div>
                <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${attemptedSubmit && errors.buyerMaxBudget ? 'text-red-500' : 'text-slate-500'}`}>
                  Hard Boundary — Maximum Approved Budget Cap *
                </label>
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                    {ctx.currency}
                  </span>
                  <input
                    type="text"
                    value={ctx.buyerMaxBudget}
                    onChange={(e) => setCtx(prev => ({ ...prev, buyerMaxBudget: e.target.value }))}
                    placeholder="e.g. 180000"
                    className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                      attemptedSubmit && errors.buyerMaxBudget ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {attemptedSubmit && errors.buyerMaxBudget && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.buyerMaxBudget}</p>}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={ctx.buyerCustomInstructions}
                  onChange={(e) => setCtx(prev => ({ ...prev, buyerCustomInstructions: e.target.value }))}
                  placeholder="Add any additional context the AI should consider..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all h-20 resize-none"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* NAVIGATION FOOTER FOR VENDOR WIZARD */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (vendorStep > 1) {
              setVendorStep(prev => prev - 1);
            } else {
              navigate('/setup/agents');
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(30,34,48,0.10)', color: '#1E2230' }}
        >
          <ArrowLeft size={14} />
          {vendorStep > 1 ? 'Previous Step' : 'Back'}
        </button>

        <button
          type="button"
          onClick={handleNextStep}
          disabled={!isCurrentStepValid}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold transition-all border-none ${
            isCurrentStepValid
              ? 'bg-blue-600 text-white cursor-pointer hover:-translate-y-0.5 shadow-lg'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          {vendorStep < 7 ? (
            <>
              Next Step
              <ChevronRight size={14} />
            </>
          ) : (
            <>
              Review & Confirm
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// ====================================================================
// PROJECT BUDGET ALLOCATION PRESETS & WIZARD FORM (Steps 1–7)
// ====================================================================

export const BUDGET_PROJECT_TYPES = [
  'Software Development',
  'Product Development',
  'Digital Transformation',
  'Research & Development',
  'Infrastructure',
  'IT Modernization',
  'Marketing Initiative',
  'Operations Improvement',
  'Expansion',
  'New Product Launch',
  'Process Improvement',
  'Other'
];

export const BUDGET_INDUSTRIES = [
  'IT / Software',
  'Banking / Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'E-commerce',
  'Telecommunications',
  'Automotive',
  'Logistics',
  'Education',
  'Construction',
  'Energy',
  'Government',
  'Professional Services',
  'Other'
];

export const BUDGET_STAGES = [
  'Planning',
  'Initiation',
  'Execution',
  'Mid-Project',
  'Expansion',
  'Recovery / Delayed',
  'Other'
];

export const BUDGET_IMPORTANCE_LEVELS = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

export const BUDGET_SITUATIONS = [
  'New Project',
  'Budget Planning',
  'Budget Shortfall',
  'Budget Review',
  'Scope Change',
  'Resource Shortage',
  'Cost Overrun',
  'Competing Department Requests',
  'Deadline Pressure',
  'Executive Priority Change',
  'Other'
];

export const BUDGET_PERIODS = [
  'One-Time Project',
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Annual',
  'Multi-Year'
];

export const BUDGET_STATUSES = [
  'Approved',
  'Proposed',
  'Restricted',
  'Under Review',
  'Reduced',
  'Pending Approval'
];

export const BUDGET_ALLOCATION_AREAS = [
  'Personnel / Headcount',
  'Technology',
  'Software / Licenses',
  'Hardware / Equipment',
  'Vendors / Contractors',
  'Research',
  'Training',
  'Marketing',
  'Operations',
  'Infrastructure',
  'Security',
  'Compliance',
  'Contingency',
  'Other'
];

export const BUDGET_PRIORITY_ITEMS = [
  'Project Delivery',
  'Critical Features',
  'Deadline',
  'Quality',
  'Team Capacity',
  'Security',
  'Compliance',
  'Customer Commitments',
  'Revenue Impact',
  'Operational Continuity',
  'Innovation',
  'Risk Reduction',
  'Other'
];

export const BUDGET_TRADEOFFS = [
  'Budget ↔ Scope',
  'Budget ↔ Timeline',
  'Budget ↔ Resources',
  'Budget ↔ Quality',
  'Scope ↔ Timeline',
  'Resources ↔ Timeline',
  'Quality ↔ Cost',
  'Features ↔ Delivery Date',
  'Headcount ↔ Schedule',
  'Technology Spend ↔ Operational Cost',
  'Other'
];

export const PM_HARD_BOUNDARIES = [
  'Minimum Required Project Budget',
  'Minimum Critical Resource Level',
  'Mandatory Deliverables',
  'Critical Deadline',
  'Minimum Quality Requirement',
  'Required Technology',
  'Required Contingency',
  'Other'
];

export const FM_HARD_BOUNDARIES = [
  'Maximum Total Budget',
  'Maximum Department Allocation',
  'Required Reserve',
  'Financial Policy Limit',
  'ROI Threshold',
  'Fiscal-Year Limit',
  'Approval Limit',
  'Other'
];

export const DH_HARD_BOUNDARIES = [
  'Minimum Department Allocation',
  'Minimum Team Capacity',
  'Mandatory Operational Spending',
  'Critical Resource Requirement',
  'Service-Level Requirement',
  'Department Deadline',
  'Other'
];

export const PM_PREFERRED_OUTCOMES = [
  'Fully Fund Critical Scope',
  'Protect Delivery Timeline',
  'Secure Critical Resources',
  'Preserve Quality',
  'Protect High-Priority Features',
  'Other'
];

export const FM_PREFERRED_OUTCOMES = [
  'Stay Within Approved Budget',
  'Optimize Total Allocation',
  'Protect Financial Reserve',
  'Reduce Unnecessary Spending',
  'Improve Budget Efficiency',
  'Other'
];

export const DH_PREFERRED_OUTCOMES = [
  'Secure Department Funding',
  'Protect Critical Operations',
  'Maintain Team Capacity',
  'Fund Priority Initiatives',
  'Protect Service Delivery',
  'Other'
];

export const BUDGET_FLEXIBLE_AREAS = [
  'Scope',
  'Timeline',
  'Team Size',
  'Technology',
  'Features',
  'Quality',
  'Vendor Spend',
  'Training',
  'Contingency',
  'Department Allocation'
];

const BudgetAllocationWizardForm: React.FC<{
  configuredAgents: any[];
  updateAgentConfig: (id: string, updates: any) => void;
  selectedMode: string | null;
  humanRole: string | null;
  navigate: (path: string) => void;
}> = ({ configuredAgents, updateAgentConfig, selectedMode, humanRole, navigate }) => {
  const [budgetStep, setBudgetStep] = useState<number>(1);
  const [activeTabRole, setActiveTabRole] = useState<'pm' | 'fm' | 'dh'>('pm');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const { budgetAllocationContext, updateBudgetAllocationContext } = useStore();
  const ctx = budgetAllocationContext;

  function setCtx(updater: Partial<BudgetAllocationContext>): void;
  function setCtx(updater: (prev: BudgetAllocationContext) => Partial<BudgetAllocationContext>): void;
  function setCtx(updater: any): void {
    if (typeof updater === 'function') {
      const nextCtx = updater(budgetAllocationContext);
      updateBudgetAllocationContext(nextCtx);
    } else {
      updateBudgetAllocationContext(updater);
    }
  }

  const isNumericOnly = (val: string) => /^\d+(\.\d+)?$/.test((val || '').toString().trim());

  const getErrors = () => {
    const errs: Record<string, string> = {};

    if (budgetStep === 1) {
      if (!ctx.projectType) errs.projectType = 'Project Type is required.';
      if (ctx.projectType === 'Other' && !ctx.customProjectType.trim()) errs.customProjectType = 'Please specify project type.';
      if (!ctx.industry) errs.industry = 'Industry / Domain is required.';
      if (ctx.industry === 'Other' && !ctx.customIndustry.trim()) errs.customIndustry = 'Please specify industry.';
      if (!ctx.projectStage) errs.projectStage = 'Project Stage is required.';
      if (ctx.projectStage === 'Other' && !ctx.customProjectStage.trim()) errs.customProjectStage = 'Please specify project stage.';
      if (!ctx.projectImportance) errs.projectImportance = 'Project Importance is required.';
      if (!ctx.projectSituation) errs.projectSituation = 'Project Situation is required.';
      if (ctx.projectSituation === 'Other' && !ctx.customSituation.trim()) errs.customSituation = 'Please specify project situation.';
    } else if (budgetStep === 2) {
      if (!ctx.currency) errs.currency = 'Currency is required.';
      if (!ctx.totalAvailableBudget.trim()) errs.totalAvailableBudget = 'Total Available Budget is required.';
      else if (!isNumericOnly(ctx.totalAvailableBudget)) errs.totalAvailableBudget = 'Numeric amount is required (e.g. 500000).';

      if (!ctx.budgetPeriod) errs.budgetPeriod = 'Budget Period is required.';

      if (!ctx.currentRequestedBudget.trim()) errs.currentRequestedBudget = 'Current Requested Budget is required.';
      else if (!isNumericOnly(ctx.currentRequestedBudget)) errs.currentRequestedBudget = 'Numeric amount is required (e.g. 450000).';

      if (!ctx.budgetStatus) errs.budgetStatus = 'Budget Status is required.';
    } else if (budgetStep === 3) {
      if (!ctx.allocationAreas || ctx.allocationAreas.length === 0) {
        errs.allocationAreas = 'Select at least one allocation area.';
      }
      if (ctx.allocationAreas.includes('Other') && !ctx.customAllocationArea.trim()) {
        errs.customAllocationArea = 'Please specify custom allocation area.';
      }
    } else if (budgetStep === 4) {
      const totalPriorities = ctx.prioritiesMostImportant.length + ctx.prioritiesImportant.length + ctx.prioritiesFlexible.length;
      if (totalPriorities === 0) {
        errs.priorities = 'Please select at least one priority item.';
      }
    } else if (budgetStep === 5) {
      const areas = ctx.allocationAreas || [];
      if (areas.includes('Personnel / Headcount') && !ctx.requiredHeadcount.trim()) {
        errs.requiredHeadcount = 'Required headcount is required.';
      }
      if (areas.some(a => ['Technology', 'Software / Licenses', 'Hardware / Equipment', 'Infrastructure'].includes(a)) && !ctx.requiredTechnology.trim()) {
        errs.requiredTechnology = 'Technology / Infrastructure requirement is required.';
      }
      if (areas.includes('Vendors / Contractors') && !ctx.externalService.trim()) {
        errs.externalService = 'External vendor / service requirement is required.';
      }
    } else if (budgetStep === 6) {
      if (!ctx.tradeOffs || ctx.tradeOffs.length === 0) {
        errs.tradeOffs = 'Select at least one trade-off preference.';
      }
      if (ctx.tradeOffs.includes('Other') && !ctx.customTradeOff.trim()) {
        errs.customTradeOff = 'Please specify custom trade-off.';
      }
    } else if (budgetStep === 7) {
      const isPmAI = selectedMode === 'ai-ai' || humanRole !== 'project-manager';
      const isFmAI = selectedMode === 'ai-ai' || humanRole !== 'finance-manager';
      const isDhAI = selectedMode === 'ai-ai' || humanRole !== 'department-head';

      if (isPmAI && activeTabRole === 'pm') {
        if (!ctx.pmHardBoundary) errs.pmHardBoundary = 'Hard boundary is required.';
        if (ctx.pmHardBoundary === 'Other' && !ctx.pmCustomHardBoundary.trim()) errs.pmCustomHardBoundary = 'Please specify custom boundary.';
        if (!ctx.pmPreferredOutcome) errs.pmPreferredOutcome = 'Preferred outcome is required.';
      }
      if (isFmAI && activeTabRole === 'fm') {
        if (!ctx.fmHardBoundary) errs.fmHardBoundary = 'Hard boundary is required.';
        if (ctx.fmHardBoundary === 'Other' && !ctx.fmCustomHardBoundary.trim()) errs.fmCustomHardBoundary = 'Please specify custom boundary.';
        if (!ctx.fmPreferredOutcome) errs.fmPreferredOutcome = 'Preferred outcome is required.';
      }
      if (isDhAI && activeTabRole === 'dh') {
        if (!ctx.dhHardBoundary) errs.dhHardBoundary = 'Hard boundary is required.';
        if (ctx.dhHardBoundary === 'Other' && !ctx.dhCustomHardBoundary.trim()) errs.dhCustomHardBoundary = 'Please specify custom boundary.';
        if (!ctx.dhPreferredOutcome) errs.dhPreferredOutcome = 'Preferred outcome is required.';
      }
    }

    return errs;
  };

  const errors = getErrors();
  const isCurrentStepValid = Object.keys(errors).length === 0;

  const toggleAllocationArea = (item: string) => {
    setCtx((prev: BudgetAllocationContext) => {
      const arr = prev.allocationAreas || [];
      const nextArr = arr.includes(item) ? arr.filter((i: string) => i !== item) : [...arr, item];
      return { ...prev, allocationAreas: nextArr };
    });
  };

  const toggleTradeOff = (item: string) => {
    setCtx((prev: BudgetAllocationContext) => {
      const arr = prev.tradeOffs || [];
      const nextArr = arr.includes(item) ? arr.filter((i: string) => i !== item) : [...arr, item];
      return { ...prev, tradeOffs: nextArr };
    });
  };

  const togglePriorityItem = (tier: 'most' | 'important' | 'flexible', item: string) => {
    setCtx((prev: BudgetAllocationContext) => {
      let most = [...prev.prioritiesMostImportant];
      let important = [...prev.prioritiesImportant];
      let flexible = [...prev.prioritiesFlexible];

      most = most.filter(i => i !== item);
      important = important.filter(i => i !== item);
      flexible = flexible.filter(i => i !== item);

      if (tier === 'most') most.push(item);
      else if (tier === 'important') important.push(item);
      else if (tier === 'flexible') flexible.push(item);

      return {
        ...prev,
        prioritiesMostImportant: most,
        prioritiesImportant: important,
        prioritiesFlexible: flexible,
      };
    });
  };

  const toggleFlexibleArea = (role: 'pm' | 'fm' | 'dh', area: string) => {
    setCtx((prev: BudgetAllocationContext) => {
      const field = role === 'pm' ? 'pmFlexibleAreas' : role === 'fm' ? 'fmFlexibleAreas' : 'dhFlexibleAreas';
      const arr = prev[field] || [];
      const nextArr = arr.includes(area) ? arr.filter((i: string) => i !== area) : [...arr, area];
      return { ...prev, [field]: nextArr };
    });
  };

  const handleNextStep = () => {
    setAttemptedSubmit(true);
    if (!isCurrentStepValid) return;

    if (budgetStep < 7) {
      setBudgetStep(prev => prev + 1);
      setAttemptedSubmit(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const getCleanNumber = (val: string) => Number((val || '').toString().replace(/[\$,₹,€,£,\s]/g, '')) || 0;

      const formattedParams = {
        "Project Type": ctx.projectType === 'Other' ? ctx.customProjectType : ctx.projectType,
        "Industry": ctx.industry === 'Other' ? ctx.customIndustry : ctx.industry,
        "Project Stage": ctx.projectStage === 'Other' ? ctx.customProjectStage : ctx.projectStage,
        "Situation": ctx.projectSituation === 'Other' ? ctx.customSituation : ctx.projectSituation,
        "Currency": ctx.currency,
        "Total Available Budget": `${ctx.currency} ${ctx.totalAvailableBudget}`,
        "Requested Budget": `${ctx.currency} ${ctx.currentRequestedBudget}`,
        "Budget Period": ctx.budgetPeriod,
        "Budget Status": ctx.budgetStatus,
        "Allocation Areas": ctx.allocationAreas.join(', '),
        "Trade-Offs": ctx.tradeOffs.join(', '),
      };

      configuredAgents.forEach((agent) => {
        updateAgentConfig(agent.id, {
          targetAllocation: ctx.currentRequestedBudget,
          minAllocation: (getCleanNumber(ctx.currentRequestedBudget) * 0.8).toString(),
          maxAllocation: ctx.totalAvailableBudget || ctx.currentRequestedBudget,
          currency: ctx.currency,
          departmentPriority: ctx.prioritiesMostImportant.join(', ') || 'Project Delivery',
          budgetJustification: ctx.businessObjective || ctx.projectSituation,
          timeline: ctx.projectStage,
          priorityAreas: ctx.allocationAreas.join(', '),
          businessRequirements: `Trade-offs: ${ctx.tradeOffs.join(', ')}`,
          customInstructions: agent.id.includes('pm') ? ctx.pmCustomInstructions : agent.id.includes('fm') ? ctx.fmCustomInstructions : ctx.dhCustomInstructions,
          negotiation_parameters: formattedParams,
        });
      });

      navigate('/setup/review');
    }
  };

  const stepsList = [
    { num: 1, title: "Context" },
    { num: 2, title: "Budget & Allocation" },
    { num: 3, title: "Allocation Areas" },
    { num: 4, title: "Priorities" },
    { num: 5, title: "Resources" },
    { num: 6, title: "Trade-offs" },
    { num: 7, title: "Position" },
  ];

  return (
    <div className="space-y-6">
      {/* LOCAL SUB-STEP PROGRESS BAR */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {stepsList.map(s => {
            const stepNum = s.num;
            const isActive = budgetStep === stepNum;
            const isCompleted = budgetStep > stepNum;
            const isSelectable = isCompleted || stepNum === budgetStep;

            return (
              <button
                key={stepNum}
                type="button"
                disabled={!isSelectable}
                onClick={() => {
                  if (isSelectable) {
                    setBudgetStep(stepNum);
                    setAttemptedSubmit(false);
                  }
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {isCompleted ? '✓' : stepNum}
                </span>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* WIZARD CONTENT CONTAINER */}
      <div className="p-6 md:p-8 rounded-[22px] border border-slate-200 bg-white/70 shadow-sm backdrop-blur-md space-y-6">
        {/* STEP 1: PROJECT CONTEXT */}
        {budgetStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-blue-600" />
                Step 01 — Project Context
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Collect minimum project context for realistic budget allocation negotiation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Type */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Project Type *
                </label>
                <select
                  value={ctx.projectType}
                  onChange={(e) => setCtx({ projectType: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.projectType ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Project Type</option>
                  {BUDGET_PROJECT_TYPES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.projectType && <p className="text-[10px] text-red-500 font-semibold">{errors.projectType}</p>}

                {ctx.projectType === 'Other' && (
                  <input
                    type="text"
                    value={ctx.customProjectType}
                    onChange={(e) => setCtx({ customProjectType: e.target.value })}
                    placeholder="Specify project type..."
                    className={`w-full mt-2 px-3 py-2 bg-white border rounded-xl text-xs font-medium ${
                      attemptedSubmit && errors.customProjectType ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                    }`}
                  />
                )}
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Industry / Domain *
                </label>
                <select
                  value={ctx.industry}
                  onChange={(e) => setCtx({ industry: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.industry ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Industry</option>
                  {BUDGET_INDUSTRIES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.industry && <p className="text-[10px] text-red-500 font-semibold">{errors.industry}</p>}

                {ctx.industry === 'Other' && (
                  <input
                    type="text"
                    value={ctx.customIndustry}
                    onChange={(e) => setCtx({ customIndustry: e.target.value })}
                    placeholder="Specify industry..."
                    className={`w-full mt-2 px-3 py-2 bg-white border rounded-xl text-xs font-medium ${
                      attemptedSubmit && errors.customIndustry ? 'border-red-400 bg-red-50/50' : 'border-slate-200'
                    }`}
                  />
                )}
              </div>

              {/* Project Stage */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Project Stage *
                </label>
                <select
                  value={ctx.projectStage}
                  onChange={(e) => setCtx({ projectStage: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.projectStage ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Project Stage</option>
                  {BUDGET_STAGES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.projectStage && <p className="text-[10px] text-red-500 font-semibold">{errors.projectStage}</p>}
              </div>

              {/* Project Importance */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Project Importance *
                </label>
                <select
                  value={ctx.projectImportance}
                  onChange={(e) => setCtx({ projectImportance: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.projectImportance ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Project Importance</option>
                  {BUDGET_IMPORTANCE_LEVELS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.projectImportance && <p className="text-[10px] text-red-500 font-semibold">{errors.projectImportance}</p>}
              </div>

              {/* Project Situation */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Project Situation & Drivers *
                </label>
                <select
                  value={ctx.projectSituation}
                  onChange={(e) => setCtx({ projectSituation: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.projectSituation ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Project Situation</option>
                  {BUDGET_SITUATIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.projectSituation && <p className="text-[10px] text-red-500 font-semibold">{errors.projectSituation}</p>}

                {ctx.projectSituation === 'Other' && (
                  <input
                    type="text"
                    value={ctx.customSituation}
                    onChange={(e) => setCtx({ customSituation: e.target.value })}
                    placeholder="Specify project situation..."
                    className="w-full mt-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                  />
                )}
              </div>

              {/* Business Objective */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Key Business Objective (Optional)
                </label>
                <textarea
                  value={ctx.businessObjective}
                  onChange={(e) => setCtx({ businessObjective: e.target.value })}
                  placeholder="Describe main goals for this budget allocation (e.g. Increase product output by 25%)..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium h-20 resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: BUDGET & ALLOCATION */}
        {budgetStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={18} className="text-blue-600" />
                Step 02 — Interactive Budget Workspace
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Define the financial scale, budget status, and currency for allocation negotiations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Currency */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Currency Selector *
                </label>
                <CurrencySelector
                  value={ctx.currency}
                  onChange={(val) => setCtx({ currency: val })}
                />
                {attemptedSubmit && errors.currency && <p className="text-[10px] text-red-500 font-semibold">{errors.currency}</p>}
              </div>

              {/* Total Available Budget */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Total Available Pool Budget ({ctx.currency}) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ctx.totalAvailableBudget}
                    onChange={(e) => setCtx({ totalAvailableBudget: e.target.value })}
                    placeholder="e.g. 500000"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                      attemptedSubmit && errors.totalAvailableBudget ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {attemptedSubmit && errors.totalAvailableBudget && <p className="text-[10px] text-red-500 font-semibold">{errors.totalAvailableBudget}</p>}
              </div>

              {/* Budget Period */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Budget Period *
                </label>
                <select
                  value={ctx.budgetPeriod}
                  onChange={(e) => setCtx({ budgetPeriod: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.budgetPeriod ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Budget Period</option>
                  {BUDGET_PERIODS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.budgetPeriod && <p className="text-[10px] text-red-500 font-semibold">{errors.budgetPeriod}</p>}
              </div>

              {/* Current Requested Budget */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Current Requested Budget ({ctx.currency}) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ctx.currentRequestedBudget}
                    onChange={(e) => setCtx({ currentRequestedBudget: e.target.value })}
                    placeholder="e.g. 450000"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all ${
                      attemptedSubmit && errors.currentRequestedBudget ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {attemptedSubmit && errors.currentRequestedBudget && <p className="text-[10px] text-red-500 font-semibold">{errors.currentRequestedBudget}</p>}
              </div>

              {/* Budget Status */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Budget Status *
                </label>
                <select
                  value={ctx.budgetStatus}
                  onChange={(e) => setCtx({ budgetStatus: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                    attemptedSubmit && errors.budgetStatus ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                  }`}
                >
                  <option value="" disabled>Select Budget Status</option>
                  {BUDGET_STATUSES.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {attemptedSubmit && errors.budgetStatus && <p className="text-[10px] text-red-500 font-semibold">{errors.budgetStatus}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: WHAT IS BEING ALLOCATED? */}
        {budgetStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Package size={18} className="text-blue-600" />
                Step 03 — What is Being Allocated?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select the target resource and expense categories requiring budget allocation.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Allocation Areas (Multi-Select) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {BUDGET_ALLOCATION_AREAS.map(area => {
                  const isSelected = ctx.allocationAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleAllocationArea(area)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{area}</span>
                      {isSelected && <Check size={14} className="text-blue-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
              {attemptedSubmit && errors.allocationAreas && <p className="text-[10px] text-red-500 font-semibold">{errors.allocationAreas}</p>}

              {ctx.allocationAreas.includes('Other') && (
                <input
                  type="text"
                  value={ctx.customAllocationArea}
                  onChange={(e) => setCtx({ customAllocationArea: e.target.value })}
                  placeholder="Specify custom allocation area..."
                  className="w-full mt-3 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 4: PRIORITIES */}
        {budgetStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ListOrdered size={18} className="text-blue-600" />
                Step 04 — Interactive Priority Builder
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                What must receive funding first? Organize priority items into funding buckets.
              </p>
            </div>

            {attemptedSubmit && errors.priorities && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 p-3 rounded-xl border border-red-200">{errors.priorities}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {BUDGET_PRIORITY_ITEMS.map(item => {
                const isMost = ctx.prioritiesMostImportant.includes(item);
                const isImportant = ctx.prioritiesImportant.includes(item);
                const isFlexible = ctx.prioritiesFlexible.includes(item);

                return (
                  <div key={item} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">{item}</span>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => togglePriorityItem('most', item)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all text-center ${
                          isMost ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Most
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePriorityItem('important', item)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all text-center ${
                          isImportant ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Important
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePriorityItem('flexible', item)}
                        className={`px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all text-center ${
                          isFlexible ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Flexible
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 5: RESOURCE REQUIREMENTS */}
        {budgetStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BriefcaseBusiness size={18} className="text-blue-600" />
                Step 05 — Resource Requirements
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Contextual details based on your Step 03 allocation selections.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personnel Module */}
              {ctx.allocationAreas.includes('Personnel / Headcount') && (
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Personnel / Headcount Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Required Headcount *</label>
                      <input
                        type="text"
                        value={ctx.requiredHeadcount}
                        onChange={(e) => setCtx({ requiredHeadcount: e.target.value })}
                        placeholder="e.g. 5 Engineers"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Critical Skills</label>
                      <input
                        type="text"
                        value={ctx.criticalSkills}
                        onChange={(e) => setCtx({ criticalSkills: e.target.value })}
                        placeholder="e.g. Senior Full-Stack, AI"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Capacity Requirement</label>
                      <input
                        type="text"
                        value={ctx.capacityRequirement}
                        onChange={(e) => setCtx({ capacityRequirement: e.target.value })}
                        placeholder="e.g. Full-time 100%"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Technology Module */}
              {ctx.allocationAreas.some(a => ['Technology', 'Software / Licenses', 'Hardware / Equipment', 'Infrastructure'].includes(a)) && (
                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Technology & Equipment Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Required Technology *</label>
                      <input
                        type="text"
                        value={ctx.requiredTechnology}
                        onChange={(e) => setCtx({ requiredTechnology: e.target.value })}
                        placeholder="e.g. Cloud Compute Servers"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">License Requirement</label>
                      <input
                        type="text"
                        value={ctx.licenseRequirement}
                        onChange={(e) => setCtx({ licenseRequirement: e.target.value })}
                        placeholder="e.g. 50 Enterprise Licenses"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Infrastructure Requirement</label>
                      <input
                        type="text"
                        value={ctx.infrastructureRequirement}
                        onChange={(e) => setCtx({ infrastructureRequirement: e.target.value })}
                        placeholder="e.g. High-throughput DB"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Vendor Module */}
              {ctx.allocationAreas.includes('Vendors / Contractors') && (
                <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-4 md:col-span-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-800">Vendor & Contractor Details</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">External Service *</label>
                      <input
                        type="text"
                        value={ctx.externalService}
                        onChange={(e) => setCtx({ externalService: e.target.value })}
                        placeholder="e.g. Security Audit Agency"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Contract Requirement</label>
                      <input
                        type="text"
                        value={ctx.contractRequirement}
                        onChange={(e) => setCtx({ contractRequirement: e.target.value })}
                        placeholder="e.g. Fixed Price SOW"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Supplier Dependency</label>
                      <input
                        type="text"
                        value={ctx.supplierDependency}
                        onChange={(e) => setCtx({ supplierDependency: e.target.value })}
                        placeholder="e.g. Critical path deliverable"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback default message if no detailed areas selected */}
              {!ctx.allocationAreas.includes('Personnel / Headcount') &&
               !ctx.allocationAreas.some(a => ['Technology', 'Software / Licenses', 'Hardware / Equipment', 'Infrastructure'].includes(a)) &&
               !ctx.allocationAreas.includes('Vendors / Contractors') && (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-500 text-xs md:col-span-2">
                  No specialized resource modules selected in Step 03. You can click <strong>Next Step</strong> to proceed.
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: TRADE-OFFS */}
        {budgetStep === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders size={18} className="text-blue-600" />
                Step 06 — Project Trade-Offs
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                What can change if the budget cannot meet every request? Select acceptable trade-offs.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Acceptable Trade-Off Cards (Multi-Select) *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {BUDGET_TRADEOFFS.map(item => {
                  const isSelected = ctx.tradeOffs.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleTradeOff(item)}
                      className={`p-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{item}</span>
                      {isSelected && <Check size={14} className="text-blue-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
              {attemptedSubmit && errors.tradeOffs && <p className="text-[10px] text-red-500 font-semibold">{errors.tradeOffs}</p>}

              {ctx.tradeOffs.includes('Other') && (
                <input
                  type="text"
                  value={ctx.customTradeOff}
                  onChange={(e) => setCtx({ customTradeOff: e.target.value })}
                  placeholder="Specify custom trade-off..."
                  className="w-full mt-3 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                />
              )}
            </div>
          </div>
        )}

        {/* STEP 7: NEGOTIATION POSITION */}
        {budgetStep === 7 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-blue-600" />
                Step 07 — Negotiation Position
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Configure hard boundaries, preferred outcomes, and flexible areas for budget agents.
              </p>
            </div>

            {/* ROLE TABS IN AI VS AI MODE */}
            {selectedMode === 'ai-ai' && (
              <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTabRole('pm')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTabRole === 'pm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Project Manager
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabRole('fm')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTabRole === 'fm' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Finance Manager
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabRole('dh')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTabRole === 'dh' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Department Head
                </button>
              </div>
            )}

            {/* TAB CONTENT PER ROLE */}
            {(() => {
              const currentRole = selectedMode === 'human-ai'
                ? (humanRole === 'department-head' ? 'pm' : humanRole === 'project-manager' ? 'fm' : 'dh')
                : activeTabRole;

              const boundaries = currentRole === 'pm' ? PM_HARD_BOUNDARIES : currentRole === 'fm' ? FM_HARD_BOUNDARIES : DH_HARD_BOUNDARIES;
              const outcomes = currentRole === 'pm' ? PM_PREFERRED_OUTCOMES : currentRole === 'fm' ? FM_PREFERRED_OUTCOMES : DH_PREFERRED_OUTCOMES;
              const hardVal = currentRole === 'pm' ? ctx.pmHardBoundary : currentRole === 'fm' ? ctx.fmHardBoundary : ctx.dhHardBoundary;
              const customHardVal = currentRole === 'pm' ? ctx.pmCustomHardBoundary : currentRole === 'fm' ? ctx.fmCustomHardBoundary : ctx.dhCustomHardBoundary;
              const prefVal = currentRole === 'pm' ? ctx.pmPreferredOutcome : currentRole === 'fm' ? ctx.fmPreferredOutcome : ctx.dhPreferredOutcome;
              const flexAreas = currentRole === 'pm' ? ctx.pmFlexibleAreas : currentRole === 'fm' ? ctx.fmFlexibleAreas : ctx.dhFlexibleAreas;
              const nonNegVal = currentRole === 'pm' ? ctx.pmNonNegotiables : currentRole === 'fm' ? ctx.fmNonNegotiables : ctx.dhNonNegotiables;
              const instructionsVal = currentRole === 'pm' ? ctx.pmCustomInstructions : currentRole === 'fm' ? ctx.fmCustomInstructions : ctx.dhCustomInstructions;

              const setHard = (v: string) => setCtx(currentRole === 'pm' ? { pmHardBoundary: v } : currentRole === 'fm' ? { fmHardBoundary: v } : { dhHardBoundary: v });
              const setCustomHard = (v: string) => setCtx(currentRole === 'pm' ? { pmCustomHardBoundary: v } : currentRole === 'fm' ? { fmCustomHardBoundary: v } : { dhCustomHardBoundary: v });
              const setPref = (v: string) => setCtx(currentRole === 'pm' ? { pmPreferredOutcome: v } : currentRole === 'fm' ? { fmPreferredOutcome: v } : { dhPreferredOutcome: v });
              const setNonNeg = (v: string) => setCtx(currentRole === 'pm' ? { pmNonNegotiables: v } : currentRole === 'fm' ? { fmNonNegotiables: v } : { dhNonNegotiables: v });
              const setInstructions = (v: string) => setCtx(currentRole === 'pm' ? { pmCustomInstructions: v } : currentRole === 'fm' ? { fmCustomInstructions: v } : { dhCustomInstructions: v });

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hard Boundary */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Hard Boundary *
                    </label>
                    <select
                      value={hardVal}
                      onChange={(e) => setHard(e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                        attemptedSubmit && (errors.pmHardBoundary || errors.fmHardBoundary || errors.dhHardBoundary) ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    >
                      <option value="" disabled>Select Hard Boundary</option>
                      {boundaries.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>

                    {hardVal === 'Other' && (
                      <input
                        type="text"
                        value={customHardVal}
                        onChange={(e) => setCustomHard(e.target.value)}
                        placeholder="Specify custom hard boundary..."
                        className="w-full mt-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                      />
                    )}
                  </div>

                  {/* Preferred Outcome */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Preferred Outcome *
                    </label>
                    <select
                      value={prefVal}
                      onChange={(e) => setPref(e.target.value)}
                      className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer ${
                        attemptedSubmit && (errors.pmPreferredOutcome || errors.fmPreferredOutcome || errors.dhPreferredOutcome) ? 'border-red-400 bg-red-50/50' : 'border-slate-200 focus:border-blue-500'
                      }`}
                    >
                      <option value="" disabled>Select Preferred Outcome</option>
                      {outcomes.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  {/* Flexible Areas */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Flexible Areas (Multi-Select Chips)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {BUDGET_FLEXIBLE_AREAS.map(area => {
                        const isSelected = flexAreas.includes(area);
                        return (
                          <button
                            key={area}
                            type="button"
                            onClick={() => toggleFlexibleArea(currentRole, area)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                              isSelected ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {area} {isSelected && '✓'}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Non-Negotiables */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Non-Negotiable Requirements
                    </label>
                    <input
                      type="text"
                      value={nonNegVal}
                      onChange={(e) => setNonNeg(e.target.value)}
                      placeholder="e.g. Security compliance audit is mandatory..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>

                  {/* Custom Negotiation Instructions */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Custom Negotiation Instruction (Optional)
                    </label>
                    <textarea
                      value={instructionsVal}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="Enter specific instructions for this AI position during negotiation..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium h-20 resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* NAVIGATION CONTROLS */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              if (budgetStep > 1) {
                setBudgetStep(prev => prev - 1);
                setAttemptedSubmit(false);
              } else {
                navigate('/setup/agents');
              }
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            {budgetStep === 1 ? 'Back to Agents' : 'Previous Step'}
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            {budgetStep < 7 ? (
              <>
                Next Step
                <ChevronRight size={14} />
              </>
            ) : (
              <>
                Review & Confirm
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const GoalsConstraintsScreen: React.FC = () => {
  const navigate = useNavigate();

  const {
    selectedScenario,
    configuredAgents,
    updateAgentGoal,
    addAgentGoal,
    removeAgentGoal,
    updateAgentConstraint,
    addAgentConstraint,
    removeAgentConstraint,
    updateAgentConfig,
    selectedMode,
    humanRole,
    resetSimulation,
    resetPractice,
  } = useStore();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [continueAttempted, setContinueAttempted] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);

  // Dynamic negotiation dimensions toggles state for non-job scenarios
  const [enabledDimensions, setEnabledDimensions] = useState<Record<string, boolean>>({
    paymentTerms: true,
    deliveryRequirement: true,
    warrantySupport: true,
    contractDuration: false,
  });

  const toggleDimension = (dim: string) => {
    setEnabledDimensions(prev => {
      const nextVal = !prev[dim];
      if (!nextVal) {
        activeAgents.forEach(agent => {
          if (dim === 'paymentTerms') updateAgentConfig(agent.id, { paymentTerms: '' });
          if (dim === 'deliveryRequirement') updateAgentConfig(agent.id, { deliveryRequirement: '' });
          if (dim === 'warrantySupport') updateAgentConfig(agent.id, { warrantySupport: '' });
          if (dim === 'contractDuration') {
            const nextParams = { ...agent.negotiation_parameters };
            delete nextParams.contractDuration;
            updateAgentConfig(agent.id, { negotiation_parameters: nextParams });
          }
        });
      }
      return { ...prev, [dim]: nextVal };
    });
  };

  const expectedCount = selectedScenario?.defaultAgents?.length || 2;
  const activeAgents = configuredAgents.slice(0, expectedCount);

  const isBuyerOrCandidateOrPM = (agent: any) => {
    const roleLower = (agent.role || '').toLowerCase();
    const idLower = (agent.id || '').toLowerCase();
    return (
      idLower.includes('buyer') ||
      idLower.includes('candidate') ||
      idLower.includes('project-manager') ||
      roleLower.includes('buyer') ||
      roleLower.includes('candidate') ||
      roleLower.includes('r&d lead') ||
      roleLower.includes('manager')
    );
  };

  const isNumericOnly = (val: string) => {
    if (!val || val.toString().trim() === '') return false;
    return !isNaN(Number(val.toString().replace(/[\$,₹,€,£,\s]/g, '')));
  };

  const getCleanNumber = (val: string) => {
    if (!val) return 0;
    return Number(val.toString().replace(/[\$,₹,€,£,\s]/g, '')) || 0;
  };

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
    ? activeAgents.filter((_, idx) => !isAgentHuman(idx))
    : activeAgents;

  // Helper to validate step-by-step for wizard
  const isStepValid = (step: number) => {
    if (selectedScenario?.id !== 'job-offer') return true;

    for (let i = 0; i < expectedCount; i++) {
      const agent = activeAgents[i];
      if (!agent) return false;

      const isHuman = isAgentHuman(i);
      if (selectedMode === 'human-ai' && isHuman) continue;

      const isCandidate = (agent.role || '').toLowerCase().includes('candidate') || agent.id.includes('candidate');

      if (isCandidate) {
        const ctx = agent.jobCandidateContext || DEFAULT_CANDIDATE_CONTEXT;
        const errs = getCandidateErrors(ctx);

        if (step === 1) {
          if (errs.jobPosition || errs.experienceLevel || errs.companyName || errs.companyType || errs.hiringType || errs.jobLevel) return false;
        } else if (step === 2) {
          if (errs.currentSalary || errs.expectedSalary || errs.preferredSalaryMin || errs.preferredSalaryTarget || errs.compensationType) return false;
        } else if (step === 3) {
          if (errs.workLocation || errs.workMode || errs.joiningAvailability || errs.otherOffers || errs.otherOffersDetails) return false;
        } else if (step === 4) {
          if (errs.importantBenefits || errs.candidatePriorities || errs.nonNegotiables || errs.negotiationFlexibility || errs.customInfo) return false;
        }
      } else {
        const ctx = agent.jobEmployerContext || DEFAULT_EMPLOYER_CONTEXT;
        const errs = getEmployerErrors(ctx);

        if (step === 1) {
          if (errs.companyName || errs.companyType || errs.jobPosition || errs.jobLevel || errs.hiringType || errs.requiredExperience) return false;
        } else if (step === 2) {
          if (errs.salaryBudgetMin || errs.salaryBudgetTarget || errs.salaryBudgetMax || errs.compensationStructure) return false;
        } else if (step === 3) {
          if (errs.workLocation || errs.workMode || errs.hiringUrgency || errs.mustHaveSkills || errs.preferredSkills) return false;
        } else if (step === 4) {
          if (errs.benefitsOffered || errs.employerPriorities || errs.nonNegotiables || errs.compensationFlexibility || errs.customInfo) return false;
        }
      }
    }
    return true;
  };

  const isGoalsConstraintsValid = () => {
    for (let i = 0; i < expectedCount; i++) {
      const agent = activeAgents[i];
      if (!agent) return false;

      const isHuman = isAgentHuman(i);
      if (selectedMode === 'human-ai' && isHuman) continue;

      const isAI = selectedMode === 'human-ai' && !isHuman;

      if (selectedScenario?.id === 'vendor-pricing') {
        const isBuyer = isBuyerOrCandidateOrPM(agent);
        if (isBuyer) {
          if (!agent.targetPrice?.toString().trim()) return false;
          if (!isAI) {
            if (!agent.maxBudget?.toString().trim() || !isNumericOnly(agent.maxBudget)) return false;
            if (getCleanNumber(agent.targetPrice) > getCleanNumber(agent.maxBudget)) return false;
          }
        } else {
          if (!agent.targetPrice?.toString().trim()) return false;
          if (!isAI) {
            if (!agent.minPrice?.toString().trim() || !isNumericOnly(agent.minPrice)) return false;
            if (getCleanNumber(agent.minPrice) > getCleanNumber(agent.targetPrice)) return false;
          }
        }

        if (!agent.quantityVolume?.toString().trim() || !isNumericOnly(agent.quantityVolume)) return false;
        if (enabledDimensions.paymentTerms && !agent.paymentTerms?.trim()) return false;
        if (enabledDimensions.deliveryRequirement && !agent.deliveryRequirement?.trim()) return false;
        if (enabledDimensions.warrantySupport && !agent.warrantySupport?.trim()) return false;
        if (enabledDimensions.contractDuration && !agent.negotiation_parameters?.contractDuration?.trim()) return false;

      } else if (selectedScenario?.id === 'job-offer') {
        const isCandidate = (agent.role || '').toLowerCase().includes('candidate') || agent.id.includes('candidate');
        if (isCandidate) {
          const ctx = agent.jobCandidateContext || DEFAULT_CANDIDATE_CONTEXT;
          const errs = getCandidateErrors(ctx);
          if (Object.keys(errs).length > 0) return false;
        } else {
          const ctx = agent.jobEmployerContext || DEFAULT_EMPLOYER_CONTEXT;
          const errs = getEmployerErrors(ctx);
          if (Object.keys(errs).length > 0) return false;
        }

      } else if (selectedScenario?.id === 'budget-allocation') {
        if (!agent.targetAllocation?.toString().trim() || !isNumericOnly(agent.targetAllocation)) return false;
        if (!isAI) {
          if (!agent.minAllocation?.toString().trim() || !isNumericOnly(agent.minAllocation)) return false;
          if (getCleanNumber(agent.minAllocation) > getCleanNumber(agent.targetAllocation)) return false;
        }
        if (!agent.departmentPriority?.trim() || !agent.budgetJustification?.trim()) return false;
      }
    }

    if (selectedScenario?.id === 'budget-allocation') {
      let totalTarget = 0;
      for (let i = 0; i < expectedCount; i++) {
        const agent = activeAgents[i];
        if (agent && agent.targetAllocation) {
          totalTarget += getCleanNumber(agent.targetAllocation);
        }
      }
      if (totalTarget > 1000000) return false;
    }

    return true;
  };

  const isValid = isGoalsConstraintsValid();

  const handleContinue = () => {
    setContinueAttempted(true);

    if (selectedScenario?.id === 'job-offer' && wizardStep < 5) {
      if (isStepValid(wizardStep)) {
        setWizardStep(prev => prev + 1);
        setErrorMsg(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrorMsg('Please complete all highlighted required fields for this step.');
      }
      return;
    }

    if (!isValid) {
      setErrorMsg('Please complete the highlighted fields before continuing.');
      setTimeout(() => {
        const firstInvalidElement = document.querySelector('.border-red-400');
        if (firstInvalidElement) {
          firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const inputEl = firstInvalidElement.querySelector('input, select, textarea') || firstInvalidElement;
          if (inputEl && typeof (inputEl as any).focus === 'function') {
            (inputEl as any).focus();
          }
        }
      }, 50);
      return;
    }

    // Prepare structured context & auto-calculate private boundaries
    activeAgents.forEach((agent, index) => {
      const isHuman = selectedMode === 'human-ai' && (
        (humanRole === 'buyer' && index === 0) ||
        (humanRole === 'vendor' && index === 1) ||
        (humanRole === 'recruiter' && index === 0) ||
        (humanRole === 'candidate' && index === 1) ||
        (humanRole === 'department-head' && index === 0) ||
        (humanRole === 'project-manager' && index === 1) ||
        (humanRole === 'finance-director' && index === 2)
      );
      const isAI = selectedMode === 'human-ai' && !isHuman;

      if (selectedScenario?.id === 'job-offer') {
        const isCandidate = (agent.role || '').toLowerCase().includes('candidate') || agent.id.includes('candidate') || (humanRole === 'candidate' && isHuman);
        if (isCandidate) {
          const ctx = agent.jobCandidateContext || DEFAULT_CANDIDATE_CONTEXT;
          const formattedParams = {
            "Job Position": ctx.jobPosition,
            "Experience Level": ctx.experienceLevel,
            "Company Name": ctx.companyName,
            "Company Type": ctx.companyType,
            "Hiring Type": ctx.hiringType,
            "Work Location": ctx.workLocation,
            "Work Mode": ctx.workMode,
            "Job Level": ctx.jobLevel,
            "Current Salary": ctx.currentSalary,
            "Expected Salary": ctx.expectedSalary,
            "Preferred Salary Range": `${ctx.preferredSalaryMin} - ${ctx.preferredSalaryTarget}`,
            "Compensation Type": ctx.compensationType,
            "Notice Period / Availability": ctx.joiningAvailability,
            "Other Offers": ctx.otherOffers === 'Yes' ? (ctx.otherOffersDetails || 'Yes') : 'No competing offers',
            "Important Benefits": ctx.importantBenefits.join(', '),
            "Candidate Priorities": ctx.candidatePriorities.join(', '),
            "Non-Negotiables": ctx.nonNegotiables,
            "Negotiation Flexibility": ctx.negotiationFlexibility,
            "custom_instructions": ctx.customInfo,
          };
          updateAgentConfig(agent.id, {
            jobCandidateContext: ctx,
            targetSalary: ctx.expectedSalary,
            minSalary: ctx.preferredSalaryMin,
            negotiation_parameters: formattedParams,
            goals: [
              { id: 'g1', text: `Obtain expected compensation of ${ctx.expectedSalary}`, priority: 'High' },
              { id: 'g2', text: `Secure ${ctx.workMode} work arrangement`, priority: 'High' },
              { id: 'g3', text: `Obtain key benefits: ${ctx.importantBenefits.slice(0, 2).join(', ')}`, priority: 'Medium' }
            ],
            constraints: [
              { id: 'c1', label: 'Minimum Acceptable Salary', value: ctx.preferredSalaryMin },
              { id: 'c2', label: 'Non-Negotiables', value: ctx.nonNegotiables }
            ]
          });
        } else {
          const ctx = agent.jobEmployerContext || DEFAULT_EMPLOYER_CONTEXT;
          const formattedParams = {
            "Company Name": ctx.companyName,
            "Company Type": ctx.companyType,
            "Job Position": ctx.jobPosition,
            "Job Level": ctx.jobLevel,
            "Hiring Type": ctx.hiringType,
            "Required Experience": ctx.requiredExperience,
            "Work Location": ctx.workLocation,
            "Work Mode": ctx.workMode,
            "Salary Budget Range": `${ctx.salaryBudgetMin} - ${ctx.salaryBudgetTarget} (Max Cap: ${ctx.salaryBudgetMax})`,
            "Compensation Structure": ctx.compensationStructure,
            "Benefits Offered": ctx.benefitsOffered.join(', '),
            "Hiring Urgency": ctx.hiringUrgency,
            "Must-Have Skills": ctx.mustHaveSkills,
            "Preferred Skills": ctx.preferredSkills,
            "Employer Priorities": ctx.employerPriorities.join(', '),
            "Non-Negotiables": ctx.nonNegotiables,
            "Compensation Flexibility": ctx.compensationFlexibility,
            "custom_instructions": ctx.customInfo,
          };
          updateAgentConfig(agent.id, {
            jobEmployerContext: ctx,
            targetSalary: ctx.salaryBudgetTarget,
            maxSalary: ctx.salaryBudgetMax,
            negotiation_parameters: formattedParams,
            goals: [
              { id: 'g1', text: `Close offer within target budget ${ctx.salaryBudgetTarget}`, priority: 'High' },
              { id: 'g2', text: `Ensure candidate meets skills: ${ctx.mustHaveSkills.slice(0, 30)}...`, priority: 'High' },
              { id: 'g3', text: `Hiring urgency timeline: ${ctx.hiringUrgency}`, priority: 'Medium' }
            ],
            constraints: [
              { id: 'c1', label: 'Maximum Approved Salary Cap', value: ctx.salaryBudgetMax },
              { id: 'c2', label: 'Non-Negotiables', value: ctx.nonNegotiables }
            ]
          });
        }
      }

      if (isAI) {
        if (selectedScenario?.id === 'vendor-pricing') {
          if (index === 0) {
            const calculatedMax = Math.round(getCleanNumber(agent.targetPrice || '') * 1.15).toString();
            updateAgentConfig(agent.id, { maxBudget: calculatedMax });
          } else {
            const calculatedMin = Math.round(getCleanNumber(agent.targetPrice || '') * 0.85).toString();
            updateAgentConfig(agent.id, { minPrice: calculatedMin });
          }
        } else if (selectedScenario?.id === 'budget-allocation') {
          const calculatedMin = Math.round(getCleanNumber(agent.targetAllocation || '') * 0.8).toString();
          updateAgentConfig(agent.id, { minAllocation: calculatedMin });
        }
      }
    });

    setErrorMsg(null);
    navigate('/setup/review');
  };

  const renderCurrencySelector = (agent: any) => (
    <select
      value={agent.currency || 'USD'}
      onChange={(e) => updateAgentConfig(agent.id, { currency: e.target.value })}
      className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0 cursor-pointer shadow-sm"
    >
      <option value="INR">INR (₹)</option>
      <option value="USD">USD ($)</option>
      <option value="EUR">EUR (€)</option>
      <option value="GBP">GBP (£)</option>
      <option value="AUD">AUD (A$)</option>
      <option value="CAD">CAD (C$)</option>
    </select>
  );

  const renderScenarioFields = (agent: any, isBuyerCandidatePM: boolean) => {
    const agentIndex = activeAgents.findIndex(a => a.id === agent.id);
    const isHuman = selectedMode === 'human-ai' && (
      (humanRole === 'buyer' && agentIndex === 0) ||
      (humanRole === 'vendor' && agentIndex === 1) ||
      (humanRole === 'recruiter' && agentIndex === 0) ||
      (humanRole === 'candidate' && agentIndex === 1) ||
      (humanRole === 'department-head' && agentIndex === 0) ||
      (humanRole === 'project-manager' && agentIndex === 1) ||
      (humanRole === 'finance-director' && agentIndex === 2)
    );
    const isAI = selectedMode === 'human-ai' && !isHuman;

    if (selectedScenario?.id === 'vendor-pricing') {
      if (isBuyerCandidatePM) {
        const isMaxBudgetInvalid = !!agent.maxBudget?.toString().trim() && !isNumericOnly(agent.maxBudget);
        const isTargetPriceInvalid = !!agent.targetPrice?.toString().trim() && !isNumericOnly(agent.targetPrice);
        const isRangeInvalid = !!agent.maxBudget && !!agent.targetPrice && getCleanNumber(agent.targetPrice) > getCleanNumber(agent.maxBudget);
        const isQuantityVolumeInvalid = !!agent.quantityVolume?.toString().trim() && !isNumericOnly(agent.quantityVolume);
        
        const isDeliveryInvalid = false;
        const isPaymentInvalid = false;
        const isWarrantyInvalid = false;
        const isContractInvalid = false;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            {!isAI && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isMaxBudgetInvalid ? 'text-red-500' : 'text-slate-400'}`}>Maximum Budget *</label>
                <div className="flex gap-1.5 items-center">
                  {renderCurrencySelector(agent)}
                  <input
                    type="text"
                    value={agent.maxBudget || ''}
                    onChange={(e) => updateAgentConfig(agent.id, { maxBudget: e.target.value })}
                    className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                      isMaxBudgetInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                    placeholder="e.g. 120000"
                  />
                </div>
                {isMaxBudgetInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric value is required.</p>}
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isTargetPriceInvalid || (!isAI && isRangeInvalid) ? 'text-red-500' : 'text-slate-400'}`}>Target Price *</label>
              <div className="flex gap-1.5 items-center">
                {renderCurrencySelector(agent)}
                <input
                  type="text"
                  value={agent.targetPrice || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { targetPrice: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isTargetPriceInvalid || (!isAI && isRangeInvalid) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 45"
                />
              </div>
              {isTargetPriceInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric value is required.</p>}
              {!isAI && isRangeInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Target price cannot exceed budget.</p>}
            </div>

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isQuantityVolumeInvalid ? 'text-red-500' : 'text-slate-400'}`}>Required Quantity (Seats/Units) *</label>
              <input
                type="text"
                value={agent.quantityVolume || ''}
                onChange={(e) => updateAgentConfig(agent.id, { quantityVolume: e.target.value })}
                className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                  isQuantityVolumeInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="e.g. 200"
              />
              {isQuantityVolumeInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric quantity is required.</p>}
            </div>

            {enabledDimensions.deliveryRequirement && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDeliveryInvalid ? 'text-red-500' : 'text-slate-400'}`}>Required Timeline *</label>
                <input
                  type="text"
                  value={agent.deliveryRequirement || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { deliveryRequirement: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isDeliveryInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. Within 30 days"
                />
                {isDeliveryInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Timeline preference is required.</p>}
              </div>
            )}

            {enabledDimensions.paymentTerms && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isPaymentInvalid ? 'text-red-500' : 'text-slate-400'}`}>Payment Preference *</label>
                <input
                  type="text"
                  value={agent.paymentTerms || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { paymentTerms: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isPaymentInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. Net 45"
                />
                {isPaymentInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Payment preference is required.</p>}
              </div>
            )}

            {enabledDimensions.warrantySupport && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isWarrantyInvalid ? 'text-red-500' : 'text-slate-400'}`}>Warranty & Support SLA *</label>
                <input
                  type="text"
                  value={agent.warrantySupport || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { warrantySupport: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isWarrantyInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. Gold support package"
                />
                {isWarrantyInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Support details are required.</p>}
              </div>
            )}

            {enabledDimensions.contractDuration && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isContractInvalid ? 'text-red-500' : 'text-slate-400'}`}>Contract Duration *</label>
                <input
                  type="text"
                  value={agent.negotiation_parameters?.contractDuration || ''}
                  onChange={(e) => {
                    const params = { ...agent.negotiation_parameters, contractDuration: e.target.value };
                    updateAgentConfig(agent.id, { negotiation_parameters: params });
                  }}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isContractInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 3 years commitment"
                />
                {isContractInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Contract duration is required.</p>}
              </div>
            )}
          </div>
        );
      } else {
        const isTargetPriceInvalid = !!agent.targetPrice?.toString().trim() && !isNumericOnly(agent.targetPrice);
        const isMinPriceInvalid = !!agent.minPrice?.toString().trim() && !isNumericOnly(agent.minPrice);
        const isRangeInvalid = !!agent.targetPrice && !!agent.minPrice && getCleanNumber(agent.minPrice) > getCleanNumber(agent.targetPrice);
        const isQuantityVolumeInvalid = !!agent.quantityVolume?.toString().trim() && !isNumericOnly(agent.quantityVolume);

        const isDeliveryInvalid = false;
        const isPaymentInvalid = false;
        const isWarrantyInvalid = false;
        const isContractInvalid = false;

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isTargetPriceInvalid ? 'text-red-500' : 'text-slate-400'}`}>Target Price *</label>
              <div className="flex gap-1.5 items-center">
                {renderCurrencySelector(agent)}
                <input
                  type="text"
                  value={agent.targetPrice || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { targetPrice: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isTargetPriceInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 65"
                />
              </div>
              {isTargetPriceInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric value is required.</p>}
            </div>

            {!isAI && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isMinPriceInvalid || isRangeInvalid ? 'text-red-500' : 'text-slate-400'}`}>Minimum Acceptable Price *</label>
                <div className="flex gap-1.5 items-center">
                  {renderCurrencySelector(agent)}
                  <input
                    type="text"
                    value={agent.minPrice || ''}
                    onChange={(e) => updateAgentConfig(agent.id, { minPrice: e.target.value })}
                    className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                      isMinPriceInvalid || isRangeInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                    placeholder="e.g. 58"
                  />
                </div>
                {isMinPriceInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric value is required.</p>}
                {isRangeInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Minimum price cannot exceed target price.</p>}
              </div>
            )}

            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isQuantityVolumeInvalid ? 'text-red-500' : 'text-slate-400'}`}>Desired Volume (Seats/Units) *</label>
              <input
                type="text"
                value={agent.quantityVolume || ''}
                onChange={(e) => updateAgentConfig(agent.id, { quantityVolume: e.target.value })}
                className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                  isQuantityVolumeInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="e.g. 150"
              />
              {isQuantityVolumeInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric volume is required.</p>}
            </div>

            {enabledDimensions.deliveryRequirement && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDeliveryInvalid ? 'text-red-500' : 'text-slate-400'}`}>Delivery Capability *</label>
                <input
                  type="text"
                  value={agent.deliveryRequirement || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { deliveryRequirement: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isDeliveryInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 30 days standard"
                />
                {isDeliveryInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Timeline preference is required.</p>}
              </div>
            )}

            {enabledDimensions.paymentTerms && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isPaymentInvalid ? 'text-red-500' : 'text-slate-400'}`}>Payment Terms *</label>
                <input
                  type="text"
                  value={agent.paymentTerms || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { paymentTerms: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isPaymentInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. Net 30"
                />
                {isPaymentInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Payment preference is required.</p>}
              </div>
            )}

            {enabledDimensions.warrantySupport && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isWarrantyInvalid ? 'text-red-500' : 'text-slate-400'}`}>Warranty Support SLA *</label>
                <input
                  type="text"
                  value={agent.warrantySupport || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { warrantySupport: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isWarrantyInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 1 year support"
                />
                {isWarrantyInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Support details are required.</p>}
              </div>
            )}

            {enabledDimensions.contractDuration && (
              <div className="space-y-1">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isContractInvalid ? 'text-red-500' : 'text-slate-400'}`}>Contract Duration *</label>
                <input
                  type="text"
                  value={agent.negotiation_parameters?.contractDuration || ''}
                  onChange={(e) => {
                    const params = { ...agent.negotiation_parameters, contractDuration: e.target.value };
                    updateAgentConfig(agent.id, { negotiation_parameters: params });
                  }}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isContractInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 3 years commitment"
                />
                {isContractInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Contract duration is required.</p>}
              </div>
            )}
          </div>
        );
      }
    }

    if (selectedScenario?.id === 'budget-allocation') {
      const isMinAllocationInvalid = !!agent.minAllocation?.toString().trim() && !isNumericOnly(agent.minAllocation);
      const isTargetAllocationInvalid = !!agent.targetAllocation?.toString().trim() && !isNumericOnly(agent.targetAllocation);
      const isRangeInvalid = !!agent.minAllocation && !!agent.targetAllocation && getCleanNumber(agent.minAllocation) > getCleanNumber(agent.targetAllocation);
      const isPriorityInvalid = false;
      const isJustificationInvalid = false;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${isTargetAllocationInvalid ? 'text-red-500' : 'text-slate-400'}`}>Target Allocation *</label>
            <div className="flex gap-1.5 items-center">
              {renderCurrencySelector(agent)}
              <input
                type="text"
                value={agent.targetAllocation || ''}
                onChange={(e) => updateAgentConfig(agent.id, { targetAllocation: e.target.value })}
                className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                  isTargetAllocationInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
                placeholder="e.g. 530000"
              />
            </div>
            {isTargetAllocationInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric value is required.</p>}
          </div>

          {!isAI && (
            <div className="space-y-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${isMinAllocationInvalid || isRangeInvalid ? 'text-red-500' : 'text-slate-400'}`}>Minimum Allocation *</label>
              <div className="flex gap-1.5 items-center">
                {renderCurrencySelector(agent)}
                <input
                  type="text"
                  value={agent.minAllocation || ''}
                  onChange={(e) => updateAgentConfig(agent.id, { minAllocation: e.target.value })}
                  className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                    isMinAllocationInvalid || isRangeInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                  placeholder="e.g. 450000"
                />
              </div>
              {isMinAllocationInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Numeric value is required.</p>}
              {isRangeInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Minimum allocation cannot exceed target.</p>}
            </div>
          )}

          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${isPriorityInvalid ? 'text-red-500' : 'text-slate-400'}`}>Department Priority *</label>
            <input
              type="text"
              value={agent.departmentPriority || ''}
              onChange={(e) => updateAgentConfig(agent.id, { departmentPriority: e.target.value })}
              className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                isPriorityInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="e.g. Engineering prototype development"
            />
            {isPriorityInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Priority details are required.</p>}
          </div>

          <div className="space-y-1">
            <label className={`text-[10px] font-bold uppercase tracking-wider ${isJustificationInvalid ? 'text-red-500' : 'text-slate-400'}`}>Budget Justification *</label>
            <input
              type="text"
              value={agent.budgetJustification || ''}
              onChange={(e) => updateAgentConfig(agent.id, { budgetJustification: e.target.value })}
              className={`w-full px-3 py-2 bg-white/50 border rounded-xl text-xs font-semibold text-primary focus:outline-none transition-all ${
                isJustificationInvalid ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
              placeholder="e.g. Cover R&D developers"
            />
            {isJustificationInvalid && <p className="text-[9px] text-red-500 font-semibold mt-0.5">Justification is required.</p>}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!selectedScenario || configuredAgents.length === 0) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div
          className="w-full max-w-lg rounded-[24px] p-10 text-center border"
          style={{
            background: 'rgba(255,255,255,0.82)',
            borderColor: 'rgba(30,34,48,0.08)',
            boxShadow: '0 16px 45px rgba(30,34,48,0.06)',
          }}
        >
          <div
            className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(59,130,246,0.08)',
              color: '#3B82F6',
            }}
          >
            <ShieldCheck size={28} />
          </div>

          <h2 className="text-lg font-semibold" style={{ color: '#0F172A' }}>
            No Agents Configured
          </h2>

          <p className="mt-2 text-sm" style={{ color: '#64748B' }}>
            Please select a scenario and configure your agents first.
          </p>

          <button
            onClick={() => navigate('/setup/scenario')}
            className="mt-6 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:shadow-lg hover:-translate-y-0.5 cursor-pointer border-none"
            style={{ background: '#3B82F6' }}
          >
            Select Scenario
          </button>
        </div>
      </div>
    );
  }

  const getAgentTheme = (agent: any) => {
    const role = `${agent.name} ${agent.role}`.toLowerCase();
    if (role.includes('vendor') || role.includes('seller') || role.includes('hiring') || role.includes('recruiter')) {
      return { accent: '#C86D51', soft: 'rgba(200,109,81,0.08)', border: 'rgba(200,109,81,0.20)', icon: BriefcaseBusiness };
    }
    if (role.includes('finance') || role.includes('observer') || role.includes('budget')) {
      return { accent: '#3B82F6', soft: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)', icon: BarChart3 };
    }
    return { accent: '#3B82F6', soft: 'rgba(59,130,246,0.07)', border: 'rgba(59,130,246,0.18)', icon: CircleUserRound };
  };

  const WIZARD_STEPS = [
    { id: 1, title: 'Job & Company', icon: BriefcaseBusiness },
    { id: 2, title: 'Compensation', icon: DollarSign },
    { id: 3, title: 'Situation', icon: MapPin },
    { id: 4, title: 'Preferences', icon: Sliders },
    { id: 5, title: 'Review', icon: CheckCircle2 },
  ];

  const currentStepValid = isStepValid(wizardStep);

  const renderAgentCard = (agent: any) => {
    const theme = getAgentTheme(agent);
    const Icon = theme.icon;
    const goals = agent.goals || [];
    const constraints = agent.constraints || [];
    const isJobOffer = selectedScenario?.id === 'job-offer';
    const isCandidate = (agent.role || '').toLowerCase().includes('candidate') || agent.id.includes('candidate');

    return (
      <div
        key={agent.id}
        className="group rounded-[24px] border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 mb-6"
        style={{
          background: 'rgba(255,255,255,0.75)',
          borderColor: 'rgba(255,255,255,0.90)',
          boxShadow: '0 12px 40px rgba(15,23,42,0.05)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200/60">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border"
              style={{ background: theme.soft, color: theme.accent, borderColor: theme.border }}
            >
              <Icon size={20} strokeWidth={1.8} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">{agent.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  {isCandidate ? 'Candidate / Job Seeker' : 'Employer / Hiring Company'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
                Role: <span className="font-semibold text-slate-800">{agent.role}</span> • Personality: <span className="font-semibold text-slate-800">{agent.personality}</span>
              </p>
            </div>
          </div>

          {isJobOffer ? (
            isCandidate ? (
              <CandidateWizardForm
                agent={agent}
                updateAgentConfig={updateAgentConfig}
                step={wizardStep}
                setWizardStep={setWizardStep}
                continueAttempted={continueAttempted}
              />
            ) : (
              <EmployerWizardForm
                agent={agent}
                updateAgentConfig={updateAgentConfig}
                step={wizardStep}
                setWizardStep={setWizardStep}
                continueAttempted={continueAttempted}
              />
            )
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <div className="rounded-[18px] p-5 border" style={{ background: 'rgba(255,255,255,0.58)', borderColor: 'rgba(255,255,255,0.70)' }}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs font-semibold" style={{ color: '#0F172A' }}>
                      <span className="inline-flex items-center gap-1.5" style={{ color: '#3B82F6' }}>
                        <Target size={13} />
                        Goals
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => addAgentGoal(agent.id)}
                      className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-full border transition-all hover:-translate-y-0.5 cursor-pointer"
                      style={{ color: '#3B82F6', borderColor: 'rgba(59,130,246,0.20)', background: 'rgba(59,130,246,0.04)' }}
                    >
                      <Plus size={10} />
                      Add Goal
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {goals.map((goal: any) => (
                      <div key={goal.id} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: '#3B82F6' }} />
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={goal.text}
                            onChange={(e) => updateAgentGoal(agent.id, goal.id, { text: e.target.value })}
                            className="w-full bg-white/60 px-2 py-1 border border-slate-200 rounded-lg outline-none text-[10px] leading-relaxed font-medium"
                            style={{ color: '#0F172A' }}
                          />
                        </div>
                        {goals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAgentGoal(agent.id, goal.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity shrink-0 cursor-pointer bg-transparent border-none"
                            style={{ color: '#64748B' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[18px] p-5 border" style={{ background: 'rgba(255,255,255,0.58)', borderColor: 'rgba(255,255,255,0.70)' }}>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h4 className="text-xs font-semibold" style={{ color: '#0F172A' }}>
                      <span className="inline-flex items-center gap-1.5" style={{ color: '#C86D51' }}>
                        <ShieldCheck size={13} />
                        Constraints
                      </span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => addAgentConstraint(agent.id)}
                      className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-1 rounded-full border transition-all hover:-translate-y-0.5 cursor-pointer"
                      style={{ color: '#C86D51', borderColor: 'rgba(200,109,81,0.22)', background: 'rgba(200,109,81,0.04)' }}
                    >
                      <Plus size={10} />
                      Add Constraint
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {constraints.map((constraint: any) => (
                      <div key={constraint.id} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="mt-0.5 shrink-0" style={{ color: '#C86D51' }} />
                        <div className="flex-1 min-w-0 grid grid-cols-[1fr_1fr] gap-1.5">
                          <input
                            type="text"
                            value={constraint.label}
                            onChange={(e) => updateAgentConstraint(agent.id, constraint.id, { label: e.target.value })}
                            className="w-full bg-white/60 px-2 py-1 border border-slate-200 rounded-lg outline-none text-[10px] font-medium"
                            style={{ color: '#0F172A' }}
                          />
                          <input
                            type="text"
                            value={constraint.value}
                            onChange={(e) => updateAgentConstraint(agent.id, constraint.id, { value: e.target.value })}
                            className="w-full bg-white/60 px-2 py-1 border border-slate-200 rounded-lg outline-none text-[10px] font-medium"
                            style={{ color: '#0F172A' }}
                          />
                        </div>
                        {constraints.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAgentConstraint(agent.id, constraint.id)}
                            className="opacity-60 hover:opacity-100 transition-opacity shrink-0 cursor-pointer bg-transparent border-none"
                            style={{ color: '#64748B' }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t w-full" style={{ borderColor: 'rgba(30,34,48,0.07)' }}>
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Scenario Specific Negotiation Variables
                </h5>
                {renderScenarioFields(agent, isBuyerOrCandidateOrPM(agent))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full" style={{ color: '#0F172A' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-xl sm:text-[24px] lg:text-[28px] font-bold tracking-[-0.02em] leading-tight" style={{ color: '#0F172A' }}>
            {selectedScenario.id === 'job-offer' ? 'Job Salary Negotiation Setup Wizard' : `Goals & Constraints (${activeAgents.length} Participants)`}
          </h1>
          <p className="mt-1 text-xs sm:text-[13px]" style={{ color: '#64748B' }}>
            {selectedScenario.id === 'job-offer' 
              ? 'Complete the 5-step guided wizard to configure hiring situation, compensation, and negotiation context.' 
              : 'Define target benchmarks, concession thresholds, currency selectors, and numerical boundaries for each participant.'}
          </p>
        </div>
      </div>

      {/* MULTI-STEP WIZARD PROGRESS BAR (For Job Offer Scenario) */}
      {selectedScenario.id === 'job-offer' && (
        <div className="mb-6 p-4 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl shadow-sm">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {WIZARD_STEPS.map((s, idx) => {
              const stepNum = idx + 1;
              const isCompleted = wizardStep > stepNum;
              const isActive = wizardStep === stepNum;
              const StepIcon = s.icon;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => isCompleted && setWizardStep(stepNum)}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border ${
                    isActive
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : stepNum}
                  </span>
                  <StepIcon size={14} />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {selectedScenario.id === 'vendor-pricing' ? (
        <VendorPricingWizardForm
          configuredAgents={configuredAgents}
          updateAgentConfig={updateAgentConfig}
          selectedMode={selectedMode}
          humanRole={humanRole}
          navigate={navigate}
        />
      ) : selectedScenario.id === 'budget-allocation' ? (
        <BudgetAllocationWizardForm
          configuredAgents={configuredAgents}
          updateAgentConfig={updateAgentConfig}
          selectedMode={selectedMode}
          humanRole={humanRole}
          navigate={navigate}
        />
      ) : (
        <>
          <div className="space-y-6">
            {displayAgents.map(renderAgentCard)}
          </div>

          <div
            className="mt-6 rounded-[22px] border overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.58)',
              borderColor: 'rgba(255,255,255,0.70)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(59,130,246,0.07)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.12)' }}
              >
                <FileText size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#64748B' }}>
                  Scenario Context
                </span>
                <h4 className="text-sm font-semibold mt-0.5" style={{ color: '#0F172A' }}>
                  {selectedScenario.title}
                </h4>
                <p className="text-[10px] sm:text-[11px] leading-relaxed mt-1" style={{ color: '#64748B' }}>
                  {selectedScenario.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (selectedScenario.id === 'job-offer' && wizardStep > 1) {
                  setWizardStep(prev => prev - 1);
                } else {
                  navigate('/setup/agents');
                }
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
              style={{ background: 'rgba(255,255,255,0.72)', borderColor: 'rgba(30,34,48,0.10)', color: '#1E2230' }}
            >
              <ArrowLeft size={14} />
              {selectedScenario.id === 'job-offer' && wizardStep > 1 ? 'Previous Step' : 'Back'}
            </button>

            <button
              type="button"
              onClick={handleContinue}
              disabled={selectedScenario.id === 'job-offer' ? !currentStepValid : !isValid}
              className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-semibold transition-all border-none ${
                (selectedScenario.id === 'job-offer' ? currentStepValid : isValid)
                  ? 'bg-blue-600 text-white cursor-pointer hover:-translate-y-0.5 shadow-lg'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              {selectedScenario.id === 'job-offer' && wizardStep < 5 ? (
                <>
                  Next Step
                  <ChevronRight size={14} />
                </>
              ) : (
                <>
                  Review & Confirm
                  <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ====================================================================
// CANDIDATE WIZARD FORM (Steps 1–5)
// ====================================================================
const CandidateWizardForm: React.FC<{
  agent: any;
  updateAgentConfig: (id: string, updates: any) => void;
  step: number;
  setWizardStep: (s: number) => void;
  continueAttempted: boolean;
}> = ({ agent, updateAgentConfig, step, setWizardStep, continueAttempted }) => {
  const ctx: JobCandidateContext = agent.jobCandidateContext || DEFAULT_CANDIDATE_CONTEXT;
  const errors = getCandidateErrors(ctx);

  const shouldShowError = (key: string, val?: any) => {
    if (!errors[key]) return false;
    if (val !== undefined && val !== null) {
      if (typeof val === 'string' && val.trim() !== '') return true;
      if (Array.isArray(val) && val.length > 0) return true;
    }
    return false;
  };

  const updateCtx = (updates: Partial<JobCandidateContext>) => {
    const updated = { ...ctx, ...updates };
    updateAgentConfig(agent.id, { jobCandidateContext: updated });
  };

  const experienceOptions = ['Fresher', '0–2 years', '2–5 years', '5+ years'];
  const companyTypeOptions = ['Startup', 'Product Company', 'Service Company', 'MNC', 'Government', 'Other'];
  const hiringTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other'];
  const workModeOptions = ['On-site', 'Hybrid', 'Remote'];
  const jobLevelOptions = ['Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead', 'Manager'];
  const compensationTypeOptions = ['Base Salary', 'Total Compensation', 'Base + Variable', 'CTC / Package', 'Other'];
  const benefitsOptions = [
    'Remote work', 'Bonus', 'Stock/ESOP', 'Health insurance',
    'Joining bonus', 'Paid leave', 'Flexible hours', 'Relocation support',
    'Learning budget', 'Other'
  ];
  const candidatePrioritiesOptions = [
    'Salary', 'Role', 'Growth', 'Remote work', 'Location',
    'Benefits', 'Job security', 'Brand/company reputation',
    'Work-life balance', 'Learning opportunities'
  ];

  const toggleArrayItem = (key: 'importantBenefits' | 'candidatePriorities', item: string) => {
    const current = ctx[key] || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    updateCtx({ [key]: updated });
  };

  // STEP 1 — Job & Company
  if (step === 1) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <BriefcaseBusiness className="text-blue-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              💼 Job Information & Target Company
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('jobPosition', ctx.jobPosition) ? 'text-red-500' : 'text-slate-500'}`}>
                Job Position / Role *
              </label>
              <input
                type="text"
                value={ctx.jobPosition || ''}
                onChange={(e) => updateCtx({ jobPosition: e.target.value })}
                placeholder="e.g. Python Backend Developer"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('jobPosition', ctx.jobPosition) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('jobPosition', ctx.jobPosition) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.jobPosition}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('companyName', ctx.companyName) ? 'text-red-500' : 'text-slate-500'}`}>
                Target Company Name *
              </label>
              <input
                type="text"
                value={ctx.companyName || ''}
                onChange={(e) => updateCtx({ companyName: e.target.value })}
                placeholder="e.g. TechCorp International"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('companyName', ctx.companyName) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('companyName', ctx.companyName) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.companyName}</p>}
            </div>
          </div>

          {/* Experience Level Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('experienceLevel', ctx.experienceLevel) ? 'text-red-500' : 'text-slate-500'}`}>
              Experience Level *
            </label>
            <div className="flex flex-wrap gap-2">
              {experienceOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ experienceLevel: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.experienceLevel === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('experienceLevel', ctx.experienceLevel) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.experienceLevel}</p>}
          </div>

          {/* Job Level Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('jobLevel', ctx.jobLevel) ? 'text-red-500' : 'text-slate-500'}`}>
              Job Level / Position Level *
            </label>
            <div className="flex flex-wrap gap-2">
              {jobLevelOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ jobLevel: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.jobLevel === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('jobLevel', ctx.jobLevel) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.jobLevel}</p>}
          </div>

          {/* Company Type Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('companyType', ctx.companyType) ? 'text-red-500' : 'text-slate-500'}`}>
              Company Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {companyTypeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ companyType: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.companyType === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('companyType', ctx.companyType) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.companyType}</p>}
          </div>

          {/* Hiring Type Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('hiringType', ctx.hiringType) ? 'text-red-500' : 'text-slate-500'}`}>
              Hiring Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {hiringTypeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ hiringType: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.hiringType === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('hiringType', ctx.hiringType) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.hiringType}</p>}
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 — Compensation
  if (step === 2) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <DollarSign className="text-blue-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              💰 Compensation & Salary Expectations
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('currentSalary', ctx.currentSalary) ? 'text-red-500' : 'text-slate-500'}`}>
                Current Salary / Compensation {ctx.experienceLevel === 'Fresher' ? '(Optional for Fresher)' : '*'}
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.currentSalary || ''}
                  onChange={(e) => updateCtx({ currentSalary: e.target.value })}
                  placeholder={ctx.experienceLevel === 'Fresher' ? 'Not Applicable / Optional' : 'e.g. 140000'}
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('currentSalary', ctx.currentSalary) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('currentSalary', ctx.currentSalary) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.currentSalary}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('expectedSalary', ctx.expectedSalary) ? 'text-red-500' : 'text-slate-500'}`}>
                Expected Salary / Compensation *
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.expectedSalary || ''}
                  onChange={(e) => updateCtx({ expectedSalary: e.target.value })}
                  placeholder="e.g. 175000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('expectedSalary', ctx.expectedSalary) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('expectedSalary', ctx.expectedSalary) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.expectedSalary}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('preferredSalaryMin', ctx.preferredSalaryMin) ? 'text-red-500' : 'text-slate-500'}`}>
                Preferred Salary Range (Minimum Acceptable) *
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.preferredSalaryMin || ''}
                  onChange={(e) => updateCtx({ preferredSalaryMin: e.target.value })}
                  placeholder="e.g. 160000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('preferredSalaryMin', ctx.preferredSalaryMin) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('preferredSalaryMin', ctx.preferredSalaryMin) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.preferredSalaryMin}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('preferredSalaryTarget', ctx.preferredSalaryTarget) ? 'text-red-500' : 'text-slate-500'}`}>
                Preferred Salary Range (Target Amount) *
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.preferredSalaryTarget || ''}
                  onChange={(e) => updateCtx({ preferredSalaryTarget: e.target.value })}
                  placeholder="e.g. 175000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('preferredSalaryTarget', ctx.preferredSalaryTarget) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('preferredSalaryTarget', ctx.preferredSalaryTarget) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.preferredSalaryTarget}</p>}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('compensationType', ctx.compensationType) ? 'text-red-500' : 'text-slate-500'}`}>
              Compensation Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {compensationTypeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ compensationType: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.compensationType === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('compensationType', ctx.compensationType) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.compensationType}</p>}
          </div>
        </div>
      </div>
    );
  }

  // STEP 3 — Work & Hiring Situation
  if (step === 3) {
    const joiningAvailabilityChips = ['Immediate / 0 Days', '15 Days Notice', '30 Days Notice', '45 Days Notice', '60 Days Notice', '90 Days Notice', 'Other'];
    const isStandardJoiningOpt = joiningAvailabilityChips.slice(0, -1).includes(ctx.joiningAvailability || '');

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <MapPin className="text-blue-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              📍 Work & Hiring Situation
            </h4>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('workLocation', ctx.workLocation) ? 'text-red-500' : 'text-slate-500'}`}>
                Work Location *
              </label>
              <input
                type="text"
                value={ctx.workLocation || ''}
                onChange={(e) => updateCtx({ workLocation: e.target.value })}
                placeholder="City / Country or Remote"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('workLocation', ctx.workLocation) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('workLocation', ctx.workLocation) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.workLocation}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('joiningAvailability', ctx.joiningAvailability) ? 'text-red-500' : 'text-slate-500'}`}>
                Joining Availability / Notice Period *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {joiningAvailabilityChips.map(opt => {
                  const active = opt === 'Other' ? (ctx.joiningAvailability && !isStandardJoiningOpt) : ctx.joiningAvailability === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        if (opt === 'Other') {
                          if (isStandardJoiningOpt) updateCtx({ joiningAvailability: '' });
                        } else {
                          updateCtx({ joiningAvailability: opt });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {(!ctx.joiningAvailability || !isStandardJoiningOpt) && (
                <input
                  type="text"
                  value={ctx.joiningAvailability || ''}
                  onChange={(e) => updateCtx({ joiningAvailability: e.target.value })}
                  placeholder="Specify custom notice period or availability..."
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('joiningAvailability', ctx.joiningAvailability) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              )}
              {shouldShowError('joiningAvailability', ctx.joiningAvailability) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.joiningAvailability}</p>}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('workMode', ctx.workMode) ? 'text-red-500' : 'text-slate-500'}`}>
              Work Mode *
            </label>
            <div className="flex gap-2">
              {workModeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ workMode: opt })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.workMode === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('workMode', ctx.workMode) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.workMode}</p>}
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('candidateSkills', ctx.candidateSkills) ? 'text-red-500' : 'text-slate-500'}`}>
              Candidate Key Skills & Strengths *
            </label>
            <textarea
              value={ctx.candidateSkills || ''}
              onChange={(e) => updateCtx({ candidateSkills: e.target.value })}
              placeholder="List key technical skills, certifications, domain expertise, or achievements..."
              className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all h-20 resize-none ${
                shouldShowError('candidateSkills', ctx.candidateSkills) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {shouldShowError('candidateSkills', ctx.candidateSkills) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.candidateSkills}</p>}
          </div>

          {/* PROGRESSIVE DISCLOSURE FOR OTHER OFFERS */}
          <div className="pt-2">
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('otherOffers', ctx.otherOffers) ? 'text-red-500' : 'text-slate-500'}`}>
              Do you have other competing offers? *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateCtx({ otherOffers: 'Yes' })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  ctx.otherOffers === 'Yes'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => updateCtx({ otherOffers: 'No', otherOffersDetails: '' })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  ctx.otherOffers === 'No'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                No
              </button>
            </div>
            {shouldShowError('otherOffers', ctx.otherOffers) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.otherOffers}</p>}
          </div>

          {/* PROGRESSIVELY REVEALED FIELD */}
          {ctx.otherOffers === 'Yes' && (
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200/60 animate-in fade-in duration-200">
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('otherOffersDetails', ctx.otherOffersDetails) ? 'text-red-500' : 'text-slate-600'}`}>
                Competing Offer Details (Role & Compensation) *
              </label>
              <input
                type="text"
                value={ctx.otherOffersDetails || ''}
                onChange={(e) => updateCtx({ otherOffersDetails: e.target.value })}
                placeholder="e.g. $165,000 offer from competing fintech firm"
                className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('otherOffersDetails', ctx.otherOffersDetails) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('otherOffersDetails', ctx.otherOffersDetails) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.otherOffersDetails}</p>}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 4 — Priorities & Preferences
  if (step === 4) {
    const isStandardCandNonNeg = CANDIDATE_NON_NEGOTIABLE_OPTIONS.filter(o => o !== 'Other (Custom Requirement)').includes(ctx.nonNegotiables || '');

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Sliders className="text-blue-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              🎯 Priorities & Negotiation Preferences
            </h4>
          </div>

          {/* Benefits Important */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('importantBenefits', ctx.importantBenefits) ? 'text-red-500' : 'text-slate-500'}`}>
              Benefits / Perks Important to Candidate *
            </label>
            <div className={`p-3 rounded-2xl border flex flex-wrap gap-2 transition-all ${shouldShowError('importantBenefits', ctx.importantBenefits) ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white/40'}`}>
              {benefitsOptions.map(item => {
                const active = (ctx.importantBenefits || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('importantBenefits', item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {shouldShowError('importantBenefits', ctx.importantBenefits) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.importantBenefits}</p>}
          </div>

          {/* Candidate Priorities */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('candidatePriorities', ctx.candidatePriorities) ? 'text-red-500' : 'text-slate-500'}`}>
              Candidate Priorities *
            </label>
            <div className={`p-3 rounded-2xl border flex flex-wrap gap-2 transition-all ${shouldShowError('candidatePriorities', ctx.candidatePriorities) ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white/40'}`}>
              {candidatePrioritiesOptions.map(item => {
                const active = (ctx.candidatePriorities || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('candidatePriorities', item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {shouldShowError('candidatePriorities', ctx.candidatePriorities) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.candidatePriorities}</p>}
          </div>

          {/* VISUAL SLIDER CONTROL FOR NEGOTIATION FLEXIBILITY */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${shouldShowError('negotiationFlexibility', ctx.negotiationFlexibility) ? 'text-red-500' : 'text-slate-500'}`}>
                Negotiation Flexibility *
              </label>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {ctx.negotiationFlexibility || 'Medium'}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={ctx.negotiationFlexibility === 'Low' ? 0 : ctx.negotiationFlexibility === 'High' ? 2 : 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateCtx({ negotiationFlexibility: val === 0 ? 'Low' : val === 2 ? 'High' : 'Medium' });
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Low Flexibility</span>
                <span>Medium</span>
                <span>High Flexibility</span>
              </div>
            </div>
            {shouldShowError('negotiationFlexibility', ctx.negotiationFlexibility) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.negotiationFlexibility}</p>}
          </div>

          {/* Candidate Non-Negotiable Requirements */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('nonNegotiables', ctx.nonNegotiables) ? 'text-red-500' : 'text-slate-500'}`}>
              Non-Negotiable Requirements *
            </label>
            <select
              value={isStandardCandNonNeg ? ctx.nonNegotiables : (ctx.nonNegotiables ? 'Other (Custom Requirement)' : '')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Other (Custom Requirement)') {
                  if (isStandardCandNonNeg) updateCtx({ nonNegotiables: '' });
                } else {
                  updateCtx({ nonNegotiables: val });
                }
              }}
              className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all mb-2 ${
                shouldShowError('nonNegotiables', ctx.nonNegotiables) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            >
              <option value="" disabled>-- Select a Non-Negotiable Requirement --</option>
              {CANDIDATE_NON_NEGOTIABLE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {(!ctx.nonNegotiables || !isStandardCandNonNeg) && (
              <textarea
                value={ctx.nonNegotiables || ''}
                onChange={(e) => updateCtx({ nonNegotiables: e.target.value })}
                placeholder="Specify custom non-negotiable conditions..."
                className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all h-20 resize-none ${
                  shouldShowError('nonNegotiables', ctx.nonNegotiables) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
            )}
            {shouldShowError('nonNegotiables', ctx.nonNegotiables) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.nonNegotiables}</p>}
          </div>

          {/* Custom / Additional Information (OPTIONAL) */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-500">
              Additional Information (Optional)
            </label>
            <textarea
              value={ctx.customInfo || ''}
              onChange={(e) => updateCtx({ customInfo: e.target.value })}
              placeholder="Add any additional information about this negotiation that was not covered above."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 transition-all h-24 resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // STEP 5 — Review
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Candidate Negotiation Summary Review
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Job */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">💼 JOB & COMPANY</h5>
            <p className="text-xs font-semibold text-slate-800">{ctx.jobPosition} ({ctx.jobLevel})</p>
            <p className="text-[11px] text-slate-600 mt-1">{ctx.companyName} • {ctx.companyType}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Exp: {ctx.experienceLevel} • {ctx.hiringType}</p>
          </div>

          {/* Card 2: Compensation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">💰 COMPENSATION</h5>
            <p className="text-xs font-semibold text-slate-800">Expected: {ctx.expectedSalary}</p>
            <p className="text-[11px] text-slate-600 mt-1">Range: {ctx.preferredSalaryMin} – {ctx.preferredSalaryTarget}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Current: {ctx.currentSalary} ({ctx.compensationType})</p>
          </div>

          {/* Card 3: Situation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">📍 WORK & SITUATION</h5>
            <p className="text-xs font-semibold text-slate-800">{ctx.workMode} ({ctx.workLocation})</p>
            <p className="text-[11px] text-slate-600 mt-1">Notice: {ctx.joiningAvailability}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Competing Offers: {ctx.otherOffers === 'Yes' ? (ctx.otherOffersDetails || 'Yes') : 'None'}</p>
          </div>

          {/* Card 4: Priorities */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(4)}
              className="absolute top-3 right-3 text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">🎯 PRIORITIES & FLEXIBILITY</h5>
            <p className="text-xs font-semibold text-slate-800">Flexibility: {ctx.negotiationFlexibility}</p>
            <p className="text-[11px] text-slate-600 mt-1">Priorities: {(ctx.candidatePriorities || []).join(' • ')}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Non-Negotiable: {ctx.nonNegotiables}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ====================================================================
// EMPLOYER WIZARD FORM (Steps 1–5)
// ====================================================================
const EmployerWizardForm: React.FC<{
  agent: any;
  updateAgentConfig: (id: string, updates: any) => void;
  step: number;
  setWizardStep: (s: number) => void;
  continueAttempted: boolean;
}> = ({ agent, updateAgentConfig, step, setWizardStep, continueAttempted }) => {
  const ctx: JobEmployerContext = agent.jobEmployerContext || DEFAULT_EMPLOYER_CONTEXT;
  const errors = getEmployerErrors(ctx);

  const shouldShowError = (key: string, val?: any) => {
    if (!errors[key]) return false;
    if (val !== undefined && val !== null) {
      if (typeof val === 'string' && val.trim() !== '') return true;
      if (Array.isArray(val) && val.length > 0) return true;
    }
    return false;
  };

  const updateCtx = (updates: Partial<JobEmployerContext>) => {
    const updated = { ...ctx, ...updates };
    updateAgentConfig(agent.id, { jobEmployerContext: updated });
  };

  const companyTypeOptions = ['Startup', 'Product Company', 'Service Company', 'MNC', 'Government', 'Other'];
  const jobLevelOptions = ['Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead', 'Manager', 'Other'];
  const hiringTypeOptions = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Temporary', 'Other'];
  const workModeOptions = ['On-site', 'Hybrid', 'Remote'];
  const compensationStructureOptions = ['Base Salary', 'Variable Pay', 'Bonus', 'Stock/ESOP', 'CTC / Package', 'Other'];
  const benefitsOfferedOptions = [
    'Health insurance', 'Bonus', 'Stock/ESOP', 'Paid leave',
    'Remote work', 'Relocation support', 'Learning budget', 'Other'
  ];
  const hiringUrgencyOptions = ['Immediate', 'Within 1 month', '1–3 months', 'Flexible'];
  const employerPrioritiesOptions = [
    'Budget', 'Candidate quality', 'Experience', 'Joining date',
    'Retention', 'Skills', 'Location', 'Other'
  ];

  const toggleArrayItem = (key: 'benefitsOffered' | 'employerPriorities', item: string) => {
    const current = ctx[key] || [];
    const updated = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    updateCtx({ [key]: updated });
  };

  // STEP 1 — Job & Company
  if (step === 1) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Building2 className="text-orange-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              🏢 Hiring Company & Role Requirements
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('companyName', ctx.companyName) ? 'text-red-500' : 'text-slate-500'}`}>
                Hiring Company Name *
              </label>
              <input
                type="text"
                value={ctx.companyName || ''}
                onChange={(e) => updateCtx({ companyName: e.target.value })}
                placeholder="e.g. TechCorp International"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('companyName', ctx.companyName) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('companyName', ctx.companyName) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.companyName}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('jobPosition', ctx.jobPosition) ? 'text-red-500' : 'text-slate-500'}`}>
                Job Position / Role *
              </label>
              <input
                type="text"
                value={ctx.jobPosition || ''}
                onChange={(e) => updateCtx({ jobPosition: e.target.value })}
                placeholder="e.g. Python Backend Developer"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('jobPosition', ctx.jobPosition) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('jobPosition', ctx.jobPosition) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.jobPosition}</p>}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('requiredExperience', ctx.requiredExperience) ? 'text-red-500' : 'text-slate-500'}`}>
              Required Experience *
            </label>
            <input
              type="text"
              value={ctx.requiredExperience || ''}
              onChange={(e) => updateCtx({ requiredExperience: e.target.value })}
              placeholder="e.g. 2–5 years"
              className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                shouldShowError('requiredExperience', ctx.requiredExperience) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {shouldShowError('requiredExperience', ctx.requiredExperience) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.requiredExperience}</p>}
          </div>

          {/* Job Level Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('jobLevel', ctx.jobLevel) ? 'text-red-500' : 'text-slate-500'}`}>
              Job Level *
            </label>
            <div className="flex flex-wrap gap-2">
              {jobLevelOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ jobLevel: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.jobLevel === opt
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('jobLevel', ctx.jobLevel) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.jobLevel}</p>}
          </div>

          {/* Company Type Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('companyType', ctx.companyType) ? 'text-red-500' : 'text-slate-500'}`}>
              Company Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {companyTypeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ companyType: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.companyType === opt
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('companyType', ctx.companyType) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.companyType}</p>}
          </div>

          {/* Hiring Type Chips */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('hiringType', ctx.hiringType) ? 'text-red-500' : 'text-slate-500'}`}>
              Hiring Type *
            </label>
            <div className="flex flex-wrap gap-2">
              {hiringTypeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ hiringType: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.hiringType === opt
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('hiringType', ctx.hiringType) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.hiringType}</p>}
          </div>
        </div>
      </div>
    );
  }

  // STEP 2 — Compensation
  if (step === 2) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <DollarSign className="text-orange-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              💰 Salary Budget & Compensation Structure
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('salaryBudgetMin', ctx.salaryBudgetMin) ? 'text-red-500' : 'text-slate-500'}`}>
                Approved Budget Min *
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.salaryBudgetMin || ''}
                  onChange={(e) => updateCtx({ salaryBudgetMin: e.target.value })}
                  placeholder="e.g. 145000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('salaryBudgetMin', ctx.salaryBudgetMin) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('salaryBudgetMin', ctx.salaryBudgetMin) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.salaryBudgetMin}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('salaryBudgetTarget', ctx.salaryBudgetTarget) ? 'text-red-500' : 'text-slate-500'}`}>
                Approved Budget Target *
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.salaryBudgetTarget || ''}
                  onChange={(e) => updateCtx({ salaryBudgetTarget: e.target.value })}
                  placeholder="e.g. 160000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('salaryBudgetTarget', ctx.salaryBudgetTarget) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('salaryBudgetTarget', ctx.salaryBudgetTarget) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.salaryBudgetTarget}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('salaryBudgetMax', ctx.salaryBudgetMax) ? 'text-red-500' : 'text-slate-500'}`}>
                Approved Budget Max Cap *
              </label>
              <div className="flex gap-1.5 items-center">
                <CurrencySelector
                  value={agent.currency || 'USD'}
                  onChange={(code) => updateAgentConfig(agent.id, { currency: code })}
                />
                <input
                  type="text"
                  value={ctx.salaryBudgetMax || ''}
                  onChange={(e) => updateCtx({ salaryBudgetMax: e.target.value })}
                  placeholder="e.g. 170000"
                  className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                    shouldShowError('salaryBudgetMax', ctx.salaryBudgetMax) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
              </div>
              {shouldShowError('salaryBudgetMax', ctx.salaryBudgetMax) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.salaryBudgetMax}</p>}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('compensationStructure', ctx.compensationStructure) ? 'text-red-500' : 'text-slate-500'}`}>
              Compensation Structure *
            </label>
            <div className="flex flex-wrap gap-2">
              {compensationStructureOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ compensationStructure: opt })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.compensationStructure === opt
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('compensationStructure', ctx.compensationStructure) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.compensationStructure}</p>}
          </div>
        </div>
      </div>
    );
  }

  // STEP 3 — Work & Hiring Situation
  if (step === 3) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <MapPin className="text-orange-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              📍 Hiring Urgency & Candidate Requirements
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('workLocation', ctx.workLocation) ? 'text-red-500' : 'text-slate-500'}`}>
                Work Location *
              </label>
              <input
                type="text"
                value={ctx.workLocation || ''}
                onChange={(e) => updateCtx({ workLocation: e.target.value })}
                placeholder="City / Country or Remote"
                className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                  shouldShowError('workLocation', ctx.workLocation) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {shouldShowError('workLocation', ctx.workLocation) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.workLocation}</p>}
            </div>

            <div>
              <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('hiringUrgency', ctx.hiringUrgency) ? 'text-red-500' : 'text-slate-500'}`}>
                Hiring Urgency *
              </label>
              <div className="flex flex-wrap gap-2">
                {hiringUrgencyOptions.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateCtx({ hiringUrgency: opt })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      ctx.hiringUrgency === opt
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {shouldShowError('hiringUrgency', ctx.hiringUrgency) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.hiringUrgency}</p>}
            </div>
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('workMode', ctx.workMode) ? 'text-red-500' : 'text-slate-500'}`}>
              Work Mode *
            </label>
            <div className="flex gap-2">
              {workModeOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateCtx({ workMode: opt })}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    ctx.workMode === opt
                      ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {shouldShowError('workMode', ctx.workMode) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.workMode}</p>}
          </div>

          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('mustHaveSkills', ctx.mustHaveSkills) ? 'text-red-500' : 'text-slate-500'}`}>
              Must-Have Skills & Requirements *
            </label>
            <textarea
              value={ctx.mustHaveSkills || ''}
              onChange={(e) => updateCtx({ mustHaveSkills: e.target.value })}
              placeholder="List essential skills, qualifications, or certifications required"
              className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all h-20 resize-none ${
                shouldShowError('mustHaveSkills', ctx.mustHaveSkills) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {shouldShowError('mustHaveSkills', ctx.mustHaveSkills) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.mustHaveSkills}</p>}
          </div>
        </div>
      </div>
    );
  }

  // STEP 4 — Priorities & Preferences
  if (step === 4) {
    const isStandardEmpNonNeg = EMPLOYER_NON_NEGOTIABLE_OPTIONS.filter(o => o !== 'Other (Custom Requirement)').includes(ctx.nonNegotiables || '');

    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Sliders className="text-orange-600" size={16} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              🎯 Employer Priorities & Negotiation Boundaries
            </h4>
          </div>

          {/* Benefits Offered */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('benefitsOffered', ctx.benefitsOffered) ? 'text-red-500' : 'text-slate-500'}`}>
              Benefits / Perks Offered *
            </label>
            <div className={`p-3 rounded-2xl border flex flex-wrap gap-2 transition-all ${shouldShowError('benefitsOffered', ctx.benefitsOffered) ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white/40'}`}>
              {benefitsOfferedOptions.map(item => {
                const active = (ctx.benefitsOffered || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('benefitsOffered', item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {shouldShowError('benefitsOffered', ctx.benefitsOffered) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.benefitsOffered}</p>}
          </div>

          {/* Employer Priorities */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${shouldShowError('employerPriorities', ctx.employerPriorities) ? 'text-red-500' : 'text-slate-500'}`}>
              Employer Priorities *
            </label>
            <div className={`p-3 rounded-2xl border flex flex-wrap gap-2 transition-all ${shouldShowError('employerPriorities', ctx.employerPriorities) ? 'border-red-400 bg-red-50/30' : 'border-slate-200 bg-white/40'}`}>
              {employerPrioritiesOptions.map(item => {
                const active = (ctx.employerPriorities || []).includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleArrayItem('employerPriorities', item)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      active
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            {shouldShowError('employerPriorities', ctx.employerPriorities) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.employerPriorities}</p>}
          </div>

          {/* VISUAL SLIDER CONTROL FOR COMPENSATION FLEXIBILITY */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider ${shouldShowError('compensationFlexibility', ctx.compensationFlexibility) ? 'text-red-500' : 'text-slate-500'}`}>
                Compensation Flexibility *
              </label>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                {ctx.compensationFlexibility || 'Medium'}
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
              <input
                type="range"
                min="0"
                max="2"
                step="1"
                value={ctx.compensationFlexibility === 'Low' ? 0 : ctx.compensationFlexibility === 'High' ? 2 : 1}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateCtx({ compensationFlexibility: val === 0 ? 'Low' : val === 2 ? 'High' : 'Medium' });
                }}
                className="w-full accent-orange-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Strict Limit (Low)</span>
                <span>Medium</span>
                <span>High Flexibility</span>
              </div>
            </div>
            {shouldShowError('compensationFlexibility', ctx.compensationFlexibility) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.compensationFlexibility}</p>}
          </div>

          {/* Employer Non-Negotiable Requirements */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${shouldShowError('nonNegotiables', ctx.nonNegotiables) ? 'text-red-500' : 'text-slate-500'}`}>
              Employer Non-Negotiable Requirements *
            </label>
            <select
              value={isStandardEmpNonNeg ? ctx.nonNegotiables : (ctx.nonNegotiables ? 'Other (Custom Requirement)' : '')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'Other (Custom Requirement)') {
                  if (isStandardEmpNonNeg) updateCtx({ nonNegotiables: '' });
                } else {
                  updateCtx({ nonNegotiables: val });
                }
              }}
              className={`w-full px-3 py-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800 focus:outline-none transition-all mb-2 ${
                shouldShowError('nonNegotiables', ctx.nonNegotiables) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-orange-500'
              }`}
            >
              <option value="" disabled>-- Select Employer Non-Negotiable Policy --</option>
              {EMPLOYER_NON_NEGOTIABLE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {(!ctx.nonNegotiables || !isStandardEmpNonNeg) && (
              <textarea
                value={ctx.nonNegotiables || ''}
                onChange={(e) => updateCtx({ nonNegotiables: e.target.value })}
                placeholder="Specify custom non-negotiable company policies..."
                className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium text-slate-800 focus:outline-none transition-all h-20 resize-none ${
                  shouldShowError('nonNegotiables', ctx.nonNegotiables) ? 'border-red-400 bg-red-50/50 focus:border-red-500' : 'border-slate-200 focus:border-orange-500'
                }`}
              />
            )}
            {shouldShowError('nonNegotiables', ctx.nonNegotiables) && <p className="text-[9px] text-red-500 font-semibold mt-1">{errors.nonNegotiables}</p>}
          </div>

          {/* Custom / Additional Information (OPTIONAL) */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-slate-500">
              Additional Information (Optional)
            </label>
            <textarea
              value={ctx.customInfo || ''}
              onChange={(e) => updateCtx({ customInfo: e.target.value })}
              placeholder="Add any additional information about this negotiation that was not covered above."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-orange-500 transition-all h-24 resize-none"
            />
          </div>
        </div>
      </div>
    );
  }

  // STEP 5 — Review
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <div className="rounded-2xl p-5 border border-slate-200/80 bg-white/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-600" size={18} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Employer Negotiation Summary Review
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Job */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(1)}
              className="absolute top-3 right-3 text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">🏢 HIRING ROLE & COMPANY</h5>
            <p className="text-xs font-semibold text-slate-800">{ctx.jobPosition} ({ctx.jobLevel})</p>
            <p className="text-[11px] text-slate-600 mt-1">{ctx.companyName} • {ctx.companyType}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Req Exp: {ctx.requiredExperience} • {ctx.hiringType}</p>
          </div>

          {/* Card 2: Compensation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(2)}
              className="absolute top-3 right-3 text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">💰 SALARY BUDGET</h5>
            <p className="text-xs font-semibold text-slate-800">Target: {ctx.salaryBudgetTarget}</p>
            <p className="text-[11px] text-slate-600 mt-1">Range: {ctx.salaryBudgetMin} – {ctx.salaryBudgetMax}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Structure: {ctx.compensationStructure}</p>
          </div>

          {/* Card 3: Situation */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(3)}
              className="absolute top-3 right-3 text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">📍 WORK & SKILLS</h5>
            <p className="text-xs font-semibold text-slate-800">{ctx.workMode} ({ctx.workLocation})</p>
            <p className="text-[11px] text-slate-600 mt-1">Urgency: {ctx.hiringUrgency}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Must-Have: {ctx.mustHaveSkills.slice(0, 35)}...</p>
          </div>

          {/* Card 4: Priorities */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setWizardStep(4)}
              className="absolute top-3 right-3 text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
            <h5 className="text-[11px] font-bold uppercase text-slate-500 mb-2">🎯 PRIORITIES & FLEXIBILITY</h5>
            <p className="text-xs font-semibold text-slate-800">Flexibility: {ctx.compensationFlexibility}</p>
            <p className="text-[11px] text-slate-600 mt-1">Priorities: {(ctx.employerPriorities || []).join(' • ')}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Non-Negotiable: {ctx.nonNegotiables}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsConstraintsScreen;