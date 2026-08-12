import { OutcomeReport, AccountAnalytics } from '../types/report';

export const MOCK_OUTCOME_REPORTS: Record<string, OutcomeReport> = {
  'sim-10492': {
    sessionId: 'sim-10492',
    scenarioId: 'vendor-pricing-negotiation',
    scenarioName: 'Vendor Pricing Negotiation',
    mode: 'simulation',
    status: 'completed',
    roundsElapsed: 4,
    maxRounds: 10,
    duration: '4m 12s',
    createdAt: '2026-08-10 14:32',
    agreementSummary: 'Buyer Agent and Vendor Agent successfully converged upon mutually beneficial terms within round 4, staying well within both budget and margin boundaries.',
    finalTerms: [
      { label: 'Annual Contract Value', value: '$46,000 / year' },
      { label: 'Service Level Agreement', value: 'Tier-1 99.9% Uptime SLA' },
      { label: 'Payment Terms', value: 'Net 30 with Annual Prepayment' },
      { label: 'Onboarding Services', value: 'Included Dedicated Onboarding' },
      { label: 'Contract Term', value: '12 Months with Renewal Option' },
    ],
    concessionHistory: [
      { round: 1, 'Vendor Agent': 50000, 'Buyer Agent': 40000 },
      { round: 2, 'Vendor Agent': 47500, 'Buyer Agent': 43000 },
      { round: 3, 'Vendor Agent': 46000, 'Buyer Agent': 45500 },
      { round: 4, 'Vendor Agent': 46000, 'Buyer Agent': 46000 },
    ],
    agentPerformance: [
      {
        agentId: 'vendor-agent',
        agentName: 'Vendor Agent',
        role: 'Seller',
        personality: 'Collaborative',
        objectiveSatisfaction: 88,
        concessionControl: 82,
        finalPosition: '$46,000 ($4,000 above margin floor)',
      },
      {
        agentId: 'buyer-agent',
        agentName: 'Buyer Agent',
        role: 'Buyer',
        personality: 'Collaborative',
        objectiveSatisfaction: 92,
        concessionControl: 85,
        finalPosition: '$46,000 ($2,000 below budget cap)',
      }
    ],
    keyInsights: [
      'Both agents utilized value-linked trades rather than pure price cuts, unlocking mutual value through onboarding inclusion.',
      'Buyer Agent anchored low at $40,000, successfully shifting the final deal price closer to the lower half of the negotiation envelope.',
      'Vendor Agent preserved high margin compliance by securing annual prepayment in exchange for the final $1,500 concession.',
      'Zero deadlock events encountered; agreement was reached 6 rounds ahead of the 10-round ceiling.'
    ]
  },
  'sim-10381': {
    sessionId: 'sim-10381',
    scenarioId: 'project-budget-allocation',
    scenarioName: 'Project Budget Allocation',
    mode: 'simulation',
    status: 'deadlock',
    roundsElapsed: 12,
    maxRounds: 12,
    duration: '8m 20s',
    createdAt: '2026-08-08 11:15',
    agreementSummary: 'Negotiation reached maximum round limit in deadlock due to conflicting aggressive strategies between Technical Delivery and Department Head allocations.',
    finalTerms: [
      { label: 'Negotiation Status', value: 'Deadlocked at Round 12' },
      { label: 'Delivery Ask', value: '$225,000' },
      { label: 'Operations Ask', value: '$185,000' },
      { label: 'Total Requested', value: '$530,000 ($30,000 over cap)' },
      { label: 'Recommended Action', value: 'Escalation to Executive Steering Committee' },
    ],
    concessionHistory: [
      { round: 1, 'Project Manager': 240000, 'Dept Head': 195000, 'Finance Manager': 500000 },
      { round: 3, 'Project Manager': 235000, 'Dept Head': 190000, 'Finance Manager': 500000 },
      { round: 6, 'Project Manager': 230000, 'Dept Head': 188000, 'Finance Manager': 500000 },
      { round: 9, 'Project Manager': 228000, 'Dept Head': 185000, 'Finance Manager': 500000 },
      { round: 12, 'Project Manager': 225000, 'Dept Head': 185000, 'Finance Manager': 500000 },
    ],
    agentPerformance: [
      {
        agentId: 'pm-agent',
        agentName: 'Project Manager Agent',
        role: 'Project Delivery',
        personality: 'Aggressive',
        objectiveSatisfaction: 45,
        concessionControl: 90,
        finalPosition: '$225,000 ask ($15k concession total)',
      },
      {
        agentId: 'dept-head-agent',
        agentName: 'Department Head Agent',
        role: 'Business Operations',
        personality: 'Aggressive',
        objectiveSatisfaction: 40,
        concessionControl: 92,
        finalPosition: '$185,000 ask ($10k concession total)',
      },
      {
        agentId: 'finance-agent',
        agentName: 'Finance Manager Agent',
        role: 'Fiscal Governance',
        personality: 'Risk-Averse',
        objectiveSatisfaction: 60,
        concessionControl: 100,
        finalPosition: 'Refused variance over $500k pool',
      }
    ],
    keyInsights: [
      'Aggressive vs Aggressive persona pairings resulted in severe concession friction and minimal willingness to reframe scope.',
      'Finance Manager Agent adhered strictly to the hard $500k ceiling, preventing an unbacked compromise.',
      'Reframing proposal was triggered at Round 7 but insufficient concessions were made by both delivery and operational heads.',
      'Recommendation: Run with Collaborative persona on at least one party to evaluate trade-off flexibility.'
    ]
  }
};

export const MOCK_ACCOUNT_ANALYTICS: AccountAnalytics = {
  totalSimulations: 48,
  winRate: 83.3,
  averageAgreement: 88.5,
  averageDuration: '4m 38s',
  agreementTrend: [
    { date: 'Aug 01', rate: 75, count: 5 },
    { date: 'Aug 03', rate: 80, count: 8 },
    { date: 'Aug 05', rate: 85, count: 10 },
    { date: 'Aug 07', rate: 82, count: 7 },
    { date: 'Aug 09', rate: 90, count: 11 },
    { date: 'Aug 11', rate: 88, count: 7 },
  ],
  outcomesBreakdown: [
    { name: 'Agreement Reached', value: 40, color: '#2563eb' },
    { name: 'Deadlocked', value: 5, color: '#f59e0b' },
    { name: 'Ended by User', value: 3, color: '#94a3b8' },
  ],
  performanceByAgent: [
    {
      agentName: 'Buyer Agent',
      role: 'Procurement Buyer',
      totalSessions: 22,
      avgSatisfaction: 87.4,
      avgConcessionControl: 81.2,
    },
    {
      agentName: 'Vendor Agent',
      role: 'Enterprise Seller',
      totalSessions: 22,
      avgSatisfaction: 84.8,
      avgConcessionControl: 79.5,
    },
    {
      agentName: 'Recruiter Agent',
      role: 'Talent Acquisition',
      totalSessions: 16,
      avgSatisfaction: 89.2,
      avgConcessionControl: 85.0,
    },
    {
      agentName: 'Candidate Agent',
      role: 'Job Candidate',
      totalSessions: 16,
      avgSatisfaction: 86.5,
      avgConcessionControl: 83.1,
    },
    {
      agentName: 'Project Manager Agent',
      role: 'Project Delivery',
      totalSessions: 10,
      avgSatisfaction: 78.3,
      avgConcessionControl: 76.0,
    },
    {
      agentName: 'Finance Manager Agent',
      role: 'Fiscal Governance',
      totalSessions: 10,
      avgSatisfaction: 91.0,
      avgConcessionControl: 94.2,
    },
    {
      agentName: 'Department Head Agent',
      role: 'Business Operations',
      totalSessions: 10,
      avgSatisfaction: 79.1,
      avgConcessionControl: 74.8,
    },
  ],
  scenarioPerformance: [
    {
      scenarioName: 'Vendor Pricing Negotiation',
      count: 22,
      agreementRate: 90.9,
      avgRounds: 6.8,
    },
    {
      scenarioName: 'Job Offer Negotiation',
      count: 16,
      agreementRate: 87.5,
      avgRounds: 5.4,
    },
    {
      scenarioName: 'Project Budget Allocation',
      count: 10,
      agreementRate: 70.0,
      avgRounds: 10.2,
    },
  ],
  keyInsights: [
    'Collaborative agent pairings achieve a 94.2% agreement rate with an average resolution speed of 5.1 rounds.',
    'Risk-Averse finance agents prevent budget overruns with 100% adherence to defined ceiling constraints.',
    'Multi-party scenarios (Project Budget Allocation) experience 2.4x higher deadlock probability when more than one agent is Aggressive.',
    'Opening anchor deviation within ±15% of the target zone correlates with 28% higher final joint satisfaction.'
  ],
  strengths: [
    'Strong anchor discipline: Initial proposals effectively establish favorable negotiation zones.',
    'Multi-variable trading: High usage of non-monetary terms (onboarding, PTO, payment cycles) to resolve price impasses.',
    'High constraint preservation: 0% instances of constraint violation across all simulated rounds.'
  ],
  areasToImprove: [
    'Staggered concessions: In Aggressive pairings, counteroffers tend to stall prematurely in rounds 4–6.',
    'Early reframing: Triggering integrative reframing earlier in 3-party negotiations reduces deadlock risk by ~35%.',
    'Practice mode pacing: Human participants tend to make larger initial concessions than required by the AI counter-position.'
  ]
};
