import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNegotiationSetupStore } from '../store/negotiationSetupStore';
import { scenarioService } from '../services/scenarioService';
import { NegotiationScenario } from '../types/scenario';
import { PageHeader } from '../components/common/PageHeader';
import { ScenarioGrid } from '../components/scenarios/ScenarioGrid';
import { Skeleton } from '../components/common/LoadingSkeleton';
import { Button } from '../components/common/Button';
import { Layers, ArrowRight, ShieldCheck } from 'lucide-react';

export function ScenarioSelectionPage() {
  const navigate = useNavigate();
  const { selectedScenario, setScenario } = useNegotiationSetupStore();
  const [scenarios, setScenarios] = useState<NegotiationScenario[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadScenarios() {
      try {
        const list = await scenarioService.getScenarios();
        setScenarios(list);
        if (!selectedScenario && list.length > 0) {
          setScenario(list[0]);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadScenarios();
  }, []);

  const handleSelectScenario = (scenario: NegotiationScenario) => {
    setScenario(scenario);
    navigate('/new-negotiation/mode');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Select Negotiation Scenario"
        description="Choose one of the official multi-stakeholder negotiation scenarios to configure autonomous personas and parameters."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'New Negotiation' },
          { label: 'Scenario Catalog' },
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <>
          <ScenarioGrid
            scenarios={scenarios}
            selectedScenarioId={selectedScenario?.id}
            onSelectScenario={handleSelectScenario}
          />

          {/* Bottom Confirmation Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mt-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Currently Selected Scenario:</span>
                <p className="text-sm font-bold text-slate-900">
                  {selectedScenario?.name || 'Please pick a scenario above'}
                </p>
              </div>
            </div>

            <Button
              size="md"
              disabled={!selectedScenario}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => navigate('/new-negotiation/mode')}
            >
              Continue to Mode Selection
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
