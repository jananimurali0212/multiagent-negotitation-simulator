import React from 'react';
import { NegotiationScenario } from '../../types/scenario';
import { ScenarioCard } from './ScenarioCard';

interface ScenarioGridProps {
  scenarios: NegotiationScenario[];
  selectedScenarioId?: string;
  onSelectScenario: (scenario: NegotiationScenario) => void;
}

export function ScenarioGrid({ scenarios, selectedScenarioId, onSelectScenario }: ScenarioGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {scenarios.map((scenario) => (
        <ScenarioCard
          key={scenario.id}
          scenario={scenario}
          isSelected={scenario.id === selectedScenarioId}
          onSelect={onSelectScenario}
        />
      ))}
    </div>
  );
}
