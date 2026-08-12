import { NegotiationScenario } from '../types/scenario';
import { OFFICIAL_SCENARIOS } from '../data/scenarios';
import { mockFetch } from './apiAdapter';

export const scenarioService = {
  async getScenarios(): Promise<NegotiationScenario[]> {
    return mockFetch<NegotiationScenario[]>(OFFICIAL_SCENARIOS, 200);
  },

  async getScenarioById(id: string): Promise<NegotiationScenario | null> {
    const scenario = OFFICIAL_SCENARIOS.find((s) => s.id === id) || null;
    return mockFetch<NegotiationScenario | null>(scenario, 150);
  }
};
