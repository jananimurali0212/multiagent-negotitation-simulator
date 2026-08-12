import { NegotiationMessage, NegotiationTelemetry, DeadlockState, AgreementState } from '../types/negotiation';

export interface RecentNegotiationItem {
  id: string;
  scenarioId: string;
  scenarioName: string;
  mode: 'simulation' | 'practice';
  date: string;
  status: 'Completed' | 'In Progress' | 'Deadlocked';
  duration: string;
  rounds: number;
  finalOutcome: string;
}

export const RECENT_NEGOTIATIONS: RecentNegotiationItem[] = [
  {
    id: 'sim-10492',
    scenarioId: 'vendor-pricing-negotiation',
    scenarioName: 'Vendor Pricing Negotiation',
    mode: 'simulation',
    date: '2026-08-10',
    status: 'Completed',
    duration: '4m 12s',
    rounds: 7,
    finalOutcome: 'Agreed at $46,500/yr with Tier-1 SLA',
  },
  {
    id: 'prac-20194',
    scenarioId: 'job Offer Negotiation',
    scenarioName: 'Job Offer Negotiation',
    mode: 'practice',
    date: '2026-08-09',
    status: 'Completed',
    duration: '6m 45s',
    rounds: 9,
    finalOutcome: 'Agreed at $156,000 base + 2 hybrid days',
  },
  {
    id: 'sim-10381',
    scenarioId: 'project-budget-allocation',
    scenarioName: 'Project Budget Allocation',
    mode: 'simulation',
    date: '2026-08-08',
    status: 'Deadlocked',
    duration: '8m 20s',
    rounds: 12,
    finalOutcome: 'Deadlock on $30k unallocated gap',
  },
  {
    id: 'sim-10255',
    scenarioId: 'vendor-pricing-negotiation',
    scenarioName: 'Vendor Pricing Negotiation',
    mode: 'simulation',
    date: '2026-08-07',
    status: 'Completed',
    duration: '3m 50s',
    rounds: 6,
    finalOutcome: 'Agreed at $44,000/yr Net 30',
  },
  {
    id: 'prac-19942',
    scenarioId: 'vendor-pricing-negotiation',
    scenarioName: 'Vendor Pricing Negotiation',
    mode: 'practice',
    date: '2026-08-05',
    status: 'In Progress',
    duration: '2m 10s',
    rounds: 4,
    finalOutcome: 'Active round 4 offer pending',
  }
];

// Pre-scripted scripted simulation dialogues for each scenario to fuel the mock WebSocket simulator smoothly
export interface ScriptedTurn {
  round: number;
  agentId: string;
  agentName: string;
  agentRole: string;
  content: string;
  offerValue: string;
  offerType: 'offer' | 'counteroffer' | 'concession' | 'final';
  numericValue: number;
  decisionSummary: string;
  agreementLikelihood: number;
  offerGap: string;
  isDeadlockTrigger?: boolean;
  isAgreementTrigger?: boolean;
}

export const SCRIPTED_SIMULATIONS: Record<string, ScriptedTurn[]> = {
  'vendor-pricing-negotiation': [
    {
      round: 1,
      agentId: 'buyer-agent',
      agentName: 'Buyer Agent',
      agentRole: 'Buyer',
      content: 'Hello. We are reviewing software vendor solutions for our team of 120 engineers. Given our annual fiscal constraints, we can open with an offer of $40,000 annually for the enterprise package including standard SLA.',
      offerValue: '$40,000',
      offerType: 'offer',
      numericValue: 40000,
      decisionSummary: 'Anchored conservative opening offer aligned with lower bound target.',
      agreementLikelihood: 35,
      offerGap: '$12,000'
    },
    {
      round: 1,
      agentId: 'vendor-agent',
      agentName: 'Vendor Agent',
      agentRole: 'Seller',
      content: 'Thank you for reaching out. Our list price for 120 enterprise seats with 24/7 dedicated support is $52,000. At $40,000, we would be unable to provide the dedicated onboarding and Tier-1 response times you require. We can propose $50,000.',
      offerValue: '$50,000',
      offerType: 'counteroffer',
      numericValue: 50000,
      decisionSummary: 'Defended value proposition and made a cautious $2,000 concession.',
      agreementLikelihood: 45,
      offerGap: '$10,000'
    },
    {
      round: 2,
      agentId: 'buyer-agent',
      agentName: 'Buyer Agent',
      agentRole: 'Buyer',
      content: 'We recognize the value of your Tier-1 response times. However, $50,000 exceeds our current budget approval for this quarter. If you can include free onboarding and Net 45 payment terms, we can increase our offer to $43,000.',
      offerValue: '$43,000',
      offerType: 'counteroffer',
      numericValue: 43000,
      decisionSummary: 'Increased offer by $3,000 conditioned on onboarding and payment flexibility.',
      agreementLikelihood: 58,
      offerGap: '$7,000'
    },
    {
      round: 2,
      agentId: 'vendor-agent',
      agentName: 'Vendor Agent',
      agentRole: 'Seller',
      content: 'We appreciate the movement on price. While Net 45 is acceptable, onboarding requires engineering resource dedication. If we commit to standard Net 30 with 2 quarterly business reviews, we can meet you at $47,500.',
      offerValue: '$47,500',
      offerType: 'counteroffer',
      numericValue: 47500,
      decisionSummary: 'Conceded $2,500 while defending standard payment velocity.',
      agreementLikelihood: 70,
      offerGap: '$4,500'
    },
    {
      round: 3,
      agentId: 'buyer-agent',
      agentName: 'Buyer Agent',
      agentRole: 'Buyer',
      content: 'We are converging towards common ground. Our director has authorized a ceiling of $45,500 if we execute the agreement before the end of the month.',
      offerValue: '$45,500',
      offerType: 'concession',
      numericValue: 45500,
      decisionSummary: 'Advanced to target ceiling threshold with time-bound commitment.',
      agreementLikelihood: 84,
      offerGap: '$2,000'
    },
    {
      round: 3,
      agentId: 'vendor-agent',
      agentName: 'Vendor Agent',
      agentRole: 'Seller',
      content: 'To finalize this partnership today within your timeframe, we are willing to accept $46,000 with annual prepayment and full 99.9% SLA coverage.',
      offerValue: '$46,000',
      offerType: 'final',
      numericValue: 46000,
      decisionSummary: 'Offered final bridging concession within acceptable margin envelope.',
      agreementLikelihood: 95,
      offerGap: '$500'
    },
    {
      round: 4,
      agentId: 'buyer-agent',
      agentName: 'Buyer Agent',
      agentRole: 'Buyer',
      content: 'We accept the terms at $46,000 annually with 99.9% SLA and standard onboarding. We have a deal.',
      offerValue: '$46,000',
      offerType: 'final',
      numericValue: 46000,
      decisionSummary: 'Confirmed agreement terms satisfying both budgetary and SLA constraints.',
      agreementLikelihood: 100,
      offerGap: '$0',
      isAgreementTrigger: true
    }
  ],

  'job-offer-negotiation': [
    {
      round: 1,
      agentId: 'recruiter-agent',
      agentName: 'Recruiter Agent',
      agentRole: 'Recruiter',
      content: 'We were very impressed by your interviews and would love to extend an offer for Senior AI Engineer: $142,000 base salary, standard health benefits, and 15 days PTO.',
      offerValue: '$142,000',
      offerType: 'offer',
      numericValue: 142000,
      decisionSummary: 'Established initial baseline offer within standard tier.',
      agreementLikelihood: 40,
      offerGap: '$23,000'
    },
    {
      round: 1,
      agentId: 'candidate-agent',
      agentName: 'Candidate Agent',
      agentRole: 'Candidate',
      content: 'Thank you for the offer. I am genuinely excited about the role and the technical roadmap. Based on my previous experience and another pending offer, I was targeting $165,000 base and hybrid flexibility.',
      offerValue: '$165,000',
      offerType: 'counteroffer',
      numericValue: 165000,
      decisionSummary: 'Anchored market expectation with competing offer leverage.',
      agreementLikelihood: 48,
      offerGap: '$23,000'
    },
    {
      round: 2,
      agentId: 'recruiter-agent',
      agentName: 'Recruiter Agent',
      agentRole: 'Recruiter',
      content: 'We understand your value. Our salary band for this grade has a strict upper limit, but we can adjust our base offer to $150,000 and include a $10,000 one-time signing bonus.',
      offerValue: '$150,000',
      offerType: 'concession',
      numericValue: 150000,
      decisionSummary: 'Introduced signing bonus to bridge base salary cap without breaching grade parity.',
      agreementLikelihood: 68,
      offerGap: '$15,000'
    },
    {
      round: 2,
      agentId: 'candidate-agent',
      agentName: 'Candidate Agent',
      agentRole: 'Candidate',
      content: 'The signing bonus is appreciated. If we can set the base salary at $156,000 with 2 days per week remote work, I would be ready to sign immediately.',
      offerValue: '$156,000',
      offerType: 'counteroffer',
      numericValue: 156000,
      decisionSummary: 'Conceded $9,000 from opening target while securing hybrid flexibility.',
      agreementLikelihood: 85,
      offerGap: '$6,000'
    },
    {
      round: 3,
      agentId: 'recruiter-agent',
      agentName: 'Recruiter Agent',
      agentRole: 'Recruiter',
      content: 'We obtained special VP approval: $155,000 base salary, $10,000 signing bonus, and 2 days hybrid schedule. We look forward to welcoming you.',
      offerValue: '$155,000',
      offerType: 'final',
      numericValue: 155000,
      decisionSummary: 'Secured executive sign-off for mutually beneficial compensation package.',
      agreementLikelihood: 98,
      offerGap: '$1,000'
    },
    {
      round: 3,
      agentId: 'candidate-agent',
      agentName: 'Candidate Agent',
      agentRole: 'Candidate',
      content: 'This aligns with my goals. I enthusiastically accept the offer!',
      offerValue: '$155,000',
      offerType: 'final',
      numericValue: 155000,
      decisionSummary: 'Accepted comprehensive offer package.',
      agreementLikelihood: 100,
      offerGap: '$0',
      isAgreementTrigger: true
    }
  ],

  'project-budget-allocation': [
    {
      round: 1,
      agentId: 'pm-agent',
      agentName: 'Project Manager Agent',
      agentRole: 'Project Delivery',
      content: 'To complete the cross-platform overhaul on schedule, technical delivery requires $230,000 for cloud infrastructure and contract engineering.',
      offerValue: '$230,000 (Delivery)',
      offerType: 'offer',
      numericValue: 230000,
      decisionSummary: 'Requested comprehensive delivery budget including contingency.',
      agreementLikelihood: 35,
      offerGap: '$60,000'
    },
    {
      round: 1,
      agentId: 'dept-head-agent',
      agentName: 'Department Head Agent',
      agentRole: 'Business Operations',
      content: 'Business Operations must allocate $190,000 to maintain current customer support headcount and sales enablement during the rollout.',
      offerValue: '$190,000 (Operations)',
      offerType: 'offer',
      numericValue: 190000,
      decisionSummary: 'Asserted high operational staffing requirement.',
      agreementLikelihood: 30,
      offerGap: '$80,000'
    },
    {
      round: 1,
      agentId: 'finance-agent',
      agentName: 'Finance Manager Agent',
      agentRole: 'Fiscal Governance',
      content: 'Our total approved fiscal pool is strictly $500,000. Current requests ($230k + $190k + $120k reserve) sum to $540,000, creating an impermissible $40,000 deficit.',
      offerValue: '$500,000 Max Cap',
      offerType: 'counteroffer',
      numericValue: 500000,
      decisionSummary: 'Enforced hard $500k ceiling constraint.',
      agreementLikelihood: 42,
      offerGap: '$40,000'
    },
    {
      round: 2,
      agentId: 'pm-agent',
      agentName: 'Project Manager Agent',
      agentRole: 'Project Delivery',
      content: 'We can optimize cloud instance reservations to reduce delivery to $210,000, but cannot drop further without dropping critical scope.',
      offerValue: '$210,000 (Delivery)',
      offerType: 'concession',
      numericValue: 210000,
      decisionSummary: 'Conceded $20,000 through cloud infrastructure optimization.',
      agreementLikelihood: 60,
      offerGap: '$20,000'
    },
    {
      round: 2,
      agentId: 'dept-head-agent',
      agentName: 'Department Head Agent',
      agentRole: 'Business Operations',
      content: 'Operations will absorb $15,000 by phasing contractor hiring, bringing our ask to $175,000.',
      offerValue: '$175,000 (Operations)',
      offerType: 'concession',
      numericValue: 175000,
      decisionSummary: 'Conceded $15,000 by staggering contractor start dates.',
      agreementLikelihood: 80,
      offerGap: '$5,000'
    },
    {
      round: 3,
      agentId: 'finance-agent',
      agentName: 'Finance Manager Agent',
      agentRole: 'Fiscal Governance',
      content: 'With Delivery at $210,000, Operations at $175,000, and $115,000 retained for contingency, the sum equals exactly $500,000. All constraints satisfied.',
      offerValue: 'Balanced $500,000',
      offerType: 'final',
      numericValue: 500000,
      decisionSummary: 'Validated complete compliance with zero-variance fiscal policy.',
      agreementLikelihood: 100,
      offerGap: '$0',
      isAgreementTrigger: true
    }
  ]
};
