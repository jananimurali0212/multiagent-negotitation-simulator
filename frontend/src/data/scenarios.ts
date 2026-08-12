import { NegotiationScenario } from '../types/scenario';

export const OFFICIAL_SCENARIOS: NegotiationScenario[] = [
  {
    id: 'vendor-pricing-negotiation',
    name: 'Vendor Pricing Negotiation',
    description: 'Procurement negotiation between an enterprise buyer and vendor over software licenses and SLA commitments.',
    purpose: 'Procurement negotiation between a buyer and vendor over product or service pricing.',
    participants: ['Vendor Agent', 'Buyer Agent'],
    objective: 'Reach a mutually agreeable annual contract value and SLA tier within enterprise budget guidelines.',
    keyConstraint: 'Vendor has a strict margin floor; Buyer cannot exceed authorized fiscal year budget.',
    estimatedDuration: '8-12 rounds (~5 mins)',
    expectedOutcome: 'Mutually agreed price and terms or documented deadlock.',
    defaultMaxRounds: 10,
    numericScale: {
      min: 35000,
      max: 60000,
      step: 1000,
      unit: '$',
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    agents: [
      {
        id: 'vendor-agent',
        name: 'Vendor Agent',
        role: 'Seller',
        personality: 'Collaborative',
        avatarBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        avatarText: 'VA',
        position: '$52,000 / year with Tier-1 SLA',
        currentOffer: '$52,000',
        status: 'waiting',
        goal: [
          {
            id: 'vg-1',
            description: 'Maximize the sale price and protect profit margin.',
            priority: 'High',
            targetValue: '$50,000+ per year',
          },
          {
            id: 'vg-2',
            description: 'Secure multi-year commitment or premium support tier.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'vc-1',
            description: 'Will not accept a price below minimum acceptable margin floor.',
            value: 'Scenario-defined limit ($42,000 floor)',
          },
          {
            id: 'vc-2',
            description: 'Requires standard payment terms (Net 30).',
            value: 'Scenario-defined limit',
          }
        ]
      },
      {
        id: 'buyer-agent',
        name: 'Buyer Agent',
        role: 'Buyer',
        personality: 'Collaborative',
        avatarBg: 'bg-blue-50 text-blue-700 border-blue-200',
        avatarText: 'BA',
        position: '$40,000 / year target',
        currentOffer: '$40,000',
        status: 'waiting',
        goal: [
          {
            id: 'bg-1',
            description: 'Minimize cost while meeting quality and delivery requirements.',
            priority: 'High',
            targetValue: '$44,000 or lower',
          },
          {
            id: 'bg-2',
            description: 'Ensure 99.9% uptime SLA and dedicated onboarding support.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'bc-1',
            description: 'Maximum approved budget allocated for this procurement cycle.',
            value: 'Scenario-defined limit ($48,000 ceiling)',
          },
          {
            id: 'bc-2',
            description: 'Deployment must be completed within Q3 fiscal timeline.',
            value: 'Scenario-defined limit',
          }
        ]
      }
    ]
  },
  {
    id: 'job-offer-negotiation',
    name: 'Job Offer Negotiation',
    description: 'High-stakes compensation and role alignment dialogue between corporate recruiter and prospective lead candidate.',
    purpose: 'Salary and benefits negotiation.',
    participants: ['Recruiter Agent', 'Candidate Agent'],
    objective: 'Align total compensation, signing incentive, remote flexibility, and start date.',
    keyConstraint: 'Recruiter is bound by internal leveling pay equity; Candidate has competing baseline.',
    estimatedDuration: '6-10 rounds (~4 mins)',
    expectedOutcome: 'Agreed salary, benefits and joining date or documented deadlock.',
    defaultMaxRounds: 10,
    numericScale: {
      min: 130000,
      max: 180000,
      step: 2500,
      unit: '$',
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    agents: [
      {
        id: 'recruiter-agent',
        name: 'Recruiter Agent',
        role: 'Recruiter',
        personality: 'Collaborative',
        avatarBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        avatarText: 'RA',
        position: '$145,000 base + standard equity',
        currentOffer: '$145,000',
        status: 'waiting',
        goal: [
          {
            id: 'rg-1',
            description: 'Close the hire within approved budget and company policy.',
            priority: 'High',
            targetValue: '$150,000 max base',
          },
          {
            id: 'rg-2',
            description: 'Secure candidate acceptance within 14 business days.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'rc-1',
            description: 'Maximum approved salary band for this seniority level.',
            value: 'Scenario-defined limit ($160,000 band cap)',
          },
          {
            id: 'rc-2',
            description: 'Must comply with standard company equity vesting schedule.',
            value: 'Scenario-defined limit',
          }
        ]
      },
      {
        id: 'candidate-agent',
        name: 'Candidate Agent',
        role: 'Candidate',
        personality: 'Collaborative',
        avatarBg: 'bg-purple-50 text-purple-700 border-purple-200',
        avatarText: 'CA',
        position: '$165,000 base + signing bonus',
        currentOffer: '$165,000',
        status: 'waiting',
        goal: [
          {
            id: 'cg-1',
            description: 'Maximize salary, benefits and favorable role terms.',
            priority: 'High',
            targetValue: '$160,000+ base target',
          },
          {
            id: 'cg-2',
            description: 'Obtain 2 days/week hybrid schedule and professional development stipend.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'cc-1',
            description: 'Minimum acceptable offer threshold based on current compensation.',
            value: 'Scenario-defined limit ($148,000 baseline)',
          },
          {
            id: 'cc-2',
            description: 'Notice period requires at least 30 days before start date.',
            value: 'Scenario-defined limit',
          }
        ]
      }
    ]
  },
  {
    id: 'project-budget-allocation',
    name: 'Project Budget Allocation',
    description: 'Multi-stakeholder resource allocation negotiation among engineering, finance, and product leadership.',
    purpose: 'Multi-stakeholder negotiation over splitting a fixed project budget.',
    participants: ['Project Manager Agent', 'Finance Manager Agent', 'Department Head Agent'],
    objective: 'Distribute a fixed $500,000 strategic initiatives budget across competing departmental demands.',
    keyConstraint: 'Total allocation cannot exceed 100% of the fixed budget pool; all core streams require minimum viability.',
    estimatedDuration: '10-14 rounds (~6 mins)',
    expectedOutcome: 'Agreed budget split or documented deadlock requiring escalation.',
    defaultMaxRounds: 12,
    numericScale: {
      min: 100000,
      max: 300000,
      step: 10000,
      unit: '$',
      format: (val: number) => `$${val.toLocaleString()}`,
    },
    agents: [
      {
        id: 'pm-agent',
        name: 'Project Manager Agent',
        role: 'Project Delivery',
        personality: 'Collaborative',
        avatarBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        avatarText: 'PM',
        position: '$220k technical delivery request',
        currentOffer: '$220,000',
        status: 'waiting',
        goal: [
          {
            id: 'pmg-1',
            description: 'Secure sufficient budget to deliver project scope and infrastructure.',
            priority: 'High',
            targetValue: '$200k+ allocation',
          },
          {
            id: 'pmg-2',
            description: 'Retain a 10% contingency buffer for scope changes.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'pmc-1',
            description: 'Minimum required allocation to prevent project failure.',
            value: 'Scenario-defined limit ($160k critical minimum)',
          }
        ]
      },
      {
        id: 'finance-agent',
        name: 'Finance Manager Agent',
        role: 'Fiscal Governance',
        personality: 'Risk-Averse',
        avatarBg: 'bg-amber-50 text-amber-700 border-amber-200',
        avatarText: 'FM',
        position: '$500,000 hard ceiling cap',
        currentOffer: '$500,000 cap',
        status: 'waiting',
        goal: [
          {
            id: 'fmg-1',
            description: 'Keep total allocations within the approved overall budget.',
            priority: 'High',
            targetValue: 'Total exactly $500k',
          },
          {
            id: 'fmg-2',
            description: 'Prioritize measurable ROI initiatives and audited cost lines.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'fmc-1',
            description: 'Total budget is strictly fixed with zero fiscal variance allowed.',
            value: 'Scenario-defined limit ($500k max total)',
          }
        ]
      },
      {
        id: 'dept-head-agent',
        name: 'Department Head Agent',
        role: 'Business Operations',
        personality: 'Aggressive',
        avatarBg: 'bg-rose-50 text-rose-700 border-rose-200',
        avatarText: 'DH',
        position: '$180k departmental staffing request',
        currentOffer: '$180,000',
        status: 'waiting',
        goal: [
          {
            id: 'dhg-1',
            description: 'Secure sufficient budget for departmental priorities and staffing.',
            priority: 'High',
            targetValue: '$160k+ allocation',
          },
          {
            id: 'dhg-2',
            description: 'Maintain cross-functional team headcount for upcoming quarters.',
            priority: 'Medium',
          }
        ],
        constraints: [
          {
            id: 'dhc-1',
            description: 'Each department has a minimum required allocation to operate.',
            value: 'Scenario-defined limit ($120k operational floor)',
          }
        ]
      }
    ]
  }
];
