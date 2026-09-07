import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { AppLayout } from './components/AppLayout';
import { supabase } from './lib/supabase';

// Screens
import { WelcomeScreen } from './screens/WelcomeScreen';
import { LoginSignupScreen } from './screens/LoginSignupScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './screens/ResetPasswordScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { ScenarioSelectionScreen } from './screens/ScenarioSelectionScreen';
import { ModeSelectionScreen } from './screens/ModeSelectionScreen';
import { AgentConfigurationScreen } from './screens/AgentConfigurationScreen';
import { GoalsConstraintsScreen } from './screens/GoalsConstraintsScreen';
import { ReviewConfirmScreen } from './screens/ReviewConfirmScreen';
import { SimulationArenaScreen } from './screens/SimulationArenaScreen';
import { PracticeArenaScreen } from './screens/PracticeArenaScreen';
import { OutcomeReportScreen } from './screens/OutcomeReportScreen';
import { NegotiationHistoryScreen } from './screens/NegotiationHistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { HelpSupportScreen } from './screens/HelpSupportScreen';

// Error & Status Utility Screens
import { LoadingScreen } from './screens/LoadingScreen';
import { NoInternetScreen } from './screens/NoInternetScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { AccessDeniedScreen } from './screens/AccessDeniedScreen';

// Protected Route Wrapper with Setup Workflow Guards
const ProtectedRoute: React.FC<{ children: React.ReactNode; path: string; isAuthInitializing: boolean }> = ({
  children,
  path,
  isAuthInitializing,
}) => {
  const { user, selectedScenario, selectedMode, humanRole, configuredAgents } = useStore();

  // Show loading skeleton while checking Supabase auth session on page refresh
  if (isAuthInitializing) {
    return <LoadingScreen message="Restoring Session State..." />;
  }

  // 403 Forbidden Access Denied if not authenticated
  if (!user.isAuthenticated) {
    return <AccessDeniedScreen />;
  }

  // Workflow route guards to prevent bypassing setup screens
  if (path.startsWith('/setup/mode')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
  }

  if (path.startsWith('/setup/agents')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
    if (!selectedMode) {
      return <Navigate to="/setup/mode" replace />;
    }
  }

  if (path.startsWith('/setup/goals')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
    if (!selectedMode) {
      return <Navigate to="/setup/mode" replace />;
    }
    if (selectedMode === 'human-ai' && !humanRole) {
      return <Navigate to="/setup/agents" replace />;
    }

    const expectedCount = selectedScenario?.defaultAgents?.length || 2;
    const activeAgents = configuredAgents.slice(0, expectedCount);
    const isAgentsConfigured =
      activeAgents.length >= expectedCount &&
      activeAgents.every((agent, i) => {
        const isHuman =
          selectedMode === 'human-ai' &&
          ((humanRole === 'buyer' && i === 0) ||
            (humanRole === 'vendor' && i === 1) ||
            (humanRole === 'recruiter' && i === 0) ||
            (humanRole === 'candidate' && i === 1) ||
            (humanRole === 'department-head' && i === 0) ||
            (humanRole === 'project-manager' && i === 1) ||
            (humanRole === 'finance-director' && i === 2));
        if (selectedMode === 'human-ai' && isHuman) return true;
        if (!agent.name?.trim() || !agent.role?.trim()) return false;
        if (!agent.personality) return false;
        return true;
      });
    if (!isAgentsConfigured) {
      return <Navigate to="/setup/agents" replace />;
    }
  }

  if (path.startsWith('/setup/review')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
    if (!selectedMode) {
      return <Navigate to="/setup/mode" replace />;
    }
    if (selectedMode === 'human-ai' && !humanRole) {
      return <Navigate to="/setup/agents" replace />;
    }

    const expectedCount = selectedScenario?.defaultAgents?.length || 2;
    const activeAgents = configuredAgents.slice(0, expectedCount);
    if (activeAgents.length < expectedCount) {
      return <Navigate to="/setup/goals" replace />;
    }
  }

  if (path.startsWith('/arena/')) {
    if (!selectedScenario || !selectedMode) {
      return <Navigate to="/setup/scenario" replace />;
    }
  }

  return <AppLayout>{children}</AppLayout>;
};

export const App: React.FC = () => {
  const { login, logout } = useStore();
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Internet connection online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth Session Initialization & Sync (Backend + Supabase)
  useEffect(() => {
    let isMounted = true;

    // First check local auth storage
    const savedUserRaw = localStorage.getItem('auth_user');
    const savedToken = localStorage.getItem('auth_token');
    if (savedUserRaw && savedToken) {
      try {
        const savedUser = JSON.parse(savedUserRaw);
        if (savedUser.email) {
          login(savedUser.email);
          setIsAuthInitializing(false);
        }
      } catch (e) {
        console.warn('Failed to parse saved auth_user', e);
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        login(session.user.email || '');
      }
      setIsAuthInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        login(session.user.email || '');
      } else if (!localStorage.getItem('auth_token')) {
        logout();
      }
      setIsAuthInitializing(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [login, logout]);

  // Display No Internet Screen when device is offline
  if (isOffline) {
    return <NoInternetScreen onRetry={() => setIsOffline(!navigator.onLine)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/login" element={<LoginSignupScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
        <Route path="/reset-password" element={<ResetPasswordScreen />} />

        {/* Authenticated Application Sandbox Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute path="/dashboard" isAuthInitializing={isAuthInitializing}>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/scenario"
          element={
            <ProtectedRoute path="/setup/scenario" isAuthInitializing={isAuthInitializing}>
              <ScenarioSelectionScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/mode"
          element={
            <ProtectedRoute path="/setup/mode" isAuthInitializing={isAuthInitializing}>
              <ModeSelectionScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/agents"
          element={
            <ProtectedRoute path="/setup/agents" isAuthInitializing={isAuthInitializing}>
              <AgentConfigurationScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/goals"
          element={
            <ProtectedRoute path="/setup/goals" isAuthInitializing={isAuthInitializing}>
              <GoalsConstraintsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup/review"
          element={
            <ProtectedRoute path="/setup/review" isAuthInitializing={isAuthInitializing}>
              <ReviewConfirmScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arena/simulation"
          element={
            <ProtectedRoute path="/arena/simulation" isAuthInitializing={isAuthInitializing}>
              <SimulationArenaScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/arena/practice"
          element={
            <ProtectedRoute path="/arena/practice" isAuthInitializing={isAuthInitializing}>
              <PracticeArenaScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute path="/reports" isAuthInitializing={isAuthInitializing}>
              <OutcomeReportScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute path="/history" isAuthInitializing={isAuthInitializing}>
              <NegotiationHistoryScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute path="/settings" isAuthInitializing={isAuthInitializing}>
              <SettingsScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute path="/help" isAuthInitializing={isAuthInitializing}>
              <HelpSupportScreen />
            </ProtectedRoute>
          }
        />

        {/* 403 Forbidden Access Denied Explicit Route */}
        <Route path="/access-denied" element={<AccessDeniedScreen />} />

        {/* 404 Page Not Found Catch-All Route */}
        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
