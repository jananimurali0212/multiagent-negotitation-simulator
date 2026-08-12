import { NegotiationAgent } from './negotiation';

export interface ScenarioNumericScale {
  min: number;
  max: number;
  unit: string;
  step: number;
  format: (val: number) => string;
}

export interface NegotiationScenario {
  id: string;
  name: string;
  description: string;
  purpose: string;
  participants: string[];
  agents: NegotiationAgent[];
  objective: string;
  keyConstraint: string;
  estimatedDuration: string;
  expectedOutcome: string;
  defaultMaxRounds: number;
  numericScale?: ScenarioNumericScale;
}
