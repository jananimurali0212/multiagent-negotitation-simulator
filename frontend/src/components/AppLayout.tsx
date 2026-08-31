import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Logo } from './Logo';
import { ProgressStepper } from './ProgressStepper';
import { LoadingScreen } from '../screens/LoadingScreen';
import { 
  User, 
  Settings as SettingsIcon, 
  HelpCircle, 
  LogOut,
  Home,
  LayoutGrid,
  Sliders,
  Activity,
  BarChart3,
  ChevronDown,
  X,
  MessageSquare
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const store = useStore();
  const {
    user,
    logout,
    selectedScenario,
    configuredAgents,
    selectedMode,
    reviewConfirmed,
    guardModal,
    setGuardModal,
    getFirstIncompleteStepId,
    reports,
    canAccessStep,
    getRouteForStepId,
    getStepIdForPath
  } = store;
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Helper for dynamic user initials
  const getUserInitials = () => {
    if ('name' in user && user.name) {
      const parts = (user.name as string).split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user.email) return user.email.slice(0, 2).toUpperCase();
    return 'US';
  };

  // Helper for dynamic user display name
  const getUserDisplayName = () => {
    if ('name' in user && user.name) return user.name as string;
    if ('displayName' in user && user.displayName) return user.displayName as string;
    return 'User';
  };

  // Stage flags for visual navbar journey indicators
  const isHomeActive = location.pathname === '/dashboard';
  const isScenariosActive = location.pathname === '/setup/scenario';
  const isSetupActive = location.pathname === '/setup/agents' || location.pathname === '/setup/goals' || location.pathname === '/setup/review';
  const isNegotiationActive = location.pathname.startsWith('/arena');
  const isHistoryActive = location.pathname.startsWith('/history');
  const isReportsActive = location.pathname.startsWith('/reports');
  const isSettingsActive = location.pathname.startsWith('/settings');
  const isHelpActive = location.pathname.startsWith('/help');

  const isWorkspaceScreen = 
    location.pathname.startsWith('/setup/') || 
    location.pathname.startsWith('/arena/') || 
    location.pathname.startsWith('/history') ||
    location.pathname.startsWith('/reports') || 
    location.pathname.startsWith('/settings') || 
    location.pathname.startsWith('/help');

  const getGuardModalContent = (firstIncompleteId: string) => {
    switch (firstIncompleteId) {
      case 'SCENARIO':
        return {
          title: 'Scenario Required First',
          message: 'You must select a negotiation scenario (Vendor Pricing, Job Offer, or Budget Allocation) before configuring agents or entering the negotiation arena.',
          actionText: 'Select Scenario Now',
          actionRoute: '/setup/scenario'
        };
      case 'MODE':
        return {
          title: 'Select Negotiation Mode',
          message: 'Please select your preferred negotiation mode (AI vs AI Simulation or Human vs AI Practice) before configuring agents.',
          actionText: 'Choose Mode Now',
          actionRoute: '/setup/mode'
        };
      case 'AGENTS':
        return {
          title: 'Configure Agents Required',
          message: 'Please complete all required agent details (name, role, and personality) before accessing negotiation screens.',
          actionText: 'Configure Agents',
          actionRoute: '/setup/agents'
        };
      case 'GOALS':
        return {
          title: 'Define Goals & Constraints',
          message: 'Set up your primary negotiation goals and key constraints before reviewing setup.',
          actionText: 'Set Goals & Constraints',
          actionRoute: '/setup/goals'
        };
      case 'REVIEW':
        return {
          title: 'Review Setup Required',
          message: 'Please review and confirm your negotiation parameters before entering the arena.',
          actionText: 'Review & Confirm',
          actionRoute: '/setup/review'
        };
      default:
        return {
          title: 'Setup Order Required',
          message: 'Please complete the setup flow in order before proceeding.',
          actionText: 'Start Setup Flow',
          actionRoute: '/setup/scenario'
        };
    }
  };

  const handleProtectedNavigation = (destination: string) => {
    if (destination === '/dashboard' || destination === '/setup/scenario' || destination.startsWith('/reports')) {
      navigate(destination);
      return;
    }
    
    const stepId = getStepIdForPath(destination);
    
    if (stepId === 'OUTCOME') {
      navigate(destination);
      return;
    }

    if (stepId === 'AGENTS') {
      const firstIncompleteId = getFirstIncompleteStepId();
      if (firstIncompleteId === 'SCENARIO') {
        const modalContent = getGuardModalContent(firstIncompleteId);
        setGuardModal({
          isOpen: true,
          ...modalContent
        });
      } else {
        const nextRoute = firstIncompleteId === 'NEGOTIATION' ? '/setup/review' : getRouteForStepId(firstIncompleteId);
        navigate(nextRoute);
      }
      return;
    }

    if (stepId && !canAccessStep(stepId)) {
      const firstIncompleteId = getFirstIncompleteStepId();
      const modalContent = getGuardModalContent(firstIncompleteId);
      setGuardModal({
        isOpen: true,
        ...modalContent
      });
      return;
    }

    if (destination === '/arena') {
      const nextRoute = selectedMode === 'human-ai' ? '/arena/practice' : '/arena/simulation';
      navigate(nextRoute);
    } else {
      navigate(destination);
    }
  };

  // Route Guard to prevent skipping steps
  React.useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/reports') || path === '/dashboard') {
      return;
    }
    const stepId = getStepIdForPath(path);
    
    if (stepId && !canAccessStep(stepId)) {
      const firstIncompleteId = getFirstIncompleteStepId();
      const redirectRoute = getRouteForStepId(firstIncompleteId);
      
      // Navigate to the first incomplete step
      navigate(redirectRoute, { replace: true });
      
      const modalContent = getGuardModalContent(firstIncompleteId);
      
      setGuardModal({
        isOpen: true,
        ...modalContent
      });
    }
  }, [
    location.pathname, 
    selectedScenario, 
    selectedMode, 
    configuredAgents, 
    reviewConfirmed, 
    reports, 
    navigate, 
    getFirstIncompleteStepId, 
    setGuardModal, 
    canAccessStep, 
    getRouteForStepId, 
    getStepIdForPath
  ]);

  const renderWorkflowGuardModal = () => {
    if (!guardModal.isOpen) return null;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/40 backdrop-blur-md">
        <div 
          className="relative w-full max-w-md rounded-[24px] border p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200"
          style={{
            background: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.15)',
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setGuardModal({ isOpen: false })}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-xs">
            <HelpCircle size={26} className="animate-bounce" />
          </div>

          {/* Text content */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-[#1E2230]" style={{ color: '#0F172A' }}>
              {guardModal.title}
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {guardModal.message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => {
                setGuardModal({ isOpen: false });
                handleProtectedNavigation(guardModal.actionRoute);
              }}
              className="flex-1 px-5 py-3 rounded-full text-xs font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-blue-500/10 cursor-pointer border-none"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #3678E5)',
              }}
            >
              {guardModal.actionText}
            </button>
            
            <button
              onClick={() => setGuardModal({ isOpen: false })}
              className="flex-1 px-5 py-3 rounded-full text-xs font-bold transition-all hover:bg-slate-100 border border-slate-200 cursor-pointer text-[#0F172A] bg-transparent"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isReloading) {
    return <LoadingScreen message="Refreshing current page..." />;
  }

  return (
    <div className="min-h-screen text-navyblack flex flex-col font-sans" style={{ background: 'linear-gradient(135deg, #EEF1F8 0%, #EEF1F8 55%, #F4F6FB 100%)' }}>
      
      {/* Floating Pill Top Nav */}
      <div className="sticky top-0 z-50 w-full flex items-center justify-center pt-4 pb-0 pointer-events-none">
        <div className={`w-full flex justify-center ${isWorkspaceScreen ? 'workspace-container' : 'px-4 md:px-5'}`}>
          <nav className={`pointer-events-auto w-full px-6 h-[68px] backdrop-blur-xl rounded-full flex items-center justify-between transition-all duration-350 select-none ${
            isWorkspaceScreen ? 'max-w-full' : 'max-w-6xl'
          }`} style={{ backgroundColor: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: '0 8px 30px rgba(30,34,48,0.06)' }}>
            
            {/* Logo & Platform Name */}
            <button
              type="button"
              onClick={() => {
                setIsReloading(true);
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }}
              className="flex items-center gap-2.5 hover:opacity-95 transition-opacity shrink-0 border-none bg-transparent cursor-pointer text-left p-0"
              title="Refresh Current Page"
            >
              <div className="bg-white p-1 rounded-full flex items-center justify-center shadow-xs border border-gray-100">
                <Logo variant="icon-only" size={28} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold tracking-wider uppercase leading-none text-primary">
                  AI-DRIVEN MULTI-AGENT
                </span>
                <span className="text-[8px] font-semibold uppercase tracking-wider mt-0.5 leading-none text-secondary">
                  NEGOTIATION TRAINING PLATFORM
                </span>
              </div>
            </button>

            {/* Core Journey Stages */}
            <div className="flex items-center gap-1 md:gap-2 text-[13px] font-medium uppercase tracking-wider">
              <button
                onClick={() => handleProtectedNavigation('/dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
                  isHomeActive 
                    ? 'bg-accent/10 text-accent shadow-xs font-semibold' 
                    : 'text-slategray hover:text-primary hover:bg-gray-150/40'
                }`}
              >
                <Home size={18} className={isHomeActive ? 'text-accent' : 'text-slategray'} />
                <span>Home</span>
              </button>
              <button
                onClick={() => handleProtectedNavigation('/setup/scenario')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
                  isScenariosActive 
                    ? 'bg-accent/10 text-accent shadow-xs font-semibold' 
                    : 'text-slategray hover:text-primary hover:bg-gray-150/40'
                }`}
              >
                <LayoutGrid size={18} className={isScenariosActive ? 'text-accent' : 'text-slategray'} />
                <span>Scenarios</span>
              </button>
              <button
                onClick={() => handleProtectedNavigation('/setup/agents')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
                  isSetupActive 
                    ? 'bg-accent/10 text-accent shadow-xs font-semibold' 
                    : 'text-slategray hover:text-primary hover:bg-gray-150/40'
                }`}
              >
                <Sliders size={18} className={isSetupActive ? 'text-accent' : 'text-slategray'} />
                <span>Setup</span>
              </button>
              <button
                onClick={() => handleProtectedNavigation('/arena')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
                  isNegotiationActive 
                    ? 'bg-accent/10 text-accent shadow-xs font-semibold' 
                    : 'text-slategray hover:text-primary hover:bg-gray-150/40'
                }`}
              >
                <Activity size={18} className={isNegotiationActive ? 'text-accent' : 'text-slategray'} />
                <span>Negotiation</span>
              </button>
              <button
                onClick={() => navigate('/history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
                  isHistoryActive 
                    ? 'bg-accent/10 text-accent shadow-xs font-semibold' 
                    : 'text-slategray hover:text-primary hover:bg-gray-150/40'
                }`}
              >
                <MessageSquare size={18} className={isHistoryActive ? 'text-accent' : 'text-slategray'} />
                <span>History</span>
              </button>
              <button
                onClick={() => handleProtectedNavigation('/reports')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer border-none bg-transparent ${
                  isReportsActive 
                    ? 'bg-accent/10 text-accent shadow-xs font-semibold' 
                    : 'text-slategray hover:text-primary hover:bg-gray-150/40'
                }`}
              >
                <BarChart3 size={18} className={isReportsActive ? 'text-accent' : 'text-slategray'} />
                <span>Reports</span>
              </button>
            </div>

            {/* Profile Menu Popover */}
            <div className="relative shrink-0">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-0.5 pr-2 rounded-full hover:bg-gray-100/80 transition-colors border border-gray-200/80 cursor-pointer h-11"
              >
                <div className="w-10 h-10 rounded-full bg-primary-dark text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {getUserInitials()}
                </div>
                <ChevronDown size={14} className="text-slategray" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setProfileDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-52 bg-white/95 border border-gray-200/85 rounded-2xl shadow-xl py-2 z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100 mb-1">
                      <p className="text-[8px] font-bold text-slategray uppercase tracking-wider">Active User</p>
                      <p className="text-xs font-bold text-primary truncate mt-0.5" title={user.email || 'user@example.com'}>
                        {getUserDisplayName()}
                      </p>
                    </div>
                    
                    <Link 
                      to="/history" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-warmpearl transition-colors font-semibold ${
                        isHistoryActive ? 'text-accent' : ''
                      }`}
                    >
                      <MessageSquare size={13} className="text-slategray" />
                      Negotiation History
                    </Link>

                    <Link 
                      to="/settings" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-warmpearl transition-colors font-semibold ${
                        isSettingsActive ? 'text-accent' : ''
                      }`}
                    >
                      <User size={13} className="text-slategray" />
                      Profile
                    </Link>

                    <Link 
                      to="/settings" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-warmpearl transition-colors font-semibold ${
                        isSettingsActive ? 'text-accent' : ''
                      }`}
                    >
                      <SettingsIcon size={13} className="text-slategray" />
                      Account Settings
                    </Link>

                    <Link 
                      to="/settings" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-warmpearl transition-colors font-semibold ${
                        isSettingsActive ? 'text-accent' : ''
                      }`}
                    >
                      <Sliders size={13} className="text-slategray" />
                      Preferences
                    </Link>

                    <Link 
                      to="/help" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className={`flex items-center gap-2.5 px-4 py-2 text-xs text-primary hover:bg-warmpearl transition-colors font-semibold ${
                        isHelpActive ? 'text-accent' : ''
                      }`}
                    >
                      <HelpCircle size={13} className="text-slategray" />
                      Help
                    </Link>

                    <button 
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50/50 transition-colors border-t border-gray-100 mt-1.5 font-bold cursor-pointer bg-transparent border-none"
                    >
                      <LogOut size={13} />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Reusable Fixed/Sticky Progress Stepper & Content */}
      {isWorkspaceScreen ? (
        <div className="workspace-container flex-grow flex flex-col justify-start w-full pt-[18px]">
          <ProgressStepper />
          <main className="flex-grow flex flex-col justify-start w-full pb-8">
            {children}
          </main>
        </div>
      ) : (
        <>
          <ProgressStepper />
          <main className="flex-grow p-4 md:p-6 mx-auto flex flex-col justify-start w-[94vw] max-w-[1600px]">
            {children}
          </main>
        </>
      )}
      {renderWorkflowGuardModal()}
    </div>
  );
};

export default AppLayout;
