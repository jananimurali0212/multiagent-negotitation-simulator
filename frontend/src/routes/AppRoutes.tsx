import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { WelcomePage } from '../pages/WelcomePage';
import { AuthPage } from '../pages/AuthPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ScenarioSelectionPage } from '../pages/ScenarioSelectionPage';
import { ModeSelectionPage } from '../pages/ModeSelectionPage';
import { AgentConfigurationPage } from '../pages/AgentConfigurationPage';
import { GoalsConstraintsPage } from '../pages/GoalsConstraintsPage';
import { ReviewConfirmPage } from '../pages/ReviewConfirmPage';
import { SimulationArenaPage } from '../pages/SimulationArenaPage';
import { PracticeArenaPage } from '../pages/PracticeArenaPage';
import { OutcomeReportPage } from '../pages/OutcomeReportPage';
import { ReportsAnalyticsPage } from '../pages/ReportsAnalyticsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { HelpSupportPage } from '../pages/HelpSupportPage';
import { MyNegotiationsPage } from '../pages/MyNegotiationsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/login" element={<AuthPage />} />

      {/* Authenticated Workspace & Negotiation Flow */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/scenarios" element={<ScenarioSelectionPage />} />
        <Route path="/my-negotiations" element={<MyNegotiationsPage />} />
        <Route path="/reports" element={<ReportsAnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpSupportPage />} />

        {/* Wizard Setup Flow */}
        <Route path="/new-negotiation/scenario" element={<ScenarioSelectionPage />} />
        <Route path="/new-negotiation/mode" element={<ModeSelectionPage />} />
        <Route path="/new-negotiation/agents" element={<AgentConfigurationPage />} />
        <Route path="/new-negotiation/goals-constraints" element={<GoalsConstraintsPage />} />
        <Route path="/new-negotiation/review" element={<ReviewConfirmPage />} />

        {/* Real-Time Arenas */}
        <Route path="/negotiation/simulation/:sessionId" element={<SimulationArenaPage />} />
        <Route path="/negotiation/practice/:sessionId" element={<PracticeArenaPage />} />
        <Route path="/negotiation/:sessionId/report" element={<OutcomeReportPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
