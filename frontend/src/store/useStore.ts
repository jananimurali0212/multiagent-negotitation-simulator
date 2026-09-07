import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { negotiationApi } from '../lib/api';

export interface JobCandidateContext {
  jobPosition: string;
  experienceLevel: string;
  companyName: string;
  companyType: string;
  hiringType: string;
  workLocation: string;
  workMode: string;
  jobLevel: string;
  currentSalary: string;
  expectedSalary: string;
  preferredSalaryMin: string;
  preferredSalaryTarget: string;
  compensationType: string;
  joiningAvailability: string;
  otherOffers: string;
  otherOffersDetails?: string;
  importantBenefits: string[];
  candidatePriorities: string[];
  candidateSkills?: string;
  nonNegotiables: string;
  negotiationFlexibility: string;
  customInfo: string;
}

export interface JobEmployerContext {
  companyName: string;
  companyType: string;
  jobPosition: string;
  jobLevel: string;
  hiringType: string;
  requiredExperience: string;
  workLocation: string;
  workMode: string;
  salaryBudgetMin: string;
  salaryBudgetTarget: string;
  salaryBudgetMax: string;
  compensationStructure: string;
  benefitsOffered: string[];
  hiringUrgency: string;
  mustHaveSkills: string;
  preferredSkills: string;
  employerPriorities: string[];
  nonNegotiables: string;
  compensationFlexibility: string;
  customInfo: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  personality: 'Aggressive' | 'Collaborative' | 'Risk-Averse';
  experience: 'Low' | 'Medium' | 'High';
  goals: { id: string; text: string; priority: 'High' | 'Medium' | 'Low' }[];
  constraints: { id: string; label: string; value: string }[];
  targetPrice?: string;
  paymentTerms?: string;
  targetSalary?: string;
  remotePreference?: string;
  targetAllocation?: string;
  minAllocation?: string;
  currency?: string;
  
  // Structured Job Negotiation Contexts
  jobCandidateContext?: JobCandidateContext;
  jobEmployerContext?: JobEmployerContext;

  // Custom Scenario Fields
  minPrice?: string;
  quantityVolume?: string;
  qualityRequirement?: string;
  deliveryRequirement?: string;
  warrantySupport?: string;
  maxBudget?: string;
  otherConstraints?: string;
  
  minSalary?: string;
  equityExpectation?: string;
  benefits?: string;
  workArrangement?: string;
  locationPreference?: string;
  joiningTimeline?: string;
  roleExpectations?: string;
  otherPriorities?: string;
  maxSalary?: string;
  equityBoundary?: string;
  benefitsPackage?: string;
  roleScope?: string;
  hiringTimeline?: string;
  otherHiringConstraints?: string;
  
  maxAllocation?: string;
  departmentPriority?: string;
  budgetJustification?: string;
  timeline?: string;
  priorityAreas?: string;
  businessRequirements?: string;
  customInstructions?: string;
  negotiation_parameters?: Record<string, any>;
  selectedGoalOption?: string;
  selectedConstraintOption?: string;
}

export interface VendorPricingContext {
  industry: string;
  customIndustry: string;
  companyType: string;
  customCompanyType: string;
  dealType: string;
  customDealType: string;
  companySituation: string;

  categoryType: 'Product' | 'Service';
  productCategory: string;
  serviceCategory: string;
  customCategory: string;
  licenseType: string;
  userSeats: string;
  subscriptionPeriod: string;
  hardwareQuantity: string;
  hardwareSpecs: string;
  serviceScope: string;
  serviceDuration: string;

  quantityVolume: string;
  purchaseFrequency: string;
  contractDuration: string;
  currency: string;
  targetPrice: string;

  dimensions: string[];

  deliveryDate: string;
  leadTime: string;
  deliveryLocation: string;
  qualityStandard: string;
  acceptanceCriteria: string;
  warrantyCoverage: string;
  supportLevel: string;
  paymentTerms: string;
  paymentPeriodDays: string;
  earlyDiscount: string;

  tradeOffs: string[];
  customTradeOff: string;

  vendorObjective: string;
  vendorPriority: string;
  vendorMinPrice: string;
  vendorMinMargin: string;
  vendorMaxDiscount: string;
  vendorMinOrderQty: string;
  vendorMaxPaymentDelay: string;
  vendorCustomInstructions: string;

  buyerObjective: string;
  buyerPriority: string;
  buyerMaxBudget: string;
  buyerMaxPrice: string;
  buyerDeliveryDeadline: string;
  buyerMinQuality: string;
  buyerMinWarranty: string;
  buyerMaxPaymentPeriod: string;
  buyerCustomInstructions: string;
}

export interface BudgetAllocationContext {
  // Step 01: Project Context
  projectType: string;
  customProjectType: string;
  industry: string;
  customIndustry: string;
  projectStage: string;
  customProjectStage: string;
  businessObjective: string;
  projectImportance: string;
  projectSituation: string;
  customSituation: string;

  // Step 02: Budget & Allocation
  currency: string;
  totalAvailableBudget: string;
  budgetPeriod: string;
  currentRequestedBudget: string;
  budgetStatus: string;

  // Step 03: Allocation Areas
  allocationAreas: string[];
  customAllocationArea: string;

  // Step 04: Priorities
  prioritiesMostImportant: string[];
  prioritiesImportant: string[];
  prioritiesFlexible: string[];
  customPriority: string;

  // Step 05: Resource Requirements
  requiredHeadcount: string;
  criticalSkills: string;
  capacityRequirement: string;
  requiredTechnology: string;
  licenseRequirement: string;
  infrastructureRequirement: string;
  externalService: string;
  contractRequirement: string;
  supplierDependency: string;

  // Step 06: Trade-offs
  tradeOffs: string[];
  customTradeOff: string;

  // Step 07: Negotiation Position (per role)
  // Project Manager Position
  pmHardBoundary: string;
  pmCustomHardBoundary: string;
  pmPreferredOutcome: string;
  pmFlexibleAreas: string[];
  pmNonNegotiables: string;
  pmCustomInstructions: string;

  // Finance Manager Position
  fmHardBoundary: string;
  fmCustomHardBoundary: string;
  fmPreferredOutcome: string;
  fmFlexibleAreas: string[];
  fmNonNegotiables: string;
  fmCustomInstructions: string;

  // Department Head Position
  dhHardBoundary: string;
  dhCustomHardBoundary: string;
  dhPreferredOutcome: string;
  dhFlexibleAreas: string[];
  dhNonNegotiables: string;
  dhCustomInstructions: string;
}

export const DEFAULT_BUDGET_ALLOCATION_CONTEXT: BudgetAllocationContext = {
  projectType: '',
  customProjectType: '',
  industry: '',
  customIndustry: '',
  projectStage: '',
  customProjectStage: '',
  businessObjective: '',
  projectImportance: '',
  projectSituation: '',
  customSituation: '',

  currency: 'USD',
  totalAvailableBudget: '',
  budgetPeriod: '',
  currentRequestedBudget: '',
  budgetStatus: '',

  allocationAreas: [],
  customAllocationArea: '',

  prioritiesMostImportant: [],
  prioritiesImportant: [],
  prioritiesFlexible: [],
  customPriority: '',

  requiredHeadcount: '',
  criticalSkills: '',
  capacityRequirement: '',
  requiredTechnology: '',
  licenseRequirement: '',
  infrastructureRequirement: '',
  externalService: '',
  contractRequirement: '',
  supplierDependency: '',

  tradeOffs: [],
  customTradeOff: '',

  pmHardBoundary: '',
  pmCustomHardBoundary: '',
  pmPreferredOutcome: '',
  pmFlexibleAreas: [],
  pmNonNegotiables: '',
  pmCustomInstructions: '',

  fmHardBoundary: '',
  fmCustomHardBoundary: '',
  fmPreferredOutcome: '',
  fmFlexibleAreas: [],
  fmNonNegotiables: '',
  fmCustomInstructions: '',

  dhHardBoundary: '',
  dhCustomHardBoundary: '',
  dhPreferredOutcome: '',
  dhFlexibleAreas: [],
  dhNonNegotiables: '',
  dhCustomInstructions: '',
};

export const DEFAULT_VENDOR_PRICING_CONTEXT: VendorPricingContext = {
  industry: '',
  customIndustry: '',
  companyType: '',
  customCompanyType: '',
  dealType: '',
  customDealType: '',
  companySituation: '',

  categoryType: 'Product',
  productCategory: '',
  serviceCategory: '',
  customCategory: '',
  licenseType: 'User Seats',
  userSeats: '100',
  subscriptionPeriod: '1 Year',
  hardwareQuantity: '50',
  hardwareSpecs: '',
  serviceScope: '',
  serviceDuration: '12',

  quantityVolume: '',
  purchaseFrequency: 'Annual',
  contractDuration: '12',
  currency: 'USD',
  targetPrice: '',

  dimensions: ['Price'],

  deliveryDate: '',
  leadTime: '14 Days',
  deliveryLocation: '',
  qualityStandard: 'ISO 9001 Standard',
  acceptanceCriteria: '',
  warrantyCoverage: '12 Months',
  supportLevel: '24/7 Dedicated SLA',
  paymentTerms: 'Net 30',
  paymentPeriodDays: '30',
  earlyDiscount: '2%',

  tradeOffs: ['Price ↔ Volume'],
  customTradeOff: '',

  vendorObjective: '',
  vendorPriority: 'High',
  vendorMinPrice: '',
  vendorMinMargin: '20%',
  vendorMaxDiscount: '15%',
  vendorMinOrderQty: '100',
  vendorMaxPaymentDelay: 'Net 30',
  vendorCustomInstructions: '',

  buyerObjective: '',
  buyerPriority: 'High',
  buyerMaxBudget: '',
  buyerMaxPrice: '',
  buyerDeliveryDeadline: 'Immediate',
  buyerMinQuality: 'ISO Certified',
  buyerMinWarranty: '12 Months',
  buyerMaxPaymentPeriod: 'Net 60',
  buyerCustomInstructions: '',
};

export interface StoredReport {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  mode: 'ai-ai' | 'human-ai';
  dateTime: string;
  outcome: 'Agreement Reached' | 'Deadlock' | 'Stopped by User' | 'Unresolved / Terminated';
  agents: Agent[];
  messages: Message[];
  roundsCompleted: number;
  finalTerms?: {
    price?: string;
    salary?: string;
    allocation?: string;
    delivery?: string;
    paymentTerms?: string;
    warranty?: string;
    equity?: string;
    remoteDays?: string;
    marketingAllocation?: string;
    engineeringAllocation?: string;
  };
  metrics: {
    concessionControl: number;
    argumentStrength: number;
    activeListening: number;
    dealProgress: number;
  };
  summary: string;
  recommendations: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: 'Business' | 'HR' | 'Partnership' | 'Finance';
  description: string;
  agentCount: number;
  estimatedDuration: string;
  defaultAgents: Agent[];
  objective: string;
}

export interface Message {
  id: string;
  sender: string;
  role: string;
  avatar: string;
  content: string;
  timestamp: string;
  round: number;
  isUser?: boolean;
}

export interface SimulationState {
  round: number;
  maxRounds: number;
  status: 'idle' | 'running' | 'paused' | 'finished' | 'deadlock';
  speed: number; // in seconds per turn (e.g. 1, 2, 5)
  messages: Message[];
  agreementLikelihood: number;
  gapRemaining: number;
  concessionTrends: { round: number; buyer: number; seller: number }[];
  currentTurnIndex: number;
}

export interface PracticeState {
  messages: Message[];
  status: 'idle' | 'running' | 'finished' | 'deadlock';
  round: number;
  performance: {
    concessionControl: number;
    argumentStrength: number;
    activeListening: number;
    dealProgress: number;
  };
  tips: string[];
  suggestedResponse: string;
}

export interface User {
  email: string;
  isAuthenticated: boolean;
}

export interface Settings {
  language: string;
  theme: 'Light' | 'Dark';
  defaultMode: 'ai-ai' | 'human-ai';
  negotiationSpeed: 'Normal' | 'Fast' | 'Slow';
  autoSave: boolean;
  liveMetrics: boolean;
  confirmEnd: boolean;
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: string;
  status: 'Open' | 'Closed';
  date: string;
}

interface AppStore {
  user: User;
  settings: Settings;
  scenarios: Scenario[];
  customScenarios: Scenario[];
  selectedScenario: Scenario | null;
  configuredAgents: Agent[];
  selectedMode: 'ai-ai' | 'human-ai' | null;
  humanRole: string | null;
  reviewConfirmed: boolean;
  activeSessionId: string | null;
  activeSessionStatus: string | null;
  simulation: SimulationState;
  practice: PracticeState;
  supportTickets: SupportTicket[];
  
  // Stored reports state
  reports: StoredReport[];
  selectedReportId: string | null;
  vendorPricingContext: VendorPricingContext;
  budgetAllocationContext: BudgetAllocationContext;

  // Global workflow guard modal state
  guardModal: {
    isOpen: boolean;
    title: string;
    message: string;
    actionText: string;
    actionRoute: string;
  };
  
  // Session Actions
  setActiveSessionId: (id: string | null) => void;
  setActiveSessionStatus: (status: string | null) => void;
  resetActiveSession: () => void;
  resumeSession: (sessionId: string) => Promise<string | null>;
  
  // Actions
  login: (email: string) => void;
  logout: () => void;
  selectScenario: (scenario: Scenario) => void;
  updateVendorPricingContext: (updates: Partial<VendorPricingContext>) => void;
  updateBudgetAllocationContext: (updates: Partial<BudgetAllocationContext>) => void;
  setSelectedMode: (mode: 'ai-ai' | 'human-ai' | null) => void;
  setHumanRole: (role: string | null) => void;
  setGuardModal: (modal: Partial<AppStore['guardModal']>) => void;
  setReviewConfirmed: (confirmed: boolean) => void;
  getFirstIncompleteStepId: () => 'SCENARIO' | 'MODE' | 'AGENTS' | 'GOALS' | 'REVIEW' | 'NEGOTIATION';
  canAccessStep: (stepId: string) => boolean;
  getRouteForStepId: (stepId: string) => string;
  getStepIdForPath: (path: string) => string;
  createCustomScenario: (scenario: Scenario) => void;
  updateAgentConfig: (agentId: string, updates: Partial<Agent>) => void;
  addAgent: () => void;
  removeAgent: (agentId: string) => void;
  updateAgentGoal: (agentId: string, goalId: string, updates: Partial<Agent['goals'][0]>) => void;
  addAgentGoal: (agentId: string) => void;
  removeAgentGoal: (agentId: string, goalId: string) => void;
  updateAgentConstraint: (agentId: string, constraintId: string, updates: Partial<Agent['constraints'][0]>) => void;
  addAgentConstraint: (agentId: string) => void;
  removeAgentConstraint: (agentId: string, constraintId: string) => void;
  
  // Simulation Actions
  startSimulation: () => void;
  pauseSimulation: () => void;
  stepSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  endSimulation: () => void;
  resetSimulation: () => void;
  
  // Practice Actions
  startPractice: () => void;
  submitPracticeMessage: (content: string) => void;
  resetPractice: () => void;
  
  // Settings Actions
  updateSettings: (updates: Partial<Settings>) => void;
  
  // Support Actions
  submitTicket: (subject: string, category: string) => void;
  
  // Report Actions
  setSelectedReportId: (id: string | null) => void;
  createReportFromCurrent: (outcome: StoredReport['outcome']) => string;
}

// Pre-defined scenarios mock database
const PRESET_SCENARIOS: Scenario[] = [
  {
    id: 'vendor-pricing',
    title: 'Vendor Pricing Negotiation',
    category: 'Business',
    description: 'Negotiate the annual licensing cost and support terms for a customer relationship management (CRM) software suite. The vendor wants high volume commitment, whereas the buyer seeks flexible monthly payments.',
    agentCount: 2,
    estimatedDuration: '10 mins',
    objective: 'Agree on licensing fees per user, support tier level, and payment terms.',
    defaultAgents: [
      {
        id: 'buyer-crm',
        name: 'Buyer Agent',
        role: 'Buyer Agent',
        avatar: 'BA',
        personality: 'Collaborative',
        experience: 'High',
        goals: [
          { id: 'g1', text: 'Secure licensing fee below $45/user/month', priority: 'High' },
          { id: 'g2', text: 'Obtain Gold support package at no extra cost', priority: 'Medium' },
          { id: 'g3', text: 'Secure Net-45 payment terms', priority: 'Low' }
        ],
        constraints: [
          { id: 'c1', label: 'Maximum budget cap', value: '$120,000 / year' },
          { id: 'c2', label: 'Go-live timeline', value: 'Within 30 days' }
        ]
      },
      {
        id: 'seller-crm',
        name: 'Vendor Agent',
        role: 'Vendor Agent',
        avatar: 'VA',
        personality: 'Aggressive',
        experience: 'Medium',
        goals: [
          { id: 'g1', text: 'Close contract at $65/user/month minimum', priority: 'High' },
          { id: 'g2', text: 'Commit customer to a 3-year term duration', priority: 'High' },
          { id: 'g3', text: 'Include mandatory premium deployment fee', priority: 'Medium' }
        ],
        constraints: [
          { id: 'c1', label: 'Minimum user count', value: '150 seats minimum' },
          { id: 'c2', label: 'Standard pricing sheet', value: '$80/user list price' }
        ]
      }
    ]
  },
  {
    id: 'job-offer',
    title: 'Job Offer Negotiation',
    category: 'HR',
    description: 'A recruitment manager is hiring a Senior Software Engineer. The candidate has multiple offers and wants higher equity and remote options, while the recruiter has strict salary grade caps.',
    agentCount: 2,
    estimatedDuration: '5 mins',
    objective: 'Agree on base salary, stock options grant, and weekly remote work days schedule.',
    defaultAgents: [
      {
        id: 'recruiter-hr',
        name: 'Recruiter Agent',
        role: 'Recruiter Agent',
        avatar: 'RA',
        personality: 'Risk-Averse',
        experience: 'High',
        goals: [
          { id: 'g1', text: 'Keep base salary under $160,000', priority: 'High' },
          { id: 'g2', text: 'Limit stock options to 10,000 units', priority: 'Medium' },
          { id: 'g3', text: 'Establish minimum 3 days in office weekly', priority: 'High' }
        ],
        constraints: [
          { id: 'c1', label: 'Internal grade cap', value: '$170,000 absolute limit' },
          { id: 'c2', label: 'Option signing pool', value: '15,000 shares max' }
        ]
      },
      {
        id: 'candidate-hr',
        name: 'Candidate Agent',
        role: 'Candidate Agent',
        avatar: 'CA',
        personality: 'Collaborative',
        experience: 'High',
        goals: [
          { id: 'g1', text: 'Obtain base salary of $175,000 or above', priority: 'High' },
          { id: 'g2', text: 'Secure 12,000 stock options units', priority: 'Medium' },
          { id: 'g3', text: 'Get full remote work arrangement', priority: 'High' }
        ],
        constraints: [
          { id: 'c1', label: 'Current salary offer', value: '$155,000 competing offer' },
          { id: 'c2', label: 'Relocation cost', value: 'Self-funded' }
        ]
      }
    ]
  },
  {
    id: 'budget-allocation',
    title: 'Project Budget Allocation',
    category: 'Finance',
    description: 'A Department Head, Project Manager, and Finance Manager negotiate the allocation of a $1,000,000 corporate innovation fund across competing operational priorities.',
    agentCount: 3,
    estimatedDuration: '15 mins',
    objective: 'Reach consensus on capital allocation across Marketing, R&D Engineering, and Emergency Reserve Contingency within approved limits.',
    defaultAgents: [
      {
        id: 'dept-head',
        name: 'Department Head Agent',
        role: 'Department Head Agent',
        avatar: 'DH',
        personality: 'Collaborative',
        experience: 'High',
        targetAllocation: '$370,000',
        minAllocation: '$300,000',
        departmentPriority: 'User Acquisition & Brand Campaign',
        budgetJustification: 'National commercial campaign to drive Q3 growth',
        goals: [
          { id: 'g1', text: 'Secure minimum $350,000 for Q3 marketing launch', priority: 'High' },
          { id: 'g2', text: 'Co-sponsor product release campaign with engineering', priority: 'Medium' }
        ],
        constraints: [
          { id: 'c1', label: 'Agency retainer commit', value: '$250,000 minimum' },
          { id: 'c2', label: 'Commercial deadline', value: 'Q3 FY Launch' }
        ]
      },
      {
        id: 'project-manager',
        name: 'Project Manager Agent',
        role: 'Project Manager Agent',
        avatar: 'PM',
        personality: 'Aggressive',
        experience: 'Medium',
        targetAllocation: '$530,000',
        minAllocation: '$450,000',
        departmentPriority: 'Core Prototype Architecture & GPUs',
        budgetJustification: 'Cover fixed engineering overhead and hardware licenses',
        goals: [
          { id: 'g1', text: 'Secure minimum $500,000 for core engineering', priority: 'High' },
          { id: 'g2', text: 'Acquire high-performance server hardware license', priority: 'Medium' }
        ],
        constraints: [
          { id: 'c1', label: 'Contractor overhead', value: '$450,000 fixed' },
          { id: 'c2', label: 'Prototype timeline', value: 'Alpha build in 90 days' }
        ]
      },
      {
        id: 'finance-director',
        name: 'Finance Manager Agent',
        role: 'Finance Manager Agent',
        avatar: 'FM',
        personality: 'Risk-Averse',
        experience: 'High',
        targetAllocation: '$100,000',
        minAllocation: '$100,000',
        departmentPriority: 'Emergency Reserve Buffer',
        budgetJustification: 'Corporate compliance 10% risk contingency requirement',
        goals: [
          { id: 'g1', text: 'Maintain $100,000 emergency buffer pool', priority: 'High' },
          { id: 'g2', text: 'Ensure milestone-based phased distribution', priority: 'High' }
        ],
        constraints: [
          { id: 'c1', label: 'Maximum budget cap', value: '$1,000,000 total pool' },
          { id: 'c2', label: 'Audit compliance', value: 'Quarterly financial review' }
        ]
      }
    ]
  }
];

const MOCK_SIMULATION_MESSAGES: Record<string, string[]> = {
  'vendor-pricing': [
    "Alex Rivera (Procurement Director): Hello Sarah, thank you for taking the time today. We're very excited about standardizing on your CRM platform, but we need to find pricing that fits our operating budgets for the coming fiscal year.",
    "Sarah Chen (Enterprise Sales VP): Hi Alex, it's great to discuss this. We're eager to partner with you. Our standard pricing is $80 per user per month, which delivers incredible value in automations and advanced reporting. We can discuss adjustments if we look at a multi-year partnership.",
    "Alex Rivera (Procurement Director): Understood, but $80 is significantly above our budget cap of $120,000 annually. For our 200 users, that would total $192,000. We can commit to a 2-year deal, but we need the per-user licensing fee to be closer to $45, and we'd require Gold support included to assure smooth onboarding.",
    "Sarah Chen (Enterprise Sales VP): I appreciate the commitment to 2 years, Alex. However, $45 is close to a 45% discount, which is not sustainable for our enterprise tier. The best I can offer for a 2-year contract is $68 per user. Regarding support, we can offer our Gold Support tier at a 50% discount ($5/user instead of $10), bringing the total monthly user rate to $73.",
    "Alex Rivera (Procurement Director): Thank you for the movement, Sarah. $68 is a step forward, but with support at $5, that's $73. For 200 users, that still totals $175,200 annually. To bridge the gap, what if we commit to a 3-year term, and in return we receive the user rate at $52, with Gold Support fully bundled? We also require Net-45 payment terms instead of Net-30 to align with our corporate finance cycles.",
    "Sarah Chen (Enterprise Sales VP): A 3-year commitment changes the economics. If you sign for 3 years, I can lower the base user licensing to $58 per user. I will bundle the Gold Support package at no additional cost as a gesture of partnership. However, our finance board is strict on cash flow - I must insist on Net-30 terms. Net-45 is a dealbreaker for contract values of this scale.",
    "Alex Rivera (Procurement Director): The $58 rate with bundled Gold support is very reasonable and puts our annual license cost at $139,200, which we can stretch our budget to accommodate. To finalize, if we agree to Net-30 payment terms, would you be willing to waive the $10,000 premium setup and deployment fee?",
    "Sarah Chen (Enterprise Sales VP): Alex, you negotiate hard! If we sign the 3-year contract at $58/user/month with Gold Support included, and maintain Net-30 payment terms, I will agree to waive the setup and deployment fee. Let's get the contracts drafted.",
    "Alex Rivera (Procurement Director): Outstanding, Sarah! This is a fair contract for both sides. I appreciate your collaboration. Let's move forward."
  ],
  'job-offer': [
    "Marcus Brody (Lead HR Partner): Hi Elena, welcome. We were extremely impressed with your technical rounds and are excited to offer you the Senior Software Engineer position. Our initial offer includes a base salary of $150,000 and 8,000 stock options, with a hybrid expectation of 3 days in the office.",
    "Elena Rostova (Senior Developer Candidate): Thank you Marcus! I'm thrilled to receive the offer. I love the team. However, I have another offer on the table for $165,000. Given my 8 years of specialized architecture experience, I was hoping for a base salary closer to $175,000 and 12,000 stock options to make this transition.",
    "Marcus Brody (Lead HR Partner): I understand your position, Elena. We value your expertise, but our internal compensation grades cap this role's base salary at $160,000. If we raise the base salary to $160,000, we could increase the stock option grant to 10,000 units. We must maintain the 3 days in office policy to align with team cohesion.",
    "Elena Rostova (Senior Developer Candidate): I appreciate the explanation, Marcus. The $160,000 salary is competitive, and the 10,000 options help. But since the base is still slightly below my market expectation, could we adjust the remote work policy? If I do 2 days in office and 3 days remote, I can manage my commute much better and accept this compensation.",
    "Marcus Brody (Lead HR Partner): We are committed to employee flexibility, but the team's core sprint days are Tuesday through Thursday, requiring 3 days. What if we offer a one-time sign-on bonus of $10,000 to bridge the base salary gap, keep base at $160,000 and stock options at 11,000, while maintaining the 3-day in-office expectation?",
    "Elena Rostova (Senior Developer Candidate): That is a very creative solution, Marcus. The sign-on bonus and 11,000 options are highly appealing. If we stick to the 3-day in-office rule, can we agree that after 6 months of onboarding, I can transition to 2 days in office based on manager approval?",
    "Marcus Brody (Lead HR Partner): I think that is a very reasonable compromise, Elena. We can write that review clause into your offer letter. So, to confirm: $160,000 base, 11,000 stock options, $10,000 signing bonus, 3 days in-office with a review to transition to 2 days after 6 months. Do we have a deal?",
    "Elena Rostova (Senior Developer Candidate): Yes, Marcus! We have a deal. I'm excited to join the team and sign the offer letter."
  ],
  'budget-allocation': [
    "Elena Rostova (Finance VP): Welcome Nikhil. We have $1,000,000 available in our corporate innovation fund. As Finance VP, my priority is ensuring commercialization. I propose allocating 60% of the funds to product marketing, sales activation, and PR, with the remaining 40% going to core engineering.",
    "Nikhil Sharma (R&D Lead): Thanks Elena. I understand the commercial focus, but we cannot sell a product that isn't fully built. Our engineering team requires a minimum of $650,000 (65%) to hire the contractors and license the GPU cluster required for the prototype. Without it, our launch will be delayed.",
    "Elena Rostova (Finance VP): Nikhil, a delayed prototype is a risk, but a prototype with no market awareness is a total loss. Our compliance guidelines require a 10% emergency buffer ($100,000) reserved in the finance bank. That leaves $900,000. I can offer $450,000 for R&D development, provided it's released in quarterly milestones, and $450,000 for the marketing campaign.",
    "Nikhil Sharma (R&D Lead): The milestone release is manageable, but $450,000 is too low. Our fixed contractor salaries alone are $450,000 - leaving zero budget for hardware licenses or testing. What if we split the budget as: $580,000 for R&D engineering, $320,000 for marketing launch, and we keep the $100,000 emergency buffer. For efficiency, we can purchase a lower-tier hardware package.",
    "Elena Rostova (Finance VP): That proposal is a good step. However, $320,000 is tight for a national campaign. If we allocate $530,000 to R&D, $370,000 to marketing, and maintain the $100,000 buffer, we can approve this allocation immediately. The R&D funds will be distributed in three phases based on prototype progress.",
    "Nikhil Sharma (R&D Lead): $530,000 is enough to cover our developers and purchase the core server licenses we need. The phased distribution is acceptable. I agree to this allocation: $530,000 R&D, $370,000 Marketing, and $100,000 Finance buffer. This gives us the resources to deliver a quality product and support its launch.",
    "Elena Rostova (Finance VP): Excellent, Nikhil. This budget split maximizes our chances of both technical and market success. I'll document the agreement and initiate the first milestone transfer."
  ]
};

// Simulation timer handle
let simInterval: number | null = null;

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      user: {
        email: '',
        isAuthenticated: false
      },
  settings: {
    language: 'English',
    theme: 'Light',
    defaultMode: 'ai-ai',
    negotiationSpeed: 'Normal',
    autoSave: true,
    liveMetrics: true,
    confirmEnd: true
  },
  scenarios: PRESET_SCENARIOS,
  customScenarios: [],
  selectedScenario: null,
  configuredAgents: [],
  selectedMode: null,
  reviewConfirmed: false,
  activeSessionId: null,
  activeSessionStatus: null,
  guardModal: {
    isOpen: false,
    title: '',
    message: '',
    actionText: '',
    actionRoute: ''
  },
  
  // Session Actions
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  setActiveSessionStatus: (status) => set({ activeSessionStatus: status }),
  resetActiveSession: () => set({ activeSessionId: null, activeSessionStatus: null }),
  resumeSession: async (sessionId: string) => {
    try {
      const session = await negotiationApi.getSession(sessionId);
      if (!session) return null;

      const allScenarios = [...get().scenarios, ...get().customScenarios];
      const targetScenario = allScenarios.find((s) => s.id === session.scenario_id);

      const formattedMessages: Message[] = (session.messages || []).map((m: any) => ({
        id: m.id || `msg-${Math.random()}`,
        sender: m.sender,
        role: m.role,
        avatar: m.avatar || m.sender?.slice(0, 2).toUpperCase() || 'AG',
        content: m.content,
        timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: m.round || 1,
        isUser: m.is_user || false,
      }));

      const sessionStatus = session.status || 'running';
      const isFinished = sessionStatus === 'finished' || sessionStatus === 'deadlock';

      let restoredAgents = get().configuredAgents;
      if (session.agents && session.agents.length > 0) {
        restoredAgents = session.agents.map((a: any) => ({
          id: a.id,
          name: a.name,
          role: a.role,
          avatar: a.avatar || a.name?.slice(0, 2).toUpperCase() || 'AG',
          personality: a.personality || 'Collaborative',
          experience: a.experience || 'Intermediate',
          primaryGoal: (a.goals && a.goals[0]?.text) || '',
          goals: a.goals || [],
          constraints: a.constraints || [],
          negotiation_parameters: a.negotiation_parameters || {},
          targetPrice: a.negotiation_parameters?.targetPrice || '',
          minPrice: a.negotiation_parameters?.minPrice || '',
          maxBudget: a.negotiation_parameters?.maxBudget || '',
          targetSalary: a.negotiation_parameters?.targetSalary || '',
          minSalary: a.negotiation_parameters?.minSalary || '',
          maxSalary: a.negotiation_parameters?.maxSalary || '',
          targetAllocation: a.negotiation_parameters?.targetAllocation || '',
          minAllocation: a.negotiation_parameters?.minAllocation || '',
          maxAllocation: a.negotiation_parameters?.maxAllocation || '',
          paymentTerms: a.negotiation_parameters?.paymentTerms || '',
          deliveryRequirement: a.negotiation_parameters?.deliveryRequirement || '',
          warrantySupport: a.negotiation_parameters?.warrantySupport || '',
        }));
      }

      set({
        activeSessionId: session.id,
        activeSessionStatus: sessionStatus,
        selectedScenario: targetScenario || get().selectedScenario,
        selectedMode: session.mode as any,
        humanRole: session.human_role || null,
        reviewConfirmed: session.review_confirmed || true,
        configuredAgents: restoredAgents,
      });

      if (session.mode === 'human-ai') {
        set({
          practice: {
            ...get().practice,
            status: isFinished ? 'finished' : 'running',
            round: session.current_round || 1,
            messages: formattedMessages,
          },
        });
      } else {
        set({
          simulation: {
            ...get().simulation,
            status: isFinished ? (sessionStatus as any) : sessionStatus === 'paused' ? 'paused' : 'running',
            round: session.current_round || 1,
            messages: formattedMessages,
          },
        });
      }

      // Compute exact step-aware destination
      const step = (session.current_step || '').toUpperCase();
      if (step === 'SCENARIO') return '/setup/scenario';
      if (step === 'MODE') return '/setup/mode';
      if (step === 'AGENTS') return '/setup/agents';
      if (step === 'GOALS') return '/setup/goals';
      if (step === 'REVIEW') return '/setup/review';
      if (isFinished || sessionStatus === 'terminated') {
        const reportId = session.report?.id || session.report_id || session.id;
        set({ selectedReportId: reportId });
        return '/reports';
      }
      return session.mode === 'human-ai' ? '/arena/practice' : '/arena/simulation';
    } catch (err) {
      console.error('Failed to resume negotiation session:', err);
      return null;
    }
  },
  
  simulation: {
    round: 0,
    maxRounds: 9,
    status: 'idle',
    speed: 2, // 2 seconds per turn by default
    messages: [],
    agreementLikelihood: 10,
    gapRemaining: 90,
    concessionTrends: [],
    currentTurnIndex: 0
  },
  
  practice: {
    messages: [],
    status: 'idle',
    round: 0,
    performance: {
      concessionControl: 50,
      argumentStrength: 45,
      activeListening: 40,
      dealProgress: 10
    },
    tips: [
      "Acknowledge the Recruiter's constraints first to build rapport.",
      "Highlight your technical achievements to support your base salary request."
    ],
    suggestedResponse: "Thank you for the offer! I am very excited. Given the market rates and my background, could we discuss increasing the base salary closer to $170,000?"
  },
  
  reports: [],
  selectedReportId: null,
  humanRole: null,
  vendorPricingContext: DEFAULT_VENDOR_PRICING_CONTEXT,
  budgetAllocationContext: DEFAULT_BUDGET_ALLOCATION_CONTEXT,
  
  supportTickets: [
    { id: '1', subject: 'Agent deadlock resolution loop', category: 'Technical Issue', status: 'Open', date: '2026-08-10' },
    { id: '2', subject: 'Export report to CSV formatting', category: 'Feature Request', status: 'Closed', date: '2026-08-08' }
  ],
  
  // Actions
  login: (email) => set({ user: { email, isAuthenticated: true } }),
  logout: () => set({ user: { email: '', isAuthenticated: false } }),
  
  updateVendorPricingContext: (updates) =>
    set((state) => ({
      vendorPricingContext: { ...state.vendorPricingContext, ...updates },
    })),
  
  updateBudgetAllocationContext: (updates) =>
    set((state) => ({
      budgetAllocationContext: { ...state.budgetAllocationContext, ...updates },
    })),
  
  selectScenario: (scenario) => {
    const initializedAgents = scenario.defaultAgents.map((agent: any, index: number) => {
      let fixedRole = agent.role || '';
      let defaultName = agent.name || 'Agent';

      if (scenario.id === 'job-offer') {
        fixedRole = index === 0 ? 'Recruiter' : 'Candidate';
        defaultName = index === 0 ? 'Recruiter Agent' : 'Candidate Agent';
      } else if (scenario.id === 'vendor-pricing') {
        fixedRole = index === 0 ? 'Buyer' : 'Vendor';
        defaultName = index === 0 ? 'Buyer Agent' : 'Vendor Agent';
      } else if (scenario.id === 'budget-allocation') {
        fixedRole = index === 0 ? 'Department Head' : index === 1 ? 'Project Manager' : 'Finance Manager';
        defaultName = index === 0 ? 'Department Head Agent' : index === 1 ? 'Project Manager Agent' : 'Finance Manager Agent';
      }

      const personality = agent.personality || (index === 0 ? 'Collaborative' : index === 1 ? 'Aggressive' : 'Risk-Averse');
      
      const goals = agent.goals && agent.goals.length > 0 && agent.goals[0].text
        ? agent.goals
        : scenario.id === 'vendor-pricing'
        ? index === 0
          ? [
              { id: 'g1', text: 'Secure licensing fee below $45/user/month', priority: 'High' },
              { id: 'g2', text: 'Obtain Gold support package at no extra cost', priority: 'Medium' },
              { id: 'g3', text: 'Secure Net-45 payment terms', priority: 'Low' }
            ]
          : [
              { id: 'g1', text: 'Close contract at $65/user/month minimum', priority: 'High' },
              { id: 'g2', text: 'Commit customer to a 3-year term duration', priority: 'High' },
              { id: 'g3', text: 'Include mandatory premium deployment fee', priority: 'Medium' }
            ]
        : scenario.id === 'job-offer'
        ? index === 0
          ? [
              { id: 'g1', text: 'Keep base salary under $160,000', priority: 'High' },
              { id: 'g2', text: 'Limit stock options to 10,000 units', priority: 'Medium' },
              { id: 'g3', text: 'Establish minimum 3 days in office weekly', priority: 'High' }
            ]
          : [
              { id: 'g1', text: 'Obtain base salary of $175,000 or above', priority: 'High' },
              { id: 'g2', text: 'Secure 12,000 stock options units', priority: 'Medium' },
              { id: 'g3', text: 'Get full remote work arrangement', priority: 'High' }
            ]
        : [
            { id: 'g1', text: 'Achieve primary project allocation target', priority: 'High' }
          ];

      const constraints = agent.constraints && agent.constraints.length > 0 && agent.constraints[0].value
        ? agent.constraints
        : scenario.id === 'vendor-pricing'
        ? index === 0
          ? [
              { id: 'c1', label: 'Maximum budget cap', value: '$120,000 / year' },
              { id: 'c2', label: 'Go-live timeline', value: 'Within 30 days' }
            ]
          : [
              { id: 'c1', label: 'Minimum user count', value: '150 seats minimum' },
              { id: 'c2', label: 'Standard pricing sheet', value: '$80/user list price' }
            ]
        : scenario.id === 'job-offer'
        ? index === 0
          ? [
              { id: 'c1', label: 'Internal grade cap', value: '$170,000 absolute limit' },
              { id: 'c2', label: 'Option signing pool', value: '15,000 shares max' }
            ]
          : [
              { id: 'c1', label: 'Current salary offer', value: '$155,000 competing offer' },
              { id: 'c2', label: 'Relocation cost', value: 'Self-funded' }
            ]
        : [
            { id: 'c1', label: 'Total Pool Ceiling', value: '$500,000 absolute cap' }
          ];

      return {
        ...agent,
        name: defaultName,
        role: fixedRole,
        personality,
        goals,
        constraints,
        targetPrice: agent.targetPrice || (scenario.id === 'vendor-pricing' ? (index === 0 ? '$45/user/month' : '$65/user/month') : ''),
        minPrice: agent.minPrice || (scenario.id === 'vendor-pricing' ? (index === 0 ? '' : '$55/user/month') : ''),
        maxBudget: agent.maxBudget || (scenario.id === 'vendor-pricing' ? (index === 0 ? '$120,000 / year' : '') : ''),
        paymentTerms: agent.paymentTerms || (scenario.id === 'vendor-pricing' ? (index === 0 ? 'Net-45' : 'Net-30') : ''),
        warrantySupport: agent.warrantySupport || (scenario.id === 'vendor-pricing' ? (index === 0 ? 'Gold Support' : 'Gold Support Package') : ''),
        targetSalary: agent.targetSalary || (scenario.id === 'job-offer' ? (index === 0 ? '$155,000' : '$175,000') : ''),
        maxSalary: agent.maxSalary || (scenario.id === 'job-offer' ? (index === 0 ? '$170,000' : '') : ''),
        minSalary: agent.minSalary || (scenario.id === 'job-offer' ? (index === 0 ? '' : '$165,000') : ''),
        equityExpectation: agent.equityExpectation || (scenario.id === 'job-offer' ? (index === 0 ? '10,000 shares' : '20,000 shares') : ''),
        remotePreference: agent.remotePreference || (scenario.id === 'job-offer' ? (index === 0 ? '3 days in office' : '4 days remote') : ''),
        targetAllocation: agent.targetAllocation || (scenario.id === 'budget-allocation' ? (index === 0 ? '$180,000' : index === 1 ? '$250,000' : '$500,000') : ''),
        minAllocation: agent.minAllocation || (scenario.id === 'budget-allocation' ? (index === 0 ? '$130,000' : index === 1 ? '$200,000' : '') : ''),
        maxAllocation: agent.maxAllocation || (scenario.id === 'budget-allocation' ? (index === 2 ? '$500,000' : '') : ''),
      };
    });

  set({
      selectedScenario: scenario,
      configuredAgents: initializedAgents,
      selectedMode: null,
      humanRole: null,
      reviewConfirmed: false,
      activeSessionId: null,
      activeSessionStatus: null,
      simulation: {
        round: 0,
        maxRounds: 9,
        status: 'idle',
        speed: 2,
        messages: [],
        agreementLikelihood: 10,
        gapRemaining: 90,
        concessionTrends: [],
        currentTurnIndex: 0
      },
      practice: {
        messages: [],
        status: 'idle',
        round: 0,
        performance: {
          concessionControl: 50,
          argumentStrength: 45,
          activeListening: 40,
          dealProgress: 10
        },
        tips: [],
        suggestedResponse: ''
      }
    });
  },
  
  setSelectedMode: (mode) => set({ selectedMode: mode, reviewConfirmed: false }),
  setHumanRole: (role) => set({ humanRole: role, reviewConfirmed: false }),
  setGuardModal: (modal) => set((state) => ({
    guardModal: { ...state.guardModal, ...modal }
  })),
  setReviewConfirmed: (confirmed) => set({ reviewConfirmed: confirmed }),
  
  canAccessStep: (stepId) => {
    if (stepId === 'SCENARIO' || stepId === '' || stepId === 'OUTCOME') return true;
    
    const stepOrder = ['SCENARIO', 'MODE', 'AGENTS', 'GOALS', 'REVIEW', 'NEGOTIATION'];
    const currentIncomplete = get().getFirstIncompleteStepId();
    const targetIdx = stepOrder.indexOf(stepId);
    const incompleteIdx = stepOrder.indexOf(currentIncomplete);
    
    if (targetIdx === -1 || incompleteIdx === -1) return false;
    return targetIdx <= incompleteIdx;
  },
  
  getRouteForStepId: (id) => {
    const selectedMode = get().selectedMode;
    switch (id) {
      case 'SCENARIO': return '/setup/scenario';
      case 'MODE': return '/setup/mode';
      case 'AGENTS': return '/setup/agents';
      case 'GOALS': return '/setup/goals';
      case 'REVIEW': return '/setup/review';
      case 'NEGOTIATION': return selectedMode === 'human-ai' ? '/arena/practice' : '/arena/simulation';
      case 'OUTCOME': return '/reports';
      default: return '/setup/scenario';
    }
  },

  getStepIdForPath: (path) => {
    if (path.startsWith('/setup/scenario')) return 'SCENARIO';
    if (path.startsWith('/setup/mode')) return 'MODE';
    if (path.startsWith('/setup/agents')) return 'AGENTS';
    if (path.startsWith('/setup/goals')) return 'GOALS';
    if (path.startsWith('/setup/review')) return 'REVIEW';
    if (path.startsWith('/arena/')) return 'NEGOTIATION';
    if (path.startsWith('/reports')) return 'OUTCOME';
    return '';
  },

  getFirstIncompleteStepId: () => {
    const store = get();
    const { selectedScenario, selectedMode, humanRole, configuredAgents, reviewConfirmed } = store;
    if (!selectedScenario) return 'SCENARIO';
    if (!selectedMode) return 'MODE';

    const isAgentHuman = (index: number) => {
      if (selectedMode !== 'human-ai') return false;
      if (selectedScenario.id === 'vendor-pricing') {
        return (humanRole === 'buyer' && index === 0) || (humanRole === 'vendor' && index === 1);
      }
      if (selectedScenario.id === 'job-offer') {
        return (humanRole === 'recruiter' && index === 0) || (humanRole === 'candidate' && index === 1);
      }
      if (selectedScenario.id === 'budget-allocation') {
        return (
          (humanRole === 'department-head' && index === 0) ||
          (humanRole === 'project-manager' && index === 1) ||
          (humanRole === 'finance-director' && index === 2)
        );
      }
      return false;
    };

    const isAgentBaseValid = (agent: any, index: number) => {
      if (selectedMode === 'human-ai' && isAgentHuman(index)) {
        return true;
      }
      const goalOpt = agent.selectedGoalOption;
      const constraintOpt = agent.selectedConstraintOption;
      const hasGoals = (Array.isArray(agent.goals) && agent.goals.length > 0 && (agent.goals[0]?.text?.trim() !== '')) ||
        (goalOpt && goalOpt !== 'Select Primary Goal' && goalOpt !== '');
      const hasConstraints = (Array.isArray(agent.constraints) && agent.constraints.length > 0 && (agent.constraints[0]?.value?.trim() !== '' || agent.constraints[0]?.label?.trim() !== '')) ||
        (constraintOpt && constraintOpt !== 'Select Key Constraint' && constraintOpt !== '');

      return (
        Boolean(agent.name?.trim()) &&
        Boolean(agent.role?.trim()) &&
        agent.personality !== undefined &&
        hasGoals &&
        hasConstraints
      );
    };

    const expectedAgentCount = selectedScenario.defaultAgents?.length || 2;
    const agentsValid = configuredAgents.length >= expectedAgentCount && 
      configuredAgents.slice(0, expectedAgentCount).every((agent, idx) => isAgentBaseValid(agent, idx));

    if (!agentsValid) return 'AGENTS';

    let goalsConstraintsValid = true;
    for (let i = 0; i < expectedAgentCount; i++) {
      const agent = configuredAgents[i];
      if (!agent) { goalsConstraintsValid = false; break; }
      if (selectedMode === 'human-ai' && isAgentHuman(i)) continue;
      
      const hasGoal = (Array.isArray(agent.goals) && agent.goals.length > 0 && agent.goals[0]?.text?.trim()) ||
        (agent.selectedGoalOption && agent.selectedGoalOption !== 'Select Primary Goal');
      const hasConstraint = (Array.isArray(agent.constraints) && agent.constraints.length > 0 && (agent.constraints[0]?.value?.trim() || agent.constraints[0]?.label?.trim())) ||
        (agent.selectedConstraintOption && agent.selectedConstraintOption !== 'Select Key Constraint');

      if (!hasGoal || !hasConstraint) {
        goalsConstraintsValid = false;
        break;
      }
    }

    if (!goalsConstraintsValid) return 'GOALS';
    if (!reviewConfirmed) return 'REVIEW';

    return 'NEGOTIATION';
  },
  
  createCustomScenario: (scenario) => set((state) => ({
    customScenarios: [...state.customScenarios, scenario],
    selectedScenario: scenario,
    configuredAgents: JSON.parse(JSON.stringify(scenario.defaultAgents))
  })),
  
  updateAgentConfig: (agentId, updates) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    ),
    reviewConfirmed: false
  })),
  
  addAgent: () => set((state) => {
    const newId = `agent-${Date.now()}`;
    const newAgent: Agent = {
      id: newId,
      name: `Agent ${state.configuredAgents.length + 1}`,
      role: 'Consultant',
      avatar: 'AC',
      personality: 'Collaborative',
      experience: 'Medium',
      goals: [{ id: 'g-1', text: 'Define standard scope', priority: 'Medium' }],
      constraints: [{ id: 'c-1', label: 'Availability', value: 'Part-time' }]
    };
    return { configuredAgents: [...state.configuredAgents, newAgent] };
  }),
  
  removeAgent: (agentId) => set((state) => ({
    configuredAgents: state.configuredAgents.filter((agent) => agent.id !== agentId)
  })),
  
  updateAgentGoal: (agentId, goalId, updates) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        goals: agent.goals.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
      };
    }),
    reviewConfirmed: false
  })),
  
  addAgentGoal: (agentId) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        goals: [...agent.goals, { id: `g-${Date.now()}`, text: 'New Goal', priority: 'Medium' }]
      };
    }),
    reviewConfirmed: false
  })),
  
  removeAgentGoal: (agentId, goalId) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        goals: agent.goals.filter((g) => g.id !== goalId)
      };
    }),
    reviewConfirmed: false
  })),
  
  updateAgentConstraint: (agentId, constraintId, updates) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        constraints: agent.constraints.map((c) =>
          c.id === constraintId ? { ...c, ...updates } : c
        )
      };
    }),
    reviewConfirmed: false
  })),
  
  addAgentConstraint: (agentId) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        constraints: [...agent.constraints, { id: `c-${Date.now()}`, label: 'New Limit', value: 'Value' }]
      };
    }),
    reviewConfirmed: false
  })),
  
  removeAgentConstraint: (agentId, constraintId) => set((state) => ({
    configuredAgents: state.configuredAgents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return {
        ...agent,
        constraints: agent.constraints.filter((c) => c.id !== constraintId)
      };
    }),
    reviewConfirmed: false
  })),
  
  // Simulation control actions
  startSimulation: () => {
    const { status, speed } = get().simulation;
    if (status === 'running') return;
    
    set((state) => ({
      simulation: { ...state.simulation, status: 'running' }
    }));
    
    const intervalMs = speed * 1000;
    
    // Simulate steps in interval
    simInterval = window.setInterval(() => {
      const currentSim = get().simulation;
      const scenario = get().selectedScenario;
      if (!scenario) return;
      
      const presetMessages = MOCK_SIMULATION_MESSAGES[scenario.id] || [];
      const nextMsgIndex = currentSim.messages.length;
      
      if (nextMsgIndex >= presetMessages.length) {
        // finished
        if (simInterval) clearInterval(simInterval);
        set((state) => ({
          simulation: {
            ...state.simulation,
            status: 'finished',
            agreementLikelihood: 100,
            gapRemaining: 0
          }
        }));
        get().createReportFromCurrent('Agreement Reached');
        return;
      }
      
      const fullMsg = presetMessages[nextMsgIndex];
      const colonIdx = fullMsg.indexOf(':');
      const senderInfo = fullMsg.substring(0, colonIdx);
      const content = fullMsg.substring(colonIdx + 2);
      
      const agent = get().configuredAgents.find(a => senderInfo.startsWith(a.name)) || get().configuredAgents[nextMsgIndex % 2];
      
      const newMsg: Message = {
        id: `sim-msg-${nextMsgIndex}`,
        sender: agent.name,
        role: agent.role,
        avatar: agent.avatar,
        content,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        round: Math.floor(nextMsgIndex / 2) + 1
      };
      
      // Calculate trend changes
      const likelihoodInc = Math.floor(Math.random() * 12) + 5;
      const newLikelihood = Math.min(95, currentSim.agreementLikelihood + likelihoodInc);
      const newGap = Math.max(5, currentSim.gapRemaining - Math.floor(likelihoodInc * 0.8));
      const nextRoundVal = Math.floor(nextMsgIndex / 2) + 1;
      
      set((state) => {
        const nextConcessions = [...state.simulation.concessionTrends];
        if (nextMsgIndex % 2 === 0) {
          nextConcessions.push({
            round: nextRoundVal,
            buyer: (state.simulation.concessionTrends[state.simulation.concessionTrends.length - 1]?.buyer || 0) + Math.floor(Math.random() * 15) + 5,
            seller: state.simulation.concessionTrends[state.simulation.concessionTrends.length - 1]?.seller || 0
          });
        } else {
          if (nextConcessions.length > 0) {
            nextConcessions[nextConcessions.length - 1].seller = (nextConcessions[nextConcessions.length - 1]?.seller || 0) + Math.floor(Math.random() * 15) + 5;
          }
        }
        
        return {
          simulation: {
            ...state.simulation,
            round: nextRoundVal,
            messages: [...state.simulation.messages, newMsg],
            agreementLikelihood: newLikelihood,
            gapRemaining: newGap,
            concessionTrends: nextConcessions,
            currentTurnIndex: (nextMsgIndex + 1) % state.configuredAgents.length
          }
        };
      });
    }, intervalMs);
  },
  
  pauseSimulation: () => {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
    set((state) => ({
      simulation: { ...state.simulation, status: 'paused' }
    }));
  },
  
  stepSimulation: () => {
    const currentSim = get().simulation;
    const scenario = get().selectedScenario;
    if (!scenario) return;
    
    const presetMessages = MOCK_SIMULATION_MESSAGES[scenario.id] || [];
    const nextMsgIndex = currentSim.messages.length;
    
    if (nextMsgIndex >= presetMessages.length) {
      set((state) => ({
        simulation: {
          ...state.simulation,
          status: 'finished',
          agreementLikelihood: 100,
          gapRemaining: 0
        }
      }));
      get().createReportFromCurrent('Agreement Reached');
      return;
    }
    
    const fullMsg = presetMessages[nextMsgIndex];
    const colonIdx = fullMsg.indexOf(':');
    const senderInfo = fullMsg.substring(0, colonIdx);
    const content = fullMsg.substring(colonIdx + 2);
    
    const agent = get().configuredAgents.find(a => senderInfo.startsWith(a.name)) || get().configuredAgents[nextMsgIndex % 2];
    
    const newMsg: Message = {
      id: `sim-msg-${nextMsgIndex}`,
      sender: agent.name,
      role: agent.role,
      avatar: agent.avatar,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: Math.floor(nextMsgIndex / 2) + 1
    };
    
    const likelihoodInc = Math.floor(Math.random() * 12) + 5;
    const newLikelihood = nextMsgIndex === presetMessages.length - 1 ? 100 : Math.min(95, currentSim.agreementLikelihood + likelihoodInc);
    const newGap = nextMsgIndex === presetMessages.length - 1 ? 0 : Math.max(5, currentSim.gapRemaining - Math.floor(likelihoodInc * 0.8));
    const nextRoundVal = Math.floor(nextMsgIndex / 2) + 1;
    
    set((state) => {
      const nextConcessions = [...state.simulation.concessionTrends];
      if (nextMsgIndex % 2 === 0) {
        nextConcessions.push({
          round: nextRoundVal,
          buyer: (state.simulation.concessionTrends[state.simulation.concessionTrends.length - 1]?.buyer || 0) + Math.floor(Math.random() * 15) + 5,
          seller: state.simulation.concessionTrends[state.simulation.concessionTrends.length - 1]?.seller || 0
        });
      } else {
        if (nextConcessions.length > 0) {
          nextConcessions[nextConcessions.length - 1].seller = (nextConcessions[nextConcessions.length - 1]?.seller || 0) + Math.floor(Math.random() * 15) + 5;
        }
      }
      
      return {
        simulation: {
          ...state.simulation,
          round: nextRoundVal,
          status: nextMsgIndex === presetMessages.length - 1 ? 'finished' : 'paused',
          messages: [...state.simulation.messages, newMsg],
          agreementLikelihood: newLikelihood,
          gapRemaining: newGap,
          concessionTrends: nextConcessions,
          currentTurnIndex: (nextMsgIndex + 1) % state.configuredAgents.length
        }
      };
    });

    if (nextMsgIndex === presetMessages.length - 1) {
      get().createReportFromCurrent('Agreement Reached');
    }
  },
  
  setSimulationSpeed: (speed) => {
    set((state) => ({
      simulation: { ...state.simulation, speed }
    }));
    
    // If running, restart timer with new speed
    if (get().simulation.status === 'running') {
      if (simInterval) clearInterval(simInterval);
      get().startSimulation();
    }
  },
  
  endSimulation: () => {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
    set((state) => ({
      simulation: {
        ...state.simulation,
        status: 'finished',
        agreementLikelihood: 100,
        gapRemaining: 0
      }
    }));
    get().createReportFromCurrent('Stopped by User');
  },
  
  resetSimulation: () => {
    if (simInterval) {
      clearInterval(simInterval);
      simInterval = null;
    }
    set({
      simulation: {
        round: 0,
        maxRounds: 9,
        status: 'idle',
        speed: 2,
        messages: [],
        agreementLikelihood: 10,
        gapRemaining: 90,
        concessionTrends: [],
        currentTurnIndex: 0
      }
    });
  },
  
  // Practice Mode actions
  startPractice: () => {
    const scenario = get().selectedScenario;
    if (!scenario) return;
    
    const opponent = get().configuredAgents[1] || scenario.defaultAgents[1];
    const initialMessage: Message = {
      id: 'practice-msg-0',
      sender: opponent.name,
      role: opponent.role,
      avatar: opponent.avatar,
      content: `Hello, thank you for meeting with me. As the ${opponent.role}, my main focus is standardizing user operations and ensuring pricing rules align with policy. Let's discuss our parameters to see how we can align.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: 1
    };
    
    set({
      practice: {
        status: 'running',
        round: 1,
        messages: [initialMessage],
        performance: {
          concessionControl: 50,
          argumentStrength: 45,
          activeListening: 35,
          dealProgress: 15
        },
        tips: [
          "Validate their opening statement to maintain trust.",
          "State your target boundaries clearly without immediate concession."
        ],
        suggestedResponse: "Thank you for sharing your concerns. I agree operational alignment is crucial. Let's establish our user license tier targets first."
      }
    });
  },
  
  submitPracticeMessage: (content) => {
    const activePractice = get().practice;
    const opponent = get().configuredAgents[1] || get().selectedScenario?.defaultAgents[1];
    if (!opponent || activePractice.status !== 'running') return;
    
    const userMsg: Message = {
      id: `practice-msg-${activePractice.messages.length}`,
      sender: 'You',
      role: 'Participant',
      avatar: 'U',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      round: activePractice.round,
      isUser: true
    };
    
    const newMessages = [...activePractice.messages, userMsg];
    
    set((state) => ({
      practice: {
        ...state.practice,
        messages: newMessages,
        performance: {
          concessionControl: Math.min(100, state.practice.performance.concessionControl + Math.floor(Math.random() * 8) - 2),
          argumentStrength: Math.min(100, state.practice.performance.argumentStrength + Math.floor(Math.random() * 12) + 2),
          activeListening: Math.min(100, state.practice.performance.activeListening + Math.floor(Math.random() * 15) + 3),
          dealProgress: Math.min(100, state.practice.performance.dealProgress + Math.floor(Math.random() * 12) + 5)
        }
      }
    }));
    
    // Simulate AI response after short delay
    setTimeout(() => {
      const updatedPractice = get().practice;
      const responseIndex = updatedPractice.messages.length;
      
      const aiReplyTexts = [
        `I appreciate your suggestion. That makes sense from an operational perspective, but we have hard guidelines around cost compliance. If we accept this rate, we would need to look at extending the lease duration to 3 years to spread out capital expenditures.`,
        `That is a fair point. However, to bridge the remaining gap, we must discuss support response guarantees. If we include Gold support, would you be willing to adapt the billing schedules to quarterly upfront payments?`,
        `Based on these details, I think we are very close to an agreement. If you can compromise on the payment schedule terms, we can sign the terms sheet today and begin onboarding.`
      ];
      
      const newRound = updatedPractice.round + 1;
      
      let finalStatus = updatedPractice.status;
      if (newRound >= 4) {
        finalStatus = 'finished';
      }
      
      const aiReplyText = aiReplyTexts[(newRound - 2) % aiReplyTexts.length];
      
      const aiMsg: Message = {
        id: `practice-msg-${responseIndex}`,
        sender: opponent.name,
        role: opponent.role,
        avatar: opponent.avatar,
        content: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        round: newRound
      };
      
      const nextTips = [
        "Acknowledge the lease duration offer to show cooperation.",
        "Propose a Net-30 compromise to offset the billing schedules request."
      ];
      
      const nextSuggestions = [
        "I understand your constraint on costs. Let's look at the 3-year term if we can lock in the discounted support package.",
        "We can agree to Net-30 payment terms if the installation costs are fully waived.",
        "Excellent. Let's write the agreement document based on $58/user and standard support terms."
      ];
      
      set((state) => ({
        practice: {
          ...state.practice,
          round: newRound,
          status: finalStatus,
          messages: [...state.practice.messages, aiMsg],
          tips: nextTips,
          suggestedResponse: nextSuggestions[(newRound - 2) % nextSuggestions.length],
          performance: {
            concessionControl: Math.min(95, state.practice.performance.concessionControl + Math.floor(Math.random() * 5)),
            argumentStrength: Math.min(95, state.practice.performance.argumentStrength + Math.floor(Math.random() * 6)),
            activeListening: Math.min(95, state.practice.performance.activeListening + Math.floor(Math.random() * 5)),
            dealProgress: finalStatus === 'finished' ? 100 : Math.min(95, state.practice.performance.dealProgress + 15)
          }
        }
      }));

      if (finalStatus === 'finished') {
        get().createReportFromCurrent('Agreement Reached');
      }
    }, 1500);
  },
  
  resetPractice: () => {
    set({
      practice: {
        messages: [],
        status: 'idle',
        round: 0,
        performance: {
          concessionControl: 50,
          argumentStrength: 45,
          activeListening: 40,
          dealProgress: 10
        },
        tips: [],
        suggestedResponse: ''
      }
    });
  },
  
  // Settings actions
  updateSettings: (updates) => set((state) => ({
    settings: { ...state.settings, ...updates }
  })),
  
  // Support actions
  submitTicket: (subject, category) => set((state) => ({
    supportTickets: [
      ...state.supportTickets,
      {
        id: `ticket-${Date.now()}`,
        subject,
        category,
        status: 'Open',
        date: new Date().toISOString().split('T')[0]
      }
    ]
  })),

  // Report actions
  setSelectedReportId: (id) => set({ selectedReportId: id }),

  createReportFromCurrent: (outcome) => {
    const reportId = `report-${Date.now()}`;
    const selectedScenario = get().selectedScenario;
    const configuredAgents = get().configuredAgents;
    const selectedMode = get().selectedMode;
    const isPractice = selectedMode === 'human-ai';
    const messages = isPractice ? get().practice.messages : get().simulation.messages;
    const rounds = isPractice ? get().practice.round : get().simulation.round;
    const metrics = isPractice ? get().practice.performance : {
      concessionControl: 90,
      argumentStrength: 85,
      activeListening: 78,
      dealProgress: outcome === 'Agreement Reached' ? 100 : 30,
    };
    
    // Calculate final terms depending on scenario
    let finalTerms = {};
    if (selectedScenario?.id === 'vendor-pricing') {
      const vendor = configuredAgents.find(a => a.id.includes('seller') || a.role.toLowerCase().includes('sales') || a.role.toLowerCase().includes('vendor')) || configuredAgents[1];
      const buyer = configuredAgents.find(a => a.id.includes('buyer') || a.role.toLowerCase().includes('procurement')) || configuredAgents[0];
      finalTerms = {
        price: outcome === 'Agreement Reached' ? '$58/user/month' : 'No agreement',
        delivery: vendor?.deliveryRequirement || '30 days',
        paymentTerms: buyer?.paymentTerms || 'Net 30',
        warranty: vendor?.warrantySupport || '1 year'
      };
    } else if (selectedScenario?.id === 'job-offer') {
      const recruiter = configuredAgents.find(a => a.id.includes('recruiter') || a.role.toLowerCase().includes('hr')) || configuredAgents[0];
      const candidate = configuredAgents.find(a => a.id.includes('candidate')) || configuredAgents[1];
      finalTerms = {
        salary: outcome === 'Agreement Reached' ? '$160,000' : 'No agreement',
        equity: candidate?.equityExpectation || '11,000 options',
        remoteDays: recruiter?.remotePreference || '3 days in-office'
      };
    } else if (selectedScenario?.id === 'budget-allocation') {
      finalTerms = {
        allocation: outcome === 'Agreement Reached' ? '$530,000 R&D, $370,000 Marketing, $100,000 Buffer' : 'No agreement'
      };
    }

    const report: StoredReport = {
      id: reportId,
      scenarioId: selectedScenario?.id || 'vendor-pricing',
      scenarioTitle: selectedScenario?.title || 'Vendor Pricing Negotiation',
      mode: selectedMode || 'ai-ai',
      dateTime: new Date().toLocaleString(),
      outcome,
      agents: JSON.parse(JSON.stringify(configuredAgents)),
      messages: JSON.parse(JSON.stringify(messages)),
      roundsCompleted: rounds,
      finalTerms,
      metrics,
      summary: selectedScenario?.id === 'vendor-pricing'
        ? 'The negotiation reached a strong commercial position at $58/user/month with a 30-day delivery timeline, 1-year warranty and Net-30 payment terms. Both agents moved from their initial positions while protecting their most important constraints.'
        : selectedScenario?.id === 'job-offer'
          ? 'The candidate and recruiter agreed to a base salary of $160,000, 11,000 stock options, and 3 days in-office weekly with a review to reduce to 2 days after 6 months.'
          : 'Stakeholders resolved the allocation of the Corporate Innovation Fund at $530k for Engineering/R&D development, $370k for Commercial Launch/Marketing campaigns, and $100k emergency financial buffer.',
      recommendations: 'Continue practicing with aggressive personalities to refine concession timing and control price anchor limits.'
    };

    set((state) => ({
      reports: [report, ...state.reports],
      selectedReportId: reportId
    }));

    return reportId;
  },
}),
  {
    name: 'multi_agent_negotiation_store',
  }
)
);
