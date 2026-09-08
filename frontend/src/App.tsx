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
import { SimulationArenaScreen } from './screens/SimulationArenaScreen';
import { PracticeArenaScreen } from './screens/PracticeArenaScreen';
import { OutcomeReportScreen } from './screens/OutcomeReportScreen';
import { ScenarioDataFormScreen } from './screens/ScenarioDataFormScreen';
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

  // Workflow route guards to enforce streamlined 4-stage pipeline
  if (path.startsWith('/setup/mode')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
  }

  if (path.startsWith('/setup/scenario-data')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
    if (!selectedMode) {
      return <Navigate to="/setup/mode" replace />;
    }
  }

  if (path.startsWith('/arena/')) {
    if (!selectedScenario) {
      return <Navigate to="/setup/scenario" replace />;
    }
    if (!selectedMode) {
      return <Navigate to="/setup/mode" replace />;
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

  // Supabase Auth Session Initialization & Sync
  useEffect(() => {
    let isMounted = true;

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
      } else {
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
          path="/setup/scenario-data"
          element={
            <ProtectedRoute path="/setup/scenario-data" isAuthInitializing={isAuthInitializing}>
              <ScenarioDataFormScreen />
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
