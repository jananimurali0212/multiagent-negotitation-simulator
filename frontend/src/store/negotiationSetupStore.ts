import { create } from 'zustand';
import { NegotiationScenario } from '../types/scenario';
import { NegotiationMode, Personality, NegotiationAgent, Goal, Constraint } from '../types/negotiation';
import { OFFICIAL_SCENARIOS } from '../data/scenarios';

interface NegotiationSetupState {
  selectedScenario: NegotiationScenario | null;
  selectedMode: NegotiationMode;
  agents: NegotiationAgent[];
  personalities: Record<string, Personality>;
  maximumRounds: number;
  currentStep: number; // 1: Agents, 2: Goals & Constraints, 3: Review & Confirm
  isConfigValid: boolean;

  setScenario: (scenario: NegotiationScenario) => void;
  setScenarioById: (id: string) => void;
  setMode: (mode: NegotiationMode) => void;
  setPersonality: (agentId: string, personality: Personality) => void;
  setMaximumRounds: (rounds: number) => void;
  setStep: (step: number) => void;

  // Goals & Constraints customization actions
  addGoal: (agentId: string, goal: Goal) => void;
  removeGoal: (agentId: string, goalId: string) => void;
  addConstraint: (agentId: string, constraint: Constraint) => void;
  removeConstraint: (agentId: string, constraintId: string) => void;
  resetAgentGoalsAndConstraints: (agentId: string) => void;
  resetAllGoalsAndConstraints: () => void;

  resetSetup: () => void;
}

export const useNegotiationSetupStore = create<NegotiationSetupState>((set, get) => ({
  selectedScenario: OFFICIAL_SCENARIOS[0],
  selectedMode: 'simulation',
  agents: JSON.parse(JSON.stringify(OFFICIAL_SCENARIOS[0].agents)),
  personalities: OFFICIAL_SCENARIOS[0].agents.reduce((acc, a) => ({ ...acc, [a.id]: a.personality }), {}),
  maximumRounds: OFFICIAL_SCENARIOS[0].defaultMaxRounds,
  currentStep: 1,
  isConfigValid: true,

  setScenario: (scenario) => {
    const personalities = scenario.agents.reduce((acc, a) => ({ ...acc, [a.id]: a.personality }), {});
    set({
      selectedScenario: scenario,
      agents: JSON.parse(JSON.stringify(scenario.agents)),
      personalities,
      maximumRounds: scenario.defaultMaxRounds,
      currentStep: 1,
      isConfigValid: true,
    });
  },

  setScenarioById: (id) => {
    const scenario = OFFICIAL_SCENARIOS.find((s) => s.id === id) || OFFICIAL_SCENARIOS[0];
    get().setScenario(scenario);
  },

  setMode: (mode) => {
    set({ selectedMode: mode });
  },

  setPersonality: (agentId, personality) => {
    set((state) => {
      const updatedPersonalities = { ...state.personalities, [agentId]: personality };
      const updatedAgents = state.agents.map((a) =>
        a.id === agentId ? { ...a, personality } : a
      );
      return {
        personalities: updatedPersonalities,
        agents: updatedAgents,
      };
    });
  },

  setMaximumRounds: (rounds) => {
    set({ maximumRounds: Math.max(3, Math.min(25, rounds)) });
  },

  setStep: (step) => {
    set({ currentStep: step });
  },

  addGoal: (agentId, goal) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, goal: [...agent.goal, goal] }
          : agent
      ),
    }));
  },

  removeGoal: (agentId, goalId) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              goal: agent.goal.filter((g) => g.id !== goalId),
            }
          : agent
      ),
    }));
  },

  addConstraint: (agentId, constraint) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? { ...agent, constraints: [...agent.constraints, constraint] }
          : agent
      ),
    }));
  },

  removeConstraint: (agentId, constraintId) => {
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              constraints: agent.constraints.filter((c) => c.id !== constraintId),
            }
          : agent
      ),
    }));
  },

  resetAgentGoalsAndConstraints: (agentId) => {
    const scenario = get().selectedScenario;
    if (!scenario) return;
    const originalAgent = scenario.agents.find((a) => a.id === agentId);
    if (!originalAgent) return;

    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId
          ? {
              ...agent,
              goal: JSON.parse(JSON.stringify(originalAgent.goal)),
              constraints: JSON.parse(JSON.stringify(originalAgent.constraints)),
            }
          : agent
      ),
    }));
  },

  resetAllGoalsAndConstraints: () => {
    const scenario = get().selectedScenario;
    if (!scenario) return;

    set((state) => ({
      agents: state.agents.map((agent) => {
        const originalAgent = scenario.agents.find((a) => a.id === agent.id);
        if (!originalAgent) return agent;
        return {
          ...agent,
          goal: JSON.parse(JSON.stringify(originalAgent.goal)),
          constraints: JSON.parse(JSON.stringify(originalAgent.constraints)),
        };
      }),
    }));
  },

  resetSetup: () => {
    const defaultScenario = OFFICIAL_SCENARIOS[0];
    const personalities = defaultScenario.agents.reduce((acc, a) => ({ ...acc, [a.id]: a.personality }), {});
    set({
      selectedScenario: defaultScenario,
      selectedMode: 'simulation',
      agents: JSON.parse(JSON.stringify(defaultScenario.agents)),
      personalities,
      maximumRounds: defaultScenario.defaultMaxRounds,
      currentStep: 1,
      isConfigValid: true,
    });
  }
}));
